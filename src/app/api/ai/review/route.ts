import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { dalStore, verifyAuthenticatedUser } from '@/lib/dal';
import { CdmDocumentSchema } from '@/lib/cdm/schema';
import { executeBoundedMultiAgentReview } from '@/lib/ai/agents/supervisor';

const ReviewRequestSchema = z.object({
  documentId: z.string().min(1),
  idempotencyKey: z.string().min(8).max(160),
  requestedRounds: z.number().int().min(1).max(5).optional().default(1),
  complexityScore: z.number().int().min(1).max(10).optional(),
  simulatePrimaryOutage: z.boolean().optional().default(false),
  documentOverride: CdmDocumentSchema.optional(),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Defense-in-depth independent DAL authentication check
    const session = await verifyAuthenticatedUser(request.headers);
    const body = ReviewRequestSchema.parse(await request.json());

    // 2. Verify document ownership in DAL (even if an inline edited documentOverride is supplied)
    const ownedDocument = dalStore.getDocumentForOwner(session, body.documentId);
    const targetDocument =
      body.documentOverride && body.documentOverride.id === ownedDocument.id
        ? body.documentOverride
        : ownedDocument;

    // 3. Execute Bounded 9-Role Multi-Agent Review & 14-Vector Quality Scoring Engine
    const reviewSession = await executeBoundedMultiAgentReview({
      session,
      document: targetDocument,
      idempotencyKey: body.idempotencyKey,
      requestedRounds: body.requestedRounds,
      complexityScore: body.complexityScore,
      simulatePrimaryOutage: body.simulatePrimaryOutage,
    });

    return NextResponse.json({
      ok: true,
      reviewSession,
      entitlement: dalStore.getEntitlement(session),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unexpected multi-agent review error';
    const status = message.includes('Unauthorized')
      ? 401
      : message.includes('Forbidden') || message.includes('Free Tier')
      ? 403
      : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
