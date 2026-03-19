-- ============================================================
-- Migration 039: Expand org schema
-- 1. Add organization_id to chat_sessions, mcc_state,
--    user_settings, marketing_activity_log
-- 2. Add missing columns to organizations and profiles
-- 3. Create org_settings table
-- All idempotent.
-- ============================================================


-- ─────────────────────────────────────────────────
-- 1a. CHAT_SESSIONS — add organization_id
-- ─────────────────────────────────────────────────
ALTER TABLE chat_sessions
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Backfill from user's profile
UPDATE chat_sessions cs
SET organization_id = p.organization_id
FROM profiles p
WHERE cs.user_id = p.id
  AND cs.organization_id IS NULL;

CREATE INDEX IF NOT EXISTS chat_sessions_organization_id_idx ON chat_sessions(organization_id);


-- ─────────────────────────────────────────────────
-- 1b. MCC_STATE — add organization_id
-- ─────────────────────────────────────────────────
ALTER TABLE mcc_state
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

UPDATE mcc_state ms
SET organization_id = p.organization_id
FROM profiles p
WHERE ms.user_id = p.id
  AND ms.organization_id IS NULL;

CREATE INDEX IF NOT EXISTS mcc_state_organization_id_idx ON mcc_state(organization_id);


-- ─────────────────────────────────────────────────
-- 1c. USER_SETTINGS — add organization_id
-- ─────────────────────────────────────────────────
ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

UPDATE user_settings us
SET organization_id = p.organization_id
FROM profiles p
WHERE us.user_id = p.id
  AND us.organization_id IS NULL;

CREATE INDEX IF NOT EXISTS user_settings_organization_id_idx ON user_settings(organization_id);


-- ─────────────────────────────────────────────────
-- 1d. MARKETING_ACTIVITY_LOG — add organization_id + enable RLS
-- (No prior migration file — created directly in DB)
-- ─────────────────────────────────────────────────
ALTER TABLE marketing_activity_log
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

UPDATE marketing_activity_log mal
SET organization_id = p.organization_id
FROM profiles p
WHERE mal.user_id = p.id
  AND mal.organization_id IS NULL;

CREATE INDEX IF NOT EXISTS marketing_activity_log_organization_id_idx ON marketing_activity_log(organization_id);

-- Ensure RLS is enabled (may have been created without it)
ALTER TABLE marketing_activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own marketing activity" ON marketing_activity_log;
CREATE POLICY "Users see own marketing activity"
  ON marketing_activity_log FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own marketing activity" ON marketing_activity_log;
CREATE POLICY "Users insert own marketing activity"
  ON marketing_activity_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own marketing activity" ON marketing_activity_log;
CREATE POLICY "Users update own marketing activity"
  ON marketing_activity_log FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Org owners delete marketing activity" ON marketing_activity_log;
CREATE POLICY "Org owners delete marketing activity"
  ON marketing_activity_log FOR DELETE
  USING (
    auth.uid() = user_id
    OR get_my_role() IN ('owner', 'admin')
  );


-- ─────────────────────────────────────────────────
-- 2a. ORGANIZATIONS — add missing columns
-- ─────────────────────────────────────────────────
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS nmls TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS brand_color TEXT DEFAULT '#C9A84C',
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'starter'
    CHECK (plan IN ('starter', 'pro', 'team'));


-- ─────────────────────────────────────────────────
-- 2b. PROFILES — add missing LO-specific columns
-- ─────────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS nmls_individual TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS states_licensed TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS email_signature TEXT;


-- ─────────────────────────────────────────────────
-- 3. ORG_SETTINGS — integration config per org
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS org_settings (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  los_type            TEXT,                         -- 'arive' | 'encompass' | 'bytepro' | etc.
  arive_webhook_url   TEXT,
  outlook_email       TEXT,
  n8n_webhook_url     TEXT,
  mailchimp_list_ids  JSONB       DEFAULT '[]'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS org_settings_organization_id_idx ON org_settings(organization_id);

ALTER TABLE org_settings ENABLE ROW LEVEL SECURITY;

-- Org members can read their org's settings
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'org_settings' AND policyname = 'Org members can read settings'
  ) THEN
    CREATE POLICY "Org members can read settings"
      ON org_settings FOR SELECT
      USING (organization_id = get_my_organization_id());
  END IF;
END $$;

-- Only owners and admins can update settings
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'org_settings' AND policyname = 'Org owners can update settings'
  ) THEN
    CREATE POLICY "Org owners can update settings"
      ON org_settings FOR UPDATE
      USING (
        organization_id = get_my_organization_id()
        AND get_my_role() IN ('owner', 'admin')
      )
      WITH CHECK (
        organization_id = get_my_organization_id()
        AND get_my_role() IN ('owner', 'admin')
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'org_settings' AND policyname = 'Org owners can insert settings'
  ) THEN
    CREATE POLICY "Org owners can insert settings"
      ON org_settings FOR INSERT
      WITH CHECK (
        organization_id = get_my_organization_id()
        AND get_my_role() IN ('owner', 'admin')
      );
  END IF;
END $$;

-- Seed a default org_settings row for every existing org that doesn't have one
INSERT INTO org_settings (organization_id)
SELECT id FROM organizations
WHERE id NOT IN (SELECT organization_id FROM org_settings)
ON CONFLICT DO NOTHING;
