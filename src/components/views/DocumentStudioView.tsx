'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Download,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  FileUp,
  Globe,
  Layers,
  ListTree,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
} from 'lucide-react';
import { Badge, Button, ThemeToggle } from '@/components/primitives';
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
import { paginateCdmDocument } from '@/lib/cdm/pagination-engine';
import { CdmDocument, DocumentLocale, TextDirection } from '@/lib/cdm/schema';
import { PRESET_DOCUMENTS } from '@/lib/cdm/presets';

/**
 * Layer 4 View: Document Studio View (`Mode B — SaaS / Product Utility`)
 * (`src/components/views/DocumentStudioView.tsx`)
 *
 * Enforces Section 8 (The Document Studio — The Most Important Experience) & Section 9:
 * 1. Top Command Bar (Section 8.1):
 *    - Document title, Autosave status, Independent Document Direction vs UI Shell Locale switcher,
 *      Token Quota Meter, Theme Toggle, and Export DOCX / Vector PDF controls (with Hard Gate tooltips).
 * 2. Collapsible Left Contextual Panel (Section 8.1):
 *    - Live Document Outline (H1/H2/H3 hierarchy), Page Navigation (A4 pages), and CDM Block Structure tree.
 *    - Collapsible on Desktop (`lg+`) and accessible via a dedicated Sheet/Drawer toggle on Mobile/Tablet.
 * 3. Collapsible AI & Quality Review Panel (Section 8.1, 8.4, 8.7):
 *    - Open by default so users and E2E tests have immediate access to Inline Diff Proposals, 14-Vector Quality Pulse,
 *      9 Bounded Agent Roles, and Provenance Citations, while allowing one-click collapse for distraction-free writing.
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

  // Studio Panels State
  const [isOutlineOpen, setIsOutlineOpen] = useState(true);
  const [isMobileOutlineDrawerOpen, setIsMobileOutlineDrawerOpen] =
    useState(false);
  const [isAiPanelExpanded, setIsAiPanelExpanded] = useState(true);

  const liveQualityGate = useMemo(
    () => evaluateDocumentQuality14Vectors(activeDoc),
    [activeDoc]
  );
  const pagination = useMemo(
    () => paginateCdmDocument(activeDoc),
    [activeDoc]
  );
  const isExportBlockedByHardGate = liveQualityGate.gateStatus === 'BLOCKED';

  const outlineItems = useMemo(
    () =>
      activeDoc.blocks.filter(
        (b) => b.type === 'heading' || b.type === 'table' || b.type === 'signature'
      ),
    [activeDoc.blocks]
  );

  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load document from persistent database / local store to guarantee zero data loss on F5 refresh
  useEffect(() => {
    let isMounted = true;
    async function loadDocument() {
      try {
        const docIdToLoad = initialDocId || defaultKey;
        const res = await fetch(`/api/documents/${docIdToLoad}`);
        if (res.ok) {
          const data = await res.json();
          if (data.ok && data.document && isMounted) {
            setActiveDoc(data.document);
            setDirection(data.document.defaultDirection);
          }
        }
      } catch {
        // Fall back to preset state if offline
      }
    }
    loadDocument();
    return () => {
      isMounted = false;
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [initialDocId, defaultKey]);

  const handleSelectPreset = (docKey: string) => {
    const next = structuredClone(PRESET_DOCUMENTS[docKey]);
    setActiveDoc(next);
    setDirection(next.defaultDirection);
    setExportStatusBanner(null);
    // Persist preset selection as active document state
    handleDocumentChange(next);
  };

  const handleDocumentChange = (updated: CdmDocument) => {
    setActiveDoc(updated);
    setAutosaveStatus('saving');

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/documents/${updated.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ document: updated }),
        });
        if (res.ok) {
          setAutosaveStatus('saved');
        } else {
          setAutosaveStatus('offline-indexeddb');
        }
      } catch {
        setAutosaveStatus('offline-indexeddb');
      }
    }, 300);
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
          ? `تم تصدير المستند بنجاح (${format.toUpperCase()}) — تم تجهيز الملف وتحميله مباشرة (معرف المهمة: ${data.job.id}).`
          : `Document exported successfully (${format.toUpperCase()}) — Binary generated and downloading (Job ID: ${data.job.id}).`
      );
      if (data.downloadUrl) {
        const a = document.createElement('a');
        a.href = data.downloadUrl;
        a.download = `${activeDoc.id}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
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
        fileName:
          mode === 'digital' ? 'contract-digital.pdf' : 'scanned-image.pdf',
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

  const scrollToBlockOrPage = (elementId: string) => {
    const el = document.getElementById(elementId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    setIsMobileOutlineDrawerOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] dark:bg-[#090A0F] dark:text-[#F8FAFC]">
      {/* Studio Top Command Bar (Section 8.1) */}
      <header className="sticky top-0 z-20 border-b border-[#CBD5E1] bg-[#FFFFFF]/95 backdrop-blur-xs dark:border-[#1E293B] dark:bg-[#11131A]/95">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href={`/${locale}/dashboard`}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4F46E5] font-bold text-[#FFFFFF]"
              aria-label={
                isAr ? 'العودة إلى لوحة المستندات' : 'Back to Dashboard'
              }
            >
              D
            </Link>

            {/* Desktop Outline Toggle */}
            <Button
              variant="outline"
              size="xs"
              data-testid="toggle-outline-panel-btn"
              onClick={() => setIsOutlineOpen((prev) => !prev)}
              className="hidden lg:inline-flex"
              aria-label={
                isAr
                  ? isOutlineOpen
                    ? 'إخفاء فهرس المستند'
                    : 'إظهار فهرس المستند'
                  : isOutlineOpen
                  ? 'Collapse Document Outline'
                  : 'Expand Document Outline'
              }
            >
              {isOutlineOpen ? (
                <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
              ) : (
                <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
              )}
              <span>{isAr ? 'الهيكل والفهرس' : 'Outline'}</span>
            </Button>

            {/* Mobile Outline Sheet Toggle */}
            <Button
              variant="outline"
              size="xs"
              data-testid="mobile-outline-drawer-btn"
              onClick={() => setIsMobileOutlineDrawerOpen((prev) => !prev)}
              className="lg:hidden"
            >
              <ListTree className="h-4 w-4" aria-hidden="true" />
              <span>{isAr ? 'الفهرس' : 'Outline'}</span>
            </Button>

            <div>
              <h1 className="line-clamp-1 max-w-md text-sm font-bold sm:text-base">
                {activeDoc.title}
              </h1>
              <div className="mt-0.5 flex flex-wrap items-center gap-2">
                <AutosaveStatusIndicator
                  status={autosaveStatus}
                  locale={locale}
                />
                <span
                  dir="ltr"
                  className="ltr-numeral text-xs text-[#475569] dark:text-[#94A3B8]"
                >
                  CDM v{activeDoc.cdmVersion} • UI: {locale.toUpperCase()} / Doc:{' '}
                  {direction.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Independent Document Direction Toggle (Section 9.1: Never force editor direction to equal shell direction) */}
            <BidiDirectionToggle
              direction={direction}
              onChange={(nextDir) => {
                setDirection(nextDir);
                setActiveDoc((prev) => ({
                  ...prev,
                  defaultDirection: nextDir,
                }));
              }}
              locale={locale}
            />

            <ThemeToggle locale={locale} />

            {/* Switch UI Shell Locale while preserving document */}
            <Link
              href={`/${isAr ? 'en' : 'ar'}/studio?doc=${activeDoc.id}`}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-[#CBD5E1] bg-[#FFFFFF] px-3 py-1.5 text-xs font-semibold text-[#0F172A] hover:bg-[#F1F5F9] dark:border-[#334155] dark:bg-[#11131A] dark:text-[#F8FAFC]"
              title={
                isAr
                  ? 'تغيير لغة الواجهة إلى الإنجليزية دون المساس باتجاه المستند'
                  : 'Switch UI shell language without altering document direction'
              }
            >
              <Globe className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{isAr ? 'UI: EN' : 'UI: AR'}</span>
            </Link>

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
              title={
                isExportBlockedByHardGate
                  ? isAr
                    ? 'التصدير معطل بسبب بوابة الجودة الصارمة (Hard Gate: BLOCKED)'
                    : 'Export disabled due to Hard Gate BLOCKED status'
                  : isAr
                  ? 'تصدير ملف Word OOXML أصلي (docx@9.15.2)'
                  : 'Export native Word OOXML (docx@9.15.2)'
              }
              onClick={() => handleExport('docx')}
            >
              <FileSpreadsheet
                className="h-4 w-4 text-[#4F46E5]"
                aria-hidden="true"
              />
              <span>{isAr ? 'تصدير DOCX (9.15.2)' : 'Export DOCX (9.15.2)'}</span>
            </Button>

            <Button
              variant="primary"
              size="sm"
              data-testid="export-pdf-btn"
              disabled={isExportBlockedByHardGate}
              title={
                isExportBlockedByHardGate
                  ? isAr
                    ? 'التصدير معطل بسبب بوابة الجودة الصارمة (Hard Gate: BLOCKED)'
                    : 'Export disabled due to Hard Gate BLOCKED status'
                  : isAr
                  ? 'تصدير ملف Vector PDF مطابق لصفحات A4'
                  : 'Export Vector PDF matching A4 pages'
              }
              onClick={() => handleExport('pdf')}
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              <span>{isAr ? 'تصدير Vector PDF' : 'Export Vector PDF'}</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Outline Sheet Overlay (Section 12 Responsive Design) */}
      {isMobileOutlineDrawerOpen && (
        <div
          role="dialog"
          aria-label={isAr ? 'فهرس المستند والتنقل' : 'Document Outline Sheet'}
          data-testid="mobile-outline-sheet"
          className="fixed inset-x-0 top-16 z-30 mx-4 rounded-2xl border border-[#CBD5E1] bg-[#FFFFFF] p-4 shadow-xl lg:hidden dark:border-[#334155] dark:bg-[#11131A]"
        >
          <div className="mb-3 flex items-center justify-between border-b border-[#E2E8F0] pb-2 dark:border-[#1E293B]">
            <span className="text-xs font-bold">
              {isAr ? 'فهرس المستند وصفحات A4' : 'Document Outline & A4 Pages'}
            </span>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setIsMobileOutlineDrawerOpen(false)}
            >
              {isAr ? 'إغلاق' : 'Close'}
            </Button>
          </div>
          <ul className="space-y-1.5 text-xs">
            {outlineItems.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => scrollToBlockOrPage(`preview-block-${item.id}`)}
                  className="w-full rounded-lg px-2.5 py-1.5 text-start font-medium hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B]"
                >
                  {item.type === 'heading'
                    ? `H${item.level}: ${item.text}`
                    : item.type === 'table'
                    ? `جدول / Table: ${item.caption ?? item.id}`
                    : `توقيع / Signature`}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <main className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6 space-y-4">
        {/* Document Switcher, Digital PDF Ingest Bar & AI Assistant Collapse Control */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#CBD5E1] bg-[#FFFFFF] p-3 shadow-xs dark:border-[#334155] dark:bg-[#11131A]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-[#475569] dark:text-[#94A3B8]">
              {isAr ? 'نماذج الاستوديو الجاهزة:' : 'Studio Document Presets:'}
            </span>
            <Button
              variant={
                activeDoc.id === 'exec-contract-ar' ? 'primary' : 'outline'
              }
              size="xs"
              onClick={() => handleSelectPreset('exec-contract-ar')}
            >
              <span>
                {isAr ? 'عقد عمل تنفيذي (RTL)' : 'Arabic Exec Contract (RTL)'}
              </span>
            </Button>
            <Button
              variant={
                activeDoc.id === 'board-report-en' ? 'primary' : 'outline'
              }
              size="xs"
              onClick={() => handleSelectPreset('board-report-en')}
            >
              <span>
                {isAr
                  ? 'مذكرة مجلس الإدارة (LTR)'
                  : 'Board Financial Memo (LTR)'}
              </span>
            </Button>
            <Button
              variant={
                activeDoc.id === 'interrupted-draft-ar' ? 'primary' : 'outline'
              }
              size="xs"
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
              size="xs"
              onClick={() => handleTestDigitalPdfExtract('digital')}
            >
              <FileUp className="h-3.5 w-3.5" aria-hidden="true" />
              <span>
                {isAr ? 'استخراج PDF رقمي (P01)' : 'Extract Digital PDF (P01)'}
              </span>
            </Button>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => handleTestDigitalPdfExtract('scanned')}
            >
              <span>
                {isAr ? 'فحص PDF مصور (P03 OCR)' : 'Check Scanned PDF (P03 OCR)'}
              </span>
            </Button>

            <span
              className="mx-1 h-4 w-px bg-[#CBD5E1] dark:bg-[#334155]"
              aria-hidden="true"
            />

            <Button
              variant="outline"
              size="xs"
              data-testid="toggle-ai-review-panel-btn"
              onClick={() => setIsAiPanelExpanded((prev) => !prev)}
            >
              {isAiPanelExpanded ? (
                <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span>
                {isAiPanelExpanded
                  ? isAr
                    ? 'طي لوحة الذكاء والجودة'
                    : 'Collapse AI & Quality Panel'
                  : isAr
                  ? 'فتح لوحة الذكاء والجودة'
                  : 'Expand AI & Quality Panel'}
              </span>
            </Button>
          </div>
        </div>

        {/* Status Banners */}
        {exportStatusBanner && (
          <div
            role="status"
            className="flex items-center justify-between rounded-xl border border-[#A7F3D0] bg-[#ECFDF5] px-4 py-3 text-xs font-semibold text-[#047857] dark:border-[#065F46] dark:bg-[#064E3B] dark:text-[#34D399]"
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
            className="rounded-xl border border-[#CBD5E1] bg-[#FFFFFF] px-4 py-3 text-xs font-medium text-[#0F172A] dark:border-[#334155] dark:bg-[#11131A] dark:text-[#F8FAFC]"
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

        {/* Studio Multi-Panel Workspace (Left Collapsible Document Outline + Center Canvas & AI Inspector) */}
        <div
          className={`grid items-start gap-5 ${
            isOutlineOpen ? 'lg:grid-cols-12' : 'grid-cols-1'
          }`}
        >
          {/* Left Contextual Panel: Document Outline, Structure & A4 Page Navigation (Section 8.1) */}
          {isOutlineOpen && (
            <aside
              aria-label={
                isAr
                  ? 'الفهرس الهيكلي والتنقل بين الصفحات'
                  : 'Document Outline and Page Navigation'
              }
              data-testid="studio-left-outline-panel"
              className="hidden lg:block lg:col-span-3 space-y-4 rounded-2xl border border-[#CBD5E1] bg-[#FFFFFF] p-4 shadow-xs sticky top-20 dark:border-[#334155] dark:bg-[#11131A]"
            >
              {/* 1. Heading & Section Outline */}
              <div>
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5 text-xs font-bold text-[#0F172A] dark:border-[#1E293B] dark:text-[#F8FAFC]">
                  <span className="inline-flex items-center gap-1.5">
                    <ListTree
                      className="h-4 w-4 text-[#4F46E5] dark:text-[#818CF8]"
                      aria-hidden="true"
                    />
                    <span>
                      {isAr ? 'فهرس الأقسام والعناوين' : 'Document Outline'}
                    </span>
                  </span>
                  <Badge tone="neutral">{outlineItems.length}</Badge>
                </div>

                <ul className="mt-2.5 space-y-1 text-xs">
                  {outlineItems.map((item) => {
                    const isHeading = item.type === 'heading';
                    const indent =
                      isHeading && item.level === 2
                        ? 'ps-3'
                        : isHeading && item.level === 3
                        ? 'ps-5'
                        : '';
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() =>
                            scrollToBlockOrPage(`preview-block-${item.id}`)
                          }
                          className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-start transition-colors hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B] cursor-pointer ${indent}`}
                        >
                          <span className="line-clamp-1 font-medium text-[#334155] dark:text-[#CBD5E1]">
                            {item.type === 'heading'
                              ? item.text
                              : item.type === 'table'
                              ? item.caption ?? 'Table'
                              : isAr
                              ? 'كتلة التوقيعات الرسمية'
                              : 'Signature Block'}
                          </span>
                          <span className="shrink-0 rounded bg-[#F1F5F9] px-1.5 py-0.5 text-[10px] font-bold uppercase text-[#475569] dark:bg-[#1E293B] dark:text-[#94A3B8]">
                            {item.type === 'heading'
                              ? `H${item.level}`
                              : item.type === 'table'
                              ? 'TBL'
                              : 'SIG'}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* 2. A4 Page Navigation */}
              <div className="border-t border-[#E2E8F0] pt-3.5 dark:border-[#1E293B]">
                <div className="flex items-center justify-between text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                  <span className="inline-flex items-center gap-1.5">
                    <BookOpen
                      className="h-4 w-4 text-[#047857] dark:text-[#34D399]"
                      aria-hidden="true"
                    />
                    <span>
                      {isAr ? 'صفحات الطباعة (A4)' : 'A4 Print Pages'}
                    </span>
                  </span>
                  <span dir="ltr" className="ltr-numeral text-[#475569]">
                    {pagination.pages.length}
                  </span>
                </div>

                <div className="mt-2.5 grid grid-cols-2 gap-2">
                  {pagination.pages.map((pg) => (
                    <button
                      key={pg.pageNumber}
                      type="button"
                      onClick={() =>
                        scrollToBlockOrPage(`studio-a4-page-${pg.pageNumber}`)
                      }
                      className="flex flex-col items-start rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-2.5 text-xs transition-colors hover:border-[#4F46E5] dark:border-[#334155] dark:bg-[#090A0F] cursor-pointer"
                    >
                      <span className="font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                        {isAr ? `صفحة ${pg.pageNumber}` : `Page ${pg.pageNumber}`}
                      </span>
                      <span className="mt-0.5 text-[11px] text-[#475569] dark:text-[#94A3B8] tabular-nums">
                        {pg.fragments.length}{' '}
                        {isAr ? 'عناصر' : 'fragments'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Document Metadata & Direction Status */}
              <div className="border-t border-[#E2E8F0] pt-3.5 text-xs dark:border-[#1E293B]">
                <div className="font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                  {isAr ? 'خصائص المستند (CDM AST)' : 'Document AST Metadata'}
                </div>
                <dl className="mt-2 space-y-1.5 text-[#475569] dark:text-[#94A3B8]">
                  <div className="flex justify-between">
                    <dt>{isAr ? 'إجمالي الكتل:' : 'Total CDM Blocks:'}</dt>
                    <dd className="font-bold text-[#0F172A] dark:text-[#F8FAFC] tabular-nums">
                      {activeDoc.blocks.length}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>{isAr ? 'اتجاه المستند:' : 'Document Direction:'}</dt>
                    <dd className="font-bold uppercase text-[#0F172A] dark:text-[#F8FAFC]">
                      {direction}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>{isAr ? 'حجم الورق:' : 'Paper Size:'}</dt>
                    <dd
                      dir="ltr"
                      className="ltr-numeral font-bold text-[#0F172A] dark:text-[#F8FAFC]"
                    >
                      {activeDoc.pageSetup.paperSize} (210×297mm)
                    </dd>
                  </div>
                </dl>
              </div>
            </aside>
          )}

          {/* Main Studio Column: AI Assistant & Quality Inspector + Dual Editor/Preview */}
          <div
            className={`space-y-5 ${
              isOutlineOpen ? 'lg:col-span-9' : 'col-span-1'
            }`}
          >
            {isAiPanelExpanded && (
              <MultiAgentReviewPanel
                document={activeDoc}
                locale={locale}
                onApplyDocumentChange={handleDocumentChange}
                onTokensUpdated={(used, reserved) => {
                  setTokensUsed(used);
                  setTokensReserved(reserved);
                }}
              />
            )}

            <TiptapStudioEditor
              document={activeDoc}
              onDocumentChange={handleDocumentChange}
              activeDirection={direction}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
