-- Migration 015: Arive Full Field Expansion
-- Adds all missing Arive payload columns to loans table
-- Creates loan_status_history table for status change auditing
-- 2026-03-13

-- ============================================================
-- SECTION 1: Financial fields
-- ============================================================
ALTER TABLE loans
  ADD COLUMN IF NOT EXISTS hcltv                   NUMERIC,
  ADD COLUMN IF NOT EXISTS base_loan_amount         NUMERIC,
  ADD COLUMN IF NOT EXISTS broker_fee               NUMERIC,
  ADD COLUMN IF NOT EXISTS financed_fees            NUMERIC,
  ADD COLUMN IF NOT EXISTS pi_payment               NUMERIC,
  ADD COLUMN IF NOT EXISTS flood_insurance_monthly  NUMERIC,
  ADD COLUMN IF NOT EXISTS hoa_dues                 NUMERIC,
  ADD COLUMN IF NOT EXISTS buydown                  BOOLEAN,
  ADD COLUMN IF NOT EXISTS impound_waiver           BOOLEAN,
  ADD COLUMN IF NOT EXISTS prepay_penalty           BOOLEAN;

-- ============================================================
-- SECTION 2: Loan product / structure
-- ============================================================
ALTER TABLE loans
  ADD COLUMN IF NOT EXISTS amortization_type        TEXT,
  ADD COLUMN IF NOT EXISTS mortgage_type            TEXT,
  ADD COLUMN IF NOT EXISTS refinance_type           TEXT,
  ADD COLUMN IF NOT EXISTS cashout_purpose          TEXT,
  ADD COLUMN IF NOT EXISTS documentation_type       TEXT,
  ADD COLUMN IF NOT EXISTS lien_position            TEXT,
  ADD COLUMN IF NOT EXISTS lock_status              TEXT,
  ADD COLUMN IF NOT EXISTS compensation_type        TEXT,
  ADD COLUMN IF NOT EXISTS interest_only            BOOLEAN,
  ADD COLUMN IF NOT EXISTS interest_only_term_months INTEGER,
  ADD COLUMN IF NOT EXISTS arm_adjustment_period    INTEGER,
  ADD COLUMN IF NOT EXISTS arm_initial_fixed_months INTEGER;

-- ============================================================
-- SECTION 3: Admin / pipeline
-- ============================================================
ALTER TABLE loans
  ADD COLUMN IF NOT EXISTS status_date             DATE,
  ADD COLUMN IF NOT EXISTS adverse_reason          TEXT,
  ADD COLUMN IF NOT EXISTS lender_nmls             TEXT,
  ADD COLUMN IF NOT EXISTS lender_loan_number      TEXT,
  ADD COLUMN IF NOT EXISTS crm_reference_id        TEXT,
  ADD COLUMN IF NOT EXISTS deep_link_url           TEXT,
  ADD COLUMN IF NOT EXISTS archive_indicator       BOOLEAN,
  ADD COLUMN IF NOT EXISTS processor_email         TEXT,
  ADD COLUMN IF NOT EXISTS tbd_address             BOOLEAN;

-- ============================================================
-- SECTION 4: Borrower extended info
-- ============================================================
ALTER TABLE loans
  ADD COLUMN IF NOT EXISTS borrower_home_phone        TEXT,
  ADD COLUMN IF NOT EXISTS borrower_work_phone        TEXT,
  ADD COLUMN IF NOT EXISTS borrower_mailing_address   TEXT,
  ADD COLUMN IF NOT EXISTS borrower_marital_status    TEXT,
  ADD COLUMN IF NOT EXISTS borrower_preferred_language TEXT,
  ADD COLUMN IF NOT EXISTS first_time_homebuyer       BOOLEAN,
  ADD COLUMN IF NOT EXISTS borrower_applicant_type    TEXT;

-- ============================================================
-- SECTION 5: Property extended info
-- ============================================================
ALTER TABLE loans
  ADD COLUMN IF NOT EXISTS property_units           INTEGER,
  ADD COLUMN IF NOT EXISTS property_unit_number     TEXT,
  ADD COLUMN IF NOT EXISTS property_attachment_type TEXT;

-- ============================================================
-- SECTION 6: Key dates (TRID / workflow)
-- ============================================================
ALTER TABLE loans
  ADD COLUMN IF NOT EXISTS trid_date                    DATE,
  ADD COLUMN IF NOT EXISTS intent_to_proceed_date       DATE,
  ADD COLUMN IF NOT EXISTS initial_le_sent_date         DATE,
  ADD COLUMN IF NOT EXISTS initial_le_signed_date       DATE,
  ADD COLUMN IF NOT EXISTS most_recent_le_sent_date     DATE,
  ADD COLUMN IF NOT EXISTS most_recent_le_signed_date   DATE,
  ADD COLUMN IF NOT EXISTS initial_cd_sent_date         DATE,
  ADD COLUMN IF NOT EXISTS initial_cd_signed_date       DATE,
  ADD COLUMN IF NOT EXISTS most_recent_cd_sent_date     DATE,
  ADD COLUMN IF NOT EXISTS most_recent_cd_signed_date   DATE,
  ADD COLUMN IF NOT EXISTS appraisal_ordered_date       DATE,
  ADD COLUMN IF NOT EXISTS appraisal_delivery_date      DATE,
  ADD COLUMN IF NOT EXISTS appraisal_contingency_date   DATE,
  ADD COLUMN IF NOT EXISTS loan_contingency_date        DATE,
  ADD COLUMN IF NOT EXISTS closing_contingency_date     DATE,
  ADD COLUMN IF NOT EXISTS pre_approval_expiry_date     DATE,
  ADD COLUMN IF NOT EXISTS credit_order_date            DATE,
  ADD COLUMN IF NOT EXISTS credit_import_date           DATE,
  ADD COLUMN IF NOT EXISTS credit_expiration_date       DATE,
  ADD COLUMN IF NOT EXISTS hoi_ordered_date             DATE,
  ADD COLUMN IF NOT EXISTS hoi_received_date            DATE,
  ADD COLUMN IF NOT EXISTS title_ordered_date           DATE,
  ADD COLUMN IF NOT EXISTS title_received_date          DATE,
  ADD COLUMN IF NOT EXISTS tax_transcript_ordered_date  DATE,
  ADD COLUMN IF NOT EXISTS tax_transcript_received_date DATE,
  ADD COLUMN IF NOT EXISTS epo_date                     DATE,
  ADD COLUMN IF NOT EXISTS signed_docs_date             DATE,
  ADD COLUMN IF NOT EXISTS funding_wire_date            DATE;

-- ============================================================
-- SECTION 7: Milestone dates + statuses
-- ============================================================
ALTER TABLE loans
  ADD COLUMN IF NOT EXISTS cd_date               DATE,
  ADD COLUMN IF NOT EXISTS cd_status             TEXT,
  ADD COLUMN IF NOT EXISTS hoi_date              DATE,
  ADD COLUMN IF NOT EXISTS hoi_status            TEXT,
  ADD COLUMN IF NOT EXISTS title_date            DATE,
  ADD COLUMN IF NOT EXISTS title_status          TEXT,
  ADD COLUMN IF NOT EXISTS payroll_date          DATE,
  ADD COLUMN IF NOT EXISTS payroll_status        TEXT,
  ADD COLUMN IF NOT EXISTS appraisal_date        DATE,
  ADD COLUMN IF NOT EXISTS appraisal_status      TEXT,
  ADD COLUMN IF NOT EXISTS client_review_date    DATE,
  ADD COLUMN IF NOT EXISTS client_review_status  TEXT,
  ADD COLUMN IF NOT EXISTS signed_docs_status    TEXT,
  ADD COLUMN IF NOT EXISTS funding_wire_status   TEXT;

-- ============================================================
-- SECTION 8: Agent FK references
-- ============================================================
ALTER TABLE loans
  ADD COLUMN IF NOT EXISTS buyer_agent_contact_id    UUID REFERENCES contacts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS listing_agent_contact_id  UUID REFERENCES contacts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_loans_buyer_agent_contact_id
  ON loans (buyer_agent_contact_id);

CREATE INDEX IF NOT EXISTS idx_loans_listing_agent_contact_id
  ON loans (listing_agent_contact_id);

-- ============================================================
-- SECTION 9: loan_status_history table
-- ============================================================
CREATE TABLE IF NOT EXISTS loan_status_history (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id       UUID        REFERENCES loans(id) ON DELETE CASCADE,
  arive_loan_id TEXT        NOT NULL,
  old_status    TEXT,
  new_status    TEXT        NOT NULL,
  changed_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  source        TEXT        NOT NULL DEFAULT 'arive'
);

CREATE INDEX IF NOT EXISTS idx_loan_status_history_loan_id
  ON loan_status_history (loan_id);

CREATE INDEX IF NOT EXISTS idx_loan_status_history_arive_loan_id
  ON loan_status_history (arive_loan_id);

CREATE INDEX IF NOT EXISTS idx_loan_status_history_changed_at
  ON loan_status_history (changed_at DESC);

-- RLS
ALTER TABLE loan_status_history ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read their own loan status history
CREATE POLICY "Authenticated users can read loan_status_history"
  ON loan_status_history
  FOR SELECT
  TO authenticated
  USING (
    loan_id IN (
      SELECT id FROM loans WHERE user_id = auth.uid()
    )
  );

-- Service role bypasses RLS automatically (no explicit INSERT policy needed)
-- n8n uses service_role key, so all inserts from n8n work without a policy
