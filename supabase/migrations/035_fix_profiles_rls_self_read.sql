-- Migration 035: Fix profiles RLS — add direct self-read policy
-- The existing "Users can read profiles in their org" policy is self-referential
-- (queries profiles inside its own USING clause → infinite recursion).
-- This migration adds a simple "can always read your own row" escape hatch.
-- Migration 036 then fixes the circular org-read policy.

CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
USING (id = auth.uid());
