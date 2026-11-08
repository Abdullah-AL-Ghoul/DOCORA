-- DOCORA Phase 01 MVP Migration 0004: PGMQ Export Jobs, Leases, Heartbeats & Fencing Tokens
-- Enforces ADR-011 & Guardrail #2:
--   Dedicated worker orchestration with Visibility Timeout Leases, Heartbeats, Fencing Tokens, and DLQ.
--   Zero Phase Leakage: No Style DNA (Phase 03) or Skills Registry (Phase 04) tables exist in Phase 01.

CREATE EXTENSION IF NOT EXISTS "pgmq";

CREATE TABLE IF NOT EXISTS public.export_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  format TEXT NOT NULL CHECK (format IN ('docx', 'pdf')),
  idempotency_key TEXT NOT NULL UNIQUE CHECK (char_length(idempotency_key) BETWEEN 8 AND 160),
  status TEXT NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'LEASED', 'COMPLETED', 'FAILED', 'DLQ')),
  attempt_count INT NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  max_attempts INT NOT NULL DEFAULT 3 CHECK (max_attempts BETWEEN 1 AND 5),
  fencing_token BIGINT NOT NULL DEFAULT 0 CHECK (fencing_token >= 0),
  worker_id TEXT,
  lease_expires_at TIMESTAMPTZ,
  heartbeat_at TIMESTAMPTZ,
  artifact_storage_path TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_export_jobs_poll
  ON public.export_jobs (status, lease_expires_at, created_at);

ALTER TABLE public.export_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.export_jobs FORCE ROW LEVEL SECURITY;

CREATE POLICY "export_jobs_select_own"
  ON public.export_jobs
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "export_jobs_insert_own"
  ON public.export_jobs
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Worker lease acquisition function: increments fencing_token atomically
CREATE OR REPLACE FUNCTION public.claim_next_export_job(
  p_worker_id TEXT,
  p_visibility_timeout_seconds INT DEFAULT 60
)
RETURNS public.export_jobs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_job public.export_jobs%ROWTYPE;
BEGIN
  SELECT * INTO v_job
  FROM public.export_jobs AS ej
  WHERE (
    ej.status = 'QUEUED'
    OR (ej.status = 'LEASED' AND ej.lease_expires_at < now())
  )
  AND ej.attempt_count < ej.max_attempts
  ORDER BY ej.created_at ASC
  FOR UPDATE SKIP LOCKED
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  UPDATE public.export_jobs
  SET status = 'LEASED',
      worker_id = p_worker_id,
      attempt_count = attempt_count + 1,
      fencing_token = fencing_token + 1,
      heartbeat_at = now(),
      lease_expires_at = now() + make_interval(secs => p_visibility_timeout_seconds),
      updated_at = now()
  WHERE id = v_job.id
  RETURNING * INTO v_job;

  RETURN v_job;
END;
$$;

-- Worker heartbeat extension guarded by fencing_token
CREATE OR REPLACE FUNCTION public.heartbeat_export_job(
  p_job_id UUID,
  p_worker_id TEXT,
  p_fencing_token BIGINT,
  p_extend_seconds INT DEFAULT 60
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_updated INT;
BEGIN
  UPDATE public.export_jobs
  SET heartbeat_at = now(),
      lease_expires_at = now() + make_interval(secs => p_extend_seconds),
      updated_at = now()
  WHERE id = p_job_id
    AND worker_id = p_worker_id
    AND fencing_token = p_fencing_token
    AND status = 'LEASED';

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated = 1;
END;
$$;

-- Worker completion commit guarded by fencing_token (prevents zombie worker overwrite)
CREATE OR REPLACE FUNCTION public.complete_export_job(
  p_job_id UUID,
  p_fencing_token BIGINT,
  p_artifact_storage_path TEXT
)
RETURNS public.export_jobs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_job public.export_jobs%ROWTYPE;
BEGIN
  SELECT * INTO v_job
  FROM public.export_jobs
  WHERE id = p_job_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Export job % not found', p_job_id;
  END IF;

  IF v_job.fencing_token <> p_fencing_token THEN
    RAISE EXCEPTION 'Stale fencing token: expected %, got %', v_job.fencing_token, p_fencing_token;
  END IF;

  UPDATE public.export_jobs
  SET status = 'COMPLETED',
      artifact_storage_path = p_artifact_storage_path,
      lease_expires_at = NULL,
      updated_at = now()
  WHERE id = p_job_id
  RETURNING * INTO v_job;

  RETURN v_job;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_next_export_job(TEXT, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_next_export_job(TEXT, INT) TO service_role;

REVOKE ALL ON FUNCTION public.heartbeat_export_job(UUID, TEXT, BIGINT, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.heartbeat_export_job(UUID, TEXT, BIGINT, INT) TO service_role;

REVOKE ALL ON FUNCTION public.complete_export_job(UUID, BIGINT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_export_job(UUID, BIGINT, TEXT) TO service_role;
