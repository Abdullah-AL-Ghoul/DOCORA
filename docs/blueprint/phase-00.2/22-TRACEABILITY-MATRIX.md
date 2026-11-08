# DOCORA — Master Traceability & Governance Matrix (Phase 00.2)

**Document Reference:** `DOCORA-22-TRACE-v1.2`  
**Status:** CONSOLIDATED ARCHITECTURE BASELINE  
**Audit Predecessors:** Phase 00 (`01-PRODUCT-REQUIREMENTS.md`), Phase 00.1 (`15-TRACEABILITY-MATRIX.md`)  

---

## 1. Architectural Traceability Protocol

To prevent orphan requirements, unaccounted risks, or untestable designs, every requirement in DOCORA maps symmetrically across four vectors:
$$\text{Requirement} \longleftrightarrow \text{Architecture Deliverable} \longleftrightarrow \text{Decision (ADR)} \longleftrightarrow \text{Risk Mitigation} \longleftrightarrow \text{Verification Test}$$

---

## 2. Requirements-to-Architecture Traceability

| Requirement ID & Summary | Primary Architecture Deliverable | Governing ADR | Mitigated Risk | Verification Test Suite |
| :--- | :--- | :--- | :--- | :--- |
| **FR-01: Prompt-to-Document** | `01-PRODUCT-NORTH-STAR-AND-REQUIREMENTS.md` | ADR-004 | RSK-10 | `tests/e2e/doc-create.test.ts` |
| **FR-02: Bilingual Virtual Canvas**| `04-CANONICAL-DOCUMENT-MODEL-AND-EDITOR.md` | ADR-001 | RSK-01 | `tests/editor/bidi-cursor.test.ts` |
| **FR-03: Multi-Format Export** | `11-DOCX-PDF-AND-RENDERING-ENGINE.md` | ADR-002 | RSK-01 | `tests/engine/fidelity.test.ts` |
| **FR-04: File Intelligence & OCR**| `12-FILE-INTELLIGENCE-AND-OCR-PIPELINE.md` | ADR-004 | RSK-03 | `tests/ocr/extraction.test.ts` |
| **FR-05: Multi-Model Router** | `05-MULTI-MODEL-REGISTRY-AND-INTELLIGENT-ROUTER.md` | ADR-006 | RSK-06 | `tests/router/failover.test.ts` |
| **FR-06: Multi-Agent Review** | `06-MULTI-AGENT-ORCHESTRATION-AND-REVIEW.md` | ADR-007 | RSK-05 | `tests/agents/supervisor.test.ts` |
| **FR-07: Style DNA Learning** | `08-STYLE-DNA-AND-PERSONAL-DOCUMENT-LEARNING.md` | ADR-009 | RSK-04 | `tests/style/isolation.test.ts` |
| **FR-08: Quality Scoring** | `09-DOCUMENT-QUALITY-SCORING-ENGINE.md` | ADR-010 | RSK-05 | `tests/quality/gates.test.ts` |
| **NFR-01: Latency & FCP** | `03-CONSOLIDATED-SYSTEM-ARCHITECTURE.md` | ADR-004 | RSK-07 | `tests/perf/lighthouse.test.ts` |
| **NFR-02: Document Fidelity** | `11-DOCX-PDF-AND-RENDERING-ENGINE.md` | ADR-002 | RSK-01 | `tests/engine/fidelity.test.ts` |
| **NFR-03: Security & RLS** | `13-DATABASE-SECURITY-AND-TENANT-ISOLATION.md` | ADR-005 | RSK-02 | `tests/security/rls.test.ts` |
| **NFR-04: Queue Reliability** | `15-QUEUES-WORKERS-AND-RELIABILITY.md` | ADR-011 | RSK-07 | `tests/queue/pgmq.test.ts` |
| **NFR-05: Bilingual a11y** | `16-UX-AND-MVP-SCOPE.md` | ADR-004 | RSK-09 | `tests/a11y/wcag.test.ts` |

---

## 3. Decisions-to-Risks Mapping

| Architecture Decision (ADR) | Addressed Risks | Operational Safeguard | Status |
| :--- | :--- | :--- | :---: |
| **ADR-001 (Tiptap v2 + Virtual Canvas)** | RSK-01 (Arabic layout bugs) | Open-source core; eliminates commercial registry supply-chain risk | PENDING OWNER APPROVAL |
| **ADR-002 (Puppeteer + `docx` Export)** | RSK-01 (Export rendering flaws) | Dual-engine approach; 100% canvas match for PDF, clean OOXML for Word | PENDING OWNER APPROVAL |
| **ADR-003 (Gemini Paid + `store: false`)** | RSK-04 (Data retention/training) | Disables conversation caching; enforces 55-day abuse log purge | PENDING OWNER APPROVAL |
| **ADR-004 (Strict MVP P0 Scope)** | RSK-10 (Scope creep) | Isolates P1/P2 capabilities behind architectural interfaces | PENDING OWNER APPROVAL |
| **ADR-005 (Two-Phase Token Ledger)** | RSK-02, RSK-08 (Billing fraud) | Physical table separation; atomic reservation stored procedures | PENDING OWNER APPROVAL |
| **ADR-006 (Capability Model Router)** | RSK-06 (Provider outages) | Dynamic circuit breaker with automated Anthropic failover | PROPOSED |
| **ADR-007 (9-Role Bounded Agents)** | RSK-05, RSK-08 (Hallucinations) | Hard 2-round cap; strict token budget ceiling | PROPOSED |
| **ADR-008 (Governed Skills Registry)** | RSK-03 (Malicious skill traps) | Declarative JSON manifests; zero arbitrary code execution | PROPOSED |
| **ADR-009 (Style DNA Profiles)** | RSK-04 (Cross-tenant leaks) | Zero model fine-tuning; strict PostgreSQL RLS tenant isolation | PROPOSED |
| **ADR-010 (14-Vector Quality Scoring)** | RSK-05 (Unverified claims) | Critical failure hard gate overrides composite score | PROPOSED |
| **ADR-011 (Supabase PGMQ Queues)** | RSK-07 (Worker crashes) | Operation-level idempotency key prevents duplicate execution | PROPOSED |

---

## 4. Pending Product Owner Decisions (Pre-Implementation Blockers)

The following 5 decisions represent strategic business choices that require explicit Product Owner sign-off before implementation code is written in Phase 01:

1. **ADR-001:** Approval to standardize on Open-Source Tiptap v2 + In-House Virtual Canvas (Bypassing Tiptap Pro Pages commercial license).
2. **ADR-002:** Approval of Dual-Engine Export (Puppeteer for PDF + `docx` npm for DOCX).
3. **ADR-003:** Approval of AI Provider Privacy Policy (Google GenAI Paid with `store: false` default).
4. **ADR-004:** Approval of Strict MVP P0 Scope (Deferring real-time collaboration and local desktop app).
5. **ADR-005:** Approval of 50,000 Token Free Monthly Quota and Subscription Tiers (\$19 / \$49).

---
*Verified against Phase 00.1 remediation directives. Approved as master traceability matrix for Phase 00.2 consolidation.*
