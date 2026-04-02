-- Add application link and calendly link columns to org_settings
-- These are per-org so each LO can have their own 1003 app link and scheduling link

ALTER TABLE org_settings
  ADD COLUMN IF NOT EXISTS application_link TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS calendly_link TEXT DEFAULT NULL;

COMMENT ON COLUMN org_settings.application_link IS 'LO-specific loan application URL (e.g. mslp.my1003app.com/513013/register)';
COMMENT ON COLUMN org_settings.calendly_link IS 'LO-specific scheduling link (e.g. calendly.com/adamstyer/15minutes)';
