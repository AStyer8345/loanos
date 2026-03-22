-- Migration 046: Backfill remaining null organization_id rows in activity_log
-- Context: 3 rows with null organization_id were created after migration 043 by:
--   - n8n Outlook Email Sync workflow (action: email.received) - 2 rows
--   - n8n Arive Status Update webhook (action: status_updated) - 1 row
-- Root cause: n8n HTTP Request nodes insert without organization_id.
-- Next.js code bugs also fixed in this session (updateLastTouch.ts, outlook-sync/route.ts).
-- Assigning remaining nulls to Adam's org (the only active org).

UPDATE activity_log
SET organization_id = '18613f82-fdd9-42dd-a09e-f3c577328258'
WHERE organization_id IS NULL;

-- Verify: should return 0
-- SELECT COUNT(*) FROM activity_log WHERE organization_id IS NULL;
