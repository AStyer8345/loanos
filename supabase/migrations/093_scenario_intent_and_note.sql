-- 093_scenario_intent_and_note.sql
-- Borrower intent capture: which option the borrower tapped on the share page.
-- LO personal note: per-scenario handwritten note from the LO.

ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS borrower_intent JSONB DEFAULT NULL;
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS lo_note TEXT DEFAULT NULL;
