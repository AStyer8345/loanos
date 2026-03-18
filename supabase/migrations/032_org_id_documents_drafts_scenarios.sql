-- ============================================================
-- Migration 032: Add organization_id to documents, email_drafts, scenarios
-- Idempotent: uses IF NOT EXISTS pattern
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE documents ADD COLUMN organization_id UUID REFERENCES organizations(id);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS documents_organization_id_idx ON documents(organization_id);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'email_drafts' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE email_drafts ADD COLUMN organization_id UUID REFERENCES organizations(id);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS email_drafts_organization_id_idx ON email_drafts(organization_id);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'scenarios' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN organization_id UUID REFERENCES organizations(id);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS scenarios_organization_id_idx ON scenarios(organization_id);
