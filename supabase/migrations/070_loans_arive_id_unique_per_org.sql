-- Migration: Change loans unique constraint from global arive_loan_id to per-org
-- This allows different organizations to independently track loans with the same Arive ID
-- (e.g., if two LOs use separate Arive instances with overlapping IDs).

-- Drop the old global unique constraint
ALTER TABLE loans DROP CONSTRAINT loans_arive_loan_id_key;

-- Add per-org unique constraint
ALTER TABLE loans ADD CONSTRAINT loans_arive_loan_id_org_unique UNIQUE (arive_loan_id, organization_id);
