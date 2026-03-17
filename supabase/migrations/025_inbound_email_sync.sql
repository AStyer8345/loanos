-- Migration 025: Inbound email sync — extend activity_log for email fields + contacts last_touch_at
-- Idempotent — uses IF NOT EXISTS pattern

-- ─────────────────────────────────────────────────────────────────────────────
-- ACTIVITY_LOG — add email-specific columns
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE activity_log ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE activity_log ADD COLUMN IF NOT EXISTS body_snippet TEXT;       -- first 500 chars only
ALTER TABLE activity_log ADD COLUMN IF NOT EXISTS from_address TEXT;
ALTER TABLE activity_log ADD COLUMN IF NOT EXISTS to_address TEXT;
ALTER TABLE activity_log ADD COLUMN IF NOT EXISTS occurred_at TIMESTAMPTZ DEFAULT now();

-- Index for timeline queries by occurred_at
CREATE INDEX IF NOT EXISTS idx_activity_log_occurred_at ON activity_log(occurred_at DESC);

-- Index for unmatched email review (metadata->>'needs_review' = 'true')
CREATE INDEX IF NOT EXISTS idx_activity_log_needs_review
  ON activity_log((metadata->>'needs_review'))
  WHERE metadata->>'needs_review' = 'true';

-- ─────────────────────────────────────────────────────────────────────────────
-- CONTACTS — add last_touch_at for email sync freshness tracking
-- Separate from last_activity_date which tracks contact_activity log entries
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_touch_at TIMESTAMPTZ;
