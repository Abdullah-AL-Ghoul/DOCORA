import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { dalStore, verifyAuthenticatedUser } from '@/lib/dal';
import {
  buildStatelessInteractionConfig,
  calculateTokenCostUsd,
} from '@/lib/ai';
import { executeGeminiGeneration } from '@/lib/ai/gemini-client';
import { getDocumentById, saveDocument } from '@/lib/db/documents';
import { CdmDocument } from '@/lib/cdm/schema';

const GenerateRequestSchema = z.object({
  documentId: z.string().min(1),
  action: z.enum(['generate', 'continue', 'refine', 'outline']).default('generate'),
  prompt: z.string().min(1).max(4000).optional(),
  idempotencyKey: z.string().min(8).max(160),
  estimatedTokens: z.number().int().min(50).max(20000).default(1200),
  modelId: z
    .enum(['gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemini-4-argon'])
    .default('gemini-3.8-flash'),
  targetBlockId: z.string().optional(),
  selectedText: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Defense-in-depth independent DAL authentication check
    const session = await verifyAuthenticatedUser(request.headers);
    const body = GenerateRequestSchema.parse(await request.json());

    // 2. Verify document ownership in database persistence layer
    let doc = await getDocumentById(session.userId, body.documentId);
    if (!doc) {
      // Fall back to dalStore if exists
      doc = dalStore.getDocumentForOwner(session, body.documentId);
    }

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
      // 5. Execute Gemini AI Inference (live API with fallback telemetry)
      const generationResult = await executeGeminiGeneration({
        modelId: body.modelId,
        prompt: body.prompt,
        action: body.action,
        targetBlockId: body.targetBlockId,
        selectedText: body.selectedText,
        currentDocument: doc,
      });

      const updatedBlocks = [...doc.blocks, ...generationResult.appendedBlocks];
      const updatedDocument: CdmDocument = {
        ...doc,
        blocks: updatedBlocks,
        generationState: {
          status: 'COMPLETE',
          completedBlockCount: updatedBlocks.length,
          lastCompletedBlockId: updatedBlocks[updatedBlocks.length - 1]?.id,
          resumeContextPrompt: undefined,
        },
      };

      // 6. Persist updated document to durable database
      await saveDocument(session.userId, updatedDocument);
      dalStore.saveDocumentForOwner(session, updatedDocument);

      // 7. Atomic Phase-2 Settlement via service_role with actual token counts
      const settledTx = await dalStore.settleTokenReservation('service_role', {
        txId: reservationTx.id,
        actualInputTokens: generationResult.usage.promptTokens,
        actualOutputTokens: generationResult.usage.completionTokens,
      });

      const costUsd = calculateTokenCostUsd(
        body.modelId,
        generationResult.usage.promptTokens,
        generationResult.usage.completionTokens
      );

      return NextResponse.json({
        ok: true,
        action: body.action,
        statelessConfig,
        ledgerTransaction: settledTx,
        estimatedCostUsd: costUsd,
        appendedBlockCount: generationResult.appendedBlocks.length,
        diffSuggestion: generationResult.diffSuggestion,
        document: updatedDocument,
        isLiveInference: generationResult.isLiveInference,
        providerNotice: generationResult.providerNotice,
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
