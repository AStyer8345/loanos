-- ============================================================
-- Migration 048: Add organization_id to contact_activity
-- contact_activity was missed when 030 added org_id to other tables.
-- Idempotent: uses IF NOT EXISTS pattern.
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'contact_activity' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE contact_activity ADD COLUMN organization_id UUID REFERENCES organizations(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_contact_activity_organization_id ON public.contact_activity (organization_id);

-- Backfill from the related contact's organization_id
UPDATE contact_activity ca
SET organization_id = c.organization_id
FROM contacts c
WHERE ca.contact_id = c.id
  AND ca.organization_id IS NULL
  AND c.organization_id IS NOT NULL;

-- RLS: allow org members to select their own contact_activity rows
DROP POLICY IF EXISTS "org_select_contact_activity" ON contact_activity;
CREATE POLICY "org_select_contact_activity" ON contact_activity
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- RLS: allow org members to insert contact_activity rows
DROP POLICY IF EXISTS "org_insert_contact_activity" ON contact_activity;
CREATE POLICY "org_insert_contact_activity" ON contact_activity
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

ALTER TABLE contact_activity ENABLE ROW LEVEL SECURITY;
