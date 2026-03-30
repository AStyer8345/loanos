-- ============================================================
-- Migration 065: RLS for automation_registry and automation_runs
-- Depends on: 029 (get_my_organization_id, get_my_role), 064
-- ============================================================

-- AUTOMATION_REGISTRY
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'automation_registry' AND policyname = 'Org members can read automation registry') THEN
    CREATE POLICY "Org members can read automation registry"
      ON automation_registry FOR SELECT
      USING (org_id = get_my_organization_id());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'automation_registry' AND policyname = 'Org members can insert automation registry') THEN
    CREATE POLICY "Org members can insert automation registry"
      ON automation_registry FOR INSERT
      WITH CHECK (org_id = get_my_organization_id());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'automation_registry' AND policyname = 'Org members can update automation registry') THEN
    CREATE POLICY "Org members can update automation registry"
      ON automation_registry FOR UPDATE
      USING (org_id = get_my_organization_id())
      WITH CHECK (org_id = get_my_organization_id());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'automation_registry' AND policyname = 'Org admins can delete automation registry') THEN
    CREATE POLICY "Org admins can delete automation registry"
      ON automation_registry FOR DELETE
      USING (org_id = get_my_organization_id() AND get_my_role() IN ('owner', 'admin'));
  END IF;
END $$;

-- AUTOMATION_RUNS
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'automation_runs' AND policyname = 'Org members can read automation runs') THEN
    CREATE POLICY "Org members can read automation runs"
      ON automation_runs FOR SELECT
      USING (org_id = get_my_organization_id());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'automation_runs' AND policyname = 'Org members can insert automation runs') THEN
    CREATE POLICY "Org members can insert automation runs"
      ON automation_runs FOR INSERT
      WITH CHECK (org_id = get_my_organization_id());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'automation_runs' AND policyname = 'Org members can update automation runs') THEN
    CREATE POLICY "Org members can update automation runs"
      ON automation_runs FOR UPDATE
      USING (org_id = get_my_organization_id())
      WITH CHECK (org_id = get_my_organization_id());
  END IF;
END $$;
