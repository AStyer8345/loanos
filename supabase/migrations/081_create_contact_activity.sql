-- ============================================================
-- Migration 081: Create contact_activity table
-- This table was referenced by code and migration 048 but never
-- actually created. Creates it now with full schema + RLS.
-- Idempotent: uses IF NOT EXISTS.
-- ============================================================

CREATE TABLE IF NOT EXISTS contact_activity (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id      UUID        REFERENCES contacts(id) ON DELETE CASCADE,
  activity_type   TEXT        CHECK (activity_type IN ('call', 'email', 'text', 'note')),
  notes           TEXT,
  logged_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by      TEXT,
  loan_id         UUID        REFERENCES loans(id) ON DELETE SET NULL,
  user_id         UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id UUID        NOT NULL REFERENCES organizations(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contact_activity_contact_id ON contact_activity(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_activity_organization_id ON contact_activity(organization_id);
CREATE INDEX IF NOT EXISTS idx_contact_activity_logged_at ON contact_activity(logged_at DESC);

-- Enable RLS
ALTER TABLE contact_activity ENABLE ROW LEVEL SECURITY;

-- RLS policies (org-scoped)
DROP POLICY IF EXISTS "org_select_contact_activity" ON contact_activity;
CREATE POLICY "org_select_contact_activity" ON contact_activity
  FOR SELECT USING (
    organization_id = get_my_organization_id()
  );

DROP POLICY IF EXISTS "org_insert_contact_activity" ON contact_activity;
CREATE POLICY "org_insert_contact_activity" ON contact_activity
  FOR INSERT WITH CHECK (
    organization_id = get_my_organization_id()
  );

DROP POLICY IF EXISTS "org_delete_contact_activity" ON contact_activity;
CREATE POLICY "org_delete_contact_activity" ON contact_activity
  FOR DELETE USING (
    organization_id = get_my_organization_id()
  );
