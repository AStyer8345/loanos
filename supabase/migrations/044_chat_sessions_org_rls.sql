-- Migration 044: Switch chat_sessions RLS from user_id to organization_id scoping
-- chat_sessions already has organization_id column (added in migration 030).
-- The 4 existing policies used auth.uid() = user_id — correct for single-tenant
-- but wrong for multi-tenant (teammates can't see shared sessions).
-- Replace with org-scoped policies matching the pattern used by loans/contacts/documents.

-- Drop existing user_id-scoped policies
DROP POLICY IF EXISTS "chat_sessions_select" ON chat_sessions;
DROP POLICY IF EXISTS "chat_sessions_insert" ON chat_sessions;
DROP POLICY IF EXISTS "chat_sessions_update" ON chat_sessions;
DROP POLICY IF EXISTS "chat_sessions_delete" ON chat_sessions;

-- Recreate as org-scoped
CREATE POLICY "chat_sessions_select"
  ON chat_sessions FOR SELECT
  USING (organization_id = get_my_organization_id());

CREATE POLICY "chat_sessions_insert"
  ON chat_sessions FOR INSERT
  WITH CHECK (organization_id = get_my_organization_id());

CREATE POLICY "chat_sessions_update"
  ON chat_sessions FOR UPDATE
  USING (organization_id = get_my_organization_id());

CREATE POLICY "chat_sessions_delete"
  ON chat_sessions FOR DELETE
  USING (organization_id = get_my_organization_id());
