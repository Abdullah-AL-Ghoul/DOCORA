# DOCORA — DOCX, PDF & Rendering Engine Architecture (Phase 00.2 Remediation)

**Document Reference:** `DOCORA-11-RENDER-v1.2.1`  
**Status:** CONSOLIDATED ARCHITECTURE BASELINE (POST-REVIEW REMEDIATED)  
**Audit Predecessors:** Phase 00 (`05-DOCUMENT-ENGINE.md`), Phase 00.1 (`04-UPDATED-DOCUMENT-ENGINE.md`), Phase 00.2 Baseline  

---

## 1. Architectural Reality & Fidelity Boundaries

In Phase 00, early documentation loosely claimed "100% identical visual parity" across Microsoft Word, LibreOffice, Chromium, and DOCORA. Phase 00.1 corrected this claim, and Phase 00.2 formalizes the exact physical and typographic boundaries governing cross-engine document rendering.

> **Engineering Truth:**  
> *Microsoft Word, LibreOffice, and Chromium utilize distinct layout engines, font rasterizers, and text-shaping pipelines. Identical pixel-for-pixel rendering across all three platforms is mathematically and typographically impossible. DOCORA guarantees strict **structural fidelity** ($\ge 95\%$ layout alignment) and **100% textual and bidirectional integrity**, without making unachievable parity claims.*

```
+----------------------------------------------------------------------------------------------------+
|                                    RENDER ENGINE BOUNDARIES                                        |
+----------------------------------------------------------------------------------------------------+
|  1. In-Browser Virtual Canvas (Chromium Layout Engine)                                             |
|     - Uses CSS Paged Media + DOM block height calculation.                                         |
|     - Native HarfBuzz shaping via browser font subsystem.                                          |
|                                                                                                    |
|  2. Headless PDF Renderer (Puppeteer / Chromium Headless)                                          |
|     - EXACT visual match with the browser editor (shares identical Blink rendering engine).        |
|     - Authoritative engine for print-ready PDF export.                                             |
|                                                                                                    |
|  3. Word OpenXML Generator (`docx` npm v9.x)                                                       |
|     - Compiles CDM AST directly into standard ECMA-376 OOXML packages.                             |
|     - Emits `<w:rtl/>` flags on every Arabic run, paragraph, and table property.                   |
|     - Word calculates its own pagination upon opening based on local printer drivers.              |
|                                                                                                    |
|  4. Headless Office Converter (LibreOffice 24.x Linux Container)                                   |
|     - Used as a secondary converter for batch legacy imports.                                      |
|     - Relies on HarfBuzz + Linux FreeType font caches; achieves ~95% visual match with Word.       |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. Measurable Document Fidelity Evaluation Framework

### 2.1 Mathematical & Operational Metric Definitions

To transition "fidelity" from a marketing slogan into an enforceable engineering standard, DOCORA defines a three-tiered metric:

$$\text{Fidelity Index} = 0.50 \cdot \text{SSIM} + 0.30 \cdot \Delta_{\text{layout}} + 0.20 \cdot \text{Integrity}_{\text{text}}$$

1. **Structural Similarity Index (Target $\text{SSIM} \ge 0.95$):**  
   - Evaluated between the Chromium-rendered PDF page raster and the LibreOffice-rendered PDF page raster at **300 DPI** ($2480 \times 3508$ pixels for A4).
   - Images are normalized to 8-bit grayscale.
   - A $1\text{px}$ Gaussian blur is applied to filter out subpixel font anti-aliasing variations caused by FreeType vs. Skia rasterizers.
   - SSIM is computed per page using the standard Wang et al. (2004) formulation and averaged across all pages.
2. **Layout Bounding Box Delta (Target $\Delta_{\text{layout}} \le 2.0\text{mm}$):**  
   - Coordinates ($x, y, w, h$) of structural elements (headings, table borders, image frames) are extracted from the PDF operator stream.
   - The Euclidean displacement delta between the canvas coordinates and the compiled PDF/DOCX coordinates must not exceed $2.0\text{mm}$.
3. **Textual & BiDi Integrity (Mandatory $\text{Integrity}_{\text{text}} = 100\%$):**  
   - Extracted text runs are compared using Unicode Form C (NFC) normalized string diffs.
   - Zero missing characters, zero corrupted ligatures, zero isolated Arabic letter forms, and zero inverted parentheses or punctuation marks are permitted.

---

## 3. Representative Benchmark Test Suite & Status

| Test Case ID | Document Category | Primary Stress Vector | Acceptance Threshold | Test Suite Status |
| :--- | :--- | :--- | :--- | :---: |
| `TC-FID-01` | Pure Arabic Academic Paper | Arabic typography & Fusha ligatures | Zero broken Arabic ligatures; correct Amiri font. | **SPECIFIED (Not Yet Created)** |
| `TC-FID-02` | Mixed Arabic/English Contract | BiDi punctuation & bracket inversion | Parentheses `( )` and numbers `[1]` render in order. | **SPECIFIED (Not Yet Created)** |
| `TC-FID-03` | Complex Financial Balance Sheet | Merged cells & column widths | Zero text clipping; column widths match $\pm 1.0\text{mm}$. | **SPECIFIED (Not Yet Created)** |
| `TC-FID-04` | 30-Page Technical Manual | Dynamic pagination & section breaks | Heading never orphaned at bottom; headers match. | **SPECIFIED (Not Yet Created)** |
| `TC-FID-05` | Legal Employment Agreement | Dual-column side-by-side layout | Left column (Eng) / Right column (Ar) row-aligned. | **SPECIFIED (Not Yet Created)** |
| `TC-FID-06` | Corporate Strategy Pitch | Full-bleed cover page & custom accents| Margins match zero-bleed rule; color hex exact. | **SPECIFIED (Not Yet Created)** |

> **Dataset & Verification Status:**  
> The 100-document Golden Test Suite is **SPECIFIED IN ARCHITECTURE, NOT YET CREATED ON DISK**. The test fixtures and automated Playwright visual regression suite will be implemented during Phase 01. All document fidelity benchmark scores are categorized as **NOT TESTED**.

---

## 4. Arabic Typography & Text Shaping Architecture

Arabic is a cursive script requiring contextual glyph substitution, ligatures, and bidirectional ordering. DOCORA implements a strict typographic pipeline:

```
+----------------------------------------------------------------------------------------------------+
|                                ARABIC TYPOGRAPHY PIPELINE                                          |
+----------------------------------------------------------------------------------------------------+
| 1. Unicode Normalization: Form C (NFC) applied to prevent decomposed diacritics.                   |
| 2. BiDi Isolation Wrap: Inline English terms wrapped in <span dir="ltr"> and Unicode isolates.     |
| 3. Font Standard: Bundled Noto Sans Arabic, Cairo, and Amiri OpenType fonts with full GSUB tables.  |
| 4. Server-Side Shaping: Linux workers leverage HarfBuzz for correct contextual glyph selection.    |
| 5. OOXML Explicit Tagging: Every text run containing Arabic emits <w:rPr><w:rtl/></w:rPr>.         |
+----------------------------------------------------------------------------------------------------+
```

---

## 5. Distinction: Target vs. Benchmark vs. Production Guarantee

To ensure total integrity in technical communication:
- **Architectural Target:** Achieving $\ge 95\%$ visual layout alignment across platforms.
- **Dataset Readiness:** The 100-document Golden Suite is specified but not yet populated with test files (**Status: SPECIFIED / PENDING PHASE 01**).
- **Measured Benchmark Result:** Empirical scores will be established once test suites run against compiled code (**Status: NOT TESTED**).
- **Production Guarantee:** 100% textual preservation, valid ECMA-376 OOXML compliance, and zero corrupted files.

---
*Verified against Phase 00.2 acceptance review findings. Approved as updated rendering engine architecture.*
