-- 063_whitelabel_slug_and_email.sql
-- Phase 3: White-Label Options — slug uniqueness + email reply-to

-- Ensure slug is unique and URL-safe
ALTER TABLE organizations
  ADD CONSTRAINT organizations_slug_unique UNIQUE (slug);

-- Add custom_email_reply_to for per-tenant reply-to override (Phase 3 email branding)
ALTER TABLE org_settings
  ADD COLUMN custom_email_reply_to TEXT DEFAULT NULL;

COMMENT ON COLUMN org_settings.custom_email_reply_to IS 'LO reply-to email for outbound communications. Leave null to use org owner email.';
