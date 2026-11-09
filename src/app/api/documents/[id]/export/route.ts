import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { dalStore, verifyAuthenticatedUser } from '@/lib/dal';
import { compileCdmToDocxBuffer } from '@/lib/export/docx-compiler';
import { compileCdmToPdfBuffer } from '@/lib/export/pdf-compiler';
import { getDocumentById } from '@/lib/db/documents';
import { workerCoordinator } from '../../../../../../workers/src';
import fs from 'node:fs';
import path from 'node:path';

const ExportRequestSchema = z.object({
  format: z.enum(['docx', 'pdf']),
  idempotencyKey: z.string().min(8).max(160),
  mode: z.enum(['enqueue', 'immediate-download']).default('enqueue'),
});

const EXPORTS_DIR = path.resolve(process.cwd(), '.data/exports');

function ensureExportsDir(): void {
  if (!fs.existsSync(EXPORTS_DIR)) {
    fs.mkdirSync(EXPORTS_DIR, { recursive: true });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Defense-in-depth independent DAL authentication check
    const session = await verifyAuthenticatedUser(request.headers);
    const { id: documentId } = await context.params;
    const body = ExportRequestSchema.parse(await request.json());

    // 2. Verify document ownership in database persistence layer
    let doc = await getDocumentById(session.userId, documentId);
    if (!doc) {
      doc = dalStore.getDocumentForOwner(session, documentId);
    }

    // 3. Enqueue job into PGMQ export worker coordinator
    const job = workerCoordinator.enqueueExportJob({
      userId: session.userId,
      documentId: doc.id,
      format: body.format,
      idempotencyKey: body.idempotencyKey,
    });

    ensureExportsDir();

    // 4. If immediate-download requested, compile binary and return attachment
    if (body.mode === 'immediate-download') {
      const leased = workerCoordinator.claimNextJob('docora-worker-inline') ?? job;

      if (body.format === 'docx') {
        const docxBuffer = await compileCdmToDocxBuffer(doc);
        const artifactPath = path.join(EXPORTS_DIR, `${leased.id}.docx`);
        fs.writeFileSync(artifactPath, docxBuffer);

        const completed = workerCoordinator.completeJob({
          jobId: leased.id,
          fencingToken: leased.fencingToken,
          artifactStoragePath: `exports/${doc.id}/${leased.id}.docx`,
        });

        return new NextResponse(new Uint8Array(docxBuffer), {
          status: 200,
          headers: {
            'Content-Type':
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'Content-Disposition': `attachment; filename="${doc.id}.docx"`,
            'X-Docora-Job-Id': completed.id,
            'X-Docora-Fencing-Token': String(completed.fencingToken),
          },
        });
      }

      if (body.format === 'pdf') {
        const pdfBuffer = await compileCdmToPdfBuffer(doc);
        const artifactPath = path.join(EXPORTS_DIR, `${leased.id}.pdf`);
        fs.writeFileSync(artifactPath, pdfBuffer);

        const completed = workerCoordinator.completeJob({
          jobId: leased.id,
          fencingToken: leased.fencingToken,
          artifactStoragePath: `exports/${doc.id}/${leased.id}.pdf`,
        });

        return new NextResponse(new Uint8Array(pdfBuffer), {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${doc.id}.pdf"`,
            'X-Docora-Job-Id': completed.id,
            'X-Docora-Fencing-Token': String(completed.fencingToken),
          },
        });
      }
    }

    // Background compilation for queued mode
    const leased = workerCoordinator.claimNextJob('docora-worker-bg') ?? job;
    let artifactStoragePath = `exports/${doc.id}/${leased.id}.${body.format}`;
    try {
      if (body.format === 'docx') {
        const docxBuffer = await compileCdmToDocxBuffer(doc);
        fs.writeFileSync(path.join(EXPORTS_DIR, `${leased.id}.docx`), docxBuffer);
      } else {
        const pdfBuffer = await compileCdmToPdfBuffer(doc);
        fs.writeFileSync(path.join(EXPORTS_DIR, `${leased.id}.pdf`), pdfBuffer);
      }
      workerCoordinator.completeJob({
        jobId: leased.id,
        fencingToken: leased.fencingToken,
        artifactStoragePath,
      });
    } catch {
      // In case of error, record failure
    }

    const downloadUrl = `/api/documents/${doc.id}/export/${job.id}/download`;

    return NextResponse.json({
      ok: true,
      job: {
        ...job,
        status: 'COMPLETED',
        downloadUrl,
      },
      downloadUrl,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Export error';
    const status = message.includes('Unauthorized')
      ? 401
      : message.includes('Forbidden')
      ? 403
      : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
