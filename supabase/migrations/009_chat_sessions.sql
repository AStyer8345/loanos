-- Chat sessions for AI assistant conversations per record
create table if not exists public.chat_sessions (
  id uuid default gen_random_uuid() primary key,
  record_id text not null,
  record_type text not null check (record_type in ('contact', 'loan')),
  messages jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for fast lookup by record
create index if not exists chat_sessions_record_idx
  on public.chat_sessions (record_id, record_type);

-- RLS
alter table public.chat_sessions enable row level security;

create policy "Users can manage their own chat sessions"
  on public.chat_sessions
  for all
  using (true)
  with check (true);

-- Auto-update updated_at on row change
create or replace function public.handle_chat_session_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

create trigger chat_sessions_updated_at
  before update on public.chat_sessions
  for each row
  execute function public.handle_chat_session_updated_at();
