-- Create todo_items table for dashboard to-do list
create table if not exists public.todo_items (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade,
  text text not null,
  is_complete boolean not null default false,
  is_urgent boolean not null default false,
  completed_at timestamptz,
  related_loan_id uuid references public.loans(id) on delete set null,
  related_contact_id uuid references public.contacts(id) on delete set null
);

-- Enable RLS
alter table public.todo_items enable row level security;

-- Users can only access their own todos
create policy "Users can manage their own todos"
  on public.todo_items
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Index for fast user queries
create index if not exists todo_items_user_id_idx on public.todo_items(user_id);
create index if not exists todo_items_is_complete_idx on public.todo_items(user_id, is_complete);

-- Auto-update updated_at
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_todo_items_updated_at
  before update on public.todo_items
  for each row execute function public.update_updated_at_column();
