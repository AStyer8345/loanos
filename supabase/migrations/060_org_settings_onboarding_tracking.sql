-- Add onboarding progress tracking to org_settings
ALTER TABLE org_settings
  ADD COLUMN IF NOT EXISTS onboarding_completed   BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_step        INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS setup_arive_done       BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS setup_import_done      BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS setup_automations_done BOOLEAN NOT NULL DEFAULT false;
