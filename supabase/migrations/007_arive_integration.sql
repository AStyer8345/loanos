-- ============================================================
-- LoanOS — Migration 007: Arive Integration Schema
-- Adds columns needed for Arive → n8n → Supabase webhook pipeline.
-- Runs in parallel with existing Zapier/Salesforce flows — no conflicts.
-- Safe to run on existing project — all changes use IF NOT EXISTS guards.
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- CONTACTS — Arive-mapped address + CRM fields
-- ─────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'mailing_street') THEN
    ALTER TABLE contacts ADD COLUMN mailing_street TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'mailing_city') THEN
    ALTER TABLE contacts ADD COLUMN mailing_city TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'mailing_state') THEN
    ALTER TABLE contacts ADD COLUMN mailing_state TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'mailing_zip') THEN
    ALTER TABLE contacts ADD COLUMN mailing_zip TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'group_tag') THEN
    ALTER TABLE contacts ADD COLUMN group_tag TEXT DEFAULT 'Client';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'stage') THEN
    ALTER TABLE contacts ADD COLUMN stage TEXT DEFAULT 'Lead';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'source') THEN
    ALTER TABLE contacts ADD COLUMN source TEXT;
  END IF;
END $$;

-- UNIQUE CONSTRAINT on contacts.email — required for upsert-on-conflict in n8n.
-- NOTE: If this fails, you have duplicate emails in contacts.
-- Check first: SELECT email, COUNT(*) FROM contacts WHERE email IS NOT NULL GROUP BY email HAVING COUNT(*) > 1;
-- Resolve duplicates, then re-run.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contacts_email_unique') THEN
    BEGIN
      ALTER TABLE contacts ADD CONSTRAINT contacts_email_unique UNIQUE (email);
      RAISE NOTICE 'SUCCESS: contacts_email_unique constraint added.';
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'SKIPPED: contacts_email_unique could not be added — duplicate emails exist. Deduplicate contacts first, then re-run.';
    END;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- LOANS — Arive-specific fields
-- ─────────────────────────────────────────────────────────────

-- arive_loan_id: the Arive system identifier — used as upsert key
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'arive_loan_id') THEN
    ALTER TABLE loans ADD COLUMN arive_loan_id TEXT;
  END IF;
END $$;

-- UNIQUE CONSTRAINT on arive_loan_id — safe because all existing loans have NULL
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'loans_arive_loan_id_unique') THEN
    ALTER TABLE loans ADD CONSTRAINT loans_arive_loan_id_unique UNIQUE (arive_loan_id);
    RAISE NOTICE 'SUCCESS: loans_arive_loan_id_unique constraint added.';
  END IF;
END $$;

-- Arive key dates
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'first_payment_date') THEN
    ALTER TABLE loans ADD COLUMN first_payment_date DATE;
  END IF;
END $$;

-- est_closing_date: from keyDates_closingContingencyDate (distinct from closing_date from migration 003)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'est_closing_date') THEN
    ALTER TABLE loans ADD COLUMN est_closing_date DATE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'funding_date') THEN
    ALTER TABLE loans ADD COLUMN funding_date DATE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'sales_contract_date') THEN
    ALTER TABLE loans ADD COLUMN sales_contract_date DATE;
  END IF;
END $$;

-- raw_payload: full Arive webhook body for debugging / future field expansion
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'raw_payload') THEN
    ALTER TABLE loans ADD COLUMN raw_payload JSONB;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_loans_arive_loan_id ON loans(arive_loan_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_source ON contacts(source);

-- ─────────────────────────────────────────────────────────────
-- NOTE ON RLS + SERVICE ROLE
-- Supabase service role key bypasses ALL RLS policies natively.
-- No additional policies are needed for n8n to write using service role key.
-- Existing user-based policies continue to protect the LoanOS frontend.
-- LOANOS_SYSTEM_USER_ID must be set in n8n environment variables to satisfy
-- the NOT NULL user_id constraint on contacts, loans, and activity_log.
-- ─────────────────────────────────────────────────────────────
