-- 086_email_automation.sql
-- Lead origin tracking, event taxonomy normalization, Resend webhook idempotency

-- Lead origin columns on contacts
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS source_page TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS form_name TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS utm_params JSONB;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS referrer TEXT;

CREATE INDEX IF NOT EXISTS idx_contacts_source_page
  ON contacts(source_page) WHERE source_page IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_utm_source
  ON contacts((utm_params->>'source')) WHERE utm_params IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_created_at
  ON contacts(created_at DESC);

-- Normalize existing email event_type to dotted form
UPDATE activity_log
SET event_type = 'email.sent'
WHERE event_type = 'email_sent';

-- Resend webhook idempotency table
CREATE TABLE resend_webhook_events (
  event_id   TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  contact_id  UUID REFERENCES contacts(id) ON DELETE SET NULL,
  enrollment_id UUID REFERENCES drip_enrollments(id) ON DELETE SET NULL,
  payload     JSONB NOT NULL
);

CREATE INDEX idx_resend_webhook_events_contact
  ON resend_webhook_events(contact_id);
CREATE INDEX idx_resend_webhook_events_received
  ON resend_webhook_events(received_at DESC);

-- RLS: admin-only via service client (no row-level policy needed — accessed server-side only)
ALTER TABLE resend_webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_only" ON resend_webhook_events
  USING (false) WITH CHECK (false);
