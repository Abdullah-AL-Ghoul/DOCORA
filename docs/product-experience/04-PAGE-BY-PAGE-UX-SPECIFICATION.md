# DOCORA — Page-by-Page UX Specifications
## 04. Comprehensive UI/UX Specification for All 15 Platform Routes

**System:** DOCORA — AI Document Studio  
**Design Standard:** Mode C — Institutional Tech-Editorial  
**Target Viewports:** Desktop (1440px), Laptop (1024px), Tablet (768px), Mobile (375px)

---

### Page 01: Landing Page & Live Sandboxed Demo (`/[locale]`)
- **Route:** `src/app/[locale]/page.tsx` $\to$ `src/components/views/LandingShowcaseView.tsx`
- **Purpose:** Public brand identity, value proposition communication, and interactive sandboxed product experience.
- **Key Sections:**
  1. **Sticky Header:** DOCORA logo, navigation links (`/features`, `/how-it-works`, `/faq`), Theme toggle, language switch, Sign-in, Dashboard, and Open Studio buttons.
  2. **Hero Section:** Value proposition headline, live Gemini 3.8 Flash telemetry badge, CTA buttons.
  3. **Sandboxed Hero Demo:** Interactive preview with scenario selector (Arabic Contract vs. English Board Report), lifecycle stages (Outline $\to$ Canvas $\to$ Review $\to$ Export), live A4 simulation.
  4. **Pillars Grid:** 4 architectural pillars (CDM v1.2, 9-role review, hard gates, zero data retention).
  5. **Dual-Surface Showcase:** Explains ADR-001 continuous editor vs. A4 preview.
  6. **Technical FAQ Accordion:** Transparent engineering answers without marketing exaggeration.
  7. **Institutional Footer:** Product, Workspace, Security & Legal links, WCAG 2.2 AA certification.
- **States:** Default (Populated), Interactive Stage Toggles.
- **Accessibility:** Semantic `<header>`, `<main>`, `<section>`, `<footer>`, 44px minimum buttons.

---

### Page 02: Authentication (`/[locale]/sign-in`, `/sign-up`, `/forgot-password`)
- **Routes:** `src/app/[locale]/sign-in/page.tsx`, `sign-up/page.tsx`, `forgot-password/page.tsx` $\to$ `src/components/views/AuthView.tsx`
- **Purpose:** Secure enterprise entry, self-service recovery, and instant friction-free guest sandbox access.
- **Key Components:**
  1. **1-Click Guest Sandbox Button:** `data-testid="guest-sandbox-btn"` allowing reviewers to test without an email account.
  2. **Email & Password Inputs:** Accessible labels, password visibility toggle (`Eye`/`EyeOff`), validation alerts.
  3. **Submit Button:** `data-testid="auth-submit-btn"` with loading indicator.
  4. **Mode Switching:** Clean links between Sign In, Sign Up, and Forgot Password.
- **States:** Default, In-flight Loading, Success Message, Validation Error Alert.

---

### Page 03: Executive Dashboard (`/[locale]/dashboard`)
- **Route:** `src/app/[locale]/(studio)/dashboard/page.tsx` $\to$ `src/components/views/DashboardWorkspaceView.tsx`
- **Purpose:** Central document management, recent document access, and system telemetry overview.
- **Key Components:**
  1. **Workspace Shell:** Top application bar with breadcrumbs, search, and profile actions.
  2. **Summary Metric Cards:** Total Active Documents, Ready for Export count, Tokens balance.
  3. **Three Proportional Empty States:**
     - *First-Use State:* Welcomes new users with quick-start action buttons.
     - *Empty Trash State:* Informs users of 30-day retention policy.
     - *No Search Results State:* Clear feedback with an "إعادة ضبط البحث" (Clear Search) button.
  4. **Document Cards Grid:** Displays title, word count, date, and gate status badge with quick actions.
- **States:** Active Documents, First-Use Empty State, Trash Empty State, No-Search-Results Empty State.

---

### Page 04: Document Library (`/[locale]/documents`)
- **Route:** `src/app/[locale]/(studio)/documents/page.tsx` $\to$ `src/components/views/DocumentLibraryView.tsx`
- **Purpose:** Comprehensive document archive, category filtering, and soft-delete recovery.
- **Key Components:**
  1. **Heading & Action Bar:** `data-testid="document-library-heading"`, "إنشاء مستند جديد" button.
  2. **Category Filter Tabs:** All, Contracts, Reports, Policies, Briefs, Trash (`data-testid="filter-btn-{id}"`).
  3. **Search Input:** Real-time client search with debounced filtering.
  4. **Document Cards:** Word count, gate status, soft delete ("نقل إلى سلة المحذوفات"), restore actions.
- **States:** Populated Grid, Filtered Subset, Empty Trash, No Search Matches.

---

### Page 05: Document Creation Wizard (`/[locale]/documents/new`)
- **Route:** `src/app/[locale]/(studio)/documents/new/page.tsx` $\to$ `src/components/views/DocumentCreationWizardView.tsx`
- **Purpose:** Multi-modal onboarding allowing users to choose the optimal starting path.
- **Four Distinct Modes:**
  1. **Mode A — Blank Canvas:** Direct entry into an empty A4 structured studio.
  2. **Mode B — AI Prompt & Outline Preview:** `data-testid="intent-prompt-textarea"`, document type selector, editorial tone selector, and outline preview before studio generation.
  3. **Mode C — Institutional Templates:** Pre-configured legal contracts, board memos, and governance policies.
  4. **Mode D — Digital PDF Import:** Drag-and-drop digital PDF extraction with clear scanned PDF boundaries.
- **States:** Mode Selection, Prompt Input, Outline Approved, File Uploading.

---

### Page 06: Document Studio (`/[locale]/documents/[id]` & `/[locale]/studio`)
- **Routes:** `src/app/[locale]/(studio)/documents/[id]/page.tsx`, `studio/page.tsx` $\to$ `src/components/views/DocumentStudioView.tsx`
- **Purpose:** Core editor surface combining structured writing, synchronized preview, and agent review.
- **Key Components:**
  1. **Studio Header:** Document title editor, sync status badge, A4/Continuous view toggle, Export buttons.
  2. **Tiptap 3.0 Rich Editor:** Accessible grouped toolbar (Headings, Bold/Italic, Lists, Tables, Citations).
  3. **Outline Navigator:** Live tree view of document sections with click-to-scroll.
  4. **Synchronized A4 Simulation:** Physical page rendering with 25.4mm margins, headers, and footers.
  5. **Multi-Agent Review Panel:** 9 bounded agent roles, 14-vector pulse, inline diff accept/reject, hard gate override toggle.
- **States:** Active Editing, Streaming Continuation Recovery, Hard Gate BLOCKED Alert, Export Disabled.

---

### Page 07: User Settings & Token Ledger (`/[locale]/settings`)
- **Route:** `src/app/[locale]/(studio)/settings/page.tsx` $\to$ `src/components/views/UserSettingsView.tsx`
- **Purpose:** Profile management, bilingual preferences, editor customization, token ledger telemetry, and roadmap transparency.
- **Key Components:**
  1. **Executive Telemetry Overview Bar:**
     - `data-testid="token-balance-display"`: Two-phase token ledger balance.
     - `data-testid="active-sessions-section"`: Supabase Auth RLS active session status.
     - `data-testid="phase03-roadmap-notice"`: Honest badges for Style DNA and Skills Registry.
  2. **Settings Tabs:** Profile, Preferences & Language, Editor Customization, Security, Usage, Roadmap.
  3. **Accessible Form Controls:** Explicit `<label htmlFor="...">` and `aria-label` attributes on all inputs.
- **States:** Default (Profile), Preferences, Security Sessions, Quota Telemetry, Roadmap.

---

### Pages 08–12: Public Marketing & Informational Views
- **Features Showcase (`/[locale]/features`):** Deep architectural explanation of CDM v1.2, hard gates, and bidiVisual tables.
- **How It Works (`/[locale]/how-it-works`):** 5-stage visual lifecycle storytelling from intent to verified export.
- **Technical FAQ (`/[locale]/faq`):** 5 high-impact questions regarding pagination boundaries, Arabic tables, and zero data retention.
- **Privacy Policy (`/[locale]/privacy`):** Legal commitments: `store: false` isolation, AES-256/TLS 1.3 encryption, PDPL/GDPR compliance.
- **Terms of Service (`/[locale]/terms`):** Service boundaries, acceptable use policy, and Two-Phase Token Ledger guarantees.
