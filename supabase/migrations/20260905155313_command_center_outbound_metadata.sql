BEGIN;
CREATE TABLE public.communication_sync_state (
 organization_id uuid NOT NULL REFERENCES public.organizations(id), source text NOT NULL,
 through_at timestamptz, window_id uuid, window_from timestamptz, window_until timestamptz,
 next_page_url text, revision integer NOT NULL DEFAULT 0, last_attempt_at timestamptz,
 PRIMARY KEY(organization_id,source)
);
CREATE TABLE public.communication_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES public.organizations(id),
 source text NOT NULL, event_key text NOT NULL, direction text NOT NULL CHECK(direction='outbound'),
 contact_id uuid, occurred_at timestamptz NOT NULL, recorded_at timestamptz NOT NULL DEFAULT now(),
 match_state text NOT NULL CHECK(match_state IN ('matched','review','unmatched')),
 payload_cipher jsonb NOT NULL,
 UNIQUE(organization_id,source,event_key),
 FOREIGN KEY(organization_id,contact_id) REFERENCES public.contacts(organization_id,id)
);
ALTER TABLE public.communication_sync_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.communication_sync_state,public.communication_events FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.communication_sync_state,public.communication_events TO service_role;
GRANT SELECT(id,organization_id,source,event_key,direction,contact_id,occurred_at,recorded_at,match_state) ON public.communication_events TO authenticated;
CREATE POLICY communication_events_org_read ON public.communication_events FOR SELECT TO authenticated USING(organization_id=(select public.get_my_organization_id()));
CREATE FUNCTION public.begin_outbound_mail_window(p_org uuid,p_source text) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE s public.communication_sync_state;
BEGIN
 IF p_source<>'thestyerteam_outbound' THEN RAISE EXCEPTION 'Unknown source'; END IF;
 INSERT INTO public.communication_sync_state(organization_id,source) VALUES(p_org,p_source) ON CONFLICT DO NOTHING;
 SELECT * INTO s FROM public.communication_sync_state WHERE organization_id=p_org AND source=p_source FOR UPDATE;
 IF s.window_id IS NULL THEN
  UPDATE public.communication_sync_state SET window_id=gen_random_uuid(),window_from=coalesce(through_at-interval '5 minutes',now()-interval '14 days'),window_until=now(),next_page_url=null,revision=0 WHERE organization_id=p_org AND source=p_source;
 END IF;
 UPDATE public.communication_sync_state SET last_attempt_at=now() WHERE organization_id=p_org AND source=p_source RETURNING * INTO s;
 INSERT INTO public.communication_source_health(organization_id,source,status,last_attempt_at,detail,inbound,outbound)
 VALUES(p_org,p_source,'unverified',now(),'Sent Items metadata capture is awaiting a verified completed window. No bodies or attachments are requested.',false,false)
 ON CONFLICT(organization_id,source) DO UPDATE SET last_attempt_at=now(),updated_at=now();
 RETURN to_jsonb(s);
END $$;
CREATE FUNCTION public.record_outbound_mail_page(p_org uuid,p_source text,p_window uuid,p_revision integer,p_events jsonb,p_next_url text) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE s public.communication_sync_state; e jsonb; ids uuid[]; cid uuid; inserted integer:=0; n integer; newest timestamptz;
BEGIN
 SELECT * INTO s FROM public.communication_sync_state WHERE organization_id=p_org AND source=p_source FOR UPDATE;
 IF NOT FOUND OR p_source<>'thestyerteam_outbound' THEN RAISE EXCEPTION 'Source window not found'; END IF;
 IF s.window_id IS DISTINCT FROM p_window OR s.revision<>p_revision THEN RETURN jsonb_build_object('duplicate_or_stale',true,'recorded',0); END IF;
 IF jsonb_typeof(p_events)<>'array' OR jsonb_array_length(p_events)>100 THEN RAISE EXCEPTION 'Invalid page'; END IF;
 FOR e IN SELECT value FROM jsonb_array_elements(p_events) LOOP
  IF e->>'event_key' !~ '^[a-f0-9]{64}$' OR (e->>'occurred_at')::timestamptz<s.window_from OR (e->>'occurred_at')::timestamptz>=s.window_until THEN RAISE EXCEPTION 'Event outside captured window'; END IF;
  SELECT array_agg(DISTINCT id) INTO ids FROM public.contacts WHERE organization_id=p_org AND lower(trim(email)) IN (SELECT lower(trim(value)) FROM jsonb_array_elements_text(e->'recipients'));
  cid:=CASE WHEN cardinality(ids)=1 THEN ids[1] ELSE null END;
  INSERT INTO public.communication_events(organization_id,source,event_key,direction,contact_id,occurred_at,match_state,payload_cipher)
  VALUES(p_org,p_source,e->>'event_key','outbound',cid,(e->>'occurred_at')::timestamptz,CASE WHEN cid IS NOT NULL THEN 'matched' WHEN cardinality(ids)>1 THEN 'review' ELSE 'unmatched' END,CASE WHEN cardinality(ids)>0 THEN e->'payload_cipher' ELSE e->'held_cipher' END)
  ON CONFLICT(organization_id,source,event_key) DO NOTHING;
  GET DIAGNOSTICS n=ROW_COUNT;inserted:=inserted+n;
  newest:=greatest(newest,(e->>'occurred_at')::timestamptz);
 END LOOP;
 UPDATE public.communication_sync_state SET revision=revision+1,next_page_url=p_next_url,through_at=CASE WHEN p_next_url IS NULL THEN window_until ELSE through_at END,window_id=CASE WHEN p_next_url IS NULL THEN null ELSE window_id END WHERE organization_id=p_org AND source=p_source;
 UPDATE public.communication_source_health SET status=CASE WHEN p_next_url IS NULL THEN 'connected' ELSE 'partial' END,last_event_at=greatest(last_event_at,newest),last_success_at=CASE WHEN p_next_url IS NULL THEN now() ELSE last_success_at END,last_attempt_at=now(),outbound=true,detail=CASE WHEN p_next_url IS NULL THEN 'Sent Items metadata captured through the completed source window. Bodies and attachments are excluded; message authorship is not inferred. Unmatched references remain held for review.' ELSE 'Sent Items metadata capture is continuing through saved pages. The cursor will not advance past unprocessed messages.' END,updated_at=now() WHERE organization_id=p_org AND source=p_source;
 RETURN jsonb_build_object('recorded',inserted,'has_next_page',p_next_url IS NOT NULL,'window_complete',p_next_url IS NULL,'financial_fields_changed',false);
END $$;
REVOKE ALL ON FUNCTION public.begin_outbound_mail_window(uuid,text),public.record_outbound_mail_page(uuid,text,uuid,integer,jsonb,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.begin_outbound_mail_window(uuid,text),public.record_outbound_mail_page(uuid,text,uuid,integer,jsonb,text) TO service_role;
COMMIT;
