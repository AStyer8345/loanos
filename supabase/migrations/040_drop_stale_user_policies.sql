-- ============================================================
-- Migration 040: Drop stale user_id-based policies
--
-- In Supabase RLS, multiple policies on the same operation are
-- OR'd together. Stale user_id-based policies that coexist with
-- org-based policies expand access beyond intended scope.
--
-- Targets:
--   contacts      — 4 old user_id policies (031 should have dropped these)
--   activity_log  — UPDATE policy (audit log is immutable by design)
--   marketing_activity_log — old ALL policy (redundant with 039's 4 policies)
-- ============================================================


-- ─────────────────────────────────────────────────
-- CONTACTS: drop legacy user_id-scoped policies
-- These should have been dropped in migration 031 but weren't.
-- Org-scoped policies from 031 remain and are the correct policies.
-- ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "contacts_select_own"  ON contacts;
DROP POLICY IF EXISTS "contacts_insert_own"  ON contacts;
DROP POLICY IF EXISTS "contacts_update_own"  ON contacts;
DROP POLICY IF EXISTS "contacts_delete_own"  ON contacts;


-- ─────────────────────────────────────────────────
-- ACTIVITY_LOG: drop UPDATE policy
-- Audit logs are immutable — INSERT and SELECT only.
-- Service role retains full access via RLS bypass.
-- ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can update own activity"  ON activity_log;


-- ─────────────────────────────────────────────────
-- MARKETING_ACTIVITY_LOG: drop catch-all ALL policy
-- Migration 039 added 4 scoped per-operation policies.
-- The legacy ALL policy is redundant and overly broad.
-- ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can manage their own marketing activity log"  ON marketing_activity_log;
