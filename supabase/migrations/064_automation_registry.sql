-- ============================================================
-- Migration 064: Automation Registry + Runs tables
-- Creates the central registry for all 40 automations and
-- a run history table. Also alters email_drafts for new columns.
-- ============================================================

-- automation_registry
CREATE TABLE IF NOT EXISTS automation_registry (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  group_name text NOT NULL,
  source text NOT NULL CHECK (source IN ('claude_code', 'n8n', 'supabase_setting')),
  source_id text NOT NULL,
  source_node_id text,
  trigger_type text NOT NULL CHECK (trigger_type IN ('webhook', 'schedule', 'manual', 'disabled')),
  schedule text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'errored', 'disabled')),
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  prompt_snapshot text,
  email_template text,
  email_mode text CHECK (email_mode IN ('ai_generated', 'fixed_template', 'hybrid')),
  email_variables jsonb,
  email_test_data jsonb,
  last_run_at timestamptz,
  last_run_summary text,
  last_run_status text CHECK (last_run_status IN ('success', 'error', 'no_changes')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Unique constraint: one registry entry per source_id per org
CREATE UNIQUE INDEX IF NOT EXISTS automation_registry_org_source_idx
  ON automation_registry(org_id, source_id);

-- automation_runs
CREATE TABLE IF NOT EXISTS automation_runs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  automation_id uuid NOT NULL REFERENCES automation_registry(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('success', 'error', 'running')),
  summary text,
  full_log text,
  changes_made jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS automation_runs_automation_idx
  ON automation_runs(automation_id, started_at DESC);

-- Alter email_drafts — add automation_id and personalization_notes
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_drafts' AND column_name = 'automation_id'
  ) THEN
    ALTER TABLE email_drafts ADD COLUMN automation_id uuid REFERENCES automation_registry(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_drafts' AND column_name = 'personalization_notes'
  ) THEN
    ALTER TABLE email_drafts ADD COLUMN personalization_notes text;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE automation_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_runs ENABLE ROW LEVEL SECURITY;
