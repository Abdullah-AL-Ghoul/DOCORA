# DOCORA — Product North Star & Unified Requirements Baseline (Phase 00.2)

**Document Reference:** `DOCORA-01-PRD-v1.2`  
**Status:** CONSOLIDATED ARCHITECTURE BASELINE  
**Audit Predecessors:** Phase 00 (`01-PRODUCT-REQUIREMENTS.md`), Phase 00.1 (`02-UPDATED-MVP-SCOPE.md`)  

---

## 1. Product North Star & Core Philosophy

> **Product Principle:**  
> *"DOCORA does not merely generate documents. It understands user intent, provisions the optimal models and tools, learns authorized user style, drafts with high structural integrity, reviews against multidimensional standards, verifies evidence, and delivers professional documents whose fidelity and privacy can be unconditionally trusted."*

DOCORA transforms document creation from naive conversational text generation into an **intelligent document engineering studio**. Generic LLMs dump unstructured Markdown into conversational panes, leaving users to copy, paste, reformat, and struggle with broken Arabic typography, degraded tables, misaligned page breaks, and hallucinated citations. DOCORA treats documents as **first-class structural artifacts** governed by a Canonical Document Model (CDM), multi-model capability routing, and bounded verification agents.

---

## 2. Core Pillars of the Platform

```
+----------------------------------------------------------------------------------------------------+
|                                    DOCORA PRODUCT NORTH STAR                                       |
+----------------------------------------------------------------------------------------------------+
|  1. Structural & Visual Fidelity                                                                   |
|     - WYSIWYG Virtual Canvas with true page margins, headers/footers, and page breaks              |
|     - Bidirectional Word (DOCX) & PDF fidelity target (>=95% SSIM & structural alignment)           |
|                                                                                                    |
|  2. Native Bilingual Equality (Arabic RTL & English LTR)                                           |
|     - First-class Arabic typography (Noto Sans Arabic, Cairo, Amiri) with native HarfBuzz shaping   |
|     - Bidirectional mixed-direction isolation (Unicode Bidi control, BiDi spans)                   |
|                                                                                                    |
|  3. Adaptive Intelligence & Multi-Model Orchestration                                              |
|     - Dynamic routing based on task complexity, language, context length, and data privacy         |
|     - Multi-agent review loop with strict iteration and token budgets                              |
|                                                                                                    |
|  4. Privacy-Preserving Personalization (Style DNA)                                                 |
|     - Zero model weight fine-tuning; user-scoped, tenant-isolated structural Style DNA profiles     |
|     - Explicit user consent for style ingestion, inspection, and application                       |
|                                                                                                    |
|  5. Transparent, Multidimensional Quality Scoring                                                  |
|     - 14 distinct dimensions evaluated via deterministic heuristics and model verification          |
|     - No unexplainable composite scores; critical flaws unconditionally block delivery              |
+----------------------------------------------------------------------------------------------------+
```

---

## 3. User Personas & Core Journeys

### Persona A: Academic Researcher & Postgraduate Student (Tariq)
- **Primary Need:** Produce bilingual research papers and master's theses compliant with APA 7th / IEEE formats.
- **Pain Points:** Arabic citations scramble in Word; equations break; converting PDF literature to editable text mangles RTL paragraph order.
- **DOCORA Journey:**
  1. Uploads 5 reference papers (English and Arabic PDFs).
  2. File Intelligence extracts structured text, tables, and citations with provenance IDs.
  3. Tariq specifies paper topic, target journal format, and enables Arabic citation style.
  4. Intent Agent formulates an outline; tariq approves.
  5. Writing & Citation Agents draft sections with verified in-text citations.
  6. Tariq edits in the Virtual Canvas with real-time page-boundary feedback and exports to DOCX.

### Persona B: Enterprise Legal & Operations Counsel (Layla)
- **Primary Need:** Draft bilingual employment contracts, non-disclosure agreements, and operational policies.
- **Pain Points:** Generic AI drafts lack strict jurisdiction warnings; confidential employee data must never train public models; tables with merged cells break during export.
- **DOCORA Journey:**
  1. Layla uploads the company's approved NDA template to extract its "Corporate Style DNA".
  2. Prompts DOCORA for a customized vendor service agreement.
  3. System enforces Confidential Data Classification, routing strictly through zero-retention / enterprise-isolated models.
  4. Contract includes standard boilerplate with prominent disclaimer: *"Draft Agreement — Requires Professional Legal Review"*.
  5. Layla exports to high-fidelity PDF with locked headers and dynamic page numbering.

### Persona C: Management Consultant & Business Analyst (Kareem)
- **Primary Need:** High-velocity market research reports, pitch decks, and financial proposals with complex data tables.
- **Pain Points:** AI hallucinations in statistics; inconsistent heading hierarchies across 30-page documents; lack of brand font consistency.
- **DOCORA Journey:**
  1. Feeds raw financial tables (CSV/Images) into DOCORA.
  2. OCR & Table Pipeline reconstructs the matrix into the Canonical Document Model.
  3. Multi-Agent Review flags 2 unverified market claims, presenting side-by-side reconciliation suggestions.
  4. Kareem adjusts the formatting theme using DOCORA design tokens and exports clean DOCX for executive presentation.

---

## 4. Functional Requirements (FRs)

### FR-01: Document Creation & Prompt-to-Document
- **FR-01.1:** System shall parse conversational prompts into structured document intent specifications containing document type, target audience, tone, language direction, and structural constraints.
- **FR-01.2:** System shall support multi-step document planning: Intent Extraction -> Outline Approval -> Section Drafting -> Quality Review -> Canvas Delivery.
- **FR-01.3:** System shall support user cancellation and intervention at any generation step without corrupting document state.

### FR-02: Bilingual Rich-Text Editing & Virtual Canvas
- **FR-02.1:** Editor shall render an A4 / Letter virtual paged layout reflecting physical margins (default 25.4mm), header/footer bands, and dynamic page break indicators.
- **FR-02.2:** Editor shall support block-level directionality (`dir="rtl"`, `dir="ltr"`) and inline BiDi spans (`dir="auto"`) with seamless keyboard cursor navigation.
- **FR-02.3:** Editor shall support rich typography: H1-H6, body, blockquotes, callout boxes, code blocks, bullet/numbered lists, footnotes, and citation chips.
- **FR-02.4:** Table editor shall support row/column insertion, deletion, column resizing, header rows, and cell shading.

### FR-03: Multi-Format Document Export & Import
- **FR-03.1:** System shall generate valid OOXML `.docx` files conforming to ECMA-376 specifications with full font embedding references and RTL run attributes (`<w:rtl/>`).
- **FR-03.2:** System shall render print-ready PDFs matching the editor's visual layout via headless server-side rendering with HarfBuzz Arabic text shaping.
- **FR-03.3:** System shall import existing `.docx` files, mapping OOXML structures into the Canonical Document Model (CDM) while safely preserving unsupported elements as uneditable raw blocks.

### FR-04: File Intelligence & Multimodal OCR
- **FR-04.1:** System shall inspect uploaded PDFs, determining digital vs. scanned status on a per-page basis.
- **FR-04.2:** System shall extract digital PDF text, hierarchical bookmarks, tables, and embedded images while maintaining reading order.
- **FR-04.3:** System shall process scanned PDFs and images through an OCR pipeline equipped with Arabic and English language models, image deskewing, and layout analysis.
- **FR-04.4:** Every extracted entity shall carry provenance metadata (source document ID, page number, bounding box).

### FR-05: Adaptive Multi-Model Routing
- **FR-05.1:** System shall maintain a capability-based registry of AI models, decoupling business logic from proprietary vendor SDKs.
- **FR-05.2:** Router shall dynamically evaluate task complexity, modality, context length, language requirements, privacy classification, and user quota.
- **FR-05.3:** Router shall implement automated circuit breakers and fallbacks in the event of upstream model timeouts, rate limits, or service outages.

### FR-06: Multi-Agent Quality Review
- **FR-06.1:** Completed drafts shall undergo bounded evaluation across 9 specialized reviewer roles (Intent, Structure, Language, Citations, etc.).
- **FR-06.2:** Review loops shall enforce hard limits: maximum 2 revision rounds and strict token expenditure caps.
- **FR-06.3:** Reviewers shall generate actionable suggestions with precise character/block ranges, allowing users to accept or dismiss individual diffs.

### FR-07: Style DNA & Personal Document Learning
- **FR-07.1:** Users may upload existing documents to extract stylistic DNA (vocabulary formality, sentence length, margin sizes, color accents).
- **FR-07.2:** Extracted style parameters must be presented to the user for explicit review, editing, and approval before storage.
- **FR-07.3:** Stored Style DNA profiles must be strictly tenant-isolated in PostgreSQL, with zero cross-tenant leakage and zero fine-tuning of shared foundation models.

### FR-08: Document Quality Scoring
- **FR-08.1:** System shall evaluate every document across 14 deterministic and heuristic quality dimensions.
- **FR-08.2:** System shall assign an overall status: `READY`, `READY WITH WARNINGS`, `NEEDS REVISION`, or `BLOCKED`.
- **FR-08.3:** Critical failures (such as broken export syntax, severe hallucination signals, or security violations) shall immediately downgrade status to `BLOCKED` regardless of other scores.

---

## 5. Non-Functional Requirements (NFRs)

### NFR-01: Performance & Latency
- **NFR-01.1:** First Contentful Paint (FCP) of the editor canvas shall occur in `< 1.2s` on 4G connections.
- **NFR-01.2:** Editor typing latency shall remain `< 16ms` (60 FPS) for documents up to 100 pages (approx. 50,000 words).
- **NFR-01.3:** AI generation Time to First Token (TTFT) shall not exceed `1.5s` using streaming transport.
- **NFR-01.4:** Standard document export (10 pages) shall complete in `< 4.0s` for DOCX and `< 6.0s` for PDF.

### NFR-02: Document Fidelity Benchmarking
- **NFR-02.1:** Exported DOCX and PDF documents shall achieve `>= 95%` structural and typographic fidelity against the editor preview under standard validation suites.
- **NFR-02.2:** Complex tables (up to 10 columns, merged headers) shall render with zero cell text clipping across exports.

### NFR-03: Security & Compliance
- **NFR-03.1:** Multi-tenant database isolation shall be enforced via PostgreSQL Row-Level Security (RLS) on all tables with tenant/user keys.
- **NFR-03.2:** No client application shall ever hold or receive database `service_role` credentials.
- **NFR-03.3:** All uploaded files and untrusted model outputs shall be sanitized, type-checked, and isolated from code execution contexts.
- **NFR-03.4:** The system shall support full user data export and cryptographic account deletion adhering to GDPR / Saudi PDPL standards.

### NFR-04: Reliability & Fault Tolerance
- **NFR-04.1:** Background job processing (export, OCR, long-form synthesis) shall operate under at-least-once delivery with idempotent execution keys.
- **NFR-04.2:** Editor state shall auto-save every `30 seconds` of inactivity or after `50 keystrokes` to local IndexedDB and server PostgreSQL.
- **NFR-04.3:** System uptime target shall be `99.9%` (excluding scheduled maintenance).

### NFR-05: Accessibility (a11y) & Internationalization (i18n)
- **NFR-05.1:** Web studio UI shall achieve full WCAG 2.2 Level AA compliance, including high-contrast focus rings and screen reader landmarks.
- **NFR-05.2:** All user interface microcopy, system alerts, and error states shall be natively authored in both Modern Standard Arabic and Professional English.

---

## 6. Success Metrics & Verification Targets

| Metric | Target | Measurement Methodology | Gate Status |
| :--- | :--- | :--- | :--- |
| **Doc Fidelity Index** | $\ge 95\%$ | Automated visual regression test suite comparing canvas raster to LibreOffice PDF render | NOT TESTED (Runtime) |
| **Bilingual Typographic Integrity** | 100% Pass | Zero isolated Arabic characters; 100% correct BiDi isolate bracket rendering | NOT TESTED (Runtime) |
| **P95 Export Latency** | $< 5.0\text{s}$ | Server-side execution telemetry from queue pickup to storage presigned URL | NOT TESTED (Runtime) |
| **Quality Review Precision** | $\ge 90\%$ | User acceptance rate of multi-agent review suggestions | NOT TESTED (Runtime) |
| **Zero Privilege Escalation** | 100% Pass | Automated automated security test suite exercising RLS boundary violations | CONFIRMED (Design) |

---
*Verified against Phase 00.1 remediation directives. Approved as baseline requirements for Phase 00.2 consolidation.*
