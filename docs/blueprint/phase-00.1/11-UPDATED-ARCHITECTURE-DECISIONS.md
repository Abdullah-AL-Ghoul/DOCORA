# 11 — Updated Architectural Decision Records (ADRs)
## Project: DOCORA — AI Document Studio
**Phase:** 00.1 — Master Architecture Validation & Blueprint Remediation  
**Status:** Remediated ADR Catalog (Engineering Verified / Owner Sign-Off Pending)  

---

## ADR Governance Index

| ADR ID | Remediated Title | Architectural Status | Engineering Confidence |
|---|---|---|---|
| **ADR-001** | Frontend Framework: Next.js 15+ App Router, React 19 & TypeScript | Approved by Core | High |
| **ADR-002** | Persistence & Data Security: Supabase (PostgreSQL 16, Auth, Storage) | Approved by Core | High |
| **ADR-003** | Editor Core & Pagination: Open-Source Tiptap v2 + Decoupled Virtual Canvas | Proposed — Pending Owner Approval | High |
| **ADR-004** | Authoritative State: Canonical Document Model (CDM JSON v1.1.0) | Approved by Core | High |
| **ADR-005** | AI Strategy: Capability Model Registry & Paid Tier Privacy Mandate | Proposed — Pending Owner Approval | High |
| **ADR-006** | Word OOXML Compilation: Pure TypeScript `docx` Library | Approved by Core | High |
| **ADR-007** | Dual-Track PDF Architecture: Web Chromium + LibreOffice Worker | Proposed — Pending Owner Approval | High |
| **ADR-008** | In-Browser PDF & Citation Viewing: Mozilla PDF.js | Approved by Core | High |
| **ADR-009** | Document Intelligence: Adaptive 3-Tier Processing (Text -> OCR -> Vision) | Approved by Core | High |
| **ADR-010** | Async Queue Architecture: Supabase Queues (`pgmq`) | Approved by Core | High |
| **ADR-011** | Storage Access Control: Supabase Native Storage RLS & Signed URLs | Approved by Core | High |
| **ADR-012** | Bilingual & RTL System: CSS Logical Properties & Complex Script Shaping | Approved by Core | High |
| **ADR-013** | UI Design System: Tailwind CSS v4 & shadcn/ui (Radix Primitives) | Approved by Core | High |
| **ADR-014** | Database Entitlements Security: Strict Isolation of Profiles & Quotas | Approved by Core | High |

---

## Remediated ADR Details

### ADR-003: Document Editor Core & Pagination Strategy
- **Context**: Need a rich-text editing engine supporting tables, images, and Arabic RTL without crippling keystroke latency or incurring prohibitive licensing fees.
- **Decision**: Adopt **Open-Source Tiptap v2 Core with a Decoupled Virtual Paged Canvas**. Reject Tiptap Pro Pages ($49–$999/mo) for MVP.
- **Pros**: $0 recurring licensing cost; zero private npm token management; ultra-low typing latency (INP < 20ms); authoritative pagination deferred to export compilers.
- **Cons**: Real-time page boundary reflow during active typing is simulated via CSS containers rather than a continuous live-paginating DOM node tree.
- **Status**: **Proposed — Pending Product Owner Approval**.

---

### ADR-004: Authoritative State via Canonical Document Model (CDM v1.1.0)
- **Context**: Decoupling web editor presentation state from persistent storage, AI generation, and multi-format exports.
- **Decision**: **CDM JSON v1.1.0 is the sole authoritative document state**. Tiptap ProseMirror state is an ephemeral presentation projection.
- **Pros**: Single source of truth; typed discriminated unions; deterministic schema migrations; clean export compilation.
- **Cons**: Requires maintaining bidirectional mappers (`CDM <-> ProseMirror`).
- **Status**: **Approved by Engineering Core**.

---

### ADR-005: AI Provider Strategy & Data Privacy Compliance
- **Context**: Providing large-context document generation and multimodal understanding while protecting user confidentiality.
- **Decision**: Adopt a **Capability-Based Model Registry** primarily routing to Google Gemini (Paid Commercial Tier), with fallback adapters for Claude 3.5 Sonnet and GPT-4o. Mandate commercial Google Cloud billing to guarantee zero model training on customer data.
- **Pros**: Dynamic model routing prevents deprecation lock-in; legally sound privacy policy disclosing 55-day safety log retention.
- **Cons**: Requires active Google Cloud billing account from day one (no free tier in production).
- **Status**: **Proposed — Pending Product Owner Approval**.

---

### ADR-007: Dual-Track PDF Generation & Realistic Fidelity Standards
- **Context**: Exporting documents to PDF with fast web previews while matching Word layout rules.
- **Decision**: Implement **Dual-Track PDF Generation**: Track A (Chromium Paged Media) for instant preview; Track B (Containerized LibreOffice Worker) for formal Word-to-PDF downloads. Replace "100% parity" claims with realistic visual similarity targets (>=95%).
- **Pros**: Eliminates unachievable engineering claims; provides both lightning-fast web exports and high-fidelity Word-matching conversions.
- **Cons**: Requires deploying and maintaining a containerized Docker worker (~$25/mo).
- **Status**: **Proposed — Pending Product Owner Approval**.

---

### ADR-010: Asynchronous Queue Architecture (Supabase PGMQ)
- **Context**: Offloading heavy conversion and extraction jobs (>15s) from serverless edge functions.
- **Decision**: Standardize on **Supabase Queues (`pgmq`)**, running natively inside PostgreSQL 16.
- **Pros**: Zero additional server infrastructure (no Redis cluster); transactional enqueueing; message visibility timeouts (60s); built-in archive auditing.
- **Cons**: Worker daemon must poll the database table periodically.
- **Status**: **Approved by Engineering Core**.

---

### ADR-014: Database Entitlements Security & Privilege Escalation Fix
- **Context**: The Phase 00 schema allowed users to update their own subscription tier and token quota due to shared fields in `profiles`.
- **Decision**: **Decompose user state into `profiles` (user-editable) and `user_entitlements` (service_role only)**, backed by an atomic append-only `token_usage_ledger`.
- **Pros**: Completely closes the critical privilege escalation vulnerability; guarantees ACID accounting of token usage.
- **Cons**: Requires querying two tables on user session hydration (cached in JWT).
- **Status**: **Approved by Engineering Core**.
