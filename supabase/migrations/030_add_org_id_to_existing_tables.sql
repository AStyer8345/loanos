-- ============================================================
-- Migration 030: Add organization_id to existing tables
-- Idempotent: all column adds use IF NOT EXISTS pattern
-- Does NOT drop or alter any existing columns.
-- Tables confirmed present: loans, contacts, activity_log, todo_items
-- Note: "tasks" table does not exist — todo_items is the equivalent.
-- ============================================================

-- ─────────────────────────────────────────────────
-- LOANS
-- ─────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'loans' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE loans ADD COLUMN organization_id UUID REFERENCES organizations(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS loans_organization_id_idx ON loans(organization_id);

-- ─────────────────────────────────────────────────
-- CONTACTS
-- ─────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'contacts' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE contacts ADD COLUMN organization_id UUID REFERENCES organizations(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS contacts_organization_id_idx ON contacts(organization_id);

-- ─────────────────────────────────────────────────
-- ACTIVITY_LOG
-- ─────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'activity_log' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE activity_log ADD COLUMN organization_id UUID REFERENCES organizations(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS activity_log_organization_id_idx ON activity_log(organization_id);

-- ─────────────────────────────────────────────────
-- TODO_ITEMS (equivalent of "tasks")
-- ─────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'todo_items' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE todo_items ADD COLUMN organization_id UUID REFERENCES organizations(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS todo_items_organization_id_idx ON todo_items(organization_id);
