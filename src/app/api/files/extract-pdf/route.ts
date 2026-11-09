import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyAuthenticatedUser } from '@/lib/dal';
import {
  classifyAndExtractDigitalPdfText,
  extractTextFromPdfBinaryBuffer,
} from '@/lib/ingest/file-pipeline';

const JsonExtractPdfRequestSchema = z.object({
  fileName: z.string().min(1),
  pageTexts: z.array(z.string()).min(1),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Defense-in-depth independent DAL authentication check
    await verifyAuthenticatedUser(request.headers);

    const contentType = request.headers.get('content-type') || '';

    // 2. Binary multipart/form-data PDF file upload
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file');

      if (!file || typeof file === 'string' || !(file instanceof Blob)) {
        return NextResponse.json(
          { ok: false, error: 'No file provided in multipart payload' },
          { status: 400 }
        );
      }

      const fileName = file.name || 'document.pdf';
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (buffer.byteLength > 25 * 1024 * 1024) {
        return NextResponse.json(
          { ok: false, error: 'File size exceeds maximum permitted limit of 25 MB' },
          { status: 400 }
        );
      }

      // Parse binary buffer on server
      const { pageTexts, pageCount } = extractTextFromPdfBinaryBuffer(buffer);
      const extraction = classifyAndExtractDigitalPdfText({ pageTexts });

      return NextResponse.json({
        ok: true,
        fileName,
        fileSizeBytes: buffer.byteLength,
        pageCount,
        extraction,
      });
    }

    // 3. JSON payload handling (backwards compatibility with unit tests)
    const body = JsonExtractPdfRequestSchema.parse(await request.json());
    const extraction = classifyAndExtractDigitalPdfText({
      pageTexts: body.pageTexts,
    });

    return NextResponse.json({
      ok: true,
      fileName: body.fileName,
      extraction,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'PDF extraction failed';
    const status = message.includes('Unauthorized') ? 401 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
