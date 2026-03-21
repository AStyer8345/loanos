-- Migration: create system_prompts table
-- This table was created ad-hoc without a migration. Adding the canonical
-- migration file for schema tracking. Table already exists in production.

CREATE TABLE IF NOT EXISTS public.system_prompts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name        text NOT NULL,
  content     text NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  updated_by  uuid REFERENCES auth.users(id),
  UNIQUE (org_id, name)
);

-- RLS
ALTER TABLE public.system_prompts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'system_prompts' AND policyname = 'org_members_system_prompts'
  ) THEN
    CREATE POLICY org_members_system_prompts ON public.system_prompts
      FOR ALL
      USING (org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()))
      WITH CHECK (org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
  END IF;
END $$;
