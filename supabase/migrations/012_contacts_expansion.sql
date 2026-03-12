-- 012_contacts_expansion.sql
-- Expand contacts table with address, mobile, notes, activity fields

ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS created_date       TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS last_activity_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS notes              TEXT,
  ADD COLUMN IF NOT EXISTS phone_mobile       TEXT,
  ADD COLUMN IF NOT EXISTS mailing_street     TEXT,
  ADD COLUMN IF NOT EXISTS mailing_city       TEXT,
  ADD COLUMN IF NOT EXISTS mailing_state      TEXT,
  ADD COLUMN IF NOT EXISTS mailing_zip        TEXT,
  ADD COLUMN IF NOT EXISTS mailing_country    TEXT,
  ADD COLUMN IF NOT EXISTS title              TEXT;
