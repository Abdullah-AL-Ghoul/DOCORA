import { CdmBlock, CdmDocument } from './schema';
import { resolveEffectiveDirection, segmentBidiRuns } from './bidi';

/**
 * Stage 01.0 Pagination PoC & Deterministic Paged Layout Engine (ADR-001)
 *
 * Why this exists:
 * `ResizeObserver` is only a box-measurement API, not a pagination engine.
 * Mutating live ProseMirror DOM nodes to split tables or paragraphs across page wrappers
 * corrupts ProseMirror selection and multi-cell table state.
 *
 * This engine implements the non-destructive Pagination PoC & Synchronized Paged Preview model:
 * 1. Splits long paragraphs across page boundaries with exact line accounting.
 * 2. Enforces `keep-with-next` on headings so a heading is never orphaned at the bottom of a page.
 * 3. Splits multi-page tables across pages while repeating the table header row (`repeatHeaderRow`) on continuation pages.
 * 4. Preserves mixed RTL/LTR bidirectional runs and numeric tokens across page splits.
 * 5. Preserves 1:1 source CDM block and character offset mapping (`sourceBlockId`, `charStart`, `charEnd`)
 *    so cursor selection and copy/paste across page breaks never lose characters or corrupt the editor state.
 */

export interface PageFragmentBase {
  fragmentId: string;
  sourceBlockId: string;
  pageNumber: number;
  direction: 'rtl' | 'ltr';
  estimatedHeightMm: number;
  charStart: number;
  charEnd: number;
}

export interface ParagraphPageFragment extends PageFragmentBase {
  kind: 'paragraph';
  text: string;
  isContinuation: boolean;
  isSplitStart: boolean;
  bidiSegments: ReturnType<typeof segmentBidiRuns>;
}

export interface HeadingPageFragment extends PageFragmentBase {
  kind: 'heading';
  level: 1 | 2 | 3;
  text: string;
  keptWithNextBlockId?: string;
}

export interface TablePageFragment extends PageFragmentBase {
  kind: 'table';
  bidiVisual: boolean;
  caption?: string;
  isContinuation: boolean;
  repeatedHeaderRow?: {
    id: string;
    cells: { id: string; text: string; direction: 'rtl' | 'ltr' }[];
  };
  rows: {
    id: string;
    cells: { id: string; text: string; direction: 'rtl' | 'ltr'; isHeader: boolean }[];
  }[];
}

export interface CalloutPageFragment extends PageFragmentBase {
  kind: 'callout';
  tone: 'info' | 'warning' | 'legal' | 'verified';
  title: string;
  text: string;
}

export interface SignaturePageFragment extends PageFragmentBase {
  kind: 'signature';
  firstPartyLabel: string;
  firstPartyName: string;
  secondPartyLabel: string;
  secondPartyName: string;
  dateLabel: string;
}

export type PageFragment =
  | ParagraphPageFragment
  | HeadingPageFragment
  | TablePageFragment
  | CalloutPageFragment
  | SignaturePageFragment;

export interface PaginatedPage {
  pageNumber: number;
  contentHeightMm: number;
  maxContentHeightMm: number;
  fragments: PageFragment[];
}

export interface PaginationResult {
  paperSize: 'A4' | 'LETTER';
  totalHeightMm: number;
  maxPageContentHeightMm: number;
  pages: PaginatedPage[];
  pageBreakGuideOffsetsMm: number[];
  /**
   * Maps any global character offset across the document to its exact page & fragment,
   * proving cursor/selection continuity across page breaks.
   */
  resolveSelectionAcrossPages: (
    startOffset: number,
    endOffset: number
  ) => {
    selectedText: string;
    touchedPages: number[];
    touchedBlockIds: string[];
    isContinuous: boolean;
  };
}

const CHARS_PER_LINE_A4 = 78;
const LINE_HEIGHT_MM = 6.2;
const PARAGRAPH_SPACING_MM = 3.5;
const TABLE_ROW_HEIGHT_MM = 9.5;
const CALLOUT_HEIGHT_MM = 24;
const SIGNATURE_HEIGHT_MM = 36;

function estimateHeadingHeightMm(level: 1 | 2 | 3): number {
  if (level === 1) return 14;
  if (level === 2) return 11;
  return 9;
}

function getBlockPlainText(block: CdmBlock): string {
  switch (block.type) {
    case 'paragraph':
      return block.runs.map((r) => r.text).join('');
    case 'heading':
      return block.text;
    case 'table':
      return block.rows.map((r) => r.cells.map((c) => c.text).join(' | ')).join('\n');
    case 'callout':
      return `${block.title}: ${block.text}`;
    case 'signature':
      return `${block.firstPartyLabel}: ${block.firstPartyName} / ${block.secondPartyLabel}: ${block.secondPartyName}`;
  }
}

export function paginateCdmDocument(
  doc: CdmDocument,
  options?: { overrideMaxContentHeightMm?: number }
): PaginationResult {
  const pageTotalMm = doc.pageSetup.paperSize === 'A4' ? 297 : 279.4;
  const maxContentHeightMm =
    options?.overrideMaxContentHeightMm ??
    pageTotalMm - doc.pageSetup.marginTopMm - doc.pageSetup.marginBottomMm;

  const baseDir: 'rtl' | 'ltr' = doc.defaultDirection === 'ltr' ? 'ltr' : 'rtl';
  const pages: PaginatedPage[] = [
    {
      pageNumber: 1,
      contentHeightMm: 0,
      maxContentHeightMm,
      fragments: [],
    },
  ];

  const getCurrentPage = (): PaginatedPage => pages[pages.length - 1];
  const openNewPage = (): PaginatedPage => {
    const next: PaginatedPage = {
      pageNumber: pages.length + 1,
      contentHeightMm: 0,
      maxContentHeightMm,
      fragments: [],
    };
    pages.push(next);
    return next;
  };

  let globalCharCursor = 0;

  for (let i = 0; i < doc.blocks.length; i++) {
    const block = doc.blocks[i];
    const nextBlock = doc.blocks[i + 1];

    if (block.type === 'heading') {
      const headingHeight = estimateHeadingHeightMm(block.level);
      // Estimate minimum height needed for the first part of the next block when keepWithNext is true
      let minNextBlockHeight = 0;
      if (block.keepWithNext && nextBlock) {
        if (nextBlock.type === 'paragraph') {
          minNextBlockHeight = LINE_HEIGHT_MM * 2 + PARAGRAPH_SPACING_MM;
        } else if (nextBlock.type === 'table') {
          minNextBlockHeight = TABLE_ROW_HEIGHT_MM * 2;
        } else {
          minNextBlockHeight = 14;
        }
      }

      let currentPage = getCurrentPage();
      if (
        currentPage.fragments.length > 0 &&
        currentPage.contentHeightMm + headingHeight + minNextBlockHeight > maxContentHeightMm
      ) {
        currentPage = openNewPage();
      }

      const dir = resolveEffectiveDirection(block.direction, block.text, baseDir);
      const start = globalCharCursor;
      const end = start + block.text.length;
      globalCharCursor = end + 1;

      currentPage.fragments.push({
        kind: 'heading',
        fragmentId: `${block.id}-p${currentPage.pageNumber}`,
        sourceBlockId: block.id,
        pageNumber: currentPage.pageNumber,
        direction: dir,
        level: block.level,
        text: block.text,
        keptWithNextBlockId: block.keepWithNext && nextBlock ? nextBlock.id : undefined,
        estimatedHeightMm: headingHeight,
        charStart: start,
        charEnd: end,
      });
      currentPage.contentHeightMm += headingHeight;
      continue;
    }

    if (block.type === 'paragraph') {
      const fullText = getBlockPlainText(block);
      const dir = resolveEffectiveDirection(block.direction, fullText, baseDir);
      const words = fullText.split(/(\s+)/);
      const lines: string[] = [];
      let currentLine = '';

      for (const token of words) {
        if ((currentLine + token).length > CHARS_PER_LINE_A4 && currentLine.trim().length > 0) {
          lines.push(currentLine);
          currentLine = token.trimStart();
        } else {
          currentLine += token;
        }
      }
      if (currentLine.length > 0 || lines.length === 0) {
        lines.push(currentLine);
      }

      let lineIdx = 0;
      let partIndex = 0;
      while (lineIdx < lines.length) {
        let currentPage = getCurrentPage();
        const remainingMm = maxContentHeightMm - currentPage.contentHeightMm;
        const maxLinesInRemaining = Math.floor(
          (remainingMm - PARAGRAPH_SPACING_MM) / LINE_HEIGHT_MM
        );

        if (maxLinesInRemaining <= 0) {
          currentPage = openNewPage();
          continue;
        }

        const sliceLines = lines.slice(lineIdx, lineIdx + maxLinesInRemaining);
        const sliceText = sliceLines.join(' ');
        const isContinuation = partIndex > 0;
        const isSplitStart = lineIdx + sliceLines.length < lines.length;
        const fragmentHeightMm = sliceLines.length * LINE_HEIGHT_MM + PARAGRAPH_SPACING_MM;

        const start = globalCharCursor;
        const end = start + sliceText.length;
        globalCharCursor = end + (isSplitStart ? 1 : 1);

        currentPage.fragments.push({
          kind: 'paragraph',
          fragmentId: `${block.id}-part-${partIndex}`,
          sourceBlockId: block.id,
          pageNumber: currentPage.pageNumber,
          direction: dir,
          text: sliceText,
          isContinuation,
          isSplitStart,
          bidiSegments: segmentBidiRuns(sliceText, dir),
          estimatedHeightMm: fragmentHeightMm,
          charStart: start,
          charEnd: end,
        });
        currentPage.contentHeightMm += fragmentHeightMm;
        lineIdx += sliceLines.length;
        partIndex++;

        if (lineIdx < lines.length) {
          openNewPage();
        }
      }
      continue;
    }

    if (block.type === 'table') {
      const dir = resolveEffectiveDirection(block.direction, block.caption ?? '', baseDir);
      const headerRowSource = block.rows[0]?.cells.some((c) => c.isHeader)
        ? block.rows[0]
        : undefined;
      const normalizedHeader = headerRowSource
        ? {
            id: headerRowSource.id,
            cells: headerRowSource.cells.map((c) => ({
              id: c.id,
              text: c.text,
              direction: resolveEffectiveDirection(c.direction, c.text, dir),
            })),
          }
        : undefined;

      let rowCursor = 0;
      let tablePart = 0;

      while (rowCursor < block.rows.length) {
        let currentPage = getCurrentPage();
        const remainingMm = maxContentHeightMm - currentPage.contentHeightMm;
        const needsRepeatedHeader = tablePart > 0 && normalizedHeader !== undefined;
        const headerOverheadMm = needsRepeatedHeader ? TABLE_ROW_HEIGHT_MM : 0;
        const availableForRowsMm = remainingMm - headerOverheadMm;
        const fittingRowCount = Math.floor(availableForRowsMm / TABLE_ROW_HEIGHT_MM);

        if (fittingRowCount <= 0 && currentPage.fragments.length > 0) {
          currentPage = openNewPage();
          continue;
        }

        const takeCount = Math.max(1, fittingRowCount);
        const sliceRows = block.rows.slice(rowCursor, rowCursor + takeCount);
        const sliceText = sliceRows
          .map((r) => r.cells.map((c) => c.text).join(' | '))
          .join('\n');
        const start = globalCharCursor;
        const end = start + sliceText.length;
        globalCharCursor = end + 1;

        const fragmentHeightMm =
          sliceRows.length * TABLE_ROW_HEIGHT_MM + headerOverheadMm + PARAGRAPH_SPACING_MM;

        currentPage.fragments.push({
          kind: 'table',
          fragmentId: `${block.id}-tbl-${tablePart}`,
          sourceBlockId: block.id,
          pageNumber: currentPage.pageNumber,
          direction: dir,
          bidiVisual: block.bidiVisual,
          caption: tablePart === 0 ? block.caption : undefined,
          isContinuation: tablePart > 0,
          repeatedHeaderRow: needsRepeatedHeader ? normalizedHeader : undefined,
          rows: sliceRows.map((r) => ({
            id: r.id,
            cells: r.cells.map((c) => ({
              id: c.id,
              text: c.text,
              direction: resolveEffectiveDirection(c.direction, c.text, dir),
              isHeader: c.isHeader,
            })),
          })),
          estimatedHeightMm: fragmentHeightMm,
          charStart: start,
          charEnd: end,
        });

        currentPage.contentHeightMm += fragmentHeightMm;
        rowCursor += sliceRows.length;
        tablePart++;

        if (rowCursor < block.rows.length) {
          openNewPage();
        }
      }
      continue;
    }

    if (block.type === 'callout') {
      let currentPage = getCurrentPage();
      if (
        currentPage.fragments.length > 0 &&
        currentPage.contentHeightMm + CALLOUT_HEIGHT_MM > maxContentHeightMm
      ) {
        currentPage = openNewPage();
      }
      const text = getBlockPlainText(block);
      const start = globalCharCursor;
      const end = start + text.length;
      globalCharCursor = end + 1;

      currentPage.fragments.push({
        kind: 'callout',
        fragmentId: `${block.id}-p${currentPage.pageNumber}`,
        sourceBlockId: block.id,
        pageNumber: currentPage.pageNumber,
        direction: resolveEffectiveDirection(block.direction, text, baseDir),
        tone: block.tone,
        title: block.title,
        text: block.text,
        estimatedHeightMm: CALLOUT_HEIGHT_MM,
        charStart: start,
        charEnd: end,
      });
      currentPage.contentHeightMm += CALLOUT_HEIGHT_MM;
      continue;
    }

    if (block.type === 'signature') {
      let currentPage = getCurrentPage();
      if (
        currentPage.fragments.length > 0 &&
        currentPage.contentHeightMm + SIGNATURE_HEIGHT_MM > maxContentHeightMm
      ) {
        currentPage = openNewPage();
      }
      const text = getBlockPlainText(block);
      const start = globalCharCursor;
      const end = start + text.length;
      globalCharCursor = end + 1;

      currentPage.fragments.push({
        kind: 'signature',
        fragmentId: `${block.id}-p${currentPage.pageNumber}`,
        sourceBlockId: block.id,
        pageNumber: currentPage.pageNumber,
        direction: resolveEffectiveDirection(block.direction, text, baseDir),
        firstPartyLabel: block.firstPartyLabel,
        firstPartyName: block.firstPartyName,
        secondPartyLabel: block.secondPartyLabel,
        secondPartyName: block.secondPartyName,
        dateLabel: block.dateLabel,
        estimatedHeightMm: SIGNATURE_HEIGHT_MM,
        charStart: start,
        charEnd: end,
      });
      currentPage.contentHeightMm += SIGNATURE_HEIGHT_MM;
    }
  }

  const allFragments = pages.flatMap((p) => p.fragments);
  const pageBreakGuideOffsetsMm = pages.map((_, idx) => (idx + 1) * maxContentHeightMm);

  return {
    paperSize: doc.pageSetup.paperSize,
    totalHeightMm: pages.reduce((acc, p) => acc + p.contentHeightMm, 0),
    maxPageContentHeightMm: maxContentHeightMm,
    pages,
    pageBreakGuideOffsetsMm,
    resolveSelectionAcrossPages(startOffset: number, endOffset: number) {
      const normalizedStart = Math.max(0, Math.min(startOffset, endOffset));
      const normalizedEnd = Math.max(startOffset, endOffset);

      const touchedFragments = allFragments.filter(
        (f) => f.charEnd >= normalizedStart && f.charStart <= normalizedEnd
      );

      const pieces: string[] = [];
      for (const frag of touchedFragments) {
        let fragText = '';
        if (frag.kind === 'paragraph' || frag.kind === 'heading') {
          fragText = frag.text;
        } else if (frag.kind === 'table') {
          fragText = frag.rows.map((r) => r.cells.map((c) => c.text).join(' | ')).join('\n');
        } else if (frag.kind === 'callout') {
          fragText = `${frag.title}: ${frag.text}`;
        } else if (frag.kind === 'signature') {
          fragText = `${frag.firstPartyLabel}: ${frag.firstPartyName} / ${frag.secondPartyLabel}: ${frag.secondPartyName}`;
        }

        const localStart = Math.max(0, normalizedStart - frag.charStart);
        const localEnd = Math.min(fragText.length, normalizedEnd - frag.charStart);
        if (localEnd > localStart) {
          pieces.push(fragText.slice(localStart, localEnd));
        }
      }

      const touchedPages = Array.from(new Set(touchedFragments.map((f) => f.pageNumber)));
      const touchedBlockIds = Array.from(new Set(touchedFragments.map((f) => f.sourceBlockId)));

      return {
        selectedText: pieces.join(' '),
        touchedPages,
        touchedBlockIds,
        isContinuous: touchedFragments.length > 0,
      };
    },
  };
}
