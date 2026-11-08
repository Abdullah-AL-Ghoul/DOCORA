import { describe, expect, it } from 'vitest';
import JSZip from 'jszip';
import { compileCdmToDocxBuffer } from '@/lib/export/docx-compiler';
import { buildVectorPdfOptions, renderCdmToPrintableHtml } from '@/lib/export/pdf-renderer';
import { PRESET_DOCUMENTS } from '@/lib/cdm/presets';
import {
  buildStatelessInteractionConfig,
  calculateTokenCostUsd,
  continueInterruptedGeneration,
} from '@/lib/ai';
import { PgmqExportWorkerCoordinator } from '../../workers/src';
import {
  classifyAndExtractDigitalPdfText,
  inspectZipContainerSafety,
} from '@/lib/ingest/file-pipeline';

describe('DOCORA Phase 01 Unit Suite: OOXML RTL, Worker Fencing, AI Pricing & Contrast Math', () => {
  it('generates valid docx@9.15.2 OOXML with <w:bidiVisual/>, <w:bidi/>, <w:rtl/>, and explicit Arabic RunFonts', async () => {
    const contractDoc = PRESET_DOCUMENTS['exec-contract-ar'];
    const buffer = await compileCdmToDocxBuffer(contractDoc);
    expect(buffer.byteLength).toBeGreaterThan(2000);

    const zip = await JSZip.loadAsync(buffer);
    const documentXml = await zip.file('word/document.xml')?.async('string');
    expect(documentXml).toBeDefined();

    // Verify table visual right-to-left ordering (<w:bidiVisual/>)
    expect(documentXml).toContain('w:bidiVisual');
    // Verify paragraph bidi (<w:bidi/>) and run right-to-left (<w:rtl/>)
    expect(documentXml).toContain('w:bidi');
    expect(documentXml).toContain('w:rtl');
    // Verify explicit Arabic font family bindings in RunFonts
    expect(documentXml).toContain('IBM Plex Sans Arabic');
    expect(documentXml).toContain('Noto Naskh Arabic');
  });

  it('builds Puppeteer vector PDF options without any fake dpi parameter', () => {
    const contractDoc = PRESET_DOCUMENTS['exec-contract-ar'];
    const pdfOptions = buildVectorPdfOptions(contractDoc);
    expect(pdfOptions.format).toBe('A4');
    expect(pdfOptions.printBackground).toBe(true);
    expect('dpi' in pdfOptions).toBe(false);

    const html = renderCdmToPrintableHtml(contractDoc);
    expect(html).toContain('dir="rtl"');
    expect(html).toContain('@page { size: A4;');
  });

  it('enforces official Gemini pricing before and after Dec 1, 2026 and validates store:false conflicts', () => {
    // gemini-3.5-flash-lite: $0.30 / $2.50 per 1M
    expect(calculateTokenCostUsd('gemini-3.5-flash-lite', 1_000_000, 1_000_000)).toBe(2.8);
    // gemini-3.8-flash: $0.75 / $3.75 per 1M
    expect(calculateTokenCostUsd('gemini-3.8-flash', 1_000_000, 1_000_000)).toBe(4.5);
    // gemini-4-argon before Nov 30, 2026: $2.00 / $10.00 per 1M
    expect(
      calculateTokenCostUsd(
        'gemini-4-argon',
        1_000_000,
        1_000_000,
        new Date('2026-11-15T00:00:00Z')
      )
    ).toBe(12.0);
    // gemini-4-argon from Dec 1, 2026: $4.00 / $20.00 per 1M
    expect(
      calculateTokenCostUsd(
        'gemini-4-argon',
        1_000_000,
        1_000_000,
        new Date('2026-12-02T00:00:00Z')
      )
    ).toBe(24.0);

    // store: false conflict checks
    expect(() =>
      buildStatelessInteractionConfig({
        model: 'gemini-3.8-flash',
        planTier: 'free',
        background: true,
      })
    ).toThrow(/cannot be combined with background: true/);

    expect(() =>
      buildStatelessInteractionConfig({
        model: 'gemini-3.8-flash',
        planTier: 'free',
        previousInteractionId: 'prev-123',
      })
    ).toThrow(/cannot be combined with previous_interaction_id/);
  });

  it('recovers interrupted CDM generation via Continue Generation without losing existing blocks', () => {
    const interrupted = PRESET_DOCUMENTS['interrupted-draft-ar'];
    expect(interrupted.generationState.status).toBe('INTERRUPTED');
    expect(interrupted.blocks.length).toBe(2);

    const { updatedDocument, appendedBlocks } = continueInterruptedGeneration(interrupted);
    expect(updatedDocument.generationState.status).toBe('COMPLETE');
    expect(appendedBlocks.length).toBe(3);
    expect(updatedDocument.blocks.length).toBe(5);
    expect(updatedDocument.blocks[0].id).toBe('int-h1');
  });

  it('enforces worker fencing tokens and DLQ transitions in PgmqExportWorkerCoordinator', () => {
    const coordinator = new PgmqExportWorkerCoordinator();
    const job = coordinator.enqueueExportJob({
      userId: 'usr-1',
      documentId: 'exec-contract-ar',
      format: 'docx',
      idempotencyKey: 'idem-worker-fencing-test',
      maxAttempts: 2,
    });

    // Worker 1 claims at t=1000 with 5000ms visibility timeout -> fencingToken = 1
    const lease1 = coordinator.claimNextJob('worker-1', 5000, 1000)!;
    expect(lease1.fencingToken).toBe(1);

    // Lease expires at t=7000; Worker 2 claims the job -> fencingToken = 2
    const lease2 = coordinator.claimNextJob('worker-2', 5000, 7000)!;
    expect(lease2.fencingToken).toBe(2);

    // Zombie Worker 1 tries to commit with stale fencingToken=1 -> MUST be rejected!
    expect(() =>
      coordinator.completeJob({
        jobId: job.id,
        fencingToken: 1,
        artifactStoragePath: 'exports/stale.docx',
      })
    ).toThrow(/Stale fencing token rejected/);

    // Worker 2 fails on attempt 2 (maxAttempts=2) -> moves to DLQ
    const dlqState = coordinator.recordJobFailure({
      jobId: job.id,
      fencingToken: 2,
      errorMessage: 'Chromium timeout',
    });
    expect(dlqState.status).toBe('DLQ');
  });

  it('verifies ZIP Bomb Guard and Digital vs Scanned PDF classification', async () => {
    const zip = new JSZip();
    zip.file('hello.txt', 'DOCORA Safe Container');
    const safeBuf = await zip.generateAsync({ type: 'nodebuffer' });
    const safety = await inspectZipContainerSafety(safeBuf);
    expect(safety.safe).toBe(true);

    const digitalRes = classifyAndExtractDigitalPdfText({
      pageTexts: ['عقد عمل تنفيذي مكتوب كنص رقمي قابل للاستخراج المباشر.'],
    });
    expect(digitalRes.classification).toBe('DIGITAL_TEXT_PDF');
    expect(digitalRes.extractedParagraphs[0].direction).toBe('rtl');

    const scannedRes = classifyAndExtractDigitalPdfText({
      pageTexts: ['   '],
    });
    expect(scannedRes.classification).toBe('SCANNED_PDF_DEFERRED_TO_PHASE_03');
  });

  it('verifies WCAG 2.2 AA contrast ratio math (>= 4.5:1) for all semantic text pairs', () => {
    function relativeLuminance(hex: string): number {
      const clean = hex.replace('#', '');
      const r = parseInt(clean.slice(0, 2), 16) / 255;
      const g = parseInt(clean.slice(2, 4), 16) / 255;
      const b = parseInt(clean.slice(4, 6), 16) / 255;
      const toLinear = (c: number) =>
        c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
    }

    function contrastRatio(fg: string, bg: string): number {
      const l1 = relativeLuminance(fg);
      const l2 = relativeLuminance(bg);
      const lighter = Math.max(l1, l2);
      const darker = Math.min(l1, l2);
      return (lighter + 0.05) / (darker + 0.05);
    }

    // Verified pairs from Plan v2.0 Section 1.3:
    expect(contrastRatio('#0F172A', '#F8FAFC')).toBeGreaterThanOrEqual(4.5); // 16.8:1
    expect(contrastRatio('#475569', '#F8FAFC')).toBeGreaterThanOrEqual(4.5); // 7.21:1
    expect(contrastRatio('#4F46E5', '#FFFFFF')).toBeGreaterThanOrEqual(4.5); // 6.29:1
    expect(contrastRatio('#818CF8', '#090A0F')).toBeGreaterThanOrEqual(4.5); // 6.72:1
    expect(contrastRatio('#047857', '#ECFDF5')).toBeGreaterThanOrEqual(4.5); // 5.12:1
    expect(contrastRatio('#34D399', '#090A0F')).toBeGreaterThanOrEqual(4.5); // 10.4:1
  });
});
