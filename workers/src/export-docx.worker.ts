import { compileCdmToDocxBuffer } from '../../src/lib/export/docx-compiler.ts';
import type { CdmDocument } from '../../src/lib/cdm/schema.ts';

/**
 * Isolated Worker Executor for `docx@9.15.2` compilation
 */
export async function executeDocxExportWorkerJob(params: {
  document: CdmDocument;
  fencingToken: number;
}): Promise<{
  buffer: Buffer;
  fencingToken: number;
  storagePath: string;
  mimeType: string;
}> {
  const buffer = await compileCdmToDocxBuffer(params.document);
  return {
    buffer,
    fencingToken: params.fencingToken,
    storagePath: `exports/${params.document.id}/v-fenced-${params.fencingToken}.docx`,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };
}
