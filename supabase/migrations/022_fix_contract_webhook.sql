-- ============================================================
-- Migration 022: Disable contract document webhook trigger
--
-- Migration 003 created a trigger that fires pg_net.http_post()
-- to 'YOUR_N8N_WEBHOOK_URL' on every contract document INSERT.
-- The Contract Received n8n workflow (WF10) is not yet ready
-- and the placeholder URL would fail silently on every upload.
--
-- Disable the trigger until WF10 is configured and tested.
-- To re-enable: CREATE TRIGGER on_contract_document_inserted ...
-- (see migration 003 for the original trigger definition)
-- ============================================================

DROP TRIGGER IF EXISTS on_contract_document_inserted ON documents;
