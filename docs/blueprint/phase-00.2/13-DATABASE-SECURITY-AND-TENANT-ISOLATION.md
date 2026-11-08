# DOCORA — Database Security, RLS & Tenant Isolation Architecture (Phase 00.2)

**Document Reference:** `DOCORA-13-DB-v1.2`  
**Status:** CONSOLIDATED ARCHITECTURE BASELINE  
**Audit Predecessors:** Phase 00 (`08-DATABASE-DESIGN.md`), Phase 00.1 (`05-UPDATED-DATABASE-AND-SECURITY.md`)  

---

## 1. Architectural Philosophy: Multi-Tenant Defense-in-Depth

In DOCORA, database security does not rely on application-level `WHERE` clauses. If an engineer accidentally omits a filter in a Next.js API route, the database itself must unconditionally block unauthorized cross-tenant data access.

The data tier enforces three layers of isolation:
1. **Row-Level Security (RLS):** Enabled and enforced on 100% of public schema tables.
2. **Entitlement Isolation:** Administrative billing and quota records are strictly separated from client-editable user profiles.
3. **Privileged Function Hardening:** All `SECURITY DEFINER` functions enforce empty search paths, explicit caller authentication checks, and revoked public execute grants.

---

## 2. Core Relational Schema & Tenant Isolation Design

```
+----------------------------------------------------------------------------------------------------+
|                                      DOCORA RELATIONAL TOPOLOGY                                    |
+----------------------------------------------------------------------------------------------------+
|  auth.users (Supabase Managed Auth)                                                                |
|       |                                                                                            |
|       +--> profiles (Public read, user-editable: name, avatar, bio)                                |
|       +--> user_entitlements (SERVICE_ROLE ONLY: tier, monthly_token_quota, period_dates)          |
|       +--> token_usage_ledger (Immutable append-only: reservations, charges, refunds)              |
|       +--> workspaces (Tenant boundary: personal or team workspaces)                               |
|                 |                                                                                  |
|                 +--> workspace_members (RBAC: owner, editor, viewer)                               |
|                 +--> folders (Hierarchical organization, workspace-isolated)                       |
|                 +--> documents (CDM JSON, status, workspace & folder scoped)                       |
|                 |         |                                                                        |
|                 |         +--> document_versions (Immutable historical snapshots)                  |
|                 |         +--> assets (Uploaded images, PDFs; storage bucket references)           |
|                 |                                                                                  |
|                 +--> user_style_profiles (Style DNA profiles, user-scoped)                         |
+----------------------------------------------------------------------------------------------------+
```

---

## 3. Remediating Privilege Escalation: Entitlements & Token Accounting

### The Vulnerability in Phase 00
In Phase 00, `profiles.monthly_token_quota` resided on the same table that users could edit via client-side Supabase calls. A malicious user could execute `supabase.from('profiles').update({ monthly_token_quota: 999999999 })`, granting themselves infinite AI tokens.

### The Phase 00.2 Hardened Architecture
1. **Physical Table Separation:** Profile metadata is kept in `profiles`, while billing allowances live in `user_entitlements`.
2. **Locked RLS on Entitlements:** `user_entitlements` has RLS enabled with **zero client UPDATE policies**. Only the backend `service_role` or hardened internal stored procedures can alter quotas.
3. **Two-Phase Token Accounting Ledger:** All token operations are tracked in an immutable `token_usage_ledger`:
   - `RESERVATION`: Locks estimated tokens before starting an AI generation job.
   - `RECONCILIATION`: Records exact provider-reported token usage and refunds unused reservations.
   - `REFUND`: Credits tokens back if a job fails or times out.

---

## 4. Hardened PostgreSQL Function Patterns (Conceptual SQL)

The following conceptual patterns govern all privileged stored procedures:

```sql
-- 1. Create Immutable Token Usage Ledger Table
CREATE TABLE public.token_usage_ledger (
    ledger_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    transaction_type VARCHAR(32) NOT NULL CHECK (transaction_type IN ('RESERVATION', 'CONSUMPTION', 'REFUND')),
    token_amount INT NOT NULL,
    idempotency_key VARCHAR(128) NOT NULL UNIQUE,
    provider_interaction_id VARCHAR(128),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Hardened Token Deduction Function with Empty search_path
CREATE OR REPLACE FUNCTION public.reserve_document_tokens(
    p_user_id UUID,
    p_estimated_tokens INT,
    p_idempotency_key VARCHAR(128)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_caller_id UUID;
    v_current_balance INT;
    v_quota_limit INT;
    v_period_start TIMESTAMPTZ;
    v_period_end TIMESTAMPTZ;
    v_result JSONB;
BEGIN
    -- Authenticate caller: Verify authenticated user matches target user
    v_caller_id := (SELECT auth.uid());
    IF v_caller_id IS NULL OR v_caller_id <> p_user_id THEN
        RAISE EXCEPTION 'Access Denied: Unauthenticated or caller mismatch';
    END IF;

    -- Retrieve current entitlement bounds with FOR UPDATE to prevent race conditions
    SELECT 
        monthly_token_quota, billing_period_start, billing_period_end
    INTO 
        v_quota_limit, v_period_start, v_period_end
    FROM public.user_entitlements
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Entitlement record not found for user';
    END IF;

    -- Calculate consumed tokens in current billing period
    SELECT COALESCE(SUM(token_amount), 0)
    INTO v_current_balance
    FROM public.token_usage_ledger
    WHERE user_id = p_user_id
      AND transaction_type IN ('RESERVATION', 'CONSUMPTION')
      AND created_at >= v_period_start
      AND created_at <= v_period_end;

    -- Enforce Quota Ceiling
    IF (v_current_balance + p_estimated_tokens) > v_quota_limit THEN
        RETURN jsonb_build_object(
            'success', false,
            'error_code', 'QUOTA_EXCEEDED',
            'remaining_tokens', GREATEST(0, v_quota_limit - v_current_balance)
        );
    END IF;

    -- Record Immutable Reservation with Idempotency Key
    INSERT INTO public.token_usage_ledger (
        user_id, token_amount, transaction_type, idempotency_key
    ) VALUES (
        p_user_id, p_estimated_tokens, 'RESERVATION', p_idempotency_key
    );

    RETURN jsonb_build_object(
        'success', true,
        'reserved_tokens', p_estimated_tokens,
        'remaining_tokens', (v_quota_limit - (v_current_balance + p_estimated_tokens))
    );
END;
$$;

-- Revoke dangerous public execution permissions
REVOKE EXECUTE ON FUNCTION public.reserve_document_tokens(UUID, INT, VARCHAR) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reserve_document_tokens(UUID, INT, VARCHAR) TO authenticated;
```

---

## 5. Trust Boundaries & Storage Access Control

### Diagram 9: Database & Storage Trust Boundaries

```mermaid
flowchart TD
    subgraph Client_Boundary ["Client Boundary (Browser)"]
        ClientApp["Next.js Client Application"]
    end

    subgraph Edge_Boundary ["Application Server (Edge / Node 24)"]
        ServerRoute["API Route Handler (JWT Auth)"]
        StorageSigner["Presigned URL Generator"]
    end

    subgraph Data_Boundary ["Data & Storage Core (Supabase)"]
        PostgresCore[("PostgreSQL with Enforced RLS")]
        S3Bucket[("S3 Storage (document-assets Bucket)")]
    end

    ClientApp -->|1. Request Asset Upload / View| ServerRoute
    ServerRoute -->|2. Verify User Ownership of Document & Asset| PostgresCore
    
    PostgresCore -->>|3. Ownership Confirmed| ServerRoute
    ServerRoute -->|4. Generate Scoped Signed URL (60s Expiry)| StorageSigner
    StorageSigner --> S3Bucket
    
    StorageSigner -->>|5. Return Signed URL to Client| ClientApp
    ClientApp -->|6. Direct Upload / Download via Signed URL| S3Bucket
```

---

## 6. Ownership Invariants & Constraint Rules

To prevent cross-tenant or cross-workspace contamination:
1. **Composite Foreign Keys:** Documents reference both `workspace_id` and `folder_id`. A foreign key constraint `FOREIGN KEY (workspace_id, folder_id) REFERENCES public.folders(workspace_id, id)` ensures a document can never reference a folder belonging to a different workspace.
2. **Safe Folder Deletion:** Folders use `ON DELETE RESTRICT` by default. Deleting a folder requires explicit user choice to either move documents to root or cascade-delete them.
3. **Durable Asset References:** Documents store permanent object keys (`tenants/{userId}/docs/{docId}/{assetId}.png`) rather than expiring signed URLs. Signed URLs are generated on-demand with 60-second time-to-live.

---
*Verified against Phase 00.1 remediation directives. Approved as baseline database security and tenant isolation architecture for Phase 00.2 consolidation.*
