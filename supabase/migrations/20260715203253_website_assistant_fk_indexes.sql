create index if not exists website_conversations_contact_idx
  on public.website_conversations (contact_id)
  where contact_id is not null;

create index if not exists website_messages_organization_idx
  on public.website_conversation_messages (organization_id);

create index if not exists website_consents_organization_idx
  on public.website_consents (organization_id);

create index if not exists website_consents_contact_idx
  on public.website_consents (contact_id)
  where contact_id is not null;

create index if not exists website_escalations_conversation_idx
  on public.website_escalations (conversation_id);

create index if not exists website_escalations_contact_idx
  on public.website_escalations (contact_id)
  where contact_id is not null;

create index if not exists website_escalations_task_idx
  on public.website_escalations (task_id)
  where task_id is not null;

create index if not exists ai_action_audit_conversation_idx
  on public.ai_action_audit (conversation_id)
  where conversation_id is not null;

create index if not exists ai_action_audit_contact_idx
  on public.ai_action_audit (contact_id)
  where contact_id is not null;
