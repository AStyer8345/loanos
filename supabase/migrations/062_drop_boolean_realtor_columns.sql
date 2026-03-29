-- Migration 062: Drop deprecated boolean realtor columns
-- Code references removed in migration 061 / import route cleanup.
-- production_tier supersedes top_realtor / target_realtor.
ALTER TABLE contacts DROP COLUMN IF EXISTS top_realtor;
ALTER TABLE contacts DROP COLUMN IF EXISTS target_realtor;
