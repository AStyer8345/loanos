-- Both deployed Lead Desk clients read these preferences and ARIVE facts.
-- Enrol active ARIVE applications when the existing loan relays accept them.
-- Missing loan mirrors are recovered without creating contacts, outreach,
-- changing manual notes, or importing historic loans.
BEGIN;

CREATE FUNCTION public.ensure_arive_desk_member(p_org uuid,p_arive_id text)
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE
 f public.arive_loan_facts%ROWTYPE; result_id uuid; cid uuid;
 candidates uuid[]; contact_candidates uuid[]; surname text;
BEGIN
 IF current_user NOT IN ('postgres','service_role') OR p_org IS DISTINCT FROM '18613f82-fdd9-42dd-a09e-f3c577328258'::uuid THEN
  RAISE EXCEPTION 'ARIVE service scope required';
 END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_org::text||':arive-desk',0));
 SELECT * INTO f FROM public.arive_loan_facts WHERE organization_id=p_org AND arive_loan_id=p_arive_id;
 IF NOT FOUND THEN RETURN NULL; END IF;
 -- Recover missing local loan copies so the existing status relay can find
 -- them. No contact link means no enrollment/cancellation or contact writes.
 IF NOT f.archived AND upper(f.status) NOT IN ('LOAN_FUNDED','COMMISSION_PAID','FUNDED','CLOSED','ADVERSE','ARCHIVED','CANCELLED','WITHDRAWN','DENIED') THEN
  INSERT INTO public.loans(organization_id,user_id,arive_loan_id,borrower_first_name,borrower_last_name,borrower_email,borrower_phone,co_borrower_name,co_borrower_email,
   status,status_date,loan_amount,base_loan_amount,financed_fees,loan_program,loan_purpose,archive_indicator,arive_updated_at,synced_at)
  VALUES(p_org,'b13aa8c6-c3a0-4312-9b35-c76073e7ccdc',p_arive_id,split_part(f.borrower_name,' ',1),nullif(substring(f.borrower_name from position(' ' in f.borrower_name)+1),f.borrower_name),
   f.borrower_email,f.borrower_phone,f.co_borrower_name,f.co_borrower_email,f.status,f.status_date,f.loan_amount,f.base_loan_amount,f.financed_fees,f.product,f.purpose,f.archived,f.source_updated_at,now())
  ON CONFLICT(organization_id,arive_loan_id) WHERE arive_loan_id IS NOT NULL DO NOTHING;
 END IF;
 -- Includes reviewed multi-file rows: never silently choose one scenario.
 SELECT id INTO result_id FROM public.lead_desk_preferences
 WHERE organization_id=p_org AND (provenance->'arive_match'->'ids' ? p_arive_id OR legacy_key='arive-loan:'||p_arive_id
  OR (coalesce(provenance->'arive_match'->>'state','')='review' AND coalesce(provenance->'restored_lead'->>'loan','') ~ ('\m'||p_arive_id||'\M')))
 ORDER BY id LIMIT 1;
 IF result_id IS NOT NULL THEN RETURN result_id; END IF;
 IF f.archived OR upper(f.status) IN ('LOAN_FUNDED','COMMISSION_PAID','FUNDED','CLOSED','ADVERSE','ARCHIVED','CANCELLED','WITHDRAWN','DENIED') THEN RETURN NULL; END IF;
 surname:=lower((regexp_split_to_array(trim(f.borrower_name),'\s+'))[array_length(regexp_split_to_array(trim(f.borrower_name),'\s+'),1)]);
 -- Identity matches need email and surname, and only one current application.
 -- Existing verified/ambiguous matches and recorded identity conflicts stay intact.
 SELECT array_agg(p.id) INTO candidates
 FROM public.lead_desk_preferences p LEFT JOIN public.contacts c ON c.id=p.contact_id AND c.organization_id=p_org
 WHERE p.organization_id=p_org
 AND coalesce(p.provenance->'arive_match'->>'state','not_found')='not_found'
 AND coalesce(p.provenance->'restored_lead'->>'loan','')=''
 AND coalesce(p.provenance->'restored_lead'->>'note','') !~* 'identity conflict|Anthony Vu|Thanh.*conflict'
 AND nullif(lower(coalesce(c.email,p.provenance->'restored_lead'->>'email',p.provenance->>'email')),'') IN (f.borrower_email,f.co_borrower_email)
 AND surname=ANY(regexp_split_to_array(lower(coalesce(p.provenance->'restored_lead'->>'name',p.provenance->>'display_name',concat_ws(' ',c.first_name,c.last_name))),'[^a-z0-9]+'))
 AND NOT EXISTS(SELECT 1 FROM public.arive_loan_facts other WHERE other.organization_id=p_org AND other.arive_loan_id<>p_arive_id
  AND NOT other.archived AND nullif(lower(coalesce(c.email,p.provenance->'restored_lead'->>'email',p.provenance->>'email')),'') IN (other.borrower_email,other.co_borrower_email));
 IF cardinality(candidates)=1 THEN
  UPDATE public.lead_desk_preferences SET provenance=coalesce(provenance,'{}'::jsonb)||jsonb_build_object(
    'arive_match',jsonb_build_object('state','matched','ids',jsonb_build_array(p_arive_id),'checked_at',f.checked_at,'reason','Unique current ARIVE application; email and surname verified'))
  WHERE id=candidates[1] AND organization_id=p_org RETURNING id INTO result_id;
  RETURN result_id;
 END IF;
 -- Prefer the existing loan/contact link, but corroborate its identity as well.
 SELECT array_agg(c.id) INTO contact_candidates FROM public.contacts c WHERE c.organization_id=p_org
 AND nullif(lower(c.email),'') IN (f.borrower_email,f.co_borrower_email)
 AND surname=ANY(regexp_split_to_array(lower(concat_ws(' ',c.first_name,c.last_name)),'[^a-z0-9]+'));
 IF cardinality(contact_candidates)=1 THEN cid:=contact_candidates[1]; END IF;
 IF EXISTS(SELECT 1 FROM public.lead_desk_preferences WHERE organization_id=p_org AND contact_id=cid) THEN cid:=NULL; END IF;
 INSERT INTO public.lead_desk_preferences(organization_id,legacy_key,contact_id,match_state,provenance)
 VALUES(p_org,'arive-loan:'||p_arive_id,cid,'matched',jsonb_build_object(
  'display_name',f.borrower_name,'email',f.borrower_email,'origin','arive_active_application',
  'restored_lead',jsonb_build_object('name',f.borrower_name,'email',f.borrower_email,'contact',f.borrower_phone,'loan',p_arive_id),
  'arive_match',jsonb_build_object('state','matched','ids',jsonb_build_array(p_arive_id),'checked_at',f.checked_at,'reason','ARIVE application identified by its own stable loan ID')))
 ON CONFLICT(organization_id,legacy_key) DO NOTHING RETURNING id INTO result_id;
 RETURN result_id;
END $$;
REVOKE ALL ON FUNCTION public.ensure_arive_desk_member(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_arive_desk_member(uuid,text) TO service_role;

CREATE FUNCTION public.sync_arive_desk_membership() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF current_user IN ('postgres','service_role') AND NEW.organization_id='18613f82-fdd9-42dd-a09e-f3c577328258'::uuid THEN
  PERFORM public.ensure_arive_desk_member(NEW.organization_id,NEW.arive_loan_id);
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.sync_arive_desk_membership() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER sync_arive_desk_membership AFTER INSERT OR UPDATE ON public.arive_loan_facts
 FOR EACH ROW EXECUTE FUNCTION public.sync_arive_desk_membership();

-- Some existing relays map only totalLoanAmount. ARIVE's list/status payloads
-- can supply baseLoanAmount and financedFees instead. Normalize before both
-- the loan record and its Lead Desk fact are written, using this payload only.
CREATE FUNCTION public.normalize_arive_event_amount() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE total numeric; base numeric; fees numeric;
BEGIN
 IF current_user NOT IN ('postgres','service_role') OR NEW.organization_id IS DISTINCT FROM '18613f82-fdd9-42dd-a09e-f3c577328258'::uuid
  OR NEW.arive_loan_id IS NULL OR nullif(NEW.raw_payload->>'modifiedDateTime','') IS NULL THEN RETURN NEW; END IF;
 IF TG_OP='UPDATE' AND NEW.raw_payload IS NOT DISTINCT FROM OLD.raw_payload THEN RETURN NEW; END IF;
 IF NEW.raw_payload->>'totalLoanAmount' ~ '^\d+(\.\d+)?$' THEN total:=(NEW.raw_payload->>'totalLoanAmount')::numeric; END IF;
 IF NEW.raw_payload->>'baseLoanAmount' ~ '^\d+(\.\d+)?$' THEN base:=(NEW.raw_payload->>'baseLoanAmount')::numeric; END IF;
 IF NEW.raw_payload->>'financedFees' ~ '^\d+(\.\d+)?$' THEN fees:=(NEW.raw_payload->>'financedFees')::numeric; END IF;
 IF total IS NOT NULL OR (base IS NOT NULL AND fees IS NOT NULL) THEN NEW.loan_amount:=coalesce(total,base+fees);
 ELSIF NEW.raw_payload ? 'baseLoanAmount' AND NEW.raw_payload ? 'financedFees' THEN NEW.loan_amount:=NULL;
 END IF;
 IF NEW.raw_payload ? 'baseLoanAmount' THEN NEW.base_loan_amount:=base; END IF;
 IF NEW.raw_payload ? 'financedFees' THEN NEW.financed_fees:=fees; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.normalize_arive_event_amount() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER normalize_arive_event_amount BEFORE INSERT OR UPDATE OF raw_payload ON public.loans
 FOR EACH ROW EXECUTE FUNCTION public.normalize_arive_event_amount();

-- An equal-source-time replay must converge with the normalized loan copy.
CREATE OR REPLACE FUNCTION public.capture_arive_loan_facts() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
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
 WHERE excluded.source_updated_at>=arive_loan_facts.source_updated_at;
 RETURN NEW;
END $$;

-- Backfill only already verified active ARIVE facts, never imported Jungo rows.
SELECT public.ensure_arive_desk_member(organization_id,arive_loan_id)
 FROM public.arive_loan_facts WHERE organization_id='18613f82-fdd9-42dd-a09e-f3c577328258'::uuid ORDER BY arive_loan_id;
COMMIT;
