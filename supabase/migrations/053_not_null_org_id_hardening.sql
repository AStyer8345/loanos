-- Migration 053: NOT NULL hardening for organization_id columns
-- Applied: 2026-03-25 via Supabase MCP (apply_migration name: 051_not_null_organization_id_hardening)
-- 0 null rows confirmed in all 8 tables before applying

ALTER TABLE loans ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE contacts ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE documents ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE email_drafts ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE scenarios ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE todo_items ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE contact_activity ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE chat_sessions ALTER COLUMN organization_id SET NOT NULL;

-- NOTE: activity_log.organization_id intentionally left nullable.
-- A BEFORE INSERT trigger (migration 050) auto-stamps org_id from profiles.
-- Add NOT NULL once WF1/WF2 n8n workflows are pushed to cloud and confirmed
-- not inserting without user_id.
