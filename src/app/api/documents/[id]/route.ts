import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthenticatedUser } from '@/lib/dal';
import { deleteDocument, getDocumentById, saveDocument } from '@/lib/db/documents';
import { CdmDocument } from '@/lib/cdm/schema';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifyAuthenticatedUser(request.headers);
    const { id: documentId } = await context.params;

    const doc = await getDocumentById(session.userId, documentId);
    if (!doc) {
      return NextResponse.json(
        { ok: false, error: `Document ${documentId} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      document: doc,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error fetching document';
    const status = message.includes('Unauthorized')
      ? 401
      : message.includes('Forbidden')
      ? 403
      : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifyAuthenticatedUser(request.headers);
    const { id: documentId } = await context.params;
    const body = (await request.json()) as { document: CdmDocument };

    if (!body.document || body.document.id !== documentId) {
      return NextResponse.json(
        { ok: false, error: 'Document payload id mismatch or missing' },
        { status: 400 }
      );
    }

    const saved = await saveDocument(session.userId, body.document);

    return NextResponse.json({
      ok: true,
      document: saved,
      savedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error saving document';
    const status = message.includes('Unauthorized')
      ? 401
      : message.includes('Forbidden')
      ? 403
      : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifyAuthenticatedUser(request.headers);
    const { id: documentId } = await context.params;

    const deleted = await deleteDocument(session.userId, documentId);
    if (!deleted) {
      return NextResponse.json(
        { ok: false, error: `Document ${documentId} not found or could not be deleted` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: 'Document moved to trash successfully',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error deleting document';
    const status = message.includes('Unauthorized')
      ? 401
      : message.includes('Forbidden')
      ? 403
      : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
