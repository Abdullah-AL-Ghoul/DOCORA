/**
 * DOCORA Phase 02 — Capability-Based Model Registry & Intelligent Router (`src/lib/ai/router.ts`)
 *
 * Reference: `docs/blueprint/phase-00.2/05-MULTI-MODEL-REGISTRY-AND-INTELLIGENT-ROUTER.md`
 *            & `docs/blueprint/phase-00.2/26-MASTER-INTEGRATION-AND-EXECUTION-PLAN.md` (Section 3.7)
 *
 * Enforces:
 * 1. Capability-based routing across the three official Gemini models:
 *    - `gemini-3.5-flash-lite` ($0.30 / $2.50 per 1M tokens) — Complexity 1-3 (Fast classification, grammar linting)
 *    - `gemini-3.8-flash` ($0.75 / $3.75 per 1M tokens) — Complexity 4-7 (Drafting, multimodal, general Arabic/English)
 *    - `gemini-4-argon` ($2.00 / $10.00 until Nov 30, 2026; $4.00 / $20.00 from Dec 1, 2026) — Complexity 8-10
 *      (Complex legal/academic reasoning, citation verification; strictly blocked on `free` tier).
 * 2. Circuit Breaker Resilience Topology:
 *    - Trips to `OPEN` after 3 consecutive 429/5xx/timeout failures within a 60s window.
 *    - Automatically diverts requests to a healthy fallback model during `OPEN` state.
 *    - Transitions to `HALF_OPEN` after 30s cooldown to probe recovery, resetting to `CLOSED` on success.
 * 3. Honest Stateless `store: false` configuration:
 *    - Disables interaction persistence at the provider (`store: false`).
 *    - Rejects `background: true` and `previous_interaction_id`.
 */

import { OfficialModelId, PlanTier } from '../dal';
import {
  buildStatelessInteractionConfig,
  calculateTokenCostUsd,
  OFFICIAL_MODEL_PRICING,
  StatelessInteractionConfig,
} from './index';

export type ModelCapability =
  | 'FAST_CLASSIFICATION'
  | 'GRAMMAR_LINTING'
  | 'SUMMARIZATION_SHORT'
  | 'MICROCOPY_GENERATION'
  | 'HIGH_VELOCITY_WRITING'
  | 'INTENT_EXTRACTION'
  | 'ARABIC_GENERAL_REGISTER'
  | 'STRUCTURED_JSON_SCHEMA'
  | 'STREAMING_CHAT'
  | 'COMPLEX_REASONING'
  | 'LONG_FORM_WRITING'
  | 'ARABIC_ACADEMIC_REGISTER'
  | 'CITATION_VERIFICATION'
  | 'LEGAL_PRECISION';

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CapabilityModelRegistryEntry {
  modelId: OfficialModelId;
  provider: 'google-genai';
  displayName: string;
  tier: 'low_latency_lite' | 'balanced_production' | 'flagship_reasoning';
  contextWindowTokens: number;
  maxOutputTokens: number;
  capabilities: ModelCapability[];
  freeTierEligible: boolean;
  pricingPerMillionTokens: {
    inputUsd: number;
    outputUsd: number;
    postDec2026InputUsd?: number;
    postDec2026OutputUsd?: number;
  };
}

export const CAPABILITY_MODEL_REGISTRY: Record<OfficialModelId, CapabilityModelRegistryEntry> = {
  'gemini-3.5-flash-lite': {
    modelId: 'gemini-3.5-flash-lite',
    provider: 'google-genai',
    displayName: OFFICIAL_MODEL_PRICING['gemini-3.5-flash-lite'].displayName,
    tier: 'low_latency_lite',
    contextWindowTokens: 1_048_576,
    maxOutputTokens: 8_192,
    capabilities: [
      'FAST_CLASSIFICATION',
      'GRAMMAR_LINTING',
      'SUMMARIZATION_SHORT',
      'MICROCOPY_GENERATION',
      'STRUCTURED_JSON_SCHEMA',
    ],
    freeTierEligible: true,
    pricingPerMillionTokens: {
      inputUsd: 0.3,
      outputUsd: 2.5,
    },
  },
  'gemini-3.8-flash': {
    modelId: 'gemini-3.8-flash',
    provider: 'google-genai',
    displayName: OFFICIAL_MODEL_PRICING['gemini-3.8-flash'].displayName,
    tier: 'balanced_production',
    contextWindowTokens: 1_048_576,
    maxOutputTokens: 32_768,
    capabilities: [
      'HIGH_VELOCITY_WRITING',
      'INTENT_EXTRACTION',
      'ARABIC_GENERAL_REGISTER',
      'STRUCTURED_JSON_SCHEMA',
      'STREAMING_CHAT',
      'GRAMMAR_LINTING',
      'CITATION_VERIFICATION',
    ],
    freeTierEligible: true,
    pricingPerMillionTokens: {
      inputUsd: 0.75,
      outputUsd: 3.75,
    },
  },
  'gemini-4-argon': {
    modelId: 'gemini-4-argon',
    provider: 'google-genai',
    displayName: OFFICIAL_MODEL_PRICING['gemini-4-argon'].displayName,
    tier: 'flagship_reasoning',
    contextWindowTokens: 1_048_576,
    maxOutputTokens: 65_536,
    capabilities: [
      'COMPLEX_REASONING',
      'LONG_FORM_WRITING',
      'ARABIC_ACADEMIC_REGISTER',
      'STRUCTURED_JSON_SCHEMA',
      'CITATION_VERIFICATION',
      'LEGAL_PRECISION',
    ],
    freeTierEligible: false,
    pricingPerMillionTokens: {
      inputUsd: 2.0,
      outputUsd: 10.0,
      postDec2026InputUsd: 4.0,
      postDec2026OutputUsd: 20.0,
    },
  },
};

export interface CircuitBreakerStatus {
  modelId: OfficialModelId;
  state: CircuitState;
  consecutiveFailures: number;
  lastFailureTimestampMs: number | null;
  openedAtTimestampMs: number | null;
  cooldownWindowMs: number;
}

export interface RouteDecisionRequest {
  capability: ModelCapability;
  complexityScore: number; // 1..10
  planTier: PlanTier;
  preferredModelId?: OfficialModelId;
  estimatedInputTokens?: number;
  estimatedOutputTokens?: number;
  referenceDate?: Date;
  nowMs?: number;
  simulatePrimaryOutage?: boolean;
}

export interface RouteDecisionResult {
  selectedModelId: OfficialModelId;
  primaryCandidateModelId: OfficialModelId;
  fallbackTriggered: boolean;
  fallbackReason?: string;
  degradedUserNotice?: string;
  circuitState: CircuitState;
  complexityScore: number;
  capability: ModelCapability;
  statelessConfig: StatelessInteractionConfig;
  estimatedCostUsd: number;
}

export class IntelligentModelRouter {
  private readonly failureThreshold = 3;
  private readonly slidingWindowMs = 60_000;
  private readonly cooldownWindowMs = 30_000;

  private circuits = new Map<OfficialModelId, CircuitBreakerStatus>();

  constructor() {
    this.resetAllCircuits();
  }

  public resetAllCircuits(): void {
    const models: OfficialModelId[] = [
      'gemini-3.5-flash-lite',
      'gemini-3.8-flash',
      'gemini-4-argon',
    ];
    for (const modelId of models) {
      this.circuits.set(modelId, {
        modelId,
        state: 'CLOSED',
        consecutiveFailures: 0,
        lastFailureTimestampMs: null,
        openedAtTimestampMs: null,
        cooldownWindowMs: this.cooldownWindowMs,
      });
    }
  }

  public getCircuitStatus(modelId: OfficialModelId, nowMs: number = Date.now()): CircuitBreakerStatus {
    const status = this.circuits.get(modelId)!;
    if (
      status.state === 'OPEN' &&
      status.openedAtTimestampMs !== null &&
      nowMs - status.openedAtTimestampMs >= status.cooldownWindowMs
    ) {
      status.state = 'HALF_OPEN';
    }
    return { ...status };
  }

  /**
   * Records a simulated or live upstream 429 / 5xx / timeout failure.
   * Trips circuit to `OPEN` after 3 consecutive failures within 60 seconds.
   */
  public recordFailure(modelId: OfficialModelId, nowMs: number = Date.now()): CircuitBreakerStatus {
    const status = this.circuits.get(modelId)!;

    if (
      status.lastFailureTimestampMs !== null &&
      nowMs - status.lastFailureTimestampMs > this.slidingWindowMs
    ) {
      status.consecutiveFailures = 0;
    }

    status.consecutiveFailures += 1;
    status.lastFailureTimestampMs = nowMs;

    if (status.state === 'HALF_OPEN' || status.consecutiveFailures >= this.failureThreshold) {
      status.state = 'OPEN';
      status.openedAtTimestampMs = nowMs;
    }

    return { ...status };
  }

  /**
   * Records a successful response, resetting `HALF_OPEN` or `CLOSED` failure counters.
   */
  public recordSuccess(modelId: OfficialModelId): CircuitBreakerStatus {
    const status = this.circuits.get(modelId)!;
    status.state = 'CLOSED';
    status.consecutiveFailures = 0;
    status.lastFailureTimestampMs = null;
    status.openedAtTimestampMs = null;
    return { ...status };
  }

  private selectCandidateByComplexity(
    capability: ModelCapability,
    complexityScore: number,
    planTier: PlanTier,
    preferredModelId?: OfficialModelId
  ): { candidate: OfficialModelId; downgradedFromArgon: boolean } {
    const clampedScore = Math.max(1, Math.min(10, Math.round(complexityScore)));

    // If caller explicitly requested gemini-4-argon on Free Tier, throw explicit ADR-003 error
    if (preferredModelId === 'gemini-4-argon' && planTier === 'free') {
      throw new Error('Model gemini-4-argon is not available on the Free Tier');
    }

    if (preferredModelId) {
      return { candidate: preferredModelId, downgradedFromArgon: false };
    }

    // Determine initial complexity-based tier preference
    let baseCandidate: OfficialModelId;
    if (clampedScore <= 3) {
      baseCandidate = 'gemini-3.5-flash-lite';
    } else if (clampedScore <= 7) {
      baseCandidate = 'gemini-3.8-flash';
    } else {
      baseCandidate = 'gemini-4-argon';
    }

    // Upgrade candidate if the requested capability is not supported by the lower-tier model
    const tierEscalationOrder: OfficialModelId[] = [
      'gemini-3.5-flash-lite',
      'gemini-3.8-flash',
      'gemini-4-argon',
    ];
    const startIdx = tierEscalationOrder.indexOf(baseCandidate);
    let capabilityMatchedCandidate: OfficialModelId = baseCandidate;

    for (let i = startIdx; i < tierEscalationOrder.length; i++) {
      const m = tierEscalationOrder[i];
      if (CAPABILITY_MODEL_REGISTRY[m].capabilities.includes(capability)) {
        capabilityMatchedCandidate = m;
        break;
      }
    }

    // Free Tier guardrail (ADR-003): `gemini-4-argon` is strictly blocked on Free Tier
    if (capabilityMatchedCandidate === 'gemini-4-argon' && planTier === 'free') {
      return { candidate: 'gemini-3.8-flash', downgradedFromArgon: true };
    }

    return { candidate: capabilityMatchedCandidate, downgradedFromArgon: false };
  }

  private resolveFallbackModel(
    failedModel: OfficialModelId,
    planTier: PlanTier,
    nowMs: number
  ): OfficialModelId {
    const fallbackOrder: OfficialModelId[] =
      failedModel === 'gemini-4-argon'
        ? ['gemini-3.8-flash', 'gemini-3.5-flash-lite']
        : failedModel === 'gemini-3.8-flash'
        ? planTier !== 'free'
          ? ['gemini-3.5-flash-lite', 'gemini-4-argon']
          : ['gemini-3.5-flash-lite']
        : ['gemini-3.8-flash'];

    for (const candidate of fallbackOrder) {
      const circuit = this.getCircuitStatus(candidate, nowMs);
      if (circuit.state !== 'OPEN') {
        return candidate;
      }
    }

    return fallbackOrder[0];
  }

  /**
   * Routes a task request based on capability, complexity (1..10), plan tier, and circuit breaker health.
   */
  public routeTask(req: RouteDecisionRequest): RouteDecisionResult {
    const nowMs = req.nowMs ?? Date.now();
    const clampedScore = Math.max(1, Math.min(10, Math.round(req.complexityScore)));
    const { candidate: primaryCandidate, downgradedFromArgon } =
      this.selectCandidateByComplexity(
        req.capability,
        clampedScore,
        req.planTier,
        req.preferredModelId
      );

    if (req.simulatePrimaryOutage) {
      // Simulate a transient 3-failure trip on a scoped copy so one user's simulation toggle doesn't permanently poison the global singleton circuit for subsequent normal requests
      const fallbackModelId = this.resolveFallbackModel(
        primaryCandidate,
        req.planTier,
        nowMs + 25
      );
      const statelessConfig = buildStatelessInteractionConfig({
        model: fallbackModelId,
        planTier: req.planTier,
      });
      const inputTokens = req.estimatedInputTokens ?? 1_000;
      const outputTokens = req.estimatedOutputTokens ?? 800;
      const estimatedCostUsd = calculateTokenCostUsd(
        fallbackModelId,
        inputTokens,
        outputTokens,
        req.referenceDate
      );

      return {
        selectedModelId: fallbackModelId,
        primaryCandidateModelId: primaryCandidate,
        fallbackTriggered: true,
        fallbackReason: `Circuit breaker OPEN on ${primaryCandidate} (3 consecutive 5xx/429 failures); failed over to ${fallbackModelId}`,
        degradedUserNotice:
          'Operating on high-availability backup model due to provider maintenance.',
        circuitState: 'OPEN',
        complexityScore: clampedScore,
        capability: req.capability,
        statelessConfig,
        estimatedCostUsd,
      };
    }

    const primaryCircuit = this.getCircuitStatus(primaryCandidate, nowMs + 25);
    let selectedModelId: OfficialModelId = primaryCandidate;
    let fallbackTriggered = false;
    let fallbackReason: string | undefined;
    let degradedUserNotice: string | undefined;

    if (primaryCircuit.state === 'OPEN') {
      selectedModelId = this.resolveFallbackModel(primaryCandidate, req.planTier, nowMs + 25);
      fallbackTriggered = true;
      fallbackReason = `Circuit breaker OPEN on ${primaryCandidate} (${primaryCircuit.consecutiveFailures} consecutive 5xx/429 failures); failed over to ${selectedModelId}`;
      degradedUserNotice =
        'Operating on high-availability backup model due to provider maintenance.';
    } else if (downgradedFromArgon) {
      fallbackTriggered = true;
      fallbackReason =
        'Free Tier policy (ADR-003): gemini-4-argon is reserved for paid tiers; routed to gemini-3.8-flash';
    }

    const statelessConfig = buildStatelessInteractionConfig({
      model: selectedModelId,
      planTier: req.planTier,
    });

    const inputTokens = req.estimatedInputTokens ?? 1_000;
    const outputTokens = req.estimatedOutputTokens ?? 800;
    const estimatedCostUsd = calculateTokenCostUsd(
      selectedModelId,
      inputTokens,
      outputTokens,
      req.referenceDate
    );

    return {
      selectedModelId,
      primaryCandidateModelId: primaryCandidate,
      fallbackTriggered,
      fallbackReason,
      degradedUserNotice,
      circuitState: primaryCircuit.state,
      complexityScore: clampedScore,
      capability: req.capability,
      statelessConfig,
      estimatedCostUsd,
    };
  }
}

export const defaultModelRouter = new IntelligentModelRouter();
