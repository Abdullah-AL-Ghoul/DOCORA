'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Edit3,
  Eye,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  Italic,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Search,
  Table as TableIcon,
  Underline as UnderlineIcon,
  Undo2,
  X,
} from 'lucide-react';
import { CdmBlock, CdmDocument, TextDirection } from '@/lib/cdm/schema';
import {
  cdmToTiptapJson,
  tiptapJsonToCdmBlocks,
  TiptapJsonNode,
} from '@/lib/cdm/transformers';
import { paginateCdmDocument } from '@/lib/cdm/pagination-engine';
import { Badge, Button, SegmentedControl } from '@/components/primitives';

/**
 * Layer 3 Feature Component: Tiptap 3.x Bilingual Structured Editor & Synchronized Paged Preview (`ADR-001`)
 * (`src/components/features/editor/TiptapStudioEditor.tsx`)
 *
 * Enforces Section 8 & Fix #2 & Fix #5:
 * 1. Logical Formatting Toolbar Groups (Section 8.1 & 8.3):
 *    - History (Undo / Redo)
 *    - Heading Styles (H1, H2, H3)
 *    - Text Marks (Bold, Italic, Underline, Highlight, Inline Code)
 *    - Paragraph Alignment & Lists (Align Start/Center/End, Bullet List, Ordered List, Blockquote)
 *    - Text Direction (RTL, LTR)
 *    - Insert Table & Find/Search Bar
 *    - Live Word & Character Count + Canvas View Switcher (`Split`, `Continuous Editor`, `Paged Print Preview`)
 * 2. Preserves independent editor direction (`effectiveDir`) regardless of UI shell direction (`locale`).
 */

export type StudioCanvasMode = 'split' | 'continuous' | 'paged-preview';

function computeDocumentWordAndCharCount(blocks: CdmBlock[]): {
  words: number;
  chars: number;
} {
  const texts: string[] = [];
  for (const blk of blocks) {
    if (blk.type === 'heading' || blk.type === 'callout') {
      texts.push(blk.text);
    } else if (blk.type === 'paragraph') {
      texts.push(blk.runs.map((r) => r.text).join(' '));
    } else if (blk.type === 'table') {
      if (blk.caption) texts.push(blk.caption);
      for (const r of blk.rows) {
        for (const c of r.cells) {
          texts.push(c.text);
        }
      }
    } else if (blk.type === 'signature') {
      texts.push(`${blk.firstPartyName} ${blk.secondPartyName}`);
    }
  }
  const combined = texts.join(' ').trim();
  if (!combined) return { words: 0, chars: 0 };
  const words = combined.split(/\s+/).filter(Boolean).length;
  return { words, chars: combined.length };
}

export function TiptapStudioEditor({
  document,
  onDocumentChange,
  activeDirection,
  searchHighlightQuery = '',
}: {
  document: CdmDocument;
  onDocumentChange: (updated: CdmDocument) => void;
  activeDirection: TextDirection;
  searchHighlightQuery?: string;
}) {
  const [canvasMode, setCanvasMode] = useState<StudioCanvasMode>('split');
  const [isClientMounted, setIsClientMounted] = useState(false);
  const [showFindBar, setShowFindBar] = useState(false);
  const [findQuery, setFindQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');

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

  const initialTiptapContent = useMemo(
    () => cdmToTiptapJson(document),
    [document.id]
  );

  const editor = useEditor({
    immediatelyRender: false,
    textDirection: activeDirection,
    extensions: [
      StarterKit,
      Underline,
      Highlight.configure({ multicolor: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: initialTiptapContent,
    editorProps: {
      attributes: {
        dir: effectiveDir,
        'aria-label': isAr
          ? 'محرر المستندات المهيكل'
          : 'Structured Document Editor',
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

  // Synchronize Tiptap editor when external AI actions (Continue Generation, Inline Diff Accept, or Preset Switch) update document blocks
  useEffect(() => {
    if (!editor) return;
    const targetJson = cdmToTiptapJson(document);
    const currentSerialized = JSON.stringify(editor.getJSON());
    const targetSerialized = JSON.stringify(targetJson);
    if (currentSerialized !== targetSerialized) {
      editor.commands.setContent(targetJson, { emitUpdate: false });
    }
  }, [document, editor]);

  const pagination = useMemo(() => paginateCdmDocument(document), [document]);
  const stats = useMemo(
    () => computeDocumentWordAndCharCount(document.blocks),
    [document.blocks]
  );

  const activeSearchTerm = (findQuery || searchHighlightQuery).trim();
  const findMatchesCount = useMemo(() => {
    if (!activeSearchTerm) return 0;
    const lower = activeSearchTerm.toLowerCase();
    let count = 0;
    for (const b of document.blocks) {
      if (b.type === 'heading' || b.type === 'callout') {
        if (b.text.toLowerCase().includes(lower)) count++;
      } else if (b.type === 'paragraph') {
        const txt = b.runs.map((r) => r.text).join('');
        if (txt.toLowerCase().includes(lower)) count++;
      } else if (b.type === 'table') {
        for (const r of b.rows) {
          for (const c of r.cells) {
            if (c.text.toLowerCase().includes(lower)) count++;
          }
        }
      }
    }
    return count;
  }, [document.blocks, activeSearchTerm]);

  const handleReplaceInDocument = () => {
    const needle = findQuery.trim();
    if (!needle) return;
    const cloned = structuredClone(document);
    cloned.blocks = cloned.blocks.map((blk) => {
      if (blk.type === 'heading' || blk.type === 'callout') {
        return { ...blk, text: blk.text.replaceAll(needle, replaceQuery) };
      }
      if (blk.type === 'paragraph') {
        return {
          ...blk,
          runs: blk.runs.map((r) => ({
            ...r,
            text: r.text.replaceAll(needle, replaceQuery),
          })),
        };
      }
      return blk;
    });
    onDocumentChange(cloned);
  };

  const handleInsertTable = () => {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  };

  return (
    <div className="space-y-3.5">
      {/* Grouped Professional Formatting & View Toolbar (Section 8.1 & 8.3) */}
      <div
        role="toolbar"
        aria-label={
          isAr
            ? 'أدوات تنسيق المستند ونمط العرض'
            : 'Document Formatting and View Toolbar'
        }
        className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-[#CBD5E1] bg-[#FFFFFF] p-2 shadow-xs dark:border-[#334155] dark:bg-[#11131A]"
      >
        <div className="flex flex-wrap items-center gap-1">
          {/* Group 1: Undo / Redo */}
          <Button
            variant="ghost"
            size="xs"
            data-testid="toolbar-undo"
            aria-label={isAr ? 'تراجع (Undo)' : 'Undo'}
            title={isAr ? 'تراجع (Ctrl+Z)' : 'Undo (Ctrl+Z)'}
            onClick={() => editor?.chain().focus().undo().run()}
          >
            <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="xs"
            data-testid="toolbar-redo"
            aria-label={isAr ? 'إعادة (Redo)' : 'Redo'}
            title={isAr ? 'إعادة (Ctrl+Y)' : 'Redo (Ctrl+Y)'}
            onClick={() => editor?.chain().focus().redo().run()}
          >
            <Redo2 className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>

          <span
            className="mx-1 h-4 w-px bg-[#CBD5E1] dark:bg-[#334155]"
            aria-hidden="true"
          />

          {/* Group 2: Headings (H1, H2, H3) */}
          <Button
            variant="ghost"
            size="xs"
            aria-label={isAr ? 'عنوان رئيسي H1' : 'Heading 1'}
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 1 }).run()
            }
          >
            <Heading1 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>H1</span>
          </Button>
          <Button
            variant="ghost"
            size="xs"
            aria-label={isAr ? 'عنوان فرعي H2' : 'Heading 2'}
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 2 }).run()
            }
          >
            <Heading2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>H2</span>
          </Button>
          <Button
            variant="ghost"
            size="xs"
            aria-label={isAr ? 'عنوان مستوى ثالث H3' : 'Heading 3'}
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 3 }).run()
            }
          >
            <Heading3 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>H3</span>
          </Button>

          <span
            className="mx-1 h-4 w-px bg-[#CBD5E1] dark:bg-[#334155]"
            aria-hidden="true"
          />

          {/* Group 3: Inline Formatting Marks (Bold, Italic, Underline, Highlight, Code) */}
          <Button
            variant="ghost"
            size="xs"
            aria-label={isAr ? 'نص عريض Bold' : 'Bold'}
            onClick={() => editor?.chain().focus().toggleBold().run()}
          >
            <Bold className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="xs"
            aria-label={isAr ? 'نص مائل Italic' : 'Italic'}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
          >
            <Italic className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="xs"
            data-testid="toolbar-underline"
            aria-label={isAr ? 'تسطير Underline' : 'Underline'}
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
          >
            <UnderlineIcon className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="xs"
            data-testid="toolbar-highlight"
            aria-label={isAr ? 'تمييز النص Highlight' : 'Highlight'}
            onClick={() => editor?.chain().focus().toggleHighlight().run()}
          >
            <Highlighter className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="xs"
            aria-label={isAr ? 'رمز برمجي Code' : 'Inline Code'}
            onClick={() => editor?.chain().focus().toggleCode().run()}
          >
            <Code className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>

          <span
            className="mx-1 h-4 w-px bg-[#CBD5E1] dark:bg-[#334155]"
            aria-hidden="true"
          />

          {/* Group 4: Lists & Blockquote */}
          <Button
            variant="ghost"
            size="xs"
            data-testid="toolbar-bullet-list"
            aria-label={isAr ? 'قائمة نقطية' : 'Bullet List'}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
          >
            <List className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="xs"
            data-testid="toolbar-ordered-list"
            aria-label={isAr ? 'قائمة رقمية' : 'Ordered List'}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="xs"
            aria-label={isAr ? 'اقتباس تنظيمي' : 'Blockquote'}
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          >
            <Quote className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>

          <span
            className="mx-1 h-4 w-px bg-[#CBD5E1] dark:bg-[#334155]"
            aria-hidden="true"
          />

          {/* Group 5: Alignment & Direction */}
          <Button
            variant="ghost"
            size="xs"
            aria-label={isAr ? 'محاذاة لليمين' : 'Align Right'}
            onClick={() => editor?.chain().focus().setTextAlign('right').run()}
          >
            <AlignRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="xs"
            aria-label={isAr ? 'توسيط النص' : 'Align Center'}
            onClick={() => editor?.chain().focus().setTextAlign('center').run()}
          >
            <AlignCenter className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="xs"
            aria-label={isAr ? 'محاذاة لليسار' : 'Align Left'}
            onClick={() => editor?.chain().focus().setTextAlign('left').run()}
          >
            <AlignLeft className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="xs"
            aria-label={isAr ? 'اتجاه الفقرة RTL' : 'Set Paragraph RTL'}
            onClick={() => editor?.chain().focus().setTextDirection('rtl').run()}
          >
            <span>RTL</span>
          </Button>
          <Button
            variant="ghost"
            size="xs"
            aria-label={isAr ? 'اتجاه الفقرة LTR' : 'Set Paragraph LTR'}
            onClick={() => editor?.chain().focus().setTextDirection('ltr').run()}
          >
            <span>LTR</span>
          </Button>

          <span
            className="mx-1 h-4 w-px bg-[#CBD5E1] dark:bg-[#334155]"
            aria-hidden="true"
          />

          {/* Group 6: Insert Table & Find/Replace */}
          <Button
            variant="ghost"
            size="xs"
            data-testid="toolbar-insert-table"
            aria-label={isAr ? 'إدراج جدول 3×3' : 'Insert 3x3 Table'}
            onClick={handleInsertTable}
          >
            <TableIcon className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
          <Button
            variant={showFindBar ? 'secondary' : 'ghost'}
            size="xs"
            data-testid="toolbar-find-toggle"
            aria-label={isAr ? 'بحث واستبدال في المستند' : 'Find and Replace'}
            onClick={() => setShowFindBar((prev) => !prev)}
          >
            <Search className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </div>

        {/* Right Toolbar Group: Word Count + Page Count + View Mode Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          <span
            data-testid="editor-word-count"
            className="rounded-md bg-[#F1F5F9] px-2.5 py-1 text-xs font-semibold text-[#475569] tabular-nums dark:bg-[#1E293B] dark:text-[#94A3B8]"
          >
            {isAr
              ? `${stats.words} كلمة • ${stats.chars} حرف`
              : `${stats.words} words • ${stats.chars} chars`}
          </span>
          <Badge tone="accent">
            <span>
              {isAr
                ? `${pagination.pages.length} صفحات A4`
                : `${pagination.pages.length} A4 Pages`}
            </span>
          </Badge>
          <SegmentedControl<StudioCanvasMode>
            ariaLabel={
              isAr
                ? 'وضع عرض المحرر والصفحات'
                : 'Editor & Pagination View Mode'
            }
            value={canvasMode}
            onChange={setCanvasMode}
            options={[
              {
                value: 'split',
                label: isAr
                  ? 'مزدوج (محرر + معاينة A4)'
                  : 'Split (Editor + A4 Preview)',
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

      {/* Inline Find & Replace Bar (Section 8.3) */}
      {showFindBar && (
        <div
          role="region"
          aria-label={isAr ? 'البحث والاستبدال' : 'Find and Replace'}
          data-testid="editor-find-replace-bar"
          className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-[#CBD5E1] bg-[#FFFFFF] px-3.5 py-2.5 text-xs shadow-xs dark:border-[#334155] dark:bg-[#11131A]"
        >
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <label htmlFor="editor-find-input" className="font-semibold">
              {isAr ? 'بحث:' : 'Find:'}
            </label>
            <input
              id="editor-find-input"
              type="text"
              value={findQuery}
              onChange={(e) => setFindQuery(e.target.value)}
              placeholder={isAr ? 'ابحث داخل المستند...' : 'Find in document...'}
              className="min-h-9 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-2.5 text-xs text-[#0F172A] focus:outline-2 focus:outline-[#4F46E5] dark:border-[#334155] dark:bg-[#090A0F] dark:text-[#F8FAFC]"
            />
            <label htmlFor="editor-replace-input" className="font-semibold">
              {isAr ? 'استبدال بـ:' : 'Replace:'}
            </label>
            <input
              id="editor-replace-input"
              type="text"
              value={replaceQuery}
              onChange={(e) => setReplaceQuery(e.target.value)}
              placeholder={isAr ? 'النص البديل...' : 'Replacement text...'}
              className="min-h-9 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-2.5 text-xs text-[#0F172A] focus:outline-2 focus:outline-[#4F46E5] dark:border-[#334155] dark:bg-[#090A0F] dark:text-[#F8FAFC]"
            />
            <Button
              variant="secondary"
              size="xs"
              disabled={!findQuery.trim()}
              onClick={handleReplaceInDocument}
            >
              {isAr ? 'استبدال الكل' : 'Replace All'}
            </Button>
            {activeSearchTerm && (
              <Badge tone="neutral">
                {isAr
                  ? `الفقرات المطابقة: ${findMatchesCount}`
                  : `Matching blocks: ${findMatchesCount}`}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="xs"
            aria-label={isAr ? 'إغلاق شريط البحث' : 'Close Find Bar'}
            onClick={() => setShowFindBar(false)}
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </div>
      )}

      {/* Workspace Grid: Continuous Editor + Synchronized A4 Print Preview */}
      <div
        className={`grid gap-5 ${
          canvasMode === 'split' ? 'xl:grid-cols-2' : 'grid-cols-1'
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
            className="archival-a4-sheet rounded-2xl border border-[#CBD5E1] bg-[#FFFFFF] p-5 sm:p-6 dark:border-[#334155] dark:bg-[#12141C]"
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3 text-xs text-[#475569] dark:border-[#1E293B] dark:text-[#94A3B8]">
              <div className="flex items-center gap-2 font-semibold">
                <Edit3
                  className="h-3.5 w-3.5 text-[#4F46E5] dark:text-[#818CF8]"
                  aria-hidden="true"
                />
                <span>
                  {isAr
                    ? 'المحرر المهيكل المستمر (حماية كاملة للتحديد والجداول)'
                    : 'Continuous Structured Editor (Selection & Table Safe)'}
                </span>
              </div>
              <span dir="ltr" className="ltr-numeral">
                {isAr
                  ? 'Direction: ' + effectiveDir.toUpperCase() + ' • < 16.6ms (60Hz)'
                  : 'Direction: ' + effectiveDir.toUpperCase() + ' • < 16.6ms (60Hz)'}
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
                      dir="ltr"
                      className="ltr-numeral rounded border border-[#CBD5E1] bg-[#F8FAFC] px-2 py-0.5 font-medium dark:border-[#334155] dark:bg-[#090A0F]"
                    >
                      {isAr
                        ? `P${idx + 1} End @ ${offsetMm}mm`
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
                id={`studio-a4-page-${page.pageNumber}`}
                dir={effectiveDir}
                data-testid={`a4-page-${page.pageNumber}`}
                className="archival-a4-sheet rounded-2xl border border-[#CBD5E1] bg-[#FFFFFF] p-6 sm:p-7 text-[#0F172A] dark:border-[#334155] dark:bg-[#12141C] dark:text-[#F8FAFC]"
              >
                <header className="mb-4 flex items-center justify-between border-b border-[#E2E8F0] pb-2.5 text-xs text-[#475569] dark:border-[#1E293B] dark:text-[#94A3B8]">
                  <span className="inline-flex items-center gap-1.5 font-semibold">
                    <Eye
                      className="h-3.5 w-3.5 text-[#4F46E5] dark:text-[#818CF8]"
                      aria-hidden="true"
                    />
                    {isAr
                      ? `معاينة طباعية A4 — صفحة ${page.pageNumber} من ${pagination.pages.length}`
                      : `A4 Print Preview — Page ${page.pageNumber} of ${pagination.pages.length}`}
                  </span>
                  <span dir="ltr" className="ltr-numeral">
                    210mm × 297mm
                  </span>
                </header>

                <div className="space-y-3.5">
                  {page.fragments.map((frag) => {
                    if (frag.kind === 'heading') {
                      return (
                        <h3
                          key={frag.fragmentId}
                          id={`preview-block-${frag.sourceBlockId}`}
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
                          id={`preview-block-${frag.sourceBlockId}`}
                          dir={frag.direction}
                          className="text-sm leading-relaxed"
                        >
                          {frag.text}
                        </p>
                      );
                    }
                    if (frag.kind === 'table') {
                      return (
                        <div
                          key={frag.fragmentId}
                          id={`preview-block-${frag.sourceBlockId}`}
                          className="my-3 overflow-x-auto"
                        >
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
                          id={`preview-block-${frag.sourceBlockId}`}
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
                          id={`preview-block-${frag.sourceBlockId}`}
                          dir={frag.direction}
                          className="mt-4 grid grid-cols-2 gap-4 border-t border-[#CBD5E1] pt-3 text-xs dark:border-[#334155]"
                        >
                          <div>
                            <div className="font-bold">
                              {frag.firstPartyLabel}
                            </div>
                            <div className="mt-1 text-[#475569] dark:text-[#94A3B8]">
                              {frag.firstPartyName}
                            </div>
                          </div>
                          <div>
                            <div className="font-bold">
                              {frag.secondPartyLabel}
                            </div>
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
