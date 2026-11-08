'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  FilePlus2,
  FileText,
  FolderOpen,
  RotateCcw,
  Search,
  Trash2,
  XCircle,
} from 'lucide-react';
import {
  Badge,
  Button,
  NativeDestructiveDialog,
  SegmentedControl,
} from '@/components/primitives';
import { TokenQuotaMeter } from '@/components/composites';
import { CdmDocument, DocumentLocale } from '@/lib/cdm/schema';
import { PRESET_DOCUMENTS } from '@/lib/cdm/presets';

/**
 * Layer 4 View: Dashboard Workspace View (`Mode B — SaaS Utility`)
 *
 * Enforces `product-design-ux` rules:
 * 1. Three distinct Empty States (`rule/cover-reachable-states`):
 *    - `first-use`: New workspace with starter templates and `"إنشاء مستند جديد"` / `"Create new document"`.
 *    - `no-search-results`: Search query with 0 matches + `"مسح البحث"` / `"Clear search"`.
 *    - `empty-trash`: Clean trash view when no soft-deleted documents exist.
 * 2. Proportional Destructive Action Semantics (`rule/destructive-proportional`, `rule/destructive-names-action`, `rule/no-confirm-ok-labels`):
 *    - Moving a document to Trash is reversible and happens immediately with an inline Undo banner (NO confirmation modal).
 *    - Permanent deletion inside Trash requires a native `<dialog>` whose button explicitly names the action (`"حذف المستند نهائياً"` / `"Delete document permanently"`).
 */

type WorkspaceTab = 'active' | 'trash' | 'empty-demo';

interface ManagedDocumentItem {
  doc: CdmDocument;
  trashed: boolean;
  updatedAtLabel: string;
}

export function DashboardWorkspaceView({ locale }: { locale: DocumentLocale }) {
  const isAr = locale === 'ar';
  const [tab, setTab] = useState<WorkspaceTab>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastTrashedId, setLastTrashedId] = useState<string | null>(null);
  const [pendingPermanentDelete, setPendingPermanentDelete] =
    useState<ManagedDocumentItem | null>(null);

  const [items, setItems] = useState<ManagedDocumentItem[]>(() =>
    Object.values(PRESET_DOCUMENTS).map((doc) => ({
      doc,
      trashed: false,
      updatedAtLabel: '2026-11-08 11:00 UTC',
    }))
  );

  const activeItems = useMemo(
    () =>
      items.filter(
        (item) =>
          !item.trashed &&
          item.doc.title.toLowerCase().includes(searchQuery.trim().toLowerCase())
      ),
    [items, searchQuery]
  );

  const trashedItems = useMemo(
    () => items.filter((item) => item.trashed),
    [items]
  );

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

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] dark:bg-[#090A0F] dark:text-[#F8FAFC]">
      <header className="border-b border-[#CBD5E1] bg-[#FFFFFF] dark:border-[#1E293B] dark:bg-[#11131A]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              href={`/${locale}`}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4F46E5] font-bold text-[#FFFFFF]"
            >
              D
            </Link>
            <div>
              <h1 className="text-lg font-bold">
                {isAr ? 'لوحة إدارة المستندات (DOCORA Workspace)' : 'DOCORA Document Workspace'}
              </h1>
              <p className="text-xs text-[#475569] dark:text-[#94A3B8]">
                {isAr
                  ? 'المرحلة الأولى (Phase 01 MVP) — عزل كامل للمستأجرين عبر RLS و DAL'
                  : 'Phase 01 MVP — Tenant-isolated via PostgreSQL RLS & DAL'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
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

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Reversible Trash Undo Banner (rule/destructive-proportional) */}
        {lastTrashedId && (
          <div
            role="status"
            className="mb-6 flex items-center justify-between rounded-xl border border-[#CBD5E1] bg-[#FFFFFF] px-4 py-3 text-sm shadow-xs dark:border-[#334155] dark:bg-[#11131A]"
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

        {/* Controls Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
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
                  <Button variant="outline" onClick={() => setSearchQuery('')}>
                    {isAr ? 'مسح البحث وعرض الكل' : 'Clear search query'}
                  </Button>
                </div>
              </section>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {activeItems.map(({ doc, updatedAtLabel }) => (
                  <article
                    key={doc.id}
                    className="flex flex-col justify-between rounded-2xl border border-[#CBD5E1] bg-[#FFFFFF] p-5 shadow-xs dark:border-[#334155] dark:bg-[#11131A]"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
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
                        <span className="text-xs font-semibold uppercase text-[#475569] dark:text-[#94A3B8]">
                          {doc.defaultDirection.toUpperCase()}
                        </span>
                      </div>

                      <h2 className="mt-3 line-clamp-2 text-base font-bold">
                        {doc.title}
                      </h2>
                      <p className="mt-1 text-xs text-[#475569] dark:text-[#94A3B8] tabular-nums">
                        {updatedAtLabel} • {doc.blocks.length}{' '}
                        {isAr ? 'كتل مهيكلة' : 'CDM blocks'}
                      </p>
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-2 border-t border-[#E2E8F0] pt-4 dark:border-[#1E293B]">
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
