-- Migration: Change contacts unique constraint from global email to per-org email
-- This allows the same borrower email to exist in different organizations
-- (e.g., two LOs sharing the same borrower).

-- Drop the old global unique constraint
ALTER TABLE contacts DROP CONSTRAINT contacts_email_unique;

-- Add per-org unique constraint (same email can exist in different orgs)
ALTER TABLE contacts ADD CONSTRAINT contacts_email_org_unique UNIQUE (email, organization_id);
