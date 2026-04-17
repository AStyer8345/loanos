-- 088_admin_audit_log.sql
-- Immutable audit log for system admin actions (Security Finding #9).
-- Separate from activity_log (org-scoped borrower events) — this captures
-- cross-tenant admin operations: plan overrides, bulk imports, backfills, etc.
-- Retained for 7 years per compliance requirements.

CREATE TABLE admin_audit_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id     UUID NOT NULL,            -- system_admins.user_id who performed the action
  actor_email  TEXT,
  action       TEXT NOT NULL,            -- e.g. 'plan_override', 'salesforce_import', 'backfill_party_links'
  resource_type TEXT,                    -- e.g. 'organization', 'contact'
  resource_id  TEXT,                     -- ID of the affected resource (nullable)
  details      JSONB NOT NULL DEFAULT '{}'::jsonb,  -- additional context (counts, old/new values, etc.)
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_admin_audit_actor   ON admin_audit_log(actor_id);
CREATE INDEX idx_admin_audit_created ON admin_audit_log(created_at DESC);
CREATE INDEX idx_admin_audit_action  ON admin_audit_log(action);

-- Immutable: deny all user-facing access; service role bypasses RLS for inserts.
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny_all" ON admin_audit_log FOR ALL USING (false) WITH CHECK (false);
