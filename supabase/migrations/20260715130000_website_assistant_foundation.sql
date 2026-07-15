-- Website AI assistant foundation.
-- Additive migration: existing lead, task, and internal-agent paths remain unchanged.

create extension if not exists pgcrypto;

alter table public.contacts
  add column if not exists email_normalized text,
  add column if not exists phone_e164 text,
  add column if not exists normalization_version smallint not null default 1;

update public.contacts
set email_normalized = lower(btrim(email))
where email is not null
  and email_normalized is null;

update public.contacts
set phone_e164 = case
  when regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g') ~ '^1[0-9]{10}$'
    then '+' || regexp_replace(phone, '[^0-9]', '', 'g')
  when regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g') ~ '^[0-9]{10}$'
    then '+1' || regexp_replace(phone, '[^0-9]', '', 'g')
  else null
end
where phone is not null
  and phone_e164 is null;

-- Non-unique indexes are safe to add before existing duplicate records are reviewed.
-- The transactional RPC below takes deterministic advisory locks, so concurrent
-- website submissions cannot create a new duplicate through this path.
create index if not exists contacts_org_email_normalized_idx
  on public.contacts (organization_id, email_normalized)
  where email_normalized is not null;

create index if not exists contacts_org_phone_e164_idx
  on public.contacts (organization_id, phone_e164)
  where phone_e164 is not null;

create table if not exists public.website_conversations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  public_session_hash text not null,
  status text not null default 'open' check (status in ('open', 'escalated', 'closed', 'expired')),
  lead_intent text,
  lead_score smallint check (lead_score between 0 and 100),
  lead_score_basis jsonb not null default '[]'::jsonb,
  summary text,
  next_action text,
  escalation_reason text,
  escalation_status text,
  application_sent_at timestamptz,
  call_scheduled_at timestamptz,
  knowledge_version text,
  retention_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz,
  unique (organization_id, public_session_hash)
);

create table if not exists public.website_conversation_messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  conversation_id uuid not null references public.website_conversations(id) on delete cascade,
  sequence_number integer not null check (sequence_number > 0),
  role text not null check (role in ('visitor', 'assistant', 'system')),
  redacted_text text not null,
  policy_outcome jsonb not null default '{}'::jsonb,
  source_refs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (conversation_id, sequence_number)
);

create table if not exists public.website_consents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  conversation_id uuid not null references public.website_conversations(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  consent_type text not null,
  status text not null check (status in ('granted', 'denied', 'withdrawn', 'not_requested')),
  wording_hash text,
  policy_version text not null,
  source text not null default 'website_chat',
  consented_at timestamptz,
  created_at timestamptz not null default now(),
  unique (conversation_id, consent_type, policy_version)
);

create table if not exists public.website_escalations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  conversation_id uuid not null references public.website_conversations(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  task_id uuid references public.todo_items(id) on delete set null,
  reason text not null,
  safe_summary text not null,
  status text not null default 'open' check (status in ('open', 'acknowledged', 'resolved', 'failed')),
  intended_owner text not null default 'adam',
  created_at timestamptz not null default now(),
  acknowledged_at timestamptz,
  resolved_at timestamptz
);

create table if not exists public.ai_action_audit (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  conversation_id uuid references public.website_conversations(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  action text not null,
  outcome text not null,
  correlation_id text not null,
  model_request_id text,
  tool_invocation_id text,
  idempotency_key text,
  redacted_input jsonb not null default '{}'::jsonb,
  redacted_output jsonb not null default '{}'::jsonb,
  policy_outcome jsonb not null default '{}'::jsonb,
  retention_expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.website_service_nonces (
  key_id text not null,
  nonce text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  primary key (key_id, nonce)
);

create unique index if not exists ai_action_audit_org_idempotency_idx
  on public.ai_action_audit (organization_id, idempotency_key)
  where idempotency_key is not null;

create unique index if not exists todo_items_website_assistant_source_key_idx
  on public.todo_items (organization_id, source_key)
  where source = 'website_assistant' and source_key is not null;

create index if not exists website_messages_conversation_created_idx
  on public.website_conversation_messages (conversation_id, created_at);

create index if not exists website_escalations_status_idx
  on public.website_escalations (organization_id, status, created_at desc);

alter table public.website_conversations enable row level security;
alter table public.website_conversation_messages enable row level security;
alter table public.website_consents enable row level security;
alter table public.website_escalations enable row level security;
alter table public.ai_action_audit enable row level security;
alter table public.website_service_nonces enable row level security;

-- Public and normal authenticated clients receive no direct access. The service
-- role used by the scoped LoanOS API bypasses RLS.
create policy "website_conversations_deny_direct" on public.website_conversations
  for all using (false) with check (false);
create policy "website_messages_deny_direct" on public.website_conversation_messages
  for all using (false) with check (false);
create policy "website_consents_deny_direct" on public.website_consents
  for all using (false) with check (false);
create policy "website_escalations_deny_direct" on public.website_escalations
  for all using (false) with check (false);
create policy "ai_action_audit_deny_direct" on public.ai_action_audit
  for all using (false) with check (false);
create policy "website_service_nonces_deny_direct" on public.website_service_nonces
  for all using (false) with check (false);

create or replace function public.upsert_website_assistant_lead(
  p_organization_id uuid,
  p_user_id uuid,
  p_first_name text,
  p_last_name text,
  p_email text,
  p_email_normalized text,
  p_phone text,
  p_phone_e164 text,
  p_lead_intent text,
  p_timeline text,
  p_source_page text,
  p_conversation_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email_contact public.contacts%rowtype;
  v_phone_contact public.contacts%rowtype;
  v_contact public.contacts%rowtype;
  v_lock_keys bigint[] := array[]::bigint[];
  v_lock_key bigint;
begin
  if p_email_normalized is null and p_phone_e164 is null then
    raise exception 'A normalized email or phone is required';
  end if;

  if p_email_normalized is not null then
    v_lock_keys := array_append(v_lock_keys, hashtextextended(p_organization_id::text || ':email:' || p_email_normalized, 0));
  end if;
  if p_phone_e164 is not null then
    v_lock_keys := array_append(v_lock_keys, hashtextextended(p_organization_id::text || ':phone:' || p_phone_e164, 0));
  end if;
  v_lock_keys := array(select k from unnest(v_lock_keys) k order by k);
  foreach v_lock_key in array v_lock_keys
  loop
    perform pg_advisory_xact_lock(v_lock_key);
  end loop;

  if p_email_normalized is not null then
    select * into v_email_contact from public.contacts
    where organization_id = p_organization_id and email_normalized = p_email_normalized
    order by created_at asc limit 1;
  end if;
  if p_phone_e164 is not null then
    select * into v_phone_contact from public.contacts
    where organization_id = p_organization_id and phone_e164 = p_phone_e164
    order by created_at asc limit 1;
  end if;

  if v_email_contact.id is not null and v_phone_contact.id is not null
     and v_email_contact.id <> v_phone_contact.id then
    return jsonb_build_object(
      'status', 'conflict',
      'email_contact_id', v_email_contact.id,
      'phone_contact_id', v_phone_contact.id
    );
  end if;

  if v_email_contact.id is not null then
    v_contact := v_email_contact;
  elsif v_phone_contact.id is not null then
    v_contact := v_phone_contact;
  end if;
  if v_contact.id is not null then
    update public.contacts set
      last_touch_at = now(),
      source_page = coalesce(public.contacts.source_page, p_source_page),
      email_normalized = coalesce(public.contacts.email_normalized, p_email_normalized),
      phone_e164 = coalesce(public.contacts.phone_e164, p_phone_e164),
      updated_at = now()
    where id = v_contact.id
    returning * into v_contact;

    if p_conversation_id is not null then
      update public.website_conversations set contact_id = v_contact.id, updated_at = now()
      where id = p_conversation_id and organization_id = p_organization_id;
    end if;
    return jsonb_build_object('status', 'existing', 'contact_id', v_contact.id);
  end if;

  insert into public.contacts (
    organization_id, user_id, first_name, last_name, email, email_normalized,
    phone, phone_e164, stage, contact_type, lead_source, referral_type,
    source_page, notes, last_touch_at
  ) values (
    p_organization_id, p_user_id, p_first_name, coalesce(p_last_name, ''), p_email,
    p_email_normalized, p_phone, p_phone_e164, 'Lead', 'borrower', 'Website AI Assistant',
    'web_lead', p_source_page,
    concat_ws(E'\n', '[Website AI Assistant]',
      case when p_lead_intent is not null then 'Intent: ' || p_lead_intent end,
      case when p_timeline is not null then 'Timeline: ' || p_timeline end),
    now()
  ) returning * into v_contact;

  if p_conversation_id is not null then
    update public.website_conversations set contact_id = v_contact.id, updated_at = now()
    where id = p_conversation_id and organization_id = p_organization_id;
  end if;

  return jsonb_build_object('status', 'created', 'contact_id', v_contact.id);
end;
$$;

revoke all on function public.upsert_website_assistant_lead(uuid, uuid, text, text, text, text, text, text, text, text, text, uuid) from public, anon, authenticated;
grant execute on function public.upsert_website_assistant_lead(uuid, uuid, text, text, text, text, text, text, text, text, text, uuid) to service_role;

comment on table public.website_conversations is 'Redacted public website assistant sessions; no raw prohibited sensitive data.';
comment on table public.ai_action_audit is 'Operational AI/tool audit only. Never store chain-of-thought or prohibited sensitive data.';

-- Rollback (only before assistant data is relied upon):
-- drop function public.upsert_website_assistant_lead(uuid, uuid, text, text, text, text, text, text, text, text, text, uuid);
-- drop table public.website_service_nonces, public.ai_action_audit, public.website_escalations, public.website_consents,
--   public.website_conversation_messages, public.website_conversations;
-- drop index public.todo_items_website_assistant_source_key_idx;
-- drop index public.contacts_org_phone_e164_idx;
-- drop index public.contacts_org_email_normalized_idx;
-- alter table public.contacts drop column phone_e164, drop column email_normalized, drop column normalization_version;
