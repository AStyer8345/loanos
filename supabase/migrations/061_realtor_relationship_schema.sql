-- =====================================================
-- Migration 061: Realtor Relationship System Schema
-- Date: 2026-03-29
-- =====================================================

-- Referral performance tracking (for realtor contacts)
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS referred_by_contact_id uuid REFERENCES contacts(id);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS referral_ytd_count integer NOT NULL DEFAULT 0;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS referral_lifetime_count integer NOT NULL DEFAULT 0;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_referral_date date;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS deals_ytd_count integer NOT NULL DEFAULT 0;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS deals_lifetime_count integer NOT NULL DEFAULT 0;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_deal_closed_date date;

-- Outreach tracking
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_outreach_date date;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS referral_source_notes text;

-- Loans: dedicated referral source FK
ALTER TABLE loans ADD COLUMN IF NOT EXISTS referral_contact_id uuid REFERENCES contacts(id);

-- Function: update contacts.last_touch_at on every activity_log insert
CREATE OR REPLACE FUNCTION fn_update_contact_last_touch_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.contact_id IS NOT NULL THEN
    UPDATE contacts
    SET last_touch_at = COALESCE(NEW.created_at, NOW())
    WHERE id = NEW.contact_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger: fires AFTER INSERT on activity_log
DROP TRIGGER IF EXISTS trg_activity_log_update_last_touch ON activity_log;
CREATE TRIGGER trg_activity_log_update_last_touch
  AFTER INSERT ON activity_log
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_contact_last_touch_at();
