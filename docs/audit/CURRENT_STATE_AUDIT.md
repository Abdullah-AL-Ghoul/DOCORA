# DOCORA — Current State Technical & Architectural Audit
**Date:** 2026-11-09  
**Auditor:** DOCORA Senior Product-Engineering Team  
**Scope:** Repository Source Code, APIs, DAL, Workers, Database Migrations, and Test Suites  
**Repository Branch:** `master` (`C:\Users\abdal\Desktop\DOCORA`)

---

## 1. Executive Summary

This audit establishes the concrete, source-verified baseline of the DOCORA repository. While the application possesses a visually sophisticated, responsive, bilingual (Arabic RTL / English LTR) frontend built with Next.js 16.4.5, React 19.2, Tailwind CSS v4, and Tiptap v3, a deep code inspection reveals that **core architectural layers—authentication, data persistence, AI generation, background workers, and PDF ingestion—are operating in simulation mode via in-memory `Map` data structures, mocked client timeouts, and hardcoded response strings**.

This document validates Findings A through F with exact file paths, line references, architectural impacts, and technical remediation specifications.

---

## 2. Source-Level Verification of Findings A–F

### Finding A: Insecure Authentication & Header-Based Tenant Identity
- **Primary Source Files:**
  - `src/lib/dal/index.ts` (lines 52–58, 375–393)
  - `src/proxy.ts` (lines 15–43)
  - `src/components/views/AuthView.tsx` (lines 39–71)
- **Code Evidence:**
  In `src/lib/dal/index.ts`:
  ```typescript
  // lines 52-58
  const DEFAULT_DEMO_USER: AuthenticatedSession = {
    userId: 'usr-docora-owner-01',
    email: 'architect@docora.studio',
    displayName: 'م. عبد الله (Product Owner)',
    planTier: 'free',
    role: 'authenticated',
  };

  // lines 375-393
  export async function verifyAuthenticatedUser(
    requestHeaders?: Headers
  ): Promise<AuthenticatedSession> {
    const overrideRole = requestHeaders?.get('x-docora-test-role');
    if (overrideRole === 'anon') {
      throw new Error('Unauthorized: No active authenticated user session');
    }
    const overrideUserId = requestHeaders?.get('x-docora-test-user');
    if (overrideUserId) {
      return {
        userId: overrideUserId,
        email: `${overrideUserId}@docora.studio`,
        displayName: overrideUserId,
        planTier: 'free',
        role: 'authenticated',
      };
    }
    return { ...DEFAULT_DEMO_USER };
  }
  ```
  In `src/proxy.ts`:
  ```typescript
  // lines 18-26
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    const response = NextResponse.next();
    applySecurityHeaders(response);
    return response;
  }
  ```
  In `src/components/views/AuthView.tsx`:
  ```typescript
  // lines 40-45
  const handleGuestSession = () => {
    setLoading(true);
    setTimeout(() => {
      router.push(`/${locale}/dashboard`);
    }, 300);
  };
  // lines 59-70
  setTimeout(() => {
    setLoading(false);
    ...
    router.push(`/${locale}/dashboard`);
  }, 400);
  ```
- **Architectural Vulnerability & Impact:**
  1. **Trivial Privilege Escalation / Impersonation:** Any external client or attacker can supply `x-docora-test-user: <target_victim_id>` to impersonate any tenant, bypassing identity checks.
  2. **Unauthenticated Default Identity:** Any request without headers automatically inherits the session of `usr-docora-owner-01` (`architect@docora.studio`), rendering protected routes and server actions publicly accessible without credentials.
  3. **No Session Cookie Verification:** `src/proxy.ts` ignores `/api` routes entirely and conducts no cookie/token validation on web routes, while `AuthView.tsx` merely executes client-side `setTimeout` before redirecting. No session cookies, JWTs, or Supabase Auth tokens are generated or verified.
- **Remediation Specification:**
  - Remove all client header trust (`x-docora-test-user`, `x-docora-test-role`) and `DEFAULT_DEMO_USER` fallbacks in production.
  - Implement `@supabase/ssr` server client in `src/lib/supabase/server.ts` and `src/proxy.ts`.
  - Validate auth cookies via `supabase.auth.getUser()`. Return HTTP 401 for unauthenticated API requests and redirect unauthenticated private web routes to `/${locale}/auth/sign-in`.

---

### Finding B: In-Memory Volatile Persistence & Illusory Document Lifecycle
- **Primary Source Files:**
  - `src/lib/dal/index.ts` (lines 60–69, 335–368)
  - `src/components/views/DocumentStudioView.tsx` (lines 67–75, 115–121)
  - `src/components/views/DashboardWorkspaceView.tsx` (lines 40–60)
  - `src/components/views/DocumentLibraryView.tsx` (lines 35–55)
- **Code Evidence:**
  In `src/lib/dal/index.ts`:
  ```typescript
  // lines 60-66
  class HardenedLedgerStore {
    private entitlements = new Map<string, UserEntitlementRecord>();
    private transactions = new Map<string, TokenLedgerTransaction>();
    private idempotencyIndex = new Map<string, string>();
    private documents = new Map<string, { ownerId: string; doc: CdmDocument }>();
    ...
  ```
  In `src/components/views/DocumentStudioView.tsx`:
  ```typescript
  // lines 67-69
  const [activeDoc, setActiveDoc] = useState<CdmDocument>(
    () => structuredClone(PRESET_DOCUMENTS[defaultKey])
  );

  // lines 115-121
  const handleDocumentChange = (updated: CdmDocument) => {
    setAutosaveStatus('saving');
    setActiveDoc(updated);
    setTimeout(() => {
      setAutosaveStatus('saved');
    }, 180);
  };
  ```
- **Architectural Vulnerability & Impact:**
  1. **Total Data Loss on Page Refresh:** `DocumentStudioView` loads documents directly from `PRESET_DOCUMENTS` in memory. Edits trigger a 180ms timer setting UI state to `'saved'`, but **no network request is dispatched to any persistence store**. Pressing F5 or refreshing permanently resets the document to preset state.
  2. **Process Termination Data Wiping:** Because all server-side records reside in JavaScript `Map` instances in memory, any server restart, deployment, or serverless lambda recycling wipes all user documents, reservations, and ledger records.
  3. **No Dynamic Workspace CRUD:** Dashboard and library views query hardcoded client-side preset arrays rather than a dynamic database query matching the authenticated user.
- **Remediation Specification:**
  - Implement full Supabase database persistence for documents using the existing `0003_documents_and_cdm_versions.sql` schema (`documents` and `document_cdm_versions` tables).
  - Add API endpoints `/api/documents` (GET list, POST create) and `/api/documents/[id]` (GET read, PUT update with optimistic concurrency and debounced autosave, DELETE soft delete).
  - Connect `DocumentStudioView` to auto-save via debounced (300ms) PUT requests, with honest status flags (`saved`, `saving`, `error`, `offline`).

---

### Finding C: Simulated AI Intelligence & Hardcoded Response Strings
- **Primary Source Files:**
  - `src/app/api/ai/generate/route.ts` (lines 44–46)
  - `src/lib/ai/index.ts` (lines 125–208)
- **Code Evidence:**
  In `src/app/api/ai/generate/route.ts`:
  ```typescript
  // lines 44-46
  const { updatedDocument, appendedBlocks, actualInputTokens, actualOutputTokens } =
    continueInterruptedGeneration(doc);
  ```
  In `src/lib/ai/index.ts`:
  ```typescript
  // lines 134-189
  const appendedBlocks: CdmBlock[] = isRtl
    ? [
        {
          id: `cont-h-${nextIndex}`,
          type: 'heading',
          level: 2,
          direction: 'rtl',
          keepWithNext: true,
          text: 'البند الثالث (مستكمل): حوكمة أمن المعلومات واتفاقية مستوى الخدمة (SLA)',
        },
        {
          id: `cont-p-${nextIndex + 1}`,
          type: 'paragraph',
          direction: 'rtl',
          align: 'start',
          runs: [
            {
              text: 'تم استكمال التوليد بنجاح من آخر فقرة محفوظة في شجرة CDM v1.2 دون إعادة توليد البنود السابقة...',
              marks: [],
            },
          ],
        },
        ...
      ]
    : [ ... ];

  return {
    updatedDocument,
    appendedBlocks,
    actualInputTokens: 320,
    actualOutputTokens: 480,
  };
  ```
- **Architectural Vulnerability & Impact:**
  1. **Zero Real AI Inference:** Calling `/api/ai/generate` does not invoke Google Gemini API or any LLM provider. It returns identical hardcoded Arabic and English contract paragraphs regardless of the user prompt or intent.
  2. **Fake Token Accounting:** The system reports static synthetic tokens (`actualInputTokens: 320`, `actualOutputTokens: 480`) rather than genuine usage metadata extracted from provider telemetry.
  3. **No Structured Output Validation:** There is no schema validation for structured block modifications (`insert_after`, `replace_selection`, `create_outline`), and no prompt-injection filtering.
- **Remediation Specification:**
  - Integrate official Google GenAI / Gemini SDK (`@google/genai`) on the server.
  - Implement structured JSON output using Zod schemas matching CDM block types.
  - Extract genuine usage metadata (`response.usageMetadata.promptTokenCount`, `candidatesTokenCount`) and record exact token counts in the database ledger.
  - Implement honest fallback when API keys are absent (`GEMINI_API_KEY` not configured), displaying clear user-facing messaging rather than disguised simulations.

---

### Finding D: Decoupled Worker, Simulated Queue & Incomplete Export Pipeline
- **Primary Source Files:**
  - `src/app/api/documents/[id]/export/route.ts` (lines 30–68)
  - `workers/src/index.ts` (lines 30–66, 68–94)
  - `src/lib/export/pdf-renderer.ts` (lines 1–85)
- **Code Evidence:**
  In `src/app/api/documents/[id]/export/route.ts`:
  ```typescript
  // lines 30-36
  const job = workerCoordinator.enqueueExportJob({
    userId: session.userId,
    documentId: doc.id,
    format: body.format,
    idempotencyKey: body.idempotencyKey,
  });

  // lines 59-68
  const pdfOptions = body.format === 'pdf' ? buildVectorPdfOptions(doc) : undefined;
  const printableHtmlPreview =
    body.format === 'pdf' ? renderCdmToPrintableHtml(doc) : undefined;

  return NextResponse.json({
    ok: true,
    job,
    pdfOptions,
    hasPrintableHtml: Boolean(printableHtmlPreview),
  });
  ```
  In `workers/src/index.ts`:
  ```typescript
  // lines 30-32
  export class PgmqExportWorkerCoordinator {
    private jobs = new Map<string, ExportJobRecord>();
    private idempotencyMap = new Map<string, string>();
  ```
- **Architectural Vulnerability & Impact:**
  1. **Simulated Background Worker:** `workers/src/index.ts` is an in-memory class imported directly into the Next.js process. It does not run as a standalone background process and does not interact with the `export_jobs` table in PostgreSQL.
  2. **No PDF Binary Generation:** When requesting PDF export, the endpoint generates an HTML string and returns JSON with `hasPrintableHtml: true`. No binary PDF is rendered, compiled, or downloadable.
  3. **No Private Storage Integration:** Generated artifacts are not uploaded to Supabase Storage, and no signed, time-limited download URLs are provided.
- **Remediation Specification:**
  - Implement real queue operations writing to the `public.export_jobs` table in PostgreSQL.
  - Connect the worker loop to poll pending jobs from the database, claim them with visibility leases and fencing tokens, render genuine `.docx` (using `docx@9.15.2` with `bidiVisual`) and binary `.pdf` (using headless Chromium / Puppeteer), and upload results to a private Supabase Storage bucket (`document-exports`).
  - Provide an endpoint `/api/documents/[id]/export/[jobId]/download` that returns owner-authenticated signed download URLs or streams the file binary.

---

### Finding E: Simulated PDF Extraction & Ingestion Pipeline
- **Primary Source Files:**
  - `src/app/api/files/extract-pdf/route.ts` (lines 6–26)
  - `src/lib/ingest/file-pipeline.ts` (lines 100–145)
- **Code Evidence:**
  In `src/app/api/files/extract-pdf/route.ts`:
  ```typescript
  const ExtractPdfRequestSchema = z.object({
    fileName: z.string().min(1),
    pageTexts: z.array(z.string()).min(1),
  });

  export async function POST(request: NextRequest) {
    ...
    const body = ExtractPdfRequestSchema.parse(await request.json());
    const extraction = classifyAndExtractDigitalPdfText({
      pageTexts: body.pageTexts,
    });
  ```
- **Architectural Vulnerability & Impact:**
  1. **No Real Binary PDF Parsing:** The endpoint expects the client to transmit an array of already-extracted text strings (`pageTexts: string[]`). It does not accept `multipart/form-data` containing an actual `.pdf` file binary.
  2. **No Layout or Page Citations:** Because raw PDF binary streams are not processed on the server, the pipeline cannot inspect PDF xref tables, stream fonts, font encodings, or extract layout bounding boxes for verified citations.
- **Remediation Specification:**
  - Implement a `multipart/form-data` endpoint handling real binary PDF uploads with size limits (up to 25MB) and MIME validation.
  - Parse the binary buffer on the server using `pdfjs-dist` to extract page-by-page text, headings, and character counts.
  - Support grounded contextual Q&A against the extracted pages with explicit page number citations.

---

### Finding F: Factual Discrepancies in Legal & Privacy Claims
- **Primary Source Files:**
  - `src/components/views/LegalView.tsx` (lines 35–64, 88–95)
  - `tests/security/token-ledger-security.test.ts` (lines 1–70)
- **Code Evidence:**
  In `src/components/views/LegalView.tsx`:
  - Claims: *"Strict Zero Data Retention enforcement with enterprise confidentiality for mission-critical documents... All inference API calls utilize ephemeral payload isolation with store: false, guaranteeing that private enterprise data is never ingested into training corpuses."*
  - Claims: *"All document payloads in PostgreSQL are encrypted at rest with AES-256 and protected via granular Row-Level Security (RLS) policies."*
  - Claims: *"DOCORA targets 99.9% operational availability for cloud studio instances."*
- **Architectural Vulnerability & Impact:**
  1. **Unsubstantiated Legal/Security Warranties:** The application claims absolute Zero Data Retention (ZDR) and active AES-256 PostgreSQL RLS enforcement while running in-memory with header-based auth overrides.
  2. **Regulatory Risk:** Under Saudi PDPL and EU GDPR, misrepresenting data processing safeguards and retention policies constitutes non-compliance.
  3. **Synthetic Security Tests:** Unit tests verify SQL file strings via `fs.readFileSync` rather than testing live RLS enforcement on an actual database.
- **Remediation Specification:**
  - Revise `LegalView.tsx` to provide factual, accurate disclosures distinguishing between Developer API `store: false` semantics and contractual Enterprise Vertex AI ZDR.
  - Accurately state current tenant isolation boundaries and encryption architectures.
  - Provide test evidence executing real cross-tenant access attempts against PostgreSQL RLS.

---

## 3. Technical Debt & Remediation Priority Matrix

| Issue ID | Area | Current State | Target Production State | Priority | Risk Level |
|---|---|---|---|---|---|
| **SEC-01** | Auth & Identity | Header spoofing (`x-docora-test-user`), default demo user | Supabase Auth SSR cookies, zero header trust | **P0** | **CRITICAL** |
| **SEC-02** | Multi-Tenant RLS | Simulated in TypeScript `Map` class | Live PostgreSQL RLS policies across all tables | **P0** | **CRITICAL** |
| **DATA-01** | Document Persistence | In-memory `Map`, F5 wipes all edits | PostgreSQL `documents` + `cdm_versions`, debounced autosave | **P0** | **HIGH** |
| **AI-01** | AI Generation | Hardcoded mock strings, fake tokens | Real Gemini API SDK, structured output, live telemetry | **P0** | **HIGH** |
| **EXP-01** | Export Pipeline | In-memory queue, returns HTML string | Real DB queue worker, Puppeteer PDF & Docx binaries | **P0** | **HIGH** |
| **ING-01** | PDF Ingestion | Client passes pre-parsed strings | Multipart upload, server-side PDF.js parsing | **P1** | **MEDIUM** |
| **GOV-01** | Legal & Compliance | Absolute ZDR / SLA claims | Transparent, technically accurate disclosures | **P1** | **MEDIUM** |

---

## 4. Verification Check

This audit was conducted by reading and inspecting active source files directly from the working workspace `C:\Users\abdal\Desktop\DOCORA`. All cited line numbers and code blocks correspond exactly to the current `master` tree.
