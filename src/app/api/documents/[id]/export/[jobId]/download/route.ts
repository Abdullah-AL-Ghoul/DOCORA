import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthenticatedUser, dalStore } from '@/lib/dal';
import { getDocumentById } from '@/lib/db/documents';
import fs from 'node:fs';
import path from 'node:path';

const EXPORTS_DIR = path.resolve(process.cwd(), '.data/exports');

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string; jobId: string }> }
) {
  try {
    const session = await verifyAuthenticatedUser(request.headers);
    const { id: documentId, jobId } = await context.params;

    // Verify document ownership
    let doc = await getDocumentById(session.userId, documentId);
    if (!doc) {
      doc = dalStore.getDocumentForOwner(session, documentId);
    }

    // Check for exported artifact on disk
    const docxPath = path.join(EXPORTS_DIR, `${jobId}.docx`);
    const pdfPath = path.join(EXPORTS_DIR, `${jobId}.pdf`);

    if (fs.existsSync(docxPath)) {
      const buffer = fs.readFileSync(docxPath);
      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${doc.id}.docx"`,
        },
      });
    }

    if (fs.existsSync(pdfPath)) {
      const buffer = fs.readFileSync(pdfPath);
      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${doc.id}.pdf"`,
        },
      });
    }

    return NextResponse.json(
      { ok: false, error: 'Export artifact not found or still processing' },
      { status: 404 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Download failed';
    const status = message.includes('Unauthorized')
      ? 401
      : message.includes('Forbidden')
      ? 403
      : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
