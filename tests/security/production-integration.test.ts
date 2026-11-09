import { describe, expect, it } from 'vitest';
import { compileCdmToPdfBuffer } from '@/lib/export/pdf-compiler';
import { compileCdmToDocxBuffer } from '@/lib/export/docx-compiler';
import { extractTextFromPdfBinaryBuffer } from '@/lib/ingest/file-pipeline';
import { executeGeminiGeneration } from '@/lib/ai/gemini-client';
import { getDocumentById, listDocumentsForUser, saveDocument } from '@/lib/db/documents';
import { PRESET_DOCUMENTS } from '@/lib/cdm/presets';
import { CdmDocument } from '@/lib/cdm/schema';

describe('DOCORA Production Integration & Security Remediation Suite', () => {
  const testDoc: CdmDocument = structuredClone(PRESET_DOCUMENTS['exec-contract-ar']);

  it('compiles valid ISO 32000-1 vector PDF binary starting with %PDF-1.4', async () => {
    const pdfBuffer = await compileCdmToPdfBuffer(testDoc);
    expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
    expect(pdfBuffer.length).toBeGreaterThan(500);
    expect(pdfBuffer.subarray(0, 8).toString('ascii')).toBe('%PDF-1.4');
    expect(pdfBuffer.toString('binary')).toContain('%%EOF');
  });

  it('compiles valid Microsoft Word OOXML DOCX binary starting with PK zip header', async () => {
    const docxBuffer = await compileCdmToDocxBuffer(testDoc);
    expect(Buffer.isBuffer(docxBuffer)).toBe(true);
    expect(docxBuffer.length).toBeGreaterThan(1000);
    // ZIP local file header magic bytes: PK\x03\x04
    expect(docxBuffer[0]).toBe(0x50);
    expect(docxBuffer[1]).toBe(0x4b);
    expect(docxBuffer[2]).toBe(0x03);
    expect(docxBuffer[3]).toBe(0x04);
  });

  it('extracts text from real binary PDF bytes with page count detection', async () => {
    const pdfBuffer = await compileCdmToPdfBuffer(testDoc);
    const result = extractTextFromPdfBinaryBuffer(pdfBuffer);
    expect(result.pageCount).toBeGreaterThanOrEqual(1);
    expect(result.pageTexts.length).toBe(result.pageCount);
    expect(result.isScanned).toBe(false);
  });

  it('persists documents in database storage and enforces tenant ownership', async () => {
    const customDoc: CdmDocument = {
      ...testDoc,
      id: `doc-test-persist-${Date.now()}`,
      title: 'وثيقة اختبار العزل والحفظ الدائم',
    };

    // Save under Tenant Alpha
    const saved = await saveDocument('usr-tenant-alpha', customDoc);
    expect(saved.id).toBe(customDoc.id);

    // Retrieve under Tenant Alpha
    const retrievedAlpha = await getDocumentById('usr-tenant-alpha', customDoc.id);
    expect(retrievedAlpha).not.toBeNull();
    expect(retrievedAlpha?.title).toBe('وثيقة اختبار العزل والحفظ الدائم');

    // Attempt unauthorized cross-tenant read from Tenant Beta
    await expect(getDocumentById('usr-tenant-beta', customDoc.id)).rejects.toThrow(
      /Forbidden: Document belongs to another tenant/
    );

    // Attempt unauthorized cross-tenant overwrite from Tenant Beta
    await expect(saveDocument('usr-tenant-beta', customDoc)).rejects.toThrow(
      /Forbidden: Cannot overwrite document owned by another tenant/
    );
  });

  it('executes structured AI generation with typed CDM block schemas and token accounting', async () => {
    const result = await executeGeminiGeneration({
      modelId: 'gemini-3.8-flash',
      prompt: 'صياغة بند الأمن السيبراني',
      action: 'generate',
      currentDocument: testDoc,
    });

    expect(result.ok).toBe(true);
    expect(result.appendedBlocks.length).toBeGreaterThanOrEqual(2);
    expect(result.appendedBlocks[0].type).toBe('heading');
    expect(result.appendedBlocks[1].type).toBe('paragraph');
    expect(result.usage.totalTokens).toBeGreaterThan(0);
    expect(result.usage.promptTokens).toBeGreaterThan(0);
    expect(result.usage.completionTokens).toBeGreaterThan(0);
  });
});
