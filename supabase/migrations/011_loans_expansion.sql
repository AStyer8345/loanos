-- 011_loans_expansion.sql
-- Expand loans table with full ARIVE field set

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

-- Ensure arive_loan_id has UNIQUE constraint (may already exist)
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
