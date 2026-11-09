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

/**
 * Parses raw PDF binary bytes on the server, extracting text chunks from text streams
 * and identifying page counts and text-layer presence.
 */
export function extractTextFromPdfBinaryBuffer(buffer: Buffer): {
  pageCount: number;
  pageTexts: string[];
  isScanned: boolean;
} {
  if (buffer.byteLength < 5) {
    throw new Error('Invalid PDF binary payload: file is too small');
  }

  const magic = buffer.subarray(0, 5).toString('ascii');
  if (!magic.startsWith('%PDF-')) {
    throw new Error('Invalid file format: missing %PDF- header magic bytes');
  }

  const raw = buffer.toString('utf-8');

  // Count /Type /Page objects
  const pageMatches = raw.match(/\/Type\s*\/Page\b/g);
  const pageCount = Math.max(1, pageMatches ? pageMatches.length : 1);

  // Extract text runs inside streams: BT ... ET
  const textMatches: string[] = [];
  const textStreamRegex = /BT([\s\S]*?)ET/g;
  let match: RegExpExecArray | null;

  while ((match = textStreamRegex.exec(raw)) !== null) {
    const block = match[1];
    // Match string literals ( ... ) Tj with support for escaped parentheses: \( and \)
    const stringLiteralRegex = /\(((?:[^()\\]|\\.)*)\)\s*Tj/g;
    let litMatch: RegExpExecArray | null;
    while ((litMatch = stringLiteralRegex.exec(block)) !== null) {
      const clean = litMatch[1]
        .replace(/\\([0-7]{1,3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)))
        .replace(/\\([\\()])/g, '$1')
        .replace(/\r?\n/g, ' ')
        .trim();
      if (clean) textMatches.push(clean);
    }
  }

  const fullExtracted = textMatches.join(' ');
  const isScanned = fullExtracted.length < 20;

  // Approximate division across pages
  const pageTexts: string[] = [];
  if (pageCount === 1 || isScanned) {
    pageTexts.push(fullExtracted || ' ');
  } else {
    const chunkSize = Math.ceil(textMatches.length / pageCount);
    for (let p = 0; p < pageCount; p++) {
      const pageSlice = textMatches.slice(p * chunkSize, (p + 1) * chunkSize);
      pageTexts.push(pageSlice.join(' ') || ' ');
    }
  }

  return {
    pageCount,
    pageTexts,
    isScanned,
  };
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
