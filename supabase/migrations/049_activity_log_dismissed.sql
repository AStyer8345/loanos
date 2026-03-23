-- Migration 049: Add dismissed column to activity_log for Inbox Review
-- Used by /dashboard/emails/unmatched to hide emails Adam has dismissed

ALTER TABLE activity_log ADD COLUMN IF NOT EXISTS dismissed BOOLEAN DEFAULT false;

-- Index for the unmatched page filter: type='email_inbound' AND contact_id IS NULL AND dismissed != true
CREATE INDEX IF NOT EXISTS idx_activity_log_unmatched_inbox
  ON activity_log(type, contact_id, occurred_at DESC)
  WHERE type = 'email_inbound' AND contact_id IS NULL AND (dismissed IS NULL OR dismissed = false);
