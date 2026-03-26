-- Migration 058: Add hot_lead_dismissed column to contacts
-- Allows dismissing a contact from the Hot Leads dashboard widget
-- without deleting or changing their stage.

ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS hot_lead_dismissed boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN contacts.hot_lead_dismissed IS
  'When true, this contact is hidden from the Hot Leads dashboard widget.';
