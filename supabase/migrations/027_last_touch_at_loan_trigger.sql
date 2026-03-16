-- Migration 027: Auto-update contacts.last_touch_at on loan record edits
-- Idempotent — uses CREATE OR REPLACE

-- ─────────────────────────────────────────────────────────────────────────────
-- TRIGGER FUNCTION
-- When a loan row is updated and has a contact_id, bump last_touch_at on
-- the linked contact. This ensures even edits made directly in Supabase or
-- via Arive sync automatically register as a touch.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION propagate_loan_update_to_contact_last_touch()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.contact_id IS NOT NULL THEN
    UPDATE contacts
    SET last_touch_at = NOW()
    WHERE id = NEW.contact_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists before recreating (idempotent)
DROP TRIGGER IF EXISTS loans_update_contact_last_touch ON loans;

CREATE TRIGGER loans_update_contact_last_touch
  AFTER UPDATE ON loans
  FOR EACH ROW
  WHEN (NEW.contact_id IS NOT NULL)
  EXECUTE FUNCTION propagate_loan_update_to_contact_last_touch();
