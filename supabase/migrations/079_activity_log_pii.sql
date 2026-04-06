-- Migration 079: Split PII out of activity_log into encrypted companion table.
--
-- activity_log_pii stores AES-256-GCM ciphertext for sensitive fields
-- (summary, subject, body_snippet, from_address, raw_payload, metadata).
-- The encryption key lives in the app env (PII_ENCRYPTION_KEY), never in the DB.
-- key_version supports dual-key rotation windows.
--
-- Phase 1: create the table + RLS (this migration)
-- Phase 2: backfill existing rows via Node script (scripts/backfill-activity-pii.ts)
-- Phase 3: DROP plaintext columns from activity_log (migration 080, after backfill verified)

CREATE TABLE IF NOT EXISTS public.activity_log_pii (
  activity_id   uuid PRIMARY KEY REFERENCES public.activity_log(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  pii_ciphertext bytea NOT NULL,
  pii_iv         bytea NOT NULL,    -- 12-byte AES-GCM nonce
  pii_tag        bytea NOT NULL,    -- 16-byte authentication tag
  key_version    int   NOT NULL DEFAULT 1,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- Index for org-scoped lookups (every read joins on activity_id but filters by org)
CREATE INDEX IF NOT EXISTS idx_activity_log_pii_org
  ON public.activity_log_pii (organization_id);

-- Enable RLS
ALTER TABLE public.activity_log_pii ENABLE ROW LEVEL SECURITY;

-- Owner/admin of the org can read PII (member role excluded)
CREATE POLICY "Org owner/admin can read PII"
  ON public.activity_log_pii
  FOR SELECT
  USING (
    organization_id = get_my_organization_id()
    AND (
      SELECT role FROM public.profiles WHERE id = auth.uid()
    ) IN ('owner', 'admin')
  );

-- Service role inserts (app-layer encryption happens before insert)
-- No user-facing insert policy — all writes go through service role
CREATE POLICY "Service role can insert PII"
  ON public.activity_log_pii
  FOR INSERT
  WITH CHECK (true);

-- Deny delete to all non-service-role users
CREATE POLICY "Deny delete"
  ON public.activity_log_pii
  FOR DELETE
  USING (false);

-- Deny update to all non-service-role users (ciphertext is immutable)
CREATE POLICY "Deny update"
  ON public.activity_log_pii
  FOR UPDATE
  USING (false);
