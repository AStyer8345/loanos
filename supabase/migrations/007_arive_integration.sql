-- ============================================================
-- LoanOS — Migration 007: Arive Integration Schema
-- Adds columns needed for Arive → n8n → Supabase webhook pipeline.
-- Runs in parallel with existing Zapier/Salesforce flows — no conflicts.
-- Safe to run on existing project — all ADD COLUMN use IF NOT EXISTS.
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- CONTACTS — Arive-mapped address + CRM fields
-- ─────────────────────────────────────────────────────────────
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS mailing_street TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS mailing_city  TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS mailing_state TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS mailing_zip   TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS group_tag     TEXT DEFAULT 'Client';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS stage         TEXT DEFAULT 'Lead';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS source        TEXT;

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
ALTER TABLE loans ADD COLUMN IF NOT EXISTS arive_loan_id       TEXT;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS first_payment_date  DATE;
-- est_closing_date: from keyDates_closingContingencyDate (distinct from closing_date in migration 003)
ALTER TABLE loans ADD COLUMN IF NOT EXISTS est_closing_date    DATE;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS funding_date        DATE;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS sales_contract_date DATE;
-- raw_payload: full Arive webhook body for debugging / future field expansion
ALTER TABLE loans ADD COLUMN IF NOT EXISTS raw_payload         JSONB;

-- UNIQUE CONSTRAINT on arive_loan_id — safe because all existing loans have NULL
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'loans_arive_loan_id_unique') THEN
    ALTER TABLE loans ADD CONSTRAINT loans_arive_loan_id_unique UNIQUE (arive_loan_id);
    RAISE NOTICE 'SUCCESS: loans_arive_loan_id_unique constraint added.';
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_loans_arive_loan_id ON loans(arive_loan_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email      ON contacts(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_source     ON contacts(source);

-- ─────────────────────────────────────────────────────────────
-- NOTE ON RLS + SERVICE ROLE
-- Supabase service role key bypasses ALL RLS policies natively.
-- No additional policies are needed for n8n to write using service role key.
-- Existing user-based policies continue to protect the LoanOS frontend.
-- LOANOS_SYSTEM_USER_ID must be set in n8n environment variables to satisfy
-- the NOT NULL user_id constraint on contacts, loans, and activity_log.
-- ─────────────────────────────────────────────────────────────
