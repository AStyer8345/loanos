-- ============================================================
-- Migration 020: Fix chat_sessions RLS — add user_id, scope policy
-- Current policy is USING (true) — any authenticated user can read
-- ALL chat sessions. This is a data isolation gap for multi-tenant use.
-- ============================================================

-- Add user_id column if it doesn't exist
ALTER TABLE chat_sessions
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Backfill existing rows with the system user ID
-- (all existing chat sessions belong to Adam's account)
UPDATE chat_sessions
SET user_id = (SELECT id FROM auth.users ORDER BY created_at LIMIT 1)
WHERE user_id IS NULL;

-- Drop the permissive catch-all policy
DROP POLICY IF EXISTS "Users can manage their own chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Enable access for all users" ON chat_sessions;
DROP POLICY IF EXISTS "Allow all" ON chat_sessions;

-- SELECT: users see only their own chat sessions
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'chat_sessions' AND policyname = 'Users see own chat sessions'
  ) THEN
    CREATE POLICY "Users see own chat sessions" ON chat_sessions
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

-- INSERT: users can create chat sessions for themselves
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'chat_sessions' AND policyname = 'Users create own chat sessions'
  ) THEN
    CREATE POLICY "Users create own chat sessions" ON chat_sessions
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- UPDATE: users can update their own chat sessions (message history)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'chat_sessions' AND policyname = 'Users update own chat sessions'
  ) THEN
    CREATE POLICY "Users update own chat sessions" ON chat_sessions
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;
