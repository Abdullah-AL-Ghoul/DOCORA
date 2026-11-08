-- DOCORA Phase 01 MVP Migration 0002: Entitlements & Hardened Two-Phase Token Ledger
-- Enforces ADR-005 & Guardrail #3:
--   1. SECURITY DEFINER SET search_path = '' with fully schema-qualified references
--   2. REVOKE ALL FROM PUBLIC, anon
--   3. Client-callable reserve_tokens derives user strictly from auth.uid() (never trusts client p_user_id)
--   4. Atomic Reserve -> Settle -> Refund/Release lifecycle with SELECT ... FOR UPDATE & idempotency_key UNIQUE

CREATE TABLE IF NOT EXISTS public.user_entitlements (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_tier TEXT NOT NULL DEFAULT 'free' CHECK (plan_tier IN ('free', 'pro', 'enterprise')),
  monthly_token_limit INT NOT NULL DEFAULT 50000 CHECK (monthly_token_limit >= 0),
  tokens_used INT NOT NULL DEFAULT 0 CHECK (tokens_used >= 0),
  tokens_reserved INT NOT NULL DEFAULT 0 CHECK (tokens_reserved >= 0),
  period_start TIMESTAMPTZ NOT NULL DEFAULT date_trunc('month', now()),
  period_end TIMESTAMPTZ NOT NULL DEFAULT (date_trunc('month', now()) + INTERVAL '1 month'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_token_budget_within_limit CHECK (tokens_used + tokens_reserved <= monthly_token_limit)
);

ALTER TABLE public.user_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_entitlements FORCE ROW LEVEL SECURITY;

-- Authenticated users can read their own entitlement balance, but NEVER insert/update/delete directly
CREATE POLICY "entitlements_select_own"
  ON public.user_entitlements
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE TABLE IF NOT EXISTS public.token_usage_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  idempotency_key TEXT NOT NULL UNIQUE CHECK (char_length(idempotency_key) BETWEEN 8 AND 160),
  model_id TEXT NOT NULL CHECK (model_id IN ('gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemini-4-argon')),
  status TEXT NOT NULL CHECK (status IN ('RESERVED', 'SETTLED', 'REFUNDED', 'EXPIRED')),
  reserved_tokens INT NOT NULL CHECK (reserved_tokens > 0),
  actual_input_tokens INT NOT NULL DEFAULT 0 CHECK (actual_input_tokens >= 0),
  actual_output_tokens INT NOT NULL DEFAULT 0 CHECK (actual_output_tokens >= 0),
  settled_tokens INT NOT NULL DEFAULT 0 CHECK (settled_tokens >= 0),
  refunded_tokens INT NOT NULL DEFAULT 0 CHECK (refunded_tokens >= 0),
  lease_expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '10 minutes'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_token_ledger_user_created
  ON public.token_usage_ledger (user_id, created_at DESC);

ALTER TABLE public.token_usage_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_usage_ledger FORCE ROW LEVEL SECURITY;

CREATE POLICY "ledger_select_own"
  ON public.token_usage_ledger
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- 1. Client-callable reservation function: derives identity STRICTLY from auth.uid()
CREATE OR REPLACE FUNCTION public.reserve_tokens(
  p_estimated_tokens INT,
  p_idempotency_key TEXT,
  p_model_id TEXT DEFAULT 'gemini-3.8-flash'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID;
  v_existing_tx_id UUID;
  v_entitlement public.user_entitlements%ROWTYPE;
  v_tx_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: auth.uid() is NULL';
  END IF;

  IF p_estimated_tokens IS NULL OR p_estimated_tokens <= 0 THEN
    RAISE EXCEPTION 'Invalid token reservation amount';
  END IF;

  IF p_idempotency_key IS NULL OR char_length(p_idempotency_key) < 8 THEN
    RAISE EXCEPTION 'Invalid idempotency_key';
  END IF;

  -- Idempotency check before mutating balance
  SELECT l.id INTO v_existing_tx_id
  FROM public.token_usage_ledger AS l
  WHERE l.idempotency_key = p_idempotency_key
    AND l.user_id = v_user_id;

  IF v_existing_tx_id IS NOT NULL THEN
    RETURN v_existing_tx_id;
  END IF;

  -- Lock entitlement row to prevent race conditions / concurrent double-spend
  SELECT * INTO v_entitlement
  FROM public.user_entitlements AS ue
  WHERE ue.user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Entitlement record not found for authenticated user';
  END IF;

  -- Block Free Tier access to gemini-4-argon per ADR-003
  IF v_entitlement.plan_tier = 'free' AND p_model_id = 'gemini-4-argon' THEN
    RAISE EXCEPTION 'Model gemini-4-argon is not available on the Free Tier';
  END IF;

  IF (v_entitlement.tokens_used + v_entitlement.tokens_reserved + p_estimated_tokens) > v_entitlement.monthly_token_limit THEN
    RAISE EXCEPTION 'Insufficient token quota for reservation';
  END IF;

  UPDATE public.user_entitlements
  SET tokens_reserved = tokens_reserved + p_estimated_tokens,
      updated_at = now()
  WHERE user_id = v_user_id;

  INSERT INTO public.token_usage_ledger (
    user_id,
    idempotency_key,
    model_id,
    status,
    reserved_tokens,
    lease_expires_at
  )
  VALUES (
    v_user_id,
    p_idempotency_key,
    p_model_id,
    'RESERVED',
    p_estimated_tokens,
    now() + INTERVAL '10 minutes'
  )
  RETURNING id INTO v_tx_id;

  RETURN v_tx_id;
END;
$$;

-- 2. Service-role settlement function: settles actual tokens and refunds unused reservation
CREATE OR REPLACE FUNCTION public.settle_token_reservation(
  p_tx_id UUID,
  p_actual_input_tokens INT,
  p_actual_output_tokens INT
)
RETURNS public.token_usage_ledger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tx public.token_usage_ledger%ROWTYPE;
  v_total_actual INT;
  v_refund INT;
BEGIN
  IF p_actual_input_tokens < 0 OR p_actual_output_tokens < 0 THEN
    RAISE EXCEPTION 'Token counts cannot be negative';
  END IF;

  SELECT * INTO v_tx
  FROM public.token_usage_ledger
  WHERE id = p_tx_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ledger transaction not found';
  END IF;

  IF v_tx.status = 'SETTLED' THEN
    RETURN v_tx;
  END IF;

  IF v_tx.status <> 'RESERVED' THEN
    RAISE EXCEPTION 'Cannot settle transaction in status %', v_tx.status;
  END IF;

  v_total_actual := LEAST(v_tx.reserved_tokens, p_actual_input_tokens + p_actual_output_tokens);
  v_refund := GREATEST(0, v_tx.reserved_tokens - v_total_actual);

  PERFORM 1
  FROM public.user_entitlements
  WHERE user_id = v_tx.user_id
  FOR UPDATE;

  UPDATE public.user_entitlements
  SET tokens_reserved = GREATEST(0, tokens_reserved - v_tx.reserved_tokens),
      tokens_used = tokens_used + v_total_actual,
      updated_at = now()
  WHERE user_id = v_tx.user_id;

  UPDATE public.token_usage_ledger
  SET status = 'SETTLED',
      actual_input_tokens = p_actual_input_tokens,
      actual_output_tokens = p_actual_output_tokens,
      settled_tokens = v_total_actual,
      refunded_tokens = v_refund,
      updated_at = now()
  WHERE id = p_tx_id
  RETURNING * INTO v_tx;

  RETURN v_tx;
END;
$$;

-- 3. Service-role release/refund function for failed requests or expired leases
CREATE OR REPLACE FUNCTION public.release_token_reservation(
  p_tx_id UUID,
  p_reason_status TEXT DEFAULT 'REFUNDED'
)
RETURNS public.token_usage_ledger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tx public.token_usage_ledger%ROWTYPE;
BEGIN
  IF p_reason_status NOT IN ('REFUNDED', 'EXPIRED') THEN
    RAISE EXCEPTION 'Invalid release status %', p_reason_status;
  END IF;

  SELECT * INTO v_tx
  FROM public.token_usage_ledger
  WHERE id = p_tx_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ledger transaction not found';
  END IF;

  IF v_tx.status IN ('REFUNDED', 'EXPIRED') THEN
    RETURN v_tx;
  END IF;

  IF v_tx.status <> 'RESERVED' THEN
    RAISE EXCEPTION 'Cannot release transaction in status %', v_tx.status;
  END IF;

  PERFORM 1
  FROM public.user_entitlements
  WHERE user_id = v_tx.user_id
  FOR UPDATE;

  UPDATE public.user_entitlements
  SET tokens_reserved = GREATEST(0, tokens_reserved - v_tx.reserved_tokens),
      updated_at = now()
  WHERE user_id = v_tx.user_id;

  UPDATE public.token_usage_ledger
  SET status = p_reason_status,
      settled_tokens = 0,
      refunded_tokens = v_tx.reserved_tokens,
      updated_at = now()
  WHERE id = p_tx_id
  RETURNING * INTO v_tx;

  RETURN v_tx;
END;
$$;

-- Strict Privilege Hardening: Revoke from PUBLIC & anon
REVOKE ALL ON FUNCTION public.reserve_tokens(INT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reserve_tokens(INT, TEXT, TEXT) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.settle_token_reservation(UUID, INT, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.settle_token_reservation(UUID, INT, INT) TO service_role;

REVOKE ALL ON FUNCTION public.release_token_reservation(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.release_token_reservation(UUID, TEXT) TO service_role;
