alter table public.loans add column if not exists imported_history boolean not null default false;
comment on column public.loans.imported_history is 'A historical source import, not evidence of a currently active loan. Original recorded status remains intact.';
do $$ declare tr record; begin
 lock table public.loans in access exclusive mode;
 create temp table marker_triggers on commit drop as select t.tgname,t.tgenabled from pg_trigger t where t.tgrelid='public.loans'::regclass and not t.tgisinternal and t.tgname in ('capture_arive_facts','fill_contact_from_loan_sync','loan_evidence_milestones','loan_insert_sync_contact','loan_stage_sync_contact','loans_update_contact_last_touch','trg_loan_created_cancel_drip','trg_loans_autocreate_comp','trg_loans_fill_contact_blanks');
 for tr in select * from marker_triggers where tgenabled<>'D' loop execute format('alter table public.loans disable trigger %I',tr.tgname); end loop;
 update public.loans l set imported_history=true where organization_id='18613f82-fdd9-42dd-a09e-f3c577328258' and not imported_history and exists(select 1 from public.historical_import_records h where h.organization_id=l.organization_id and h.source_key='jungo_master_2026_09_02' and h.entity_type='loan' and h.disposition='created' and h.loan_id=l.id);
 for tr in select * from marker_triggers where tgenabled<>'D' loop execute format('alter table public.loans %s trigger %I',case tr.tgenabled when 'A' then 'enable always' when 'R' then 'enable replica' else 'enable' end,tr.tgname); end loop;
end $$;
