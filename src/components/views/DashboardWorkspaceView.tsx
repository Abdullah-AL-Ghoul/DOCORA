'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  FilePlus2,
  FileText,
  FileUp,
  FolderOpen,
  Globe,
  LayoutGrid,
  List,
  RotateCcw,
  Search,
  Sparkles,
  Star,
  Trash2,
  XCircle,
} from 'lucide-react';
import {
  Badge,
  Button,
  NativeDestructiveDialog,
  SegmentedControl,
  ThemeToggle,
} from '@/components/primitives';
import { TokenQuotaMeter } from '@/components/composites';
import { CdmDocument, DocumentCategory, DocumentLocale } from '@/lib/cdm/schema';
import { PRESET_DOCUMENTS } from '@/lib/cdm/presets';

/**
 * Layer 4 View: Dashboard Workspace View (`Mode B — SaaS Utility`)
 * (`src/components/views/DashboardWorkspaceView.tsx`)
 *
 * Enforces Section 7 & `product-design-ux` rules:
 * 1. Clear New Document Creation Paths (Section 7.2):
 *    - Start Blank, Generate with AI, Use a Template, Import a Digital PDF.
 * 2. Practical Document Library (Section 7.3):
 *    - Search, Category Filtering (`all`, `legal`, `financial`, `executive`), Favorites/Pinning, Grid vs List view toggle.
 * 3. Three distinct Empty States (`rule/cover-reachable-states`):
 *    - `first-use`: New workspace with starter templates and `"إنشاء مستند جديد"` / `"Create new document"`.
 *    - `no-search-results`: Search query with 0 matches + `"مسح البحث"` / `"Clear search"`.
 *    - `empty-trash`: Clean trash view when no soft-deleted documents exist.
 * 4. Proportional Destructive Action Semantics (`rule/destructive-proportional`, `rule/destructive-names-action`):
 *    - Moving a document to Trash is reversible and happens immediately with an inline Undo banner (NO confirmation modal).
 *    - Permanent deletion inside Trash requires a native `<dialog>` whose button explicitly names the action (`"حذف المستند نهائياً"` / `"Delete document permanently"`).
 */

type WorkspaceTab = 'active' | 'trash' | 'empty-demo';
type CategoryFilter = 'all' | DocumentCategory;
type LibraryViewMode = 'grid' | 'list';

interface ManagedDocumentItem {
  doc: CdmDocument;
  trashed: boolean;
  pinned: boolean;
  updatedAtLabel: string;
}

export function DashboardWorkspaceView({ locale }: { locale: DocumentLocale }) {
  const isAr = locale === 'ar';
  const [tab, setTab] = useState<WorkspaceTab>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [onlyPinned, setOnlyPinned] = useState(false);
  const [viewMode, setViewMode] = useState<LibraryViewMode>('grid');
  const [lastTrashedId, setLastTrashedId] = useState<string | null>(null);
  const [pendingPermanentDelete, setPendingPermanentDelete] =
    useState<ManagedDocumentItem | null>(null);

  const [items, setItems] = useState<ManagedDocumentItem[]>(() =>
    Object.values(PRESET_DOCUMENTS).map((doc, idx) => ({
      doc,
      trashed: false,
      pinned: idx === 0,
      updatedAtLabel: '2026-11-08 11:00 UTC',
    }))
  );

  const activeItems = useMemo(
    () =>
      items.filter((item) => {
        if (item.trashed) return false;
        if (onlyPinned && !item.pinned) return false;
        if (categoryFilter !== 'all' && item.doc.category !== categoryFilter) {
          return false;
        }
        return item.doc.title
          .toLowerCase()
          .includes(searchQuery.trim().toLowerCase());
      }),
    [items, searchQuery, categoryFilter, onlyPinned]
  );

  const trashedItems = useMemo(
    () => items.filter((item) => item.trashed),
    [items]
  );

  const handleTogglePin = (docId: string) => {
    setItems((prev) =>
      prev.map((it) => (it.doc.id === docId ? { ...it, pinned: !it.pinned } : it))
    );
  };

  const handleMoveToTrash = (docId: string) => {
    setItems((prev) =>
      prev.map((it) => (it.doc.id === docId ? { ...it, trashed: true } : it))
    );
    setLastTrashedId(docId);
  };

  const handleUndoTrash = (docId: string) => {
    setItems((prev) =>
      prev.map((it) => (it.doc.id === docId ? { ...it, trashed: false } : it))
    );
    if (lastTrashedId === docId) {
      setLastTrashedId(null);
    }
  };

  const handleConfirmPermanentDelete = () => {
    if (!pendingPermanentDelete) return;
    const targetId = pendingPermanentDelete.doc.id;
    setItems((prev) => prev.filter((it) => it.doc.id !== targetId));
    setPendingPermanentDelete(null);
  };

  const categoryLabels: Record<DocumentCategory, { ar: string; en: string }> = {
    general: { ar: 'عام', en: 'General' },
    legal: { ar: 'قانوني وعقود', en: 'Legal & Contracts' },
    executive: { ar: 'تنفيذي ومذكرات', en: 'Executive' },
    financial: { ar: 'مالي وتقارير', en: 'Financial' },
    technical: { ar: 'تقني وهندسي', en: 'Technical' },
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] dark:bg-[#090A0F] dark:text-[#F8FAFC]">
      <header className="sticky top-0 z-20 border-b border-[#CBD5E1] bg-[#FFFFFF]/95 backdrop-blur-xs dark:border-[#1E293B] dark:bg-[#11131A]/95">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              href={`/${locale}`}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4F46E5] font-bold text-[#FFFFFF]"
            >
              D
            </Link>
            <div>
              <h1 className="text-base font-bold sm:text-lg">
                {isAr ? 'لوحة إدارة المستندات (DOCORA Workspace)' : 'DOCORA Document Workspace'}
              </h1>
              <p className="text-xs text-[#475569] dark:text-[#94A3B8]">
                {isAr
                  ? 'عزل كامل للمستأجرين عبر RLS و DAL — شجرة مستندات CDM v1.2'
                  : 'Tenant-isolated via PostgreSQL RLS & DAL — CDM v1.2 Document Library'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <ThemeToggle locale={locale} />
            <Link
              href={isAr ? '/en/dashboard' : '/ar/dashboard'}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-[#CBD5E1] bg-[#FFFFFF] px-3 py-2 text-xs font-semibold text-[#0F172A] hover:bg-[#F1F5F9] dark:border-[#334155] dark:bg-[#11131A] dark:text-[#F8FAFC]"
            >
              <Globe className="h-4 w-4" aria-hidden="true" />
              <span>{isAr ? 'English (LTR)' : 'العربية (RTL)'}</span>
            </Link>
            <TokenQuotaMeter
              used={7900}
              reserved={0}
              limit={50000}
              locale={locale}
            />
            <Link
              href={`/${locale}/studio`}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#4F46E5] px-4 py-2 text-sm font-semibold text-[#FFFFFF] hover:bg-[#4338CA]"
            >
              <FilePlus2 className="h-4 w-4" aria-hidden="true" />
              <span>{isAr ? 'إنشاء مستند جديد' : 'Create new document'}</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Section 7.2: 4 Clear Document Creation Paths */}
        <section
          aria-label={isAr ? 'مسارات إنشاء مستند جديد' : 'New Document Creation Paths'}
          data-testid="creation-paths-grid"
          className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4"
        >
          <Link
            href={`/${locale}/studio?doc=exec-contract-ar`}
            className="group flex items-start gap-3.5 rounded-2xl border border-[#CBD5E1] bg-[#FFFFFF] p-4 shadow-xs transition-colors hover:border-[#4F46E5] dark:border-[#334155] dark:bg-[#11131A]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#4338CA] dark:bg-[#1E1B4B] dark:text-[#818CF8]">
              <FilePlus2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <div className="text-sm font-bold group-hover:text-[#4F46E5] dark:group-hover:text-[#818CF8]">
                {isAr ? 'بدء مستند مهيكل جديد' : 'Start Structured Document'}
              </div>
              <p className="mt-0.5 text-xs text-[#475569] dark:text-[#94A3B8]">
                {isAr
                  ? 'افتح محرر A4 ثنائي الاتجاه مع شجرة CDM v1.2'
                  : 'Open bidirectional A4 editor with CDM v1.2 AST'}
              </p>
            </div>
          </Link>

          <Link
            href={`/${locale}/studio?doc=interrupted-draft-ar`}
            className="group flex items-start gap-3.5 rounded-2xl border border-[#CBD5E1] bg-[#FFFFFF] p-4 shadow-xs transition-colors hover:border-[#4F46E5] dark:border-[#334155] dark:bg-[#11131A]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#4338CA] dark:bg-[#1E1B4B] dark:text-[#818CF8]">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <div className="text-sm font-bold group-hover:text-[#4F46E5] dark:group-hover:text-[#818CF8]">
                {isAr ? 'توليد واستكمال بالذكاء الاصطناعي' : 'Generate & Continue with AI'}
              </div>
              <p className="mt-0.5 text-xs text-[#475569] dark:text-[#94A3B8]">
                {isAr
                  ? 'بناء الأقسام ومراجعة الوكلاء الـ 9'
                  : 'Draft sections with 9-role agent review'}
              </p>
            </div>
          </Link>

          <Link
            href={`/${locale}/studio?doc=board-report-en`}
            className="group flex items-start gap-3.5 rounded-2xl border border-[#CBD5E1] bg-[#FFFFFF] p-4 shadow-xs transition-colors hover:border-[#4F46E5] dark:border-[#334155] dark:bg-[#11131A]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ECFDF5] text-[#047857] dark:bg-[#064E3B] dark:text-[#34D399]">
              <FileText className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <div className="text-sm font-bold group-hover:text-[#4F46E5] dark:group-hover:text-[#818CF8]">
                {isAr ? 'استخدام قالب مؤسسي معتمد' : 'Use Verified Institutional Template'}
              </div>
              <p className="mt-0.5 text-xs text-[#475569] dark:text-[#94A3B8]">
                {isAr
                  ? 'عقود تنفيذية ومذكرات مجلس إدارة جاهزة'
                  : 'Executive contracts & financial board memos'}
              </p>
            </div>
          </Link>

          <Link
            href={`/${locale}/studio?doc=exec-contract-ar`}
            className="group flex items-start gap-3.5 rounded-2xl border border-[#CBD5E1] bg-[#FFFFFF] p-4 shadow-xs transition-colors hover:border-[#4F46E5] dark:border-[#334155] dark:bg-[#11131A]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFFBEB] text-[#92400E] dark:bg-[#451A03] dark:text-[#FBBF24]">
              <FileUp className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <div className="text-sm font-bold group-hover:text-[#4F46E5] dark:group-hover:text-[#818CF8]">
                {isAr ? 'استيراد واستخراج PDF رقمي' : 'Import & Extract Digital PDF'}
              </div>
              <p className="mt-0.5 text-xs text-[#475569] dark:text-[#94A3B8]">
                {isAr
                  ? 'استخراج الفقرات الرقمية عبر pdfjs-dist'
                  : 'Extract digital PDF text with provenance'}
              </p>
            </div>
          </Link>
        </section>

        {/* Reversible Trash Undo Banner (rule/destructive-proportional) */}
        {lastTrashedId && (
          <div
            role="status"
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#CBD5E1] bg-[#FFFFFF] px-4 py-3 text-sm shadow-xs dark:border-[#334155] dark:bg-[#11131A]"
          >
            <span>
              {isAr
                ? 'تم نقل المستند إلى سلة المحذوفات (يُحفظ لمدة 30 يوماً).'
                : 'Document moved to Trash (retained for 30 days).'}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleUndoTrash(lastTrashedId)}
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              <span>{isAr ? 'استعادة المستند الآن' : 'Undo & Restore'}</span>
            </Button>
          </div>
        )}

        {/* Controls Bar: Workspace Tabs + Search + Category Filter + View Mode */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <SegmentedControl<WorkspaceTab>
              ariaLabel={isAr ? 'تبويبات مساحة العمل' : 'Workspace Tabs'}
              value={tab}
              onChange={setTab}
              options={[
                {
                  value: 'active',
                  label: isAr
                    ? `المستندات النشطة (${items.filter((i) => !i.trashed).length})`
                    : `Active Documents (${items.filter((i) => !i.trashed).length})`,
                },
                {
                  value: 'trash',
                  label: isAr
                    ? `سلة المحذوفات (${trashedItems.length})`
                    : `Trash (${trashedItems.length})`,
                },
                {
                  value: 'empty-demo',
                  label: isAr ? 'معاينة حالة المستخدم الجديد' : 'First-Use Empty State',
                },
              ]}
            />

            {tab === 'active' && (
              <div className="flex flex-wrap items-center gap-2.5 flex-1 sm:justify-end">
                <div className="relative flex-1 sm:max-w-xs">
                  <label htmlFor="dashboard-search" className="sr-only">
                    {isAr ? 'ابحث في المستندات' : 'Search documents'}
                  </label>
                  <Search
                    className="pointer-events-none absolute top-3.5 start-3 h-4 w-4 text-[#475569]"
                    aria-hidden="true"
                  />
                  <input
                    id="dashboard-search"
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      isAr ? 'ابحث بعنوان المستند...' : 'Search by document title...'
                    }
                    className="min-h-11 w-full rounded-lg border border-[#CBD5E1] bg-[#FFFFFF] ps-9 pe-3 text-sm text-[#0F172A] focus:outline-2 focus:outline-[#4F46E5] dark:border-[#334155] dark:bg-[#11131A] dark:text-[#F8FAFC]"
                  />
                </div>

                {/* Grid / List View Switcher */}
                <div
                  role="group"
                  aria-label={isAr ? 'نمط عرض المكتبة' : 'Library View Mode'}
                  className="inline-flex rounded-lg border border-[#CBD5E1] bg-[#FFFFFF] p-1 dark:border-[#334155] dark:bg-[#11131A]"
                >
                  <button
                    type="button"
                    aria-label={isAr ? 'عرض شبكي' : 'Grid view'}
                    aria-pressed={viewMode === 'grid'}
                    onClick={() => setViewMode('grid')}
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-md cursor-pointer ${
                      viewMode === 'grid'
                        ? 'bg-[#EEF2FF] text-[#4338CA] dark:bg-[#1E1B4B] dark:text-[#818CF8]'
                        : 'text-[#475569] dark:text-[#94A3B8]'
                    }`}
                  >
                    <LayoutGrid className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label={isAr ? 'عرض قائمة' : 'List view'}
                    aria-pressed={viewMode === 'list'}
                    onClick={() => setViewMode('list')}
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-md cursor-pointer ${
                      viewMode === 'list'
                        ? 'bg-[#EEF2FF] text-[#4338CA] dark:bg-[#1E1B4B] dark:text-[#818CF8]'
                        : 'text-[#475569] dark:text-[#94A3B8]'
                    }`}
                  >
                    <List className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Category & Favorites Filter Pills */}
          {tab === 'active' && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold text-[#475569] dark:text-[#94A3B8]">
                {isAr ? 'تصفية حسب الفئة:' : 'Filter by category:'}
              </span>
              {(['all', 'legal', 'financial', 'executive'] as CategoryFilter[]).map((cat) => {
                const active = categoryFilter === cat;
                const label =
                  cat === 'all'
                    ? isAr
                      ? 'الكل'
                      : 'All Categories'
                    : isAr
                    ? categoryLabels[cat].ar
                    : categoryLabels[cat].en;
                return (
                  <button
                    key={cat}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setCategoryFilter(cat)}
                    className={`min-h-9 rounded-full border px-3 py-1 font-semibold transition-colors cursor-pointer ${
                      active
                        ? 'border-[#4F46E5] bg-[#EEF2FF] text-[#4338CA] dark:border-[#818CF8] dark:bg-[#1E1B4B] dark:text-[#818CF8]'
                        : 'border-[#CBD5E1] bg-[#FFFFFF] text-[#475569] hover:bg-[#F1F5F9] dark:border-[#334155] dark:bg-[#11131A] dark:text-[#94A3B8]'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}

              <button
                type="button"
                aria-pressed={onlyPinned}
                onClick={() => setOnlyPinned((prev) => !prev)}
                className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 py-1 font-semibold transition-colors cursor-pointer ${
                  onlyPinned
                    ? 'border-[#F59E0B] bg-[#FFFBEB] text-[#92400E] dark:border-[#FBBF24] dark:bg-[#451A03] dark:text-[#FBBF24]'
                    : 'border-[#CBD5E1] bg-[#FFFFFF] text-[#475569] hover:bg-[#F1F5F9] dark:border-[#334155] dark:bg-[#11131A] dark:text-[#94A3B8]'
                }`}
              >
                <Star className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{isAr ? 'المثبتة فقط' : 'Pinned Only'}</span>
              </button>
            </div>
          )}
        </div>

        {/* State 1: First-Use Empty State */}
        {tab === 'empty-demo' && (
          <section
            data-testid="empty-state-first-use"
            className="rounded-2xl border border-dashed border-[#CBD5E1] bg-[#FFFFFF] p-10 text-center dark:border-[#334155] dark:bg-[#11131A]"
          >
            <FolderOpen
              className="mx-auto h-10 w-10 text-[#4F46E5] dark:text-[#818CF8]"
              aria-hidden="true"
            />
            <h2 className="mt-4 text-lg font-bold">
              {isAr ? 'ابدأ مستندك القياسي الأول' : 'Start your first structured document'}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#475569] dark:text-[#94A3B8]">
              {isAr
                ? 'اختر قالباً قانونياً أو تنفيذياً ثنائي الاتجاه أو أنشئ مستنداً فارغاً بمعاينة صفحات A4 حية.'
                : 'Choose a bidirectional legal or executive template or create a blank A4 document.'}
            </p>
            <div className="mt-6 flex justify-center">
              <Link
                href={`/${locale}/studio`}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#4F46E5] px-5 py-2.5 text-sm font-semibold text-[#FFFFFF] hover:bg-[#4338CA]"
              >
                <FilePlus2 className="h-4 w-4" aria-hidden="true" />
                <span>{isAr ? 'إنشاء مستند جديد' : 'Create new document'}</span>
              </Link>
            </div>
          </section>
        )}

        {/* Active Tab: Populated or State 2 (No Search Results) */}
        {tab === 'active' && (
          <>
            {activeItems.length === 0 ? (
              <section
                data-testid="empty-state-no-search-results"
                className="rounded-2xl border border-dashed border-[#CBD5E1] bg-[#FFFFFF] p-10 text-center dark:border-[#334155] dark:bg-[#11131A]"
              >
                <XCircle
                  className="mx-auto h-10 w-10 text-[#475569] dark:text-[#94A3B8]"
                  aria-hidden="true"
                />
                <h2 className="mt-4 text-lg font-bold">
                  {isAr
                    ? 'لا توجد مستندات مطابقة لعبارة البحث'
                    : 'No documents match your search query'}
                </h2>
                <p className="mt-1 text-sm text-[#475569] dark:text-[#94A3B8]">
                  {isAr
                    ? `لم نعثر على نتائج تطابق "${searchQuery}".`
                    : `No matches found for "${searchQuery}".`}
                </p>
                <div className="mt-5">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery('');
                      setCategoryFilter('all');
                      setOnlyPinned(false);
                    }}
                  >
                    {isAr ? 'مسح البحث وعرض الكل' : 'Clear search query'}
                  </Button>
                </div>
              </section>
            ) : (
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid gap-5 md:grid-cols-2 lg:grid-cols-3'
                    : 'space-y-3'
                }
              >
                {activeItems.map(({ doc, pinned, updatedAtLabel }) => (
                  <article
                    key={doc.id}
                    className={`flex flex-col justify-between rounded-2xl border border-[#CBD5E1] bg-[#FFFFFF] p-5 shadow-xs transition-shadow hover:shadow-sm dark:border-[#334155] dark:bg-[#11131A] ${
                      viewMode === 'list' ? 'sm:flex-row sm:items-center sm:gap-6' : ''
                    }`}
                  >
                    <div className="space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge
                            tone={
                              doc.generationState.status === 'INTERRUPTED'
                                ? 'warning'
                                : 'verified'
                            }
                          >
                            {doc.generationState.status === 'INTERRUPTED'
                              ? isAr
                                ? 'توليد متوقف (قابل للاستكمال)'
                                : 'Interrupted (Continuable)'
                              : isAr
                              ? 'مكتمل ومفحوص ✓'
                              : 'Verified CDM v1.2 ✓'}
                          </Badge>
                          <Badge tone="neutral">
                            {isAr
                              ? categoryLabels[doc.category].ar
                              : categoryLabels[doc.category].en}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleTogglePin(doc.id)}
                            aria-label={
                              isAr
                                ? pinned
                                  ? `إلغاء تثبيت ${doc.title}`
                                  : `تثبيت ${doc.title}`
                                : pinned
                                ? `Unpin ${doc.title}`
                                : `Pin ${doc.title}`
                            }
                            className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border cursor-pointer ${
                              pinned
                                ? 'border-[#FDE68A] bg-[#FFFBEB] text-[#B45309] dark:border-[#78350F] dark:bg-[#451A03] dark:text-[#FBBF24]'
                                : 'border-transparent text-[#64748B] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B]'
                            }`}
                          >
                            <Star className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <span className="rounded bg-[#F1F5F9] px-2 py-0.5 text-xs font-bold uppercase text-[#475569] dark:bg-[#1E293B] dark:text-[#94A3B8]">
                            {doc.defaultDirection.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <h2 className="line-clamp-2 text-base font-bold">
                        {doc.title}
                      </h2>
                      <p className="text-xs text-[#475569] dark:text-[#94A3B8] tabular-nums">
                        <span dir="ltr" className="ltr-numeral">
                          {updatedAtLabel}
                        </span>{' '}
                        • {doc.blocks.length}{' '}
                        {isAr ? 'كتل مهيكلة' : 'CDM blocks'} • {doc.pageSetup.paperSize}
                      </p>
                    </div>

                    <div
                      className={`flex items-center justify-between gap-2 ${
                        viewMode === 'grid'
                          ? 'mt-5 border-t border-[#E2E8F0] pt-4 dark:border-[#1E293B]'
                          : 'mt-4 sm:mt-0 shrink-0'
                      }`}
                    >
                      <Link
                        href={`/${locale}/studio?doc=${doc.id}`}
                        className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-[#4F46E5] px-3.5 py-2 text-xs font-semibold text-[#FFFFFF] hover:bg-[#4338CA]"
                      >
                        <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{isAr ? 'فتح في الاستوديو' : 'Open in Studio'}</span>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={
                          isAr
                            ? `نقل ${doc.title} إلى سلة المحذوفات`
                            : `Move ${doc.title} to Trash`
                        }
                        onClick={() => handleMoveToTrash(doc.id)}
                      >
                        <Trash2 className="h-4 w-4 text-[#475569]" aria-hidden="true" />
                        <span>{isAr ? 'نقل للسلة' : 'Trash'}</span>
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}

        {/* State 3: Trash Tab (Empty Trash vs Populated Trash with Permanent Delete Dialog) */}
        {tab === 'trash' && (
          <>
            {trashedItems.length === 0 ? (
              <section
                data-testid="empty-state-trash"
                className="rounded-2xl border border-dashed border-[#CBD5E1] bg-[#FFFFFF] p-10 text-center dark:border-[#334155] dark:bg-[#11131A]"
              >
                <Trash2
                  className="mx-auto h-10 w-10 text-[#475569] dark:text-[#94A3B8]"
                  aria-hidden="true"
                />
                <h2 className="mt-4 text-lg font-bold">
                  {isAr ? 'سلة المحذوفات فارغة' : 'Trash is empty'}
                </h2>
                <p className="mt-1 text-sm text-[#475569] dark:text-[#94A3B8]">
                  {isAr
                    ? 'لا توجد مستندات محذوفة مؤقتاً في مساحة عملك.'
                    : 'No soft-deleted documents in your workspace.'}
                </p>
              </section>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {trashedItems.map((item) => (
                  <article
                    key={item.doc.id}
                    className="flex flex-col justify-between rounded-2xl border border-[#CBD5E1] bg-[#FFFFFF] p-5 dark:border-[#334155] dark:bg-[#11131A]"
                  >
                    <div>
                      <Badge tone="warning">
                        {isAr ? 'في سلة المحذوفات' : 'In Trash'}
                      </Badge>
                      <h2 className="mt-3 text-base font-bold">{item.doc.title}</h2>
                    </div>
                    <div className="mt-5 flex items-center justify-between gap-2 border-t border-[#E2E8F0] pt-4 dark:border-[#1E293B]">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUndoTrash(item.doc.id)}
                      >
                        <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{isAr ? 'استعادة المستند' : 'Restore Document'}</span>
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setPendingPermanentDelete(item)}
                      >
                        <span>
                          {isAr ? 'حذف المستند نهائياً' : 'Delete document permanently'}
                        </span>
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}

        <NativeDestructiveDialog
          open={Boolean(pendingPermanentDelete)}
          title={
            isAr
              ? 'حذف المستند نهائياً من قاعدة البيانات'
              : 'Delete Document Permanently'
          }
          description={
            isAr
              ? `سيتم مسح "${pendingPermanentDelete?.doc.title ?? ''}" وكافة نسخ CDM v1.2 الخاصة به نهائياً ولا يمكن التراجع عن هذا الإجراء.`
              : `"${pendingPermanentDelete?.doc.title ?? ''}" and all its CDM v1.2 versions will be permanently erased. This action cannot be undone.`
          }
          confirmActionLabel={
            isAr ? 'حذف المستند نهائياً' : 'Delete document permanently'
          }
          cancelLabel={isAr ? 'إلغاء والاحتفاظ بالمستند' : 'Cancel and keep document'}
          onConfirm={handleConfirmPermanentDelete}
          onCancel={() => setPendingPermanentDelete(null)}
        />
      </main>
    </div>
  );
}
