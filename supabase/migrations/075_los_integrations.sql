-- Migration: los_integrations table
--
-- Purpose: Per-org configuration for inbound webhooks from Loan Origination
-- Systems (Arive today; Encompass, Calyx, Byte, etc. later).
--
-- Architecture (2026-04-05):
--   Arive does NOT offer direct API access to third-party SaaS integrators
--   as of this writing. The only supported path is Zapier → Webhooks by
--   Zapier → LoanOS. Each LO has their own Zapier account with their own
--   Arive credentials; Zapier enriches the thin Arive ping into a full loan
--   payload before POSTing to LoanOS.
--
-- Security model (defense in depth, 3 layers):
--   Layer 1 — Path slug routing: /api/webhooks/los/arive/[org_slug]
--             Resolves which org a webhook belongs to via organizations.slug.
--   Layer 2 — Per-org shared secret: X-Webhook-Secret header compared against
--             secret_hash using timing-safe comparison after hashing.
--   Layer 3 — Payload identity allowlist: external_user_id / external_user_email
--             must match an allowed identity from the Zapier-enriched payload.
--             See src/lib/los/verifyLosPayload.ts for matching logic.
--
-- Allowlist semantics:
--   - An org MAY have multiple los_integrations rows for the same provider
--     (e.g. solo LO + their processor who also triggers Arive webhooks).
--   - If zero rows exist for (org_id, provider) with non-null external_user_*,
--     layer 3 is SKIPPED and a warning is logged. This is the "null allowlist
--     = fail open" safety valve during initial rollout.
--
-- Shadow mode vs enforce mode:
--   Controlled by org_settings.los_verification_mode ('shadow' | 'enforce').
--   Shadow: log mismatches but process webhook anyway. Default for new orgs.
--   Enforce: reject mismatches with 403. Flipped manually after 14 days of
--            clean shadow logs.

CREATE TABLE IF NOT EXISTS los_integrations (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider             TEXT NOT NULL CHECK (provider IN ('arive', 'encompass', 'calyx', 'byte')),

  -- Layer 2: secret (never stored in plaintext)
  secret_hash          TEXT NOT NULL,
  secret_salt          TEXT NOT NULL,
  secret_last_rotated  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Layer 3: allowlisted payload identity (either or both may be set)
  external_user_id     TEXT,
  external_user_email  TEXT,
  label                TEXT,  -- human-readable: "Adam (primary)", "Janie (processor)"

  -- Lifecycle
  active               BOOLEAN NOT NULL DEFAULT TRUE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- At least one identity field must be set OR both may be null (null-allowlist escape hatch)
  CHECK (
    (external_user_id IS NOT NULL)
    OR (external_user_email IS NOT NULL)
    OR (external_user_id IS NULL AND external_user_email IS NULL)
  )
);

-- Fast lookup during webhook auth (layer 1 + 2)
CREATE INDEX idx_los_integrations_org_provider
  ON los_integrations (organization_id, provider)
  WHERE active = TRUE;

-- For audit / admin queries by email
CREATE INDEX idx_los_integrations_external_email
  ON los_integrations (external_user_email)
  WHERE external_user_email IS NOT NULL;

-- ─── Verification mode column on org_settings ─────────────────────────────────
-- Controls whether layer 3 mismatches reject (enforce) or just log (shadow).
ALTER TABLE org_settings
  ADD COLUMN IF NOT EXISTS los_verification_mode TEXT
  NOT NULL DEFAULT 'shadow'
  CHECK (los_verification_mode IN ('shadow', 'enforce'));

COMMENT ON COLUMN org_settings.los_verification_mode IS
  'Layer 3 enforcement mode for LOS webhooks. shadow = log mismatches only; enforce = reject with 403. Flip to enforce after 14 days clean.';

-- ─── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE los_integrations ENABLE ROW LEVEL SECURITY;

-- Org members can view their own integrations (read-only for members)
CREATE POLICY los_integrations_select_own_org ON los_integrations
  FOR SELECT
  USING (organization_id = get_my_organization_id());

-- Only owners/admins can create/update/delete
CREATE POLICY los_integrations_insert_admin ON los_integrations
  FOR INSERT
  WITH CHECK (
    organization_id = get_my_organization_id()
    AND get_my_role() IN ('owner', 'admin')
  );

CREATE POLICY los_integrations_update_admin ON los_integrations
  FOR UPDATE
  USING (
    organization_id = get_my_organization_id()
    AND get_my_role() IN ('owner', 'admin')
  );

CREATE POLICY los_integrations_delete_owner ON los_integrations
  FOR DELETE
  USING (
    organization_id = get_my_organization_id()
    AND get_my_role() = 'owner'
  );

-- Service role (webhook handler) bypasses RLS implicitly — used by the route.

-- ─── updated_at trigger ──────────────────────────────────────────────────────
CREATE TRIGGER los_integrations_updated_at
  BEFORE UPDATE ON los_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
