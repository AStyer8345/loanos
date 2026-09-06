BEGIN;
CREATE OR REPLACE FUNCTION public.capture_inbound_email(
 p_org uuid,p_actor uuid,p_message text,p_input jsonb,p_inquiry boolean,p_key text,p_hash text,
 p_inquiry_cipher jsonb,p_activity_cipher jsonb,p_ai jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE aid uuid; cid uuid; lid uuid; ids uuid[]; captured jsonb; iid uuid;
 received timestamptz := (p_input->>'received_at')::timestamptz;
 email_value text := lower(trim(p_input->>'email'));
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=p_actor AND organization_id=p_org AND role IN ('owner','admin')) THEN RAISE EXCEPTION 'Invalid owner'; END IF;
 IF coalesce(length(p_message),0)=0 OR coalesce(length(email_value),0)=0 OR received IS NULL THEN RAISE EXCEPTION 'Source identity required'; END IF;
 IF email_value IN ('adam@thestyerteam.com','adam.styer@hypersmart.loan','adam.styerassistant@gmail.com') THEN RETURN jsonb_build_object('skipped','internal_sender'); END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_org::text||':inbound:'||p_message,0));
 SELECT id,contact_id INTO aid,cid FROM public.activity_log WHERE organization_id=p_org AND external_id=p_message AND type='email_inbound' ORDER BY created_at LIMIT 1;
 IF aid IS NOT NULL AND cid IS NOT NULL THEN RETURN jsonb_build_object('activity_id',aid,'contact_id',cid,'duplicate',true); END IF;
 SELECT array_agg(id) INTO ids FROM public.contacts WHERE organization_id=p_org AND lower(trim(email))=email_value;
 cid:=CASE WHEN array_length(ids,1)=1 THEN ids[1] ELSE NULL END;
 IF p_inquiry THEN
  captured:=public.capture_inquiry(p_org,p_actor,p_key,p_input||jsonb_build_object('suppress_confirmation',true),p_inquiry_cipher,p_hash,false);
  IF coalesce((captured->>'payload_conflict')::boolean,false) THEN RAISE EXCEPTION 'Inquiry identity conflict'; END IF;
  iid:=(captured->>'id')::uuid;cid:=(captured->>'contact_id')::uuid;
  UPDATE public.opportunity_milestones SET source='email' WHERE organization_id=p_org AND inquiry_id=iid AND source_event_id=p_key AND source='website';
  UPDATE public.inquiry_outbox SET status='suppressed',last_error='Direct email intake: no automatic sends' WHERE organization_id=p_org AND inquiry_id=iid AND status='pending';
 END IF;
 IF cid IS NOT NULL THEN
  SELECT array_agg(id) INTO ids FROM public.loans WHERE organization_id=p_org AND contact_id=cid AND lower(coalesce(status,'')) NOT IN ('closed','funded','cancelled','canceled','denied','withdrawn');
  lid:=CASE WHEN array_length(ids,1)=1 THEN ids[1] ELSE NULL END;
 END IF;
 IF aid IS NULL THEN
  INSERT INTO public.activity_log(organization_id,user_id,contact_id,loan_id,type,action,external_id,occurred_at,entity_type,entity_id,ai_intent,ai_urgency,ai_sentiment,ai_suggested_action,ai_confidence,ai_classified_at)
  VALUES(p_org,p_actor,cid,lid,'email_inbound','email.received',p_message,received,CASE WHEN cid IS NOT NULL THEN 'contact' ELSE NULL END,cid,p_ai->>'intent',p_ai->>'urgency',p_ai->>'sentiment',p_ai->>'suggested_action',(p_ai->>'confidence')::numeric,now()) RETURNING id INTO aid;
 ELSE
  UPDATE public.activity_log SET contact_id=cid,loan_id=lid,occurred_at=received,entity_type=CASE WHEN cid IS NOT NULL THEN 'contact' ELSE NULL END,entity_id=cid WHERE id=aid AND organization_id=p_org;
 END IF;
 INSERT INTO public.activity_log_pii(activity_id,organization_id,pii_ciphertext,pii_iv,pii_tag,key_version)
 VALUES(aid,p_org,decode(p_activity_cipher->>'ciphertext','base64'),decode(p_activity_cipher->>'iv','base64'),decode(p_activity_cipher->>'tag','base64'),1)
 ON CONFLICT(activity_id) DO UPDATE SET pii_ciphertext=excluded.pii_ciphertext,pii_iv=excluded.pii_iv,pii_tag=excluded.pii_tag;
 IF cid IS NOT NULL THEN
  UPDATE public.contacts SET last_touch_at=greatest(last_touch_at,received),last_activity_date=greatest(last_activity_date,received),last_activity_type=CASE WHEN last_touch_at IS NULL OR last_touch_at<=received THEN 'email_inbound' ELSE last_activity_type END,updated_at=now() WHERE id=cid AND organization_id=p_org;
 END IF;
 RETURN jsonb_build_object('activity_id',aid,'contact_id',cid,'inquiry_id',iid,'captured_inquiry',iid IS NOT NULL,'duplicate',coalesce((captured->>'duplicate')::boolean,false));
END $$;
REVOKE ALL ON FUNCTION public.capture_inbound_email(uuid,uuid,text,jsonb,boolean,text,text,jsonb,jsonb,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.capture_inbound_email(uuid,uuid,text,jsonb,boolean,text,text,jsonb,jsonb,jsonb) TO service_role;
COMMIT;
