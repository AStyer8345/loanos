BEGIN;
ALTER TABLE public.document_review_versions DROP CONSTRAINT document_review_versions_status_check;
ALTER TABLE public.document_review_versions ADD CONSTRAINT document_review_versions_status_check CHECK(status IN ('pending','processing','ready','reviewed','rejected','failed'));
ALTER TABLE public.document_review_versions ADD COLUMN processing_started_at timestamptz;
ALTER TABLE public.document_review_versions ADD COLUMN extraction_attempts integer NOT NULL DEFAULT 0;
GRANT SELECT(processing_started_at,extraction_attempts) ON public.document_review_versions TO authenticated;
CREATE FUNCTION public.claim_document_extraction(p_org uuid,p_version uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE v public.document_review_versions;
BEGIN
 SELECT * INTO v FROM public.document_review_versions WHERE id=p_version AND organization_id=p_org FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Review version not found'; END IF;
 IF v.status NOT IN ('pending','failed') THEN RETURN false; END IF;
 IF EXISTS(SELECT 1 FROM public.document_review_versions WHERE organization_id=p_org AND loan_id=v.loan_id AND kind=v.kind AND version>v.version) THEN RAISE EXCEPTION 'A newer document version exists'; END IF;
 UPDATE public.document_review_versions SET status='processing',processing_started_at=now(),extraction_attempts=extraction_attempts+1,last_error=null WHERE id=v.id;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.claim_document_extraction(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_document_extraction(uuid,uuid) TO service_role;
CREATE OR REPLACE FUNCTION public.record_document_extraction(p_org uuid,p_version uuid,p_cipher jsonb,p_hash text,p_model text)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE v public.document_review_versions;
BEGIN
 SELECT * INTO v FROM public.document_review_versions WHERE id=p_version AND organization_id=p_org FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Review version not found'; END IF;
 IF v.proposal_hash=p_hash THEN RETURN false; END IF;
 IF v.status NOT IN ('pending','failed','processing') THEN RAISE EXCEPTION 'This version already has a proposal; upload a new source version to replace it'; END IF;
 IF EXISTS(SELECT 1 FROM public.document_review_versions WHERE organization_id=p_org AND loan_id=v.loan_id AND kind=v.kind AND version>v.version) THEN RAISE EXCEPTION 'A newer document version exists'; END IF;
 UPDATE public.document_review_versions SET proposal_cipher=p_cipher,proposal_hash=p_hash,extraction_model=left(p_model,200),status='ready',extracted_at=now(),last_error=null WHERE id=v.id;
 RETURN true;
END $$;
CREATE OR REPLACE FUNCTION public.review_document_version(p_org uuid,p_actor uuid,p_version uuid,p_decision text,p_notes jsonb,p_conditions jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE v public.document_review_versions; l public.loans; condition jsonb; tid uuid; ids uuid[]:='{}'; owner_id uuid; reason text;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=p_actor AND organization_id=p_org) THEN RAISE EXCEPTION 'Membership required'; END IF;
 IF p_decision NOT IN ('reviewed','rejected') OR jsonb_typeof(p_conditions)<>'array' OR jsonb_array_length(p_conditions)>50 THEN RAISE EXCEPTION 'Invalid review'; END IF;
 SELECT * INTO v FROM public.document_review_versions WHERE id=p_version AND organization_id=p_org FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Review version not found'; END IF;
 IF EXISTS(SELECT 1 FROM public.document_review_history WHERE version_id=v.id AND organization_id=p_org) THEN RAISE EXCEPTION 'Review is already recorded'; END IF;
 IF v.status NOT IN ('ready','pending','failed') AND NOT(v.status='processing' AND v.processing_started_at < now()-interval '15 minutes') THEN RAISE EXCEPTION 'Review is unavailable'; END IF;
 IF EXISTS(SELECT 1 FROM public.document_review_versions WHERE organization_id=p_org AND loan_id=v.loan_id AND kind=v.kind AND version>v.version) THEN RAISE EXCEPTION 'Review the latest version'; END IF;
 SELECT * INTO l FROM public.loans WHERE id=v.loan_id AND organization_id=p_org;
 IF p_decision='reviewed' THEN
  FOR condition IN SELECT value FROM jsonb_array_elements(p_conditions) LOOP
   IF length(trim(coalesce(condition->>'title',''))) NOT BETWEEN 3 AND 240 OR length(trim(coalesce(condition->>'citation',''))) NOT BETWEEN 3 AND 1000 THEN RAISE EXCEPTION 'Each condition needs a concise task and source citation'; END IF;
   owner_id:=nullif(condition->>'owner_id','')::uuid;
   IF owner_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=owner_id AND organization_id=p_org) THEN RAISE EXCEPTION 'Assignee must belong to your team'; END IF;
   IF condition->>'route' NOT IN ('borrower','team','title','insurance','appraisal','loan_officer') THEN RAISE EXCEPTION 'Invalid condition routing'; END IF;
   reason:=CASE WHEN condition->>'route'='borrower' THEN 'waiting:borrower' WHEN condition->>'route' IN ('title','insurance','appraisal') THEN 'waiting:third_party' WHEN condition->>'route'='loan_officer' THEN 'escalation:team_request' ELSE null END;
   INSERT INTO public.todo_items(organization_id,user_id,title,text,description,status,priority,source,source_key,related_loan_id,related_contact_id,assigned_to,follow_up_reason,due_at)
   VALUES(p_org,p_actor,condition->>'title',condition->>'title','Reviewed '||v.kind||' version '||v.version::text||' · route: '||(condition->>'route')||'. Source: '||(condition->>'citation'),'open','medium','document_review','document-condition:'||v.id::text||':'||(cardinality(ids)+1)::text,v.loan_id,l.contact_id,owner_id,reason,nullif(condition->>'due_at','')::timestamptz) RETURNING id INTO tid;
   ids:=array_append(ids,tid);
  END LOOP;
 END IF;
 INSERT INTO public.document_review_history(organization_id,version_id,reviewer_id,decision,notes_cipher,task_ids) VALUES(p_org,v.id,p_actor,p_decision,p_notes,ids);
 UPDATE public.document_review_versions SET status=p_decision,reviewed_at=now() WHERE id=v.id;
 UPDATE public.todo_items SET status='completed',is_complete=true WHERE id=v.task_id AND organization_id=p_org;
 RETURN jsonb_build_object('id',v.id,'status',p_decision,'task_ids',ids,'financial_fields_changed',false);
END $$;
COMMIT;
