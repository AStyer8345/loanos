-- Migration 052: Fix partial index for unmatched inbox review
-- The previous index (049) was missing loan_id IS NULL in the WHERE clause.
-- The inbox review query filters on BOTH contact_id IS NULL AND loan_id IS NULL,
-- so the index needs to reflect that to avoid unnecessary row scans.

DROP INDEX IF EXISTS idx_activity_log_unmatched_inbox;

CREATE INDEX idx_activity_log_unmatched_inbox
  ON activity_log(type, occurred_at DESC)
  WHERE type = 'email_inbound'
    AND contact_id IS NULL
    AND loan_id IS NULL
    AND (dismissed IS NULL OR dismissed = false);
