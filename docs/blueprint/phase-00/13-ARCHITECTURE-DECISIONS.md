# 13 — Architectural Decision Records (ADRs)
## Project Codename: AI Document Studio
**Phase:** 00 — Discovery & Architecture  
**Status:** Approved Engineering Decisions  
**Total ADRs:** 14 Records  

---

## ADR Index

| ADR ID | Title | Status | Confidence |
|---|---|---|---|
| **ADR-001** | Frontend Framework: Next.js 15+ App Router, React 19 & TypeScript | Approved | High |
| **ADR-002** | Backend & Data Persistence: Supabase (PostgreSQL 16, Auth, Storage) | Approved | High |
| **ADR-003** | Document Editor Core: Tiptap v2 (ProseMirror Engine) | Approved | High |
| **ADR-004** | State Representation: Canonical Document Model (CDM JSON) Single Source of Truth | Approved | High |
| **ADR-005** | AI Provider Strategy: Google Gemini 2.5 via Unified Adapter Layer | Approved | High |
| **ADR-006** | Native Word Synthesis: Pure TypeScript `docx` Library | Approved | High |
| **ADR-007** | PDF Generation Strategy: Dual-Track Chromium Print & LibreOffice Worker | Approved | High |
| **ADR-008** | In-Browser PDF Rendering: Mozilla PDF.js | Approved | High |
| **ADR-009** | Document Intelligence: Adaptive 3-Tier Processing (Text -> OCR -> Multimodal) | Approved | High |
| **ADR-010** | Async Job Architecture: Containerized Worker with PostgreSQL pgmq | Approved | High |
| **ADR-011** | Storage & Asset Access: Multi-Bucket S3 with Ephemeral Signed URLs | Approved | High |
| **ADR-012** | Bilingual & RTL Architecture: CSS Logical Properties & Complex Script Shaping | Approved | High |
| **ADR-013** | UI Styling & Design Tokens: Tailwind CSS v4 & shadcn/ui (Radix Primitives) | Approved | High |
| **ADR-014** | Production Deployment Topology: Vercel Edge + Supabase Cloud + Render Worker | Approved | High |

---

## ADR-001: Frontend Framework Selection
- **Context**: Need a performant, type-safe, accessible web framework to support a high-density document studio shell, real-time streaming, and virtual canvas.
- **Options Considered**: Next.js 15+ (App Router), Vite + React SPA, Remix / React Router v7.
- **Decision**: Adopt **Next.js 15+ with React 19 and TypeScript 5.x**.
- **Pros**: React Server Components reduce client bundle size; Server Actions simplify mutations; streaming SSR enables progressive hydration.
- **Cons**: Client-only components (Tiptap) require explicit dynamic importing with SSR disabled.
- **Consequences**: Strict separation between server-rendered shells and client-rendered interactive canvas nodes.
- **Confidence**: High.

---

## ADR-002: Backend & Persistence Infrastructure
- **Context**: Need relational persistence, ACID guarantees, user authentication, file storage, and strict tenant isolation without managing raw database servers.
- **Options Considered**: Supabase (PostgreSQL 16), Firebase / Firestore, Custom Node/Express + Mongo.
- **Decision**: Adopt **Supabase (PostgreSQL 16, Auth, Storage, Realtime)**.
- **Pros**: Declarative Row-Level Security (RLS) guarantees tenant isolation at the engine level; native JSONB handles CDM AST trees; S3 storage and Realtime WebSockets built in.
- **Cons**: Edge Functions have execution timeouts; heavy conversions require an external worker.
- **Consequences**: Database handles data security; serverless functions act as lightweight orchestrators.
- **Confidence**: High.

---

## ADR-003: Document Editor Core Engine
- **Context**: Need a rich-text editing engine capable of handling structured documents, tables with cell spans, image embedding, bidirectional text, and scoped AI mutations.
- **Options Considered**: Tiptap v2 (ProseMirror), Lexical (Meta), Slate.js, Raw ProseMirror.
- **Decision**: Adopt **Tiptap v2 (built on ProseMirror)**.
- **Pros**: Battle-tested schema constraints; mature table extension; clean JSON AST representation; vast active ecosystem.
- **Cons**: Does not paginate natively like Word; requires a custom Virtual Paged Canvas container.
- **Consequences**: Editor is treated as a presentation surface; the Canonical Document Model remains the single source of truth.
- **Confidence**: High.

---

## ADR-004: Canonical Document Model (CDM) Single Source of Truth
- **Context**: Storing documents as HTML or markdown causes severe layout and fidelity loss when exporting to Word or PDF.
- **Options Considered**: Canonical Document Model (custom JSON schema), Raw HTML, Markdown strings, Direct OOXML.
- **Decision**: Implement a strongly-typed, versioned **Canonical Document Model (CDM JSON)**.
- **Pros**: Decouples editor implementation from AI outputs and export engines; enables precise scoped node mutations and schema validation.
- **Cons**: Requires building and maintaining bidirectional transformers (`CDM <-> Tiptap`, `CDM -> DOCX`, `CDM -> PDF`).
- **Consequences**: Any new document feature must first be defined in the CDM schema before touching the editor or export engines.
- **Confidence**: High.

---

## ADR-005: AI Provider Strategy & Foundation Models
- **Context**: Need an AI provider capable of processing large documents (up to 100 pages), understanding scanned images and PDFs, producing strict JSON outputs, and offering low latency.
- **Options Considered**: Google Gemini 2.5 (Pro & Flash), OpenAI (GPT-4o), Anthropic (Claude 3.5 Sonnet).
- **Decision**: Adopt **Google Gemini 2.5 as primary**, abstracted behind an `IAIGeneratorProvider` interface.
- **Pros**: 2M-token context window; native PDF and vision understanding; schema-enforced JSON (`responseSchema`); unmatched pricing per million tokens.
- **Cons**: Need fallback adapter in case of regional outages or specific domain requirements.
- **Consequences**: Business logic is decoupled from provider SDKs; secondary adapters (Claude 3.5 Sonnet) can be hot-swapped.
- **Confidence**: High.

---

## ADR-006: Native Word (`.docx`) Generation Engine
- **Context**: Must generate authentic Microsoft Word `.docx` files that open without repair warnings, supporting headers, footers, page numbering, tables, and Arabic RTL.
- **Options Considered**: `docx` (npm TypeScript library), Pandoc CLI, docx-templates, HTML-to-Word converters.
- **Decision**: Adopt **`docx` (npm TypeScript library)**.
- **Pros**: Pure JS/TS implementation with 0 native OS dependencies; direct programmatic control over OOXML tags including `<w:bidi/>` and `<w:rtl/>`; runs cleanly in serverless or worker environments.
- **Cons**: Verbose AST construction logic; requires thorough schema mapping from CDM.
- **Consequences**: High-fidelity OOXML output compliant with ISO/IEC 29500 standard.
- **Confidence**: High.

---

## ADR-007: Dual-Track PDF Generation Strategy
- **Context**: Exporting HTML to PDF often looks different than exported Word documents. Users expect both high-speed web exports and 100% Word-matching PDFs.
- **Options Considered**: Chromium Only (Puppeteer), LibreOffice Only, Client-side PDF.js Printing, Dual-Track Strategy.
- **Decision**: Implement a **Dual-Track Generation Architecture**:
  1. *Track A (Direct Web PDF)*: Headless Chromium with CSS Paged Media for instant web document downloads.
  2. *Track B (Word-Parity PDF)*: Headless LibreOffice running in a containerized worker for bit-for-bit DOCX-to-PDF conversion.
- **Pros**: Solves both speed requirements for web previews and strict typographic parity for formal Word exports.
- **Cons**: Requires maintaining a Dockerized worker running LibreOffice.
- **Consequences**: Clear separation between lightweight web exports and heavyweight office format conversions.
- **Confidence**: High.

---

## ADR-008: Client-Side PDF Viewing & Citation Inspection
- **Context**: Need to render uploaded reference PDFs inside the editor without locking the browser thread and support visual bounding-box highlights for cited sources.
- **Options Considered**: Mozilla PDF.js, Native browser `<embed>`/`<iframe>`, Commercial PDF SDKs (PDFTron/PSPDFKit).
- **Decision**: Adopt **Mozilla PDF.js**.
- **Pros**: Permissive Apache 2.0 license; full control over the canvas rendering layer and text layer DOM; lightweight and customizable.
- **Cons**: Canvas rendering of complex vector PDFs can be CPU-intensive on low-end hardware.
- **Consequences**: Custom overlay layer allows drawing translucent highlight rectangles over exact citation bounding boxes.
- **Confidence**: High.

---

## ADR-009: Adaptive 3-Tier Document Intelligence Pipeline
- **Context**: Ingesting user files (PDFs, scans, photos) must be cost-effective, fast for digital files, and resilient for blurry scans.
- **Options Considered**: Pass everything to Multimodal LLM, OCR-only pipeline, Adaptive 3-Tier Funnel.
- **Decision**: Implement an **Adaptive 3-Tier Pipeline**:
  - *Tier 1*: Native digital text extraction via PDF.js (0 LLM cost).
  - *Tier 2*: OCR fallback for scanned text bitmaps.
  - *Tier 3*: Gemini 2.5 Multimodal deep vision for complex tables, diagrams, and handwriting.
- **Pros**: Reduces token costs by 70%+ on clean digital PDFs while maintaining 98%+ extraction accuracy on difficult visual documents.
- **Cons**: Requires density classification logic to route files appropriately.
- **Consequences**: Optimal balance between operational cost, extraction speed, and accuracy.
- **Confidence**: High.

---

## ADR-010: Background Job Queue & Asynchronous Worker Architecture
- **Context**: Document conversions, OCR, and multi-chapter generation exceed serverless execution timeouts (15–60s) and require dedicated background compute.
- **Options Considered**: Supabase pgmq (PostgreSQL queue) + Docker Worker, Redis BullMQ + Celery, AWS SQS + Lambda.
- **Decision**: Adopt **PostgreSQL pgmq (or Redis BullMQ) with a dedicated Docker Worker container on Render/Fly.io**.
- **Pros**: Keeps queue state transactional with the database; worker container has pre-installed LibreOffice and fonts; zero serverless execution timeouts.
- **Cons**: Requires deploying and maintaining a containerized background service.
- **Consequences**: Serverless frontend remains fast and responsive; heavy batch tasks are asynchronously scheduled and tracked.
- **Confidence**: High.

---

## ADR-011: Multi-Bucket S3 Storage with Ephemeral Signed URLs
- **Context**: User files, uploaded receipts, and generated legal contracts are confidential and must never be exposed publicly.
- **Options Considered**: Public CDN with unguessable hashes, Private S3 with Signed URLs, Database BLOB storage.
- **Decision**: Implement **Three Private Supabase Storage Buckets (`raw-uploads`, `document-assets`, `generated-exports`) with short-lived HMAC Signed URLs (15–30 min TTL)**.
- **Pros**: Complete data confidentiality; prevents hotlinking and URL scraping; direct-to-S3 uploads bypass serverless payload limits.
- **Cons**: Signed URLs expire; client must request refreshed URLs for long editing sessions.
- **Consequences**: Enterprise-grade data protection meeting strict privacy standards.
- **Confidence**: High.

---

## ADR-012: Bilingual First-Class Architecture & RTL/LTR Logical Properties
- **Context**: Product targets Arabic and English users equally. Arabic text cannot suffer from reversed punctuation, clipped diacritics, or awkward layout mirroring.
- **Options Considered**: Post-MVP Localization Patch, Native First-Class Bilingual Architecture.
- **Decision**: Enforce **First-Class Bilingual Architecture across all four layers**:
  1. *UI Layer*: Tailwind CSS logical properties (`ms-`, `me-`, `ps-`, `pe-`, `border-s-`).
  2. *Editor Layer*: Tiptap paragraph direction attributes (`dir="rtl"`) with baseline-aligned Arabic fonts.
  3. *AST Layer*: CDM text runs and blocks carry explicit direction tags.
  4. *Export Layer*: OOXML `<w:bidi/>` and Paged Media CSS `@page` direction rules.
- **Pros**: Flawless bilingual experience with 0 punctuation inversion in mixed sentences.
- **Cons**: Requires continuous regression testing on mixed bidi strings.
- **Consequences**: AI Document Studio is uniquely positioned as the premier bilingual document intelligence platform.
- **Confidence**: High.

---

## ADR-013: UI Styling & Design System
- **Context**: Need a modern, accessible, high-craft UI component system that avoids generic AI dashboard aesthetics.
- **Options Considered**: Tailwind CSS v4 + shadcn/ui (Radix UI), Material UI (MUI), Chakra UI, Mantine.
- **Decision**: Adopt **Tailwind CSS v4 + shadcn/ui (Radix UI Primitives) + Lucide Icons**.
- **Pros**: Zero runtime CSS-in-JS overhead; full source ownership inside `components/ui/`; native CSS custom properties for dark/light themes; full WAI-ARIA accessibility compliance.
- **Cons**: Requires assembling custom studio toolbars from primitives.
- **Consequences**: Crisp, restrained, professional productivity aesthetic (Linear/Apple grade).
- **Confidence**: High.

---

## ADR-014: Production Deployment Topology
- **Context**: Need a scalable, cost-efficient deployment topology with low maintenance overhead.
- **Options Considered**: Self-hosted Kubernetes on AWS/GCP, Monolithic VPS, Hybrid Serverless + Managed Services.
- **Decision**: Adopt **Hybrid Serverless + Managed Services (Vercel Edge + Supabase Cloud + Render Worker)**.
- **Pros**: Global edge delivery for web app; auto-scaling database with automated backups; isolated container workers for heavy compute; zero DevOps server patching.
- **Cons**: Multi-vendor architecture requires centralized monitoring (e.g., Sentry / Axiom).
- **Consequences**: Exceptional unit economics ($0.49/MAU) with enterprise-grade reliability and low operational drag.
- **Confidence**: High.
