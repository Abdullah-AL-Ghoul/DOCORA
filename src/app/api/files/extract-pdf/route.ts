import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyAuthenticatedUser } from '@/lib/dal';
import { classifyAndExtractDigitalPdfText } from '@/lib/ingest/file-pipeline';

const ExtractPdfRequestSchema = z.object({
  fileName: z.string().min(1),
  pageTexts: z.array(z.string()).min(1),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Defense-in-depth independent DAL authentication check
    await verifyAuthenticatedUser(request.headers);
    const body = ExtractPdfRequestSchema.parse(await request.json());

    // 2. Digital PDF extraction (Phase 01) vs Scanned PDF deferral notice (Phase 03)
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
