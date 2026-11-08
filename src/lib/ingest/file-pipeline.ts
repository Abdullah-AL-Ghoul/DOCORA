import JSZip from 'jszip';
import { detectFirstStrongDirection } from '../cdm/bidi';

/**
 * DOCORA Phase 01 File Ingestion Pipeline & ZIP Bomb Guard
 *
 * Zero Phase Leakage:
 * - Phase 01 handles Digital PDF text extraction (`pdfjs-dist` compatible) and archive safety (ZIP Bomb Guard).
 * - Tesseract 5.5.4 OCR for scanned PDFs is strictly deferred to Phase 03.
 */

export interface ZipSafetyLimits {
  maxCompressedBytes: number;
  maxUncompressedBytes: number;
  maxCompressionRatio: number;
  maxEntries: number;
}

export const DEFAULT_ZIP_SAFETY_LIMITS: ZipSafetyLimits = {
  maxCompressedBytes: 25 * 1024 * 1024, // 25 MB
  maxUncompressedBytes: 60 * 1024 * 1024, // 60 MB
  maxCompressionRatio: 40, // Max 40:1 compression ratio
  maxEntries: 250,
};

export async function inspectZipContainerSafety(
  buffer: Buffer,
  limits: ZipSafetyLimits = DEFAULT_ZIP_SAFETY_LIMITS
): Promise<{
  safe: boolean;
  entryCount: number;
  totalUncompressedBytes: number;
  reason?: string;
}> {
  if (buffer.byteLength > limits.maxCompressedBytes) {
    return {
      safe: false,
      entryCount: 0,
      totalUncompressedBytes: 0,
      reason: `Compressed payload exceeds ${limits.maxCompressedBytes} bytes limit`,
    };
  }

  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(buffer);
  } catch (err) {
    return {
      safe: false,
      entryCount: 0,
      totalUncompressedBytes: 0,
      reason: `Invalid or corrupted ZIP container: ${
        err instanceof Error ? err.message : 'Unable to parse archive'
      }`,
    };
  }
  const fileNames = Object.keys(zip.files);
  if (fileNames.length > limits.maxEntries) {
    return {
      safe: false,
      entryCount: fileNames.length,
      totalUncompressedBytes: 0,
      reason: `Archive contains ${fileNames.length} entries, exceeding limit of ${limits.maxEntries}`,
    };
  }

  let totalUncompressedBytes = 0;
  for (const name of fileNames) {
    const entry = zip.files[name];
    if (entry.dir) continue;
    const content = await entry.async('uint8array');
    totalUncompressedBytes += content.byteLength;

    if (totalUncompressedBytes > limits.maxUncompressedBytes) {
      return {
        safe: false,
        entryCount: fileNames.length,
        totalUncompressedBytes,
        reason: `Uncompressed size exceeds ${limits.maxUncompressedBytes} bytes (ZIP bomb guard triggered)`,
      };
    }

    const ratio = totalUncompressedBytes / Math.max(1, buffer.byteLength);
    if (ratio > limits.maxCompressionRatio) {
      return {
        safe: false,
        entryCount: fileNames.length,
        totalUncompressedBytes,
        reason: `Compression ratio ${ratio.toFixed(1)}:1 exceeds safe maximum ${limits.maxCompressionRatio}:1`,
      };
    }
  }

  return {
    safe: true,
    entryCount: fileNames.length,
    totalUncompressedBytes,
  };
}

export interface DigitalPdfExtractionResult {
  classification: 'DIGITAL_TEXT_PDF' | 'SCANNED_PDF_DEFERRED_TO_PHASE_03';
  pageCount: number;
  extractedParagraphs: {
    id: string;
    text: string;
    direction: 'rtl' | 'ltr';
  }[];
  phaseNotice?: string;
}

export function classifyAndExtractDigitalPdfText(params: {
  pageTexts: string[];
}): DigitalPdfExtractionResult {
  const cleanedPages = params.pageTexts.map((t) => t.trim()).filter(Boolean);
  const totalChars = cleanedPages.reduce((sum, p) => sum + p.length, 0);

  if (totalChars < 20) {
    return {
      classification: 'SCANNED_PDF_DEFERRED_TO_PHASE_03',
      pageCount: Math.max(1, params.pageTexts.length),
      extractedParagraphs: [],
      phaseNotice:
        'Scanned image-only PDF detected. Optical Character Recognition (Tesseract 5.5.4 Worker) is scheduled for Phase 03 per Zero-Leakage Phase Separation.',
    };
  }

  const paragraphs = cleanedPages.flatMap((pageText, pIdx) =>
    pageText
      .split(/\n{2,}/)
      .map((para) => para.trim())
      .filter(Boolean)
      .map((para, idx) => ({
        id: `pdf-p${pIdx + 1}-${idx + 1}`,
        text: para,
        direction: detectFirstStrongDirection(para, 'rtl'),
      }))
  );

  return {
    classification: 'DIGITAL_TEXT_PDF',
    pageCount: params.pageTexts.length,
    extractedParagraphs: paragraphs,
  };
}
