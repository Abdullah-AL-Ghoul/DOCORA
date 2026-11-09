# DOCORA — Product Experience Overhaul
## Document 05: User Journeys & Information Architecture

**Project:** DOCORA — AI Document Studio  
**Workspace:** `C:\Users\abdal\Desktop\DOCORA`  
**Phase:** Product Experience Transformation (Overhaul Phase)  
**Date:** November 8, 2026  
**Status:** COMPLETE & VERIFIED  

---

### 1. Information Architecture & URL Routing Map

DOCORA utilizes a clean, localized Next.js App Router hierarchy supporting both `/ar` (Arabic RTL) and `/en` (English LTR):

```
app/
├── [locale]/
│   ├── page.tsx                          # Mode C Public Marketing Showcase & Sandboxed Hero Demo
│   │
│   └── (studio)/                         # Authenticated & Guest Studio Route Group
│       ├── layout.tsx                    # Top Navigation Shell (Breadcrumbs, Theme, Locale, Search)
│       │
│       ├── dashboard/                    # Document Management Workspace
│       │   └── page.tsx                  # Library, Folders, Empty States, Recent Documents
│       │
│       └── studio/                       # The Primary Document Studio View
│           └── page.tsx                  # Tiptap Editor, A4 Canvas, Left Navigator, Right AI Review
│
├── api/                                  # API Route Handlers
│   ├── ai/
│   │   ├── generate/route.ts             # AI Generation, Recovery & Two-Phase Token Ledger
│   │   └── review/route.ts               # 9-Role Multi-Agent Review & 14-Vector Hard Gates
│   │
│   ├── documents/[id]/
│   │   └── export/route.ts               # Word OOXML (docx@9.15.2) & Vector PDF (Puppeteer)
│   │
│   └── files/
│       └── extract-pdf/route.ts          # PDF Text Extraction (pdfjs-dist)
│
├── robots.ts                             # Search Engine Indexing Directives
└── sitemap.ts                            # XML Sitemap Generator
```

---

### 2. End-to-End User Journeys (Workflows 1 through 8)

The application architecture supports 8 core end-to-end user workflows, tested and verified across all viewports:

#### Workflow 1: First-Time Visitor Discovery & Language Switching
- **User Intent:** A visitor lands on DOCORA to understand its value proposition and evaluate document generation capabilities.
- **Path:** Visitor navigates to `/ar`. The application sets `dir="rtl"` on `<html>`. The hero thesis explains the document engineering methodology.
- **Language Switch:** The visitor clicks the global language button (`English (LTR)`). The URL seamlessly routes to `/en`, flipping layout direction to `dir="ltr"` while preserving the active preview scenario.

#### Workflow 2: Interactive Sandboxed Walkthrough Experience
- **User Intent:** The visitor wants to inspect the document lifecycle without signing up or incurring LLM token costs.
- **Path:** On the landing page, the visitor interacts with the **Sandboxed Hero Demo**.
- **Execution:** The visitor toggles through 4 pre-computed lifecycle stages:
  1. *Outline Intent:* View generated structural sections.
  2. *A4 Canvas:* Inspect rendered typography, margins, and tables.
  3. *Review Diff:* View inline redline deletions and green additions.
  4. *Export Preview:* Download a pre-generated sample Word OOXML or Vector PDF file.

#### Workflow 3: Document Library & Management (Dashboard)
- **User Intent:** The user wants to manage documents, search existing contracts, or initiate new drafts.
- **Path:** User navigates to `/[locale]/dashboard`.
- **States Handled:**
  - *Active Documents:* Displays document cards with word counts, last updated timestamps, and quality gate badges.
  - *Filtering:* Filter by document category (Contracts, Reports, Policies, Briefs).
  - *Search:* Live filtering by title; typing a non-existent title instantly transitions to the **Zero Search Results Empty State** with a clear-filter CTA button.
  - *Trash Lifecycle:* Switching to the Trash tab displays deleted items with soft-delete notices and one-click restoration. If trash is empty, renders the **Empty Trash State**.

#### Workflow 4: Bilingual Document Creation & Drafting (Studio)
- **User Intent:** The author creates a document from scratch, selects a preset (e.g. Executive Contract or Board Report), or continues an interrupted draft.
- **Path:** User navigates to `/[locale]/studio?doc=exec-contract-ar`.
- **Capabilities:**
  - Left navigation outlines Headings H1-H3 with click-to-scroll jumping.
  - Grouped toolbar provides instant access to Bold, Italic, Tables, Text Colors, and Highlight colors.
  - BiDi paragraph overrides allow explicit setting of paragraph direction (LTR, RTL, or Auto) for mixed-language citations.
  - Autosave status indicator visibly confirms changes are synchronized.

#### Workflow 5: AI Assistance & 9-Role Multi-Agent Review Triggering
- **User Intent:** The author requests an automated editorial and legal review of the current draft.
- **Path:** Author opens the right **Multi-Agent Review Panel** and clicks `تشغيل مراجعة الوكلاء الـ 9`.
- **Execution:**
  - Dispatches request to `/api/ai/review`.
  - Supervisor activates 9 bounded specialist roles (e.g. Legal Terminologist, BiDi Typography Reviewer, Fact Grounding Auditor).
  - Emits telemetry banner confirming circuit breaker state (`store: false`, zero training data retention).

#### Workflow 6: Quality Gate Inspection & Hard Gate Blockade
- **User Intent:** The author verifies whether the document meets institutional quality standards before export.
- **Path:** Author reviews the 14-Vector Quality radar and overall gate status badge (`READY` vs `BLOCKED`).
- **Hard Gate Simulation:**
  - If a dangling citation or critical error is detected, gate status immediately flips to **BLOCKED**.
  - A high-visibility warning banner details the blocking violation.
  - Both `Export DOCX` and `Export PDF` buttons are instantly disabled (`disabled:pointer-events-none`).
  - Resolving the error restores `READY` status and re-enables export actions.

#### Workflow 7: Non-Destructive Inline Diff Review
- **User Intent:** The author inspects AI-suggested improvements and chooses which ones to apply.
- **Path:** Inside the Review Panel, the author views proposed inline revisions (redline deletions and green additions).
- **Interactive Action:**
  - Author clicks **Accept Proposal:** The revision is applied directly into the Tiptap document model, and the proposal card updates to `تم القبول والتطبيق`.
  - Author clicks **Reject Proposal:** The suggestion is discarded without mutating the document, and the card updates to `تم الرفض`.

#### Workflow 8: Document Export with Guaranteed Fidelity
- **User Intent:** The author exports the completed, verified document to Microsoft Word (`.docx`) and Vector PDF (`.pdf`).
- **Path:** Author clicks `تصدير Word (DOCX)` or `تصدير PDF (Vector)`.
- **Backend Execution:**
  - DOCX: Assembled via `docx@9.15.2` with native Arabic `bidiVisual` table formatting and paragraph direction tags.
  - PDF: Rendered via headless Puppeteer with `@page` print styles, exact A4 margins, and embedded vector fonts.
