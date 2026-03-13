-- ============================================================
-- LoanOS — Combined Pending Migrations (006 partial, 008, 011, 012, 013)
-- All statements are IDEMPOTENT (safe to re-run)
-- Paste this ENTIRE block into Supabase SQL Editor and click "Run"
-- ============================================================

-- ════════════════════════════════════════════════════════════
-- MIGRATION 006 (PARTIAL): activity_log FK columns
-- (These columns should have been added but weren't)
-- ════════════════════════════════════════════════════════════

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'activity_log' AND column_name = 'loan_id'
  ) THEN
    ALTER TABLE activity_log ADD COLUMN loan_id UUID REFERENCES loans(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'activity_log' AND column_name = 'contact_id'
  ) THEN
    ALTER TABLE activity_log ADD COLUMN contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_activity_log_loan_id ON activity_log(loan_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_contact_id ON activity_log(contact_id);


-- ════════════════════════════════════════════════════════════
-- MIGRATION 008: Outlook Integration
-- ════════════════════════════════════════════════════════════

-- outlook_tokens table
CREATE TABLE IF NOT EXISTS outlook_tokens (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  access_token  TEXT        NOT NULL,
  refresh_token TEXT        NOT NULL,
  expires_at    TIMESTAMPTZ NOT NULL,
  email         TEXT        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_outlook_tokens_email ON outlook_tokens(email);

-- activity_log extensions
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'activity_log' AND column_name = 'type'
  ) THEN
    ALTER TABLE activity_log ADD COLUMN type TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'activity_log' AND column_name = 'summary'
  ) THEN
    ALTER TABLE activity_log ADD COLUMN summary TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'activity_log' AND column_name = 'raw_payload'
  ) THEN
    ALTER TABLE activity_log ADD COLUMN raw_payload JSONB;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'activity_log' AND column_name = 'external_id'
  ) THEN
    ALTER TABLE activity_log ADD COLUMN external_id TEXT;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_activity_log_type_external_id
  ON activity_log(type, external_id)
  WHERE type IS NOT NULL AND external_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_activity_log_contact_created
  ON activity_log(contact_id, created_at DESC)
  WHERE contact_id IS NOT NULL;

-- oauth_state table
CREATE TABLE IF NOT EXISTS oauth_state (
  state      TEXT        PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  used_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_oauth_state_created ON oauth_state(created_at);


-- ════════════════════════════════════════════════════════════
-- MIGRATION 011: Loans Table Expansion (Arive fields)
-- ════════════════════════════════════════════════════════════

ALTER TABLE loans
  ADD COLUMN IF NOT EXISTS borrower_first_name    TEXT,
  ADD COLUMN IF NOT EXISTS borrower_last_name     TEXT,
  ADD COLUMN IF NOT EXISTS borrower_email         TEXT,
  ADD COLUMN IF NOT EXISTS borrower_phone         TEXT,
  ADD COLUMN IF NOT EXISTS co_borrower_name       TEXT,
  ADD COLUMN IF NOT EXISTS co_borrower_email      TEXT,
  ADD COLUMN IF NOT EXISTS co_borrower_phone      TEXT,

  ADD COLUMN IF NOT EXISTS loan_number            TEXT,
  ADD COLUMN IF NOT EXISTS loan_name              TEXT,

  ADD COLUMN IF NOT EXISTS loan_amount            NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS loan_purpose           TEXT,
  ADD COLUMN IF NOT EXISTS loan_type              TEXT,
  ADD COLUMN IF NOT EXISTS loan_program           TEXT,
  ADD COLUMN IF NOT EXISTS loan_term              INTEGER,
  ADD COLUMN IF NOT EXISTS interest_rate          NUMERIC(8,5),
  ADD COLUMN IF NOT EXISTS apr                    NUMERIC(8,5),
  ADD COLUMN IF NOT EXISTS points                 NUMERIC(8,5),
  ADD COLUMN IF NOT EXISTS down_payment           NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS down_payment_pct       NUMERIC(8,5),
  ADD COLUMN IF NOT EXISTS ltv                    NUMERIC(8,5),
  ADD COLUMN IF NOT EXISTS cltv                   NUMERIC(8,5),

  ADD COLUMN IF NOT EXISTS property_address       TEXT,
  ADD COLUMN IF NOT EXISTS property_city          TEXT,
  ADD COLUMN IF NOT EXISTS property_state         TEXT,
  ADD COLUMN IF NOT EXISTS property_zip           TEXT,
  ADD COLUMN IF NOT EXISTS property_county        TEXT,
  ADD COLUMN IF NOT EXISTS property_type          TEXT,
  ADD COLUMN IF NOT EXISTS occupancy_type         TEXT,
  ADD COLUMN IF NOT EXISTS purchase_price         NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS appraised_value        NUMERIC(14,2),

  ADD COLUMN IF NOT EXISTS milestone              TEXT,
  ADD COLUMN IF NOT EXISTS application_date       DATE,
  ADD COLUMN IF NOT EXISTS submission_date        DATE,
  ADD COLUMN IF NOT EXISTS approval_date          DATE,
  ADD COLUMN IF NOT EXISTS closing_date           DATE,
  ADD COLUMN IF NOT EXISTS funding_date           DATE,
  ADD COLUMN IF NOT EXISTS rate_lock_expiration   DATE,
  ADD COLUMN IF NOT EXISTS estimated_closing_date DATE,

  ADD COLUMN IF NOT EXISTS monthly_payment        NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS piti                   NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS cash_to_close          NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS seller_credits         NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS lender_credits         NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS loan_costs             NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS total_closing_costs    NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS prepaid_items          NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS escrow_impounds        NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS mi_monthly             NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS mi_upfront             NUMERIC(14,2),

  ADD COLUMN IF NOT EXISTS credit_score           INTEGER,
  ADD COLUMN IF NOT EXISTS middle_score           INTEGER,
  ADD COLUMN IF NOT EXISTS monthly_income         NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS front_end_dti          NUMERIC(8,5),
  ADD COLUMN IF NOT EXISTS back_end_dti           NUMERIC(8,5),
  ADD COLUMN IF NOT EXISTS monthly_debts          NUMERIC(14,2),

  ADD COLUMN IF NOT EXISTS referring_agent_name   TEXT,
  ADD COLUMN IF NOT EXISTS referring_agent_email  TEXT,
  ADD COLUMN IF NOT EXISTS referring_agent_phone  TEXT,
  ADD COLUMN IF NOT EXISTS listing_agent_name     TEXT,
  ADD COLUMN IF NOT EXISTS listing_agent_email    TEXT,
  ADD COLUMN IF NOT EXISTS buyers_agent_name      TEXT,
  ADD COLUMN IF NOT EXISTS buyers_agent_email     TEXT,
  ADD COLUMN IF NOT EXISTS title_company          TEXT,
  ADD COLUMN IF NOT EXISTS title_contact          TEXT,
  ADD COLUMN IF NOT EXISTS title_email            TEXT,
  ADD COLUMN IF NOT EXISTS escrow_officer         TEXT,
  ADD COLUMN IF NOT EXISTS processor_name         TEXT,
  ADD COLUMN IF NOT EXISTS underwriter_name       TEXT,
  ADD COLUMN IF NOT EXISTS lender_name            TEXT,
  ADD COLUMN IF NOT EXISTS investor_name          TEXT,
  ADD COLUMN IF NOT EXISTS channel                TEXT,

  ADD COLUMN IF NOT EXISTS lead_source            TEXT,
  ADD COLUMN IF NOT EXISTS referral_source        TEXT,
  ADD COLUMN IF NOT EXISTS marketing_campaign     TEXT,

  ADD COLUMN IF NOT EXISTS notes                  TEXT,
  ADD COLUMN IF NOT EXISTS loan_created_date      DATE,
  ADD COLUMN IF NOT EXISTS arive_created_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS arive_updated_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS synced_at              TIMESTAMPTZ DEFAULT NOW();

-- Ensure arive_loan_id UNIQUE constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'loans'
      AND constraint_type = 'UNIQUE'
      AND constraint_name = 'loans_arive_loan_id_key'
  ) THEN
    ALTER TABLE loans ADD CONSTRAINT loans_arive_loan_id_key UNIQUE (arive_loan_id);
  END IF;
END
$$;


-- ════════════════════════════════════════════════════════════
-- MIGRATION 012: Contacts Table Expansion
-- ════════════════════════════════════════════════════════════

ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS created_date       TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS last_activity_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS notes              TEXT,
  ADD COLUMN IF NOT EXISTS phone_mobile       TEXT,
  ADD COLUMN IF NOT EXISTS mailing_street     TEXT,
  ADD COLUMN IF NOT EXISTS mailing_city       TEXT,
  ADD COLUMN IF NOT EXISTS mailing_state      TEXT,
  ADD COLUMN IF NOT EXISTS mailing_zip        TEXT,
  ADD COLUMN IF NOT EXISTS mailing_country    TEXT,
  ADD COLUMN IF NOT EXISTS title              TEXT;


-- ════════════════════════════════════════════════════════════
-- MIGRATION 013: Email Drafts Table
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS email_drafts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  loan_id UUID REFERENCES loans(id) ON DELETE SET NULL,
  automation_name TEXT NOT NULL,
  recipient_name TEXT,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_preview TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'discarded')),
  outlook_draft_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at (reuses existing trigger function from 001)
CREATE TRIGGER update_email_drafts_updated_at
  BEFORE UPDATE ON email_drafts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_email_drafts_created_at ON email_drafts(created_at DESC);
CREATE INDEX idx_email_drafts_status ON email_drafts(status);
CREATE INDEX idx_email_drafts_contact_id ON email_drafts(contact_id);

-- RLS
ALTER TABLE email_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON email_drafts
  USING (true) WITH CHECK (true);


-- ════════════════════════════════════════════════════════════
-- DONE — All 5 migrations applied.
-- ════════════════════════════════════════════════════════════