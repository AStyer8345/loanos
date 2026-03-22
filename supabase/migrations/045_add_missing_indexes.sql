-- 045_add_missing_indexes.sql
-- Adds indexes on high-traffic FK columns that were missing.
-- Safe to run multiple times — uses CREATE INDEX IF NOT EXISTS.

-- contacts
CREATE INDEX IF NOT EXISTS idx_contacts_organization_id ON public.contacts (organization_id);

-- loans
CREATE INDEX IF NOT EXISTS idx_loans_organization_id ON public.loans (organization_id);
CREATE INDEX IF NOT EXISTS idx_loans_contact_id ON public.loans (contact_id);

-- activity_log
CREATE INDEX IF NOT EXISTS idx_activity_log_organization_id ON public.activity_log (organization_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_loan_id ON public.activity_log (loan_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_contact_id ON public.activity_log (contact_id);

-- contact_activity
CREATE INDEX IF NOT EXISTS idx_contact_activity_contact_id ON public.contact_activity (contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_activity_loan_id ON public.contact_activity (loan_id);

-- loan_status_history
CREATE INDEX IF NOT EXISTS idx_loan_status_history_loan_id ON public.loan_status_history (loan_id);

-- documents
CREATE INDEX IF NOT EXISTS idx_documents_loan_id ON public.documents (loan_id);
CREATE INDEX IF NOT EXISTS idx_documents_organization_id ON public.documents (organization_id);
