# DOCORA — UX Architecture & MVP Scope Matrix (Phase 00.2)

**Document Reference:** `DOCORA-16-SCOPE-v1.2`  
**Status:** CONSOLIDATED ARCHITECTURE BASELINE  
**Audit Predecessors:** Phase 00 (`02-FEATURE-PRIORITIZATION.md`), Phase 00.1 (`02-UPDATED-MVP-SCOPE.md`)  

---

## 1. Architectural Philosophy: Scoped Ambition & Honest Delivery

A primary failure mode of AI greenfield projects is attempting to build an unbounded super-app in Phase 01. DOCORA balances ambitious foundational architecture with an **achievable, high-craft Minimum Viable Product (MVP / P0)**.

Every capability is assigned to an explicit phase. Architectural hooks are provided in the data models and router so that later capabilities (P1/P2) integrate seamlessly without requiring structural refactors.

---

## 2. Master Scope Prioritization Matrix

| Functional Capability | Priority Tier | Delivery Mechanism | Architectural Provision |
| :--- | :---: | :--- | :--- |
| **Prompt-to-Document Creation** | **MVP (P0)** | Gemini 3.8 Flash Streaming | Multi-step outline approval flow |
| **Virtual Paged Canvas Editor** | **MVP (P0)** | Tiptap v2 + CSS Paged Media | Widow/orphan & margin pagination rules |
| **Bilingual Arabic/English Editing**| **MVP (P0)** | BiDi Isolates + HarfBuzz | Full RTL/LTR keyboard & cursor support |
| **High-Fidelity PDF Export** | **MVP (P0)** | Puppeteer Headless Engine | 100% visual match with browser canvas |
| **Clean OOXML DOCX Export** | **MVP (P0)** | Direct `docx` AST Compilation | ECMA-376 compliant with `<w:rtl/>` flags |
| **Digital PDF Text Extraction** | **MVP (P0)** | PDF.js Server-Side Parser | Extracts text runs and bookmarks |
| **Two-Phase Token Ledger** | **MVP (P0)** | PostgreSQL Stored Procedures | Reservation + Reconciliation model |
| **Supabase RLS Tenant Isolation** | **MVP (P0)** | PostgreSQL Policies | 100% tables isolated by user/tenant key |
| **Basic Style DNA Profiles** | **P1** | Declarative JSON Profiles | Extracted from user sample docs |
| **Tesseract Scanned PDF OCR** | **P1** | Containerized Tesseract 5.4 | Background PGMQ queue pipeline |
| **Multi-Agent Quality Review** | **P1** | 9-Role Bounded Supervisor | Max 2 iterations, 14-vector scoring |
| **Skills Registry & Extension** | **P2** | Declarative Skill Manifests | Verified recipe ingestion |
| **Interactive OCR Bounding Box QA**| **P2** | Side-by-Side Canvas Diff | Human-in-the-loop low-confidence fix |
| **Realtime Multi-User Collab** | **Deferred** | Y.js / Supabase Realtime | Schema supports CRDT integration |
| **Full Local Desktop App** | **Deferred** | Tauri / Electron Wrapper | Deferred to post-web product maturity |
| **Arbitrary Code Execution Sandbox**| **Out of Scope**| Prohibited | Strictly rejected for security |

---

## 3. Bilingual User Experience Architecture (Arabic & English)

```
+----------------------------------------------------------------------------------------------------+
|                                BILINGUAL STUDIO UX ARCHITECTURE                                     |
+----------------------------------------------------------------------------------------------------+
| 1. Directional UI Shell: Seamless RTL / LTR interface flipping. The entire studio adapts           |
|    navigation, sidebars, buttons, and icons to the active UI language.                             |
|                                                                                                    |
| 2. Per-Block Directional Isolation: Paragraphs and headings dynamically inherit direction         |
|    (`dir="rtl"` or `dir="ltr"`). Users can toggle individual block direction via shortcuts.       |
|                                                                                                    |
| 3. Smart BiDi Navigation: Arrow-key cursor movement follows visual direction across English        |
|    words embedded inside Arabic sentences, eliminating the dreaded "jumping cursor" bug.          |
|                                                                                                    |
| 4. Native Typography Hierarchy: Clean pairings of Noto Sans Arabic (UI) and Amiri (Body Text),     |
|    paired with Inter and Times New Roman for English, with optical weight balancing.               |
+----------------------------------------------------------------------------------------------------+
```

---

## 4. User-Facing Explanations vs. Internal Complexity

Users should experience intelligent assistance without being overwhelmed by technical agent jargon:
- **What the User Sees:**  
  - *"Analyzing document requirements..."*  
  - *"Drafting Section 2: Methodology (Amiri, 1.5 spacing)..."*  
  - *"Cross-referencing 4 citations with uploaded sources..."*  
  - *"Quality Check Complete: 94/100 (Ready for Export)"*
- **What Remains Under the Hood:**  
  - Specific model strings (`gemini-3.8-flash` vs `gemini-4-argon`)
  - Internal PGMQ queue message IDs
  - Zod schema validation errors
  - Multi-agent token accounting ledger mechanics

---

## 5. Remediation on Legal Templates & Disclaimers

### The Vulnerability in Phase 00
Phase 00 originally promised *"Saudi / UAE Labor Law Compliant Templates"*. This posed severe commercial and legal liability, as an unreviewed AI draft cannot guarantee statutory compliance.

### The Phase 00.2 Mandatory Legal Notice
All contract or employment templates generated by DOCORA automatically embed a non-removable studio notification and document header:

> **[LEGAL DISCLAIMER]**  
> *Employment Agreement Draft — Requires Jurisdiction-Specific Legal Review.*  
> *This document was synthesized by DOCORA AI Document Studio as an organizational draft. It does not constitute formal legal counsel. Prior to execution, this document must be reviewed by qualified legal counsel licensed in the governing jurisdiction (e.g., Kingdom of Saudi Arabia / United Arab Emirates).*

---
*Verified against Phase 00.1 remediation directives. Approved as baseline UX architecture and MVP scope matrix for Phase 00.2 consolidation.*
