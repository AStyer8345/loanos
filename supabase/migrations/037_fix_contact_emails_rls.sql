-- ============================================================
-- Migration 037: Fix unscoped USING(true) on contact_emails
-- contact_emails has no org_id column; scope via loan_id → loans
-- or contact_id → contacts, both of which carry organization_id.
-- Service role bypasses RLS entirely so no explicit service policy needed.
-- ============================================================

-- Drop the unscoped catch-all policy
DROP POLICY IF EXISTS "service role full access" ON contact_emails;

-- SELECT: org members can read emails linked to their org's loans or contacts
CREATE POLICY "contact_emails_select"
  ON contact_emails FOR SELECT
  USING (
    (loan_id IS NOT NULL AND loan_id IN (
      SELECT id FROM loans WHERE organization_id = get_my_organization_id()
    ))
    OR
    (loan_id IS NULL AND contact_id IS NOT NULL AND contact_id IN (
      SELECT id FROM contacts WHERE organization_id = get_my_organization_id()
    ))
  );

-- INSERT: org members can log emails for their org's loans or contacts
CREATE POLICY "contact_emails_insert"
  ON contact_emails FOR INSERT
  WITH CHECK (
    (loan_id IS NOT NULL AND loan_id IN (
      SELECT id FROM loans WHERE organization_id = get_my_organization_id()
    ))
    OR
    (loan_id IS NULL AND contact_id IS NOT NULL AND contact_id IN (
      SELECT id FROM contacts WHERE organization_id = get_my_organization_id()
    ))
  );

-- UPDATE: org members can update email records in their org
CREATE POLICY "contact_emails_update"
  ON contact_emails FOR UPDATE
  USING (
    (loan_id IS NOT NULL AND loan_id IN (
      SELECT id FROM loans WHERE organization_id = get_my_organization_id()
    ))
    OR
    (loan_id IS NULL AND contact_id IS NOT NULL AND contact_id IN (
      SELECT id FROM contacts WHERE organization_id = get_my_organization_id()
    ))
  )
  WITH CHECK (
    (loan_id IS NOT NULL AND loan_id IN (
      SELECT id FROM loans WHERE organization_id = get_my_organization_id()
    ))
    OR
    (loan_id IS NULL AND contact_id IS NOT NULL AND contact_id IN (
      SELECT id FROM contacts WHERE organization_id = get_my_organization_id()
    ))
  );

-- DELETE: only org owners/admins can delete email log entries
CREATE POLICY "contact_emails_delete"
  ON contact_emails FOR DELETE
  USING (
    get_my_role() IN ('owner', 'admin')
    AND (
      (loan_id IS NOT NULL AND loan_id IN (
        SELECT id FROM loans WHERE organization_id = get_my_organization_id()
      ))
      OR
      (loan_id IS NULL AND contact_id IS NOT NULL AND contact_id IN (
        SELECT id FROM contacts WHERE organization_id = get_my_organization_id()
      ))
    )
  );
