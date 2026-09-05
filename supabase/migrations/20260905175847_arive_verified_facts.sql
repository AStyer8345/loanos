BEGIN;
CREATE TABLE public.arive_loan_facts (
 organization_id uuid NOT NULL REFERENCES public.organizations(id),
 arive_loan_id text NOT NULL,
 source_updated_at timestamptz NOT NULL,
 checked_at timestamptz NOT NULL DEFAULT now(),
 status text NOT NULL, status_date date,
 loan_amount numeric CHECK(loan_amount>=0),base_loan_amount numeric CHECK(base_loan_amount>=0),financed_fees numeric CHECK(financed_fees>=0),
 product text,purpose text,archived boolean NOT NULL DEFAULT false,
 borrower_name text NOT NULL,borrower_email text,borrower_phone text,co_borrower_name text,co_borrower_email text,
 PRIMARY KEY(organization_id,arive_loan_id)
);
ALTER TABLE public.arive_loan_facts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.arive_loan_facts FROM anon,authenticated;
GRANT SELECT ON public.arive_loan_facts TO authenticated;
GRANT ALL ON public.arive_loan_facts TO service_role;
CREATE POLICY arive_facts_read ON public.arive_loan_facts FOR SELECT TO authenticated
 USING(organization_id=(SELECT public.get_my_organization_id()));

-- Reject late events before they can change a loan or trigger downstream effects.
CREATE FUNCTION public.guard_arive_event_order() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE incoming timestamptz; latest timestamptz;
BEGIN
 IF NEW.organization_id <> '18613f82-fdd9-42dd-a09e-f3c577328258'::uuid OR NEW.arive_loan_id IS NULL THEN RETURN NEW; END IF;
 IF NEW.raw_payload IS DISTINCT FROM OLD.raw_payload THEN
  incoming:=nullif(NEW.raw_payload->>'modifiedDateTime','')::timestamptz;
 ELSIF NEW.arive_updated_at IS DISTINCT FROM OLD.arive_updated_at THEN incoming:=NEW.arive_updated_at;
 ELSE RETURN NEW; END IF;
 SELECT greatest(f.source_updated_at,OLD.arive_updated_at) INTO latest FROM public.arive_loan_facts f
 WHERE f.organization_id=NEW.organization_id AND f.arive_loan_id=NEW.arive_loan_id;
 latest:=coalesce(latest,OLD.arive_updated_at);
 IF latest IS NOT NULL AND (incoming IS NULL OR incoming<latest) THEN RAISE EXCEPTION 'Older ARIVE update rejected'; END IF;
 NEW.arive_updated_at:=incoming; NEW.synced_at:=now();
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.guard_arive_event_order() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER guard_arive_order BEFORE UPDATE OF raw_payload,arive_updated_at ON public.loans FOR EACH ROW EXECUTE FUNCTION public.guard_arive_event_order();

-- Existing event relays also refresh the minimal facts shown by Lead Desk.
CREATE FUNCTION public.capture_arive_loan_facts() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE stamp timestamptz;
BEGIN
 IF NEW.organization_id <> '18613f82-fdd9-42dd-a09e-f3c577328258'::uuid OR NEW.arive_loan_id IS NULL OR NEW.status IS NULL THEN RETURN NEW; END IF;
 IF current_user NOT IN ('postgres','service_role') THEN RETURN NEW; END IF;
 stamp:=nullif(NEW.raw_payload->>'modifiedDateTime','')::timestamptz;
 IF stamp IS NULL THEN RETURN NEW; END IF;
 INSERT INTO public.arive_loan_facts(organization_id,arive_loan_id,source_updated_at,status,status_date,loan_amount,base_loan_amount,financed_fees,product,purpose,archived,borrower_name,borrower_email,borrower_phone,co_borrower_name,co_borrower_email)
 VALUES(NEW.organization_id,NEW.arive_loan_id,stamp,NEW.status,NEW.status_date,NEW.loan_amount,NEW.base_loan_amount,NEW.financed_fees,coalesce(NEW.loan_program,NEW.mortgage_type),NEW.loan_purpose,coalesce(NEW.archive_indicator,false),concat_ws(' ',NEW.borrower_first_name,NEW.borrower_last_name),lower(NEW.borrower_email),NEW.borrower_phone,NEW.co_borrower_name,lower(NEW.co_borrower_email))
 ON CONFLICT(organization_id,arive_loan_id) DO UPDATE SET
 source_updated_at=excluded.source_updated_at,checked_at=now(),status=excluded.status,status_date=excluded.status_date,loan_amount=excluded.loan_amount,base_loan_amount=excluded.base_loan_amount,financed_fees=excluded.financed_fees,product=excluded.product,purpose=excluded.purpose,archived=excluded.archived,borrower_name=excluded.borrower_name,borrower_email=excluded.borrower_email,borrower_phone=excluded.borrower_phone,co_borrower_name=excluded.co_borrower_name,co_borrower_email=excluded.co_borrower_email
 WHERE excluded.source_updated_at>arive_loan_facts.source_updated_at;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.capture_arive_loan_facts() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER capture_arive_facts AFTER INSERT OR UPDATE OF raw_payload ON public.loans FOR EACH ROW EXECUTE FUNCTION public.capture_arive_loan_facts();

-- Only a trusted server can supply a checked, complete ARIVE snapshot.
CREATE FUNCTION public.reconcile_arive_facts(p_rows jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE org constant uuid:='18613f82-fdd9-42dd-a09e-f3c577328258'; affected integer; replicas integer;
BEGIN
 IF jsonb_typeof(p_rows)<>'array' OR jsonb_array_length(p_rows)>1000 THEN RAISE EXCEPTION 'Invalid ARIVE facts'; END IF;
 INSERT INTO public.arive_loan_facts(organization_id,arive_loan_id,source_updated_at,status,status_date,loan_amount,base_loan_amount,financed_fees,product,purpose,archived,borrower_name,borrower_email,borrower_phone,co_borrower_name,co_borrower_email)
 SELECT org,r.arive_loan_id,r.source_updated_at,r.status,r.status_date,r.loan_amount,r.base_loan_amount,r.financed_fees,r.product,r.purpose,r.archived,r.borrower_name,r.borrower_email,r.borrower_phone,r.co_borrower_name,r.co_borrower_email
 FROM jsonb_to_recordset(p_rows) AS r(arive_loan_id text,source_updated_at timestamptz,status text,status_date date,loan_amount numeric,base_loan_amount numeric,financed_fees numeric,product text,purpose text,archived boolean,borrower_name text,borrower_email text,borrower_phone text,co_borrower_name text,co_borrower_email text)
 ON CONFLICT(organization_id,arive_loan_id) DO UPDATE SET source_updated_at=excluded.source_updated_at,checked_at=now(),status=excluded.status,status_date=excluded.status_date,loan_amount=excluded.loan_amount,base_loan_amount=excluded.base_loan_amount,financed_fees=excluded.financed_fees,product=excluded.product,purpose=excluded.purpose,archived=excluded.archived,borrower_name=excluded.borrower_name,borrower_email=excluded.borrower_email,borrower_phone=excluded.borrower_phone,co_borrower_name=excluded.co_borrower_name,co_borrower_email=excluded.co_borrower_email
 WHERE excluded.source_updated_at>=arive_loan_facts.source_updated_at;
 GET DIAGNOSTICS affected=ROW_COUNT;
 UPDATE public.loans l SET loan_amount=f.loan_amount,base_loan_amount=f.base_loan_amount,financed_fees=f.financed_fees,status=f.status,status_date=f.status_date,archive_indicator=f.archived,arive_updated_at=f.source_updated_at,synced_at=now()
 FROM public.arive_loan_facts f WHERE l.organization_id=org AND f.organization_id=org AND l.arive_loan_id=f.arive_loan_id
 AND f.arive_loan_id IN(SELECT r->>'arive_loan_id' FROM jsonb_array_elements(p_rows) r)
 AND (l.arive_updated_at IS NULL OR f.source_updated_at>=l.arive_updated_at)
 AND (l.loan_amount,l.base_loan_amount,l.financed_fees,l.status,l.status_date,l.archive_indicator,l.arive_updated_at) IS DISTINCT FROM (f.loan_amount,f.base_loan_amount,f.financed_fees,f.status,f.status_date,f.archived,f.source_updated_at);
 GET DIAGNOSTICS replicas=ROW_COUNT;
 INSERT INTO public.communication_source_health(organization_id,source,status,last_success_at,last_attempt_at,detail,inbound,outbound)
 VALUES(org,'arive_loans','connected',now(),now(),jsonb_array_length(p_rows)||' ARIVE loans checked',true,false)
 ON CONFLICT(organization_id,source) DO UPDATE SET status='connected',last_success_at=now(),last_attempt_at=now(),detail=excluded.detail,updated_at=now();
 RETURN jsonb_build_object('checked',jsonb_array_length(p_rows),'accepted',affected,'loan_copies_updated',replicas);
END $$;
REVOKE ALL ON FUNCTION public.reconcile_arive_facts(jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.reconcile_arive_facts(jsonb) TO service_role;
COMMIT;
