# DOCORA — Competitive Intelligence & Market Differentiation
## 02. Competitive Landscape & Technical Benchmarking

**System:** DOCORA — AI Document Studio  
**Market Domain:** AI Document Authoring, Enterprise Contract Management, Institutional Publishing  
**Target User Persona:** Legal Counsel, Strategy Consultants, Government Policy Authors, Corporate Executives

---

### 1. Competitive Matrix Analysis

| Feature Dimension | Microsoft 365 Copilot | Notion AI | Jasper / Copy.ai | Lex / Type.ai | DOCORA Studio |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Document Architecture** | Proprietary OpenXML stream | Block-based JSON | Markdown / Text blobs | ProseMirror markdown | **Canonical Document Model (CDM v1.2)** |
| **Arabic Language Support** | Native Office LTR/RTL | Basic text alignment | Weak / Translation only | Rudimentary RTL | **Native UAX#9 + bidiVisual Tables** |
| **Quality Review** | Passive single-turn prompt | Ad-hoc text assistant | Marketing copy scores | Basic grammar/tone | **Bounded 9-Role Multi-Agent Engine** |
| **Quality Enforcement** | Suggestive only | None | None | None | **Deterministic Hard Gates (Blocks Export)**|
| **Citation Verification** | Web Bing groundings | None | None | None | **Cryptographic Provenance Citations** |
| **Autosave & Selection** | Word Online (sync issues) | Debounced block save | Stateless editor | Local storage sync | **Dual-Surface Continuous + A4 Preview** |
| **Token Deduction Safety** | Monthly license fee | Monthly add-on fee | Pre-paid bucket (lossy) | Monthly credits | **Atomic Two-Phase Token Ledger (Refunds)** |
| **Data Retention Stance** | Enterprise tenant terms | Workspace retention | Vendor model training | Cloud storage retention| **Zero Data Retention (`store: false`)** |

---

### 2. The Five Key Competitive Differentiators of DOCORA

#### A. Structured Model (CDM v1.2) vs. Chat Bubbles
Existing solutions treat document creation as an extension of conversational chat. When a user pastes text from ChatGPT or Copilot into Word, tables lose alignment, column order flips in Arabic, and footnote references disconnect. DOCORA eliminates this by maintaining an AST (Abstract Syntax Tree) with strict node types:
- `FrontMatter` with document classification, governance level, and authors.
- `HeadingBlock` with bounded heading levels 1–6.
- `TableBlock` with `bidiVisual: true`, column width ratios, and isolated numeral formatting.
- `ProvenanceCitation` linking every fact back to authorized source materials.

#### B. Deterministic Hard Gates vs. Passive Suggestions
Grammarly and Copilot underline issues with blue squiggles that users easily ignore. In mission-critical legal or governmental publishing, an ignored hallucination can result in liability. DOCORA's **Hard Gates** physically disable the DOCX and PDF export actions whenever:
1. A dangling citation or unverified factual claim is detected.
2. A regulatory compliance rule fails.
3. A critical bidi text corruption is identified.

#### C. Dual-Surface Editing Architecture (ADR-001)
Competitors attempting "in-browser Word pagination" split live ProseMirror tables across DOM elements, causing caret jumps and selection corruption during typing. DOCORA resolves this via a dual-surface approach:
1. **Editing Surface**: An uninterrupted continuous canvas optimized for keyboard navigation, drag-and-drop, and real-time typing fluidity.
2. **Synchronized Rendering Surface**: A side-by-side or toggled A4 sheet simulation with exact millimeter margins (25.4mm), headers, and footers that matches the output of the native `docx@9.15.2` compiler.

#### D. First-Class Arabic Institutional Typography & Microcopy
Most platforms offer Arabic as a translated afterthought, resulting in:
- English punctuation at the beginning of Arabic sentences.
- Table columns reading left-to-right despite Arabic header text.
- Clunky translated labels like "موافق" (OK) on destructive delete buttons.
DOCORA was designed Arabic-first:
- Native UAX#9 Unicode bidirectional isolation preventing number and symbol corruption.
- IBM Plex Arabic typography with mathematical optical sizing.
- Action-specific button verbs: "نقل إلى سلة المحذوفات" (Move to Trash) instead of "حذف" (Delete).

#### E. Two-Phase Token Ledger vs. Blind Pre-Deduction
Consumer AI platforms deduct credits the moment the user clicks "Generate". If the connection drops at 90%, the user loses tokens and receives nothing. DOCORA's Two-Phase Token Ledger operates atomically:
1. `RESERVE`: Tokens are marked in flight.
2. `SETTLE`: Only after the document is written to PostgreSQL and confirmed to the client are tokens deducted. If any error occurs, the reserved balance is immediately released.
