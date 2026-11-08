# DOCORA — Consolidated System Architecture & Topology (Phase 00.2 Remediation v1.2.2)

**Document Reference:** `DOCORA-03-ARCH-v1.2.2`  
**Status:** CONSOLIDATED ARCHITECTURE BASELINE (POST-REVIEW REMEDIATED)  
**Audit Predecessors:** Phase 00 (`04-SYSTEM-ARCHITECTURE.md`), Phase 00.1 (`03-UPDATED-SYSTEM-ARCHITECTURE.md`), Phase 00.2 Baseline  

---

## 1. System Context & Component Architecture

DOCORA operates as a modular, distributed web platform split into four primary execution tiers:
1. **Client Tier (Presentation & Virtual Canvas):** Next.js 16.4.5 App Router client components, React 19.2.0, ProseMirror/Tiptap 3.x state (`immediatelyRender: false`), Zustand local state, and Web Worker pagination observers.
2. **Application Tier (API Gateway & Interception):** Next.js 16.4.5 Route Handlers, `proxy.ts` request interception boundary (executing on the **Node.js runtime**; Edge runtime is unsupported for this convention), request rate limiting, and Vercel AI SDK streaming endpoints.
3. **Background Execution Tier (Worker Fleet):** Scalable containerized workers (Node.js 24) consuming durable messages from Supabase PGMQ, executing Puppeteer PDF rendering, LibreOffice conversions, and Tesseract 5.5.4 OCR jobs.
4. **Data & Storage Tier (Supabase Platform):** PostgreSQL 15+ with strict Row-Level Security (RLS), GoTrue Auth, Realtime listeners, PGMQ queues, and S3-compatible object storage.

---

## 2. Architecture Diagrams

### Diagram 1: DOCORA System Context & Trust Boundaries

```mermaid
flowchart TD
    subgraph Untrusted_Zone ["Untrusted Client Zone (Browser)"]
        UI["Web Studio UI (React 19.2 / Next.js 16.4.5)"]
        Canvas["Virtual Paged Canvas (Tiptap 3.x immediatelyRender: false)"]
        LocalCache["IndexedDB (Draft State Cache)"]
        UI --> Canvas
        Canvas <--> LocalCache
    end

    subgraph Edge_Zone ["Application & Request Interception Tier (Next.js 16.4.5 / Node.js Runtime)"]
        AuthProxy["Next.js proxy.ts (Request Interception / JWT Check - Node.js Runtime)"]
        RouterAPI["Intelligent Model Router (Vercel AI SDK)"]
        DocAPI["Document Management APIs"]
        ExportAPI["Async Export Request Handler"]
    end

    subgraph Service_Zone ["Protected Core Services (Node 24 / VPC)"]
        DocService["Document Compilation Service"]
        AgentOrch["Multi-Agent Review Supervisor"]
        StyleEngine["Style DNA Extraction Engine"]
        TokenLedger["Token Accounting & Quota Guard"]
    end

    subgraph Worker_Zone ["Asynchronous Worker Fleet (Containerized)"]
        WorkerPool["PGMQ Worker Fleet (Node 24)"]
        PuppeteerEngine["Headless Chromium (PDF Export)"]
        DocxEngine["OOXML DOCX Builder Engine (docx 9.1.x)"]
        LibreOfficeEngine["LibreOffice Headless 24.x"]
        OCREngine["Tesseract 5.5.4 OCR Engine (Patched)"]
        
        WorkerPool --> PuppeteerEngine
        WorkerPool --> DocxEngine
        WorkerPool --> LibreOfficeEngine
        WorkerPool --> OCREngine
    end

    subgraph Data_Tier ["Supabase Managed Platform (PostgreSQL 15+)"]
        PostgresDB[("PostgreSQL DB with Enforced RLS")]
        PGMQ[("PGMQ Durable Message Queues")]
        S3Storage[("Supabase Storage (Asset Buckets)")]
    end

    subgraph AI_Providers ["External AI Provider Tier"]
        GeminiAPI["Google GenAI API (Gemini 4 / 3.8 / 3.5)"]
        AnthropicAPI["Anthropic Claude API (Secondary Failover)"]
        OpenAIAPI["OpenAI API (Secondary)"]
    end

    %% Client Interactions
    UI -->|HTTPS / WSS| AuthProxy
    AuthProxy --> RouterAPI
    AuthProxy --> DocAPI
    AuthProxy --> ExportAPI

    %% Edge to Services
    RouterAPI --> TokenLedger
    RouterAPI --> AgentOrch
    DocAPI --> DocService
    ExportAPI -->|Enqueue Task| PGMQ

    %% Services to Data
    DocService -->|Postgres RLS| PostgresDB
    TokenLedger -->|Atomic Token Debit| PostgresDB
    StyleEngine --> PostgresDB
    AgentOrch --> AI_Providers

    %% Workers to Data & Storage
    PGMQ -->|Consume Message| WorkerPool
    WorkerPool -->|Read/Write Assets| S3Storage
    WorkerPool -->|Update Status| PostgresDB
```

---

### Diagram 2: Document Creation & Generation Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor User as User (Client Studio)
    participant Client as Virtual Canvas (Tiptap 3.x)
    participant API as Document API / Router
    participant Ledger as Token Ledger Guard
    participant AI as Multi-Model Engine (Gemini)
    participant Agent as Multi-Agent Review
    participant DB as PostgreSQL (Supabase)

    User->>Client: Enters Document Prompt & Uploads Assets
    Client->>API: POST /api/documents/plan (Prompt, Context, StyleDNA)
    API->>Ledger: reserve_document_tokens(UserID, EstimatedTokens)
    alt Insufficient Quota
        Ledger-->>Client: 402 Payment Required (Quota Exceeded)
    else Quota Verified & Reserved
        Ledger-->>API: Reservation Granted (ReservationID)
        API->>AI: Intent & Outline Generation (Streaming)
        AI-->>Client: Stream Outline Proposal
        User->>Client: Approves Outline with Edits
        Client->>API: POST /api/documents/draft (OutlineID, ApprovedParams)
        API->>AI: Section-by-Section Draft Execution
        AI-->>Client: Stream Draft into Canonical Document Model (CDM v1.2)
        Client->>DB: Auto-save CDM Snapshot (Status: Draft)
        
        Note over API,Agent: Multi-Agent Review Phase (Optional or Auto)
        API->>Agent: Run 9 Reviewer Agents (Language, Style, Citations)
        Agent->>AI: Verify Claims, Check RTL, Score Quality
        Agent-->>Client: Deliver Review Findings & Suggestions
        User->>Client: Accepts/Rejects Suggestions
        
        API->>Ledger: reconcile_document_tokens(ReservationID, ActualConsumedTokens)
        Ledger->>DB: Write Final Audit Entry to token_usage_ledger
        Client->>User: Document Ready for Interactive Editing
    end
```

---

## 3. Trust Boundaries & Network Isolation

```
[ BROWSER CLIENT ] 
      |  (TLS 1.3 / Authenticated via GoTrue JWT)
======+========================================================================
[ TRUST BOUNDARY 1: APPLICATION GATEWAY (Next.js 16.4.5 proxy.ts - Node.js Runtime) ]
- Enforces CORS, Rate Limits, and JWT Validation.
- Blocks unauthenticated access; strips dangerous request headers.
- Next.js 16 proxy.ts executes on Node.js runtime (Edge runtime is unsupported).
======+========================================================================
[ TRUST BOUNDARY 2: DATABASE & QUEUE TIER ]
- PostgreSQL RLS enforces user/tenant isolation on EVERY table.
- Direct database access restricted; client connections use anon or authenticated JWT roles.
- Administrative functions strictly isolated inside `SECURITY DEFINER` functions with `search_path = ''`.
======+========================================================================
[ TRUST BOUNDARY 3: ASYNCHRONOUS WORKER ENVIRONMENT ]
- Containerized workers execute within private VPC subnets.
- Worker processes have no public listening ports; outbound access strictly limited to:
  1. Supabase PostgreSQL & Storage API.
  2. Authorized AI Provider endpoints.
- LibreOffice and Puppeteer run in locked-down, unprivileged user accounts with non-executable `/tmp`.
======+========================================================================
[ TRUST BOUNDARY 4: EXTERNAL AI PROVIDER INTERFACE ]
- Zero credentials stored in database or client code; managed via server-side environment secrets.
- Data sent to AI providers is scrubbed of system tokens and classified according to data privacy policies.
```

---

## 4. Subsystem Decomposition & Service Responsibilities

### 4.1 Document Management Subsystem
- **Canonical Model Parser:** Converts between ProseMirror JSON AST and DOCORA CDM v1.2.
- **Auto-Save Coordinator:** Implements debounced delta persistence (every 30s or 50 keystrokes) to prevent data loss.
- **Version History Controller:** Manages immutable document snapshots in `document_versions` with differential storage.

### 4.2 Intelligent Router & Model Gateway
- **Task Classifier:** Inspects prompt and context tokens to evaluate complexity score ($C \in [1, 10]$).
- **Capability Matcher:** Matches task requirements (Arabic support, multimodal vision, long context) against the Model Registry.
- **Circuit Breaker:** Tracks provider error rates and latency, automatically degrading or escalating model calls.

### 4.3 Multi-Agent Review Coordinator
- **Review Dispatcher:** Manages parallel execution of independent review tasks (e.g., Grammar vs. Citation checking).
- **Conflict Arbitrator:** Merges non-overlapping suggestions and flags contradictory recommendations for human review.
- **Budget Enforcer:** Terminates review cycles if token limits or execution rounds ($N_{max} = 2$) are breached.

### 4.4 Asynchronous Worker Subsystem
- **PGMQ Consumer:** Polls queue topics (`export_jobs`, `ocr_jobs`, `ingestion_jobs`) with dynamic visibility timeout extension.
- **Puppeteer Headless Farm:** Manages a pool of warm Chromium browser instances with pre-cached Arabic web fonts.
- **LibreOffice Sanitizer:** Executes headless conversions in isolated temp directories, automatically cleaning up scratch files on completion.

---
*Verified against official Next.js 16 documentation and Phase 00.2 acceptance review findings.*
