-- Migration 041: Loan Name Auto-Generation + Missing Arive Fields
-- Adds aus_result and originator_comp columns.
-- Backfills loan_name = {last_name}-{street_address} for all unlabeled loans.
-- 2026-03-20

-- ── 1. New columns ────────────────────────────────────────────────────────────
ALTER TABLE loans
  ADD COLUMN IF NOT EXISTS aus_result      TEXT,
  ADD COLUMN IF NOT EXISTS originator_comp NUMERIC;

-- ── 2. Backfill loan_name for existing records ────────────────────────────────
-- Formula: {borrower_last_name}-{street_only_address}
-- Street "only" = everything before the first comma (city/state), with
-- suite/unit suffixes stripped via regex.

UPDATE loans
SET loan_name = (
  CASE
    WHEN borrower_last_name IS NOT NULL AND property_address IS NOT NULL THEN
      borrower_last_name
        || '-'
        || TRIM(
             REGEXP_REPLACE(
               SPLIT_PART(property_address, ',', 1),
               '\s+(apt|suite|ste|unit|#\s*\w+|bldg|fl|floor|lot|rm|room)\s*\w*',
               '',
               'gi'
             )
           )
    WHEN property_address IS NOT NULL THEN
      TRIM(
        REGEXP_REPLACE(
          SPLIT_PART(property_address, ',', 1),
          '\s+(apt|suite|ste|unit|#\s*\w+|bldg|fl|floor|lot|rm|room)\s*\w*',
          '',
          'gi'
        )
      )
    WHEN borrower_last_name IS NOT NULL THEN
      borrower_last_name
    ELSE NULL
  END
)
WHERE (loan_name IS NULL OR loan_name = '');
