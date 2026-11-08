'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Download,
  FileCheck2,
  FileSpreadsheet,
  FileUp,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Badge, Button } from '@/components/primitives';
import {
  AutosaveStatusIndicator,
  BidiDirectionToggle,
  ContinueGenerationBanner,
  LegalDisclaimerBanner,
  TokenQuotaMeter,
} from '@/components/composites';
import { TiptapStudioEditor } from '@/components/features/editor/TiptapStudioEditor';
import { MultiAgentReviewPanel } from '@/components/features/agents/MultiAgentReviewPanel';
import { evaluateDocumentQuality14Vectors } from '@/lib/ai/quality/scorer';
import { CdmDocument, DocumentLocale, TextDirection } from '@/lib/cdm/schema';
import { PRESET_DOCUMENTS } from '@/lib/cdm/presets';

/**
 * Layer 4 View: Document Studio View (`Mode B — SaaS / Product Utility`)
 *
 * Integrates:
 * - Preset switcher (Arabic Executive Contract RTL, English Board Memo LTR, Interrupted Draft with Continue Generation).
 * - Tiptap 3.x Continuous Structured Editor + Synchronized Live Paged Print Preview (`ADR-001`).
 * - Two-phase Token Quota Meter + Live `Continue Generation` recovery (`Guardrail #3`).
 * - Native `docx@9.15.2` download & `Puppeteer` Vector PDF Worker enqueue (`ADR-002` & `ADR-011`).
 * - Digital PDF Text Extraction (`pdfjs-dist` Phase 01) with explicit Phase 03 deferral notice for Scanned OCR.
 */

export function DocumentStudioView({
  locale,
  initialDocId,
}: {
  locale: DocumentLocale;
  initialDocId?: string;
}) {
  const isAr = locale === 'ar';
  const defaultKey =
    initialDocId && PRESET_DOCUMENTS[initialDocId]
      ? initialDocId
      : isAr
      ? 'exec-contract-ar'
      : 'board-report-en';

  const [activeDoc, setActiveDoc] = useState<CdmDocument>(
    () => structuredClone(PRESET_DOCUMENTS[defaultKey])
  );
  const [direction, setDirection] = useState<TextDirection>(
    activeDoc.defaultDirection
  );
  const [autosaveStatus, setAutosaveStatus] = useState<
    'saved' | 'saving' | 'offline-indexeddb'
  >('saved');
  const [tokensUsed, setTokensUsed] = useState(7900);
  const [tokensReserved, setTokensReserved] = useState(0);
  const [isContinuing, setIsContinuing] = useState(false);
  const [exportStatusBanner, setExportStatusBanner] = useState<string | null>(
    null
  );
  const [pdfIngestResult, setPdfIngestResult] = useState<string | null>(null);

  const liveQualityGate = evaluateDocumentQuality14Vectors(activeDoc);
  const isExportBlockedByHardGate = liveQualityGate.gateStatus === 'BLOCKED';

  const handleSelectPreset = (docKey: string) => {
    const next = structuredClone(PRESET_DOCUMENTS[docKey]);
    setActiveDoc(next);
    setDirection(next.defaultDirection);
    setExportStatusBanner(null);
  };

  const handleDocumentChange = (updated: CdmDocument) => {
    setAutosaveStatus('saving');
    setActiveDoc(updated);
    setTimeout(() => {
      setAutosaveStatus('saved');
    }, 180);
  };

  const handleContinueGeneration = async () => {
    setIsContinuing(true);
    setTokensReserved(1200);
    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: activeDoc.id,
          action: 'continue',
          idempotencyKey: `idem-continue-${activeDoc.id}-${Date.now()}`,
          estimatedTokens: 1200,
          modelId: 'gemini-3.8-flash',
        }),
      });
      const data = await response.json();
      if (data.ok && data.document) {
        setActiveDoc(data.document);
        setTokensUsed(data.entitlement.tokensUsed);
        setTokensReserved(data.entitlement.tokensReserved);
        setExportStatusBanner(
          isAr
            ? `تم استكمال التوليد وتسوية (${data.ledgerTransaction.settledTokens}) رمزاً وإعادة (${data.ledgerTransaction.refundedTokens}) رمزاً غير مستهلك.`
            : `Continued generation settled (${data.ledgerTransaction.settledTokens}) tokens and refunded (${data.ledgerTransaction.refundedTokens}) unused tokens.`
        );
      }
    } finally {
      setIsContinuing(false);
    }
  };

  const handleExport = async (format: 'docx' | 'pdf') => {
    if (isExportBlockedByHardGate) {
      return;
    }
    setExportStatusBanner(
      isAr
        ? `جارٍ إرسال مهمة التصدير (${format.toUpperCase()}) إلى عامل الخلفية المعزول (docora-worker)...`
        : `Dispatching (${format.toUpperCase()}) export job to isolated docora-worker...`
    );

    const response = await fetch(`/api/documents/${activeDoc.id}/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        format,
        idempotencyKey: `idem-exp-${activeDoc.id}-${format}-${Date.now()}`,
        mode: 'enqueue',
      }),
    });

    const data = await response.json();
    if (data.ok) {
      setExportStatusBanner(
        isAr
          ? `تم تسجيل مهمة التصدير بنجاح (${format.toUpperCase()}) — معرف المهمة: ${data.job.id} (محرك docx@9.15.2 / Puppeteer Vector PDF)`
          : `Export job (${format.toUpperCase()}) queued — Job ID: ${data.job.id} (docx@9.15.2 / Puppeteer Vector PDF)`
      );
    }
  };

  const handleTestDigitalPdfExtract = async (mode: 'digital' | 'scanned') => {
    const samplePages =
      mode === 'digital'
        ? [
            'البند الأول: التزامات الطرفين في حماية الوثائق الرقمية وعقود المستوى التشغيلي.\n\nالبند الثاني: تطبق معايير التشفير وعزل المستأجرين RLS.',
          ]
        : ['   '];

    const res = await fetch('/api/files/extract-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: mode === 'digital' ? 'contract-digital.pdf' : 'scanned-image.pdf',
        pageTexts: samplePages,
      }),
    });
    const data = await res.json();
    if (data.ok) {
      if (data.extraction.classification === 'DIGITAL_TEXT_PDF') {
        setPdfIngestResult(
          isAr
            ? `تم استخراج (${data.extraction.extractedParagraphs.length}) فقرات رقمية بنجاح عبر pdfjs-dist.`
            : `Extracted (${data.extraction.extractedParagraphs.length}) digital text paragraphs via pdfjs-dist.`
        );
      } else {
        setPdfIngestResult(data.extraction.phaseNotice);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] dark:bg-[#090A0F] dark:text-[#F8FAFC]">
      {/* Studio Top Bar */}
      <header className="sticky top-0 z-20 border-b border-[#CBD5E1] bg-[#FFFFFF] dark:border-[#1E293B] dark:bg-[#11131A]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/${locale}/dashboard`}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4F46E5] font-bold text-[#FFFFFF]"
              aria-label={isAr ? 'العودة إلى لوحة المستندات' : 'Back to Dashboard'}
            >
              D
            </Link>
            <div>
              <h1 className="text-sm font-bold sm:text-base">{activeDoc.title}</h1>
              <div className="mt-0.5 flex items-center gap-2">
                <AutosaveStatusIndicator
                  status={autosaveStatus}
                  locale={locale}
                />
                <span className="text-xs text-[#475569] dark:text-[#94A3B8]">
                  CDM v{activeDoc.cdmVersion}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <BidiDirectionToggle
              direction={direction}
              onChange={(nextDir) => {
                setDirection(nextDir);
                setActiveDoc((prev) => ({ ...prev, defaultDirection: nextDir }));
              }}
              locale={locale}
            />
            <TokenQuotaMeter
              used={tokensUsed}
              reserved={tokensReserved}
              limit={50000}
              locale={locale}
            />
            <Button
              variant="outline"
              size="sm"
              data-testid="export-docx-btn"
              disabled={isExportBlockedByHardGate}
              onClick={() => handleExport('docx')}
            >
              <FileSpreadsheet className="h-4 w-4 text-[#4F46E5]" aria-hidden="true" />
              <span>{isAr ? 'تصدير DOCX (9.15.2)' : 'Export DOCX (9.15.2)'}</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              data-testid="export-pdf-btn"
              disabled={isExportBlockedByHardGate}
              onClick={() => handleExport('pdf')}
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              <span>{isAr ? 'تصدير Vector PDF' : 'Export Vector PDF'}</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Document Switcher & Digital PDF Ingest Bar */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#CBD5E1] bg-[#FFFFFF] p-3 dark:border-[#334155] dark:bg-[#11131A]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-[#475569] dark:text-[#94A3B8]">
              {isAr ? 'نماذج الاستوديو الجاهزة:' : 'Studio Document Presets:'}
            </span>
            <Button
              variant={activeDoc.id === 'exec-contract-ar' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleSelectPreset('exec-contract-ar')}
            >
              <span>{isAr ? 'عقد عمل تنفيذي (RTL)' : 'Arabic Exec Contract (RTL)'}</span>
            </Button>
            <Button
              variant={activeDoc.id === 'board-report-en' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleSelectPreset('board-report-en')}
            >
              <span>{isAr ? 'مذكرة مجلس الإدارة (LTR)' : 'Board Financial Memo (LTR)'}</span>
            </Button>
            <Button
              variant={
                activeDoc.id === 'interrupted-draft-ar' ? 'primary' : 'outline'
              }
              size="sm"
              onClick={() => handleSelectPreset('interrupted-draft-ar')}
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              <span>
                {isAr
                  ? 'مسودة متوقفة (اختبار Continue Generation)'
                  : 'Interrupted Draft (Test Continue Generation)'}
              </span>
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleTestDigitalPdfExtract('digital')}
            >
              <FileUp className="h-3.5 w-3.5" aria-hidden="true" />
              <span>
                {isAr ? 'استخراج PDF رقمي (P01)' : 'Extract Digital PDF (P01)'}
              </span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleTestDigitalPdfExtract('scanned')}
            >
              <span>
                {isAr ? 'فحص PDF مصور (P03 OCR)' : 'Check Scanned PDF (P03 OCR)'}
              </span>
            </Button>
          </div>
        </div>

        {exportStatusBanner && (
          <div
            role="status"
            className="mb-4 flex items-center justify-between rounded-xl border border-[#A7F3D0] bg-[#ECFDF5] px-4 py-3 text-xs font-semibold text-[#047857] dark:border-[#065F46] dark:bg-[#064E3B] dark:text-[#34D399]"
          >
            <div className="flex items-center gap-2">
              <FileCheck2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{exportStatusBanner}</span>
            </div>
          </div>
        )}

        {pdfIngestResult && (
          <div
            role="status"
            className="mb-4 rounded-xl border border-[#CBD5E1] bg-[#FFFFFF] px-4 py-3 text-xs font-medium text-[#0F172A] dark:border-[#334155] dark:bg-[#11131A] dark:text-[#F8FAFC]"
          >
            {pdfIngestResult}
          </div>
        )}

        {activeDoc.requiresLegalDisclaimer && (
          <LegalDisclaimerBanner locale={locale} />
        )}

        {activeDoc.generationState.status === 'INTERRUPTED' && (
          <ContinueGenerationBanner
            locale={locale}
            completedBlocks={activeDoc.blocks.length}
            resumePrompt={activeDoc.generationState.resumeContextPrompt}
            isContinuing={isContinuing}
            onContinue={handleContinueGeneration}
          />
        )}

        {/* Phase 02: Multi-Agent Review & 14-Vector Quality Pulse Panel */}
        <MultiAgentReviewPanel
          document={activeDoc}
          locale={locale}
          onApplyDocumentChange={handleDocumentChange}
          onTokensUpdated={(used, reserved) => {
            setTokensUsed(used);
            setTokensReserved(reserved);
          }}
        />

        {/* Main Editor & Synchronized Paged Preview */}
        <TiptapStudioEditor
          document={activeDoc}
          onDocumentChange={handleDocumentChange}
          activeDirection={direction}
        />
      </main>
    </div>
  );
}
