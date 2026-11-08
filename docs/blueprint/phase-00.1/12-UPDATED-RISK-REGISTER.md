# 12 — Updated Risk Register & Failure Mode Runbooks
## Project: DOCORA — AI Document Studio
**Phase:** 00.1 — Master Architecture Validation & Blueprint Remediation  
**Status:** Remediated Technical Risk Matrix & Runbooks  

---

## 1. Remediated Risk Matrix

Every engineering risk is calibrated against measurable criteria, eliminating vague assumptions:

| Risk ID | Failure Mode | Probability | Impact | Severity | Owner Subsystem | Remediated Primary Mitigation |
|---|---|---|---|---|---|---|
| **RSK-01** | DOCX/PDF Layout Inconsistency | Med | High | **High** | Document Engine | Dual-track conversion: LibreOffice worker targets >=95% visual similarity; no impossible "100%" claims. |
| **RSK-02** | Broken Arabic Glyph Ligatures | Med | High | **High** | Editor & PDF Engine | Independent HarfBuzz visual shaping tests; bundle Amiri & Noto Sans Arabic font subsets. |
| **RSK-03** | Mixed-Direction Punctuation Inversion | High | Med | **High** | Typography Engine | CSS `unicode-bidi: isolate;` on inline runs; OOXML `<w:bidi/>` and `<w:rtl/>` flags. |
| **RSK-04** | OCR Inaccuracies on Scanned Files | Med | Med | **Medium** | File Intelligence | Adaptive 3-tier processing; confidence < 0.70 prompts user visual review badge. |
| **RSK-05** | AI Citation Hallucinations | High | High | **Critical** | AI Orchestrator | Server verifies that `verbatim_quote` exists in source page text before rendering citation. |
| **RSK-06** | AI Model Deprecation Breakage | Med | Med | **Medium** | AI Gateway | Capability-Based Model Registry allows hot-swapping model IDs without code changes. |
| **RSK-07** | Runaway AI Token Expenses | Med | High | **High** | Billing & Ledger | Hard token caps enforced via atomic stored procedure; 5 document/hour free tier rate limit. |
| **RSK-08** | Serverless Edge Function Timeouts | High | High | **Critical** | Worker Queue | Tasks >15s offloaded to Supabase PGMQ; dedicated Docker worker on Render. |
| **RSK-09** | ZIP Decompression Bombs (`.docx`) | Med | High | **High** | Ingest Guard | Stream decompression aborts if compression ratio > 100:1 or uncompressed size > 100 MB. |
| **RSK-10** | Worker Process Out-of-Memory (OOM) | Med | High | **High** | Worker Daemon | Docker memory capped at 2048 MB; max 50 pages per scanned PDF in MVP; auto-restart daemon. |
| **RSK-11** | Duplicate Job Worker Execution | Med | Med | **Medium** | PGMQ Engine | Message visibility timeout (60s) + worker heartbeats every 20s + idempotency keys. |
| **RSK-12** | Privilege Escalation on Entitlements | Low | High | **Critical** | Database & RLS | **Decomposed profiles and user_entitlements**; entitlements writable strictly by service_role. |
| **RSK-13** | Storage Leakage / URL Scraping | Low | High | **High** | Supabase Storage | Strictly private buckets; Supabase HMAC-SHA256 signed URLs with 15-minute TTL. |
| **RSK-14** | Keystroke Loss on Sudden Network Drop | Med | High | **High** | Client State | IndexedDB local buffer stores all edits; synchronizes to server upon reconnection. |
| **RSK-15** | Malformed AST Schema Corruption | Low | High | **High** | Schema Guard | Strict Zod validation on CDM v1.1.0; invalid payloads rejected before DB persistence. |
| **RSK-16** | Free-Tier AI Data Training Exposure | Low | High | **Critical** | AI Gateway | Production infrastructure mandates paid Google Cloud billing; free tier API strictly prohibited. |

---

## 2. Technical Failure Runbooks

### Runbook RSK-05: Recovering from AI Citation Discrepancies
- **Detection**: Server-side verification function `verifyCitationQuote()` fails to find `verbatim_quote` inside `document_source_snippets` for the target page.
- **Immediate Mitigation**: The citation is flagged with `is_verified: false`. In the UI, the citation badge renders in amber (`#F59E0B`) with the label *"Unverified Source Quote"*.
- **User Action**: Clicking the badge displays the best-match fuzzy sentence from that page, allowing the user to either approve the match or discard the citation.

### Runbook RSK-10: Worker Container OOM Recovery
- **Detection**: Background container terminates abruptly with Linux Exit Code 137 (SIGKILL by OOM killer).
- **Automated Recovery**:
  1. Supervisor daemon (Docker restart policy: `always`) respawns the worker container in <2 seconds.
  2. The failed message in `pgmq` becomes visible again after its 60-second timeout expires.
  3. The re-reading worker inspects the message's `read_ct`. If `read_ct >= 3`, the job is marked `failed` in `generation_jobs` with the error: *"Document exceeds compute memory limits. Please split document"*.
  4. The poison message is permanently moved to the dead-letter archive table (`pgmq.archive('docora_jobs', msg_id)`), preventing cascading worker crash loops.
