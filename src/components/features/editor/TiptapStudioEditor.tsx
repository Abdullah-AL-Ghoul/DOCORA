'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { Bold, Heading1, Heading2, Italic, Columns, Eye, Edit3 } from 'lucide-react';
import { CdmDocument, TextDirection } from '@/lib/cdm/schema';
import { cdmToTiptapJson, tiptapJsonToCdmBlocks, TiptapJsonNode } from '@/lib/cdm/transformers';
import { paginateCdmDocument } from '@/lib/cdm/pagination-engine';
import { Button, Badge, SegmentedControl } from '@/components/primitives';

/**
 * Layer 3 Feature Component: Tiptap 3.x Bilingual Structured Editor & Synchronized Paged Preview (`ADR-001`)
 *
 * Enforces Fix #2 & Fix #5:
 * 1. Uses Tiptap `^3.0.0` with `textDirection: 'auto'` and `immediatelyRender: false` on `useEditor`
 *    to guarantee zero SSR/Client React hydration mismatches.
 * 2. Implements the Stage 01.0 PoC-validated Dual Workspace Mode (`ADR-001` Explicit Architectural Safeguard):
 *    - `Continuous Structured Editor` with non-destructive A4 page-break guides (never splits ProseMirror DOM tables or selection).
 *    - `Synchronized Live Paged Print Preview` showing exact A4 page splits, `keep-with-next` headings, and repeated table headers.
 */

export type StudioCanvasMode = 'split' | 'continuous' | 'paged-preview';

export function TiptapStudioEditor({
  document,
  onDocumentChange,
  activeDirection,
}: {
  document: CdmDocument;
  onDocumentChange: (updated: CdmDocument) => void;
  activeDirection: TextDirection;
}) {
  const [canvasMode, setCanvasMode] = useState<StudioCanvasMode>('split');
  const [isClientMounted, setIsClientMounted] = useState(false);
  const isAr = document.locale === 'ar';
  const effectiveDir: 'rtl' | 'ltr' =
    activeDirection === 'ltr'
      ? 'ltr'
      : activeDirection === 'rtl'
      ? 'rtl'
      : document.defaultDirection === 'ltr'
      ? 'ltr'
      : 'rtl';

  useEffect(() => {
    setIsClientMounted(true);
  }, []);

  const initialTiptapContent = useMemo(() => cdmToTiptapJson(document), [document.id]);

  const editor = useEditor({
    immediatelyRender: false,
    textDirection: activeDirection,
    extensions: [
      StarterKit,
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: initialTiptapContent,
    editorProps: {
      attributes: {
        dir: effectiveDir,
        'aria-label': isAr ? 'محرر المستندات المهيكل' : 'Structured Document Editor',
        class: 'focus:outline-none',
      },
    },
    onUpdate: ({ editor: ed }) => {
      const json = ed.getJSON() as TiptapJsonNode;
      const updatedBlocks = tiptapJsonToCdmBlocks(json, effectiveDir);
      onDocumentChange({
        ...document,
        defaultDirection: activeDirection,
        blocks: updatedBlocks,
      });
    },
  });

  useEffect(() => {
    if (!editor) return;
    const targetJson = cdmToTiptapJson(document);
    // Sync when external AI Continue Generation appends new blocks
    if (document.blocks.length !== (editor.getJSON().content?.length ?? 0)) {
      editor.commands.setContent(targetJson, { emitUpdate: false });
    }
  }, [document.blocks.length, document.id, editor]);

  const pagination = useMemo(() => paginateCdmDocument(document), [document]);

  return (
    <div className="space-y-4">
      {/* Formatting & Canvas Mode Toolbar */}
      <div
        role="toolbar"
        aria-label={isAr ? 'أدوات تنسيق المستند ونمط العرض' : 'Document Formatting and View Toolbar'}
        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#CBD5E1] bg-[#FFFFFF] p-2.5 shadow-xs dark:border-[#334155] dark:bg-[#11131A]"
      >
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            aria-label={isAr ? 'عنوان رئيسي H1' : 'Heading 1'}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
          >
            <Heading1 className="h-4 w-4" aria-hidden="true" />
            <span>H1</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label={isAr ? 'عنوان فرعي H2' : 'Heading 2'}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <Heading2 className="h-4 w-4" aria-hidden="true" />
            <span>H2</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label={isAr ? 'نص عريض Bold' : 'Bold'}
            onClick={() => editor?.chain().focus().toggleBold().run()}
          >
            <Bold className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label={isAr ? 'نص مائل Italic' : 'Italic'}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
          >
            <Italic className="h-4 w-4" aria-hidden="true" />
          </Button>
          <span className="mx-1 h-5 w-px bg-[#CBD5E1] dark:bg-[#334155]" aria-hidden="true" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor?.chain().focus().setTextDirection('rtl').run()}
          >
            <span>RTL</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor?.chain().focus().setTextDirection('ltr').run()}
          >
            <span>LTR</span>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Badge tone="accent">
            <span>
              {isAr
                ? `${pagination.pages.length} صفحات A4`
                : `${pagination.pages.length} A4 Pages`}
            </span>
          </Badge>
          <SegmentedControl<StudioCanvasMode>
            ariaLabel={isAr ? 'وضع عرض المحرر والصفحات' : 'Editor & Pagination View Mode'}
            value={canvasMode}
            onChange={setCanvasMode}
            options={[
              {
                value: 'split',
                label: isAr ? 'مزدوج (محرر + معاينة A4)' : 'Split (Editor + A4 Preview)',
              },
              {
                value: 'continuous',
                label: isAr ? 'محرر مستمر' : 'Continuous Editor',
              },
              {
                value: 'paged-preview',
                label: isAr ? 'معاينة صفحات الطباعة' : 'Paged Print Preview',
              },
            ]}
          />
        </div>
      </div>

      {/* Workspace Grid */}
      <div
        className={`grid gap-6 ${
          canvasMode === 'split' ? 'lg:grid-cols-2' : 'grid-cols-1'
        }`}
      >
        {/* 1. Continuous Structured Editor with Page-Break Guides (ProseMirror Safe) */}
        {(canvasMode === 'split' || canvasMode === 'continuous') && (
          <section
            aria-label={
              isAr
                ? 'المحرر المهيكل المستمر (Tiptap 3.0)'
                : 'Continuous Structured Editor (Tiptap 3.0)'
            }
            className="rounded-2xl border border-[#CBD5E1] bg-[#FFFFFF] p-6 shadow-sm dark:border-[#334155] dark:bg-[#12141C]"
          >
            <div className="mb-4 flex items-center justify-between border-b border-[#E2E8F0] pb-3 text-xs text-[#475569] dark:border-[#1E293B] dark:text-[#94A3B8]">
              <div className="flex items-center gap-2 font-semibold">
                <Edit3 className="h-3.5 w-3.5 text-[#4F46E5] dark:text-[#818CF8]" aria-hidden="true" />
                <span>
                  {isAr
                    ? 'المحرر المهيكل المستمر (حماية كاملة للتحديد والجداول)'
                    : 'Continuous Structured Editor (Selection & Table Safe)'}
                </span>
              </div>
              <span className="tabular-nums">
                {isAr ? 'استجابة < 16.6ms (60Hz)' : '< 16.6ms (60Hz) Frame Budget'}
              </span>
            </div>

            {isClientMounted && editor ? (
              <div dir={effectiveDir} className="prose max-w-none">
                <EditorContent editor={editor} />
              </div>
            ) : (
              <div
                dir={effectiveDir}
                className="space-y-3 py-2"
                data-testid="ssr-editor-fallback"
              >
                {document.blocks.map((blk) => {
                  if (blk.type === 'heading') {
                    return (
                      <h2 key={blk.id} className="text-lg font-bold">
                        {blk.text}
                      </h2>
                    );
                  }
                  if (blk.type === 'paragraph') {
                    return (
                      <p key={blk.id} className="text-sm leading-relaxed">
                        {blk.runs.map((r) => r.text).join('')}
                      </p>
                    );
                  }
                  return null;
                })}
              </div>
            )}

            {/* Non-destructive Deterministic A4 Page-Break Guides (ADR-001) */}
            <div
              data-testid="continuous-page-break-guides"
              className="mt-4 border-t border-dashed border-[#CBD5E1] pt-3 text-xs text-[#475569] dark:border-[#334155] dark:text-[#94A3B8]"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold">
                  {isAr
                    ? `دلائل فواصل الصفحات الإرشادية (A4 — ${pagination.maxPageContentHeightMm}mm صافي):`
                    : `Non-Destructive A4 Page-Break Guides (${pagination.maxPageContentHeightMm}mm net height):`}
                </span>
                <div className="flex flex-wrap items-center gap-1.5 tabular-nums">
                  {pagination.pageBreakGuideOffsetsMm.map((offsetMm, idx) => (
                    <span
                      key={offsetMm}
                      className="rounded border border-[#CBD5E1] bg-[#F8FAFC] px-2 py-0.5 font-medium dark:border-[#334155] dark:bg-[#090A0F]"
                    >
                      {isAr
                        ? `نهاية ص${idx + 1} @ ${offsetMm}mm`
                        : `End P${idx + 1} @ ${offsetMm}mm`}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 2. Synchronized Live Paged Print Preview (A4 Physical Pages with keep-with-next & repeated table headers) */}
        {(canvasMode === 'split' || canvasMode === 'paged-preview') && (
          <section
            aria-label={
              isAr
                ? 'معاينة الصفحات الطباعية المتزامنة (A4)'
                : 'Synchronized Live Paged Print Preview (A4)'
            }
            className="space-y-6"
          >
            {pagination.pages.map((page) => (
              <article
                key={page.pageNumber}
                dir={effectiveDir}
                data-testid={`a4-page-${page.pageNumber}`}
                className="rounded-2xl border border-[#CBD5E1] bg-[#FFFFFF] p-7 text-[#0F172A] shadow-md dark:border-[#334155] dark:bg-[#12141C] dark:text-[#F8FAFC]"
              >
                <header className="mb-4 flex items-center justify-between border-b border-[#E2E8F0] pb-2.5 text-xs text-[#475569] dark:border-[#1E293B] dark:text-[#94A3B8]">
                  <span className="inline-flex items-center gap-1.5 font-semibold">
                    <Eye className="h-3.5 w-3.5 text-[#4F46E5] dark:text-[#818CF8]" aria-hidden="true" />
                    {isAr
                      ? `معاينة طباعية A4 — صفحة ${page.pageNumber} من ${pagination.pages.length}`
                      : `A4 Print Preview — Page ${page.pageNumber} of ${pagination.pages.length}`}
                  </span>
                  <span className="tabular-nums">210mm × 297mm</span>
                </header>

                <div className="space-y-3.5">
                  {page.fragments.map((frag) => {
                    if (frag.kind === 'heading') {
                      return (
                        <h3
                          key={frag.fragmentId}
                          dir={frag.direction}
                          className={`font-bold ${
                            frag.level === 1 ? 'text-xl' : 'text-base'
                          }`}
                        >
                          {frag.text}
                        </h3>
                      );
                    }
                    if (frag.kind === 'paragraph') {
                      return (
                        <p
                          key={frag.fragmentId}
                          dir={frag.direction}
                          className="text-sm leading-relaxed"
                        >
                          {frag.text}
                        </p>
                      );
                    }
                    if (frag.kind === 'table') {
                      return (
                        <div key={frag.fragmentId} className="my-3 overflow-x-auto">
                          {frag.caption && (
                            <div
                              dir={frag.direction}
                              className="mb-1.5 text-xs font-bold text-[#475569] dark:text-[#94A3B8]"
                            >
                              {frag.caption}
                            </div>
                          )}
                          <table
                            dir={frag.bidiVisual ? 'rtl' : 'ltr'}
                            className="w-full border-collapse text-xs tabular-nums"
                          >
                            {frag.repeatedHeaderRow && (
                              <thead>
                                <tr className="bg-[#EEF2FF] dark:bg-[#1E1B4B]">
                                  {frag.repeatedHeaderRow.cells.map((cell) => (
                                    <th
                                      key={cell.id}
                                      dir={cell.direction}
                                      className="border border-[#CBD5E1] px-2.5 py-2 font-bold dark:border-[#334155]"
                                    >
                                      {cell.text}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                            )}
                            <tbody>
                              {frag.rows.map((r) => (
                                <tr key={r.id}>
                                  {r.cells.map((c) => {
                                    const Tag = c.isHeader ? 'th' : 'td';
                                    return (
                                      <Tag
                                        key={c.id}
                                        dir={c.direction}
                                        className={`border border-[#CBD5E1] px-2.5 py-2 dark:border-[#334155] ${
                                          c.isHeader
                                            ? 'bg-[#F1F5F9] font-bold dark:bg-[#1E293B]'
                                            : ''
                                        }`}
                                      >
                                        {c.text}
                                      </Tag>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    }
                    if (frag.kind === 'callout') {
                      return (
                        <aside
                          key={frag.fragmentId}
                          dir={frag.direction}
                          className="rounded-lg border-s-4 border-[#4F46E5] bg-[#F8FAFC] p-3 text-xs dark:bg-[#1E293B]"
                        >
                          <strong className="font-bold">{frag.title}: </strong>
                          <span>{frag.text}</span>
                        </aside>
                      );
                    }
                    if (frag.kind === 'signature') {
                      return (
                        <div
                          key={frag.fragmentId}
                          dir={frag.direction}
                          className="mt-4 grid grid-cols-2 gap-4 border-t border-[#CBD5E1] pt-3 text-xs dark:border-[#334155]"
                        >
                          <div>
                            <div className="font-bold">{frag.firstPartyLabel}</div>
                            <div className="mt-1 text-[#475569] dark:text-[#94A3B8]">
                              {frag.firstPartyName}
                            </div>
                          </div>
                          <div>
                            <div className="font-bold">{frag.secondPartyLabel}</div>
                            <div className="mt-1 text-[#475569] dark:text-[#94A3B8]">
                              {frag.secondPartyName}
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
