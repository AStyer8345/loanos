-- Migration 084: Create notes table + add event_type to activity_log
-- Separates human-written notes from system activity events.
-- SaaS-safe: org-scoped via RLS

-- ── 1. Create notes table ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  contact_id      uuid REFERENCES contacts(id) ON DELETE CASCADE,
  loan_id         uuid REFERENCES loans(id) ON DELETE SET NULL,
  content         text NOT NULL,
  created_by      uuid REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz  -- soft delete
);

-- ── 2. Add event_type to activity_log ───────────────────────────────────────

ALTER TABLE activity_log ADD COLUMN IF NOT EXISTS event_type text;

-- ── 3. Add migrated flag to contact_activity ────────────────────────────────

ALTER TABLE contact_activity ADD COLUMN IF NOT EXISTS migrated boolean DEFAULT false;

-- ── 4. Backfill event_type from existing action values ──────────────────────

UPDATE activity_log SET event_type = CASE
  WHEN action IN ('email.received', 'email_received', 'email_outbound', 'emails.drafted', 'Email') THEN 'email_sent'
  WHEN action IN ('status_updated', 'loan_stage_changed', 'loan.status_changed', 'loan_status_changed',
                  'Application Received', 'Cleared to Close', 'Loan Funded', 'Pre-Approval Issued') THEN 'status_changed'
  WHEN action IN ('automation_fired', 'contract.received', 'referral_intro_email_drafted') THEN 'automation_fired'
  WHEN action IN ('document.uploaded', 'document.unmatched') THEN 'document_uploaded'
  WHEN action IN ('note_added', 'note.added', 'Logged note') THEN 'note_added'
  WHEN action IN ('imessage.received') THEN 'imessage_received'
  WHEN action IN ('communication.logged', 'Call', 'Text', 'call_logged', 'sms_sent') THEN 'communication_logged'
  WHEN action IN ('arive.webhook.error', 'error_loan_not_found') THEN 'system_error'
  WHEN action IN ('loan_created', 'contact_updated', 'contact_created') THEN 'record_changed'
  ELSE 'other'
END
WHERE event_type IS NULL;

-- ── 5. Migrate contact_activity note rows → notes table ─────────────────────

INSERT INTO notes (organization_id, contact_id, loan_id, content, created_by, created_at, updated_at)
SELECT
  ca.organization_id,
  ca.contact_id,
  ca.loan_id,
  ca.notes,
  ca.user_id,
  ca.logged_at,
  ca.logged_at
FROM contact_activity ca
WHERE ca.activity_type = 'note'
  AND ca.notes IS NOT NULL
  AND ca.notes != ''
  AND ca.migrated IS NOT TRUE;

-- ── 6. Mark migrated rows ───────────────────────────────────────────────────

UPDATE contact_activity SET migrated = true
WHERE activity_type = 'note' AND notes IS NOT NULL AND notes != '';

-- ── 7. RLS on notes ────────────────────────────────────────────────────────

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_select_notes" ON notes
  FOR SELECT USING (organization_id = get_my_organization_id());

CREATE POLICY "org_insert_notes" ON notes
  FOR INSERT WITH CHECK (organization_id = get_my_organization_id());

CREATE POLICY "org_update_notes" ON notes
  FOR UPDATE USING (organization_id = get_my_organization_id());

CREATE POLICY "org_delete_notes" ON notes
  FOR DELETE USING (
    organization_id = get_my_organization_id()
    AND get_my_role() IN ('owner', 'admin')
  );

-- ── 8. Indexes ──────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_notes_contact_id ON notes(contact_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notes_loan_id ON notes(loan_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notes_org_id ON notes(organization_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_event_type ON activity_log(event_type);

-- ── 9. updated_at trigger ───────────────────────────────────────────────────

CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
