-- Preserve each imported source row and its reviewed destination without
-- treating an ambiguous spreadsheet row as a new borrower or transaction.
create table public.historical_import_records (
  organization_id uuid not null references public.organizations(id),
  source_key text not null,
  entity_type text not null check(entity_type in ('contact','loan')),
  external_id text not null,
  contact_id uuid references public.contacts(id) on delete set null,
  loan_id uuid references public.loans(id) on delete set null,
  disposition text not null check(disposition in ('matched','created','review','excluded')),
  reason text not null,
  source_filename text not null,
  source_sha256 text not null,
  payload_cipher jsonb not null,
  captured_at timestamptz not null default now(),
  primary key(organization_id,source_key,entity_type,external_id),
  check((entity_type='contact' and loan_id is null) or (entity_type='loan' and contact_id is null))
);
alter table public.historical_import_records enable row level security;
create policy organization_read on public.historical_import_records for select to authenticated
  using(organization_id=public.get_my_organization_id());
revoke all on public.historical_import_records from public,anon,authenticated;
grant select(organization_id,source_key,entity_type,external_id,contact_id,loan_id,disposition,reason,source_filename,source_sha256,captured_at)
  on public.historical_import_records to authenticated;
grant all on public.historical_import_records to service_role;
