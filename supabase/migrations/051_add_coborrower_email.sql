-- Migration 051: Add co_borrower_email to contacts
-- 2026-03-24

ALTER TABLE contacts ADD COLUMN IF NOT EXISTS co_borrower_email TEXT;
