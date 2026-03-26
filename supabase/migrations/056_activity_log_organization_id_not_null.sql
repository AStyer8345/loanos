-- Migration 056: activity_log.organization_id NOT NULL hardening
-- Applied: 2026-03-25 (PM session closeout)
-- Blocked on: WF1 (1tagvoU0UXtdDiMY) + WF2 (9JyzzwKac8v3uQ7d) live on n8n cloud
-- Pre-check: 0 NULL rows confirmed before applying
-- Unblocked by: Adam pushed WF1/WF2 to n8n cloud 2026-03-25

ALTER TABLE activity_log ALTER COLUMN organization_id SET NOT NULL;
