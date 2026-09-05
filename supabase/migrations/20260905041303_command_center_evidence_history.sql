-- Preserve ARIVE milestone dates separately from current inventory and import time.
BEGIN;
CREATE OR REPLACE FUNCTION public.sync_loan_evidence_milestones_row(p_loan public.loans)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE field text; kind text; raw_date text; happened date; prior uuid; source_key text;
BEGIN
 IF p_loan.organization_id IS NULL OR p_loan.arive_loan_id IS NULL OR p_loan.raw_payload IS NULL THEN RETURN; END IF;
 FOR field,kind IN SELECT * FROM (VALUES
   ('APPLICATION_INTAKE','application_started'),
   ('loanBorrower1_posAppSubmissionDate','application_submitted'),
   ('PREAPPROVED','preapproval_issued'),
   ('APPROVED_WITH_CONDITION','conditional_approval'),
   ('APPROVED_WITH_CONDITION','lender_approved'),
   ('CLEAR_TO_CLOSE','clear_to_close'),
   ('LOAN_CLOSED','closing_completed'),
   ('LOAN_FUNDED','funded'),
   ('WITHDRAWN','withdrawn'),('DENIED','denied'),('LOST','lost')
 ) AS mappings(field_name,milestone_name) LOOP
   raw_date:=p_loan.raw_payload->>field;
   IF raw_date IS NULL OR raw_date !~ '^\d{4}-\d{2}-\d{2}$' THEN CONTINUE; END IF;
   BEGIN happened:=raw_date::date; EXCEPTION WHEN datetime_field_overflow OR invalid_datetime_format THEN CONTINUE; END;
   IF happened>current_date OR happened<'2000-01-01'::date THEN CONTINUE; END IF;
   source_key:=p_loan.arive_loan_id||':'||field||':'||raw_date;
   SELECT id INTO prior FROM public.opportunity_milestones WHERE organization_id=p_loan.organization_id AND loan_id=p_loan.id AND source='arive_milestone' AND milestone=kind AND evidence->>'raw_field'=field AND voided_at IS NULL ORDER BY recorded_at DESC LIMIT 1;
   IF prior IS NOT NULL AND EXISTS(SELECT 1 FROM public.opportunity_milestones WHERE id=prior AND evidence->>'source_date'=raw_date) THEN CONTINUE; END IF;
   IF prior IS NOT NULL THEN source_key:=source_key||':correction:'||prior; END IF;
   IF prior IS NOT NULL THEN UPDATE public.opportunity_milestones SET voided_at=now() WHERE id=prior AND organization_id=p_loan.organization_id; END IF;
   INSERT INTO public.opportunity_milestones(organization_id,loan_id,contact_id,milestone,occurred_at,source,source_event_id,source_url,evidence,supersedes_id)
   VALUES(p_loan.organization_id,p_loan.id,p_loan.contact_id,kind,happened::timestamp AT TIME ZONE 'America/Chicago','arive_milestone',source_key,p_loan.deep_link_url,
     jsonb_build_object('raw_field',field,'source_date',raw_date,'date_precision','day','source_record',p_loan.arive_loan_id,'definition',CASE WHEN kind='application_started' THEN 'ARIVE Application Intake stage; operational metric, not a legal disclosure trigger' ELSE 'Source-reported milestone date' END),prior)
   ON CONFLICT(organization_id,source,source_event_id,milestone) DO NOTHING;
 END LOOP;
 RETURN;
END $$;
REVOKE ALL ON FUNCTION public.sync_loan_evidence_milestones_row(public.loans) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.sync_loan_evidence_milestones_row(public.loans) TO service_role;
CREATE OR REPLACE FUNCTION public.sync_loan_evidence_milestones()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF NEW.arive_loan_id IS NOT NULL AND NEW.raw_payload IS NOT NULL THEN
  PERFORM public.sync_loan_evidence_milestones_row(NEW);
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.sync_loan_evidence_milestones() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER loan_evidence_milestones AFTER INSERT OR UPDATE OF raw_payload ON public.loans FOR EACH ROW EXECUTE FUNCTION public.sync_loan_evidence_milestones();
-- Service-owned capture only. Tenant viewers cannot manufacture milestone history.
CREATE UNIQUE INDEX opportunity_milestones_org_id_unique ON public.opportunity_milestones(organization_id,id);
ALTER TABLE public.opportunity_milestones ADD CONSTRAINT milestones_inquiry_org_fk FOREIGN KEY(organization_id,inquiry_id) REFERENCES public.inquiries(organization_id,id);
ALTER TABLE public.opportunity_milestones ADD CONSTRAINT milestones_supersedes_org_fk FOREIGN KEY(organization_id,supersedes_id) REFERENCES public.opportunity_milestones(organization_id,id);
ALTER TABLE public.inquiry_outbox ADD CONSTRAINT outbox_inquiry_org_fk FOREIGN KEY(organization_id,inquiry_id) REFERENCES public.inquiries(organization_id,id);
COMMIT;
