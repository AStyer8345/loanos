-- Migration 008: Outlook integration tables + activity_log extensions
-- Idempotent — uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS pattern
-- Run in Supabase SQL editor

-- ─────────────────────────────────────────────────────────────────────────────
-- outlook_tokens table — stores OAuth tokens per connected Outlook account
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS outlook_tokens (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  access_token  TEXT        NOT NULL,
  refresh_token TEXT        NOT NULL,
  expires_at    TIMESTAMPTZ NOT NULL,
  email         TEXT        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique email — only one token set per connected account
CREATE UNIQUE INDEX IF NOT EXISTS idx_outlook_tokens_email ON outlook_tokens(email);

-- ─────────────────────────────────────────────────────────────────────────────
-- activity_log extensions — add email-sync columns
-- ─────────────────────────────────────────────────────────────────────────────

-- type: canonical event type for email entries (email_inbound, email_outbound, etc.)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'activity_log' AND column_name = 'type'
  ) THEN
    ALTER TABLE activity_log ADD COLUMN type TEXT;
  END IF;
END $$;

-- summary: human-readable one-liner shown in the timeline
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'activity_log' AND column_name = 'summary'
  ) THEN
    ALTER TABLE activity_log ADD COLUMN summary TEXT;
  END IF;
END $$;

-- raw_payload: full Graph API message object for expandable detail view
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'activity_log' AND column_name = 'raw_payload'
  ) THEN
    ALTER TABLE activity_log ADD COLUMN raw_payload JSONB;
  END IF;
END $$;

-- external_id: deduplication key (internetMessageId for emails, arive_loan_id, etc.)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'activity_log' AND column_name = 'external_id'
  ) THEN
    ALTER TABLE activity_log ADD COLUMN external_id TEXT;
  END IF;
END $$;

-- Unique constraint for deduplication: same type + same external_id = same event
-- Only applies when both columns are non-null (partial unique index)
CREATE UNIQUE INDEX IF NOT EXISTS idx_activity_log_type_external_id
  ON activity_log(type, external_id)
  WHERE type IS NOT NULL AND external_id IS NOT NULL;

-- Performance index for contact timeline queries
CREATE INDEX IF NOT EXISTS idx_activity_log_contact_created
  ON activity_log(contact_id, created_at DESC)
  WHERE contact_id IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- oauth_state table — CSRF protection for OAuth flow
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS oauth_state (
  state      TEXT        PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  used_at    TIMESTAMPTZ
);

-- Auto-expire states older than 1 hour (cleaned up on next auth attempt)
CREATE INDEX IF NOT EXISTS idx_oauth_state_created ON oauth_state(created_at);
