# DOCORA — Risk Register & Mitigation Architecture (Phase 00.2)

**Document Reference:** `DOCORA-20-RISK-v1.2`  
**Status:** CONSOLIDATED ARCHITECTURE BASELINE  
**Audit Predecessors:** Phase 00 (`14-RISK-REGISTER.md`), Phase 00.1 (`12-UPDATED-RISK-REGISTER.md`)  

---

## 1. Architectural Risk Management Framework

DOCORA categorizes risks across **7 operational domains**, establishing deterministic preventative controls, automated detection mechanisms, and actionable remediation runbooks for every critical vulnerability.

---

## 2. Master Risk Register

| Risk ID | Domain | Risk Description | Prob | Impact | Severity | Preventative & Detective Controls | Response & Remediation Runbook |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| **RSK-01** | **Technical** | Arabic font shaping divergence between browser canvas and compiled DOCX | M | H | **HIGH** | Bundled Noto/Amiri web fonts; explicit `<w:rtl/>` flags on every run. Automated SSIM visual regression test in CI. | Re-adjust HarfBuzz font substitution tables; insert zero-width non-joiners. |
| **RSK-02** | **Security** | Malicious tenant updating `monthly_token_quota` to bypass billing | L | H | **CRITICAL** | Table separation (`user_entitlements`); RLS blocks all client updates. Only `service_role` and stored procedures can modify. | Revoke compromised session; audit ledger; revert balance. |
| **RSK-03** | **Security** | Indirect prompt injection embedded within scanned PDF / OCR payload | H | H | **HIGH** | Stripped executable tools for extraction agents; passive data payload boundary; strict Zod schema validation. | Quarantine payload; alert security engineer; sanitize input. |
| **RSK-04** | **Privacy** | Confidential user document retained on provider servers for AI training | L | H | **CRITICAL** | Paid API contract explicitly forbids training; `store: false` parameter injected; Enterprise ZDR routing for confidential tier. | Immediate provider escalation; purge cached interactions; log incident. |
| **RSK-05** | **AI / Model** | AI model hallucinating non-existent academic or legal citations | M | H | **HIGH** | Factual & Citation Reviewer checks citations against uploaded source provenance IDs before document finalization. | Flag citation as unverified; block one-click export until confirmed. |
| **RSK-06** | **AI / Model** | Primary AI provider (Google GenAI) experiences service outage or 429 spike | M | M | **MEDIUM** | Circuit breaker automatically trips to Anthropic Claude 3.5 Sonnet / Haiku failover adapter. | Display non-intrusive status pill in UI; track latency; auto-restore. |
| **RSK-07** | **Operational**| Chromium / Puppeteer memory leak crashes worker container during batch export | M | M | **MEDIUM** | Worker pool capped at 5 concurrent jobs per container; 2GB RAM allocated; containers restart automatically after 100 jobs. | Container orchestrator auto-restarts failed worker; PGMQ redelivers. |
| **RSK-08** | **Financial** | Free trial users exhausting token budgets via rapid script automation | M | M | **MEDIUM** | Strict rate limits (10 req/min); two-phase token reservation; hard 50,000 monthly token quota ceiling per account. | Temporarily throttle abusive IP; lock account pending CAPTCHA verify. |
| **RSK-09** | **Legal** | User claims DOCORA employment agreement violated local Saudi/UAE labor law | L | H | **HIGH** | Removed "Labor Law Compliant" marketing claim; mandatory prominent legal disclaimer embedded in all contract templates. | Refer user to terms of service; emphasize draft status. |
| **RSK-10** | **Product** | Phase 01 scope creep delaying initial production launch beyond target date | H | M | **HIGH** | Rigid MVP boundary (P0 only); P1 (OCR/Style DNA) and P2 features strictly isolated behind architectural hooks. | Enforce Phase 01 exit criteria; defer non-essential features. |

---

## 3. High-Impact Threat Mitigations & Runbooks

### Runbook A: Quota Race Condition Under High Concurrency
1. **Trigger:** Multiple simultaneous requests from a single user ID attempting to drain more than their remaining quota balance.
2. **Detection:** Database query in `reserve_document_tokens()` executes `SELECT ... FOR UPDATE` on `user_entitlements`.
3. **Mitigation:** The row lock serializes requests. Subsequent concurrent requests immediately read the depleted balance and return HTTP 402 with `QUOTA_EXCEEDED` payload. Zero overdraft occurs.

### Runbook B: Corrupted File Upload (ZIP Bomb / Macro Injection)
1. **Trigger:** User uploads a weaponized `.docx` file containing nested zip archives or VBA macros.
2. **Detection:** Preflight validation checks magic bytes and inspects the central directory for `word/vbaProject.bin`.
3. **Mitigation:** The upload is immediately aborted before passing to storage. An HTTP 400 response is returned:  
   *`"Security Violation: Macro-enabled documents (.docm) are not supported."`*

---
*Verified against Phase 00.1 remediation directives. Approved as baseline risk register and mitigations for Phase 00.2 consolidation.*
