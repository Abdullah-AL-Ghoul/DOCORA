# 17 — Open Questions & Decision Catalog
## Project Codename: AI Document Studio
**Phase:** 00 — Discovery & Architecture  
**Status:** Product Owner & Stakeholder Decision Catalog  

---

## 1. Overview & Decision Framework

While the engineering architecture for AI Document Studio is comprehensive and technically validated, several strategic business and product decisions require explicit alignment with the Product Owner before commencing Phase 01 scaffolding.

Every open question is structured with:
- **Context & Dilemma**: The underlying technical or business tension.
- **Options Evaluated**: Viable paths forward.
- **Engineering Recommendation**: The technically defensible default chosen in this blueprint.
- **Phase Impact**: Which upcoming phase is impacted by this decision.

---

## 2. Strategic Decision Catalog

### Question 1: PDF Conversion Infrastructure (Dedicated Worker vs. Web Chromium Only)
- **Context**: Generating a PDF from web CSS Paged Media (Chromium) is fast and cheap, but cannot guarantee 100% typographic layout parity with Microsoft Word. Converting via headless LibreOffice guarantees 100% Word-matching layout, but requires running a dedicated Docker container worker (~$25/month).
- **Options**:
  - *Option A (Recommended)*: **Dual-Track Architecture**. Web print via Chromium for instant previews; asynchronous LibreOffice Docker worker on Render for formal Word-to-PDF downloads.
  - *Option B*: **Chromium Web Print Only**. Drop LibreOffice; generate PDFs purely via Chromium CSS Paged Media. (Saves ~$25/mo, but users will notice slight line-wrap differences between DOCX and PDF).
  - *Option C*: **Third-Party API (e.g., CloudConvert / Adobe PDF Services)**. Outsource conversion to a paid API ($0.015 per conversion).
- **Engineering Recommendation**: **Option A**. The value proposition of a professional document studio depends on uncompromising export fidelity.
- **Impacted Phase**: Phase 03 & Phase 10.

---

### Question 2: AI Provider Model Selection (Gemini-Only vs. User Multi-Model Toggle)
- **Context**: Google Gemini 2.5 provides native 2M context and multimodal PDF vision at an exceptional price point ($0.075 / 1M Flash tokens). However, some power users and enterprise legal teams express strong preferences for Anthropic Claude 3.5 Sonnet or OpenAI GPT-4o for complex legal drafting.
- **Options**:
  - *Option A (Recommended)*: **Gemini 2.5 Primary with Provider-Agnostic Adapter**. System uses Gemini 2.5 for all core workflows; architecture keeps provider behind `IAIGeneratorProvider` to enable hot-swapping or adding Claude/GPT-4o in Phase 08.
  - *Option B*: **User Model Switcher in MVP**. Expose a dropdown in the UI allowing users to select "Gemini 2.5 Pro", "Claude 3.5 Sonnet", or "GPT-4o" for document authoring. (Increases billing complexity and requires maintaining multi-provider prompt branches in Phase 05).
- **Engineering Recommendation**: **Option A**. Focus MVP on optimizing for Gemini 2.5's massive context window and schema-enforced structured outputs; introduce multi-model toggles in Phase 08 as a Pro tier feature.
- **Impacted Phase**: Phase 05 & Phase 08.

---

### Question 3: Real-Time Multi-User Collaborative Editing (CRDT / Yjs)
- **Context**: Building Google Docs-style real-time collaborative editing (multiple carets, live conflict resolution) using CRDTs (Yjs) increases editor complexity by 300% and complicates offline autosave and undo/redo stacks.
- **Options**:
  - *Option A (Recommended)*: **Single-User First, Snapshot History in MVP (v1.0)**. Optimize for single-user authoring speed, local IndexedDB autosave, and immutable version rollbacks. Introduce multi-user live co-editing in v2.0.
  - *Option B*: **Build Yjs Collaboration in Phase 04**. Integrate `@tiptap/extension-collaboration` with a central WebSocket server from day one.
- **Engineering Recommendation**: **Option A**. 85%+ of initial target persona usage (researchers, consultants, administrative officers drafting reports) is asynchronous and single-author. Real-time multiplayer can be layered onto the CDM in post-MVP releases.
- **Impacted Phase**: Phase 04.

---

### Question 4: Free Tier Quotas & Monetization Boundaries
- **Context**: Generative AI token consumption and cloud storage carry real operational costs. Free tier quotas must prevent platform abuse while demonstrating compelling product value.
- **Options**:
  - *Option A (Recommended)*: **Freemium with Token Ceilings**:
    - Free Tier: 3 documents/month, 250,000 tokens/month, 50MB storage, watermark on PDF exports.
    - Pro Tier ($19/month): Unlimited documents, 5,000,000 tokens/month, 5GB storage, no watermarks, full DOCX/PDF parity conversions.
  - *Option B*: **14-Day Free Trial (No Permanent Free Tier)**. Requires credit card upfront.
- **Engineering Recommendation**: **Option A**. Drives viral adoption among university researchers and professionals while strictly capping free tier token loss via rate limits.
- **Impacted Phase**: Phase 02 & Phase 10.

---

### Question 5: Arabic Typographic Font Bundling & Licensing
- **Context**: Operating systems (Windows, macOS, iOS, Android) bundle different default Arabic fonts. For example, Windows ships `Traditional Arabic` and `Tahoma`, while macOS ships `Geeza Pro`.
- **Options**:
  - *Option A (Recommended)*: **Bundle Permissive Open Font License (OFL) Typefaces**:
    - Primary Web & UI: `IBM Plex Sans Arabic` and `Noto Sans Arabic` (SIL OFL 1.1).
    - Document Editorial & Formal: `Amiri` (SIL OFL 1.1 - verified classical Naskh typography).
    - DOCX Font Fallbacks: Declare `Amiri, "Noto Sans Arabic", Tahoma, Arial` in `<w:rFonts>` so recipients without Amiri fall back gracefully.
  - *Option B*: Rely exclusively on system fonts (`Arial`, `Times New Roman`). (Results in inconsistent line metrics and broken styling across macOS and Windows).
- **Engineering Recommendation**: **Option A**. Guarantees stunning, consistent Arabic typography on all platforms without legal licensing risk.
- **Impacted Phase**: Phase 01 & Phase 03.
