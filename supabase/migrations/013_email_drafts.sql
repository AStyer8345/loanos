-- ============================================================
-- LoanOS — Email Drafts Table
-- Stores email payloads whenever an automation creates an Outlook draft
-- ============================================================

CREATE TABLE IF NOT EXISTS email_drafts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  loan_id UUID REFERENCES loans(id) ON DELETE SET NULL,
  automation_name TEXT NOT NULL, -- 'pre_approval', 'contract_received', 'final_cd', 'review_request', 'referral_intro', 'morning_report'
  recipient_name TEXT,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_preview TEXT, -- first 200 chars, plain text, auto-generated
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'discarded')),
  outlook_draft_id TEXT, -- store Outlook draft ID if available from Zapier response
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at (reuses existing trigger function from 001_initial_schema.sql)
CREATE TRIGGER update_email_drafts_updated_at
  BEFORE UPDATE ON email_drafts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Index for dashboard queries
CREATE INDEX idx_email_drafts_created_at ON email_drafts(created_at DESC);
CREATE INDEX idx_email_drafts_status ON email_drafts(status);
CREATE INDEX idx_email_drafts_contact_id ON email_drafts(contact_id);

-- RLS — service role only (no user_id column; accessed via server API routes)
ALTER TABLE email_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON email_drafts
  USING (true) WITH CHECK (true);
