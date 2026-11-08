# 04 — System Architecture & Topology
## Project Codename: AI Document Studio
**Phase:** 00 — Discovery & Architecture  
**Document Status:** Complete System Architecture  

---

## 1. High-Level System Topology

AI Document Studio is designed as a **decoupled, multi-tier cloud-native architecture**. The system is partitioned into five distinct operational planes:
1. **Client Presentation Plane**: Next.js 15+ single-page application and virtual paged editing canvas running in the user's browser.
2. **Edge & API Gateway Plane**: Next.js Server Actions and Route Handlers running on Vercel's global edge and serverless runtime.
3. **Data, Authentication & Storage Plane**: Managed Supabase PostgreSQL 16 with Row-Level Security, Supabase Auth, and private S3-compatible object storage.
4. **Autonomous AI Orchestration Plane**: Provider-agnostic AI Gateway executing staged prompt pipelines, schema enforcement, and streaming responses (primarily via Google Gemini 2.5).
5. **Asynchronous Compute & Conversion Worker Plane**: Hardened Docker containers running on Render/Fly.io executing heavy background jobs (LibreOffice headless conversions, Puppeteer PDF printing, and OCR extraction).

```mermaid
flowchart TB
    subgraph ClientPlane ["1. Client Presentation Plane (Browser)"]
        UI["Studio Web Shell (Next.js 15+ / Tailwind v4)"]
        Canvas["Virtual Paged Canvas (Tiptap / ProseMirror)"]
        PDFViewer["PDF.js Inspection & Citation Viewer"]
        ClientState["State Store (Zustand + TanStack Query)"]
        LocalCache["Offline IndexedDB Cache"]
        
        UI <--> Canvas
        UI <--> PDFViewer
        Canvas <--> ClientState
        ClientState <--> LocalCache
    end

    subgraph EdgePlane ["2. Edge & Serverless API Plane (Vercel)"]
        Middleware["Security & Locale Middleware (RTL/LTR Detect)"]
        ServerActions["Next.js Server Actions (RPC Mutations)"]
        RouteHandlers["REST / Streaming Route Handlers"]
        ZodGuard["Zod Runtime Schema Validation Guard"]
        
        Middleware --> ServerActions
        Middleware --> RouteHandlers
        ServerActions --> ZodGuard
        RouteHandlers --> ZodGuard
    end

    subgraph DataPlane ["3. Data & Storage Plane (Supabase)"]
        AuthService["Supabase Auth (JWT, OAuth2, Magic Links)"]
        PostgresDB[("PostgreSQL 16 DB (RLS, JSONB AST, pgvector)")]
        S3Storage[("Encrypted S3 Object Storage (Uploads & Exports)")]
        RealtimeWS["Supabase Realtime (WebSocket Notification Hub)"]
        
        AuthService --> PostgresDB
        PostgresDB <--> S3Storage
    end

    subgraph AIPlane ["4. AI Orchestration Plane"]
        AIGateway["AI Provider Adapter (IAIGeneratorProvider)"]
        GeminiPrimary["Google Gemini 2.5 Pro / Flash (Primary)"]
        SecondaryAI["Anthropic Claude 3.5 / OpenAI GPT-4o (Fallback)"]
        PromptEngine["Prompt Engineering & Schema Enforcer"]
        
        AIGateway --> PromptEngine
        PromptEngine --> GeminiPrimary
        PromptEngine -.-> SecondaryAI
    end

    subgraph WorkerPlane ["5. Background Worker Plane (Docker / Render)"]
        JobQueue["Job Queue (PostgreSQL pgmq / Redis BullMQ)"]
        WorkerPool["Worker Container Daemon"]
        LibreOffice["LibreOffice Headless Daemon"]
        ChromiumEngine["Headless Chromium (Puppeteer)"]
        DocxCompiler["Native docx OOXML Engine"]
        
        JobQueue --> WorkerPool
        WorkerPool --> LibreOffice
        WorkerPool --> ChromiumEngine
        WorkerPool --> DocxCompiler
    end

    ClientPlane <==> |HTTPS / TLS 1.3| EdgePlane
    ClientPlane <==> |Secure WebSockets| RealtimeWS
    EdgePlane <==> |JWT / PostgREST| PostgresDB
    EdgePlane <==> |Signed URLs| S3Storage
    EdgePlane <==> |gRPC / HTTPS| AIPlane
    EdgePlane ==> |Enqueue Tasks| JobQueue
    WorkerPool <==> |Fetch / Store Assets| S3Storage
    WorkerPool ==> |Job State Events| PostgresDB
```

---

## 2. Core Subsystems & Responsibilities

### 2.1 Client Presentation Plane
- **Studio Shell**: Delivers a responsive, accessible three-zone workspace:
  - Left: Collapsible Document Tree / Section Navigator / Thumbnail Bar.
  - Center: Virtual Paged Canvas with physical A4 margins, ruler, zoom controller, and print layout simulation.
  - Right: Contextual AI Copilot & Source Document Inspector.
- **State Management**:
  - `TanStack Query (React Query)`: Server state caching, optimistic UI updates, and stale-while-revalidate synchronization.
  - `Zustand`: Ephemeral editor client state (zoom level, active selection range, floating toolbar visibility, side panel toggle).
  - `IndexedDB (idb-keyval)`: Real-time offline keystroke buffer ensuring zero data loss if network connection drops.

### 2.2 Edge & Serverless API Plane
- **Route Handlers (`app/api/*`)**:
  - Streaming LLM completions using Server-Sent Events (SSE) via the Vercel AI SDK.
  - Binary download streaming for pre-generated DOCX/PDF files.
  - Webhook ingestion for asynchronous worker job completions.
- **Server Actions**:
  - Atomic document mutations (create, rename, move to folder, duplicate, soft delete).
  - Version creation and manual snapshot checkpoints.
  - Generation job dispatching.

### 2.3 Data, Authentication & Persistence Plane
- **PostgreSQL 16**:
  - Serves as the authoritative source of truth.
  - Document bodies are stored as structured JSONB representing the **Canonical Document Model (CDM)**.
  - Enforces strict tenant isolation via Row-Level Security (RLS) policies on every table.
  - Integrates `pgvector` to enable semantic vector search over uploaded PDF document chunks.
- **Supabase Storage**:
  - Private storage buckets: `raw-uploads` (quarantined uploaded files), `document-assets` (user-uploaded images embedded in documents), and `generated-exports` (compiled DOCX and PDF binaries).
  - All client access is governed by temporary signed URLs with 15–30 minute TTLs.

### 2.4 Autonomous AI Orchestration Plane
- **Staged Document Generation Pipeline**:
  - Prevents the classic failure mode of asking an LLM to generate a 20-page document in a single prompt.
  - Decomposes generation into: Intent Clarification -> Outline Synthesis -> Section-by-Section Expansion -> Final Consistency Review.
- **Schema Enforcement**:
  - Utilizes Gemini's native `responseSchema` to guarantee that the output matches the required CDM AST format without markdown fences or extraneous conversational chatter.

### 2.5 Compute & Conversion Worker Plane
- **Job Lifecycle Engine**:
  - Long-running, compute-heavy tasks (converting a 50-page DOCX to PDF, batch OCR processing, large file decompression) are enqueued into `generation_jobs`.
  - Containerized worker processes consume jobs, execute headless tasks in isolated Linux environments, write results to S3 storage, and notify the user via Supabase Realtime.

---

## 3. End-to-End Component Interaction Sequences

### 3.1 Document Generation Workflow (Staged Pipeline)

```mermaid
sequenceDiagram
    autonumber
    actor User as Client User
    participant Web as Next.js Web App
    participant Edge as Server Action / API
    participant AI as AI Engine (Gemini 2.5)
    participant DB as Supabase PostgreSQL
    participant Worker as Background Worker

    User->>Web: Enter Prompt ("Generate 10-page Energy Report")
    Web->>Edge: dispatchGenerateDocument(prompt, options)
    Edge->>AI: Stage 1: Generate Outline Schema
    AI-->>Edge: Returns Outline JSON (Sections, Word Counts)
    Edge-->>Web: Present Outline for User Review
    User->>Web: Approve / Refine Outline
    Web->>Edge: confirmOutline(outlineId)
    Edge->>DB: Create Document Record (status: 'generating')
    Edge->>DB: Enqueue Section Generation Job
    loop For Each Section in Outline
        Edge->>AI: Stage 2: Generate Section Content (CDM Schema)
        AI-->>Edge: Stream Section CDM Nodes
        Edge->>DB: Append Section to Document JSONB
        Edge->>Web: Stream Progress via Server-Sent Events / Realtime
    end
    Edge->>DB: Update Document Status ('ready')
    Web->>User: Open Virtual Paged Canvas with Complete Document
```

---

### 3.2 Scoped In-Place AI Editing Workflow

```mermaid
sequenceDiagram
    autonumber
    actor User as Client User
    participant Editor as Tiptap Canvas
    participant API as Next.js API Route
    participant AI as Gemini 2.5 Pro
    participant CDM as Canonical Model Bridge

    User->>Editor: Highlight Paragraph & Select "Rewrite Formal"
    Editor->>Editor: Extract Node ID & Preceding/Following Slices
    Editor->>API: POST /api/ai/scoped-edit (nodeId, text, prompt, context)
    API->>AI: Prompt with strict Node Schema & Bounding Context
    AI-->>API: Returns Replacement Node CDM JSON
    API->>CDM: Validate Schema & Verify Single-Node Boundary
    API-->>Editor: Deliver Proposed Node Replacement
    Editor->>Editor: Render Inline Visual Diff (Green/Red Highlighting)
    User->>Editor: Click "Accept Change"
    Editor->>Editor: Apply Transactional Step (Pushed to Undo Stack)
    Editor->>Editor: Trigger Debounced Cloud Autosave
```

---

### 3.3 File Upload, Multimodal Extraction & Source Grounding Workflow

```mermaid
sequenceDiagram
    autonumber
    actor User as Client User
    participant Web as Next.js Web App
    participant S3 as Supabase Storage
    participant Worker as Background Worker
    participant AI as Gemini 2.5 Multimodal
    participant DB as PostgreSQL DB

    User->>Web: Drag & Drop Contract.pdf (25 pages)
    Web->>Web: Validate File Signature (Magic Bytes: %PDF-)
    Web->>S3: Upload to 'raw-uploads' Bucket via Signed URL
    Web->>DB: Insert Record into 'document_sources' (status: 'uploaded')
    Web->>Worker: Enqueue 'pdf_ingest_job'
    Worker->>S3: Download Contract.pdf
    Worker->>Worker: Check Text Density (PDF.js / Poppler)
    alt Native Digital PDF
        Worker->>Worker: Extract Digital Text Streams & Geometry
    else Scanned Bitmap PDF
        Worker->>Worker: Rasterize Pages to 300 DPI Images
        Worker->>AI: Batch Process Pages with Gemini Vision OCR
    end
    Worker->>AI: Structure Content into Semantic Nodes & Tables
    AI-->>Worker: Structured Extraction with Page & Bounding Box Tags
    Worker->>DB: Store Nodes in 'document_source_snippets'
    Worker->>DB: Update Source Status ('indexed')
    Worker->>Web: Broadcast "Processing Complete" via Realtime
    Web->>User: Display PDF Viewer alongside Grounded Q&A Assistant
```

---

## 4. Trust Boundaries & Security Enclaves

```mermaid
graph LR
    subgraph UntrustedZone ["Untrusted Public Zone"]
        PublicClient["User Browser / Client Payloads"]
        UploadedFile["Raw User Uploads (PDF / Images / Word)"]
    end

    subgraph PerimeterZone ["DMZ / API Perimeter"]
        WAF["Vercel Firewall & Rate Limiter"]
        MagicValidator["Magic Bytes & Decompression Sanitizer"]
        JWTAuth["JWT Authentication Token Verifier"]
    end

    subgraph SecureCore ["Secure Core Enclave"]
        AppServer["Next.js Server Actions"]
        PostgresCore["PostgreSQL DB with Row-Level Security"]
        S3Core["Encrypted Object Storage"]
    end

    subgraph SandboxEnclave ["Isolated Worker Sandbox"]
        DockerWorker["Hardened Docker Container (No Host Net)"]
        LibreOfficeBin["LibreOffice Headless Process"]
        PuppeteerBin["Headless Chromium Sandbox"]
    end

    subgraph ExternalServices ["External Trusted Third-Party"]
        GeminiCloud["Google Gemini API (Encrypted via HTTPS)"]
    end

    PublicClient --> |HTTPS| WAF
    UploadedFile --> |Sanitization| MagicValidator
    WAF --> JWTAuth
    MagicValidator --> JWTAuth
    JWTAuth --> AppServer
    AppServer --> PostgresCore
    AppServer --> S3Core
    AppServer --> ExternalServices
    AppServer --> DockerWorker
    DockerWorker --> LibreOfficeBin
    DockerWorker --> PuppeteerBin
```

### Boundary Security Controls:
1. **Perimeter Boundary**: Vercel WAF enforces rate limiting, DDoS mitigation, and cross-site scripting (XSS) header policies.
2. **Untrusted Upload Boundary**: All user-supplied files are quarantined. Magic byte inspection prevents executable spoofing (e.g., renaming an `.exe` to `.pdf`). DOCX files undergo ZIP decompression ratio checks to eliminate ZIP-bomb decompression memory exhaustion.
3. **Database Boundary**: PostgreSQL Row-Level Security guarantees that queries can only access rows where `user_id = auth.uid()`.
4. **Compute Sandbox Boundary**: LibreOffice and Chromium execute within non-root, memory-limited Docker containers with restricted network egress, preventing Server-Side Request Forgery (SSRF) or arbitrary code execution via compromised document parsers.
