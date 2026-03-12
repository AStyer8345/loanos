-- ============================================================
-- LoanOS — Migration 010: Milestone Communication Agent Tables
-- Adds tables for Agent 5 (Loan Milestone Comms) and
-- last_touch column for Agent 1 (Daily Briefing).
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- CONTACTS — last_touch for realtor cadence tracking
-- ─────────────────────────────────────────────────────────────
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_touch TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_contacts_last_touch ON contacts(last_touch);

-- ─────────────────────────────────────────────────────────────
-- LOAN_MILESTONE_EVENTS
-- One row per milestone event received from n8n / Arive.
-- loan_id is the Arive external ID (TEXT), not the internal UUID.
-- No RLS — written exclusively via service role key.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS loan_milestone_events (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  loan_id         TEXT        NOT NULL,
  borrower_name   TEXT,
  borrower_email  TEXT,
  realtor_name    TEXT,
  realtor_email   TEXT,
  milestone       TEXT        NOT NULL CHECK (milestone IN (
                    'application_received',
                    'processing',
                    'appraisal_ordered',
                    'conditional_approval',
                    'clear_to_close',
                    'closing_scheduled',
                    'funded'
                  )),
  raw_payload     JSONB,
  processed_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_milestone_events_loan_id    ON loan_milestone_events(loan_id);
CREATE INDEX IF NOT EXISTS idx_milestone_events_created_at ON loan_milestone_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_milestone_events_milestone  ON loan_milestone_events(milestone);

-- ─────────────────────────────────────────────────────────────
-- MILESTONE_COMMUNICATIONS
-- One row per drafted email (borrower + realtor = 2 rows per event).
-- draft_pushed = true once the Zapier dispatch webhook accepted it.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS milestone_communications (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  milestone_event_id   UUID        REFERENCES loan_milestone_events(id) ON DELETE CASCADE,
  recipient_type       TEXT        NOT NULL CHECK (recipient_type IN ('borrower', 'realtor')),
  recipient_email      TEXT,
  subject              TEXT,
  body                 TEXT,
  draft_pushed         BOOLEAN     NOT NULL DEFAULT false,
  draft_pushed_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_milestone_comms_event_id     ON milestone_communications(milestone_event_id);
CREATE INDEX IF NOT EXISTS idx_milestone_comms_draft_pushed ON milestone_communications(draft_pushed) WHERE draft_pushed = false;
CREATE INDEX IF NOT EXISTS idx_milestone_comms_created_at   ON milestone_communications(created_at DESC);
