import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { dalStore, verifyAuthenticatedUser } from '@/lib/dal';
import { compileCdmToDocxBuffer } from '@/lib/export/docx-compiler';
import {
  buildVectorPdfOptions,
  renderCdmToPrintableHtml,
} from '@/lib/export/pdf-renderer';
import { workerCoordinator } from '../../../../../../workers/src';

const ExportRequestSchema = z.object({
  format: z.enum(['docx', 'pdf']),
  idempotencyKey: z.string().min(8).max(160),
  mode: z.enum(['enqueue', 'immediate-download']).default('enqueue'),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Defense-in-depth independent DAL authentication check
    const session = await verifyAuthenticatedUser(request.headers);
    const { id: documentId } = await context.params;
    const body = ExportRequestSchema.parse(await request.json());

    // 2. Verify document ownership in DAL
    const doc = dalStore.getDocumentForOwner(session, documentId);

    // 3. Enqueue job into isolated PGMQ worker coordinator with fencing token & lease support
    const job = workerCoordinator.enqueueExportJob({
      userId: session.userId,
      documentId: doc.id,
      format: body.format,
      idempotencyKey: body.idempotencyKey,
    });

    if (body.mode === 'immediate-download' && body.format === 'docx') {
      const leased = workerCoordinator.claimNextJob('docora-worker-node-1') ?? job;
      const docxBuffer = await compileCdmToDocxBuffer(doc);
      const completed = workerCoordinator.completeJob({
        jobId: leased.id,
        fencingToken: leased.fencingToken,
        artifactStoragePath: `exports/${doc.id}/v-fenced-${leased.fencingToken}.docx`,
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

    const pdfOptions = body.format === 'pdf' ? buildVectorPdfOptions(doc) : undefined;
    const printableHtmlPreview =
      body.format === 'pdf' ? renderCdmToPrintableHtml(doc) : undefined;

    return NextResponse.json({
      ok: true,
      job,
      pdfOptions,
      hasPrintableHtml: Boolean(printableHtmlPreview),
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
