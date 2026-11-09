'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Search,
  Filter,
  Plus,
  Trash2,
  FolderPlus,
  RotateCcw,
  Download,
  Calendar,
  Layers,
  ArrowUpDown,
  MoreVertical,
  CheckCircle2,
  Folder,
  Eye,
  FileCheck,
} from 'lucide-react';
import { DocumentLocale } from '@/lib/cdm/schema';
import { PRESET_DOCUMENTS } from '@/lib/cdm/presets';
import { Badge, Button } from '@/components/primitives';
import { WorkspaceShell } from '@/components/composites/WorkspaceShell';

interface DocItem {
  id: string;
  title: string;
  category: 'contracts' | 'reports' | 'policies' | 'briefs';
  locale: DocumentLocale;
  wordCount: number;
  updatedAt: string;
  gateStatus: 'READY' | 'REVIEW';
  isDeleted?: boolean;
}

const INITIAL_DOCS: DocItem[] = [
  {
    id: 'exec-contract-ar',
    title: 'عقد اتفاقية توريد خدمات برمجية وحلول سحابية مؤسسية',
    category: 'contracts',
    locale: 'ar',
    wordCount: 1420,
    updatedAt: 'قبل ساعتين',
    gateStatus: 'READY',
  },
  {
    id: 'board-report-en',
    title: 'Enterprise Q4 Cloud Infrastructure & Architecture Review',
    category: 'reports',
    locale: 'en',
    wordCount: 1850,
    updatedAt: 'أمس',
    gateStatus: 'READY',
  },
  {
    id: 'compliance-policy-ar',
    title: 'سياسة حوكمة البيانات المؤسسية والمعايير الأمنية المعتمدة',
    category: 'policies',
    locale: 'ar',
    wordCount: 960,
    updatedAt: 'قبل 3 أيام',
    gateStatus: 'READY',
  },
  {
    id: 'product-brief-en',
    title: 'DOCORA Phase 02 Intelligence Architecture & Verification Brief',
    category: 'briefs',
    locale: 'en',
    wordCount: 1120,
    updatedAt: 'قبل أسبوع',
    gateStatus: 'REVIEW',
  },
];

export function DocumentLibraryView({ locale }: { locale: DocumentLocale }) {
  const isAr = locale === 'ar';
  const [documents, setDocuments] = useState<DocItem[]>(INITIAL_DOCS);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [deletedDocState, setDeletedDocState] = useState<DocItem | null>(null);

  // Soft delete handler
  const handleDelete = (id: string) => {
    setDocuments((prev) =>
      prev.map((doc) => (doc.id === id ? { ...doc, isDeleted: true } : doc))
    );
  };

  // Restore handler
  const handleRestore = (id: string) => {
    setDocuments((prev) =>
      prev.map((doc) => (doc.id === id ? { ...doc, isDeleted: false } : doc))
    );
  };

  // Filtered documents
  const isTrashTab = activeCategory === 'trash';
  const activeDocs = documents.filter((doc) => !doc.isDeleted);
  const trashDocs = documents.filter((doc) => doc.isDeleted);

  const displayedDocs = (isTrashTab ? trashDocs : activeDocs).filter((doc) => {
    const matchesCategory =
      activeCategory === 'all' || activeCategory === 'trash' || doc.category === activeCategory;
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.trim().toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <WorkspaceShell locale={locale}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Top Header & Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 data-testid="document-library-heading" className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              {isAr ? 'مكتبة المستندات المؤسسية' : 'Document Library'}
            </h1>
            <p className="mt-1 text-sm text-[#475569] dark:text-[#94A3B8]">
              {isAr
                ? 'إدارة وصياغة وأرشفة المستندات الموثوقة بصيغة CDM v1.2'
                : 'Manage, edit, and organize verified documents in CDM v1.2 format'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link href={`/${locale}/documents/new`}>
              <Button variant="primary">
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span>{isAr ? 'إنشاء مستند جديد' : 'New Document'}</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="flex flex-col gap-4 border-b border-[#CBD5E1] pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-[#1E293B]">
          {/* Category Filters */}
          <div
            role="tablist"
            className="flex flex-wrap items-center gap-1.5"
            aria-label={isAr ? 'تصنيفات المستندات' : 'Document categories'}
          >
            {[
              { id: 'all', label: isAr ? 'كافة المستندات' : 'All Documents', count: activeDocs.length },
              { id: 'contracts', label: isAr ? 'العقود والاتفاقيات' : 'Contracts', count: activeDocs.filter(d => d.category === 'contracts').length },
              { id: 'reports', label: isAr ? 'التقارير المؤسسية' : 'Reports', count: activeDocs.filter(d => d.category === 'reports').length },
              { id: 'policies', label: isAr ? 'السياسات واللوائح' : 'Policies', count: activeDocs.filter(d => d.category === 'policies').length },
              { id: 'briefs', label: isAr ? 'الملخصات والخطط' : 'Briefs', count: activeDocs.filter(d => d.category === 'briefs').length },
              { id: 'trash', label: isAr ? 'سلة المحذوفات' : 'Trash', count: trashDocs.length },
            ].map((tab) => (
              <button
                key={tab.id}
                role="tab"
                data-testid={`filter-btn-${tab.id}`}
                aria-selected={activeCategory === tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
                  activeCategory === tab.id
                    ? 'bg-[#4F46E5] text-[#FFFFFF] shadow-xs'
                    : 'bg-[#FFFFFF] text-[#475569] border border-[#CBD5E1] hover:bg-[#F1F5F9] dark:bg-[#11131A] dark:text-[#94A3B8] dark:border-[#334155]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    activeCategory === tab.id
                      ? 'bg-[#FFFFFF]/20 text-[#FFFFFF]'
                      : 'bg-[#F1F5F9] text-[#475569] dark:bg-[#1E293B] dark:text-[#94A3B8]'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[260px]">
            <Search className="absolute inset-y-0 start-3 my-auto h-4 w-4 text-[#94A3B8]" aria-hidden="true" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'ابحث في المستندات بالاسم أو الكلمات المفتاحية...' : 'Search documents by title or keyword...'}
              aria-label={isAr ? 'ابحث في المستندات' : 'Search documents'}
              className="w-full min-h-11 rounded-lg border border-[#CBD5E1] bg-[#FFFFFF] ps-9 pe-4 text-xs text-[#0F172A] placeholder-[#94A3B8] focus:border-[#4F46E5] focus:outline-hidden dark:border-[#334155] dark:bg-[#11131A] dark:text-[#F8FAFC]"
            />
          </div>
        </div>

        {/* Display Area: Grid, List or Empty States */}
        {displayedDocs.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {displayedDocs.map((doc) => (
              <div
                key={doc.id}
                data-testid={`document-card-${doc.id}`}
                className="group relative flex flex-col justify-between rounded-xl border border-[#CBD5E1] bg-[#FFFFFF] p-5 shadow-xs transition-shadow hover:shadow-md dark:border-[#1E293B] dark:bg-[#11131A]"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <Badge tone={doc.gateStatus === 'READY' ? 'verified' : 'warning'}>
                      {doc.gateStatus === 'READY' ? (
                        <>
                          <CheckCircle2 className="h-3 w-3" />
                          <span>{isAr ? 'معتمد للجودة' : 'Quality Ready'}</span>
                        </>
                      ) : (
                        <span>{isAr ? 'قيد المراجعة' : 'Review Needed'}</span>
                      )}
                    </Badge>

                    <span className="text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8]">
                      {doc.wordCount} {isAr ? 'كلمة' : 'words'}
                    </span>
                  </div>

                  <h3 className="mt-3 text-base font-bold leading-snug line-clamp-2">
                    <Link
                      href={isTrashTab ? '#' : `/${locale}/documents/${doc.id}`}
                      className="hover:text-[#4F46E5] focus-visible:outline-2 focus-visible:outline-[#4F46E5]"
                    >
                      {doc.title}
                    </Link>
                  </h3>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-[#F1F5F9] pt-3 text-xs text-[#64748B] dark:border-[#1E293B] dark:text-[#94A3B8]">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{doc.updatedAt}</span>
                  </span>

                  <div className="flex items-center gap-1">
                    {isTrashTab ? (
                      <button
                        type="button"
                        onClick={() => handleRestore(doc.id)}
                        className="inline-flex min-h-9 items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold text-[#047857] hover:bg-[#ECFDF5] dark:text-[#34D399] dark:hover:bg-[#064E3B]"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>{isAr ? 'استعادة' : 'Restore'}</span>
                      </button>
                    ) : (
                      <>
                        <Link
                          href={`/${locale}/documents/${doc.id}`}
                          className="inline-flex min-h-9 items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold text-[#4F46E5] hover:bg-[#EEF2FF] dark:text-[#818CF8] dark:hover:bg-[#1E1B4B]"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>{isAr ? 'فتح' : 'Open'}</span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(doc.id)}
                          className="inline-flex min-h-9 w-9 items-center justify-center rounded-md text-[#94A3B8] hover:bg-[#FEF2F2] hover:text-[#991B1B]"
                          aria-label={isAr ? 'نقل إلى المحذوفات' : 'Move to Trash'}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty States Handling */
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#CBD5E1] bg-[#FFFFFF] p-12 text-center dark:border-[#334155] dark:bg-[#11131A]">
            {isTrashTab ? (
              <div data-testid="empty-state-trash" className="max-w-md space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F1F5F9] text-[#64748B] dark:bg-[#1E293B] dark:text-[#94A3B8]">
                  <Trash2 className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-bold">{isAr ? 'سلة المحذوفات فارغة' : 'Trash is Empty'}</h3>
                <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
                  {isAr
                    ? 'لا توجد مستندات محذوفة حالياً. يتم الاحتفاظ بالمستندات المحذوفة مؤقتاً لمدة 30 يوماً قبل الحذف النهائي.'
                    : 'No documents in trash. Deleted documents are safely retained for 30 days before permanent deletion.'}
                </p>
              </div>
            ) : searchQuery.trim() !== '' ? (
              <div data-testid="empty-state-no-search" className="max-w-md space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FFFBEB] text-[#92400E] dark:bg-[#451A03] dark:text-[#FBBF24]">
                  <Search className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-bold">
                  {isAr ? 'لا توجد نتائج مطابقة لبحثك' : 'No Matching Documents Found'}
                </h3>
                <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
                  {isAr
                    ? `لم نتمكن من العثور على أي مستند يتطابق مع "${searchQuery}". جرب كلمة أخرى أو أعد ضبط الفلتر.`
                    : `No documents matched "${searchQuery}". Try adjusting your keywords or clearing the filter.`}
                </p>
                <Button variant="outline" size="sm" onClick={() => setSearchQuery('')}>
                  {isAr ? 'إعادة ضبط البحث' : 'Clear Search'}
                </Button>
              </div>
            ) : (
              <div data-testid="empty-state-first-use" className="max-w-md space-y-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#EEF2FF] text-[#4338CA] dark:bg-[#1E1B4B] dark:text-[#818CF8]">
                  <FileText className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-bold">{isAr ? 'ابدأ صياغة مستندك الأول' : 'Create Your First Document'}</h3>
                <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
                  {isAr
                    ? 'لم تقم بإنشاء أي مستند بعد. اختر أحد مسارات البدء السريع لإنتاج مستند احترافي موثق.'
                    : 'You have not created any documents yet. Choose a creation method to get started.'}
                </p>
                <Link href={`/${locale}/documents/new`}>
                  <Button variant="primary">
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    <span>{isAr ? 'إنشاء مستند جديد الآن' : 'Create New Document'}</span>
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </WorkspaceShell>
  );
}
