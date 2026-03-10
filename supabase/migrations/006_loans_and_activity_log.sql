-- Migration 006: Loans import columns + activity_log FKs
-- Run in Supabase SQL editor
-- Idempotent — uses IF NOT EXISTS pattern

-- ─────────────────────────────────────────────────
-- LOANS table additions (needed for CSV import)
-- ─────────────────────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loans' AND column_name = 'loan_name'
  ) THEN
    ALTER TABLE loans ADD COLUMN loan_name TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loans' AND column_name = 'property_city'
  ) THEN
    ALTER TABLE loans ADD COLUMN property_city TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loans' AND column_name = 'property_state'
  ) THEN
    ALTER TABLE loans ADD COLUMN property_state TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loans' AND column_name = 'loan_program'
  ) THEN
    ALTER TABLE loans ADD COLUMN loan_program TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loans' AND column_name = 'occupancy'
  ) THEN
    ALTER TABLE loans ADD COLUMN occupancy TEXT;
  END IF;
END $$;

-- ─────────────────────────────────────────────────
-- ACTIVITY_LOG table additions (FK links for feeds)
-- ─────────────────────────────────────────────────

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

-- ─────────────────────────────────────────────────
-- Indexes for performance
-- ─────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_loans_loan_name ON loans(loan_name);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
CREATE INDEX IF NOT EXISTS idx_loans_closing_date ON loans(closing_date DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_loan_id ON activity_log(loan_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_contact_id ON activity_log(contact_id);
