-- Migration 050: Backfill null organization_id rows (2026-03-24 daily prep)
-- Sources:
--   activity_log: 15 email_inbound (Outlook Sync, Azure blocked)
--                 2 status_updated (n8n WF2, not pushed to cloud)
--                 1 loan_created (n8n WF1, not pushed to cloud)
--   chat_sessions: 2 rows (recurring nulls, user created new sessions without org stamp)
-- All rows belong to Adam's user — assign via profile lookup.

UPDATE activity_log
SET organization_id = (
  SELECT organization_id FROM profiles WHERE id = activity_log.user_id LIMIT 1
)
WHERE organization_id IS NULL
  AND user_id IS NOT NULL;

UPDATE chat_sessions
SET organization_id = (
  SELECT organization_id FROM profiles WHERE id = chat_sessions.user_id LIMIT 1
)
WHERE organization_id IS NULL
  AND user_id IS NOT NULL;
