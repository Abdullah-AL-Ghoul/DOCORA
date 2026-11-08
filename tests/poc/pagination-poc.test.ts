import { describe, expect, it } from 'vitest';
import { paginateCdmDocument } from '@/lib/cdm/pagination-engine';
import { CdmDocument } from '@/lib/cdm/schema';

describe('Stage 01.0 Pagination PoC — 5 Critical Stress Cases (ADR-001)', () => {
  it('Case 1: splits a long paragraph cleanly across two pages without losing characters', () => {
    const longParagraphText = Array.from(
      { length: 45 },
      (_, idx) => `الفقرة القانونية رقم (${idx + 1}) المتعلقة بحوكمة العقود والالتزامات التعاقدية.`
    ).join(' ');

    const doc: CdmDocument = {
      cdmVersion: '1.2.0',
      id: 'poc-case-1',
      title: 'اختبار تقسيم الفقرات الطويلة',
      locale: 'ar',
      defaultDirection: 'rtl',
      category: 'legal',
      requiresLegalDisclaimer: false,
      pageSetup: {
        paperSize: 'A4',
        marginTopMm: 20,
        marginBottomMm: 20,
        marginStartMm: 22,
        marginEndMm: 22,
      },
      generationState: { status: 'COMPLETE', completedBlockCount: 1 },
      blocks: [
        {
          id: 'para-long',
          type: 'paragraph',
          direction: 'rtl',
          align: 'start',
          runs: [{ text: longParagraphText, marks: [] }],
        },
      ],
    };

    const result = paginateCdmDocument(doc, { overrideMaxContentHeightMm: 65 });
    expect(result.pages.length).toBeGreaterThanOrEqual(2);

    const p1Frag = result.pages[0].fragments[0];
    const p2Frag = result.pages[1].fragments[0];
    expect(p1Frag.kind).toBe('paragraph');
    expect(p2Frag.kind).toBe('paragraph');
    if (p1Frag.kind === 'paragraph' && p2Frag.kind === 'paragraph') {
      expect(p1Frag.isSplitStart).toBe(true);
      expect(p2Frag.isContinuation).toBe(true);
      expect(p1Frag.sourceBlockId).toBe('para-long');
      expect(p2Frag.sourceBlockId).toBe('para-long');
    }
  });

  it('Case 2: enforces keep-with-next on headings so a heading is never orphaned at the bottom of a page', () => {
    const fillerText = Array.from(
      { length: 8 },
      (_, i) => `سطر تمهيدي رقم ${i + 1} يملأ معظم المساحة المتاحة في الصفحة الأولى.`
    ).join(' ');

    const doc: CdmDocument = {
      cdmVersion: '1.2.0',
      id: 'poc-case-2',
      title: 'اختبار ارتباط العنوان بالفقرة التالية keep-with-next',
      locale: 'ar',
      defaultDirection: 'rtl',
      category: 'executive',
      requiresLegalDisclaimer: false,
      pageSetup: {
        paperSize: 'A4',
        marginTopMm: 20,
        marginBottomMm: 20,
        marginStartMm: 22,
        marginEndMm: 22,
      },
      generationState: { status: 'COMPLETE', completedBlockCount: 3 },
      blocks: [
        {
          id: 'p-filler',
          type: 'paragraph',
          direction: 'rtl',
          align: 'start',
          runs: [{ text: fillerText, marks: [] }],
        },
        {
          id: 'h-keep',
          type: 'heading',
          level: 2,
          direction: 'rtl',
          keepWithNext: true,
          text: 'عنوان البند الرابع الذي يجب ألا ينفصل عن فقرته التالية',
        },
        {
          id: 'p-following',
          type: 'paragraph',
          direction: 'rtl',
          align: 'start',
          runs: [
            {
              text: 'هذه هي الفقرة التابعة للعنوان مباشرة والتي يجب أن تظهر معه في نفس الصفحة الثانية.',
              marks: [],
            },
          ],
        },
      ],
    };

    // Page height of 62mm fits p-filler (~47mm) and would fit heading alone (11mm),
    // but cannot fit heading (11mm) + minimum 2 lines of p-following (~16mm).
    const result = paginateCdmDocument(doc, { overrideMaxContentHeightMm: 62 });
    expect(result.pages.length).toBe(2);

    const page1Ids = result.pages[0].fragments.map((f) => f.sourceBlockId);
    const page2Ids = result.pages[1].fragments.map((f) => f.sourceBlockId);

    expect(page1Ids).toEqual(['p-filler']);
    expect(page2Ids[0]).toBe('h-keep');
    expect(page2Ids[1]).toBe('p-following');
  });

  it('Case 3: splits a multi-page table across pages and repeats the header row on continuation pages', () => {
    const rows = [
      {
        id: 'hdr',
        cells: [
          { id: 'hc1', text: 'البند', direction: 'rtl' as const, align: 'start' as const, isHeader: true },
          { id: 'hc2', text: 'القيمة (SAR)', direction: 'ltr' as const, align: 'end' as const, isHeader: true },
        ],
      },
      ...Array.from({ length: 10 }, (_, idx) => ({
        id: `row-${idx + 1}`,
        cells: [
          {
            id: `c-${idx + 1}-1`,
            text: `دفعة شهرية رقم ${idx + 1}`,
            direction: 'rtl' as const,
            align: 'start' as const,
            isHeader: false,
          },
          {
            id: `c-${idx + 1}-2`,
            text: `${(idx + 1) * 12500}.00 SAR`,
            direction: 'ltr' as const,
            align: 'end' as const,
            isHeader: false,
          },
        ],
      })),
    ];

    const doc: CdmDocument = {
      cdmVersion: '1.2.0',
      id: 'poc-case-3',
      title: 'اختبار جدول متعدد الصفحات',
      locale: 'ar',
      defaultDirection: 'rtl',
      category: 'financial',
      requiresLegalDisclaimer: false,
      pageSetup: {
        paperSize: 'A4',
        marginTopMm: 20,
        marginBottomMm: 20,
        marginStartMm: 22,
        marginEndMm: 22,
      },
      generationState: { status: 'COMPLETE', completedBlockCount: 1 },
      blocks: [
        {
          id: 'tbl-multi',
          type: 'table',
          direction: 'rtl',
          bidiVisual: true,
          caption: 'جدول الدفعات المالية',
          rows,
        },
      ],
    };

    const result = paginateCdmDocument(doc, { overrideMaxContentHeightMm: 55 });
    expect(result.pages.length).toBeGreaterThanOrEqual(2);

    const firstTableFrag = result.pages[0].fragments[0];
    const secondTableFrag = result.pages[1].fragments[0];
    expect(firstTableFrag.kind).toBe('table');
    expect(secondTableFrag.kind).toBe('table');

    if (firstTableFrag.kind === 'table' && secondTableFrag.kind === 'table') {
      expect(firstTableFrag.isContinuation).toBe(false);
      expect(firstTableFrag.repeatedHeaderRow).toBeUndefined();
      expect(secondTableFrag.isContinuation).toBe(true);
      expect(secondTableFrag.repeatedHeaderRow).toBeDefined();
      expect(secondTableFrag.repeatedHeaderRow?.cells[0].text).toBe('البند');
    }
  });

  it('Case 4: preserves mixed Arabic/English/numeric bidirectional segments inside paginated paragraphs', () => {
    const mixedText =
      'تم توقيع اتفاقية SLA بنسبة 99.95% مع شركة Horizon Cloud بقيمة 240,000.00 SAR سنوياً.';

    const doc: CdmDocument = {
      cdmVersion: '1.2.0',
      id: 'poc-case-4',
      title: 'اختبار النصوص المختلطة RTL/LTR',
      locale: 'ar',
      defaultDirection: 'rtl',
      category: 'technical',
      requiresLegalDisclaimer: false,
      pageSetup: {
        paperSize: 'A4',
        marginTopMm: 20,
        marginBottomMm: 20,
        marginStartMm: 22,
        marginEndMm: 22,
      },
      generationState: { status: 'COMPLETE', completedBlockCount: 1 },
      blocks: [
        {
          id: 'p-mixed',
          type: 'paragraph',
          direction: 'auto',
          align: 'start',
          runs: [{ text: mixedText, marks: [] }],
        },
      ],
    };

    const result = paginateCdmDocument(doc);
    const frag = result.pages[0].fragments[0];
    expect(frag.kind).toBe('paragraph');
    if (frag.kind === 'paragraph') {
      expect(frag.direction).toBe('rtl');
      const hasRtl = frag.bidiSegments.some((s) => s.direction === 'rtl');
      const hasLtr = frag.bidiSegments.some((s) => s.direction === 'ltr');
      const hasNumeric = frag.bidiSegments.some((s) => s.isNumeric);
      expect(hasRtl).toBe(true);
      expect(hasLtr).toBe(true);
      expect(hasNumeric).toBe(true);
    }
  });

  it('Case 5: maintains continuous cross-page selection and copy/paste offsets across page breaks', () => {
    const longText = Array.from(
      { length: 30 },
      (_, idx) => `جملة متصلة رقم ${idx + 1} لاختبار استمرارية التحديد عبر الصفحات.`
    ).join(' ');

    const doc: CdmDocument = {
      cdmVersion: '1.2.0',
      id: 'poc-case-5',
      title: 'اختبار التحديد عبر فاصل الصفحات',
      locale: 'ar',
      defaultDirection: 'rtl',
      category: 'general',
      requiresLegalDisclaimer: false,
      pageSetup: {
        paperSize: 'A4',
        marginTopMm: 20,
        marginBottomMm: 20,
        marginStartMm: 22,
        marginEndMm: 22,
      },
      generationState: { status: 'COMPLETE', completedBlockCount: 1 },
      blocks: [
        {
          id: 'p-sel',
          type: 'paragraph',
          direction: 'rtl',
          align: 'start',
          runs: [{ text: longText, marks: [] }],
        },
      ],
    };

    const result = paginateCdmDocument(doc, { overrideMaxContentHeightMm: 50 });
    expect(result.pages.length).toBeGreaterThanOrEqual(2);

    const p1Frag = result.pages[0].fragments[0];
    const p2Frag = result.pages[1].fragments[0];

    const selection = result.resolveSelectionAcrossPages(
      p1Frag.charEnd - 25,
      p2Frag.charStart + 25
    );
    expect(selection.isContinuous).toBe(true);
    expect(selection.touchedPages).toEqual([1, 2]);
    expect(selection.touchedBlockIds).toEqual(['p-sel']);
    expect(selection.selectedText.length).toBeGreaterThan(20);
  });
});
