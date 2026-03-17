-- ============================================================
-- Migration 031: Multi-tenancy RLS policies
-- Replaces single-user policies with org-scoped policies.
-- Role hierarchy: owner/admin = full access | member = no DELETE
--
-- Depends on: 029 (get_my_organization_id, get_my_role functions)
--             030 (organization_id columns on each table)
-- ============================================================


-- ============================================================
-- LOANS
-- ============================================================

-- Drop old single-user policies
DROP POLICY IF EXISTS "Users can only access their own loans" ON loans;

-- SELECT: any org member
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'loans' AND policyname = 'Org members can read loans'
  ) THEN
    CREATE POLICY "Org members can read loans"
      ON loans FOR SELECT
      USING (organization_id = get_my_organization_id());
  END IF;
END $$;

-- INSERT: any org member — must insert into their own org
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'loans' AND policyname = 'Org members can insert loans'
  ) THEN
    CREATE POLICY "Org members can insert loans"
      ON loans FOR INSERT
      WITH CHECK (organization_id = get_my_organization_id());
  END IF;
END $$;

-- UPDATE: any org member — can only update own-org rows
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'loans' AND policyname = 'Org members can update loans'
  ) THEN
    CREATE POLICY "Org members can update loans"
      ON loans FOR UPDATE
      USING (organization_id = get_my_organization_id())
      WITH CHECK (organization_id = get_my_organization_id());
  END IF;
END $$;

-- DELETE: owners and admins only
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'loans' AND policyname = 'Org owners and admins can delete loans'
  ) THEN
    CREATE POLICY "Org owners and admins can delete loans"
      ON loans FOR DELETE
      USING (
        organization_id = get_my_organization_id()
        AND get_my_role() IN ('owner', 'admin')
      );
  END IF;
END $$;


-- ============================================================
-- CONTACTS
-- ============================================================

DROP POLICY IF EXISTS "Users can only access their own contacts" ON contacts;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'contacts' AND policyname = 'Org members can read contacts'
  ) THEN
    CREATE POLICY "Org members can read contacts"
      ON contacts FOR SELECT
      USING (organization_id = get_my_organization_id());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'contacts' AND policyname = 'Org members can insert contacts'
  ) THEN
    CREATE POLICY "Org members can insert contacts"
      ON contacts FOR INSERT
      WITH CHECK (organization_id = get_my_organization_id());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'contacts' AND policyname = 'Org members can update contacts'
  ) THEN
    CREATE POLICY "Org members can update contacts"
      ON contacts FOR UPDATE
      USING (organization_id = get_my_organization_id())
      WITH CHECK (organization_id = get_my_organization_id());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'contacts' AND policyname = 'Org owners and admins can delete contacts'
  ) THEN
    CREATE POLICY "Org owners and admins can delete contacts"
      ON contacts FOR DELETE
      USING (
        organization_id = get_my_organization_id()
        AND get_my_role() IN ('owner', 'admin')
      );
  END IF;
END $$;


-- ============================================================
-- ACTIVITY_LOG
-- Immutable audit log: SELECT + INSERT only (even for owners).
-- Matches the intent established in migration 019.
-- Service role bypasses RLS for n8n/agent writes.
-- ============================================================

DROP POLICY IF EXISTS "Users can only access their own activity" ON activity_log;
DROP POLICY IF EXISTS "Users can read own activity" ON activity_log;
DROP POLICY IF EXISTS "Users can insert own activity" ON activity_log;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'activity_log' AND policyname = 'Org members can read activity'
  ) THEN
    CREATE POLICY "Org members can read activity"
      ON activity_log FOR SELECT
      USING (organization_id = get_my_organization_id());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'activity_log' AND policyname = 'Org members can insert activity'
  ) THEN
    CREATE POLICY "Org members can insert activity"
      ON activity_log FOR INSERT
      WITH CHECK (organization_id = get_my_organization_id());
  END IF;
END $$;

-- No UPDATE or DELETE on activity_log — audit logs are immutable.
-- Service role retains full access (bypasses RLS).


-- ============================================================
-- TODO_ITEMS
-- ============================================================

DROP POLICY IF EXISTS "Users can manage their own todos" ON todo_items;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'todo_items' AND policyname = 'Org members can read todos'
  ) THEN
    CREATE POLICY "Org members can read todos"
      ON todo_items FOR SELECT
      USING (organization_id = get_my_organization_id());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'todo_items' AND policyname = 'Org members can insert todos'
  ) THEN
    CREATE POLICY "Org members can insert todos"
      ON todo_items FOR INSERT
      WITH CHECK (organization_id = get_my_organization_id());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'todo_items' AND policyname = 'Org members can update todos'
  ) THEN
    CREATE POLICY "Org members can update todos"
      ON todo_items FOR UPDATE
      USING (organization_id = get_my_organization_id())
      WITH CHECK (organization_id = get_my_organization_id());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'todo_items' AND policyname = 'Org owners and admins can delete todos'
  ) THEN
    CREATE POLICY "Org owners and admins can delete todos"
      ON todo_items FOR DELETE
      USING (
        organization_id = get_my_organization_id()
        AND get_my_role() IN ('owner', 'admin')
      );
  END IF;
END $$;
