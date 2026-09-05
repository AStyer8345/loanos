BEGIN;
-- An explicit reviewed relationship, never a guess based on contact import dates.
CREATE TABLE public.inquiry_loan_links (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES public.organizations(id),
 inquiry_id uuid NOT NULL, loan_id uuid NOT NULL, reviewed_by uuid NOT NULL,
 reviewed_at timestamptz NOT NULL DEFAULT now(), evidence text NOT NULL CHECK(length(evidence) BETWEEN 10 AND 2000),
 UNIQUE(organization_id,loan_id),
 FOREIGN KEY(organization_id,inquiry_id) REFERENCES public.inquiries(organization_id,id),
 FOREIGN KEY(organization_id,loan_id) REFERENCES public.loans(organization_id,id),
 FOREIGN KEY(organization_id,reviewed_by) REFERENCES public.profiles(organization_id,id)
);
CREATE INDEX inquiry_loan_links_inquiry_idx ON public.inquiry_loan_links(organization_id,inquiry_id);
ALTER TABLE public.inquiry_loan_links ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.inquiry_loan_links FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.inquiry_loan_links TO authenticated;
GRANT ALL ON public.inquiry_loan_links TO service_role;
CREATE POLICY inquiry_loan_links_read ON public.inquiry_loan_links FOR SELECT TO authenticated USING(organization_id=(select public.get_my_organization_id()));
CREATE FUNCTION public.review_inquiry_loan_link(p_inquiry uuid,p_loan uuid,p_evidence text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE org uuid:=public.get_my_organization_id(); result uuid;
BEGIN
 IF org IS NULL OR auth.uid() IS NULL THEN RAISE EXCEPTION 'Membership required'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.inquiries i JOIN public.loans l ON l.organization_id=i.organization_id AND l.contact_id=i.contact_id WHERE i.id=p_inquiry AND l.id=p_loan AND i.organization_id=org AND i.legitimacy='inquiry' AND NOT i.is_test) THEN RAISE EXCEPTION 'Review requires a matched inquiry and loan in your organization'; END IF;
 INSERT INTO public.inquiry_loan_links(organization_id,inquiry_id,loan_id,reviewed_by,evidence) VALUES(org,p_inquiry,p_loan,auth.uid(),trim(p_evidence)) RETURNING id INTO result;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.review_inquiry_loan_link(uuid,uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.review_inquiry_loan_link(uuid,uuid,text) TO authenticated;

-- Referential isolation also protects callers using the existing task editor.
ALTER TABLE public.todo_items ADD CONSTRAINT todo_assignee_org_fk FOREIGN KEY(organization_id,assigned_to) REFERENCES public.profiles(organization_id,id) NOT VALID;
ALTER TABLE public.todo_items ADD CONSTRAINT todo_contact_org_fk FOREIGN KEY(organization_id,related_contact_id) REFERENCES public.contacts(organization_id,id) NOT VALID;
ALTER TABLE public.todo_items ADD CONSTRAINT todo_loan_org_fk FOREIGN KEY(organization_id,related_loan_id) REFERENCES public.loans(organization_id,id) NOT VALID;
ALTER TABLE public.todo_items VALIDATE CONSTRAINT todo_assignee_org_fk;
ALTER TABLE public.todo_items VALIDATE CONSTRAINT todo_contact_org_fk;
ALTER TABLE public.todo_items VALIDATE CONSTRAINT todo_loan_org_fk;

CREATE FUNCTION public.set_operational_owner(p_kind text,p_id uuid,p_owner uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE org uuid:=public.get_my_organization_id(); changed integer;
BEGIN
 IF org IS NULL OR auth.uid() IS NULL THEN RAISE EXCEPTION 'Membership required'; END IF;
 IF p_owner IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=p_owner AND organization_id=org) THEN RAISE EXCEPTION 'Assignee must belong to your organization'; END IF;
 IF p_kind='inquiry' THEN
  UPDATE public.inquiries SET owner_id=p_owner WHERE id=p_id AND organization_id=org;
  GET DIAGNOSTICS changed=ROW_COUNT;
  UPDATE public.todo_items SET assigned_to=p_owner WHERE organization_id=org AND id=(SELECT task_id FROM public.inquiries WHERE id=p_id AND organization_id=org);
 ELSIF p_kind='loan' THEN UPDATE public.loans SET operational_owner_id=p_owner WHERE id=p_id AND organization_id=org; GET DIAGNOSTICS changed=ROW_COUNT;
 ELSIF p_kind='contact' THEN UPDATE public.contacts SET operational_owner_id=p_owner WHERE id=p_id AND organization_id=org; GET DIAGNOSTICS changed=ROW_COUNT;
 ELSE RAISE EXCEPTION 'Invalid record type'; END IF;
 IF changed<>1 THEN RAISE EXCEPTION 'Record not found'; END IF;
 INSERT INTO public.activity_log(organization_id,user_id,type,action,entity_type,entity_id,occurred_at,summary) VALUES(org,auth.uid(),'operational_routing','owner.changed',p_kind,p_id,now(),'Operational ownership updated by a team member');
END $$;
REVOKE ALL ON FUNCTION public.set_operational_owner(text,uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.set_operational_owner(text,uuid,uuid) TO authenticated;

CREATE FUNCTION public.ensure_lead_desk_preference(p_contact uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE org uuid:=public.get_my_organization_id(); result uuid;
BEGIN
 IF org IS NULL OR auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM public.contacts WHERE id=p_contact AND organization_id=org) THEN RAISE EXCEPTION 'Contact not found'; END IF;
 INSERT INTO public.lead_desk_preferences(organization_id,contact_id,match_state) VALUES(org,p_contact,'matched') ON CONFLICT(organization_id,contact_id) DO NOTHING;
 SELECT id INTO result FROM public.lead_desk_preferences WHERE organization_id=org AND contact_id=p_contact;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.ensure_lead_desk_preference(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.ensure_lead_desk_preference(uuid) TO authenticated;
COMMIT;
