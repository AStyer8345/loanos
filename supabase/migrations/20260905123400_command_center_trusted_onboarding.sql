BEGIN;
-- Service-only, atomic claims prevent onboarding/invite races from moving a profile.
CREATE FUNCTION public.claim_new_organization(p_user uuid,p_email text,p_name text,p_full_name text,p_plan text,p_profile jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE org uuid;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended('profile-membership:'||p_user::text,0));
 IF NOT EXISTS(SELECT 1 FROM auth.users WHERE id=p_user AND lower(email)=lower(p_email)) THEN RAISE EXCEPTION 'Verified user required'; END IF;
 IF EXISTS(SELECT 1 FROM public.profiles WHERE id=p_user AND organization_id IS NOT NULL) THEN RAISE EXCEPTION 'Already assigned to an organization'; END IF;
 IF length(trim(p_name)) NOT BETWEEN 1 AND 200 OR length(trim(p_full_name)) NOT BETWEEN 1 AND 200 OR p_plan NOT IN ('starter','professional') THEN RAISE EXCEPTION 'Invalid onboarding details'; END IF;
 INSERT INTO public.organizations(name,slug,plan) VALUES(trim(p_name),regexp_replace(lower(trim(p_name)),'[^a-z0-9]+','-','g')||'-'||left(p_user::text,8),p_plan) RETURNING id INTO org;
 INSERT INTO public.profiles(id,organization_id,role,full_name,email,nmls_individual,phone,states_licensed)
 VALUES(p_user,org,'owner',trim(p_full_name),p_email,nullif(p_profile->>'nmls_individual',''),nullif(p_profile->>'phone',''),ARRAY(SELECT jsonb_array_elements_text(coalesce(p_profile->'states_licensed','[]'))))
 ON CONFLICT(id) DO UPDATE SET organization_id=EXCLUDED.organization_id,role=EXCLUDED.role,full_name=EXCLUDED.full_name,email=EXCLUDED.email,nmls_individual=EXCLUDED.nmls_individual,phone=EXCLUDED.phone,states_licensed=EXCLUDED.states_licensed WHERE profiles.organization_id IS NULL;
 IF NOT FOUND THEN RAISE EXCEPTION 'Membership already claimed'; END IF;
 INSERT INTO public.org_settings(organization_id) VALUES(org);
 RETURN org;
END $$;
CREATE FUNCTION public.attach_invited_profile(p_user uuid,p_email text,p_org uuid,p_role text)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE old_org uuid;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended('profile-membership:'||p_user::text,0));
 IF p_role NOT IN ('admin','member') OR NOT EXISTS(SELECT 1 FROM auth.users WHERE id=p_user AND lower(email)=lower(p_email)) THEN RAISE EXCEPTION 'Verified invited user required'; END IF;
 SELECT organization_id INTO old_org FROM public.profiles WHERE id=p_user;
 IF old_org IS NOT NULL AND old_org<>p_org THEN RAISE EXCEPTION 'Account already belongs to another organization'; END IF;
 IF old_org=p_org THEN RETURN; END IF;
 INSERT INTO public.profiles(id,organization_id,role,email) VALUES(p_user,p_org,p_role,p_email)
 ON CONFLICT(id) DO UPDATE SET organization_id=EXCLUDED.organization_id,role=EXCLUDED.role,email=EXCLUDED.email WHERE profiles.organization_id IS NULL;
 IF NOT FOUND THEN RAISE EXCEPTION 'Membership already claimed'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.claim_new_organization(uuid,text,text,text,text,jsonb),public.attach_invited_profile(uuid,text,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_new_organization(uuid,text,text,text,text,jsonb),public.attach_invited_profile(uuid,text,uuid,text) TO service_role;
COMMIT;
