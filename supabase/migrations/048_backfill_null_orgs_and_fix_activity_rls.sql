-- Migration 048: Backfill null org rows (post-046 recurrence) + tighten activity_log SELECT RLS
-- Date: 2026-03-23
-- Reason:
--   1. 6 new null organization_id rows in activity_log since migration 046 backfill:
--      - 5 email_inbound rows from Outlook Email Sync n8n workflow (JMmstRl2C5ylmuIY) — known issue, Azure blocked
--      - 1 loan_created row from WF1 (1tagvoU0UXtdDiMY) before 2026-03-23 fix (not yet pushed to n8n cloud)
--   2. 1 null organization_id contact (Aaron Treptow, id=741efdf8) — created by WF1 before fix
--   3. activity_log SELECT policy had OR (user_id = auth.uid()) clause — leaks null-org rows to their
--      original user; tighten to org-only now that we have backfill coverage.

-- ── 1. Backfill null organization_id in activity_log ─────────────────────────────────────────────
UPDATE activity_log
SET organization_id = '18613f82-fdd9-42dd-a09e-f3c577328258'
WHERE organization_id IS NULL
  AND user_id = 'b13aa8c6-c3a0-4312-9b35-c76073e7ccdc';

-- ── 2. Backfill null organization_id in contacts ─────────────────────────────────────────────────
UPDATE contacts
SET organization_id = '18613f82-fdd9-42dd-a09e-f3c577328258'
WHERE organization_id IS NULL
  AND user_id = 'b13aa8c6-c3a0-4312-9b35-c76073e7ccdc';

-- ── 3. Verify — these should both return 0 ───────────────────────────────────────────────────────
-- SELECT COUNT(*) FROM activity_log WHERE organization_id IS NULL;
-- SELECT COUNT(*) FROM contacts WHERE organization_id IS NULL;

-- ── 4. Tighten activity_log SELECT RLS (drop user_id OR fallback) ────────────────────────────────
-- Old policy allowed: user_id = auth.uid() OR (organization_id IS NOT NULL AND organization_id = get_my_organization_id())
-- The user_id OR clause made null-org rows visible to their author — a cross-tenant risk.
-- New policy: org-scoped only. Null-org rows are invisible until backfilled (daily backfill handles this).
DROP POLICY IF EXISTS "Users can read own activity" ON activity_log;

CREATE POLICY "Org members can read activity"
  ON activity_log FOR SELECT
  USING (organization_id = get_my_organization_id());

-- Note: INSERT policy ("Users can insert own activity") is intentionally left open (no WITH CHECK)
-- so n8n workflows and service-role routes can insert. The daily backfill migration handles any
-- null-org rows that slip through. Tightening INSERT would require every writer to know org_id upfront.
