-- DOCORA Phase 02 Migration 0005: Adaptive Intelligence, Multi-Agent Review & 14-Vector Quality Scoring
-- Enforces ADR-003, ADR-005 & Phase 02 Guardrails:
--   1. Zero Phase Leakage: Contains strictly Phase 02 tables (no Phase 03 OCR/Style DNA or Phase 04 Skills Registry/Team Workspaces).
--   2. ENABLE ROW LEVEL SECURITY & FORCE ROW LEVEL SECURITY on 100% of tables.
--   3. Hardened SECURITY DEFINER functions with SET search_path = '', fully schema-qualified table names (public.*),
--      REVOKE ALL FROM PUBLIC, anon, and strict auth.uid() derivation.
--   4. Hard constraint on agent_review_rounds: round_number CHECK (round_number BETWEEN 1 AND 2).

-- 1. Model Routing Telemetry & Circuit Breaker Audit Log
CREATE TABLE IF NOT EXISTS public.model_routing_telemetry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  requested_capability TEXT NOT NULL CHECK (char_length(requested_capability) BETWEEN 2 AND 120),
  complexity_score INT NOT NULL CHECK (complexity_score BETWEEN 1 AND 10),
  selected_model_id TEXT NOT NULL CHECK (selected_model_id IN ('gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemini-4-argon')),
  fallback_triggered BOOLEAN NOT NULL DEFAULT false,
  fallback_reason TEXT,
  circuit_state TEXT NOT NULL DEFAULT 'CLOSED' CHECK (circuit_state IN ('CLOSED', 'OPEN', 'HALF_OPEN')),
  store_stateless BOOLEAN NOT NULL DEFAULT true CHECK (store_stateless = true),
  estimated_cost_usd NUMERIC(12, 6) NOT NULL DEFAULT 0 CHECK (estimated_cost_usd >= 0),
  latency_ms INT NOT NULL DEFAULT 0 CHECK (latency_ms >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_model_routing_user_created
  ON public.model_routing_telemetry (user_id, created_at DESC);

ALTER TABLE public.model_routing_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_routing_telemetry FORCE ROW LEVEL SECURITY;

CREATE POLICY "routing_telemetry_select_own"
  ON public.model_routing_telemetry
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "routing_telemetry_insert_own"
  ON public.model_routing_telemetry
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- 2. Bounded 9-Role Multi-Agent Review Sessions
CREATE TABLE IF NOT EXISTS public.agent_review_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  idempotency_key TEXT NOT NULL UNIQUE CHECK (char_length(idempotency_key) BETWEEN 8 AND 160),
  ledger_tx_id UUID REFERENCES public.token_usage_ledger(id) ON DELETE SET NULL,
  routed_model_id TEXT NOT NULL CHECK (routed_model_id IN ('gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemini-4-argon')),
  status TEXT NOT NULL DEFAULT 'RUNNING' CHECK (status IN ('RUNNING', 'COMPLETED', 'HALTED_BUDGET', 'BLOCKED_HARD_GATE', 'FAILED')),
  max_rounds INT NOT NULL DEFAULT 2 CHECK (max_rounds = 2),
  rounds_executed INT NOT NULL DEFAULT 1 CHECK (rounds_executed BETWEEN 1 AND 2),
  token_budget_ceiling INT NOT NULL DEFAULT 35000 CHECK (token_budget_ceiling BETWEEN 500 AND 120000),
  tokens_consumed INT NOT NULL DEFAULT 0 CHECK (tokens_consumed >= 0),
  inline_proposals JSONB NOT NULL DEFAULT '[]'::jsonb,
  provenance_audit JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_session_tokens_within_ceiling CHECK (tokens_consumed <= token_budget_ceiling)
);

CREATE INDEX IF NOT EXISTS idx_agent_sessions_user_doc
  ON public.agent_review_sessions (user_id, document_id, created_at DESC);

ALTER TABLE public.agent_review_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_review_sessions FORCE ROW LEVEL SECURITY;

CREATE POLICY "agent_review_sessions_select_own"
  ON public.agent_review_sessions
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "agent_review_sessions_insert_own"
  ON public.agent_review_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "agent_review_sessions_update_own"
  ON public.agent_review_sessions
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- 3. Multi-Agent Review Rounds (Hard Cap: round_number BETWEEN 1 AND 2)
CREATE TABLE IF NOT EXISTS public.agent_review_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.agent_review_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  round_number INT NOT NULL CHECK (round_number BETWEEN 1 AND 2),
  roles_executed JSONB NOT NULL DEFAULT '[]'::jsonb,
  round_findings JSONB NOT NULL DEFAULT '[]'::jsonb,
  round_tokens_used INT NOT NULL DEFAULT 0 CHECK (round_tokens_used >= 0),
  composite_score NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (composite_score BETWEEN 0 AND 100),
  gate_status TEXT NOT NULL CHECK (gate_status IN ('READY', 'READY_WITH_WARNINGS', 'NEEDS_REVISION', 'REQUIRES_HUMAN_REVIEW', 'BLOCKED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, round_number)
);

CREATE INDEX IF NOT EXISTS idx_agent_rounds_session
  ON public.agent_review_rounds (session_id, round_number ASC);

ALTER TABLE public.agent_review_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_review_rounds FORCE ROW LEVEL SECURITY;

CREATE POLICY "agent_review_rounds_select_own"
  ON public.agent_review_rounds
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "agent_review_rounds_insert_own"
  ON public.agent_review_rounds
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- 4. 14-Vector Hybrid Document Quality Reports
CREATE TABLE IF NOT EXISTS public.document_quality_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.agent_review_sessions(id) ON DELETE SET NULL,
  composite_score NUMERIC(5, 2) NOT NULL CHECK (composite_score BETWEEN 0 AND 100),
  gate_status TEXT NOT NULL CHECK (gate_status IN ('READY', 'READY_WITH_WARNINGS', 'NEEDS_REVISION', 'REQUIRES_HUMAN_REVIEW', 'BLOCKED')),
  hard_gate_triggered BOOLEAN NOT NULL DEFAULT false,
  blocking_reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
  dimensions JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quality_reports_doc_created
  ON public.document_quality_reports (document_id, created_at DESC);

ALTER TABLE public.document_quality_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_quality_reports FORCE ROW LEVEL SECURITY;

CREATE POLICY "quality_reports_select_own"
  ON public.document_quality_reports
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "quality_reports_insert_own"
  ON public.document_quality_reports
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- 5. Hardened SECURITY DEFINER Function to Record a Bounded Review Round
CREATE OR REPLACE FUNCTION public.record_agent_review_round(
  p_session_id UUID,
  p_round_number INT,
  p_roles_executed JSONB,
  p_round_findings JSONB,
  p_round_tokens_used INT,
  p_composite_score NUMERIC,
  p_gate_status TEXT
)
RETURNS public.agent_review_rounds
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID;
  v_session public.agent_review_sessions%ROWTYPE;
  v_round public.agent_review_rounds%ROWTYPE;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: auth.uid() is NULL';
  END IF;

  IF p_round_number IS NULL OR p_round_number < 1 OR p_round_number > 2 THEN
    RAISE EXCEPTION 'Bound Violation: round_number (%) must be BETWEEN 1 AND 2', p_round_number;
  END IF;

  IF p_round_tokens_used IS NULL OR p_round_tokens_used < 0 THEN
    RAISE EXCEPTION 'Invalid round_tokens_used: must be a non-negative integer';
  END IF;

  IF p_composite_score IS NULL OR p_composite_score < 0 OR p_composite_score > 100 THEN
    RAISE EXCEPTION 'Invalid composite_score: must be BETWEEN 0 AND 100';
  END IF;

  IF p_gate_status IS NULL OR p_gate_status NOT IN ('READY', 'READY_WITH_WARNINGS', 'NEEDS_REVISION', 'REQUIRES_HUMAN_REVIEW', 'BLOCKED') THEN
    RAISE EXCEPTION 'Invalid gate_status: %', p_gate_status;
  END IF;

  SELECT * INTO v_session
  FROM public.agent_review_sessions AS s
  WHERE s.id = p_session_id
    AND s.user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Forbidden: Review session not found or belongs to another tenant';
  END IF;

  IF (v_session.tokens_consumed + p_round_tokens_used) > v_session.token_budget_ceiling THEN
    RAISE EXCEPTION 'Token budget ceiling exceeded for review session';
  END IF;

  INSERT INTO public.agent_review_rounds (
    session_id,
    user_id,
    round_number,
    roles_executed,
    round_findings,
    round_tokens_used,
    composite_score,
    gate_status
  )
  VALUES (
    p_session_id,
    v_user_id,
    p_round_number,
    COALESCE(p_roles_executed, '[]'::jsonb),
    COALESCE(p_round_findings, '[]'::jsonb),
    p_round_tokens_used,
    p_composite_score,
    p_gate_status
  )
  RETURNING * INTO v_round;

  UPDATE public.agent_review_sessions
  SET rounds_executed = GREATEST(rounds_executed, p_round_number),
      tokens_consumed = tokens_consumed + p_round_tokens_used,
      status = CASE
        WHEN p_gate_status = 'BLOCKED' THEN 'BLOCKED_HARD_GATE'
        ELSE 'COMPLETED'
      END,
      updated_at = now()
  WHERE id = p_session_id;

  RETURN v_round;
END;
$$;

REVOKE ALL ON FUNCTION public.record_agent_review_round(UUID, INT, JSONB, JSONB, INT, NUMERIC, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_agent_review_round(UUID, INT, JSONB, JSONB, INT, NUMERIC, TEXT) TO authenticated, service_role;
