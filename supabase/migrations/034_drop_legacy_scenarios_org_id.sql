-- Drop legacy org_id column from scenarios — superseded by organization_id (migration 032)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'scenarios' AND column_name = 'org_id'
  ) THEN
    ALTER TABLE scenarios DROP COLUMN org_id;
  END IF;
END $$;