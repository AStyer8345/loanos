-- ============================================================
-- Migration 033: Org-scoped RLS for documents, email_drafts, scenarios
-- Depends on: 029 (get_my_organization_id, get_my_role)
--             032 (organization_id columns)
-- ============================================================

-- ============================================================
-- DOCUMENTS
-- ============================================================
DROP POLICY IF EXISTS "Users can only access their own documents" ON documents;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'documents' AND policyname = 'Org members can read documents') THEN
    CREATE POLICY "Org members can read documents"
      ON documents FOR SELECT
      USING (organization_id = get_my_organization_id());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'documents' AND policyname = 'Org members can insert documents') THEN
    CREATE POLICY "Org members can insert documents"
      ON documents FOR INSERT
      WITH CHECK (organization_id = get_my_organization_id());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'documents' AND policyname = 'Org members can update documents') THEN
    CREATE POLICY "Org members can update documents"
      ON documents FOR UPDATE
      USING (organization_id = get_my_organization_id())
      WITH CHECK (organization_id = get_my_organization_id());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'documents' AND policyname = 'Org owners and admins can delete documents') THEN
    CREATE POLICY "Org owners and admins can delete documents"
      ON documents FOR DELETE
      USING (organization_id = get_my_organization_id() AND get_my_role() IN ('owner', 'admin'));
  END IF;
END $$;

-- ============================================================
-- EMAIL_DRAFTS
-- ============================================================
DROP POLICY IF EXISTS "Users can only access their own email drafts" ON email_drafts;
DROP POLICY IF EXISTS "Users can manage their own email drafts" ON email_drafts;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'email_drafts' AND policyname = 'Org members can read email drafts') THEN
    CREATE POLICY "Org members can read email drafts"
      ON email_drafts FOR SELECT
      USING (organization_id = get_my_organization_id());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'email_drafts' AND policyname = 'Org members can insert email drafts') THEN
    CREATE POLICY "Org members can insert email drafts"
      ON email_drafts FOR INSERT
      WITH CHECK (organization_id = get_my_organization_id());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'email_drafts' AND policyname = 'Org members can update email drafts') THEN
    CREATE POLICY "Org members can update email drafts"
      ON email_drafts FOR UPDATE
      USING (organization_id = get_my_organization_id())
      WITH CHECK (organization_id = get_my_organization_id());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'email_drafts' AND policyname = 'Org owners and admins can delete email drafts') THEN
    CREATE POLICY "Org owners and admins can delete email drafts"
      ON email_drafts FOR DELETE
      USING (organization_id = get_my_organization_id() AND get_my_role() IN ('owner', 'admin'));
  END IF;
END $$;

-- ============================================================
-- SCENARIOS
-- ============================================================
DROP POLICY IF EXISTS "Users can manage their own scenarios" ON scenarios;
DROP POLICY IF EXISTS "Users can read own scenarios" ON scenarios;
DROP POLICY IF EXISTS "Users can insert own scenarios" ON scenarios;
DROP POLICY IF EXISTS "Users can update own scenarios" ON scenarios;
DROP POLICY IF EXISTS "Users can delete own scenarios" ON scenarios;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'scenarios' AND policyname = 'Org members can read scenarios') THEN
    CREATE POLICY "Org members can read scenarios"
      ON scenarios FOR SELECT
      USING (organization_id = get_my_organization_id() OR share_token IS NOT NULL);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'scenarios' AND policyname = 'Org members can insert scenarios') THEN
    CREATE POLICY "Org members can insert scenarios"
      ON scenarios FOR INSERT
      WITH CHECK (organization_id = get_my_organization_id());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'scenarios' AND policyname = 'Org members can update scenarios') THEN
    CREATE POLICY "Org members can update scenarios"
      ON scenarios FOR UPDATE
      USING (organization_id = get_my_organization_id())
      WITH CHECK (organization_id = get_my_organization_id());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'scenarios' AND policyname = 'Org owners and admins can delete scenarios') THEN
    CREATE POLICY "Org owners and admins can delete scenarios"
      ON scenarios FOR DELETE
      USING (organization_id = get_my_organization_id() AND get_my_role() IN ('owner', 'admin'));
  END IF;
END $$;
