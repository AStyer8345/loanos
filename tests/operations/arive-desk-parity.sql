-- Run with the trusted database connection. All fixtures and writes roll back.
BEGIN;
CREATE TEMP TABLE original_desk ON COMMIT DROP AS SELECT * FROM public.lead_desk_preferences;
DO $$
DECLARE
 org constant uuid:='18613f82-fdd9-42dd-a09e-f3c577328258';
 fixture constant text:='9999999909'; pref uuid; loan_id uuid; amt numeric; n integer;
 stamp timestamptz:=now();
BEGIN
 ASSERT NOT EXISTS(SELECT 1 FROM public.arive_loan_facts WHERE organization_id=org AND arive_loan_id=fixture),'Fixture ID already exists';
 INSERT INTO public.lead_desk_preferences(organization_id,legacy_key,notes,match_state,provenance)
 VALUES(org,'arive-parity-fixture','Preserve the human note','review',jsonb_build_object(
  'display_name','ARIVE Regression Fixture','email','arive-parity@example.test',
  'arive_match',jsonb_build_object('state','not_found','ids','[]'::jsonb))) RETURNING id INTO pref;
 INSERT INTO public.arive_loan_facts(organization_id,arive_loan_id,source_updated_at,status,loan_amount,base_loan_amount,financed_fees,borrower_name,borrower_email)
 VALUES(org,fixture,stamp,'PREAPPROVED',500000,500000,0,'ARIVE Regression Fixture','arive-parity@example.test');
 ASSERT (SELECT provenance->'arive_match'->>'state' FROM public.lead_desk_preferences WHERE id=pref)='matched','Prior no-match was not repaired';
 ASSERT (SELECT notes FROM public.lead_desk_preferences WHERE id=pref)='Preserve the human note','Human note changed';
 SELECT id INTO loan_id FROM public.loans WHERE organization_id=org AND arive_loan_id=fixture;
 ASSERT loan_id IS NOT NULL,'Missing loan mirror';
 ASSERT (SELECT contact_id FROM public.loans WHERE id=loan_id) IS NULL,'Unverified contact link';
 PERFORM public.ensure_arive_desk_member(org,fixture);
 SELECT count(*) INTO n FROM public.lead_desk_preferences WHERE organization_id=org AND provenance->'arive_match'->'ids' ? fixture;
 ASSERT n=1,'Duplicate preference on replay';
 -- The actual existing relay writes loan fields and raw_payload together.
 UPDATE public.loans SET raw_payload=jsonb_build_object('modifiedDateTime',stamp,'baseLoanAmount',510000,'financedFees',8925)
 WHERE id=loan_id;
 SELECT loan_amount INTO amt FROM public.loans WHERE id=loan_id; ASSERT amt=518925,'Base plus financed fees not normalized';
 SELECT loan_amount INTO amt FROM public.arive_loan_facts WHERE organization_id=org AND arive_loan_id=fixture;
 ASSERT amt=518925,'Lead Desk diverged from Loans';
 -- Equal source-time redelivery must converge after amount normalization.
 UPDATE public.loans SET raw_payload=raw_payload||jsonb_build_object('totalLoanAmount',550000) WHERE id=loan_id;
 SELECT loan_amount INTO amt FROM public.arive_loan_facts WHERE organization_id=org AND arive_loan_id=fixture;
 ASSERT amt=550000,'Equal-time event did not converge';
 UPDATE public.loans SET raw_payload=raw_payload||jsonb_build_object('totalLoanAmount',null,'financedFees',null) WHERE id=loan_id;
 ASSERT (SELECT loan_amount FROM public.loans WHERE id=loan_id) IS NULL,'Unknown fees became an invented total';
 ASSERT (SELECT loan_amount FROM public.arive_loan_facts WHERE organization_id=org AND arive_loan_id=fixture) IS NULL,'Unknown total differs between views';
 BEGIN
  UPDATE public.loans SET raw_payload=raw_payload||jsonb_build_object('modifiedDateTime',stamp-interval '1 day') WHERE id=loan_id;
  RAISE EXCEPTION 'Stale event was accepted';
 EXCEPTION WHEN raise_exception THEN
  IF SQLERRM <> 'Older ARIVE update rejected' THEN RAISE; END IF;
 END;
 ASSERT NOT has_function_privilege('anon','public.ensure_arive_desk_member(uuid,text)','EXECUTE'),'Anonymous service access';
 ASSERT NOT has_function_privilege('authenticated','public.ensure_arive_desk_member(uuid,text)','EXECUTE'),'Browser service access';
 ASSERT NOT EXISTS(SELECT 1 FROM original_desk b LEFT JOIN public.lead_desk_preferences p ON p.id=b.id WHERE to_jsonb(b) IS DISTINCT FROM to_jsonb(p)),'Existing saved lead changed';
END $$;
ROLLBACK;
