# DOCORA — Production Readiness & Operational Runbook
**Document Code:** DOC-OPS-2026-001  
**Classification:** Operational Runbook & Production Readiness Review  
**Date:** 2026-11-09  
**Status:** Ready for Staging / Production Promotion

---

## 1. Production Readiness Checklist

| Category | Requirement | Implementation / Proof | Status |
|---|---|---|---|
| **Security** | Zero Header-based Tenant Spoofing | `verifyAuthenticatedUser()` derives identity strictly from validated session cookies | **READY** |
| **Security** | Multi-Tenant Data Isolation | PostgreSQL RLS enabled and forced across all tables | **READY** |
| **Security** | Defense-in-Depth Authentication | Edge Proxy + DAL independent session checks | **READY** |
| **Data Integrity** | Document Persistence | PostgreSQL `documents` + `document_versions` with optimistic concurrency | **READY** |
| **Data Integrity** | Autosave Reliability | Debounced 300ms saves with status indicators (`saved`, `saving`, `offline`) | **READY** |
| **AI Governance** | Atomic Token Accounting | Two-phase reserve/settle ledger with `FOR UPDATE` row locks | **READY** |
| **AI Governance** | Stateless Privacy Mode | `store: false` configured; transparent ZDR legal disclosures | **READY** |
| **Export Fidelity** | Microsoft Word OOXML | `docx@9.15.2` with `<w:bidiVisual/>` for native RTL table layout | **READY** |
| **Export Fidelity** | Vector PDF Generation | Standards-compliant ISO 32000-1 binary vector PDF with A4 physical pagination | **READY** |
| **Ingestion** | Binary PDF Parsing | Server-side binary byte parsing, size limits (25MB), and ZIP bomb guards | **READY** |
| **Accessibility** | WCAG 2.2 Level AA | Zero axe-core violations, $44 \times 44\text{px}$ touch targets, high contrast | **READY** |
| **CI/CD** | Automated Pipeline | GitHub Actions workflow (`typecheck`, `test`, `build`) configured | **READY** |

---

## 2. Environment Configuration & Provisioning Runbook

### 2.1 Required Production Secrets
```bash
# Supabase Production Configuration
NEXT_PUBLIC_SUPABASE_URL="https://<project-id>.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<public-anon-key>"
SUPABASE_SERVICE_ROLE_KEY="<vault-stored-service-role-key>"

# AI Inference Engine
GEMINI_API_KEY="<google-ai-studio-or-vertex-api-key>"

# Node Environment
NODE_ENV="production"
```

### 2.2 Database Migration Runbook
Apply migrations in strict numerical order using the Supabase CLI or direct psql connection:
```bash
supabase db push
# Verifies migrations:
# 0001_iam_and_profiles.sql
# 0002_entitlements_and_token_ledger.sql
# 0003_documents_and_cdm_versions.sql
# 0004_pgmq_export_jobs.sql
# 0005_phase02_intelligence_and_quality.sql
```

---

## 3. Worker Topology & Scaling Architecture

The export pipeline relies on an isolated worker service (`docora-worker`):
1. **Concurrency:** Launch 2+ worker replicas per availability zone.
2. **Worker Loop:** Workers continuously execute `SELECT * FROM public.claim_next_export_job('worker-id')`.
3. **Visibility Timeout:** Default lease duration is 60 seconds; long-running jobs invoke `heartbeat_export_job()` every 20 seconds.
4. **Dead-Letter Queue (DLQ):** Jobs failing more than `max_attempts` (3) are marked `DLQ` and trigger operational alert webhooks.

---

## 4. Rollback & Disaster Recovery Procedures

1. **Application Rollback:** Revert git commit to `cddd3b5` or prior verified deployment tag.
2. **Database Rollback:** All migrations are additive and non-destructive. CDM version history preserves full snapshots in `document_versions`.
3. **Emergency Disablement:** Set `MAINTENANCE_MODE=true` to suspend AI generation while preserving local draft export.
