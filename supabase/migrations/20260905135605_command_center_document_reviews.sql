-- Versioned review proposals never write loan terms or underwriting decisions.
BEGIN;
CREATE UNIQUE INDEX IF NOT EXISTS documents_org_id_unique ON public.documents(organization_id,id);
CREATE UNIQUE INDEX IF NOT EXISTS todo_items_org_id_unique ON public.todo_items(organization_id,id);
CREATE TABLE public.document_review_versions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES public.organizations(id),
 loan_id uuid NOT NULL, document_id uuid NOT NULL, created_by uuid NOT NULL,
 kind text NOT NULL CHECK(kind IN ('contract','conditional_approval')), version integer NOT NULL CHECK(version>0),
 sha256 text NOT NULL CHECK(sha256 ~ '^[a-f0-9]{64}$'), supersedes_id uuid,
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','ready','reviewed','rejected','failed')),
 baseline_cipher jsonb NOT NULL, proposal_cipher jsonb, proposal_hash text, extraction_model text,
 created_at timestamptz NOT NULL DEFAULT now(), extracted_at timestamptz, reviewed_at timestamptz,
 last_error text, task_id uuid,
 UNIQUE(organization_id,id), UNIQUE(organization_id,loan_id,kind,version), UNIQUE(organization_id,loan_id,kind,sha256),
 FOREIGN KEY(organization_id,loan_id) REFERENCES public.loans(organization_id,id),
 FOREIGN KEY(organization_id,document_id) REFERENCES public.documents(organization_id,id),
 FOREIGN KEY(organization_id,created_by) REFERENCES public.profiles(organization_id,id),
 FOREIGN KEY(organization_id,supersedes_id) REFERENCES public.document_review_versions(organization_id,id),
 FOREIGN KEY(organization_id,task_id) REFERENCES public.todo_items(organization_id,id)
);
CREATE TABLE public.document_review_history (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL,
 version_id uuid NOT NULL, reviewer_id uuid NOT NULL, decision text NOT NULL CHECK(decision IN ('reviewed','rejected')),
 notes_cipher jsonb NOT NULL, task_ids uuid[] NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(organization_id,version_id) REFERENCES public.document_review_versions(organization_id,id),
 FOREIGN KEY(organization_id,reviewer_id) REFERENCES public.profiles(organization_id,id)
);
ALTER TABLE public.document_review_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_review_history ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.document_review_versions,public.document_review_history FROM PUBLIC,anon,authenticated;
GRANT SELECT(id,organization_id,loan_id,document_id,created_by,kind,version,sha256,supersedes_id,status,extraction_model,created_at,extracted_at,reviewed_at,last_error,task_id) ON public.document_review_versions TO authenticated;
GRANT SELECT(id,organization_id,version_id,reviewer_id,decision,task_ids,created_at) ON public.document_review_history TO authenticated;
GRANT ALL ON public.document_review_versions,public.document_review_history TO service_role;
CREATE POLICY document_versions_org_read ON public.document_review_versions FOR SELECT TO authenticated USING(organization_id=(select public.get_my_organization_id()));
CREATE POLICY document_history_org_read ON public.document_review_history FOR SELECT TO authenticated USING(organization_id=(select public.get_my_organization_id()));

CREATE FUNCTION public.register_document_review(p_org uuid,p_actor uuid,p_loan uuid,p_path text,p_name text,p_size integer,p_kind text,p_sha text,p_baseline jsonb)
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
 IF previous.task_id IS NOT NULL AND previous.status IN ('pending','ready','failed') THEN
  UPDATE public.todo_items SET status='dismissed',is_complete=true WHERE id=previous.task_id AND organization_id=p_org;
 END IF;
 RETURN jsonb_build_object('id',v,'document_id',doc,'version',coalesce(previous.version,0)+1,'duplicate',false,'status','pending','task_id',task);
END $$;
REVOKE ALL ON FUNCTION public.register_document_review(uuid,uuid,uuid,text,text,integer,text,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.register_document_review(uuid,uuid,uuid,text,text,integer,text,text,jsonb) TO service_role;

CREATE FUNCTION public.record_document_extraction(p_org uuid,p_version uuid,p_cipher jsonb,p_hash text,p_model text)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE v public.document_review_versions;
BEGIN
 SELECT * INTO v FROM public.document_review_versions WHERE id=p_version AND organization_id=p_org FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Review version not found'; END IF;
 IF v.proposal_hash=p_hash THEN RETURN false; END IF;
 IF v.status NOT IN ('pending','failed') THEN RAISE EXCEPTION 'This version already has a proposal; upload a new source version to replace it'; END IF;
 IF EXISTS(SELECT 1 FROM public.document_review_versions WHERE organization_id=p_org AND loan_id=v.loan_id AND kind=v.kind AND version>v.version) THEN RAISE EXCEPTION 'A newer document version exists'; END IF;
 UPDATE public.document_review_versions SET proposal_cipher=p_cipher,proposal_hash=p_hash,extraction_model=left(p_model,200),status='ready',extracted_at=now(),last_error=null WHERE id=v.id;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.record_document_extraction(uuid,uuid,jsonb,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.record_document_extraction(uuid,uuid,jsonb,text,text) TO service_role;

CREATE FUNCTION public.review_document_version(p_org uuid,p_actor uuid,p_version uuid,p_decision text,p_notes jsonb,p_conditions jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE v public.document_review_versions; l public.loans; condition jsonb; tid uuid; ids uuid[]:='{}'; owner_id uuid; reason text;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=p_actor AND organization_id=p_org) THEN RAISE EXCEPTION 'Membership required'; END IF;
 IF p_decision NOT IN ('reviewed','rejected') OR jsonb_typeof(p_conditions)<>'array' OR jsonb_array_length(p_conditions)>50 THEN RAISE EXCEPTION 'Invalid review'; END IF;
 SELECT * INTO v FROM public.document_review_versions WHERE id=p_version AND organization_id=p_org FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Review version not found'; END IF;
 IF EXISTS(SELECT 1 FROM public.document_review_history WHERE version_id=v.id AND organization_id=p_org) THEN RAISE EXCEPTION 'Review is already recorded'; END IF;
 IF v.status NOT IN ('ready','pending','failed') THEN RAISE EXCEPTION 'Review is unavailable'; END IF;
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
REVOKE ALL ON FUNCTION public.review_document_version(uuid,uuid,uuid,text,jsonb,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.review_document_version(uuid,uuid,uuid,text,jsonb,jsonb) TO service_role;
COMMIT;
