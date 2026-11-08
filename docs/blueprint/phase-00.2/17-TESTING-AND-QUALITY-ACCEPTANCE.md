# DOCORA — Testing & Quality Acceptance Strategy (Phase 00.2 Remediation v1.2.2)

**Document Reference:** `DOCORA-17-TEST-v1.2.2`  
**Status:** CONSOLIDATED ARCHITECTURE BASELINE (POST-REVIEW REMEDIATED)  
**Audit Predecessors:** Phase 00 (`11-TESTING-STRATEGY.md`), Phase 00.1 (`09-UPDATED-TESTING-STRATEGY.md`), Phase 00.2 Baseline  

---

## 1. Architectural Philosophy: Empirical Evidence over Assumptions

In DOCORA, no architectural claim is considered validated until it is verified by an automated test suite or empirical benchmark. 

> **Constitutional Gate Standard:**  
> *Because Phase 00.2 is strictly a DOCUMENTATION-ONLY planning phase, all runtime execution gates (visual SSIM, OCR character error rates, database throughput, live tenant isolation enforcement) are honestly classified as **NOT TESTED**. They will transition to **PASS** or **FAIL** strictly when executed against running code in Phase 01.*

---

## 2. Multi-Tier Testing Topology

```
+----------------------------------------------------------------------------------------------------+
|                                    DOCORA TEST PYRAMID                                             |
+----------------------------------------------------------------------------------------------------+
|  1. End-to-End User Journeys (Playwright Test)                                                     |
|     - Complete flows: Prompt -> Outline -> Canvas Edit -> Export -> Download                      |
|     - Non-interactive CI execution ($env:CI = "true") across Chromium and WebKit                  |
|                                                                                                    |
|  2. Document Fidelity & Visual Regression Benchmarks                                              |
|     - Pixel-level SSIM visual regression against 100-document Golden Suite (Specified for Phase 01)|
|     - Layout delta measurement (< 2.0mm) between editor canvas and compiled PDF/DOCX               |
|                                                                                                    |
|  3. Automated Security & Penetration Suites                                                        |
|     - Multi-tenant RLS bypass test suite (Simulate malicious Tenant B accessing Tenant A)         |
|     - Privileged stored procedure audit (search_path = '', caller ID validation)                  |
|     - Malicious file injection (ZIP bombs, macro documents, SVG XSS)                              |
|                                                                                                    |
|  4. Integration & Service Tests (Vitest)                                                          |
|     - PGMQ message lifecycle: Enqueue -> Lock -> Process -> Delete / DLQ                           |
|     - Two-phase token ledger: Reserve -> Reconcile -> Quota Race Prevention                        |
|                                                                                                    |
|  5. Unit Tests & Schema Validators (Vitest)                                                        |
|     - Canonical Document Model (CDM v1.2) Zod parsing & normalization                              |
|     - Unicode BiDi text isolation & RTL Kashida handling                                           |
|     - Intelligent Model Router score evaluation math                                               |
+----------------------------------------------------------------------------------------------------+
```

---

## 3. Detailed Test Suite Specifications

### 3.1 Security & RLS Isolation Suite (`tests/security/rls.test.ts`)
- **Objective:** Mathematically prove zero cross-tenant leakage.
- **Methodology:**
  1. Test fixture provisions Tenant A and Tenant B with independent GoTrue JWTs.
  2. Tenant B attempts direct `SELECT`, `UPDATE`, and `DELETE` on Tenant A's documents, folders, style profiles, and assets.
  3. Tenant B invokes `reserve_document_tokens(p_user_id = Tenant_A_ID)`.
- **Pass Threshold:** 100% of unauthorized queries return zero rows or throw `Access Denied` exception.
- **Status:** **SPECIFIED (Runtime Execution: NOT TESTED)**.

### 3.2 Document Engine Fidelity Benchmark (`tests/engine/fidelity.test.ts`)
- **Objective:** Quantify visual and structural accuracy.
- **Methodology:**
  1. Render Golden Suite documents in headless Chromium.
  2. Compile identical CDM payloads into PDF (Puppeteer) and DOCX (`docx` 9.1.x).
  3. Convert DOCX to PDF via LibreOffice headless.
  4. Compare rasterized PDF pages using `pixelmatch` and SSIM algorithms at 300 DPI with 1px Gaussian blur.
- **Pass Threshold:** $\text{SSIM} \ge 0.95$, Layout coordinate delta $\le 2.0\text{mm}$, Text preservation $= 100\%$.
- **Status:** **SPECIFIED (Runtime Execution: NOT TESTED)**.

### 3.3 Token Ledger & Idempotency Suite (`tests/billing/ledger.test.ts`)
- **Objective:** Ensure financial and quota accounting integrity under concurrency.
- **Methodology:**
  1. Dispatch 10 concurrent requests with identical `idempotency_key`.
  2. Dispatch 10 concurrent requests with unique keys exceeding user's remaining quota balance.
- **Pass Threshold:** Exactly 1 reservation succeeds for identical key; quota race condition fails cleanly without over-drafting.
- **Status:** **SPECIFIED (Runtime Execution: NOT TESTED)**.

---

## 4. Phase 00.2 Quality Gates & Status Registry (Remediated)

To eliminate any confusion between architectural documentation completeness and actual runtime verification, the gates explicitly separate specification from runtime enforcement:

| Gate ID | Area / Capability | Verification Scope | Status | Notes / Blocker |
| :--- | :--- | :--- | :---: | :--- |
| **GATE-01** | Architecture Consistency | 100% internal alignment across all 26 deliverables | **PASS** | Specification complete; zero contradictions. |
| **GATE-02** | Technology Compatibility | Verified against official release channels (Next.js 16.4.5, React 19.2.0, Tiptap 3.x, Tesseract 5.5.4) | **PASS** | Target versions patched against known advisories (GHSA-vf7v-2h4f-6f4j) and verified for LTS. |
| **GATE-03** | Security & RLS Specification | Schema design, RLS policies, and `SECURITY DEFINER` function patterns | **PASS** | Specification complete; search_path secured in spec. |
| **GATE-03R**| Runtime Security Enforcement | Automated multi-tenant RLS bypass penetration tests | **NOT TESTED** | Requires running database test suite in Phase 01. |
| **GATE-04** | Document Visual Fidelity | Word/PDF SSIM $\ge 0.95$ visual regression | **NOT TESTED** | Golden Suite is specified but not yet populated. |
| **GATE-05** | Bilingual Arabic Shaping | HarfBuzz rendering of complex ligatures & BiDi spans | **NOT TESTED** | Requires browser runtime in Phase 01. |
| **GATE-06** | OCR Accuracy (Arabic/Eng) | Character Error Rate (CER) on scanned PDF benchmarks | **NOT TESTED** | Requires running Tesseract 5.5.4 worker fleet. |
| **GATE-07** | Queue Fault Tolerance | Worker crash & visibility timeout recovery test | **NOT TESTED** | Requires live PGMQ execution in Phase 01. |
| **GATE-08** | Real-World Token Cost | Measured token cost under live multi-user concurrency | **NOT TESTED** | Requires live multi-user telemetry in Phase 01. |

---
*Verified against official release channels as of November 6, 2026. Approved as updated testing strategy.*
