-- ============================================================
-- Migration 019: Fix activity_log RLS — remove DELETE permission
-- Audit logs must be immutable. Drop FOR ALL policy, replace with
-- SELECT + INSERT only. Service role retains full access.
-- ============================================================

-- Drop the existing FOR ALL policy
DROP POLICY IF EXISTS "Users see own activity" ON activity_log;
DROP POLICY IF EXISTS "Authenticated users can manage activity_log" ON activity_log;

-- SELECT: users can read their own activity
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'activity_log' AND policyname = 'Users can read own activity'
  ) THEN
    CREATE POLICY "Users can read own activity" ON activity_log
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

-- INSERT: users can write their own activity
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'activity_log' AND policyname = 'Users can insert own activity'
  ) THEN
    CREATE POLICY "Users can insert own activity" ON activity_log
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- No UPDATE or DELETE policy for authenticated users = immutable logs
-- Service role bypasses RLS entirely (used by n8n / agent routes)
