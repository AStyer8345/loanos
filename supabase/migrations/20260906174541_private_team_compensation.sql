-- Staff data is only returned through the audited /api/team projection.
-- Reservation by email closes the interval between auth invitation and profile attachment.
CREATE SCHEMA IF NOT EXISTS private;
CREATE TABLE private.staff_access (
  email text PRIMARY KEY CHECK (email = lower(email)),
  user_id uuid UNIQUE REFERENCES auth.users(id),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  display_name text NOT NULL,
  comp_bps numeric(8,3) NOT NULL CHECK (comp_bps >= 0 AND comp_bps <= 10000),
  active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE private.staff_access ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.staff_access FROM PUBLIC, anon, authenticated;
GRANT ALL ON private.staff_access TO service_role;

CREATE FUNCTION private.is_restricted_staff() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (SELECT 1 FROM private.staff_access a WHERE a.user_id = auth.uid()
    OR (a.user_id IS NULL AND a.email = (SELECT lower(u.email) FROM auth.users u WHERE u.id = auth.uid())));
$$;
REVOKE ALL ON FUNCTION private.is_restricted_staff() FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_restricted_staff() TO authenticated, service_role;

CREATE FUNCTION private.bind_staff_invitation() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  UPDATE private.staff_access SET user_id = NEW.id WHERE email = lower(NEW.email) AND user_id IS NULL;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.bind_staff_invitation() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER bind_staff_invitation AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION private.bind_staff_invitation();

CREATE FUNCTION private.staff_access_context() RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT jsonb_build_object('restricted', true, 'active', a.active,
    'organization_id', a.organization_id, 'display_name', a.display_name, 'comp_bps', a.comp_bps)
  FROM private.staff_access a WHERE a.user_id = auth.uid()
    OR (a.user_id IS NULL AND a.email = (SELECT lower(u.email) FROM auth.users u WHERE u.id = auth.uid()));
$$;
REVOKE ALL ON FUNCTION private.staff_access_context() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.staff_access_context() TO authenticated, service_role;
CREATE FUNCTION public.staff_access_context() RETURNS jsonb
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$ SELECT private.staff_access_context(); $$;
REVOKE ALL ON FUNCTION public.staff_access_context() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.staff_access_context() TO authenticated, service_role;

CREATE FUNCTION private.enforce_staff_rest_boundary() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF private.is_restricted_staff() AND
    (coalesce(current_setting('request.path', true),'') <> '/rpc/staff_access_context'
     OR coalesce(current_setting('request.method',true),'') NOT IN ('GET','POST')) THEN
    RAISE EXCEPTION 'Use your team workspace' USING ERRCODE = '42501';
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION private.enforce_staff_rest_boundary() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.enforce_staff_rest_boundary() TO anon, authenticated, service_role;
ALTER ROLE authenticator SET pgrst.db_pre_request = 'private.enforce_staff_rest_boundary';

-- Restrictive policies are an additional barrier for Storage and future Realtime.
-- Existing permissive policies and owner/service permissions remain intact.
DO $$ DECLARE t record; BEGIN
  FOR t IN SELECT n.nspname, c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE c.relkind='r' AND c.relrowsecurity AND (n.nspname='public' OR (n.nspname='storage' AND c.relname='objects'))
  LOOP
    EXECUTE format('CREATE POLICY staff_privacy_boundary ON %I.%I AS RESTRICTIVE FOR ALL TO authenticated USING (NOT (SELECT private.is_restricted_staff())) WITH CHECK (NOT (SELECT private.is_restricted_staff()))',t.nspname,t.relname);
  END LOOP;
END $$;

CREATE TABLE public.team_record_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  record_kind text NOT NULL CHECK (record_kind IN ('lead','loan','contact')),
  record_id uuid NOT NULL,
  author_id uuid NOT NULL REFERENCES auth.users(id),
  author_name text NOT NULL,
  body text NOT NULL CHECK (length(body) BETWEEN 1 AND 10000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX team_record_notes_record_idx ON public.team_record_notes(organization_id,record_kind,record_id,created_at);
ALTER TABLE public.team_record_notes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.team_record_notes FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.team_record_notes TO service_role;
COMMENT ON TABLE public.team_record_notes IS 'Explicitly shared operational notes. Historical owner notes are never automatically shared.';
NOTIFY pgrst, 'reload config';
NOTIFY pgrst, 'reload schema';
