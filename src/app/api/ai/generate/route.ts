import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { dalStore, verifyAuthenticatedUser } from '@/lib/dal';
import {
  buildStatelessInteractionConfig,
  calculateTokenCostUsd,
  continueInterruptedGeneration,
} from '@/lib/ai';

const GenerateRequestSchema = z.object({
  documentId: z.string().min(1),
  action: z.enum(['generate', 'continue']).default('generate'),
  prompt: z.string().min(1).max(4000).optional(),
  idempotencyKey: z.string().min(8).max(160),
  estimatedTokens: z.number().int().min(50).max(20000).default(1200),
  modelId: z
    .enum(['gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemini-4-argon'])
    .default('gemini-3.8-flash'),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Defense-in-depth independent DAL authentication check
    const session = await verifyAuthenticatedUser(request.headers);
    const body = GenerateRequestSchema.parse(await request.json());

    // 2. Verify document ownership in DAL
    const doc = dalStore.getDocumentForOwner(session, body.documentId);

    // 3. Validate `store: false` stateless configuration & Free Tier restrictions
    const statelessConfig = buildStatelessInteractionConfig({
      model: body.modelId,
      planTier: session.planTier,
    });

    // 4. Atomic Phase-1 Token Reservation (deriving user strictly from authenticated session)
    const reservationTx = await dalStore.reserveTokens(session, {
      estimatedTokens: body.estimatedTokens,
      idempotencyKey: body.idempotencyKey,
      modelId: body.modelId,
    });

    try {
      const { updatedDocument, appendedBlocks, actualInputTokens, actualOutputTokens } =
        continueInterruptedGeneration(doc);

      dalStore.saveDocumentForOwner(session, updatedDocument);

      // 5. Atomic Phase-2 Settlement via service_role
      const settledTx = await dalStore.settleTokenReservation('service_role', {
        txId: reservationTx.id,
        actualInputTokens,
        actualOutputTokens,
      });

      const costUsd = calculateTokenCostUsd(
        body.modelId,
        actualInputTokens,
        actualOutputTokens
      );

      return NextResponse.json({
        ok: true,
        action: body.action,
        statelessConfig,
        ledgerTransaction: settledTx,
        estimatedCostUsd: costUsd,
        appendedBlockCount: appendedBlocks.length,
        document: updatedDocument,
        entitlement: dalStore.getEntitlement(session),
      });
    } catch (genError) {
      // Automatic refund/release if generation fails mid-flight
      await dalStore.releaseTokenReservation('service_role', {
        txId: reservationTx.id,
        reasonStatus: 'REFUNDED',
      });
      throw genError;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected generation error';
    const status = message.includes('Unauthorized')
      ? 401
      : message.includes('Forbidden') || message.includes('Free Tier')
      ? 403
      : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
