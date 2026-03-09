-- Migration 004: Marketing Command Center state table
-- Stores MCC state as a single JSONB blob per user
-- key = 'mcc' (extensible for future keys)

CREATE TABLE IF NOT EXISTS mcc_state (
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key        TEXT        NOT NULL DEFAULT 'mcc',
  value      JSONB       NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, key)
);

-- RLS
ALTER TABLE mcc_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own mcc_state"
  ON mcc_state FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert their own mcc_state"
  ON mcc_state FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mcc_state"
  ON mcc_state FOR UPDATE
  USING (auth.uid() = user_id);
