import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import type { CdmDocument } from '../cdm/schema.ts';
import { resolveEffectiveDirection } from '../cdm/bidi.ts';

/**
 * DOCORA Native OOXML Compiler (`docx@9.15.2`)
 *
 * Enforces Fix #4 (`ADR-002`):
 * - Uses pinned `docx@9.15.2`.
 * - Applies `visuallyRightToLeft: true` (`<w:bidiVisual/>`) on Arabic/RTL tables so columns
 *   order right-to-left natively inside Microsoft Word without inversion.
 * - Applies `bidirectional: true` (`<w:bidi/>`) and `AlignmentType.RIGHT` on Arabic paragraphs and table cells.
 * - Applies `rightToLeft: true` (`<w:rtl/>`) and explicit `font: { ascii, hAnsi, cs }` (`RunFonts`) on runs.
 */

const ARABIC_DOC_FONTS = {
  ascii: 'IBM Plex Sans Arabic',
  hAnsi: 'IBM Plex Sans Arabic',
  cs: 'Noto Naskh Arabic',
};

const LATIN_DOC_FONTS = {
  ascii: 'Inter',
  hAnsi: 'Inter',
  cs: 'IBM Plex Sans Arabic',
};

function resolveAlignment(
  dir: 'rtl' | 'ltr',
  align: 'start' | 'center' | 'end' | 'justify' = 'start'
) {
  if (align === 'center') return AlignmentType.CENTER;
  if (align === 'justify') return AlignmentType.JUSTIFIED;
  if (align === 'end') {
    return dir === 'rtl' ? AlignmentType.LEFT : AlignmentType.RIGHT;
  }
  return dir === 'rtl' ? AlignmentType.RIGHT : AlignmentType.LEFT;
}

export function buildDocxDocumentModel(cdm: CdmDocument): Document {
  const baseDir: 'rtl' | 'ltr' = cdm.defaultDirection === 'ltr' ? 'ltr' : 'rtl';
  const children: (Paragraph | Table)[] = [];

  for (const block of cdm.blocks) {
    if (block.type === 'heading') {
      const dir = resolveEffectiveDirection(block.direction, block.text, baseDir);
      const isRtl = dir === 'rtl';
      const fonts = isRtl ? ARABIC_DOC_FONTS : LATIN_DOC_FONTS;

      children.push(
        new Paragraph({
          heading:
            block.level === 1
              ? HeadingLevel.HEADING_1
              : block.level === 2
              ? HeadingLevel.HEADING_2
              : HeadingLevel.HEADING_3,
          bidirectional: isRtl,
          keepNext: block.keepWithNext,
          alignment: resolveAlignment(dir, 'start'),
          spacing: { before: 240, after: 120 },
          children: [
            new TextRun({
              text: block.text,
              bold: true,
              rightToLeft: isRtl,
              font: fonts,
              size: block.level === 1 ? 32 : block.level === 2 ? 26 : 22,
            }),
          ],
        })
      );
      continue;
    }

    if (block.type === 'paragraph') {
      const joined = block.runs.map((r) => r.text).join('');
      const dir = resolveEffectiveDirection(block.direction, joined, baseDir);
      const isRtl = dir === 'rtl';

      children.push(
        new Paragraph({
          bidirectional: isRtl,
          alignment: resolveAlignment(dir, block.align),
          spacing: { after: 160, line: 340 },
          children: block.runs.map((run) => {
            const runDir = resolveEffectiveDirection(run.direction, run.text, dir);
            const runRtl = runDir === 'rtl';
            const fonts = runRtl ? ARABIC_DOC_FONTS : LATIN_DOC_FONTS;
            const hasMark = (t: string) => run.marks.some((m) => m.type === t);

            return new TextRun({
              text: run.text,
              rightToLeft: runRtl,
              bold: hasMark('bold'),
              italics: hasMark('italic'),
              font: fonts,
              size: 22,
            });
          }),
        })
      );
      continue;
    }

    if (block.type === 'table') {
      const dir = resolveEffectiveDirection(block.direction, block.caption ?? '', baseDir);
      const isTableRtl = block.bidiVisual || dir === 'rtl';

      if (block.caption) {
        children.push(
          new Paragraph({
            bidirectional: isTableRtl,
            keepNext: true,
            alignment: resolveAlignment(isTableRtl ? 'rtl' : 'ltr', 'start'),
            spacing: { before: 180, after: 80 },
            children: [
              new TextRun({
                text: block.caption,
                bold: true,
                rightToLeft: isTableRtl,
                font: isTableRtl ? ARABIC_DOC_FONTS : LATIN_DOC_FONTS,
                size: 20,
              }),
            ],
          })
        );
      }

      const tableRows = block.rows.map(
        (row, rIdx) =>
          new TableRow({
            tableHeader: rIdx === 0 && row.cells.some((c) => c.isHeader),
            cantSplit: true,
            children: row.cells.map((cell) => {
              const cellDir = resolveEffectiveDirection(
                cell.direction,
                cell.text,
                isTableRtl ? 'rtl' : 'ltr'
              );
              const isCellRtl = cellDir === 'rtl';
              const fonts = isCellRtl ? ARABIC_DOC_FONTS : LATIN_DOC_FONTS;

              return new TableCell({
                shading: cell.isHeader
                  ? {
                      fill: 'F1F5F9',
                      type: ShadingType.CLEAR,
                      color: 'auto',
                    }
                  : undefined,
                margins: {
                  top: 120,
                  bottom: 120,
                  left: 160,
                  right: 160,
                },
                children: [
                  new Paragraph({
                    bidirectional: isCellRtl,
                    alignment: resolveAlignment(cellDir, cell.align),
                    children: [
                      new TextRun({
                        text: cell.text,
                        bold: cell.isHeader,
                        rightToLeft: isCellRtl,
                        font: fonts,
                        size: 20,
                      }),
                    ],
                  }),
                ],
              });
            }),
          })
      );

      children.push(
        new Table({
          visuallyRightToLeft: isTableRtl,
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
            left: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
            right: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
            insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
          },
          rows: tableRows,
        })
      );
      continue;
    }

    if (block.type === 'callout') {
      const dir = resolveEffectiveDirection(block.direction, block.text, baseDir);
      const isRtl = dir === 'rtl';
      const fonts = isRtl ? ARABIC_DOC_FONTS : LATIN_DOC_FONTS;

      children.push(
        new Paragraph({
          bidirectional: isRtl,
          alignment: resolveAlignment(dir, 'start'),
          spacing: { before: 160, after: 160 },
          children: [
            new TextRun({
              text: `[${block.title}] `,
              bold: true,
              rightToLeft: isRtl,
              font: fonts,
              size: 21,
            }),
            new TextRun({
              text: block.text,
              rightToLeft: isRtl,
              font: fonts,
              size: 21,
            }),
          ],
        })
      );
      continue;
    }

    if (block.type === 'signature') {
      const dir = resolveEffectiveDirection(block.direction, block.firstPartyName, baseDir);
      const isRtl = dir === 'rtl';
      const fonts = isRtl ? ARABIC_DOC_FONTS : LATIN_DOC_FONTS;

      children.push(
        new Paragraph({
          bidirectional: isRtl,
          alignment: resolveAlignment(dir, 'start'),
          spacing: { before: 280, after: 120 },
          children: [
            new TextRun({
              text: `${block.firstPartyLabel}: ${block.firstPartyName}    |    ${block.secondPartyLabel}: ${block.secondPartyName}    (${block.dateLabel})`,
              bold: true,
              rightToLeft: isRtl,
              font: fonts,
              size: 21,
            }),
          ],
        })
      );
    }
  }

  return new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });
}

export async function compileCdmToDocxBuffer(cdm: CdmDocument): Promise<Buffer> {
  const doc = buildDocxDocumentModel(cdm);
  return Packer.toBuffer(doc);
}
