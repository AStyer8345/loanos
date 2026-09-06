-- Run inside a transaction; caller MUST roll back. Uses no real invitation.
INSERT INTO private.staff_access(email,organization_id,display_name,comp_bps,active)
VALUES ('staff-privacy-rollback@example.invalid','18613f82-fdd9-42dd-a09e-f3c577328258','Privacy Test',25,true);
INSERT INTO auth.users(id,email,aud,role,created_at,updated_at)
VALUES ('1db2b6f8-581d-4bb1-9b9e-56c1f89cba99','staff-privacy-rollback@example.invalid','authenticated','authenticated',now(),now());
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM private.staff_access WHERE email='staff-privacy-rollback@example.invalid' AND user_id='1db2b6f8-581d-4bb1-9b9e-56c1f89cba99') THEN RAISE EXCEPTION 'Invitation was not bound'; END IF;
END $$;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims','{"sub":"1db2b6f8-581d-4bb1-9b9e-56c1f89cba99","role":"authenticated"}',true);
DO $$ BEGIN
 IF (public.staff_access_context()->>'comp_bps')::numeric <> 25 THEN RAISE EXCEPTION 'Wrong staff rate'; END IF;
 IF EXISTS(SELECT 1 FROM public.comp_plans) THEN RAISE EXCEPTION 'Staff can read owner plans'; END IF;
 IF EXISTS(SELECT 1 FROM public.loan_compensation) THEN RAISE EXCEPTION 'Staff can read owner earnings'; END IF;
 IF EXISTS(SELECT 1 FROM public.loans) THEN RAISE EXCEPTION 'Staff can read raw loans'; END IF;
 IF EXISTS(SELECT 1 FROM public.profiles) THEN RAISE EXCEPTION 'Staff can read raw profiles'; END IF;
 IF EXISTS(SELECT 1 FROM storage.objects) THEN RAISE EXCEPTION 'Staff can read original storage'; END IF;
 UPDATE public.comp_plans SET comp_bps=25 WHERE organization_id='18613f82-fdd9-42dd-a09e-f3c577328258';
 IF FOUND THEN RAISE EXCEPTION 'Staff can change owner plan'; END IF;
 PERFORM set_config('request.path','/comp_plans',true);
 PERFORM set_config('request.method','GET',true);
 BEGIN PERFORM private.enforce_staff_rest_boundary(); RAISE EXCEPTION 'Raw REST was allowed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 PERFORM set_config('request.path','/rpc/staff_access_context',true);
 PERFORM private.enforce_staff_rest_boundary();
END $$;
RESET ROLE;
-- Revocation remains restrictive, including existing JWTs.
UPDATE private.staff_access SET active=false WHERE email='staff-privacy-rollback@example.invalid';
SET LOCAL ROLE authenticated;
DO $$ BEGIN
 IF NOT private.is_restricted_staff() OR (public.staff_access_context()->>'active')::boolean THEN RAISE EXCEPTION 'Revocation is not immediate'; END IF;
END $$;
RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims','{"sub":"b13aa8c6-c3a0-4312-9b35-c76073e7ccdc","role":"authenticated"}',true);
DO $$ BEGIN
 IF public.staff_access_context() IS NOT NULL THEN RAISE EXCEPTION 'Owner incorrectly restricted'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.loans WHERE organization_id='18613f82-fdd9-42dd-a09e-f3c577328258') THEN RAISE EXCEPTION 'Owner lost loan access'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.comp_plans WHERE organization_id='18613f82-fdd9-42dd-a09e-f3c577328258' AND comp_bps=200) THEN RAISE EXCEPTION 'Owner plan changed'; END IF;
END $$;
RESET ROLE;
