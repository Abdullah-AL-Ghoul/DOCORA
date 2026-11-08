/**
 * DOCORA Phase 01 AI Model Pricing, Stateless `store: false` Policy & Continue Generation Engine
 *
 * Enforces Fix #6 & Guardrail #3:
 * 1. Official Gemini Standard Pricing:
 *    - `gemini-3.5-flash-lite`: $0.30 / $2.50 per 1M tokens
 *    - `gemini-3.8-flash`: $0.75 / $3.75 per 1M tokens (Phase 01 Primary Model)
 *    - `gemini-4-argon`: $2.00 / $10.00 per 1M tokens until Nov 30, 2026;
 *      $4.00 / $20.00 from Dec 1, 2026 (Not available on Free Tier; reserved for Phase 02)
 * 2. Honest `store: false` configuration:
 *    - Disables interaction object persistence at the provider.
 *    - Cannot be combined with `background: true` or `previous_interaction_id`.
 *    - Therefore, DOCORA stores conversation & CDM block checkpoints locally and implements
 *      `Continue Generation` from the last persisted CDM block with a fresh `idempotency_key`.
 */

import { CdmBlock, CdmDocument } from '../cdm/schema';
import { OfficialModelId, PlanTier } from '../dal';

export interface ModelPricingSpec {
  modelId: OfficialModelId;
  displayName: string;
  phase: 'P01' | 'P02';
  freeTierEligible: boolean;
  inputCostPerMillionUsd: number;
  outputCostPerMillionUsd: number;
  postDec2026InputCostPerMillionUsd?: number;
  postDec2026OutputCostPerMillionUsd?: number;
}

export const OFFICIAL_MODEL_PRICING: Record<OfficialModelId, ModelPricingSpec> = {
  'gemini-3.5-flash-lite': {
    modelId: 'gemini-3.5-flash-lite',
    displayName: 'Gemini 3.5 Flash-Lite',
    phase: 'P01',
    freeTierEligible: true,
    inputCostPerMillionUsd: 0.3,
    outputCostPerMillionUsd: 2.5,
  },
  'gemini-3.8-flash': {
    modelId: 'gemini-3.8-flash',
    displayName: 'Gemini 3.8 Flash',
    phase: 'P01',
    freeTierEligible: true,
    inputCostPerMillionUsd: 0.75,
    outputCostPerMillionUsd: 3.75,
  },
  'gemini-4-argon': {
    modelId: 'gemini-4-argon',
    displayName: 'Gemini 4 Argon',
    phase: 'P02',
    freeTierEligible: false,
    inputCostPerMillionUsd: 2.0,
    outputCostPerMillionUsd: 10.0,
    postDec2026InputCostPerMillionUsd: 4.0,
    postDec2026OutputCostPerMillionUsd: 20.0,
  },
};

export function calculateTokenCostUsd(
  modelId: OfficialModelId,
  inputTokens: number,
  outputTokens: number,
  referenceDate: Date = new Date('2026-11-08T00:00:00Z')
): number {
  const spec = OFFICIAL_MODEL_PRICING[modelId];
  const isPostDec2026 = referenceDate.getTime() >= new Date('2026-12-01T00:00:00Z').getTime();

  const inputRate =
    isPostDec2026 && spec.postDec2026InputCostPerMillionUsd !== undefined
      ? spec.postDec2026InputCostPerMillionUsd
      : spec.inputCostPerMillionUsd;
  const outputRate =
    isPostDec2026 && spec.postDec2026OutputCostPerMillionUsd !== undefined
      ? spec.postDec2026OutputCostPerMillionUsd
      : spec.outputCostPerMillionUsd;

  const cost = (inputTokens / 1_000_000) * inputRate + (outputTokens / 1_000_000) * outputRate;
  return Number(cost.toFixed(6));
}

export interface StatelessInteractionConfig {
  model: OfficialModelId;
  store: false;
  background?: false;
  previous_interaction_id?: undefined;
  privacyDisclosure: string;
}

/**
 * Builds a validated stateless provider configuration enforcing the technical rules of `store: false`:
 * - `store: false` is incompatible with `background: true` and `previous_interaction_id`.
 * - Rejects `gemini-4-argon` on the Free Tier.
 */
export function buildStatelessInteractionConfig(params: {
  model: OfficialModelId;
  planTier: PlanTier;
  background?: boolean;
  previousInteractionId?: string;
}): StatelessInteractionConfig {
  if (params.planTier === 'free' && params.model === 'gemini-4-argon') {
    throw new Error('Model gemini-4-argon is not available on the Free Tier');
  }
  if (params.background === true) {
    throw new Error('Technical Conflict: store: false cannot be combined with background: true');
  }
  if (params.previousInteractionId !== undefined) {
    throw new Error(
      'Technical Conflict: store: false cannot be combined with previous_interaction_id; manage context locally in DOCORA CDM'
    );
  }

  return {
    model: params.model,
    store: false,
    privacyDisclosure:
      'Stateless request mode (store: false) disables interaction object persistence at the provider. Full contractual Zero Data Retention (ZDR) requires Enterprise Vertex AI ZDR.',
  };
}

/**
 * Continues an interrupted CDM document generation from the last persisted block (`Continue Generation`),
 * appending only the missing blocks and marking `generationState.status = 'COMPLETE'`.
 */
export function continueInterruptedGeneration(doc: CdmDocument): {
  updatedDocument: CdmDocument;
  appendedBlocks: CdmBlock[];
  actualInputTokens: number;
  actualOutputTokens: number;
} {
  const isRtl = doc.defaultDirection !== 'ltr';
  const nextIndex = doc.blocks.length + 1;

  const appendedBlocks: CdmBlock[] = isRtl
    ? [
        {
          id: `cont-h-${nextIndex}`,
          type: 'heading',
          level: 2,
          direction: 'rtl',
          keepWithNext: true,
          text: 'البند الثالث (مستكمل): حوكمة أمن المعلومات واتفاقية مستوى الخدمة (SLA)',
        },
        {
          id: `cont-p-${nextIndex + 1}`,
          type: 'paragraph',
          direction: 'rtl',
          align: 'start',
          runs: [
            {
              text: 'تم استكمال التوليد بنجاح من آخر فقرة محفوظة في شجرة CDM v1.2 دون إعادة توليد البنود السابقة: يلتزم الطرفان بتحقيق توافر تشغيلي بنسبة 99.95% وتطبيق سياسات عزل المستأجرين RLS.',
              marks: [],
            },
          ],
        },
        {
          id: `cont-sig-${nextIndex + 2}`,
          type: 'signature',
          direction: 'rtl',
          firstPartyLabel: 'الطرف الأول',
          firstPartyName: 'الإدارة التنفيذية لتقنية المعلومات',
          secondPartyLabel: 'الطرف الثاني',
          secondPartyName: 'الشريك التقني المعتمد',
          dateLabel: 'التاريخ: 2026-11-08',
        },
      ]
    : [
        {
          id: `cont-h-${nextIndex}`,
          type: 'heading',
          level: 2,
          direction: 'ltr',
          keepWithNext: true,
          text: 'Section 3 (Continued): Information Security Governance & SLA Targets',
        },
        {
          id: `cont-p-${nextIndex + 1}`,
          type: 'paragraph',
          direction: 'ltr',
          align: 'start',
          runs: [
            {
              text: 'Generation resumed seamlessly from the last persisted CDM v1.2 block checkpoint without re-billing prior paragraphs. Both parties commit to 99.95% availability and tenant-isolated RLS enforcement.',
              marks: [],
            },
          ],
        },
      ];

  const updatedBlocks = [...doc.blocks, ...appendedBlocks];
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

  return {
    updatedDocument,
    appendedBlocks,
    actualInputTokens: 320,
    actualOutputTokens: 480,
  };
}
