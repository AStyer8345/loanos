CREATE OR REPLACE FUNCTION public.sync_contact_stage_from_loan()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Only sync if the loan has a linked contact
  IF NEW.contact_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.organization_id='18613f82-fdd9-42dd-a09e-f3c577328258'::uuid THEN
    UPDATE public.contacts SET stage=CASE
      WHEN upper(NEW.status)='PREAPPROVED' THEN 'Pre-Approved'
      WHEN upper(NEW.status) IN ('APPLICATION_INTAKE','QUALIFICATION') THEN 'Application'
      WHEN upper(NEW.status) IN ('LOAN_SETUP','DISCLOSURE_SENT','UNDERWRITING_SUBMITTED','APPROVED_WITH_CONDITION','APPROVED_WITH_CONDITIONS','RE_SUBMITTAL','CLEAR_TO_CLOSE') THEN 'In Process'
      WHEN upper(NEW.status)='LOAN_FUNDED' THEN 'Closed'
      WHEN upper(NEW.status)='ADVERSE' OR NEW.archive_indicator THEN 'Archived/not qualified'
      ELSE stage END
    WHERE id=NEW.contact_id AND organization_id=NEW.organization_id;
    RETURN NEW;
  END IF;

  -- Map loan status to contact stage
  IF NEW.status IN (
    'setup', 'Loan Setup', 'LOAN_SETUP',
    'disclosed', 'Disclosed', 'DISCLOSURE_SENT',
    'submitted', 'Submitted', 'Submitted to UW', 'Submitted to Underwriting', 'SUBMITTED', 'UNDERWRITING_SUBMITTED',
    'approved', 'Approved', 'Approved with Conditions', 'Approved w/ Conditions', 'APPROVED_WITH_CONDITIONS', 'CONDITIONAL_APPROVAL', 'Conditional Approval',
    'resubmit', 'Resubmit', 'Resubmitted', 'RESUBMIT', 'RESUBMITTED', 'RE_SUBMITTAL',
    'underwriting', 'Underwriting',
    'processing', 'Processing', 'In Process', 'Loan in Process',
    'clear_to_close', 'Clear to Close', 'Clear To Close', 'CLEAR_TO_CLOSE', 'CTC', 'Closing'
  ) THEN
    UPDATE contacts SET stage = 'In Process', updated_at = now()
    WHERE id = NEW.contact_id;
  ELSIF NEW.status IN ('funded', 'Funded', 'Closed', 'closed', 'Closed/Funded', 'LOAN_FUNDED', 'Closed Client') THEN
    UPDATE contacts SET stage = 'Closed', updated_at = now()
    WHERE id = NEW.contact_id;
  ELSIF NEW.status IN ('pre_approval', 'pre_approved', 'Pre-Approved', 'Pre-App', 'pre-approval', 'Started', 'Started App', 'Application', 'application_intake', 'APPLICATION_INTAKE', 'QUALIFICATION') THEN
    UPDATE contacts SET stage = 'Pre-Approved', updated_at = now()
    WHERE id = NEW.contact_id;
  ELSIF NEW.status IN ('new_application', 'New Application') THEN
    UPDATE contacts SET stage = 'Application', updated_at = now()
    WHERE id = NEW.contact_id;
  ELSIF NEW.status IN ('lead', 'Lead', 'Lead - New', 'Lead - Contacted', 'Lead - Cold / Inactive') THEN
    UPDATE contacts SET stage = 'Lead', updated_at = now()
    WHERE id = NEW.contact_id;
  END IF;

  RETURN NEW;
END;
$function$
