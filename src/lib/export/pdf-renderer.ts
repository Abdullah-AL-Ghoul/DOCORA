import { CdmDocument } from '../cdm/schema';
import { paginateCdmDocument } from '../cdm/pagination-engine';

/**
 * DOCORA Vector PDF Renderer & 300 DPI SSIM Visual Fidelity Specification
 *
 * Enforces Fix #4 (`ADR-002`):
 * 1. Puppeteer generates a vector PDF via `page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true })`
 *    after awaiting `document.fonts.ready`.
 * 2. There is NO fake `dpi` parameter in `PDFOptions`.
 * 3. 300 DPI is used strictly in the visual QA rasterization harness (`rasterizeAtDpi: 300`) when converting
 *    PDF pages to PNG for $\text{SSIM} \ge 0.95$ comparison.
 */

export interface PuppeteerVectorPdfOptions {
  format: 'A4' | 'Letter';
  printBackground: true;
  preferCSSPageSize: true;
  margin: {
    top: string;
    bottom: string;
    left: string;
    right: string;
  };
}

export function buildVectorPdfOptions(cdm: CdmDocument): PuppeteerVectorPdfOptions {
  return {
    format: cdm.pageSetup.paperSize === 'A4' ? 'A4' : 'Letter',
    printBackground: true,
    preferCSSPageSize: true,
    margin: {
      top: `${cdm.pageSetup.marginTopMm}mm`,
      bottom: `${cdm.pageSetup.marginBottomMm}mm`,
      left: `${cdm.pageSetup.marginStartMm}mm`,
      right: `${cdm.pageSetup.marginEndMm}mm`,
    },
  };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderCdmToPrintableHtml(cdm: CdmDocument): string {
  const paginated = paginateCdmDocument(cdm);
  const isRtl = cdm.defaultDirection !== 'ltr';
  const dirAttr = isRtl ? 'rtl' : 'ltr';

  const pagesHtml = paginated.pages
    .map((page) => {
      const fragsHtml = page.fragments
        .map((frag) => {
          if (frag.kind === 'heading') {
            const tag = `h${frag.level}`;
            return `<${tag} dir="${frag.direction}" class="doc-heading doc-h${frag.level}">${escapeHtml(frag.text)}</${tag}>`;
          }
          if (frag.kind === 'paragraph') {
            return `<p dir="${frag.direction}" class="doc-paragraph">${escapeHtml(frag.text)}</p>`;
          }
          if (frag.kind === 'table') {
            const headerHtml = frag.repeatedHeaderRow
              ? `<thead><tr class="repeated-header">${frag.repeatedHeaderRow.cells
                  .map(
                    (c) =>
                      `<th dir="${c.direction}">${escapeHtml(c.text)}</th>`
                  )
                  .join('')}</tr></thead>`
              : '';
            const rowsHtml = frag.rows
              .map(
                (r) =>
                  `<tr>${r.cells
                    .map((c) => {
                      const tag = c.isHeader ? 'th' : 'td';
                      return `<${tag} dir="${c.direction}">${escapeHtml(c.text)}</${tag}>`;
                    })
                    .join('')}</tr>`
              )
              .join('');
            return `<div class="doc-table-wrap">${
              frag.caption ? `<div class="doc-caption" dir="${frag.direction}">${escapeHtml(frag.caption)}</div>` : ''
            }<table dir="${frag.bidiVisual ? 'rtl' : 'ltr'}" class="doc-table">${headerHtml}<tbody>${rowsHtml}</tbody></table></div>`;
          }
          if (frag.kind === 'callout') {
            return `<aside dir="${frag.direction}" class="doc-callout"><strong>${escapeHtml(frag.title)}:</strong> ${escapeHtml(frag.text)}</aside>`;
          }
          if (frag.kind === 'signature') {
            return `<div dir="${frag.direction}" class="doc-signature"><div><strong>${escapeHtml(frag.firstPartyLabel)}:</strong> ${escapeHtml(frag.firstPartyName)}</div><div><strong>${escapeHtml(frag.secondPartyLabel)}:</strong> ${escapeHtml(frag.secondPartyName)}</div><div>${escapeHtml(frag.dateLabel)}</div></div>`;
          }
          return '';
        })
        .join('\n');

      return `<section class="print-page" data-page="${page.pageNumber}" dir="${dirAttr}">
        <div class="print-page-body">${fragsHtml}</div>
        <footer class="print-page-footer">${isRtl ? `صفحة ${page.pageNumber} من ${paginated.pages.length}` : `Page ${page.pageNumber} of ${paginated.pages.length}`}</footer>
      </section>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="${cdm.locale}" dir="${dirAttr}">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(cdm.title)}</title>
  <style>
    @page { size: A4; margin: 20mm 22mm; }
    body { font-family: 'IBM Plex Sans Arabic', 'Noto Naskh Arabic', 'Inter', sans-serif; color: #0F172A; margin: 0; }
    .print-page { page-break-after: always; box-sizing: border-box; padding: 12mm 0; }
    .doc-table { width: 100%; border-collapse: collapse; margin: 12px 0; font-variant-numeric: tabular-nums; }
    .doc-table th, .doc-table td { border: 1px solid #CBD5E1; padding: 8px 12px; }
    .doc-table th { background: #F1F5F9; font-weight: 600; }
    .doc-callout { border-inline-start: 4px solid #4F46E5; background: #F8FAFC; padding: 10px 14px; margin: 12px 0; }
    .doc-signature { display: flex; justify-content: space-between; margin-top: 24px; padding-top: 12px; border-top: 1px solid #CBD5E1; }
  </style>
</head>
<body>
${pagesHtml}
</body>
</html>`;
}
