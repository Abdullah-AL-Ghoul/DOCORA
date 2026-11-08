# 14 — Product Owner Decisions Catalog
## Project: DOCORA — AI Document Studio
**Phase:** 00.1 — Master Architecture Validation & Blueprint Remediation  
**Status:** Awaiting Product Owner Formal Sign-Off  

---

## 1. Governance & Sign-Off Framework

This document catalogs all strategic product, commercial, and infrastructure decisions requiring explicit alignment with the **Product Owner / Business Stakeholders** before commencing Phase 01 scaffolding.

Every decision is presented with evaluated options, cost implications, engineering trade-offs, and an actionable default recommendation.

---

## 2. Key Product Owner Decisions

### Decision 01: Document Editor Core & Pagination Strategy
- **Dilemma**: Should DOCORA use open-source Tiptap v2 with a custom virtual paged canvas ($0/mo), or license Tiptap Pro Pages ($588 to $11,988/yr)?
- **Options**:
  - **Option A (Recommended)**: **Open-Source Tiptap v2 Core + Custom Virtual Canvas**.
    - *Cost*: **$0 / month**.
    - *Pros*: Zero commercial vendor lock-in; standard public npm registry; ultra-low keystroke latency (<20ms); authoritative physical pagination computed during DOCX/PDF export.
    - *Cons*: Real-time page boundary reflow during active typing is visual/simulated rather than continuous DOM page splitting.
  - **Option B**: **Tiptap Pro Commercial Pages Extension**.
    - *Cost*: **$49 to $999 / month** ($588 to $11,988/year).
    - *Pros*: Continuous in-browser DOM page slicing during active typing.
    - *Cons*: Requires managing private npm tokens; complex table pagination bugs; adds ongoing SaaS overhead before product revenue.
- **Engineering Recommendation**: **Option A**. Conserves capital for MVP; eliminates third-party licensing dependency.
- **Phase Impact**: Phase 04.
- **Sign-Off Status**: **PENDING PRODUCT OWNER APPROVAL**.

---

### Decision 02: PDF Conversion Engine (LibreOffice Worker vs. Web Print Only)
- **Dilemma**: Should DOCORA deploy a dedicated Docker container running LibreOffice (~$25/mo) for Word-parity PDF conversion, or rely solely on Chromium web printing?
- **Options**:
  - **Option A (Recommended)**: **Dual-Track Architecture**.
    - *Cost*: **$25 / month** (Render Standard Worker).
    - *Pros*: Guarantees that exported PDFs match Word documents with >=95% layout similarity; eliminates line-wrap shifts on tables.
    - *Cons*: Requires maintaining a containerized worker service.
  - **Option B**: **Chromium Web Print Only**.
    - *Cost*: **$0 / month** (Runs on existing compute).
    - *Pros*: Saves $25/mo.
    - *Cons*: Exported PDFs will have minor line-wrap differences compared to exported DOCX files opened in Microsoft Word.
- **Engineering Recommendation**: **Option A**. High-fidelity Word and PDF export is DOCORA's primary market differentiator.
- **Phase Impact**: Phase 03 & Phase 10.
- **Sign-Off Status**: **PENDING PRODUCT OWNER APPROVAL**.

---

### Decision 03: Primary AI Commercial Tier & Privacy Strategy
- **Dilemma**: Which Google Gemini service tier should power DOCORA's production infrastructure?
- **Options**:
  - **Option A (Recommended)**: **Paid Commercial Gemini API (Billed Google Cloud Project)**.
    - *Policy*: **Zero training on customer data**; prompt logs retained for **55 days** strictly for safety and abuse compliance.
    - *Cost*: Standard token rates ($0.075/1M Flash tokens, $1.25/1M Pro tokens).
    - *Pros*: Cost-effective, production-ready, legally compliant under Google Cloud DPA.
  - **Option B**: **Google Cloud Vertex AI (Enterprise Tier)**.
    - *Policy*: Configurable zero data retention with enterprise Business Associate Agreement (BAA).
    - *Cost*: Premium enterprise pricing + enterprise support fees.
    - *Pros*: Meets ultra-strict healthcare / financial regulatory zero-retention mandates.
    - *Cons*: Overkill for initial consumer/commercial MVP.
- **Engineering Recommendation**: **Option A** for MVP; provide Option B as an enterprise add-on in v2.0. (Free tier Gemini API is strictly prohibited due to data training).
- **Phase Impact**: Phase 05 & Phase 06.
- **Sign-Off Status**: **PENDING PRODUCT OWNER APPROVAL**.

---

### Decision 04: Scope Boundaries for MVP (v1.0)
- **Dilemma**: Confirmation of critical scope boundaries to guarantee on-time engineering delivery.
- **Specific Boundaries to Confirm**:
  1. **Template Catalog**: Launch with **10 curated bilingual templates** (Executive Proposal, Employment Contract, NDA, Meeting Minutes, etc.), deferring community templates to P1. *(Recommended: Yes)*.
  2. **Meeting Minutes Ingestion**: Ingests typed text notes, bullet points, or pasted audio transcripts. Direct audio file ingestion (Whisper / Audio API) is deferred to P1. *(Recommended: Yes)*.
  3. **Scanned PDF Limit**: Basic OCR capped at **50 pages per document** for MVP; batch processing on 100+ pages deferred to P1. *(Recommended: Yes)*.
  4. **Word File Direction**: MVP focuses on high-fidelity **Generation -> Edit -> DOCX Export**. Reverse-parsing arbitrary uploaded `.docx` files back into editable web state is deferred to P1. *(Recommended: Yes)*.
  5. **Billing Integration**: Defer live Stripe checkout integration to Phase 08 / P1; MVP enforces hard token quotas and entitlement records directly in the database. *(Recommended: Yes)*.
- **Engineering Recommendation**: **Approve all 5 boundaries**.
- **Phase Impact**: All Phases.
- **Sign-Off Status**: **PENDING PRODUCT OWNER APPROVAL**.

---

### Decision 05: Freemium Token Quotas & Subscription Pricing
- **Dilemma**: Establishing initial user quotas that prevent abuse while demonstrating high utility.
- **Proposed Commercial Tiering**:
  - **Free Tier**: 3 documents / month, 250,000 tokens / month, 50MB storage, watermark on PDF exports.
  - **Pro Tier ($19 / month)**: Unlimited documents, 5,000,000 tokens / month, 5GB storage, no watermarks, full Word-parity PDF conversions.
- **Engineering Recommendation**: **Approve proposed tiering**. Ensures a gross margin of **~75% to 81%** on paying subscribers.
- **Phase Impact**: Phase 02 & Phase 10.
- **Sign-Off Status**: **PENDING PRODUCT OWNER APPROVAL**.
