-- 087_shadow_log.sql
-- Shadow mode log for Workflow DevKit parity comparison.
-- Records what WOULD have happened if WORKFLOW_DEVKIT_LEAD_INTAKE were 'live',
-- without actually triggering workflows. Used to validate classification +
-- enrollment decisions against n8n baseline before cutover.

CREATE TABLE workflow_shadow_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  trigger_source TEXT NOT NULL,                  -- 'web-lead', 'pa-welcome', etc.
  classification TEXT,                           -- 'pa' | 'dpa' | 'generic'
  would_enroll BOOLEAN NOT NULL DEFAULT false,
  campaign_key TEXT,                             -- 'pa-welcome' | 'dpa-guide' | null
  exit_rule_triggered BOOLEAN NOT NULL DEFAULT false,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_shadow_log_logged_at ON workflow_shadow_log(logged_at DESC);
CREATE INDEX idx_shadow_log_contact ON workflow_shadow_log(contact_id);

-- Service-role-only access (no user-facing reads)
ALTER TABLE workflow_shadow_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny_all" ON workflow_shadow_log FOR ALL USING (false) WITH CHECK (false);
