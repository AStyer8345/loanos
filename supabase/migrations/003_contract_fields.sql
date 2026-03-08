-- ============================================================
-- LoanOS — Migration 003: Contract Fields + n8n Webhook Trigger
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ------------------------------------------------------------
-- 1. Add contract-extracted columns to loans table
-- ------------------------------------------------------------
ALTER TABLE loans
  ADD COLUMN IF NOT EXISTS sales_price              NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS closing_date             DATE,
  ADD COLUMN IF NOT EXISTS effective_date           DATE,
  ADD COLUMN IF NOT EXISTS option_expiration        DATE,
  ADD COLUMN IF NOT EXISTS earnest_money            NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS option_fee               NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS seller_concessions       NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS down_payment_pct         NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS estimated_ltv            NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS county                   TEXT,
  ADD COLUMN IF NOT EXISTS title_company            TEXT,
  ADD COLUMN IF NOT EXISTS buyer_agent_name         TEXT,
  ADD COLUMN IF NOT EXISTS buyer_agent_email        TEXT,
  ADD COLUMN IF NOT EXISTS buyer_agent_brokerage    TEXT,
  ADD COLUMN IF NOT EXISTS listing_agent_name       TEXT,
  ADD COLUMN IF NOT EXISTS listing_agent_email      TEXT,
  ADD COLUMN IF NOT EXISTS listing_agent_brokerage  TEXT,
  ADD COLUMN IF NOT EXISTS contract_data            JSONB;   -- full Claude extraction output

-- ------------------------------------------------------------
-- 2. Enable pg_net for outbound HTTP from database triggers
--    NOTE: Requires Supabase Pro plan or higher.
--    If on free tier, use Supabase Dashboard → Database → Webhooks
--    (Tables: documents, Event: INSERT) and skip steps 3-4.
-- ------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ------------------------------------------------------------
-- 3. Webhook trigger function — fires to n8n on contract insert
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION notify_n8n_contract_received()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.doc_type = 'contract' THEN
    PERFORM pg_net.http_post(
      url     := 'YOUR_N8N_WEBHOOK_URL',  -- ← replace with your n8n webhook URL
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body    := json_build_object(
        'document_id',  NEW.id,
        'loan_id',      NEW.loan_id,
        'file_path',    NEW.file_path,
        'file_name',    NEW.file_name,
        'doc_type',     NEW.doc_type,
        'user_id',      NEW.user_id,
        'created_at',   NEW.created_at
      )::text
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------
-- 4. Attach trigger to documents table
-- ------------------------------------------------------------
DROP TRIGGER IF EXISTS on_contract_document_inserted ON documents;

CREATE TRIGGER on_contract_document_inserted
  AFTER INSERT ON documents
  FOR EACH ROW
  EXECUTE FUNCTION notify_n8n_contract_received();
