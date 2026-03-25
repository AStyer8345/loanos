-- Fix: performance_data INSERT policy was missing WITH CHECK
-- This allowed any authenticated user to insert rows with any organization_id
-- References: Enterprise session 2026-03-25 research, security audit

DROP POLICY IF EXISTS "org members can insert performance_data" ON performance_data;

CREATE POLICY "org members can insert performance_data" ON performance_data
  FOR INSERT
  WITH CHECK (organization_id = get_my_organization_id());

-- Verify all three policies are now properly scoped
-- SELECT: organization_id = get_my_organization_id() ✓ (existing)
-- INSERT: WITH CHECK organization_id = get_my_organization_id() ✓ (this migration)
-- UPDATE: organization_id = get_my_organization_id() ✓ (existing)
