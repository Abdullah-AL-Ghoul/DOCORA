# DOCORA — Architecture Decisions Register (ADR Consolidated Baseline v2.0)

**Document Reference:** `DOCORA-19-ADR-v2.0`  
**Status:** APPROVED ARCHITECTURE BASELINE (POST-OWNER SIGN-OFF & STAGE 01.0 PoC GATE)  
**Audit Predecessors:** Phase 00 (`13-ARCHITECTURE-DECISIONS.md`), Phase 00.1 (`11-UPDATED-ARCHITECTURE-DECISIONS.md`, `14-PRODUCT-OWNER-DECISIONS.md`), Phase 00.2 Remediation (`v1.2.2`)  

---

## 1. Architectural Governance & Status Protocol

In adherence to the DOCORA Engineering Constitution:
- **`APPROVED BY PRODUCT OWNER`**: Applied to Phase 01 MVP foundation decisions explicitly approved by the Product Owner in Plan v2.0 (`ADR-001` through `ADR-005`, `ADR-011`).
- **`DEFERRED TO PHASE 02–04 (PROPOSED)`**: Applied to future-phase architectural designs (`ADR-006` through `ADR-010`) governed by strict Zero-Leakage Phase Separation.
- **`SUPERSEDED`**: Applied to obsolete designs from earlier phases.

---

## 2. Master ADR Inventory

### ADR-001: Editor Engine, Stage 01.0 Pagination PoC Gate & Synchronized Paged Preview Fallback
- **Context:** Phase 00 recommended Tiptap Pro Pages. Audit revealed closed-source licensing ($49-$999/mo), private registry fragility, and bidirectional Arabic text split bugs. Furthermore, `ResizeObserver` is strictly a box-measurement API and not a pagination engine: mutating or splitting live ProseMirror DOM nodes across pages corrupts multi-page table selection and cursor continuity.
- **Stage 01.0 PoC Mandate & Fallback Architecture:**
  - Execute an isolated Pagination PoC (`tests/poc/`) testing 5 critical cases: (1) split paragraphs across pages, (2) `keep-with-next` headings, (3) multi-page tables, (4) mixed Arabic/English/numeric text, and (5) cross-page cursor selection and copy/paste.
  - Adopt **Open-Source Tiptap `^3.0.0` Core** (with native `textDirection: 'ltr' | 'rtl' | 'auto'` and `immediatelyRender: false` for SSR hydration safety) paired with the explicit architectural safeguard: a **Continuous Structured Editor with deterministic page-break guides + a Synchronized Live Paged Print Preview mode** so ProseMirror selection and tables are never corrupted.
- **Security & Cost:** Eliminates commercial dependency; zero private token exposure in CI; guarantees `< 16.6ms` 60Hz typing responsiveness.
- **Status:** **APPROVED BY PRODUCT OWNER** (Stage 01.0 PoC + Continuous Structured Editor with Synchronized Paged Preview).

---

### ADR-002: Dual-Engine Document Export Strategy (`docx@9.15.2` + `Puppeteer` Vector PDF)
- **Context:** Need to generate print-ready PDFs and editable Microsoft Word documents with high Arabic/English fidelity and zero data loss.
- **Decision:**
  - **DOCX Engine:** Pin exact published version **`docx@9.15.2`**. Implement full Arabic OOXML properties: `bidiVisual` on `TableProperties` (to order columns right-to-left in Word), `bidirectional` / `rightToLeft` on paragraphs and runs, `AlignmentType.RIGHT` for RTL cells, and explicit `RunFonts` (`ascii`, `hAnsi`, `cs`).
  - **PDF Engine:** Dedicated worker running `Puppeteer` Headless Chromium generating vector PDFs via `page.pdf({ format: 'A4', printBackground: true })` after `document.fonts.ready` (no fake `dpi` parameter in `PDFOptions`). 300 DPI rasterization is used strictly in visual QA tooling when comparing rendered pages for $\text{SSIM} \ge 0.95$.
- **Security & Cost:** Executed inside an isolated `workers/` service (`docora-worker`), never inside short-lived Next.js serverless routes.
- **Status:** **APPROVED BY PRODUCT OWNER**.

---

### ADR-003: AI Provider Pricing, Stateless `store: false` Reality & Local Context Management
- **Context:** Document studio handles confidential user data and requires accurate unit economics and honest technical guarantees around `store: false`.
- **Decision:**
  - **Official Model Pricing Baseline:**
    - `gemini-3.5-flash-lite`: **$0.30** input / **$2.50** output per 1M tokens (P01/P02 fast tasks).
    - `gemini-3.8-flash`: **$0.75** input / **$3.75** output per 1M tokens (P01 primary generation model).
    - `gemini-4-argon`: **$2.00 / $10.00** per 1M tokens (until Nov 30, 2026) and **$4.00 / $20.00** (from Dec 1, 2026); **not available on Free Tier**, reserved for Phase 02 deep review.
  - **Technical Reality of `store: false`:** Disables interaction object storage at the provider, which conflicts with `background: true` and `previous_interaction_id`. Therefore, DOCORA manages conversation history and `Continue Generation` state locally in its PostgreSQL CDM database. `store: false` is documented transparently as stateless request mode, while full contractual Zero Data Retention (ZDR) requires Enterprise Vertex AI ZDR.
- **Status:** **APPROVED BY PRODUCT OWNER**.

---

### ADR-004: Zero-Leakage Phase Separation & MVP Functional Scope Boundaries
- **Context:** Defining strict boundaries for Phase 01 so zero deferred tables or unverified stubs leak into the MVP foundation.
- **Decision:**
  - **Phase 01 (MVP Foundation)** includes ONLY:
    - Migrations `0001_iam_and_profiles.sql`, `0002_entitlements_and_token_ledger.sql`, `0003_documents_and_cdm_versions.sql`, and `0004_pgmq_export_jobs.sql`.
    - Defense-in-depth Data Access Layer (`src/lib/dal/`) + `src/proxy.ts` (Node.js runtime in Next.js 16.4.5).
    - CDM v1.2, Tiptap `^3.0.0` bilingual editor, single-model AI generation with `Continue Generation` recovery, `docx@9.15.2` + `Puppeteer` exports via `workers/`, digital PDF text extraction (`pdfjs-dist`), and Sandboxed Pre-computed Landing Page Demo.
  - **Deferred Phases:** Phase 02 (Capability Router, 9-Role Multi-Agent System, 14-Vector Quality Engine), Phase 03 (Tesseract `5.5.4` OCR, Style DNA + migration), and Phase 04 (Skills Registry + migration, Team Workspaces) are strictly excluded from Phase 01 code and migrations.
- **Status:** **APPROVED BY PRODUCT OWNER**.

---

### ADR-005: Hardened Two-Phase Token Ledger (`SECURITY DEFINER SET search_path = ''`)
- **Context:** Preventing privilege escalation, search-path hijacking, spoofing of `user_id`, and concurrent double-spending on the 50,000 monthly free token allowance.
- **Decision:**
  - All ledger functions in `0002_entitlements_and_token_ledger.sql` use `SECURITY DEFINER SET search_path = ''` with fully schema-qualified tables (`public.user_entitlements`, `public.token_usage_ledger`).
  - `REVOKE ALL` from `PUBLIC` and `anon`; `GRANT EXECUTE` only to `authenticated` (for client reservation where identity is derived strictly from `auth.uid()`) and `service_role` (for settlement/refund).
  - Atomic Reserve $\rightarrow$ Settle $\rightarrow$ Refund/Release lifecycle using `SELECT ... FOR UPDATE` row locking and `idempotency_key UNIQUE`.
- **Status:** **APPROVED BY PRODUCT OWNER**.

---

### ADR-006: Capability-Based Model Registry & Router (Phase 02)
- **Context:** Dynamic multi-provider routing evaluating complexity, Arabic specialization, and cost.
- **Status:** **DEFERRED TO PHASE 02 (PROPOSED)**.

---

### ADR-007: Bounded 9-Role Multi-Agent Review Architecture (Phase 02)
- **Context:** 9 specialized review roles under a central Supervisor with hard iteration cap ($N_{max}=2$).
- **Status:** **DEFERRED TO PHASE 02 (PROPOSED)**.

---

### ADR-008: Governed Declarative Skills Registry (Phase 04)
- **Context:** Declarative JSON skill manifests with Zod validation and zero arbitrary code execution.
- **Status:** **DEFERRED TO PHASE 04 (PROPOSED)**.

---

### ADR-009: Style DNA via Tenant-Isolated Parameter Profiles (Phase 03)
- **Context:** Extracting structured stylistic parameters into tenant-scoped PostgreSQL records without training weights.
- **Status:** **DEFERRED TO PHASE 03 (PROPOSED)**.

---

### ADR-010: 14-Vector Hybrid Quality Scoring Engine (Phase 02)
- **Context:** 14 distinct vectors combining deterministic AST linters and semantic reviewers.
- **Status:** **DEFERRED TO PHASE 02 (PROPOSED)**.

---

### ADR-011: Dedicated Worker Service & Supabase PGMQ Orchestration
- **Context:** Heavy export jobs (`docx@9.15.2` and `Puppeteer`) must run outside Next.js serverless timeouts with reliable delivery.
- **Decision:** Build an isolated `workers/` service (`docora-worker`) polling `PGMQ` with visibility timeout leases, heartbeats, fencing tokens (`fencing_token BIGINT`), idempotency keys, and Dead-Letter Queue (DLQ) recovery after 3 failed attempts.
- **Status:** **APPROVED BY PRODUCT OWNER**.

---
*Verified against Plan v2.0 Product Owner approval and architectural guardrails.*
