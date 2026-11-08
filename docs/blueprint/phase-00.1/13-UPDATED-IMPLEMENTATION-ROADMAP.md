# 13 — Updated Phased Implementation Roadmap
## Project: DOCORA — AI Document Studio
**Phase:** 00.1 — Master Architecture Validation & Blueprint Remediation  
**Status:** Remediated Sprint-Based Execution Plan  

---

## 1. Roadmap Architecture & Execution Philosophy

The previous roadmap assigned arbitrary calendar dates without an engineering estimation basis. This remediated roadmap structures delivery into **Sprint Cycles (2-Week Iterations)** governed by strict dependency gating:

```mermaid
gantt
    title DOCORA Engineering Delivery Roadmap (Sprint-Based)
    dateFormat  X
    axisFormat Sprint %d
    
    section Sprint 1-2 (Foundation)
    Phase 01: Application Shell & Design Tokens :p01, 0, 10
    Phase 02: Supabase Auth, Hardened Schema & Storage :p02, 10, 20
    
    section Sprint 3-4 (Core Engine)
    Phase 03: CDM v1.1.0 & docx/PDF Compilers :p03, 20, 32
    Phase 04: Virtual Paged Canvas & Tiptap Editor :p04, 32, 45
    
    section Sprint 5-6 (AI & Extraction)
    Phase 05: Staged AI Generation Pipeline :p05, 45, 58
    Phase 06: Multimodal File Intelligence & Citations :p06, 58, 70
    
    section Sprint 7-8 (Library & Polish)
    Phase 07: 10 MVP Templates & Searchable Library :p07, 70, 80
    Phase 08: Scoped In-Place AI Editing & Arabic Polish :p08, 80, 90
    
    section Sprint 9-10 (Hardening & Launch)
    Phase 09: Security Hardening & Playwright E2E :p09, 90, 100
    Phase 10: Production Deployment & Observability :p10, 100, 108
```

---

## 2. Phase-by-Phase Engineering Specifications

### Phase 01: Application Shell, Foundation & Design Tokens
- **Target Duration**: Sprint 1 (Days 1–10).
- **Scope**:
  - Scaffolding Next.js 15+ App Router with React 19 and strict TypeScript.
  - Tailwind CSS v4 setup with `@theme` design tokens and native CSS logical properties.
  - Installation of essential shadcn/ui primitives (`button`, `dialog`, `dropdown-menu`, `input`, `sheet`).
  - Studio 3-zone responsive shell layout with collapsible navigator and AI panel.
- **Continuous Testing**: Unit tests for theme switching (Dark/Light) and RTL direction flipping.
- **Definition of Done (DoD)**: Shell builds with 0 TypeScript/linter errors; responsive across 1024px to 4K viewports; layout mirrors cleanly in RTL.

---

### Phase 02: Supabase Auth, Hardened Schema & Storage
- **Target Duration**: Sprint 2 (Days 11–20).
- **Scope**:
  - Provisioning Supabase PostgreSQL 16 schemas with separation of `profiles` and `user_entitlements`.
  - Enforcing Row-Level Security (RLS) on all tables; atomic stored procedure `check_and_deduct_tokens`.
  - Authentication views: Sign In, Sign Up, Magic Link, OAuth2 (Google/Microsoft).
  - Private S3 storage buckets (`raw-uploads`, `document-assets`, `generated-exports`) with signed URL helpers.
  - Enabling Supabase Queues (`pgmq` extension).
- **Continuous Testing**: pgTAP automated tests verifying non-service-role cannot elevate entitlements.
- **Definition of Done (DoD)**: User registration and session persistence verified; privilege escalation exploits blocked; signed upload URLs generate and expire on schedule.

---

### Phase 03: Canonical Document Model & Generation Engines (DOCX & PDF)
- **Target Duration**: Sprint 3 (Days 21–32).
- **Scope**:
  - Implementation of CDM JSON v1.1.0 TypeScript types and Zod runtime schema validators.
  - Native DOCX compiler (`docx` library) supporting sections, headers, footers, page numbering, tables, and `<w:bidi/>`.
  - Direct web PDF export via Puppeteer and Paged Media CSS.
  - Containerized LibreOffice conversion worker on Render/Fly.io.
- **Continuous Testing**: `xmllint` schema validation on output `.docx` files; automated LibreOffice headless smoke tests across fixtures FIX-01 through FIX-10.
- **Definition of Done (DoD)**: Fixtures compile to valid `.docx` and `.pdf` files; Arabic ligatures connect properly; Word 2016+ opens files with zero repair warnings.

---

### Phase 04: Professional Virtual Paged Canvas & Tiptap Editor
- **Target Duration**: Sprint 4 (Days 33–45).
- **Scope**:
  - Tiptap v2 Core integration with custom schema extensions.
  - Bidirectional state synchronization: `CDM <-> Tiptap ProseMirror State`.
  - Virtual Paged Canvas component rendering A4 sheets with margin guide overlays and dynamic page breaks.
  - Table editing controls: add/delete rows/columns, resize column widths, cell backgrounds.
  - Local IndexedDB keystroke buffering with 2000ms debounced cloud sync.
- **Continuous Testing**: Automated typing latency benchmarks asserting INP < 50ms; simulated crash recovery tests.
- **Definition of Done (DoD)**: User can author complex documents with tables and images; typing is instantaneous; changes survive hard browser refreshes.

---

### Phase 05: Staged AI Generation Pipeline (Google Gemini)
- **Target Duration**: Sprint 5 (Days 46–58).
- **Scope**:
  - Implementation of `IAIGeneratorProvider` and Capability-Based Model Registry.
  - Google Gemini API integration (Paid commercial tier).
  - Staged creation pipeline: Prompt -> Intent detection -> Outline Tree review -> Section synthesis.
  - Server-Sent Events (SSE) streaming updates to the client.
  - Zod schema validation guard ensuring 100% compliant CDM block nodes.
- **Continuous Testing**: Schema repair loop integration tests; token quota ledger deduction tests.
- **Definition of Done (DoD)**: Natural language prompt generates structured multi-page document with tables; streaming renders in real-time; malformed outputs auto-repaired.

---

### Phase 06: Multimodal File Intelligence & Citation Grounding
- **Target Duration**: Sprint 6 (Days 59–70).
- **Scope**:
  - Magic byte file signature validator and ZIP bomb safeguards.
  - Tier 1: Fast digital PDF text extraction via PDF.js.
  - Tier 2 & 3: Basic scanned PDF OCR (<=50 pages) and printed invoice vision extraction via Gemini.
  - Grounded Citation DB (`document_sources` & `snippets`) and embedded PDF.js viewer with amber bounding box highlights.
- **Continuous Testing**: Benchmark extraction accuracy on test receipts and digital PDFs; citation bounding box accuracy tests (>=95%).
- **Definition of Done (DoD)**: Ingested PDFs and receipts convert into editable CDM tables; clicking citation badges in the AI panel navigates to the exact source page.

---

### Phase 07: 10 MVP Templates & Searchable Document Library
- **Target Duration**: Sprint 7 (Days 71–80).
- **Scope**:
  - 10 curated bilingual templates (Business Proposal, Employment Contract, NDA, Meeting Minutes, etc.).
  - Variable placeholder substitution modal (`{{variable_name}}`).
  - Searchable Document Library: folder tree, grid/list view toggle, PostgreSQL full-text search, favorites, trash.
- **Continuous Testing**: Automated template hydration tests; full-text search query benchmarks (<150ms).
- **Definition of Done (DoD)**: Users can instantiate documents from templates with filled variables in <30 seconds; document organization operates smoothly.

---

### Phase 08: Scoped In-Place AI Editing & Arabic Polish
- **Target Duration**: Sprint 8 (Days 81–90).
- **Scope**:
  - Floating Selection Command Bar in the editor.
  - Scoped node extraction, prompt formatting, and single-node replacement generation.
  - Non-destructive inline visual diff viewer (green additions / red deletions) with Accept/Reject controls.
  - Arabic Fusha grammar and punctuation polisher.
- **Continuous Testing**: AST non-interference tests (asserting surrounding nodes remain byte-for-byte identical).
- **Definition of Done (DoD)**: Highlighting a single paragraph allows surgical rewrites without mutating or shifting surrounding document sections.

---

### Phase 09: Security Hardening & End-to-End Testing
- **Target Duration**: Sprint 9 (Days 91–100).
- **Scope**:
  - Playwright E2E test suites covering user journeys A through F.
  - Automated WCAG 2.2 Level AA accessibility audit via `axe-core`.
  - Security audit: STRIDE threat validation, prompt injection regression suite, RLS privilege checks.
  - Core Web Vitals optimization (LCP < 1.5s, INP < 50ms).
- **Continuous Testing**: Full regression suite executed across Chromium, Firefox, and WebKit viewports.
- **Definition of Done (DoD)**: 100% automated test pass rate; zero high-severity security vulnerabilities; zero a11y violations.

---

### Phase 10: Production Deployment & Observability
- **Target Duration**: Sprint 10 (Days 101–108).
- **Scope**:
  - Vercel production domain configuration, SSL, and edge firewall rules.
  - Supabase production cluster provisioning with PITR backups.
  - Render worker auto-scaling cluster with health check daemons.
  - Observability integration (Sentry for error tracking, Axiom for log aggregation).
  - Final production smoke testing and documentation handover.
- **Continuous Testing**: Live production smoke test and automated disaster recovery restoration drill.
- **Definition of Done (DoD)**: Production endpoints live, monitored, and healthy; platform open for GA onboarding.
