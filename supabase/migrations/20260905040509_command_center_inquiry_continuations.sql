-- Follow-up questionnaires supplement the original inquiry; they are not new opportunities.
BEGIN;
ALTER TABLE public.inquiries ADD COLUMN parent_inquiry_id uuid;
CREATE UNIQUE INDEX inquiries_org_id_unique ON public.inquiries(organization_id,id);
ALTER TABLE public.inquiries ADD CONSTRAINT inquiries_parent_org_fk FOREIGN KEY(organization_id,parent_inquiry_id) REFERENCES public.inquiries(organization_id,id);
CREATE INDEX inquiries_parent_idx ON public.inquiries(organization_id,parent_inquiry_id);
ALTER TABLE public.inquiries DROP CONSTRAINT inquiries_legitimacy_check;
ALTER TABLE public.inquiries ADD CONSTRAINT inquiries_legitimacy_check CHECK(legitimacy IN ('inquiry','spam','test','review','continuation'));
GRANT SELECT(parent_inquiry_id) ON public.inquiries TO authenticated;
CREATE OR REPLACE FUNCTION public.capture_inquiry(p_org uuid,p_actor uuid,p_key text,p_input jsonb,p_cipher jsonb,p_hash text,p_test boolean DEFAULT false)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE parent public.inquiries; continuation boolean := false; is_followup boolean := coalesce(p_input->>'form_name','') IN ('qualification-followup','quick-quote-followup'); existing public.inquiries; candidate public.contacts; inquiry public.inquiries; ids uuid[]; cid uuid; tid uuid;
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
 IF is_followup THEN
   SELECT * INTO parent FROM public.inquiries WHERE organization_id=p_org
    AND event_key=nullif(p_input->>'parent_inquiry_id','') AND contact_id=cid
    AND legitimacy IN ('inquiry','test') AND is_test=p_test FOR UPDATE;
   IF FOUND THEN continuation:=true;
   ELSE match_value:='needs_review'; review:='Follow-up details received without a verified original inquiry; link for review'; END IF;
 END IF;
 INSERT INTO public.inquiries(organization_id,event_key,received_at,contact_id,owner_id,source,source_page,referral_partner,form_name,purpose,first_touch,provenance,payload_cipher,payload_hash,match_state,is_test,legitimacy,review_reason,parent_inquiry_id)
 VALUES(p_org,p_key,received,cid,p_actor,coalesce(nullif(p_input->>'source',''),'Website'),p_input->>'source_page',p_input->>'referral_partner',p_input->>'form_name',p_input->>'purpose',coalesce(p_input->'first_touch','{}'),coalesce(p_input->'provenance','{}'),p_cipher,p_hash,match_value,p_test,CASE WHEN continuation THEN 'continuation' WHEN p_test THEN 'test' WHEN match_value='needs_review' THEN 'review' ELSE 'inquiry' END,review,CASE WHEN continuation THEN parent.id END) RETURNING * INTO inquiry;
 IF continuation THEN
   UPDATE public.inquiries SET task_id=parent.task_id,owner_id=parent.owner_id WHERE id=inquiry.id;
   INSERT INTO public.activity_log(organization_id,user_id,contact_id,type,action,external_id,occurred_at,entity_type,entity_id)
   VALUES(p_org,p_actor,cid,'inquiry_details_received','inquiry_details_received','inquiry:'||inquiry.id,received,'inquiry',inquiry.id);
   RETURN jsonb_build_object('id',inquiry.id,'contact_id',cid,'task_id',parent.task_id,'match_state',match_value,'duplicate',false,'payload_conflict',false,'parent_inquiry_id',parent.id);
 END IF;
 INSERT INTO public.todo_items(organization_id,user_id,title,text,description,source,source_key,related_contact_id,assigned_to,priority,status,due_at)
 VALUES(p_org,p_actor,CASE WHEN match_value='needs_review' THEN 'Review inquiry identity' ELSE 'Respond to new inquiry' END,
 CASE WHEN match_value='needs_review' THEN 'Review inquiry identity' ELSE 'Respond to new inquiry' END,
 coalesce(review,'Review the inquiry and communication history, make first contact, and record the next action.'),'inquiry','inquiry:'||inquiry.id,cid,p_actor,'medium','open',null) RETURNING id INTO tid;
 UPDATE public.inquiries SET task_id=tid WHERE id=inquiry.id;
 INSERT INTO public.activity_log(organization_id,user_id,contact_id,type,action,external_id,occurred_at,entity_type,entity_id)
 VALUES(p_org,p_actor,cid,'inquiry_received','inquiry_received','inquiry:'||inquiry.id,received,'inquiry',inquiry.id);
 IF NOT is_followup THEN
 INSERT INTO public.opportunity_milestones(organization_id,inquiry_id,contact_id,milestone,occurred_at,source,source_event_id,evidence)
 VALUES(p_org,inquiry.id,cid,'inquiry_received',received,'website',p_key,jsonb_build_object('capture','durable','is_test',p_test));
 END IF;
 INSERT INTO public.inquiry_outbox(organization_id,inquiry_id,kind) VALUES(p_org,inquiry.id,'owner_alert');
 IF email_value<>'' AND NOT p_test AND coalesce(p_input->>'suppress_confirmation','false')<>'true' THEN
   INSERT INTO public.inquiry_outbox(organization_id,inquiry_id,kind) VALUES(p_org,inquiry.id,'borrower_confirmation');
 END IF;
 RETURN jsonb_build_object('id',inquiry.id,'contact_id',cid,'task_id',tid,'match_state',match_value,'duplicate',false,'payload_conflict',false);
END $$;
REVOKE ALL ON FUNCTION public.capture_inquiry(uuid,uuid,text,jsonb,jsonb,text,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.capture_inquiry(uuid,uuid,text,jsonb,jsonb,text,boolean) TO service_role;

COMMIT;
