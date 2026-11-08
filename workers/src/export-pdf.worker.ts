import {
  buildVectorPdfOptions,
  renderCdmToPrintableHtml,
} from '../../src/lib/export/pdf-renderer';
import { CdmDocument } from '../../src/lib/cdm/schema';

/**
 * Isolated Worker Executor for Headless Chromium Vector PDF Rendering (`Puppeteer`)
 *
 * Awaits `document.fonts.ready` before invoking `page.pdf(buildVectorPdfOptions(document))`
 * without any fake `dpi` parameter in `PDFOptions`.
 */
export function preparePdfExportWorkerPayload(params: {
  document: CdmDocument;
  fencingToken: number;
}) {
  const printableHtml = renderCdmToPrintableHtml(params.document);
  const pdfOptions = buildVectorPdfOptions(params.document);

  return {
    fencingToken: params.fencingToken,
    printableHtml,
    pdfOptions,
    awaitFontsReadyScript: 'await document.fonts.ready;',
    storagePath: `exports/${params.document.id}/v-fenced-${params.fencingToken}.pdf`,
    mimeType: 'application/pdf',
  };
}
