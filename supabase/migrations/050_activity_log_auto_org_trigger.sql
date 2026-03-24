-- Migration 050: Auto-stamp organization_id on activity_log INSERT
--
-- STRUCTURAL FIX for recurring null org_id rows (4th occurrence: migrations 043, 046, 048, now 050).
-- Root cause: n8n workflows (Outlook Email Sync, WF2 Status Update) insert without organization_id.
-- Instead of patching each workflow, this trigger auto-resolves org_id from the user's profile.
--
-- Applied: 2026-03-24

-- 1. Create trigger function: if organization_id is NULL on INSERT, look it up from profiles
CREATE OR REPLACE FUNCTION stamp_activity_log_org_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.organization_id IS NULL AND NEW.user_id IS NOT NULL THEN
    SELECT organization_id INTO NEW.organization_id
    FROM profiles
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Attach trigger (BEFORE INSERT so it modifies the row before write)
DROP TRIGGER IF EXISTS trg_activity_log_stamp_org ON activity_log;
CREATE TRIGGER trg_activity_log_stamp_org
  BEFORE INSERT ON activity_log
  FOR EACH ROW
  EXECUTE FUNCTION stamp_activity_log_org_id();

-- 3. Backfill the 11 current null org_id rows
UPDATE activity_log
SET organization_id = p.organization_id
FROM profiles p
WHERE activity_log.organization_id IS NULL
  AND activity_log.user_id = p.id;
