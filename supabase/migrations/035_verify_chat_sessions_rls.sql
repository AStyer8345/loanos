-- Migration 035: Ensure chat_sessions RLS is properly scoped
-- Drops any remaining USING(true) policies and re-applies user-scoped ones

-- Drop all existing policies
DROP POLICY IF EXISTS "Enable access for all users" ON chat_sessions;
DROP POLICY IF EXISTS "Allow all" ON chat_sessions;
DROP POLICY IF EXISTS "Users can manage their own chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users see own chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users create own chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users update own chat sessions" ON chat_sessions;

-- Ensure user_id column exists
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Apply scoped policies
CREATE POLICY "chat_sessions_select" ON chat_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "chat_sessions_insert" ON chat_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "chat_sessions_update" ON chat_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "chat_sessions_delete" ON chat_sessions
  FOR DELETE USING (auth.uid() = user_id);
