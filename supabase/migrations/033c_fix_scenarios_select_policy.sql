-- Fix scenarios SELECT policy: remove share_token bypass
-- The public share route uses service client (bypasses RLS) — the OR clause is not needed.
DROP POLICY IF EXISTS "Org members can read scenarios" ON scenarios;

CREATE POLICY "Org members can read scenarios"
  ON scenarios FOR SELECT
  USING (organization_id = get_my_organization_id());