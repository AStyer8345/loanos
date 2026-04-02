-- Harden activity_log.organization_id to NOT NULL
-- Verified: 830 rows, 0 nulls as of 2026-04-01
-- The BEFORE INSERT trigger (migration 050) auto-stamps org_id from profiles,
-- so all new inserts will have org_id regardless of caller.

ALTER TABLE activity_log ALTER COLUMN organization_id SET NOT NULL;
