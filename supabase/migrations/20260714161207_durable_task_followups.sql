-- Turn the existing dashboard todo list into a durable, reviewable task queue.
-- Existing rows remain open, medium-priority, one-off tasks.

alter table public.todo_items
  add column if not exists title text,
  add column if not exists description text,
  add column if not exists status text not null default 'open',
  add column if not exists priority text not null default 'medium',
  add column if not exists due_at timestamptz,
  add column if not exists reminder_at timestamptz,
  add column if not exists snoozed_until timestamptz,
  add column if not exists assigned_to uuid references auth.users(id) on delete set null,
  add column if not exists follow_up_reason text,
  add column if not exists recurrence_rule text,
  add column if not exists source text not null default 'manual',
  add column if not exists source_key text,
  add column if not exists dismissed_at timestamptz;

update public.todo_items
set title = text
where title is null;

alter table public.todo_items
  alter column title set not null;

alter table public.todo_items
  drop constraint if exists todo_items_status_check,
  add constraint todo_items_status_check
    check (status in ('open', 'in_progress', 'completed', 'dismissed')),
  drop constraint if exists todo_items_priority_check,
  add constraint todo_items_priority_check
    check (priority in ('low', 'medium', 'high', 'urgent')),
  drop constraint if exists todo_items_source_check,
  add constraint todo_items_source_check
    check (source in ('manual', 'follow_up_rule', 'automation', 'ai_suggestion', 'import')),
  drop constraint if exists todo_items_recurrence_rule_check,
  add constraint todo_items_recurrence_rule_check
    check (recurrence_rule is null or recurrence_rule in ('daily', 'weekly', 'monthly', 'yearly'));

-- Keep legacy completion fields and the explicit status in sync.
create or replace function public.sync_todo_item_status()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Preserve compatibility with existing agent/database writers that only
  -- know about the legacy `text` column.
  new.title := coalesce(nullif(trim(new.title), ''), new.text);
  new.text := coalesce(nullif(trim(new.text), ''), new.title);
  if new.is_complete and (tg_op = 'INSERT' or not old.is_complete) then
    new.status := 'completed';
    new.completed_at := coalesce(new.completed_at, now());
  elsif new.status = 'completed' then
    new.is_complete := true;
    new.completed_at := coalesce(new.completed_at, now());
  elsif new.status = 'dismissed' then
    new.is_complete := false;
    new.dismissed_at := coalesce(new.dismissed_at, now());
    new.completed_at := null;
  else
    new.is_complete := false;
    new.completed_at := null;
    new.dismissed_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists sync_todo_item_status on public.todo_items;
create trigger sync_todo_item_status
  before insert or update on public.todo_items
  for each row execute function public.sync_todo_item_status();

create index if not exists todo_items_org_open_due_idx
  on public.todo_items (organization_id, status, due_at)
  where status in ('open', 'in_progress');

create index if not exists todo_items_assigned_open_due_idx
  on public.todo_items (assigned_to, status, due_at)
  where status in ('open', 'in_progress');

-- A deterministic source key makes rule/job retries idempotent without
-- preventing separate manual tasks for the same record.
create unique index if not exists todo_items_org_source_key_unique
  on public.todo_items (organization_id, source_key)
  where source_key is not null and status in ('open', 'in_progress');
