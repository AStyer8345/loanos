-- Replaces two overlapping legacy document webhooks with one durable internal review task.
-- Restore information: trigger definitions are recorded in docs/DOCUMENT_REVIEWS.md;
-- the original trigger functions remain intact but disconnected.
BEGIN;
DROP TRIGGER IF EXISTS contract_uploaded_trigger ON public.documents;
DROP TRIGGER IF EXISTS on_contract_document_inserted ON public.documents;
CREATE FUNCTION public.capture_document_review_task() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE l public.loans; owner_id uuid;
BEGIN
 IF NEW.doc_type NOT IN ('contract','conditional_approval') OR NEW.loan_id IS NULL THEN RETURN NEW; END IF;
 SELECT * INTO l FROM public.loans WHERE id=NEW.loan_id AND organization_id=NEW.organization_id;
 IF NOT FOUND THEN RETURN NEW; END IF;
 owner_id:=l.operational_owner_id;
 IF NEW.doc_type='contract' THEN SELECT id INTO owner_id FROM public.profiles WHERE organization_id=NEW.organization_id AND role='owner' ORDER BY id LIMIT 1; END IF;
 INSERT INTO public.todo_items(organization_id,user_id,title,text,description,status,priority,source,source_key,related_loan_id,related_contact_id,assigned_to,follow_up_reason)
 VALUES(NEW.organization_id,l.user_id,'Prepare source document review','Prepare source document review','A source PDF was captured. Open the loan document review, select the source and save a version before reviewing extracted changes. No document has been forwarded and no loan values have been changed.','open','medium','document_review','document-unreviewed:'||NEW.id::text,l.id,l.contact_id,owner_id,CASE WHEN NEW.doc_type='contract' THEN 'escalation:loan_structure' ELSE null END);
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.capture_document_review_task() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER capture_document_review_task AFTER INSERT ON public.documents FOR EACH ROW EXECUTE FUNCTION public.capture_document_review_task();
CREATE OR REPLACE FUNCTION public.register_document_review(p_org uuid,p_actor uuid,p_loan uuid,p_path text,p_name text,p_size integer,p_kind text,p_sha text,p_baseline jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE l public.loans; previous public.document_review_versions; existing public.document_review_versions; doc uuid; v uuid; task uuid; owner_id uuid;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=p_actor AND organization_id=p_org) THEN RAISE EXCEPTION 'Membership required'; END IF;
 SELECT * INTO l FROM public.loans WHERE id=p_loan AND organization_id=p_org;
 IF NOT FOUND THEN RAISE EXCEPTION 'Loan not found'; END IF;
 IF p_kind NOT IN ('contract','conditional_approval') OR (p_path NOT LIKE p_actor::text||'/'||p_loan::text||'/%' AND NOT EXISTS(SELECT 1 FROM public.documents WHERE organization_id=p_org AND loan_id=p_loan AND file_path=p_path)) OR position('..' in p_path)>0 OR length(p_name) NOT BETWEEN 1 AND 500 OR p_size NOT BETWEEN 1 AND 15728640 OR p_sha !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'Invalid source document'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_org::text||':'||p_loan::text||':'||p_kind,0));
 SELECT * INTO existing FROM public.document_review_versions WHERE organization_id=p_org AND loan_id=p_loan AND kind=p_kind AND sha256=p_sha;
 IF FOUND THEN RETURN jsonb_build_object('id',existing.id,'document_id',existing.document_id,'version',existing.version,'duplicate',true,'status',existing.status); END IF;
 SELECT id INTO doc FROM public.documents WHERE organization_id=p_org AND loan_id=p_loan AND file_path=p_path LIMIT 1;
 IF doc IS NULL THEN
  INSERT INTO public.documents(organization_id,user_id,uploaded_by,loan_id,contact_id,file_path,file_name,file_size,mime_type,doc_type)
  VALUES(p_org,p_actor,p_actor,p_loan,l.contact_id,p_path,p_name,p_size,'application/pdf',p_kind) RETURNING id INTO doc;
 END IF;
 SELECT * INTO previous FROM public.document_review_versions WHERE organization_id=p_org AND loan_id=p_loan AND kind=p_kind ORDER BY version DESC LIMIT 1;
 INSERT INTO public.document_review_versions(organization_id,loan_id,document_id,created_by,kind,version,sha256,supersedes_id,baseline_cipher)
 VALUES(p_org,p_loan,doc,p_actor,p_kind,coalesce(previous.version,0)+1,p_sha,previous.id,p_baseline) RETURNING id INTO v;
 -- Contract structure requires an LO review; routine conditions stay with the recorded loan owner where known.
 owner_id:=l.operational_owner_id;
 IF p_kind='contract' THEN SELECT id INTO owner_id FROM public.profiles WHERE organization_id=p_org AND role='owner' ORDER BY id LIMIT 1; END IF;
 INSERT INTO public.todo_items(organization_id,user_id,title,text,description,status,priority,source,source_key,related_loan_id,related_contact_id,assigned_to,follow_up_reason)
 VALUES(p_org,p_actor,CASE WHEN p_kind='contract' THEN 'Review contract version before source changes' ELSE 'Review conditional-approval conditions and assign owners' END,
 CASE WHEN p_kind='contract' THEN 'Review contract version before source changes' ELSE 'Review conditional-approval conditions and assign owners' END,
 'Source document version '||(coalesce(previous.version,0)+1)::text||'. Extraction is a proposal. Review citations and the source diff; no loan fields or underwriting decisions are changed by this workflow.',
 'open','medium','document_review','document-review:'||v::text,p_loan,l.contact_id,owner_id,CASE WHEN p_kind='contract' THEN 'escalation:loan_structure' ELSE null END) RETURNING id INTO task;
 UPDATE public.document_review_versions SET task_id=task WHERE id=v;
 UPDATE public.todo_items SET status='dismissed',is_complete=true WHERE organization_id=p_org AND source='document_review' AND source_key='document-unreviewed:'||doc::text;
 IF previous.task_id IS NOT NULL AND previous.status IN ('pending','processing','ready','failed') THEN
  UPDATE public.todo_items SET status='dismissed',is_complete=true WHERE id=previous.task_id AND organization_id=p_org;
 END IF;
 RETURN jsonb_build_object('id',v,'document_id',doc,'version',coalesce(previous.version,0)+1,'duplicate',false,'status','pending','task_id',task);
END $$;

CREATE OR REPLACE FUNCTION public.claim_document_extraction(p_org uuid,p_version uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE v public.document_review_versions;
BEGIN
 SELECT * INTO v FROM public.document_review_versions WHERE id=p_version AND organization_id=p_org FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Review version not found'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_org::text||':'||v.loan_id::text||':'||v.kind,0));
 IF v.status NOT IN ('pending','failed') THEN RETURN false; END IF;
 IF EXISTS(SELECT 1 FROM public.document_review_versions WHERE organization_id=p_org AND loan_id=v.loan_id AND kind=v.kind AND version>v.version) THEN RAISE EXCEPTION 'A newer document version exists'; END IF;
 UPDATE public.document_review_versions SET status='processing',processing_started_at=now(),extraction_attempts=extraction_attempts+1,last_error=null WHERE id=v.id;
 RETURN true;
END $$;
CREATE OR REPLACE FUNCTION public.record_document_extraction(p_org uuid,p_version uuid,p_cipher jsonb,p_hash text,p_model text)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE v public.document_review_versions;
BEGIN
 SELECT * INTO v FROM public.document_review_versions WHERE id=p_version AND organization_id=p_org FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Review version not found'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_org::text||':'||v.loan_id::text||':'||v.kind,0));
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
 PERFORM pg_advisory_xact_lock(hashtextextended(p_org::text||':'||v.loan_id::text||':'||v.kind,0));
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
