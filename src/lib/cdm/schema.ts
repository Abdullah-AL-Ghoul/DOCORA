import { z } from 'zod';

/**
 * DOCORA Canonical Document Model (CDM v1.2)
 * Strictly validated bilingual AST representation for Phase 01 MVP.
 */

export const TextDirectionSchema = z.enum(['rtl', 'ltr', 'auto']);
export type TextDirection = z.infer<typeof TextDirectionSchema>;

export const DocumentLocaleSchema = z.enum(['ar', 'en']);
export type DocumentLocale = z.infer<typeof DocumentLocaleSchema>;

export const DocumentCategorySchema = z.enum([
  'general',
  'legal',
  'executive',
  'financial',
  'technical',
]);
export type DocumentCategory = z.infer<typeof DocumentCategorySchema>;

export const InlineMarkSchema = z.object({
  type: z.enum(['bold', 'italic', 'underline', 'highlight', 'code']),
});
export type InlineMark = z.infer<typeof InlineMarkSchema>;

export const InlineRunSchema = z.object({
  text: z.string(),
  direction: TextDirectionSchema.optional(),
  marks: z.array(InlineMarkSchema).default([]),
});
export type InlineRun = z.infer<typeof InlineRunSchema>;

export const ParagraphBlockSchema = z.object({
  id: z.string().min(1),
  type: z.literal('paragraph'),
  direction: TextDirectionSchema.default('auto'),
  align: z.enum(['start', 'center', 'end', 'justify']).default('start'),
  runs: z.array(InlineRunSchema).min(1),
});
export type ParagraphBlock = z.infer<typeof ParagraphBlockSchema>;

export const HeadingBlockSchema = z.object({
  id: z.string().min(1),
  type: z.literal('heading'),
  level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  direction: TextDirectionSchema.default('auto'),
  keepWithNext: z.boolean().default(true),
  text: z.string().min(1),
});
export type HeadingBlock = z.infer<typeof HeadingBlockSchema>;

export const TableCellSchema = z.object({
  id: z.string().min(1),
  text: z.string(),
  direction: TextDirectionSchema.default('auto'),
  align: z.enum(['start', 'center', 'end']).default('start'),
  isHeader: z.boolean().default(false),
});
export type TableCell = z.infer<typeof TableCellSchema>;

export const TableRowSchema = z.object({
  id: z.string().min(1),
  cells: z.array(TableCellSchema).min(1),
});
export type TableRow = z.infer<typeof TableRowSchema>;

export const TableBlockSchema = z.object({
  id: z.string().min(1),
  type: z.literal('table'),
  direction: TextDirectionSchema.default('rtl'),
  bidiVisual: z.boolean().default(true),
  caption: z.string().optional(),
  rows: z.array(TableRowSchema).min(1),
});
export type TableBlock = z.infer<typeof TableBlockSchema>;

export const CalloutBlockSchema = z.object({
  id: z.string().min(1),
  type: z.literal('callout'),
  tone: z.enum(['info', 'warning', 'legal', 'verified']).default('info'),
  direction: TextDirectionSchema.default('auto'),
  title: z.string().min(1),
  text: z.string().min(1),
});
export type CalloutBlock = z.infer<typeof CalloutBlockSchema>;

export const SignatureBlockSchema = z.object({
  id: z.string().min(1),
  type: z.literal('signature'),
  direction: TextDirectionSchema.default('rtl'),
  firstPartyLabel: z.string().min(1),
  firstPartyName: z.string().min(1),
  secondPartyLabel: z.string().min(1),
  secondPartyName: z.string().min(1),
  dateLabel: z.string().min(1),
});
export type SignatureBlock = z.infer<typeof SignatureBlockSchema>;

export const CdmBlockSchema = z.discriminatedUnion('type', [
  ParagraphBlockSchema,
  HeadingBlockSchema,
  TableBlockSchema,
  CalloutBlockSchema,
  SignatureBlockSchema,
]);
export type CdmBlock = z.infer<typeof CdmBlockSchema>;

export const CdmDocumentSchema = z.object({
  cdmVersion: z.literal('1.2.0'),
  id: z.string().min(1),
  title: z.string().min(1).max(240),
  locale: DocumentLocaleSchema,
  defaultDirection: TextDirectionSchema,
  category: DocumentCategorySchema,
  requiresLegalDisclaimer: z.boolean().default(false),
  pageSetup: z
    .object({
      paperSize: z.enum(['A4', 'LETTER']).default('A4'),
      marginTopMm: z.number().min(10).max(50).default(20),
      marginBottomMm: z.number().min(10).max(50).default(20),
      marginStartMm: z.number().min(10).max(50).default(22),
      marginEndMm: z.number().min(10).max(50).default(22),
    })
    .default({
      paperSize: 'A4',
      marginTopMm: 20,
      marginBottomMm: 20,
      marginStartMm: 22,
      marginEndMm: 22,
    }),
  blocks: z.array(CdmBlockSchema).min(1),
  generationState: z
    .object({
      status: z.enum(['COMPLETE', 'INTERRUPTED', 'STREAMING']).default('COMPLETE'),
      completedBlockCount: z.number().int().min(0).default(0),
      lastCompletedBlockId: z.string().optional(),
      resumeContextPrompt: z.string().optional(),
    })
    .default({
      status: 'COMPLETE',
      completedBlockCount: 0,
    }),
});
export type CdmDocument = z.infer<typeof CdmDocumentSchema>;
