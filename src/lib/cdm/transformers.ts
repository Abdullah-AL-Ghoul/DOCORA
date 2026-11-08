import { CdmBlock, CdmDocument, CdmDocumentSchema } from './schema';
import { resolveEffectiveDirection } from './bidi';

export interface TiptapJsonNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapJsonNode[];
  marks?: { type: string }[];
  text?: string;
}

/**
 * Converts a validated CDM v1.2 Document into Tiptap 3.x ProseMirror JSON
 * with native `textDirection` attributes (`'rtl' | 'ltr' | 'auto'`).
 */
export function cdmToTiptapJson(doc: CdmDocument): TiptapJsonNode {
  const baseDir: 'rtl' | 'ltr' = doc.defaultDirection === 'ltr' ? 'ltr' : 'rtl';
  const content: TiptapJsonNode[] = [];

  for (const block of doc.blocks) {
    if (block.type === 'heading') {
      const dir = resolveEffectiveDirection(block.direction, block.text, baseDir);
      content.push({
        type: 'heading',
        attrs: {
          level: block.level,
          textDirection: dir,
        },
        content: [{ type: 'text', text: block.text }],
      });
    } else if (block.type === 'paragraph') {
      const joined = block.runs.map((r) => r.text).join('');
      const dir = resolveEffectiveDirection(block.direction, joined, baseDir);
      content.push({
        type: 'paragraph',
        attrs: {
          textDirection: dir,
        },
        content: block.runs.map((run) => ({
          type: 'text',
          text: run.text,
          marks: run.marks.map((m) => ({ type: m.type })),
        })),
      });
    } else if (block.type === 'table') {
      const dir = resolveEffectiveDirection(block.direction, block.caption ?? '', baseDir);
      content.push({
        type: 'table',
        attrs: {
          textDirection: dir,
        },
        content: block.rows.map((row) => ({
          type: 'tableRow',
          content: row.cells.map((cell) => ({
            type: cell.isHeader ? 'tableHeader' : 'tableCell',
            attrs: {
              textDirection: resolveEffectiveDirection(cell.direction, cell.text, dir),
            },
            content: [
              {
                type: 'paragraph',
                attrs: {
                  textDirection: resolveEffectiveDirection(cell.direction, cell.text, dir),
                },
                content: cell.text ? [{ type: 'text', text: cell.text }] : [],
              },
            ],
          })),
        })),
      });
    } else if (block.type === 'callout') {
      const dir = resolveEffectiveDirection(block.direction, block.text, baseDir);
      content.push({
        type: 'blockquote',
        attrs: {
          textDirection: dir,
        },
        content: [
          {
            type: 'paragraph',
            attrs: { textDirection: dir },
            content: [
              { type: 'text', text: `${block.title} — `, marks: [{ type: 'bold' }] },
              { type: 'text', text: block.text },
            ],
          },
        ],
      });
    } else if (block.type === 'signature') {
      const dir = resolveEffectiveDirection(block.direction, block.firstPartyName, baseDir);
      content.push({
        type: 'paragraph',
        attrs: { textDirection: dir },
        content: [
          {
            type: 'text',
            text: `${block.firstPartyLabel}: ${block.firstPartyName}   |   ${block.secondPartyLabel}: ${block.secondPartyName}   (${block.dateLabel})`,
            marks: [{ type: 'bold' }],
          },
        ],
      });
    }
  }

  return {
    type: 'doc',
    content,
  };
}

/**
 * Synchronizes edited Tiptap 3.x ProseMirror JSON back into a validated CDM v1.2 Document.
 */
export function tiptapJsonToCdmBlocks(
  tiptapDoc: TiptapJsonNode,
  fallbackDirection: 'rtl' | 'ltr' = 'rtl'
): CdmBlock[] {
  const nodes = tiptapDoc.content ?? [];
  const blocks: CdmBlock[] = [];

  nodes.forEach((node, index) => {
    const id = `blk-${index + 1}`;
    const rawDir = node.attrs?.textDirection;
    const nodeDir =
      rawDir === 'rtl' || rawDir === 'ltr' || rawDir === 'auto' ? rawDir : 'auto';

    if (node.type === 'heading') {
      const text = (node.content ?? []).map((c) => c.text ?? '').join('').trim();
      if (!text) return;
      const rawLevel = Number(node.attrs?.level ?? 2);
      const level: 1 | 2 | 3 = rawLevel === 1 ? 1 : rawLevel === 3 ? 3 : 2;
      blocks.push({
        id,
        type: 'heading',
        level,
        direction: resolveEffectiveDirection(nodeDir, text, fallbackDirection),
        keepWithNext: true,
        text,
      });
    } else if (node.type === 'paragraph') {
      const runs = (node.content ?? [])
        .filter((c) => typeof c.text === 'string' && c.text.length > 0)
        .map((c) => ({
          text: c.text ?? '',
          marks: (c.marks ?? [])
            .filter((m) =>
              ['bold', 'italic', 'underline', 'highlight', 'code'].includes(m.type)
            )
            .map((m) => ({
              type: m.type as 'bold' | 'italic' | 'underline' | 'highlight' | 'code',
            })),
        }));
      if (runs.length === 0) return;
      const joined = runs.map((r) => r.text).join('');
      blocks.push({
        id,
        type: 'paragraph',
        direction: resolveEffectiveDirection(nodeDir, joined, fallbackDirection),
        align: 'start',
        runs,
      });
    } else if (node.type === 'table') {
      const rows = (node.content ?? []).map((rowNode, rIdx) => ({
        id: `${id}-r${rIdx + 1}`,
        cells: (rowNode.content ?? []).map((cellNode, cIdx) => {
          const cellText = (cellNode.content ?? [])
            .flatMap((p) => p.content ?? [])
            .map((t) => t.text ?? '')
            .join(' ')
            .trim();
          const cellDir = resolveEffectiveDirection('auto', cellText, fallbackDirection);
          return {
            id: `${id}-r${rIdx + 1}-c${cIdx + 1}`,
            text: cellText || '—',
            direction: cellDir,
            align: 'start' as const,
            isHeader: cellNode.type === 'tableHeader' || rIdx === 0,
          };
        }),
      }));
      if (rows.length > 0) {
        blocks.push({
          id,
          type: 'table',
          direction: fallbackDirection,
          bidiVisual: fallbackDirection === 'rtl',
          rows,
        });
      }
    } else if (node.type === 'blockquote') {
      const text = (node.content ?? [])
        .flatMap((p) => p.content ?? [])
        .map((t) => t.text ?? '')
        .join(' ')
        .trim();
      if (text) {
        blocks.push({
          id,
          type: 'callout',
          tone: 'info',
          direction: resolveEffectiveDirection(nodeDir, text, fallbackDirection),
          title: fallbackDirection === 'rtl' ? 'ملاحظة تنظيمية' : 'Regulatory Note',
          text,
        });
      }
    }
  });

  if (blocks.length === 0) {
    blocks.push({
      id: 'blk-1',
      type: 'paragraph',
      direction: fallbackDirection,
      align: 'start',
      runs: [{ text: fallbackDirection === 'rtl' ? 'مستند جديد' : 'New Document', marks: [] }],
    });
  }

  return blocks;
}

export function validateCdmDocument(payload: unknown): CdmDocument {
  return CdmDocumentSchema.parse(payload);
}
