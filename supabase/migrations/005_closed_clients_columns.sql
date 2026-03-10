-- Migration 005: Add columns for Closed Clients import + Import feature
-- Run in Supabase SQL editor
-- Idempotent — uses IF NOT EXISTS pattern via DO blocks

-- ─────────────────────────────────────────────────
-- CONTACTS table additions
-- ─────────────────────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'salesforce_id'
  ) THEN
    ALTER TABLE contacts ADD COLUMN salesforce_id TEXT UNIQUE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'closing_date'
  ) THEN
    ALTER TABLE contacts ADD COLUMN closing_date DATE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'realtor_email'
  ) THEN
    ALTER TABLE contacts ADD COLUMN realtor_email TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'realtor_phone'
  ) THEN
    ALTER TABLE contacts ADD COLUMN realtor_phone TEXT;
  END IF;
END $$;

-- ─────────────────────────────────────────────────
-- LOANS table additions
-- (closing_date already added in migration 003 — skip)
-- ─────────────────────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loans' AND column_name = 'interest_rate'
  ) THEN
    ALTER TABLE loans ADD COLUMN interest_rate NUMERIC(6,4);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loans' AND column_name = 'borrower_name'
  ) THEN
    ALTER TABLE loans ADD COLUMN borrower_name TEXT;
  END IF;
END $$;

-- ─────────────────────────────────────────────────
-- Index for fast salesforce_id lookups during import
-- ─────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_contacts_salesforce_id ON contacts(salesforce_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email_lower ON contacts(LOWER(email));
