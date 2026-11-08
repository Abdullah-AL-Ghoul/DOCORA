# DOCORA — Canonical Document Model (CDM v1.2) & Editor Architecture (Phase 00.2 Remediation v1.2.2)

**Document Reference:** `DOCORA-04-CDM-v1.2.2`  
**Status:** CONSOLIDATED ARCHITECTURE BASELINE (POST-REVIEW REMEDIATED)  
**Audit Predecessors:** Phase 00 (`05-DOCUMENT-ENGINE.md`), Phase 00.1 (`04-UPDATED-DOCUMENT-ENGINE.md`), Phase 00.2 Baseline  

---

## 1. Architectural Role of the Canonical Document Model

In DOCORA, the **Canonical Document Model (CDM)** is the sole authoritative representation of document content, hierarchy, typography, and styling. The rich-text editor (Tiptap 3.x / ProseMirror), the DOCX export compiler (`docx` 9.1.x), the PDF renderer (Puppeteer), and AI generation agents **do not communicate through proprietary intermediate formats or arbitrary HTML**. They all serialize to and deserialize from CDM v1.2.

```
                    +------------------------------------+
                    |    AI Model Generation & Edits     |
                    +-----------------+------------------+
                                      |
                                      v
+-----------------------+     +----------------+     +-----------------------+
|  ProseMirror / Tiptap | <-> |    CDM v1.2    | <-> |  OOXML / DOCX Engine  |
|    3.x Editor State   |     | JSON Document  |     |   (`docx` npm 9.1.x)  |
+-----------------------+     +-------+--------+     +-----------------------+
                                      |
                                      v
                    +-----------------+------------------+
                    |    Puppeteer / PDF Rendering AST   |
                    +------------------------------------+
```

---

## 2. CDM v1.2 Schema Specification

### 2.1 Top-Level Document Structure
```json
{
  "$schema": "https://docora.ai/schemas/cdm-v1.2.json",
  "version": "1.2.0",
  "documentId": "c39b7d82-841a-4d44-934c-628d05e55e01",
  "metadata": {
    "title": "Bilingual AI Research & Architecture Report",
    "authors": ["Dr. Tariq Al-Hashimi", "Layla Al-Mansour"],
    "createdTimestamp": 1772884800000,
    "lastModifiedTimestamp": 1772886600000,
    "defaultLanguage": "ar",
    "defaultDirection": "rtl",
    "wordCount": 1420,
    "styleDnaProfileId": "dna-91a02b1c-74f0-466a-b22f-d890e0c8b991"
  },
  "pageSettings": {
    "pageSize": "A4",
    "orientation": "portrait",
    "dimensionsMm": {
      "width": 210,
      "height": 297
    },
    "marginsMm": {
      "top": 25.4,
      "bottom": 25.4,
      "left": 25.4,
      "right": 25.4
    },
    "header": {
      "enabled": true,
      "differentFirstPage": true,
      "content": [
        {
          "id": "hdr-blk-01",
          "type": "paragraph",
          "align": "right",
          "content": [{ "type": "text", "text": "DOCORA AI Document Studio — Technical Architecture" }]
        }
      ]
    },
    "footer": {
      "enabled": true,
      "pageNumbering": {
        "format": "arabic_numerals",
        "alignment": "center",
        "startAt": 1
      }
    }
  },
  "body": [
    {
      "id": "blk-92f1-0001",
      "type": "heading",
      "level": 1,
      "direction": "rtl",
      "content": [
        { "type": "text", "text": "1. مقدمة في معمارية الوثائق الذكية", "marks": [{ "type": "bold" }] }
      ]
    },
    {
      "id": "blk-92f1-0002",
      "type": "paragraph",
      "direction": "rtl",
      "content": [
        { "type": "text", "text": "تم تصميم منصة " },
        { 
          "type": "text", 
          "text": "DOCORA", 
          "marks": [
            { "type": "bold" },
            { "type": "bidi_isolate", "attrs": { "dir": "ltr" } }
          ] 
        },
        { "type": "text", "text": " كبيئة متكاملة لمعالجة وإنشاء الوثائق الاحترافية بدقة طباعية عالية." }
      ]
    }
  ]
}
```

### 2.2 Core Node Types & Constraints
Every block node in CDM v1.2 **must contain a unique, stable UUID (`id`)**. Stable node IDs enable fine-grained multi-agent review suggestions, comments, delta versioning, and collaborative resolution.

| Node Type | Level | Required Attributes | Permitted Content |
| :--- | :--- | :--- | :--- |
| `heading` | Block | `id`, `level` (1-6), `direction` (`rtl`/`ltr`) | Inline text, marks |
| `paragraph` | Block | `id`, `direction`, `align` (`left`/`center`/`right`/`justify`) | Inline text, marks, citations |
| `blockquote` | Block | `id`, `direction`, `author` (optional) | Paragraphs, inline text |
| `callout` | Block | `id`, `variant` (`info`/`warning`/`success`/`tip`), `direction` | Paragraphs, lists |
| `table` | Block | `id`, `columnsCount`, `rowsCount`, `hasHeaderRow` | `table_row` nodes |
| `table_row` | Block | `id` | `table_cell` nodes |
| `table_cell`| Block | `id`, `colSpan` (def 1), `rowSpan` (def 1), `shadingColor` | Paragraphs, inline text |
| `image` | Block | `id`, `storageAssetId`, `width`, `height`, `caption`, `align`| None (Void node) |
| `code_block`| Block | `id`, `language`, `code` | Raw string content |
| `bullet_list`| Block | `id`, `direction` | `list_item` nodes |
| `ordered_list`| Block | `id`, `direction`, `start` | `list_item` nodes |
| `list_item` | Block | `id` | Paragraphs, nested lists |
| `page_break`| Block | `id`, `forced` (true) | None (Void node) |
| `raw_unsupported`| Block | `id`, `sourceFormat` (`docx_ooxml`), `rawXml` | Preserved raw XML |

---

## 3. Typographic & Pagination Responsibility Matrix

To eliminate ambiguity, the responsibility for Arabic rendering, BiDi behavior, and pagination is explicitly mapped to specific architectural components:

| Typographic / Layout Behavior | Responsible Layer / Component | Implementation Mechanism |
| :--- | :--- | :--- |
| **Arabic Text Shaping (Cursive Glyphs)** | Browser Layout Engine (Blink / HarfBuzz) | OpenType `GSUB` tables in bundled Noto Sans Arabic & Amiri fonts. |
| **BiDi Ordering (RTL / LTR Reordering)**| Unicode Bidirectional Algorithm (UAX #9) | Browser layout engine guided by CDM `bidi_isolate` marks (`dir="auto"` / `dir="ltr"`). |
| **Inline Soft Line Breaks** | Browser Text Layout Engine | Chromium layout engine respecting Arabic word breaking and zero-width spaces. |
| **Physical Page Height Splitting** | In-House Virtual Canvas (`ResizeObserver`) | JavaScript DOM observer calculating cumulative block heights; projects virtual page breaks. |
| **Font Fallback Hierarchy** | CSS `@font-face` / Next.js Font Optimization | Cascading font stack: `Noto Sans Arabic`, `Cairo`, `Amiri`, `system-ui`. |
| **Caret & Cursor Navigation** | ProseMirror State View + Browser Selection API | Visual cursor movement across BiDi boundaries; maps visual clicks to logical AST positions. |
| **Selection & Range Highlighting** | ProseMirror View (`@tiptap/pm/view`) | Renders contiguous and non-contiguous BiDi visual selections cleanly. |
| **Clipboard & Copy-Paste** | ProseMirror Clipboard Serializer | Serializes and deserializes HTML / plain text into validated CDM nodes with direction intact. |

---

## 4. Tiptap 3 SSR, React Hydration & Client Initialization

To ensure technical accuracy, DOCORA distinguishes five distinct layers of document execution:
1. **Server-Side Manipulation Without DOM:** Tiptap 3 supports creating headless editor instances in Node.js for batch transformations, markdown conversion, and schema validation.
2. **Static Document Rendering:** Pre-rendering HTML snapshots via `@tiptap/static-renderer` for SEO or print previews.
3. **React `EditorContent` Rendering:** Mounting the interactive ProseMirror editor view in the React DOM.
4. **Client-Side Interactive Editor Initialization:** Instantiating the editor state, extensions, and event listeners in the browser.
5. **Next.js Hydration Behavior:** The reconciliation between server-rendered HTML and client-rendered DOM.

> **Crucial Hydration Configuration:**  
> Tiptap 3's server-friendly architecture does NOT magically eliminate React hydration mismatches on interactive editors. In adherence to official Tiptap React documentation (`https://tiptap.dev/docs/editor/getting-started/install/react`), client-side editors in Next.js must explicitly configure `immediatelyRender: false`:
> ```typescript
> const editor = useEditor({
>   immediatelyRender: false, // Prevents SSR React hydration mismatch in Next.js
>   extensions: [
>     StarterKit,
>     TableKit,
>     TextStyleKit,
>     // ...
>   ],
>   content: initialCDMContent,
> });
> ```
> Claims that hydration issues are "eliminated" without runtime verification are retracted; proper client-side configuration and automated Playwright verification are required (**Status: NOT TESTED**).

---

## 5. Engineering Trade-off: Custom Virtual Canvas vs. Tiptap Pro Pages

| Dimension | In-House Virtual Paged Canvas | Tiptap Commercial Pages Extension |
| :--- | :--- | :--- |
| **Licensing & Recurring Cost** | **\$0 (Open-Source Core, Zero Subscription)** | \$49 - \$999+ / month recurring license fee |
| **Build Pipeline Integrity** | Zero private registry dependencies; 100% public npm | Requires private npm token secrets in CI/CD pipelines |
| **BiDi Arabic Layout Compatibility**| Custom DOM overlay preserves underlying ProseMirror tree | Known proprietary bug: slices paragraph nodes across pages, corrupting RTL BiDi spans |
| **Upfront Engineering Effort** | **Higher (2-3 sprints initial development)** | Low (plug-and-play initial setup) |
| **Long-Term Maintenance Overhead**| Medium (maintaining DOM height observer & widow/orphan CSS)| High (vulnerable to upstream breaking changes from private vendor) |
| **Architectural Status** | **PROPOSED (Subject to Phase 01 Runtime Testing)** | REJECTED (Vendor lock-in & BiDi defects) |

---

## 6. Lossless Containment of Unsupported DOCX Features

When a user imports an existing Word document containing advanced proprietary features (e.g., complex SmartArt, WordArt, macro-enabled fields, or embedded VML shapes), DOCORA executes a **lossless containment strategy**:
1. **Extraction:** The parser extracts the raw OOXML XML chunk.
2. **Encapsulation:** The chunk is wrapped in a `raw_unsupported` CDM block carrying the original namespace and XML payload.
3. **Canvas Presentation:** The editor displays a clean, user-friendly placeholder:  
   *`[Complex Office Graphic / Unsupported Element — Preserved for Export]`*
4. **Export Round-Trip:** When DOCORA recompiles the document back to DOCX, it re-injects the untouched OOXML chunk into the package structure, ensuring that unsupported elements are **never silently deleted or corrupted**.

---
*Verified against official Tiptap React documentation. Approved as updated CDM and editor architecture.*
