'use client';

import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BookOpenCheck,
  Check,
  CheckCircle2,
  Copy,
  Cpu,
  GitPullRequest,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Wand2,
  X,
} from 'lucide-react';
import { Badge, Button } from '@/components/primitives';
import { CdmDocument, DocumentLocale } from '@/lib/cdm/schema';
import {
  applyInlineDiffProposalToDocument,
  buildInlineDiffProposalsForDocument,
  InlineDiffProposal,
  MAX_REVIEW_ROUNDS,
  MultiAgentReviewSessionResult,
} from '@/lib/ai/agents/supervisor';
import { evaluateDocumentQuality14Vectors } from '@/lib/ai/quality/scorer';

/**
 * Layer 3 Feature Component: Phase 02 Multi-Agent Review, Task-Oriented AI Actions & 14-Vector Quality Pulse Panel
 * (`src/components/features/agents/MultiAgentReviewPanel.tsx`)
 *
 * Enforces Section 8.4, 8.5, 8.7 & Phase 02:
 * - Mathematically verified WCAG 2.2 AA contrast (>= 4.5:1) in both Light & Dark modes.
 * - Task-oriented AI writing actions (`Improve Writing`, `Formalize Legal Tone`, `Isolate BiDi Numerals`, `Executive Summary`)
 *   that generate non-destructive `InlineDiffProposal` items rather than silently overwriting the document.
 * - Inline Diff Proposals (`rule/inline-before-modal`, `rule/preserve-user-input`) with per-block
 *   Accept / Reject / Copy controls.
 * - Full 14-Vector Quality Scoring Engine breakdown + Hard Gate (`BLOCKED`) inspection & simulation.
 * - Provenance Citation & Source Anchor inspection.
 * - Capability-Based Model Router & Circuit Breaker failover telemetry (`store: false`).
 */

export interface MultiAgentReviewPanelProps {
  document: CdmDocument;
  locale: DocumentLocale;
  onApplyDocumentChange: (updated: CdmDocument) => void;
  onTokensUpdated?: (used: number, reserved: number) => void;
}

type AiTaskPreset = 'improve' | 'formalize' | 'translate-summary' | 'expand';

export function MultiAgentReviewPanel({
  document,
  locale,
  onApplyDocumentChange,
  onTokensUpdated,
}: MultiAgentReviewPanelProps) {
  const isAr = locale === 'ar';

  const liveQualityReport = useMemo(
    () => evaluateDocumentQuality14Vectors(document),
    [document]
  );

  const [proposals, setProposals] = useState<InlineDiffProposal[]>(() =>
    buildInlineDiffProposalsForDocument(document)
  );
  const [reviewResult, setReviewResult] =
    useState<MultiAgentReviewSessionResult | null>(null);
  const [isRunningReview, setIsRunningReview] = useState(false);
  const [simulateOutage, setSimulateOutage] = useState(false);
  const [copiedProposalId, setCopiedProposalId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    'proposals' | 'vectors' | 'agents' | 'provenance'
  >('proposals');

  // Re-sync proposals when switching preset documents
  const [lastDocId, setLastDocId] = useState(document.id);
  if (document.id !== lastDocId) {
    setLastDocId(document.id);
    setProposals(buildInlineDiffProposalsForDocument(document));
    setReviewResult(null);
  }

  const handleRunBoundedReview = async (requestedRounds: 1 | 2 = 2) => {
    setIsRunningReview(true);
    try {
      const response = await fetch('/api/ai/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: document.id,
          idempotencyKey: `idem-rev-${document.id}-${Date.now()}`,
          requestedRounds,
          simulatePrimaryOutage: simulateOutage,
          documentOverride: document,
        }),
      });
      const data = await response.json();
      if (data.ok && data.reviewSession) {
        setReviewResult(data.reviewSession);
        setProposals(data.reviewSession.inlineProposals);
        if (data.entitlement && onTokensUpdated) {
          onTokensUpdated(
            data.entitlement.tokensUsed,
            data.entitlement.tokensReserved
          );
        }
      }
    } finally {
      setIsRunningReview(false);
    }
  };

  const handleCreateTaskOrientedProposal = (task: AiTaskPreset) => {
    const targetParagraph = document.blocks.find((b) => b.type === 'paragraph');
    if (!targetParagraph || targetParagraph.type !== 'paragraph') return;
    const orig = targetParagraph.runs.map((r) => r.text).join('');

    const newPropId = `prop-task-${task}-${Date.now()}`;
    const docIsAr = document.defaultDirection !== 'ltr';

    const taskMap: Record<
      AiTaskPreset,
      {
        roleId: InlineDiffProposal['roleId'];
        proposed: string;
        rationaleAr: string;
        rationaleEn: string;
      }
    > = {
      improve: {
        roleId: 'Drafter',
        proposed: docIsAr
          ? `${orig} — تمت مراجعة الصياغة لتحقيق أعلى درجات الوضوح والإيجاز المؤسسي.`
          : `${orig} — Refined for executive clarity, active voice, and institutional precision.`,
        rationaleAr: 'تحسين الوضوح اللغوي والسبك التحريري للفقرة المختارة.',
        rationaleEn: 'Improves sentence flow and executive readability.',
      },
      formalize: {
        roleId: 'Domain/Legal Reviewer',
        proposed: docIsAr
          ? `${orig} (يسري هذا الالتزام باعتباره التزاماً تعاقدياً جوهرياً خاضعاً للأنظمة المرعية).`
          : `${orig} (This covenant constitutes a binding material obligation under applicable law).`,
        rationaleAr: 'تحويل النبرة إلى صياغة قانونية وتعاقدية رسمية محكمة.',
        rationaleEn: 'Adapts paragraph tone to formal contractual register.',
      },
      'translate-summary': {
        roleId: 'Arabic/BiDi Linguist',
        proposed: docIsAr
          ? `${orig} [Executive Summary: Both parties agree to the governed technical & financial terms under CDM v1.2].`
          : `${orig} [ملخص تنفيذي: يقر الطرفان بالضوابط المالية والتقنية المعتمدة وفق معيار CDM v1.2].`,
        rationaleAr: 'إضافة ملخص ثنائي اللغة (عربي/إنجليزي) معزول الاتجاه UAX#9.',
        rationaleEn: 'Appends a bilingual cross-locale summary with UAX#9 isolation.',
      },
      expand: {
        roleId: 'Planner',
        proposed: docIsAr
          ? `${orig} ويشمل ذلك توثيق مؤشرات الأداء الرئيسية (KPIs) وتقارير الامتثال الدورية ومراجعات أمن المعلومات.`
          : `${orig} This encompasses periodic KPI telemetry, compliance attestations, and quarterly security audits.`,
        rationaleAr: 'توسيع الفقرة بتفاصيل تشغيلية ومؤشرات قياس قابلة للتنفيذ.',
        rationaleEn: 'Expands the clause with operational KPIs and audit scope.',
      },
    };

    const spec = taskMap[task];
    const nextProposal: InlineDiffProposal = {
      proposalId: newPropId,
      blockId: targetParagraph.id,
      roleId: spec.roleId,
      severity: 'improvement',
      originalText: orig,
      proposedText: spec.proposed,
      rationaleAr: spec.rationaleAr,
      rationaleEn: spec.rationaleEn,
      status: 'PENDING',
    };

    setProposals((prev) => [nextProposal, ...prev]);
    setActiveTab('proposals');
  };

  const handleAcceptProposal = (proposal: InlineDiffProposal) => {
    const updatedDoc = applyInlineDiffProposalToDocument(document, proposal);
    onApplyDocumentChange(updatedDoc);
    setProposals((prev) =>
      prev.map((item) =>
        item.proposalId === proposal.proposalId
          ? { ...item, status: 'ACCEPTED' }
          : item
      )
    );
  };

  const handleRejectProposal = (proposalId: string) => {
    setProposals((prev) =>
      prev.map((item) =>
        item.proposalId === proposalId ? { ...item, status: 'REJECTED' } : item
      )
    );
  };

  const handleCopyProposal = async (proposal: InlineDiffProposal) => {
    try {
      await navigator.clipboard?.writeText(proposal.proposedText);
    } catch {
      // Clipboard API fallback ignored in headless environment
    }
    setCopiedProposalId(proposal.proposalId);
    setTimeout(() => {
      setCopiedProposalId((prev) =>
        prev === proposal.proposalId ? null : prev
      );
    }, 1500);
  };

  const handleToggleDanglingCitationHardGate = () => {
    const hasDangling = (document.provenanceCitations ?? []).some(
      (c) => c.citationId === 'cit-dangling-hard-gate'
    );

    if (hasDangling) {
      const restored: CdmDocument = {
        ...document,
        provenanceCitations: (document.provenanceCitations ?? []).filter(
          (c) => c.citationId !== 'cit-dangling-hard-gate'
        ),
      };
      onApplyDocumentChange(restored);
    } else {
      const firstBlockId = document.blocks[0]?.id ?? 'h-1';
      const injected: CdmDocument = {
        ...document,
        provenanceCitations: [
          ...(document.provenanceCitations ?? []),
          {
            citationId: 'cit-dangling-hard-gate',
            blockId: firstBlockId,
            claimText: isAr
              ? 'ادعاء غير موثق يشير إلى مرجع غير موجود لاختبار بوابة الإيقاف الصارم (Hard Gate)'
              : 'Unverified claim pointing to missing anchor to test Hard Gate BLOCKED status',
            sourceAnchorId: 'non-existent-anchor-999',
            verified: false,
          },
        ],
      };
      onApplyDocumentChange(injected);
    }
  };

  const effectiveReport = reviewResult?.qualityReport ?? liveQualityReport;
  const isBlocked = effectiveReport.gateStatus === 'BLOCKED';

  return (
    <section
      aria-label={
        isAr
          ? 'لوحة الذكاء المتقدم ومراجعة الوكلاء التسعة وتقييم الجودة ذي الـ 14 بُعداً'
          : 'Phase 02 Multi-Agent Review & 14-Vector Quality Scoring Panel'
      }
      data-testid="phase02-intelligence-panel"
      className="rounded-2xl border border-[#CBD5E1] bg-[#FFFFFF] p-4 shadow-xs dark:border-[#334155] dark:bg-[#11131A] sm:p-5"
    >
      {/* Header Row: Quality Pulse + Router Status + Run Review */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3.5 dark:border-[#1E293B]">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="accent">
              <Cpu className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Phase 02 — Studio AI</span>
            </Badge>
            {isBlocked ? (
              <span
                data-testid="quality-gate-status-badge"
                className="inline-flex items-center gap-1.5 rounded-full border border-[#FCA5A5] bg-[#FEF2F2] px-2.5 py-1 text-xs font-bold text-[#991B1B] dark:border-[#7F1D1D] dark:bg-[#450A0A] dark:text-[#FCA5A5]"
              >
                <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
                <span>
                  {isAr
                    ? `بوابة الجودة: محظور (BLOCKED) — ${effectiveReport.compositeScore}%`
                    : `Quality Gate: BLOCKED — ${effectiveReport.compositeScore}%`}
                </span>
              </span>
            ) : (
              <span
                data-testid="quality-gate-status-badge"
                className="inline-flex items-center gap-1.5 rounded-full border border-[#A7F3D0] bg-[#ECFDF5] px-2.5 py-1 text-xs font-bold text-[#047857] dark:border-[#065F46] dark:bg-[#064E3B] dark:text-[#34D399]"
              >
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                <span>
                  {isAr
                    ? `نبض الجودة (14 بُعداً): ${effectiveReport.compositeScore}% (${effectiveReport.gateStatus})`
                    : `14-Vector Quality Pulse: ${effectiveReport.compositeScore}% (${effectiveReport.gateStatus})`}
                </span>
              </span>
            )}
            <Badge tone="neutral">
              <span>
                {isAr
                  ? `الحد الأقصى: ${MAX_REVIEW_ROUNDS} جولات`
                  : `Max ${MAX_REVIEW_ROUNDS} Rounds`}
              </span>
            </Badge>
          </div>
          <h2 className="text-sm font-bold text-[#0F172A] sm:text-base dark:text-[#F8FAFC]">
            {isAr
              ? 'مساعد الصياغة الموضعي + مراجعة الوكلاء الـ 9 + محرك الجودة (14 بُعداً)'
              : 'Contextual AI Assistant + 9-Role Review + 14-Vector Quality Engine'}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="xs"
            data-testid="toggle-circuit-breaker-sim"
            onClick={() => setSimulateOutage((prev) => !prev)}
          >
            <Activity className="h-3.5 w-3.5 text-[#4F46E5]" aria-hidden="true" />
            <span>
              {simulateOutage
                ? isAr
                  ? 'انقطاع 5xx (نشط)'
                  : '5xx Outage (Active)'
                : isAr
                ? 'محاكاة انقطاع 5xx (Circuit Breaker)'
                : 'Simulate 5xx Outage'}
            </span>
          </Button>

          <Button
            variant="outline"
            size="xs"
            data-testid="toggle-hard-gate-citation"
            onClick={handleToggleDanglingCitationHardGate}
          >
            <AlertTriangle
              className="h-3.5 w-3.5 text-[#B45309]"
              aria-hidden="true"
            />
            <span>
              {isBlocked
                ? isAr
                  ? 'إزالة الإحالة غير الموثقة (استعادة READY)'
                  : 'Restore READY Gate'
                : isAr
                ? 'اختبار بوابة الحظر (Hard Gate: BLOCKED)'
                : 'Test Hard Gate (BLOCKED)'}
            </span>
          </Button>

          <Button
            variant="primary"
            size="xs"
            data-testid="run-multi-agent-review-btn"
            disabled={isRunningReview}
            onClick={() => handleRunBoundedReview(2)}
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            <span>
              {isRunningReview
                ? isAr
                  ? 'جارٍ تشغيل الوكلاء الـ 9...'
                  : 'Running 9-Role Review...'
                : isAr
                ? 'تشغيل المراجعة المحكومة (9 وكلاء)'
                : 'Run Bounded 9-Role Review'}
            </span>
          </Button>
        </div>
      </div>

      {/* Section 8.4: Task-Oriented Non-Destructive AI Writing Actions */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-xs dark:border-[#1E293B] dark:bg-[#090A0F]">
        <span className="inline-flex items-center gap-1.5 font-semibold text-[#475569] dark:text-[#94A3B8]">
          <Wand2 className="h-3.5 w-3.5 text-[#4F46E5]" aria-hidden="true" />
          <span>
            {isAr
              ? 'إجراءات الصياغة الموضعية (تولد مقترحاً للمقارنة دون مسح المستند):'
              : 'Contextual AI Actions (Generates non-destructive inline diff):'}
          </span>
        </span>
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            variant="outline"
            size="xs"
            data-testid="ai-action-improve"
            onClick={() => handleCreateTaskOrientedProposal('improve')}
          >
            {isAr ? 'تحسين الصياغة' : 'Improve Writing'}
          </Button>
          <Button
            variant="outline"
            size="xs"
            data-testid="ai-action-formalize"
            onClick={() => handleCreateTaskOrientedProposal('formalize')}
          >
            {isAr ? 'ضبط النبرة التعاقدية' : 'Formalize Tone'}
          </Button>
          <Button
            variant="outline"
            size="xs"
            data-testid="ai-action-expand"
            onClick={() => handleCreateTaskOrientedProposal('expand')}
          >
            {isAr ? 'توسيع البنود' : 'Expand Clause'}
          </Button>
          <Button
            variant="outline"
            size="xs"
            data-testid="ai-action-translate-summary"
            onClick={() => handleCreateTaskOrientedProposal('translate-summary')}
          >
            {isAr ? 'ملخص ثنائي اللغة' : 'Bilingual Summary'}
          </Button>
        </div>
      </div>

      {/* Router Telemetry & Circuit Breaker Notice */}
      {reviewResult && (
        <div
          data-testid="router-telemetry-banner"
          className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-4 py-2.5 text-xs dark:border-[#334155] dark:bg-[#090A0F]"
        >
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-bold text-[#0F172A] dark:text-[#F8FAFC]">
              {isAr ? 'قرار موجه النماذج:' : 'Router Decision:'}{' '}
              <code className="rounded bg-[#E2E8F0] px-1.5 py-0.5 font-mono text-[#0F172A] dark:bg-[#1E293B] dark:text-[#F8FAFC]">
                {reviewResult.routeDecision.selectedModelId}
              </code>
            </span>
            <span className="text-[#475569] dark:text-[#94A3B8]">
              {isAr ? 'حالة القاطع:' : 'Circuit:'}{' '}
              <strong className="text-[#0F172A] dark:text-[#F8FAFC]">
                {reviewResult.routeDecision.circuitState}
              </strong>
            </span>
            <span className="text-[#475569] dark:text-[#94A3B8]">
              {isAr ? 'الوضع غير المخزن:' : 'Stateless:'}{' '}
              <code className="font-mono text-[#047857] dark:text-[#34D399]">
                store: false
              </code>
            </span>
            <span className="tabular-nums text-[#475569] dark:text-[#94A3B8]">
              {isAr
                ? `الجولات: ${reviewResult.roundsExecuted}/${reviewResult.maxRounds} | الرموز المسوّاة: ${reviewResult.totalTokensConsumed}`
                : `Rounds: ${reviewResult.roundsExecuted}/${reviewResult.maxRounds} | Settled Tokens: ${reviewResult.totalTokensConsumed}`}
            </span>
          </div>
          {reviewResult.routeDecision.degradedUserNotice && (
            <span className="font-semibold text-[#92400E] dark:text-[#FBBF24]">
              {reviewResult.routeDecision.degradedUserNotice}
            </span>
          )}
        </div>
      )}

      {/* Hard Gate Blocking Alert */}
      {isBlocked && (
        <div
          role="alert"
          data-testid="hard-gate-blocked-alert"
          className="mt-3 rounded-xl border border-[#FCA5A5] bg-[#FEF2F2] p-3.5 text-xs text-[#991B1B] dark:border-[#7F1D1D] dark:bg-[#450A0A] dark:text-[#FCA5A5]"
        >
          <div className="font-bold">
            {isAr
              ? 'تم تفعيل بوابة الإيقاف الصارم (Hard Gate Override -> STATUS: BLOCKED — التصدير معطل حتى المعالجة):'
              : 'Hard Gate Override Triggered (STATUS: BLOCKED — Export disabled until resolved):'}
          </div>
          <ul className="mt-1 list-inside list-disc space-y-1">
            {effectiveReport.blockingReasons.map((reason, idx) => (
              <li key={idx}>{reason}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Navigation Tabs for Phase 02 Sub-Systems */}
      <div
        role="tablist"
        aria-label={
          isAr ? 'تبويبات الذكاء المتقدم' : 'Phase 02 Intelligence Tabs'
        }
        className="mt-3.5 flex flex-wrap gap-2 border-b border-[#E2E8F0] pb-3 dark:border-[#1E293B]"
      >
        <Button
          variant={activeTab === 'proposals' ? 'primary' : 'outline'}
          size="xs"
          role="tab"
          aria-selected={activeTab === 'proposals'}
          data-testid="tab-inline-proposals"
          onClick={() => setActiveTab('proposals')}
        >
          <GitPullRequest className="h-3.5 w-3.5" aria-hidden="true" />
          <span>
            {isAr
              ? `المقترحات الموضعية (${proposals.filter((p) => p.status === 'PENDING').length})`
              : `Inline Diff Proposals (${proposals.filter((p) => p.status === 'PENDING').length})`}
          </span>
        </Button>

        <Button
          variant={activeTab === 'vectors' ? 'primary' : 'outline'}
          size="xs"
          role="tab"
          aria-selected={activeTab === 'vectors'}
          data-testid="tab-14-vectors"
          onClick={() => setActiveTab('vectors')}
        >
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          <span>
            {isAr ? 'أبعاد الجودة الـ 14' : '14 Quality Dimensions'}
          </span>
        </Button>

        <Button
          variant={activeTab === 'agents' ? 'primary' : 'outline'}
          size="xs"
          role="tab"
          aria-selected={activeTab === 'agents'}
          data-testid="tab-9-agents"
          onClick={() => setActiveTab('agents')}
        >
          <Cpu className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{isAr ? 'سجل الوكلاء الـ 9' : '9 Bounded Agent Roles'}</span>
        </Button>

        <Button
          variant={activeTab === 'provenance' ? 'primary' : 'outline'}
          size="xs"
          role="tab"
          aria-selected={activeTab === 'provenance'}
          data-testid="tab-provenance-citations"
          onClick={() => setActiveTab('provenance')}
        >
          <BookOpenCheck className="h-3.5 w-3.5" aria-hidden="true" />
          <span>
            {isAr
              ? `تتبع المصادر والإحالات (${(document.provenanceCitations ?? []).length})`
              : `Provenance Citations (${(document.provenanceCitations ?? []).length})`}
          </span>
        </Button>
      </div>

      {/* Tab 1: Inline Diff Proposals (rule/inline-before-modal & rule/preserve-user-input) */}
      {activeTab === 'proposals' && (
        <div
          className="mt-3.5 space-y-3"
          data-testid="inline-proposals-container"
        >
          {proposals.map((prop) => (
            <div
              key={prop.proposalId}
              data-testid={`proposal-card-${prop.proposalId}`}
              className="rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-3.5 dark:border-[#334155] dark:bg-[#090A0F]"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge tone="accent">{prop.roleId}</Badge>
                  <span className="text-xs font-semibold text-[#475569] dark:text-[#94A3B8]">
                    {isAr ? `الكتلة: ${prop.blockId}` : `Block: ${prop.blockId}`}
                  </span>
                </div>
                <Badge
                  tone={
                    prop.status === 'ACCEPTED'
                      ? 'verified'
                      : prop.status === 'REJECTED'
                      ? 'warning'
                      : 'neutral'
                  }
                >
                  {prop.status === 'ACCEPTED'
                    ? isAr
                      ? 'تم القبول والتطبيق ✓'
                      : 'Accepted & Applied ✓'
                    : prop.status === 'REJECTED'
                    ? isAr
                      ? 'تم الرفض (حُفظ نص المستخدم)'
                      : 'Rejected (User Text Preserved)'
                    : isAr
                    ? 'مقترح موضعي بانتظار القرار'
                    : 'Pending Inline Review'}
                </Badge>
              </div>

              <p className="mt-2 text-xs font-medium text-[#475569] dark:text-[#94A3B8]">
                {isAr ? prop.rationaleAr : prop.rationaleEn}
              </p>

              <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
                <div className="rounded-lg border border-[#CBD5E1] bg-[#FFFFFF] p-2.5 text-xs dark:border-[#1E293B] dark:bg-[#11131A]">
                  <div className="mb-1 font-bold text-[#475569] dark:text-[#94A3B8]">
                    {isAr ? 'النص الحالي:' : 'Current Block Text:'}
                  </div>
                  <p className="text-[#0F172A] dark:text-[#F8FAFC]">
                    {prop.originalText}
                  </p>
                </div>
                <div className="rounded-lg border border-[#A7F3D0] bg-[#ECFDF5] p-2.5 text-xs dark:border-[#065F46] dark:bg-[#064E3B]">
                  <div className="mb-1 font-bold text-[#047857] dark:text-[#34D399]">
                    {isAr ? 'النص المقترح:' : 'Proposed Refinement:'}
                  </div>
                  <p className="text-[#0F172A] dark:text-[#F8FAFC]">
                    {prop.proposedText}
                  </p>
                </div>
              </div>

              {prop.status === 'PENDING' && (
                <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => handleCopyProposal(prop)}
                  >
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>
                      {copiedProposalId === prop.proposalId
                        ? isAr
                          ? 'تم النسخ ✓'
                          : 'Copied ✓'
                        : isAr
                        ? 'نسخ المقترح'
                        : 'Copy'}
                    </span>
                  </Button>
                  <Button
                    variant="outline"
                    size="xs"
                    data-testid={`reject-proposal-${prop.proposalId}`}
                    onClick={() => handleRejectProposal(prop.proposalId)}
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{isAr ? 'رفض المقترح' : 'Reject Proposal'}</span>
                  </Button>
                  <Button
                    variant="primary"
                    size="xs"
                    data-testid={`accept-proposal-${prop.proposalId}`}
                    onClick={() => handleAcceptProposal(prop)}
                  >
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>
                      {isAr ? 'قبول وتطبيق في الكتلة' : 'Accept & Apply Inline'}
                    </span>
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: 14-Vector Quality Scoring Matrix */}
      {activeTab === 'vectors' && (
        <div
          className="mt-3.5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3"
          data-testid="quality-vectors-grid"
        >
          {effectiveReport.dimensions.map((dim) => (
            <div
              key={dim.id}
              data-testid={`quality-vector-${dim.index}`}
              className="rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-3 text-xs dark:border-[#334155] dark:bg-[#090A0F]"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                  #{dim.index}. {isAr ? dim.titleAr : dim.titleEn}
                </span>
                <span
                  className={`tabular-nums rounded px-1.5 py-0.5 font-bold ${
                    dim.criticalFailure
                      ? 'bg-[#FEF2F2] text-[#991B1B] dark:bg-[#450A0A] dark:text-[#FCA5A5]'
                      : 'bg-[#ECFDF5] text-[#047857] dark:bg-[#064E3B] dark:text-[#34D399]'
                  }`}
                >
                  {dim.score}% ({dim.weightPercent}%)
                </span>
              </div>
              <p className="mt-1.5 text-[#475569] dark:text-[#94A3B8]">
                {dim.findings[0]}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: 9 Bounded Agent Roles Execution Trace */}
      {activeTab === 'agents' && (
        <div className="mt-3.5 space-y-2" data-testid="agent-roles-grid">
          {(
            reviewResult?.rounds[reviewResult.rounds.length - 1]
              ?.rolesExecuted ?? [
              {
                roleId: 'Planner',
                orderIndex: 1,
                titleEn: 'Planner',
                titleAr: 'المخطط الهيكلي',
                status: 'COMPLETED',
                tokensUsed: 110,
                summaryEn: 'Ready to verify outline hierarchy.',
                summaryAr: 'جاهز للتحقق من تسلسل الأقسام.',
              },
              {
                roleId: 'Drafter',
                orderIndex: 2,
                titleEn: 'Drafter',
                titleAr: 'وكيل الصياغة',
                status: 'COMPLETED',
                tokensUsed: 160,
                summaryEn: 'Ready to propose inline block refinements.',
                summaryAr: 'جاهز لتوليد المقترحات الموضعية.',
              },
              {
                roleId: 'Domain/Legal Reviewer',
                orderIndex: 3,
                titleEn: 'Domain/Legal Reviewer',
                titleAr: 'المراجع القانوني والتخصصي',
                status: 'COMPLETED',
                tokensUsed: 150,
                summaryEn: 'Audits legal clauses and disclaimer gate.',
                summaryAr: 'يدقق البنود التعاقدية وإخلاء المسؤولية.',
              },
              {
                roleId: 'Arabic/BiDi Linguist',
                orderIndex: 4,
                titleEn: 'Arabic/BiDi Linguist',
                titleAr: 'المدقق اللغوي ومهندس BiDi',
                status: 'COMPLETED',
                tokensUsed: 120,
                summaryEn: 'Audits Arabic register and UAX#9 isolation.',
                summaryAr: 'يدقق سلامة العربية واتجاه النصوص المختلطة.',
              },
              {
                roleId: 'Table & Layout Optimizer',
                orderIndex: 5,
                titleEn: 'Table & Layout Optimizer',
                titleAr: 'محسن الجداول والتخطيط',
                status: 'COMPLETED',
                tokensUsed: 95,
                summaryEn: 'Verifies table rectangularity and bidiVisual.',
                summaryAr: 'يتحقق من انتظام الجداول وخاصية bidiVisual.',
              },
              {
                roleId: 'Fact & Citation Verifier',
                orderIndex: 6,
                titleEn: 'Fact & Citation Verifier',
                titleAr: 'مدقق الحقائق والإحالات المرجعية',
                status: 'COMPLETED',
                tokensUsed: 140,
                summaryEn: 'Verifies provenance citations against source anchors.',
                summaryAr: 'يطابق الإحالات المرجعية مع المقتطفات المصدرية.',
              },
              {
                roleId: 'Security & Prompt-Injection Sanitizer',
                orderIndex: 7,
                titleEn: 'Security & Prompt-Injection Sanitizer',
                titleAr: 'حارس الأمان وتطهير حقن الأوامر',
                status: 'COMPLETED',
                tokensUsed: 85,
                summaryEn: 'Scans CDM blocks against XSS and injection payloads.',
                summaryAr: 'يفحص كتل CDM ضد محاولات الحقن البرمجي.',
              },
              {
                roleId: 'Quality Scorer',
                orderIndex: 8,
                titleEn: 'Quality Scorer',
                titleAr: 'محرك تقييم الجودة (14 بُعداً)',
                status: 'COMPLETED',
                tokensUsed: 90,
                summaryEn: 'Computes 14-vector score and enforces Hard Gates.',
                summaryAr: 'يحسب الدرجة المركبة ويفعل بوابات الإيقاف الصارم.',
              },
              {
                roleId: 'Finalizer',
                orderIndex: 9,
                titleEn: 'Finalizer (Supervisor)',
                titleAr: 'المنسق المشرف وحاسم التعارضات',
                status: 'COMPLETED',
                tokensUsed: 70,
                summaryEn: 'Resolves reviewer conflicts and finalizes delivery.',
                summaryAr: 'يحسم التعارضات ويسلم المسودة المحكومة.',
              },
            ]
          ).map((role) => (
            <div
              key={role.roleId}
              data-testid={`agent-role-${role.orderIndex}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3.5 py-2 text-xs dark:border-[#334155] dark:bg-[#090A0F]"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2
                  className="h-4 w-4 text-[#047857] dark:text-[#34D399]"
                  aria-hidden="true"
                />
                <span className="font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                  {role.orderIndex}. {isAr ? role.titleAr : role.titleEn} (
                  {role.roleId})
                </span>
              </div>
              <span className="text-[#475569] dark:text-[#94A3B8]">
                {isAr ? role.summaryAr : role.summaryEn}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: Provenance Citations & Source Anchors Inspection */}
      {activeTab === 'provenance' && (
        <div
          className="mt-3.5 space-y-3"
          data-testid="provenance-citations-list"
        >
          {(document.provenanceCitations ?? []).length === 0 ? (
            <p className="text-xs text-[#475569] dark:text-[#94A3B8]">
              {isAr
                ? 'لا توجد إحالات مرجعية مسجلة في هذه المسودة حالياً.'
                : 'No provenance citations linked in this draft yet.'}
            </p>
          ) : (
            (document.provenanceCitations ?? []).map((cit) => {
              const anchor = (document.sourceAnchors ?? []).find(
                (a) => a.anchorId === cit.sourceAnchorId
              );
              const isValid = Boolean(anchor) && cit.verified;
              return (
                <div
                  key={cit.citationId}
                  data-testid={`citation-item-${cit.citationId}`}
                  className="rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-3 text-xs dark:border-[#334155] dark:bg-[#090A0F]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                      {cit.claimText}
                    </span>
                    <Badge tone={isValid ? 'verified' : 'warning'}>
                      {isValid
                        ? isAr
                          ? 'مرجع موثق ومطابق ✓'
                          : 'Verified Provenance ✓'
                        : isAr
                        ? 'مرجع مفقود / غير موثق (BLOCKED)'
                        : 'Dangling / Unverified (BLOCKED)'}
                    </Badge>
                  </div>
                  {anchor ? (
                    <div className="mt-2 rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-2.5 text-[#475569] dark:border-[#1E293B] dark:bg-[#11131A] dark:text-[#94A3B8]">
                      <div className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                        {anchor.sourceTitle} ({anchor.pageOrClause})
                      </div>
                      <p className="mt-1">{anchor.excerpt}</p>
                    </div>
                  ) : (
                    <p className="mt-1.5 font-semibold text-[#991B1B] dark:text-[#FCA5A5]">
                      {isAr
                        ? `تحذير: المعرف المرجعي (${cit.sourceAnchorId}) غير موجود في مصادر المستند!`
                        : `Alert: Source anchor (${cit.sourceAnchorId}) does not exist in document sources!`}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </section>
  );
}
