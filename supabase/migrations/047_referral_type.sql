-- ============================================================
-- Add referral_type to contacts
-- Tracks how a lead was acquired (web form, realtor, past client, etc.)
-- ============================================================

ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS referral_type TEXT
  CHECK (referral_type IN (
    'web_lead',
    'realtor_referral',
    'client_referral',
    'past_client',
    'friend_family',
    'financial_advisor_referral',
    'builder_referral',
    'open_house',
    'other'
  ));

-- Auto-label existing contacts (best-effort backfill)

-- Web leads: lead_source contains 'website' OR notes contain '[Web Lead'
UPDATE contacts
  SET referral_type = 'web_lead'
  WHERE referral_type IS NULL
    AND (lead_source ILIKE '%website%' OR notes ILIKE '%[web lead%');

-- Realtor referrals: has a referred_by name and not already tagged as web lead
UPDATE contacts
  SET referral_type = 'realtor_referral'
  WHERE referral_type IS NULL
    AND referred_by IS NOT NULL
    AND referred_by != '';
