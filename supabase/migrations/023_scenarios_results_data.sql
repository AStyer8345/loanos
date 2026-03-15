-- Add results_data column to scenarios table
-- Stores calculated results (without amortization schedules) for share page and PDF
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS results_data jsonb;
