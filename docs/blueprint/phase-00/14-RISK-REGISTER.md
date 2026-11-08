# 14 — Risk Register & Failure Mode Analysis
## Project Codename: AI Document Studio
**Phase:** 00 — Discovery & Architecture  
**Status:** Comprehensive Technical Risk Register  

---

## 1. Risk Evaluation Methodology

Every engineering risk is evaluated based on its **Probability** (P: Low, Med, High) and **Impact** (I: Low, Med, High), deriving an overall **Severity Score** (Critical, High, Medium, Low). 

Special emphasis is placed on **silent failure modes**: issues where the software appears to succeed without error but generates corrupted documents, inverted Arabic text, or hallucinated facts.

---

## 2. Comprehensive Risk Matrix

| Risk ID | Failure Mode | P | I | Severity | Responsible Subsystem | Primary Mitigation Strategy |
|---|---|---|---|---|---|---|
| **RSK-01** | DOCX/PDF Layout Inconsistency | High | High | **Critical** | Document Engine | Dual-track conversion: LibreOffice worker guarantees bit-for-bit DOCX-to-PDF match. |
| **RSK-02** | Arabic RTL Failures & Broken Ligatures | Med | High | **High** | Editor & AST Bridge | Enforce `<w:bidi/>` in OOXML; bundle Noto Sans Arabic & Amiri font subsets; continuous bidi tests. |
| **RSK-03** | Mixed-Direction Punctuation Inversion | High | Med | **High** | Editor & Typography | Unicode bidirectional isolation tags (`&lrm;` / `&rlm;`); CSS `unicode-bidi: isolate`. |
| **RSK-04** | OCR Inaccuracies on Scanned Invoices | Med | High | **High** | Intelligence Pipeline | 3-tier adaptive pipeline with Gemini Vision fallback; user confidence review for score < 0.70. |
| **RSK-05** | AI Hallucinations in Cited Data | High | High | **Critical** | AI Orchestrator | Factual claims must carry `source_id` + `page_number`; strict XML system prompt boundaries. |
| **RSK-06** | Foundation AI Model Deprecation | Med | Med | **Medium** | AI Adapter Layer | Abstract all AI calls behind `IAIGeneratorProvider`; support multi-model fallback. |
| **RSK-07** | High API Token Costs on 100-page Files | Med | High | **High** | Billing & AI Gateway | Staged generation (Outline -> Section); rolling summary compression; user monthly token caps. |
| **RSK-08** | Long Processing Time & Serverless Timeouts | High | High | **Critical** | Worker Queue | Tasks >15s offloaded to async Docker worker; WebSocket progress updates via Realtime. |
| **RSK-09** | Large Uploads / ZIP Decompression Bombs | Med | High | **High** | Ingest & Storage | Direct-to-S3 signed uploads; magic byte validation; 100:1 ZIP decompression ratio cap. |
| **RSK-10** | Worker Process Crash / OOM Failures | Med | High | **High** | Worker Daemon | Memory-capped Docker containers (1500MB); automatic process restart; job retry limit (3 max). |
| **RSK-11** | Duplicate Jobs & Worker Race Conditions | Med | Med | **Medium** | Queue Engine | PostgreSQL transactional job locks (`FOR UPDATE SKIP LOCKED`); idempotent job execution tokens. |
| **RSK-12** | Cross-Tenant Data Leakage / IDOR | Low | High | **Critical** | Database & Auth | Row-Level Security (RLS) on all tables (`auth.uid() = user_id`); zero raw database queries. |
| **RSK-13** | Storage Permission Failures / URL Expiry | Med | Med | **Medium** | Storage Service | Ephemeral signed URLs with 15–30m TTL; automatic client-side token refresh on active sessions. |
| **RSK-14** | Autosave Data Loss & Concurrent Conflicts | Med | High | **High** | Client State & DB | IndexedDB local keystroke buffer; debounced cloud save (2000ms); version increment locks. |
| **RSK-15** | Document AST Corruption via Malformed JSON | Low | High | **High** | Schema Validator | Runtime Zod schema validation guards on all incoming and outgoing CDM transformations. |
| **RSK-16** | Cross-Version Word Rendering Differences | Med | Med | **Medium** | DOCX Compiler | Restrict OOXML features to universal ISO/IEC 29500 standard supported by Word 2013 through 365. |

---

## 3. Detailed Failure Mode Analysis & Recovery Runbooks

### RSK-01: DOCX to PDF Layout Inconsistency
- **Symptom**: A user creates a document, reviews it in the web editor, exports both DOCX and PDF, but notices that the PDF has 6 pages while the DOCX has 7 pages with wrapped table cells.
- **Root Cause**: Web CSS Paged Media and Microsoft Word OOXML calculate font metrics and line wraps with slightly different layout engines.
- **Mitigation & Recovery**:
  1. For formal exports, route the DOCX through the containerized **LibreOffice Headless Worker**. LibreOffice uses standard Word layout algorithms, ensuring that the PDF generated is an exact replica of what Word renders.
  2. Embed metric-compatible fonts (Liberation Sans for Arial, Noto Sans Arabic for Tahoma) inside the worker container.
  3. Provide an interactive Print Preview modal allowing users to inspect the compiled output before downloading.

---

### RSK-02 & RSK-03: Arabic RTL Failures & Punctuation Inversion
- **Symptom**: An Arabic sentence containing an English term (e.g., *"تقرير حول تقنية AI الحديثة."*) displays the period on the right side of the sentence or inverts parentheses: `(AI)`.
- **Root Cause**: The Unicode Bidirectional Algorithm (UBA) struggles when neutral punctuation characters follow strong directional Latin script inside a right-to-left block.
- **Mitigation & Recovery**:
  1. In the Web Canvas: Enforce CSS `unicode-bidi: isolate;` on all inline text runs and wrap mixed Latin terms in `<span dir="ltr">`.
  2. In OOXML: Inject explicit `<w:bidi/>` tags on paragraph properties and `<w:rtl/>` flags on Arabic text runs.
  3. Automated Playwright visual diff tests assert that periods appear strictly on the left of Arabic sentences.

---

### RSK-05: AI Hallucinations in Cited Research Documents
- **Symptom**: User uploads a 50-page financial statement; AI copilot states that net revenue was $45.2M, but that number does not appear anywhere in the source file.
- **Root Cause**: Language models frequently guess numeric figures based on pre-training probabilities when context is ambiguous or retrieval fails.
- **Mitigation & Recovery**:
  1. **Strict Citation Constraint**: System prompt mandates that every factual claim must include a JSON object with `source_id`, `page_number`, and `verbatim_quote`.
  2. **Automated Verification Guard**: The server verifies that `verbatim_quote` actually exists in the extracted text stream of that page. If the quote is missing, the response is rejected before displaying to the user.
  3. Interactive UI badge links directly to the highlighted source page in the PDF viewer, empowering the user to visually confirm claims.

---

### RSK-10: Worker Container Out-of-Memory (OOM) Crash
- **Symptom**: User uploads an exceptionally complex 300-page scanned PDF or a corrupted Word document; the background worker container abruptly terminates (`Exit code 137`).
- **Root Cause**: Headless Chromium or LibreOffice consumes unbounded memory when parsing unoptimized vector graphics or massive tables.
- **Mitigation & Recovery**:
  1. **Memory Capping**: Docker worker container is configured with `--memory=2048m --memory-swap=2048m`.
  2. **Page Count Pre-Flight Check**: Pre-flight checks reject PDFs exceeding 100 pages for single-job conversion, directing the user to batch split the document.
  3. **Dead-Letter Queue Handling**: If a worker crashes, the job is caught by the supervisor daemon, marked as `failed` with a user-friendly error message (*"Document exceeds memory capacity; please reduce page count"*), and the worker container automatically respawns in <2 seconds.
