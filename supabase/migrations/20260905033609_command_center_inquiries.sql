-- Durable inquiry capture, operational ownership, evidence history and delivery.
-- No existing borrower values, loan terms, commissions or stages are changed.
BEGIN;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_org_id_unique ON public.profiles(organization_id,id);
CREATE UNIQUE INDEX IF NOT EXISTS contacts_org_id_unique ON public.contacts(organization_id,id);
CREATE UNIQUE INDEX IF NOT EXISTS loans_org_id_unique ON public.loans(organization_id,id);
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS operational_owner_id uuid;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS operational_owner_id uuid;
ALTER TABLE public.contacts ADD CONSTRAINT contacts_operational_owner_org_fk FOREIGN KEY(organization_id,operational_owner_id) REFERENCES public.profiles(organization_id,id);
ALTER TABLE public.loans ADD CONSTRAINT loans_operational_owner_org_fk FOREIGN KEY(organization_id,operational_owner_id) REFERENCES public.profiles(organization_id,id);
CREATE INDEX IF NOT EXISTS contacts_operational_owner_idx ON public.contacts(organization_id,operational_owner_id);
CREATE INDEX IF NOT EXISTS loans_operational_owner_idx ON public.loans(organization_id,operational_owner_id);

CREATE TABLE public.inquiries (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES public.organizations(id),
 event_key text NOT NULL, received_at timestamptz NOT NULL, captured_at timestamptz NOT NULL DEFAULT now(),
 contact_id uuid, owner_id uuid, task_id uuid REFERENCES public.todo_items(id),
 source text NOT NULL, source_page text, referral_partner text, form_name text, purpose text,
 first_touch jsonb NOT NULL DEFAULT '{}', provenance jsonb NOT NULL DEFAULT '{}',
 payload_cipher jsonb NOT NULL, payload_hash text NOT NULL,
 match_state text NOT NULL CHECK(match_state IN ('new_contact','matched','needs_review')),
 is_test boolean NOT NULL DEFAULT false, legitimacy text NOT NULL DEFAULT 'inquiry' CHECK(legitimacy IN ('inquiry','spam','test','review')),
 review_reason text, UNIQUE(organization_id,event_key),
 FOREIGN KEY(organization_id,contact_id) REFERENCES public.contacts(organization_id,id),
 FOREIGN KEY(organization_id,owner_id) REFERENCES public.profiles(organization_id,id)
);
CREATE INDEX inquiries_received_idx ON public.inquiries(organization_id,received_at DESC);
CREATE INDEX inquiries_contact_idx ON public.inquiries(organization_id,contact_id);
CREATE INDEX inquiries_owner_idx ON public.inquiries(organization_id,owner_id);
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.inquiries FROM PUBLIC,anon,authenticated;
GRANT SELECT(id,organization_id,event_key,received_at,captured_at,contact_id,owner_id,task_id,source,source_page,referral_partner,form_name,purpose,first_touch,provenance,match_state,is_test,legitimacy,review_reason) ON public.inquiries TO authenticated;
GRANT ALL ON public.inquiries TO service_role;
CREATE POLICY inquiries_org_read ON public.inquiries FOR SELECT TO authenticated USING(organization_id=(select public.get_my_organization_id()));

CREATE TABLE public.inquiry_outbox (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES public.organizations(id),
 inquiry_id uuid NOT NULL REFERENCES public.inquiries(id), kind text NOT NULL CHECK(kind IN ('owner_alert','borrower_confirmation')),
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','sending','draft_created','provider_accepted','delivered','failed','needs_review','suppressed')),
 attempts integer NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now(), claimed_at timestamptz,
 accepted_at timestamptz, delivered_at timestamptz, provider_message_id text, provider_internet_id text,
 last_error text, execution_id text, UNIQUE(inquiry_id,kind)
);
CREATE INDEX inquiry_outbox_pending_idx ON public.inquiry_outbox(organization_id,created_at) WHERE status IN ('pending','sending','draft_created','failed','needs_review');
ALTER TABLE public.inquiry_outbox ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.inquiry_outbox FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.inquiry_outbox TO authenticated;
GRANT ALL ON public.inquiry_outbox TO service_role;
CREATE POLICY inquiry_outbox_org_read ON public.inquiry_outbox FOR SELECT TO authenticated USING(organization_id=(select public.get_my_organization_id()));

CREATE TABLE public.opportunity_milestones (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES public.organizations(id),
 inquiry_id uuid REFERENCES public.inquiries(id), contact_id uuid, loan_id uuid,
 milestone text NOT NULL CHECK(milestone IN ('inquiry_received','contact_attempt','engaged','application_started','application_submitted','preapproval_issued','lender_approved','conditional_approval','clear_to_close','closing_completed','funded','lost','withdrawn','denied','inactive')),
 occurred_at timestamptz NOT NULL, recorded_at timestamptz NOT NULL DEFAULT now(),
 source text NOT NULL, source_event_id text NOT NULL, source_url text, evidence jsonb NOT NULL DEFAULT '{}',
 supersedes_id uuid REFERENCES public.opportunity_milestones(id), voided_at timestamptz, outcome_reason text,
 UNIQUE(organization_id,source,source_event_id,milestone),
 FOREIGN KEY(organization_id,contact_id) REFERENCES public.contacts(organization_id,id),
 FOREIGN KEY(organization_id,loan_id) REFERENCES public.loans(organization_id,id)
);
CREATE INDEX opportunity_milestones_inquiry_idx ON public.opportunity_milestones(organization_id,inquiry_id,occurred_at);
CREATE INDEX opportunity_milestones_loan_idx ON public.opportunity_milestones(organization_id,loan_id,occurred_at);
CREATE INDEX opportunity_milestones_period_idx ON public.opportunity_milestones(organization_id,milestone,occurred_at);
ALTER TABLE public.opportunity_milestones ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.opportunity_milestones FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.opportunity_milestones TO authenticated;
GRANT ALL ON public.opportunity_milestones TO service_role;
CREATE POLICY opportunity_milestones_org_read ON public.opportunity_milestones FOR SELECT TO authenticated USING(organization_id=(select public.get_my_organization_id()));

CREATE TABLE public.communication_source_health (
 organization_id uuid NOT NULL REFERENCES public.organizations(id), source text NOT NULL,
 status text NOT NULL CHECK(status IN ('connected','partial','blocked','unverified')),
 last_success_at timestamptz, last_event_at timestamptz, last_attempt_at timestamptz, detail text,
 inbound boolean NOT NULL DEFAULT false, outbound boolean NOT NULL DEFAULT false,
 updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(organization_id,source)
);
ALTER TABLE public.communication_source_health ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.communication_source_health FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.communication_source_health TO authenticated;
GRANT ALL ON public.communication_source_health TO service_role;
CREATE POLICY communication_source_health_org_read ON public.communication_source_health FOR SELECT TO authenticated USING(organization_id=(select public.get_my_organization_id()));

CREATE OR REPLACE FUNCTION public.capture_inquiry(p_org uuid,p_actor uuid,p_key text,p_input jsonb,p_cipher jsonb,p_hash text,p_test boolean DEFAULT false)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE existing public.inquiries; candidate public.contacts; inquiry public.inquiries; ids uuid[]; cid uuid; tid uuid;
 email_value text := lower(trim(coalesce(p_input->>'email','')));
 phone_value text := regexp_replace(coalesce(p_input->>'phone',''),'[^0-9]','','g');
 first_value text := trim(coalesce(p_input->>'first_name','')); last_value text := trim(coalesce(p_input->>'last_name',''));
 match_value text := 'new_contact'; review text; received timestamptz := coalesce((p_input->>'received_at')::timestamptz,now());
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=p_actor AND organization_id=p_org AND role IN ('owner','admin')) THEN RAISE EXCEPTION 'Invalid organization owner'; END IF;
 IF length(p_key)<8 OR length(p_key)>200 OR (email_value='' AND phone_value='') THEN RAISE EXCEPTION 'Invalid inquiry'; END IF;
 -- Contact-level lock prevents simultaneous separate inquiries from duplicating a person.
 PERFORM pg_advisory_xact_lock(hashtextextended(p_org::text||':'||coalesce(nullif(email_value,''),phone_value),0));
 SELECT * INTO existing FROM public.inquiries WHERE organization_id=p_org AND event_key=p_key FOR UPDATE;
 IF FOUND THEN
   RETURN jsonb_build_object('id',existing.id,'contact_id',existing.contact_id,'task_id',existing.task_id,'match_state',existing.match_state,'duplicate',true,'payload_conflict',existing.payload_hash<>p_hash);
 END IF;
 IF length(phone_value)=11 AND left(phone_value,1)='1' THEN phone_value=substr(phone_value,2); END IF;
 SELECT array_agg(id) INTO ids FROM public.contacts WHERE organization_id=p_org AND
 ((email_value<>'' AND lower(trim(email))=email_value) OR
 (length(phone_value)>=10 AND regexp_replace(regexp_replace(coalesce(phone,''),'[^0-9]','','g'),'^1([0-9]{10})$','\1')=phone_value));
 IF coalesce(array_length(ids,1),0)>1 THEN match_value:='needs_review'; review:='Multiple exact contact matches; identity review required';
 ELSIF array_length(ids,1)=1 THEN
   SELECT * INTO candidate FROM public.contacts WHERE id=ids[1] AND organization_id=p_org;
   IF (first_value<>'' AND coalesce(candidate.first_name,'')<>'' AND lower(first_value)<>lower(candidate.first_name))
      OR (last_value<>'' AND coalesce(candidate.last_name,'')<>'' AND lower(last_value)<>lower(candidate.last_name)) THEN
     match_value:='needs_review'; review:='Contact channel matches but supplied name differs; household identity review required';
   ELSE cid:=candidate.id; match_value:='matched'; END IF;
 ELSE
   INSERT INTO public.contacts(organization_id,user_id,first_name,last_name,email,phone,stage,contact_type,lead_source,source_page,form_name,operational_owner_id)
   VALUES(p_org,p_actor,nullif(first_value,''),nullif(last_value,''),nullif(email_value,''),nullif(p_input->>'phone',''),'Lead','borrower',coalesce(nullif(p_input->>'source',''),'Website'),p_input->>'source_page',p_input->>'form_name',p_actor) RETURNING id INTO cid;
 END IF;
 INSERT INTO public.inquiries(organization_id,event_key,received_at,contact_id,owner_id,source,source_page,referral_partner,form_name,purpose,first_touch,provenance,payload_cipher,payload_hash,match_state,is_test,legitimacy,review_reason)
 VALUES(p_org,p_key,received,cid,p_actor,coalesce(nullif(p_input->>'source',''),'Website'),p_input->>'source_page',p_input->>'referral_partner',p_input->>'form_name',p_input->>'purpose',coalesce(p_input->'first_touch','{}'),coalesce(p_input->'provenance','{}'),p_cipher,p_hash,match_value,p_test,CASE WHEN p_test THEN 'test' WHEN match_value='needs_review' THEN 'review' ELSE 'inquiry' END,review) RETURNING * INTO inquiry;
 INSERT INTO public.todo_items(organization_id,user_id,title,text,description,source,source_key,related_contact_id,assigned_to,priority,status,due_at)
 VALUES(p_org,p_actor,CASE WHEN match_value='needs_review' THEN 'Review inquiry identity' ELSE 'Respond to new inquiry' END,
 CASE WHEN match_value='needs_review' THEN 'Review inquiry identity' ELSE 'Respond to new inquiry' END,
 coalesce(review,'Review the inquiry and communication history, make first contact, and record the next action.'),'inquiry','inquiry:'||inquiry.id,cid,p_actor,'medium','open',null) RETURNING id INTO tid;
 UPDATE public.inquiries SET task_id=tid WHERE id=inquiry.id;
 INSERT INTO public.activity_log(organization_id,user_id,contact_id,type,action,external_id,occurred_at,entity_type,entity_id)
 VALUES(p_org,p_actor,cid,'inquiry_received','inquiry_received','inquiry:'||inquiry.id,received,'inquiry',inquiry.id);
 INSERT INTO public.opportunity_milestones(organization_id,inquiry_id,contact_id,milestone,occurred_at,source,source_event_id,evidence)
 VALUES(p_org,inquiry.id,cid,'inquiry_received',received,'website',p_key,jsonb_build_object('capture','durable','is_test',p_test));
 INSERT INTO public.inquiry_outbox(organization_id,inquiry_id,kind) VALUES(p_org,inquiry.id,'owner_alert');
 IF email_value<>'' AND NOT p_test AND coalesce(p_input->>'suppress_confirmation','false')<>'true' THEN
   INSERT INTO public.inquiry_outbox(organization_id,inquiry_id,kind) VALUES(p_org,inquiry.id,'borrower_confirmation');
 END IF;
 RETURN jsonb_build_object('id',inquiry.id,'contact_id',cid,'task_id',tid,'match_state',match_value,'duplicate',false,'payload_conflict',false);
END $$;
REVOKE ALL ON FUNCTION public.capture_inquiry(uuid,uuid,text,jsonb,jsonb,text,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.capture_inquiry(uuid,uuid,text,jsonb,jsonb,text,boolean) TO service_role;

CREATE OR REPLACE FUNCTION public.claim_inquiry_notifications(p_org uuid,p_inquiry uuid DEFAULT NULL)
RETURNS SETOF public.inquiry_outbox LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$
 UPDATE public.inquiry_outbox SET status='sending',attempts=attempts+1,claimed_at=now()
 WHERE id IN (SELECT id FROM public.inquiry_outbox WHERE organization_id=p_org AND status='pending' AND (p_inquiry IS NULL OR inquiry_id=p_inquiry) ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 20)
 RETURNING *;
$$;
REVOKE ALL ON FUNCTION public.claim_inquiry_notifications(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_inquiry_notifications(uuid,uuid) TO service_role;
COMMIT;
