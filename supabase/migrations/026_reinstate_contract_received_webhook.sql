-- Recreate the contract-received webhook trigger with actual n8n URL
-- (Originally created in 003, dropped in 022 because URL was placeholder)

CREATE OR REPLACE FUNCTION notify_n8n_contract_received()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.doc_type = 'contract' THEN
    PERFORM net.http_post(
      url     := 'https://styer.app.n8n.cloud/webhook/loanos-contract-received',
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

DROP TRIGGER IF EXISTS on_contract_document_inserted ON documents;

CREATE TRIGGER on_contract_document_inserted
  AFTER INSERT ON documents
  FOR EACH ROW
  EXECUTE FUNCTION notify_n8n_contract_received();
