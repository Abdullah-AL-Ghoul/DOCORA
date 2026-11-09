# DOCORA — Information Architecture & User Journeys
## 03. Product IA, Sitemap & Verification Journeys

**System:** DOCORA — AI Document Studio  
**Target Viewports:** Desktop (1440px), Laptop (1024px), Tablet (768px), Mobile (375px)  
**Supported Locales:** Arabic (`/ar`, RTL), English (`/en`, LTR)

---

### 1. Information Architecture & Navigation Tree

```
Public Marketing & Trust Tier
├── /[locale]               # Homepage & Interactive Sandboxed Demo
├── /[locale]/features      # Deep Technical Architecture & CDM v1.2 Showcase
├── /[locale]/how-it-works  # 5-Stage Visual Document Lifecycle Walkthrough
├── /[locale]/faq           # Technical Questions, Constraints & Privacy Accordion
├── /[locale]/privacy       # Zero Data Retention & Enterprise Encryption Standards
└── /[locale]/terms         # Terms of Service & Token Ledger Commitments

Authentication Tier
├── /[locale]/sign-in       # Supabase Auth Login + 1-Click Guest Sandbox Session
├── /[locale]/sign-up       # Account Provisioning & Enterprise Setup
└── /[locale]/forgot-password # Password Reset & Security Email Dispatch

Authenticated Workspace & Studio Tier (WorkspaceShell)
├── /[locale]/dashboard     # Executive Dashboard & Quick Actions (3 Empty States)
├── /[locale]/documents     # Repository with Category Filtering & Soft-Delete Undo
├── /[locale]/documents/new # 4-Path Creation Wizard (Canvas, Intent, Template, PDF)
├── /[locale]/documents/[id]# Canonical RESTful Document Studio (Tiptap 3.0 + A4)
├── /[locale]/studio        # Studio Alias (?doc=...)
└── /[locale]/settings      # Profile, Bilingual Preferences & Ledger Telemetry
```

---

### 2. End-to-End User Journeys (1 Through 9)

#### Journey 1: Public Discovery to Instant Friction-Free Evaluation
1. User lands on `/[locale]` (Arabic default).
2. Explores the **Sandboxed Hero Demo** switching between Executive Contract and Board Report presets.
3. Observes the live telemetry banner confirming Gemini 3.8 Flash execution with `store: false`.
4. Clicks "Sign In" $\to$ navigated to `/[locale]/sign-in`.
5. Clicks "1-Click Instant Guest Sandbox Exploration" (`data-testid="guest-sandbox-btn"`).
6. Instantly lands on `/[locale]/dashboard` with verified session tokens.

#### Journey 2: New Document Creation via Guided Intent
1. From Dashboard or Workspace Shell, user clicks "إنشاء مستند جديد" (New Document).
2. Navigated to `/[locale]/documents/new`.
3. Selects the "صياغة ذكية بالـ AI" (AI Generation) mode tab.
4. Enters an institutional prompt (e.g., enterprise cloud supply agreement).
5. Selects document type ("عقد أو اتفاقية قانونية") and formal editorial tone.
6. Clicks "معاينة المخطط الهيكلي للمستند" $\to$ reviews the 5-point structural outline.
7. Clicks "تأكيد والبدء في التوليد بالاستوديو" $\to$ lands in `/[locale]/documents/[id]`.

#### Journey 3: Continuous Document Editing with Synchronized A4 Simulation
1. Inside Document Studio, user edits structured headings, paragraphs, and tables.
2. Changes auto-save every 300ms with non-intrusive synchronization feedback.
3. User toggles the A4 Paged Simulation view $\to$ observes real-time simulated page breaks with 25.4mm margins.
4. Switches to Continuous Canvas for focused long-form typing.

#### Journey 4: Multi-Agent Review & Granular Diff Accept/Reject
1. User opens the Intelligence panel on the right sidebar.
2. Views the 9 Bounded Agent Roles (Domain Specialist, Legal Reviewer, Bidi L10n Engineer, etc.).
3. Inspects inline diff suggestions in the document text.
4. Clicks "قبول المقترح" (Accept Proposal) on proposal 1 $\to$ diff merges immediately into editor content.
5. Clicks "رفض المقترح" (Reject Proposal) on proposal 2 $\to$ suggestion is dismissed with honest rationale.

#### Journey 5: Hard Gate Export Protection Enforcement
1. User triggers an intentional citation anomaly (e.g., toggling dangling citation).
2. The Quality Gate status badge transitions from `READY` to `BLOCKED`.
3. An institutional amber alert appears explaining the exact regulatory violation.
4. The "تصدير Word (.docx)" and "تصدير PDF" buttons are immediately disabled.
5. Resolving the citation anomaly restores `READY` status and re-enables export actions.

#### Journey 6: Institutional Document Export (OOXML & PDF)
1. With Quality Gate status at `READY`, user clicks "تصدير Word (.docx)".
2. System calls `/api/documents/[id]/export` compiling the CDM v1.2 tree.
3. The generated OOXML file applies native `bidiVisual` properties, custom styles, and page numbers.
4. File downloads directly to client with verifiable institutional layout fidelity.

#### Journey 7: Digital PDF Extraction with Architectural Integrity Guard
1. User visits `/[locale]/documents/new` and selects "استيراد PDF" (Import PDF).
2. Uploads a text-based digital PDF contract.
3. System extracts structure, headings, and table cells into a clean CDM v1.2 tree.
4. If a scanned/image PDF is provided, system displays an honest educational notice stating that scanned OCR is scheduled for Phase 03.

#### Journey 8: Bidirectional Language & Theme Switching
1. From any view, user toggles the Language Selector (`العربية` $\leftrightarrow$ `English`).
2. Page route updates (`/ar` $\leftrightarrow$ `/en`), `dir` attribute flips (`rtl` $\leftrightarrow$ `ltr`).
3. Layout mirrors completely: sidebars, breadcrumbs, icons, and table alignments invert correctly.
4. User toggles Theme (`Light` $\leftrightarrow$ `Dark`) $\to$ tokens adapt seamlessly across all surfaces.

#### Journey 9: Responsive Mobile & Tablet Operation (375px & 768px)
1. User accesses DOCORA on mobile viewport (375px width).
2. Top navigation collapses into a dedicated mobile drawer with 44px touch targets.
3. The editor adapts to single-column card-based navigation with a bottom sheet for agent reviews.
4. No horizontal overflow or viewport clipping occurs across any route.
