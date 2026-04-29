-- 095_org_settings_from_address.sql
-- Per-org From: address + display name for outbound email (drip + transactional).
-- Falls back to RESEND_FROM_ADDRESS env var when null.

ALTER TABLE org_settings
  ADD COLUMN IF NOT EXISTS from_email TEXT,
  ADD COLUMN IF NOT EXISTS from_name TEXT;

COMMENT ON COLUMN org_settings.from_email IS 'Per-org From: email address. Domain must be verified in Resend. NULL = fall back to RESEND_FROM_ADDRESS.';
COMMENT ON COLUMN org_settings.from_name IS 'Per-org From: display name (e.g. "Adam at the Styer Team").';
