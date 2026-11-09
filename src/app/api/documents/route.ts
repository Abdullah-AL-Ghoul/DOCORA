import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyAuthenticatedUser } from '@/lib/dal';
import { listDocumentsForUser, saveDocument } from '@/lib/db/documents';
import { CdmDocument } from '@/lib/cdm/schema';

const CreateDocumentSchema = z.object({
  title: z.string().min(1).max(240).default('مستند جديد'),
  locale: z.enum(['ar', 'en']).default('ar'),
  direction: z.enum(['rtl', 'ltr', 'auto']).default('rtl'),
  category: z.enum(['general', 'legal', 'executive', 'financial', 'technical']).default('general'),
  templateKey: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await verifyAuthenticatedUser(request.headers);
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category') || undefined;
    const includeTrashed = searchParams.get('trashed') === 'true';

    const documents = await listDocumentsForUser(session.userId, {
      category,
      includeTrashed,
    });

    return NextResponse.json({
      ok: true,
      documents,
      count: documents.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve documents';
    const status = message.includes('Unauthorized') ? 401 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await verifyAuthenticatedUser(request.headers);
    const body = CreateDocumentSchema.parse(await request.json().catch(() => ({})));

    const docId = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const isAr = body.locale === 'ar';

    const newDoc: CdmDocument = {
      cdmVersion: '1.2.0',
      id: docId,
      title: body.title,
      locale: body.locale,
      defaultDirection: body.direction === 'auto' ? (isAr ? 'rtl' : 'ltr') : body.direction,
      category: body.category,
      requiresLegalDisclaimer: body.category === 'legal',
      pageSetup: {
        paperSize: 'A4',
        marginTopMm: 20,
        marginBottomMm: 20,
        marginStartMm: 22,
        marginEndMm: 22,
      },
      blocks: [
        {
          id: `h-1-${docId}`,
          type: 'heading',
          level: 1,
          direction: body.direction === 'auto' ? (isAr ? 'rtl' : 'ltr') : body.direction,
          keepWithNext: true,
          text: body.title,
        },
        {
          id: `p-1-${docId}`,
          type: 'paragraph',
          direction: body.direction === 'auto' ? (isAr ? 'rtl' : 'ltr') : body.direction,
          align: 'start',
          runs: [
            {
              text: isAr
                ? 'ابدأ بكتابة نص المستند هنا، أو استخدم المساعد الذكي لتوليد الأفكار والصياغة...'
                : 'Start drafting your document here, or use the intelligent assistant to generate structured copy...',
              marks: [],
            },
          ],
        },
      ],
      generationState: {
        status: 'COMPLETE',
        completedBlockCount: 2,
      },
    };

    const saved = await saveDocument(session.userId, newDoc);

    return NextResponse.json({
      ok: true,
      document: saved,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create document';
    const status = message.includes('Unauthorized') ? 401 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
