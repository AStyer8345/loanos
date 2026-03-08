-- ============================================================
-- LoanOS — Initial Schema
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Enable UUID extension (already enabled on most Supabase projects)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================
-- CONTACTS
-- ============================================================
CREATE TABLE contacts (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  first_name    TEXT        NOT NULL,
  last_name     TEXT        NOT NULL,
  email         TEXT,
  phone         TEXT,
  contact_type  TEXT        CHECK (contact_type IN ('borrower', 'realtor', 'other')),
  notes         TEXT,
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX contacts_user_id_idx ON contacts(user_id);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own contacts"
  ON contacts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ============================================================
-- LOANS
-- ============================================================
CREATE TABLE loans (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  loan_number      TEXT,
  status           TEXT        DEFAULT 'lead',
  loan_amount      NUMERIC(15,2),
  property_address TEXT,
  loan_purpose     TEXT,
  loan_type        TEXT,
  contact_id       UUID        REFERENCES contacts(id) ON DELETE SET NULL,
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX loans_user_id_idx ON loans(user_id);
CREATE INDEX loans_contact_id_idx ON loans(contact_id);

ALTER TABLE loans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own loans"
  ON loans FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ============================================================
-- DOCUMENTS
-- ============================================================
CREATE TABLE documents (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  file_name   TEXT        NOT NULL,
  file_path   TEXT        NOT NULL,  -- path inside the storage bucket
  file_size   INTEGER,
  mime_type   TEXT,
  loan_id     UUID        REFERENCES loans(id) ON DELETE CASCADE,
  contact_id  UUID        REFERENCES contacts(id) ON DELETE SET NULL,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX documents_user_id_idx ON documents(user_id);
CREATE INDEX documents_loan_id_idx ON documents(loan_id);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own documents"
  ON documents FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ============================================================
-- ACTIVITY LOG
-- ============================================================
CREATE TABLE activity_log (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  action       TEXT        NOT NULL,   -- e.g. 'loan.created', 'document.uploaded'
  entity_type  TEXT,                   -- 'loan', 'contact', 'document'
  entity_id    UUID,
  metadata     JSONB,
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX activity_log_user_id_idx ON activity_log(user_id);
CREATE INDEX activity_log_entity_id_idx ON activity_log(entity_id);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own activity"
  ON activity_log FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ============================================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contacts_updated_at  BEFORE UPDATE ON contacts  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER loans_updated_at     BEFORE UPDATE ON loans     FOR EACH ROW EXECUTE FUNCTION update_updated_at();
