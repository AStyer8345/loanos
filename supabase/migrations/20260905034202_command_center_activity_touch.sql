-- Keep imports and automatic confirmations out of meaningful contact time.
CREATE OR REPLACE FUNCTION public.fn_update_contact_last_touch_at()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF NEW.contact_id IS NOT NULL AND NEW.occurred_at IS NOT NULL
 AND coalesce(NEW.type,NEW.action) IN ('email_inbound','email_outbound','sms_inbound','sms_outbound','imessage.received','call_completed','call_attempted','meeting_completed') THEN
  UPDATE public.contacts SET last_touch_at=greatest(last_touch_at,NEW.occurred_at)
  WHERE id=NEW.contact_id AND organization_id=NEW.organization_id;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.fn_update_contact_last_touch_at() FROM PUBLIC,anon,authenticated;
