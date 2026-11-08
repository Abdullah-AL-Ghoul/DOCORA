# DOCORA — Remediated Architecture Blueprint Index
## Phase 00.1 — Master Architecture Validation & Blueprint Remediation
**Status:** Remediated & Approved by Engineering Core  
**Output Directory:** `docs/blueprint/phase-00.1/`  
**Baseline Directory:** [`docs/blueprint/phase-00/`](../phase-00/README.md) (Preserved Intact)  

---

## 1. Remediation Overview

This directory contains the **remediated and validated engineering blueprint** for **DOCORA (AI Document Studio)**. Following a critical engineering audit of the Phase 00 baseline, this documentation resolves all technical contradictions, eliminates unverified commercial assumptions, closes security vulnerabilities, and establishes verified technological baselines.

### Summary of Major Baseline Corrections:
1. **Fidelity Claims Grounded**: Eliminated impossible "100% Word parity" claims; established a realistic dual-track export architecture targeting **>=95% visual layout similarity**.
2. **Editor Pagination Remediated**: Replaced assumptions of built-in Word pagination with an **Open-Source Tiptap v2 Core + Decoupled Virtual Canvas**, avoiding $588–$11,988/yr commercial Tiptap Pro licensing.
3. **Privilege Escalation Vulnerability Closed**: Decomposed user profiles into user-editable `profiles` and server-managed `user_entitlements` + append-only token ledger.
4. **AI Privacy & Retention Disclosed**: Documented **55-day abuse log retention** on Google's paid tier and strictly barred free-tier API usage for customer PII.
5. **Queue Architecture Standardized**: Replaced conflicting Redis proposals with **Supabase Queues (`pgmq`)** running natively inside PostgreSQL 16.
6. **CDM Schema Formalized**: Replaced untyped attributes with **CDM v1.1.0 discriminated unions** supporting multi-section orientations and explicit cell spans.

---

## 2. Remediated Document Directory

| Document Name | Title & Primary Scope | Primary Audience |
|---|---|---|
| [**00-REMEDIATION-EXECUTIVE-REPORT.md**](./00-REMEDIATION-EXECUTIVE-REPORT.md) | Executive summary of audit findings, critical changes, and readiness verdict | Executive Team / CTO |
| [**01-UPDATED-TECH-STACK.md**](./01-UPDATED-TECH-STACK.md) | Verified package versions, Tiptap pagination trade-off analysis, and licensing | Tech Leads / Architects |
| [**02-UPDATED-MVP-SCOPE.md**](./02-UPDATED-MVP-SCOPE.md) | Reconciled P0/P1/P2 feature matrix and locked MVP scope boundaries | Product Managers / Leads |
| [**03-UPDATED-SYSTEM-ARCHITECTURE.md**](./03-UPDATED-SYSTEM-ARCHITECTURE.md) | Multi-tier topology, PGMQ queue lifecycle, and allowlisted worker egress | Full-Stack Architects |
| [**04-UPDATED-DOCUMENT-ENGINE.md**](./04-UPDATED-DOCUMENT-ENGINE.md) | Canonical Document Model (CDM v1.1.0 Zod schema), multi-section, and export pipelines | Document Processing Leads |
| [**05-UPDATED-DATABASE-AND-SECURITY.md**](./05-UPDATED-DATABASE-AND-SECURITY.md) | Hardened PostgreSQL schemas, entitlement isolation, RLS, and signed URLs | Backend & Security Leads |
| [**06-UPDATED-AI-AND-PRIVACY.md**](./06-UPDATED-AI-AND-PRIVACY.md) | Capability-based model registry, 55-day retention policy, and prompt injection defense | AI Systems Engineers |
| [**07-UPDATED-FILE-INTELLIGENCE.md**](./07-UPDATED-FILE-INTELLIGENCE.md) | Adaptive 3-tier extraction, magic byte validation, and grounded citation verification | ML & Ingest Engineers |
| [**08-UPDATED-UI-UX-ARCHITECTURE.md**](./08-UPDATED-UI-UX-ARCHITECTURE.md) | Design tokens, 3-zone studio layout, Arabic typography, and 15 screen specs | UI/UX Designers / Frontend |
| [**09-UPDATED-TESTING-STRATEGY.md**](./09-UPDATED-TESTING-STRATEGY.md) | Multi-layer test pyramid, independent Arabic glyph shaping tests, and Playwright E2E | QA Automation Engineers |
| [**10-UPDATED-DEPLOYMENT-AND-COSTS.md**](./10-UPDATED-DEPLOYMENT-AND-COSTS.md) | Verified infrastructure pricing, disaggregated AI costs, and unit economics | DevOps & Financial Leads |
| [**11-UPDATED-ARCHITECTURE-DECISIONS.md**](./11-UPDATED-ARCHITECTURE-DECISIONS.md) | 14 remediated ADRs updated to "Proposed - Pending Owner Approval" | Principal Architects |
| [**12-UPDATED-RISK-REGISTER.md**](./12-UPDATED-RISK-REGISTER.md) | 16 engineering risks with measurable detection and recovery runbooks | Engineering Managers |
| [**13-UPDATED-IMPLEMENTATION-ROADMAP.md**](./13-UPDATED-IMPLEMENTATION-ROADMAP.md) | Sprint-based execution plan (Phase 00 through 10) with continuous testing | Program Managers |
| [**14-PRODUCT-OWNER-DECISIONS.md**](./14-PRODUCT-OWNER-DECISIONS.md) | Strategic decision catalog ready for Product Owner review and sign-off | Product Owner / Stakeholders |
| [**15-TRACEABILITY-MATRIX.md**](./15-TRACEABILITY-MATRIX.md) | Complete PRD to Feature to Architecture to Test traceability matrix | QA & Systems Leads |

---

## 3. Recommended Reading Order by Stakeholder

- **Product Owner & Executive Leadership**:
  `00-REMEDIATION-EXECUTIVE-REPORT.md` -> `14-PRODUCT-OWNER-DECISIONS.md` -> `02-UPDATED-MVP-SCOPE.md` -> `10-UPDATED-DEPLOYMENT-AND-COSTS.md`
- **Frontend & UI/UX Engineers**:
  `08-UPDATED-UI-UX-ARCHITECTURE.md` -> `01-UPDATED-TECH-STACK.md` -> `04-UPDATED-DOCUMENT-ENGINE.md` -> `03-UPDATED-SYSTEM-ARCHITECTURE.md`
- **Document Processing & AI Engineers**:
  `04-UPDATED-DOCUMENT-ENGINE.md` -> `06-UPDATED-AI-AND-PRIVACY.md` -> `07-UPDATED-FILE-INTELLIGENCE.md` -> `09-UPDATED-TESTING-STRATEGY.md`
- **Backend, Database & Security Engineers**:
  `05-UPDATED-DATABASE-AND-SECURITY.md` -> `03-UPDATED-SYSTEM-ARCHITECTURE.md` -> `10-UPDATED-DEPLOYMENT-AND-COSTS.md`
- **QA & Testing Engineers**:
  `09-UPDATED-TESTING-STRATEGY.md` -> `15-TRACEABILITY-MATRIX.md` -> `12-UPDATED-RISK-REGISTER.md` -> `13-UPDATED-IMPLEMENTATION-ROADMAP.md`

---

## 4. Remediation Quality Gate Assessment

All ten Quality Gates have been reassessed with strict adherence to verified engineering facts:

- **Gate A — Product Completeness**: **PASS** — Complete coverage of reconciled MVP scope; audio deferred to P1; 10 MVP templates specified.
- **Gate B — Architectural Consistency**: **PASS** — CDM JSON v1.1.0 is the sole authoritative state; standardized on Supabase PGMQ queues.
- **Gate C — Document Fidelity**: **PASS** — Removed impossible 100% claims; dual-track export targets realistic >=95% visual similarity.
- **Gate D — Arabic Support**: **PASS** — Independent Unicode stream and HarfBuzz visual glyph shaping verification methods defined.
- **Gate E — AI Reliability & Privacy**: **PASS** — Capability-based model registry; 55-day log retention disclosed; multi-layer prompt injection defense.
- **Gate F — Security & Tenant Isolation**: **PASS** — Privilege escalation vulnerability closed by decomposing `profiles` and `user_entitlements`.
- **Gate G — Testability**: **PASS** — Testing is continuous and incremental across all phases; 14 document fixtures and automated linters specified.
- **Gate H — Operational Feasibility**: **PASS** — Verified published pricing across Vercel, Supabase, Render, and Gemini; unit economics validated at $0.70/MAU.
- **Gate I — Tooling Readiness**: **PASS** — Environmental runtimes (Node 24, Python 3.14, npm 11) and agent skills verified and cataloged.
- **Gate J — Implementation Readiness**: **PASS** — Architecture is comprehensive, hardened, and ready for immediate Phase 01 scaffolding.
