-- ============================================================
-- Migration 021: Fix email_drafts RLS — add user_id, scope policy
-- Current policy is USING (true). Safe for single-user today,
-- but a data isolation gap before any multi-LO scenario.
-- ============================================================

-- Add user_id column if it doesn't exist
ALTER TABLE email_drafts
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Backfill existing rows with the system user ID
UPDATE email_drafts
SET user_id = (SELECT id FROM auth.users ORDER BY created_at LIMIT 1)
WHERE user_id IS NULL;

-- Drop the permissive catch-all policy
DROP POLICY IF EXISTS "Service role full access" ON email_drafts;
DROP POLICY IF EXISTS "Allow all" ON email_drafts;
DROP POLICY IF EXISTS "Enable access for all users" ON email_drafts;

-- SELECT
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'email_drafts' AND policyname = 'Users see own email drafts'
  ) THEN
    CREATE POLICY "Users see own email drafts" ON email_drafts
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

-- INSERT
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'email_drafts' AND policyname = 'Users create own email drafts'
  ) THEN
    CREATE POLICY "Users create own email drafts" ON email_drafts
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- UPDATE
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'email_drafts' AND policyname = 'Users update own email drafts'
  ) THEN
    CREATE POLICY "Users update own email drafts" ON email_drafts
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- DELETE (email drafts can be discarded by the owning user)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'email_drafts' AND policyname = 'Users delete own email drafts'
  ) THEN
    CREATE POLICY "Users delete own email drafts" ON email_drafts
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;
