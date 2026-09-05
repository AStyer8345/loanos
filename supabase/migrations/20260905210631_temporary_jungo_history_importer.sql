-- Temporary, service-only importer. Removed after the verified one-time import.
create or replace function public.import_jungo_history_once(plan jsonb, dry_run boolean default true)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public set lock_timeout='5s' as $$
declare
 org uuid := '18613f82-fdd9-42dd-a09e-f3c577328258';
 owner_id uuid := 'b13aa8c6-c3a0-4312-9b35-c76073e7ccdc';
 allowed_contacts text[] := array['first_name','last_name','email','phone','home_phone','mailing_street','mailing_city','mailing_state','mailing_zip','company_name','title','lead_source','referred_by','notes'];
 allowed_loans text[] := array['loan_number','borrower_name','co_borrower_name','property_address','property_city','property_state','property_zip','loan_amount','purchase_price','appraised_value','loan_purpose','loan_type','loan_program','lender','interest_rate','term_months','application_date','closing_date','funding_date','lead_source','referral_source','notes'];
 tbl text; mode text; item jsonb; old_row jsonb; safe_values jsonb; cols text; fields text; id_value uuid; changed int; report jsonb := '{}'; tr record; key_count int;
begin
 if auth.role() is distinct from 'service_role' then raise exception 'Service access required'; end if;
 if plan->>'org' is distinct from org::text or plan->>'sourceKey' is distinct from 'jungo_master_2026_09_02' then raise exception 'Unexpected import scope'; end if;
 begin
  lock table public.contacts, public.loans in access exclusive mode;
  create temp table history_before_contacts on commit drop as select id,to_jsonb(c) row_data from public.contacts c;
  create temp table history_before_loans on commit drop as select id,to_jsonb(l) row_data from public.loans l;
  create temp table history_before_other on commit drop as select 'drip' kind,to_jsonb(d) row_data from public.drip_enrollments d union all select 'comp',to_jsonb(c) from public.loan_compensation c;
  create temp table history_triggers on commit drop as
    select c.relname tbl,t.tgname,t.tgenabled from pg_trigger t join pg_class c on c.oid=t.tgrelid
    where c.relnamespace='public'::regnamespace and not t.tgisinternal and
    ((c.relname='contacts' and t.tgname in ('on_realtor_referral_contact_inserted','trg_contact_stage_cancel_drip')) or
    (c.relname='loans' and t.tgname in ('capture_arive_facts','fill_contact_from_loan_sync','loan_evidence_milestones','loan_insert_sync_contact','loan_stage_sync_contact','loans_update_contact_last_touch','trg_loan_created_cancel_drip','trg_loans_autocreate_comp','trg_loans_fill_contact_blanks')));
  if (select count(*) from history_triggers)<>11 then raise exception 'Trigger inventory changed'; end if;
  for tr in select * from history_triggers where tgenabled<>'D' loop execute format('alter table public.%I disable trigger %I',tr.tbl,tr.tgname); end loop;
  foreach tbl in array array['contacts','loans'] loop
   foreach mode in array array['Updates','Creates'] loop
    changed:=0;
    for item in select value from jsonb_array_elements(plan->((case when tbl='contacts' then 'contact' else 'loan' end)||mode)) loop
     id_value:=(item->>'id')::uuid;
     execute format('select to_jsonb(t) from public.%I t where id=$1',tbl) into old_row using id_value;
     if old_row is not null and old_row->>'organization_id' is distinct from org::text then raise exception 'Target belongs to another organization'; end if;
     if mode='Updates' then
      if old_row is null then raise exception 'Update target missing'; end if;
      if tbl='loans' and old_row->>'arive_updated_at' is not null then continue; end if;
      if exists(select 1 from jsonb_object_keys(item->'values') k where not(k=any(case when tbl='contacts' then allowed_contacts else allowed_loans end))) then raise exception 'Unexpected update field'; end if;
      select jsonb_object_agg(key,value) into safe_values from jsonb_each(item->'values') where value<>'null'::jsonb and value<>'""'::jsonb and (old_row->key='null'::jsonb or old_row->key='""'::jsonb);
      if safe_values is null then continue; end if;
      select string_agg(format('%I=v.%I',key,key),',') into fields from jsonb_object_keys(safe_values) key;
      execute format('update public.%I t set %s from jsonb_populate_record(null::public.%I,$1) v where t.id=$2 and t.organization_id=$3',tbl,fields,tbl) using safe_values,id_value,org;
      changed:=changed+1;
     else
      if item->>'organization_id' is distinct from org::text or item->>'user_id' is distinct from owner_id::text or item->>'operational_owner_id' is distinct from owner_id::text then raise exception 'Unexpected new record ownership'; end if;
      if exists(select 1 from jsonb_object_keys(item) k where not(k=any((case when tbl='contacts' then allowed_contacts||array['contact_type','stage','source','contact_group'] else allowed_loans||array['contact_id','co_borrower_contact_id','borrower_first_name','borrower_last_name','borrower_email','borrower_phone','status'] end)||array['id','organization_id','user_id','operational_owner_id']))) then raise exception 'Unexpected creation field'; end if;
      if old_row is not null then
       if not old_row @> item then raise exception 'Existing deterministic ID does not match import'; end if;
       continue;
      end if;
      if tbl='contacts' and item->>'email' is not null and exists(select 1 from public.contacts where organization_id=org and lower(email)=lower(item->>'email')) then raise exception 'New contact email now exists'; end if;
      if tbl='loans' then
       if not exists(select 1 from public.contacts where id=(item->>'contact_id')::uuid and organization_id=org) then raise exception 'Primary contact is missing'; end if;
       if item->>'co_borrower_contact_id' is not null and not exists(select 1 from public.contacts where id=(item->>'co_borrower_contact_id')::uuid and organization_id=org) then raise exception 'Co-borrower contact is missing'; end if;
       if item->>'loan_number' is not null and exists(select 1 from public.loans where organization_id=org and (loan_number=item->>'loan_number' or arive_loan_id=item->>'loan_number')) then raise exception 'New loan number now exists'; end if;
      end if;
      select string_agg(format('%I',key),',') into cols from jsonb_object_keys(item) key;
      execute format('insert into public.%I (%s) select %s from jsonb_populate_record(null::public.%I,$1)',tbl,cols,cols,tbl) using item;
      changed:=changed+1;
     end if;
    end loop;
    report:=report||jsonb_build_object(tbl||'_'||lower(mode),changed);
   end loop;
  end loop;
  if exists(select 1 from history_before_contacts b join public.contacts c using(id),lateral jsonb_each(b.row_data) x where x.key<>'updated_at' and x.value not in ('null'::jsonb,'""'::jsonb) and to_jsonb(c)->x.key is distinct from x.value) then raise exception 'Existing contact value changed'; end if;
  if exists(select 1 from history_before_loans b join public.loans l using(id),lateral jsonb_each(b.row_data) x where x.key<>'updated_at' and x.value not in ('null'::jsonb,'""'::jsonb) and to_jsonb(l)->x.key is distinct from x.value) then raise exception 'Existing loan value changed'; end if;
  if exists(select 1 from history_before_contacts b join public.contacts c using(id),lateral unnest(array['stage','last_touch_at','email_opt_out','do_not_call']) k where to_jsonb(c)->k is distinct from b.row_data->k) then raise exception 'Contact workflow state changed'; end if;
  if exists((select * from history_before_other except select 'drip',to_jsonb(d) from public.drip_enrollments d except select 'comp',to_jsonb(c) from public.loan_compensation c) union all (select 'drip',to_jsonb(d) from public.drip_enrollments d union all select 'comp',to_jsonb(c) from public.loan_compensation c except select * from history_before_other)) then raise exception 'Drip or compensation records changed'; end if;
  for tr in select * from history_triggers where tgenabled<>'D' loop execute format('alter table public.%I %s trigger %I',tr.tbl,case tr.tgenabled when 'A' then 'enable always' when 'R' then 'enable replica' else 'enable' end,tr.tgname); end loop;
  if dry_run then raise exception using errcode='P0002',message='Dry run complete'; end if;
  return report||jsonb_build_object('dry_run',false,'preservation_checks','passed');
 exception when sqlstate 'P0002' then
  return report||jsonb_build_object('dry_run',true,'rolled_back',true,'preservation_checks','passed');
 end;
end $$;
revoke all on function public.import_jungo_history_once(jsonb,boolean) from public,anon,authenticated;
grant execute on function public.import_jungo_history_once(jsonb,boolean) to service_role;
