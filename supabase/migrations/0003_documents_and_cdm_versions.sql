-- DOCORA Phase 01 MVP Migration 0003: Documents & CDM v1.2 Versions
-- Zero Phase Leakage: Contains strictly Phase 01 document storage and versioning.

CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 240),
  locale TEXT NOT NULL DEFAULT 'ar' CHECK (locale IN ('ar', 'en')),
  direction TEXT NOT NULL DEFAULT 'rtl' CHECK (direction IN ('rtl', 'ltr', 'auto')),
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'legal', 'executive', 'financial', 'technical')),
  requires_legal_disclaimer BOOLEAN NOT NULL DEFAULT false,
  current_version INT NOT NULL DEFAULT 1 CHECK (current_version >= 1),
  cdm_snapshot JSONB NOT NULL,
  trashed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documents_owner_active
  ON public.documents (owner_id, updated_at DESC)
  WHERE trashed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_documents_cdm_gin
  ON public.documents USING GIN (cdm_snapshot);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents FORCE ROW LEVEL SECURITY;

CREATE POLICY "documents_select_own"
  ON public.documents
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = owner_id);

CREATE POLICY "documents_insert_own"
  ON public.documents
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = owner_id);

CREATE POLICY "documents_update_own"
  ON public.documents
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = owner_id)
  WITH CHECK ((SELECT auth.uid()) = owner_id);

CREATE POLICY "documents_delete_own"
  ON public.documents
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = owner_id);

CREATE TABLE IF NOT EXISTS public.document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version_number INT NOT NULL CHECK (version_number >= 1),
  cdm_snapshot JSONB NOT NULL,
  change_summary TEXT NOT NULL DEFAULT 'Autosave checkpoint',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (document_id, version_number)
);

ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_versions FORCE ROW LEVEL SECURITY;

CREATE POLICY "document_versions_select_own"
  ON public.document_versions
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = owner_id);

CREATE POLICY "document_versions_insert_own"
  ON public.document_versions
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = owner_id);
