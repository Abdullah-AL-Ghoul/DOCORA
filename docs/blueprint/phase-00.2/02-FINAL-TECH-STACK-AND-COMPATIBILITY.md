# DOCORA — Final Technology Stack & Compatibility Matrix (Phase 00.2 Remediation v1.2.2)

**Document Reference:** `DOCORA-02-TECH-v1.2.2`  
**Status:** CONSOLIDATED ARCHITECTURE BASELINE (POST-REVIEW REMEDIATED)  
**Audit Predecessors:** Phase 00 (`03-TECH-STACK-EVALUATION.md`), Phase 00.1 (`01-UPDATED-TECH-STACK.md`), Phase 00.2 Baseline  

---

## 1. Architectural Technology Selection Philosophy

The DOCORA technology stack is engineered around four strict criteria:
1. **Zero Proprietary Traps:** Critical document creation, editing, and pagination features must not rely on proprietary, closed-source commercial licenses that lock core business capabilities behind unpredictable paywalls (e.g., Tiptap Pro Pages).
2. **First-Class Arabic & International Typography:** The stack must natively support complex script shaping, OpenType ligatures, right-to-left layout trees, and bidirectional Unicode algorithms.
3. **Multi-Model Provider Portability:** AI integration must operate through capability adapters rather than tying the application directly to a single vendor's closed runtime.
4. **Verified Runtime Compatibility & Active Support:** Every selected version must be checked against current official release channels, security advisories, host environments (Windows 11 / Linux containers), and node package compatibility constraints.

---

## 2. Master Compatibility Matrix (Remediated Baseline)

| Category | Component / Library | Selected Version | License | Status | Known Constraints & Official Source Grounding |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Framework** | Next.js (App Router) | `16.4.5` (`^16.4.5`) | MIT | Stable | Active LTS release line. Turbopack default; request interception via `proxy.ts` (Node.js runtime). Next.js 15 is in Maintenance LTS through Jan 31, 2027. |
| **UI Runtime** | React & React DOM | `19.2.0` (`^19.2.0`) | MIT | Stable | Official peer dependency for Next.js 16.4.x. Native View Transitions, `useEffectEvent`, React Compiler memoization. |
| **Language** | TypeScript | `^5.8.x` | Apache-2.0 | Stable | Strict type checking (`strict: true`, `noImplicitAny: true`). Supported by Next.js 16 (requires TS 5.1+). |
| **Rich-Text Engine**| Tiptap Core & Extensions| `^3.0.0` (All Packages Synchronized) | MIT | Stable | Tiptap 3.0 GA. Headless server manipulation; `@tiptap/react` requires `immediatelyRender: false` on `useEditor` to prevent SSR hydration mismatches. |
| **Pagination Engine**| Custom Virtual Canvas | In-house | Proprietary | Proposed | DOM-based height calculation + CSS Paged Media. Not tested at runtime. |
| **State Management**| Zustand + TanStack Query| `^5.0.x` / `^5.66.x`| MIT | Stable | Minimal re-renders; client-side optimistic UI state. |
| **Validation** | Zod | `^3.24.x` | MIT | Stable | End-to-end schema validation (API, DB, CDM). |
| **Styling & UI** | Tailwind CSS + Radix UI | `^4.0.x` / `^1.1.x` | MIT | Stable | Utility styling with headless accessible primitives. |
| **Icons & Motion** | Lucide React + Framer Motion | `^0.475.x` / `^12.4.x`| ISC / MIT| Stable | Clean iconography; GPU-accelerated canvas transitions. |
| **DOCX Generation**| `docx` (npm) | `9.1.x` (`^9.1.x`)| MIT | Stable | Direct OOXML generation with explicit `<w:rtl/>` runs. Evaluated against ECMA-376. Word calculates own pagination. |
| **DOCX Parsing** | `mammoth` + `adm-zip` | `^1.9.x` / `^0.5.x` | BSD-2 / MIT| Stable | Content extraction; raw OOXML part inspection. |
| **Headless Render** | Chromium / Puppeteer-core| `^24.2.x` | Apache-2.0 | Stable | High-fidelity canvas rasterization and PDF generation. |
| **Office Conversion**| LibreOffice Headless | `^24.8.x` (Linux) | MPL-2.0 | Stable | DOCX-to-PDF secondary conversion in container worker. |
| **PDF Inspection** | PDF.js (`pdfjs-dist`)| `^4.10.x` | Apache-2.0 | Stable | Client & server PDF text, bookmark, and image extraction. |
| **OCR Engine** | Tesseract OCR (CLI) | `5.5.4` (Linux) | Apache-2.0 | Stable | Patches GHSA-vf7v-2h4f-6f4j (Moderate severity memory flaw in `AppendLinePolygon` on upright Arabic/Hebrew RTL pages) + 17 advisories. |
| **Database & Auth** | Supabase (PostgreSQL 15+) | Cloud / Self-Host | Apache-2.0 | Stable | Row-Level Security, GoTrue Auth, Realtime listeners. |
| **Queue Engine** | Supabase PGMQ (`pgmq`) | Extension | Apache-2.0 | Stable | PostgreSQL-native durable message queues. At-least-once delivery. |
| **Object Storage** | Supabase Storage (S3-API) | Cloud / S3 | Apache-2.0 | Stable | Tenant-isolated document assets with signed URLs. |
| **AI Orchestration**| Vercel AI SDK Core | `^4.1.x` | Apache-2.0 | Stable | Streaming, structured output, and provider-agnostic tool loops. |
| **Google AI SDK** | `@google/genai` | `^2.29.x` | Apache-2.0 | Stable | Modern interactions API, Gemini 4 Argon, 3.8 Flash, 3.5 Lite. |
| **E2E Testing** | Playwright Test | `^1.50.x` | Apache-2.0 | Stable | Multi-browser headless automation, visual regression testing. |

---

## 3. Technology Evolution & Factual Grounding

### 3.1 Next.js 16 Selection vs. Next.js 15 Support Status
- **Official Support Policy Reality (`https://nextjs.org/support-policy`):**
  - Next.js 16.x is **Active LTS**.
  - Next.js 15.x is in **Maintenance LTS** with security patches extended through **January 31, 2027**.
  - Next.js 15 is NOT End-of-Life.
- **Architectural Selection Rationale for Next.js 16.4.5:**
  - Target: **Next.js 16.4.5** (latest stable release on npm as of November 2026; `16.5.0-canary` is excluded as non-production pre-release).
  - Selected because it is the **Active LTS release**, incorporating stable Turbopack as the default compiler (2-5x build speedup), declarative `use cache` primitives, React 19.2 peer compatibility, and the `proxy.ts` request interception architecture.
  - Runtime Note: Next.js 16 `proxy.ts` executes on the **Node.js runtime**; the Edge runtime is not supported for this convention.

### 3.2 Tiptap 3.x Architecture, SSR & Hydration Demarcation
- **Release Status:** Tiptap 3.0 GA was released in July 2025.
- **Package Version Synchronization:** All Tiptap packages (`@tiptap/core`, `@tiptap/react`, `@tiptap/pm`, `@tiptap/starter-kit`, and extensions) are strictly synchronized on `^3.0.0` to avoid version skew.
- **SSR & Hydration Demarcation:**
  - *Server-Side Manipulation:* Tiptap 3 supports headless instance creation without DOM elements for server-side transformations and static rendering via `@tiptap/static-renderer`.
  - *Client-Side React Hydration:* When mounting the interactive editor in React with `EditorContent`, server rendering can trigger hydration mismatches.
  - *Mandatory Configuration:* In adherence to official Tiptap React documentation (`https://tiptap.dev/docs/editor/getting-started/install/react`), the client-side `useEditor` hook must configure:
    ```typescript
    const editor = useEditor({
      immediatelyRender: false, // Prevents SSR React hydration mismatch in Next.js
      extensions: [StarterKit, /* ... */],
    });
    ```
  - Do not claim that Tiptap 3 alone "eliminates" hydration mismatches; proper client-side configuration and runtime validation are required.

### 3.3 Tesseract 5.5.4 & Security Advisory Grounding
- **Official Security Advisory (`GHSA-vf7v-2h4f-6f4j`):**
  - Affected Versions: `>= 5.4.0, <= 5.5.3`.
  - Patched in: `5.5.4`.
  - Advisory Severity: **Moderate** (CVSS-based GitHub Security Advisory rating).
- **Scope of Fixes:** Tesseract 5.5.4 resolves **17 security advisories in total**, notably patching:
  - Memory handling flaw in `src/api/pagerenderer.cpp` (`AppendLinePolygon`), preventing use-after-free conditions on upright Arabic and Hebrew right-to-left layouts.
  - Out-of-bounds reads in `UNICHAR::UTF8ToUTF32`.
  - Quadratic paragraph restart scans, optimizing multi-column Arabic processing speed.
- **Mandate:** Tesseract 5.5.4 is mandatory in container worker images to maintain system stability and patch known vulnerabilities when processing Arabic scanned documents.

### 3.4 React 19 Version Precision
- Standardized strictly on **React 19.2.0** and **React DOM 19.2.0** (`^19.2.0`).
- Serves as the verified peer dependency for Next.js 16.4.5, providing stable React Compiler support and View Transitions.

---

## 4. Multi-Engine Document Export Strategy

```
                                +-----------------------------+
                                |  Canonical Document Model   |
                                |         (CDM v1.2)          |
                                +--------------+--------------+
                                               |
                       +-----------------------+-----------------------+
                       |                                               |
                       v                                               v
        +-----------------------------+                 +-----------------------------+
        |     DOCX Builder Engine     |                 |      HTML / Canvas AST      |
        |      (`docx` npm 9.1.x)     |                 |         Serializer          |
        +--------------+--------------+                 +--------------+--------------+
                       |                                               |
                       v                                               v
        +-----------------------------+                 +-----------------------------+
        |   Word OpenXML Document     |                 |     Puppeteer / Chromium    |
        |         (.docx)             |                 |       Headless Engine       |
        +--------------+--------------+                 +--------------+--------------+
                       |                                               |
                       | (Optional Secondary)                          | (Primary High-Fidelity)
                       v                                               v
        +-----------------------------+                 +-----------------------------+
        |  LibreOffice Headless 24.x  |                 |      Print-Ready PDF        |
        |      (Container Worker)     |                 |          (.pdf)             |
        +--------------+--------------+                 +-----------------------------+
                       |
                       v
        +-----------------------------+
        |     LibreOffice Fallback    |
        |             PDF             |
        +-----------------------------+
```

---

## 5. Host Runtime & Container Environment

### Development Environment (Host)
- **Operating System:** Windows 11 Enterprise (x64)
- **Shell:** PowerShell 7+ ($OutputEncoding = UTF-8)
- **Node.js:** v24.22.1 LTS
- **Package Manager:** `npm` v11.19.1
- **Python:** Python 3.14
- **Git:** Git 2.56.0

### Production Container Environment (Docker / Render / GCP)
- **Base Image:** `node:24-bookworm-slim`
- **Headless Dependencies:** `chromium`, `libreoffice-core`, `libreoffice-writer`, `tesseract-ocr=5.5.4*`, `tesseract-ocr-ara`, `tesseract-ocr-eng`
- **Typographic Libraries:** `fonts-noto-core`, `fonts-noto-cjk`, `fonts-noto-ui-core`, `fonts-sil-scheherazade`, `fonts-amiri`
- **Font Cache:** Pre-configured `fc-cache -f -v` to ensure zero font-substitution delays during headless rendering.

---
*Verified against official Next.js, Tiptap, React, and Tesseract documentation as of November 6, 2026.*
