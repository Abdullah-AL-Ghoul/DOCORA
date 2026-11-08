# 01 — Updated Technology Stack & Dependency Evaluation
## Project: DOCORA — AI Document Studio
**Phase:** 00.1 — Master Architecture Validation & Blueprint Remediation  
**Status:** Verified Technical Stack Specification  

---

## 1. Verified Dependency Evaluation Matrix

Every framework, library, and infrastructure service has been reassessed against official documentation, licensing terms, and compatibility with the Node.js 24 runtime:

| Technology Layer | Selection | License | Verified Stable Version | Official Documentation URL |
|---|---|---|---|---|
| **Frontend Framework** | Next.js (App Router) | MIT | 15.x (React 19 support) | https://nextjs.org/docs |
| **Core UI Runtime** | React & React DOM | MIT | 19.x | https://react.dev/ |
| **Language & Typings** | TypeScript | Apache 2.0 | 5.6+ / 5.7+ | https://www.typescriptlang.org/docs/ |
| **Styling & Tokens** | Tailwind CSS | MIT | v4.x (PostCSS engine) | https://tailwindcss.com/docs |
| **Headless UI Primitives** | Radix UI (shadcn/ui) | MIT | 1.x Primitives | https://www.radix-ui.com/primitives |
| **Rich-Text Core** | Tiptap Core & Extensions | MIT | v2.x (ProseMirror engine) | https://tiptap.dev/docs |
| **Data & Auth** | Supabase (PostgreSQL 16) | Apache 2.0 / PG | PostgREST / GoTrue v2 | https://supabase.com/docs |
| **Background Queue** | Supabase Queues (`pgmq`) | Apache 2.0 | pgmq v1.x extension | https://supabase.com/docs/guides/queues |
| **Primary AI SDK** | `@google/genai` & Vercel AI SDK | Apache 2.0 | Gen AI SDK v0.1+ / AI SDK 4.x | https://ai.google.dev/gemini-api/docs |
| **Word OOXML Compiler** | `docx` (npm) | MIT | v9.x | https://docx.js.org/ |
| **PDF Rendering** | Puppeteer (Headless Chromium) | Apache 2.0 | v23.x / v24.x | https://pptr.dev/ |
| **Office Conversion** | LibreOffice Headless | LGPL v3 / MPL 2.0 | 24.x (in Docker container) | https://www.libreoffice.org/ |
| **In-Browser PDF Viewer** | Mozilla PDF.js | Apache 2.0 | v4.x | https://mozilla.github.io/pdf.js/ |
| **Schema Validation** | Zod | MIT | v3.23+ | https://zod.dev/ |
| **Testing Harness** | Playwright | Apache 2.0 | v1.48+ | https://playwright.dev/docs/intro |

---

## 2. In-Depth Architectural Evaluation: Tiptap Pagination Strategy

### The Engineering Dilemma
Standard web editors treat documents as a continuous vertical scroll (HTML flow). Microsoft Word treats documents as discrete physical pages (A4 / Letter). Reconciling this in a web browser requires choosing between two fundamental architectures:

```mermaid
graph TD
    subgraph OptionA ["Option A: Open-Source Core + Decoupled Virtual Canvas (RECOMMENDED)"]
        A1[Tiptap v2 Open-Source Core MIT] --> A2[Custom Virtual Paged Canvas Component]
        A2 --> A3[CSS Simulated Page Containers & Margins]
        A3 --> A4[Authoritative Pagination in Export Engines: docx & LibreOffice]
    end

    subgraph OptionB ["Option B: Tiptap Pro Commercial Pages Extension"]
        B1["@tiptap-pro/extension-pages"] --> B2[Private npm Registry Authentication]
        B2 --> B3["$49 to $999 / month Recurring Subscription"]
        B3 --> B4[Requires companion @tiptap-pro/extension-pages-tablekit]
        B4 --> B5[Complex dynamic reflow during live typing]
    end
```

### Detailed Trade-Off Comparison

| Dimension | Option A: Tiptap Open-Source + Virtual Canvas | Option B: Tiptap Pro Pages Extension |
|---|---|---|
| **Licensing & IP** | **100% Permissive Open Source (MIT)**. Zero commercial dependency. | **Proprietary Commercial License**. Requires active Tiptap Cloud subscription. |
| **Subscription Cost** | **$0 / month**. | **$49 / mo (Start), $149 / mo (Team), $999 / mo (Business)**. Adds $588–$11,988/yr overhead. |
| **Registry Access** | Public standard npm registry (`npm install @tiptap/core`). | Requires managing private CI/CD npm tokens (`npm.tiptap.dev`). |
| **Table Pagination** | Handled natively by Word OOXML and LibreOffice during export. | Requires additional proprietary `@tiptap-pro/extension-pages-tablekit`; complex edge cases on large multi-row tables. |
| **Typing Latency (INP)** | **Ultra-Low (<20ms)**. Virtual canvas uses CSS layout boundaries; no expensive JS reflow calculations on keystrokes. | Higher keystroke overhead as continuous re-pagination calculations run during typing. |
| **Export Fidelity** | **High**. Document layout is compiled by actual office engines (`docx` + LibreOffice). | High in browser, but still requires server-side rendering for PDF/DOCX downloads. |

### Architectural Decision: Adopt Option A for MVP
**Rationale**:  
1. Tiptap Pro Pages locks the project into a private commercial registry and ongoing recurring subscription fees ($588 to $11,988/year) before revenue validation.
2. Keystroke latency is the #1 predictor of user satisfaction in document editors. Continuous JavaScript-based DOM re-pagination during active typing frequently degrades INP (Interaction to Next Paint) past 100ms on documents >20 pages.
3. In **Option A**, the web editor renders a tactile Virtual Paged Canvas using CSS sheet containers (`794px × 1123px` for A4), margin guidelines, and dynamic page-break indicators. The physical pagination (header repetition, widow/orphan balancing, footnote accumulation) is authoritatively calculated during export by the dedicated `docx` compiler and headless LibreOffice conversion worker.
4. **Post-MVP Path**: If user feedback demands real-time page-boundary reflow within the browser, Tiptap Pro Pages can be integrated seamlessly in Phase 08 without modifying the underlying Canonical Document Model.

---

## 3. Frontend Architecture & React 19 Compatibility

### 3.1 Next.js 15+ App Router & React 19
- **Server Action Boundaries**: All mutations (saving documents, dispatching AI jobs, toggling favorites) execute via Next.js Server Actions with strict Zod input validation.
- **Client Component Isolation**: Heavy client-side libraries (Tiptap, PDF.js, Framer Motion) are isolated inside `'use client'` components and dynamically loaded with `ssr: false`:
  ```tsx
  // Dynamic import pattern for editor components
  const StudioEditor = dynamic(() => import('@/components/editor/studio-editor'), {
    ssr: false,
    loading: () => <EditorSkeleton />,
  });
  ```
- **React 19 Action Hooks**: Leveraging `useActionState` and `useOptimistic` for instantaneous UI feedback on document renaming and status changes.

### 3.2 Tailwind CSS v4 & CSS Logical Properties
- Tailwind CSS v4 replaces legacy JavaScript config files with a modern CSS-native configuration via `@theme`:
  ```css
  @theme {
    --color-canvas-bg: #090d16;
    --color-surface-panel: #0f172a;
    --color-surface-card: #1e293b;
    --color-accent-indigo: #4f46e5;
    --font-sans: 'Inter', 'Noto Sans Arabic', sans-serif;
    --font-serif: 'Amiri', 'Source Serif 4', serif;
  }
  ```
- **Logical Properties Enforcement**: All spacing and alignment classes use logical utilities (`ms-4`, `me-4`, `ps-6`, `pe-6`, `border-s`, `border-e`, `text-start`, `text-end`), guaranteeing zero layout defects when switching between LTR (English) and RTL (Arabic).

---

## 4. Backend & Asynchronous Worker Runtimes

### 4.1 Supabase PostgreSQL 16 & Queues (`pgmq`)
- **Database Engine**: PostgreSQL 16 managed cluster providing native JSONB operations, GIN full-text indexes, and Row-Level Security.
- **Queue Engine**: Supabase Queues (`pgmq` extension) provisions transactional message queues directly within the database:
  - Enqueue: `SELECT pgmq.send('docora_jobs', jsonb_build_object('job_id', job_uuid));`
  - Dequeue: `SELECT * FROM pgmq.read('docora_jobs', 60, 1);` (60-second visibility timeout).
  - Acknowledgment: `SELECT pgmq.archive('docora_jobs', msg_id);`

### 4.2 Dedicated Docker Worker (Render / Fly.io)
- **Base Image**: `node:24-bookworm-slim`
- **Installed Linux Packages**:
  - `libreoffice-writer-nogpu` (Headless document converter)
  - `fonts-noto-core`, `fonts-noto-cjk`, `fonts-sil-amiri` (Universal typography & Arabic shaping)
  - `fonts-liberation` (Metric-compatible fallbacks for Arial/Times)
  - `chromium` & `libatk1.0-0` (Puppeteer runtime libraries)
- **Container Memory Ceiling**: 2048 MB RAM, capped at 1500 MB per worker process to prevent OOM panics.
