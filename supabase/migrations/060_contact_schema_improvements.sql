-- Migration 060: Contact Schema Improvements
-- Date: 2026-03-27
-- Decisions: all 8 Adam schema decisions from 2026-03-25 contact architecture research
-- Spec: tasks/crm/specs/contact-schema-improvement-spec.md

-- ============================================================
-- PART 1: ADD NEW COLUMNS (additive only — no drops)
-- ============================================================

ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS do_not_call           BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS production_tier       TEXT CHECK (production_tier IN ('A','B','C')),
  ADD COLUMN IF NOT EXISTS realtor_stage         TEXT CHECK (realtor_stage IN ('Active Partner','Prospecting','Lead')),
  ADD COLUMN IF NOT EXISTS current_rate          NUMERIC(5,3),
  ADD COLUMN IF NOT EXISTS current_loan_balance  NUMERIC(12,2);

-- ============================================================
-- PART 2: PHONE CONSOLIDATION (decision #1)
-- Copy phone_mobile → phone where phone is null (1 record)
-- Copy home_phone → phone where phone is null (105 records)
-- Existing phone values are NEVER overwritten.
-- ============================================================

UPDATE contacts
SET phone = phone_mobile,
    updated_at = NOW()
WHERE phone_mobile IS NOT NULL
  AND phone IS NULL;

UPDATE contacts
SET phone = home_phone,
    updated_at = NOW()
WHERE home_phone IS NOT NULL
  AND phone IS NULL;

-- ============================================================
-- PART 3: PRODUCTION TIER BACKFILL (decision #6)
-- top_realtor = true → 'A' (114 records)
-- target_realtor = true only (top_realtor = false) → 'B' (6 records)
-- Neither → NULL (no change)
-- ============================================================

UPDATE contacts
SET production_tier = 'A',
    updated_at = NOW()
WHERE top_realtor = true;

UPDATE contacts
SET production_tier = 'B',
    updated_at = NOW()
WHERE top_realtor = false
  AND target_realtor = true
  AND production_tier IS NULL;

-- ============================================================
-- PART 4: CLEAN UP realtor_email / realtor_phone (decision #8)
-- 1 sample contact (Dwayne Johnson SAMPLE) had these fields populated.
-- These are conceptually wrong fields — realtors have their own contact record.
-- ============================================================

UPDATE contacts
SET realtor_email = NULL,
    realtor_phone = NULL,
    updated_at = NOW()
WHERE realtor_email IS NOT NULL
   OR realtor_phone IS NOT NULL;

-- ============================================================
-- PART 5: COMMENTS FOR DOCUMENTATION
-- ============================================================

COMMENT ON COLUMN contacts.do_not_call IS 'TCPA compliance — block SMS/call automations when true. Added 2026-03-27.';
COMMENT ON COLUMN contacts.production_tier IS 'Realtor production tier: A (top partner), B (target/prospecting), C (occasional). Replaces top_realtor/target_realtor booleans. Added 2026-03-27.';
COMMENT ON COLUMN contacts.realtor_stage IS 'Realtor-specific pipeline stage: Active Partner / Prospecting / Lead. Separate from borrower stage. Added 2026-03-27.';
COMMENT ON COLUMN contacts.current_rate IS 'Borrower''s current loan rate (e.g., 6.875). Used for refi opportunity scoring. Added 2026-03-27.';
COMMENT ON COLUMN contacts.current_loan_balance IS 'Borrower''s current outstanding loan balance. Used for refi opportunity scoring. Added 2026-03-27.';
