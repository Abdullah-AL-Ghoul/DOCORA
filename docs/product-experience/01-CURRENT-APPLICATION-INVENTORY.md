# DOCORA — Application Architecture & Component Inventory
## 01. Complete Application Inventory & Route Topology

**System:** DOCORA — AI Document Studio  
**Runtime:** Node.js 24.x (Windows 11 Host)  
**Framework:** Next.js 16.4.5 (App Router, Webpack Compiler)  
**Language:** TypeScript 5.8 (Strict Mode Enabled)

---

### 1. Route Topology & Page Matrix (15 Distinct Routes)

| Route Path | Type | Render Strategy | Key Component | Purpose & Features |
| :--- | :--- | :--- | :--- | :--- |
| `/[locale]` | Public Marketing | Static (SSG) | `LandingShowcaseView.tsx` | Hero, live sandboxed hero demo, visual lifecycle stages, dual-surface explanation, FAQ accordion, institutional footer. |
| `/[locale]/features` | Public Marketing | Static (SSG) | `FeaturesShowcaseView.tsx` | Deep architectural dive into CDM v1.2, 9-role review system, 14-vector quality pulse, deterministic hard gates. |
| `/[locale]/how-it-works` | Public Marketing | Static (SSG) | `HowItWorksView.tsx` | 5-stage document lifecycle visual walkthrough: Intent $\to$ Structure $\to$ Drafting $\to$ Hard Gates $\to$ Export. |
| `/[locale]/faq` | Public Marketing | Static (SSG) | `FaqView.tsx` | Interactive technical and institutional accordion addressing pagination, bidi tables, zero data retention, and tokens. |
| `/[locale]/privacy` | Public Legal | Static (SSG) | `LegalView.tsx` (`type="privacy"`) | Zero Data Retention guarantee, `store: false` telemetry, AES-256/TLS 1.3 encryption, PDPL & GDPR compliance. |
| `/[locale]/terms` | Public Legal | Static (SSG) | `LegalView.tsx` (`type="terms"`) | Service scope, acceptable use boundaries, Two-Phase Token Ledger contractual commitments, 99.9% uptime SLA. |
| `/[locale]/sign-in` | Public Auth | Static (SSG) | `AuthView.tsx` (`mode="sign-in"`) | Supabase Auth login, password toggle, 1-Click Guest Sandbox session for instant friction-free evaluation. |
| `/[locale]/sign-up` | Public Auth | Static (SSG) | `AuthView.tsx` (`mode="sign-up"`) | Enterprise account registration, institutional domain verification, password security meters. |
| `/[locale]/forgot-password`| Public Auth | Static (SSG) | `AuthView.tsx` (`mode="forgot-password"`) | Self-service email password recovery flow with status banners. |
| `/[locale]/dashboard` | Authenticated Workspace| Static (SSG) | `DashboardWorkspaceView.tsx` | Document workspace overview, metrics cards, quick actions, 3 distinct empty states (first-use, trash, search). |
| `/[locale]/documents` | Authenticated Workspace| Static (SSG) | `DocumentLibraryView.tsx` | Category filters (Contracts, Reports, Policies, Briefs, Trash), search bar, word counts, gate badges, soft delete. |
| `/[locale]/documents/new` | Authenticated Workspace| Static (SSG) | `DocumentCreationWizardView.tsx`| 4 creation paths: Blank A4 Canvas, AI Intent Prompt with Outline preview, Institutional Templates, Digital PDF import. |
| `/[locale]/documents/[id]`| Authenticated Studio | Dynamic (SSR) | `DocumentStudioView.tsx` | Primary RESTful document studio with initial document ID loading, multi-agent review, and A4 print simulation. |
| `/[locale]/studio` | Authenticated Studio | Dynamic (SSR) | `DocumentStudioView.tsx` | Secondary studio alias supporting query parameter document selection (`?doc=exec-contract-ar`). |
| `/[locale]/settings` | Authenticated Workspace| Static (SSG) | `UserSettingsView.tsx` | Profile, bilingual default direction, editor mode, Two-Phase Token Ledger telemetry, honest Phase 03 roadmap badges. |

---

### 2. Backend Route Handlers (`/src/app/api/`)

1. **`/api/ai/generate`**:
   - Method: `POST`
   - Purpose: Stateless document drafting using Gemini 3.8 Flash via Circuit Breaker with `store: false` parameter.
   - Verification: Idempotent continuation support (`idempotency_key`), token reservation ledger telemetry.
2. **`/api/ai/review`**:
   - Method: `POST`
   - Purpose: Executes the bounded 9-role multi-agent review and 14-vector scoring engine.
   - Verification: Produces structured inline diff proposals with deterministic line-level coordinates.
3. **`/api/documents/[id]/export`**:
   - Method: `POST`
   - Purpose: Compiles CDM v1.2 AST into native Word (`.docx`) via `docx@9.15.2` and PDF.
   - Verification: Respects Hard Gates — returns `403 Forbidden` if citations or compliance vectors are `BLOCKED`.
4. **`/api/files/extract-pdf`**:
   - Method: `POST`
   - Purpose: Digital PDF extraction preserving heading trees and table boundaries.
   - Verification: Rejects scanned image PDFs gracefully with an honest notice directing users to Phase 03 OCR.

---

### 3. Component Hierarchy & Design Token Structure

```
src/
├── app/                      # Next.js 16 App Router pages and API handlers
├── components/
│   ├── composites/
│   │   ├── MultiAgentReviewPanel.tsx  # 9-role review, 14-vector pulse, inline diff accept/reject
│   │   └── WorkspaceShell.tsx         # Responsive top navigation, search, locale/theme switch, mobile drawer
│   ├── primitives/
│   │   └── index.tsx                  # Button, Badge, ModalDialog, SegmentedControl, ThemeToggle (WCAG 2.2 AA)
│   └── views/
│       ├── AuthView.tsx               # Sign-in, sign-up, forgot-password, guest sandbox
│       ├── DashboardWorkspaceView.tsx # Executive dashboard with 3 empty states
│       ├── DocumentCreationWizardView.tsx # 4-path creation wizard with outline generator
│       ├── DocumentLibraryView.tsx    # Document repository with category filtering
│       ├── DocumentStudioView.tsx     # Synchronized Tiptap 3.0 editor + A4 print simulation
│       ├── FaqView.tsx                # Technical FAQ accordion
│       ├── FeaturesShowcaseView.tsx   # Architectural features showcase
│       ├── HowItWorksView.tsx         # 5-stage visual document lifecycle
│       ├── LandingShowcaseView.tsx    # High-converting public marketing landing page
│       ├── LegalView.tsx              # Institutional privacy policy and terms of service
│       └── UserSettingsView.tsx       # Account preferences, token ledger, roadmap badges
├── lib/
│   ├── cdm/                           # Canonical Document Model v1.2 schema & presets
│   └── security/                      # Two-Phase Token Ledger & Circuit Breaker telemetry
└── styles/
    └── globals.css                    # Tailwind CSS v4 design tokens, print CSS, typography
```
