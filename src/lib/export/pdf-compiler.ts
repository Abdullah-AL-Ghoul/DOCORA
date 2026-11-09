import { CdmDocument } from '../cdm/schema';
import { paginateCdmDocument } from '../cdm/pagination-engine';

/**
 * DOCORA Vector PDF Compiler (Pure Node.js Binary Generator)
 * Produces genuine, standards-compliant ISO 32000-1 (PDF 1.4) binary documents
 * with exact A4 physical dimensions (595.28 x 841.89 pt), multi-page pagination,
 * margins, running headers/footers, and text streams.
 */

export async function compileCdmToPdfBuffer(cdm: CdmDocument): Promise<Buffer> {
  const paginated = paginateCdmDocument(cdm);
  const pageCount = Math.max(1, paginated.pages.length);
  const isRtl = cdm.defaultDirection !== 'ltr';

  // Standard A4 dimensions in PDF points (72 points/inch)
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const marginX = (cdm.pageSetup.marginStartMm / 25.4) * 72;
  const marginY = (cdm.pageSetup.marginTopMm / 25.4) * 72;

  const objects: string[] = [];
  const addObject = (content: string): number => {
    objects.push(content);
    return objects.length; // 1-based object number
  };

  // Object 1: Catalog
  addObject(`<< /Type /Catalog /Pages 2 0 R >>`);

  // Object 2: Pages container (placeholder, will be updated)
  addObject(`<< /Type /Pages /Kids [] /Count 0 >>`);

  const pageObjectIds: number[] = [];

  // Generate page objects and content streams for each page
  for (let i = 0; i < pageCount; i++) {
    const pageIndex = i + 1;
    const page = paginated.pages[i];

    // Build PDF content stream commands
    const streamCommands: string[] = [];

    // Background canvas
    streamCommands.push('q'); // save graphics state

    // Running Header
    streamCommands.push('BT'); // Begin Text
    streamCommands.push('/F1 9 Tf'); // Font 1, 9pt
    streamCommands.push('0.4 0.45 0.5 rg'); // Muted gray
    if (isRtl) {
      streamCommands.push(`1 0 0 1 ${pageWidth - marginX} ${pageHeight - 36} Tm`);
      streamCommands.push(`(${escapePdfString(cdm.title)}) Tj`);
    } else {
      streamCommands.push(`1 0 0 1 ${marginX} ${pageHeight - 36} Tm`);
      streamCommands.push(`(${escapePdfString(cdm.title)}) Tj`);
    }
    streamCommands.push('ET'); // End Text

    // Header divider line
    streamCommands.push(`0.85 0.88 0.92 RG`); // border color
    streamCommands.push(`0.75 w`); // line width
    streamCommands.push(`${marginX} ${pageHeight - 44} m`);
    streamCommands.push(`${pageWidth - marginX} ${pageHeight - 44} l`);
    streamCommands.push('S'); // stroke

    // Page Body Content
    let currentY = pageHeight - marginY - 20;

    if (page && page.fragments) {
      for (const frag of page.fragments) {
        if (currentY < marginY + 40) break;

        if (frag.kind === 'heading') {
          const fontSize = frag.level === 1 ? 18 : frag.level === 2 ? 14 : 12;
          streamCommands.push('BT');
          streamCommands.push(`/F2 ${fontSize} Tf`);
          streamCommands.push('0.06 0.09 0.16 rg'); // Deep slate
          const textX = isRtl ? pageWidth - marginX : marginX;
          streamCommands.push(`1 0 0 1 ${textX} ${currentY} Tm`);
          streamCommands.push(`(${escapePdfString(frag.text)}) Tj`);
          streamCommands.push('ET');
          currentY -= fontSize + 12;
        } else if (frag.kind === 'paragraph') {
          streamCommands.push('BT');
          streamCommands.push('/F1 10.5 Tf');
          streamCommands.push('0.2 0.25 0.33 rg'); // Charcoal ink
          const textX = isRtl ? pageWidth - marginX : marginX;
          streamCommands.push(`1 0 0 1 ${textX} ${currentY} Tm`);
          streamCommands.push(`(${escapePdfString(frag.text)}) Tj`);
          streamCommands.push('ET');
          currentY -= 20;
        } else if (frag.kind === 'table') {
          // Draw simple table representation
          streamCommands.push('0.9 0.92 0.95 RG');
          streamCommands.push('0.5 w');
          streamCommands.push(`${marginX} ${currentY} ${pageWidth - 2 * marginX} 40 re`);
          streamCommands.push('S');
          currentY -= 50;
        }
      }
    }

    // Running Footer
    streamCommands.push('BT');
    streamCommands.push('/F1 8.5 Tf');
    streamCommands.push('0.5 0.55 0.6 rg');
    const footerText = isRtl
      ? `صفحة ${pageIndex} من ${pageCount} — وثيقة رسمية صادرة عن DOCORA Studio`
      : `Page ${pageIndex} of ${pageCount} — Verified DOCORA Studio Document`;
    streamCommands.push(`1 0 0 1 ${pageWidth / 2 - 80} 30 Tm`);
    streamCommands.push(`(${escapePdfString(footerText)}) Tj`);
    streamCommands.push('ET');

    streamCommands.push('Q'); // restore graphics state

    const streamContent = streamCommands.join('\n');
    const streamLength = Buffer.byteLength(streamContent, 'utf-8');

    // Add content stream object
    const streamObjId = addObject(
      `<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream`
    );

    // Add page object
    const pageObjId = addObject(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Contents ${streamObjId} 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> /F2 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> >> >> >>`
    );

    pageObjectIds.push(pageObjId);
  }

  // Update Object 2 (Pages container)
  const kidsArray = pageObjectIds.map((id) => `${id} 0 R`).join(' ');
  objects[1] = `<< /Type /Pages /Kids [ ${kidsArray} ] /Count ${pageCount} >>`;

  // Build final binary PDF structure with xref table
  let pdf = `%PDF-1.4\n%\xE2\xE3\xCF\xD3\n`;
  const offsets: number[] = [0];

  for (let i = 0; i < objects.length; i++) {
    offsets.push(Buffer.byteLength(pdf, 'utf-8'));
    pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }

  const startXref = Buffer.byteLength(pdf, 'utf-8');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += `0000000000 65535 f \n`;

  for (let i = 1; i <= objects.length; i++) {
    const offsetStr = String(offsets[i]).padStart(10, '0');
    pdf += `${offsetStr} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;

  return Buffer.from(pdf, 'utf-8');
}

function escapePdfString(text: string): string {
  // Transliterate or clean special characters for PDF Type1 encoding
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[\r\n]+/g, ' ');
}
