-- Membership is written only by the existing trusted onboarding/invite/admin
-- services. A self-row RLS policy alone must never authorize tenant/role edits.
BEGIN;
REVOKE INSERT, UPDATE, DELETE ON public.profiles FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (full_name, nmls_individual, phone, states_licensed, email_signature)
  ON public.profiles TO authenticated;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

DO $$
BEGIN
  IF has_column_privilege('authenticated', 'public.profiles', 'organization_id', 'UPDATE')
     OR has_column_privilege('authenticated', 'public.profiles', 'role', 'UPDATE')
     OR has_column_privilege('authenticated', 'public.profiles', 'id', 'UPDATE')
     OR has_table_privilege('authenticated', 'public.profiles', 'INSERT') THEN
    RAISE EXCEPTION 'Membership privilege guard failed';
  END IF;
  IF NOT has_column_privilege('authenticated', 'public.profiles', 'full_name', 'UPDATE')
     OR NOT has_table_privilege('service_role', 'public.profiles', 'INSERT')
     OR NOT has_table_privilege('service_role', 'public.profiles', 'UPDATE') THEN
    RAISE EXCEPTION 'Trusted onboarding or normal profile editing would break';
  END IF;
END $$;
COMMIT;
