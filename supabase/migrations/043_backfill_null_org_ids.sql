-- Migration 043: Backfill null organization_id on legacy rows
-- Assigns Adam's org to all rows that predate the org_id column additions.
-- Safe to run multiple times (WHERE organization_id IS NULL guard).

DO $$
DECLARE
  v_org_id uuid := '18613f82-fdd9-42dd-a09e-f3c577328258';
BEGIN

  -- activity_log: 78 null rows from pre-migration inserts
  UPDATE activity_log
  SET organization_id = v_org_id
  WHERE organization_id IS NULL;

  -- contacts: 2 null rows
  UPDATE contacts
  SET organization_id = v_org_id
  WHERE organization_id IS NULL;

  -- chat_sessions: 2 null rows
  UPDATE chat_sessions
  SET organization_id = v_org_id
  WHERE organization_id IS NULL;

  RAISE NOTICE 'Migration 043 complete — backfilled null organization_id rows';
END $$;
