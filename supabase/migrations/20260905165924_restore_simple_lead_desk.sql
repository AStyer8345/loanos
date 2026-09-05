BEGIN;
ALTER TABLE public.lead_desk_preferences
 ADD COLUMN reporting_source text CHECK(reporting_source IN ('AI','Realtor Referral','Financial Advisor Referral','Other')),
 ADD COLUMN referral_name text,
 ADD COLUMN next_action text;
GRANT UPDATE(amount_note,product_note,reporting_source,referral_name,next_action) ON public.lead_desk_preferences TO authenticated;

-- Adam has explicitly requested sole ownership. This only applies to his
-- organization while he is its sole member, and never changes creator IDs.
CREATE FUNCTION public.assign_solo_adam_work() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE owner_id uuid;
BEGIN
 SELECT p.id INTO owner_id FROM public.profiles p
 WHERE p.organization_id=NEW.organization_id AND lower(p.email)='adam@thestyerteam.com'
 AND p.role='owner' AND (SELECT count(*) FROM public.profiles q WHERE q.organization_id=p.organization_id)=1;
 IF owner_id IS NOT NULL THEN
  IF TG_TABLE_NAME='todo_items' THEN NEW.assigned_to:=owner_id;
  ELSIF TG_TABLE_NAME='inquiries' THEN NEW.owner_id:=owner_id;
  ELSE NEW.operational_owner_id:=owner_id; END IF;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.assign_solo_adam_work() FROM PUBLIC,anon;
CREATE TRIGGER solo_owner BEFORE INSERT OR UPDATE OF organization_id,operational_owner_id ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.assign_solo_adam_work();
CREATE TRIGGER solo_owner BEFORE INSERT OR UPDATE OF organization_id,operational_owner_id ON public.loans FOR EACH ROW EXECUTE FUNCTION public.assign_solo_adam_work();
CREATE TRIGGER solo_owner BEFORE INSERT OR UPDATE OF organization_id,owner_id ON public.inquiries FOR EACH ROW EXECUTE FUNCTION public.assign_solo_adam_work();
CREATE TRIGGER solo_owner BEFORE INSERT OR UPDATE OF organization_id,assigned_to ON public.todo_items FOR EACH ROW EXECUTE FUNCTION public.assign_solo_adam_work();
COMMIT;
