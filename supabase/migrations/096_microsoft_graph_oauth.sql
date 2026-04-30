-- 096_microsoft_graph_oauth.sql
-- Per-org Microsoft 365 OAuth credentials for sending mail via Graph API.
-- Tokens encrypted at rest with AES-256-GCM (same pattern as los_integrations).
-- email_provider determines which adapter sendEmail() dispatches to.

ALTER TABLE org_settings
  ADD COLUMN IF NOT EXISTS email_provider TEXT
    CHECK (email_provider IN ('resend', 'microsoft', 'google'))
    DEFAULT 'resend',
  ADD COLUMN IF NOT EXISTS ms_graph_email TEXT,
  ADD COLUMN IF NOT EXISTS ms_graph_token_ciphertext TEXT,
  ADD COLUMN IF NOT EXISTS ms_graph_token_iv TEXT,
  ADD COLUMN IF NOT EXISTS ms_graph_token_auth_tag TEXT,
  ADD COLUMN IF NOT EXISTS ms_graph_token_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ms_graph_connected_at TIMESTAMPTZ;

COMMENT ON COLUMN org_settings.email_provider IS 'Which provider sendEmail() routes drip+transactional through. NULL/resend = fallback ESP. microsoft = Graph OAuth. google = Gmail OAuth (future).';
COMMENT ON COLUMN org_settings.ms_graph_email IS 'The mailbox the OAuth tokens authorize sends from (e.g. adam@thestyerteam.com). Confirmed via /me at consent time.';
COMMENT ON COLUMN org_settings.ms_graph_token_ciphertext IS 'Encrypted JSON {access_token, refresh_token, scope}. Hex. Decrypts via LOANOS_LOS_ENCRYPTION_KEY.';
COMMENT ON COLUMN org_settings.ms_graph_token_expires_at IS 'access_token expiry. Refresh proactively when within 60s.';
