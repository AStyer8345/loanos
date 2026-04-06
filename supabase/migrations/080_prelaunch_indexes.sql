-- Pre-launch audit fixes: missing indexes
-- Applied 2026-04-06 during pre-launch audit

-- loans.status — every pipeline view, dashboard, and briefing filters by this
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans (status);

-- drip tables missing org_id indexes
CREATE INDEX IF NOT EXISTS idx_drip_steps_org ON drip_steps (org_id);
CREATE INDEX IF NOT EXISTS idx_drip_enrollments_org ON drip_enrollments (org_id);
CREATE INDEX IF NOT EXISTS idx_drip_sends_org ON drip_sends (org_id);

-- drip status indexes
CREATE INDEX IF NOT EXISTS idx_drip_campaigns_status ON drip_campaigns (status);
CREATE INDEX IF NOT EXISTS idx_drip_enrollments_status ON drip_enrollments (status);

-- other missing org_id indexes
CREATE INDEX IF NOT EXISTS idx_agent_tools_org ON agent_tools (org_id);
CREATE INDEX IF NOT EXISTS idx_automation_runs_org ON automation_runs (org_id);
