-- ================================================================
-- Migration 018: Scenarios table for AI Scenario Builder
-- Sprint 2: Mortgage Coach replacement feature
-- ================================================================

create table if not exists scenarios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  org_id uuid, -- multi-tenant prep (nullable for now)
  scenario_type text not null check (scenario_type in ('purchase', 'refinance')),
  borrower_name text,
  property_address text,
  property_value numeric,
  current_loan_data jsonb, -- for refi: original amount, rate, term, start date, debts, etc.
  scenarios_data jsonb not null, -- array of scenario objects with all inputs + calculated results
  narrative text,
  narrative_edited boolean default false,
  reinvestment_data jsonb, -- return rate, horizon, result
  pdf_url text,
  share_token uuid default gen_random_uuid(),
  share_expires_at timestamptz default (now() + interval '90 days'),
  view_count integer default 0,
  source text default 'manual' check (source in ('manual', 'mismo_import', 'arive_sync')),
  mismo_file_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index if not exists idx_scenarios_user on scenarios(user_id, created_at desc);
create index if not exists idx_scenarios_org on scenarios(org_id, created_at desc);
create unique index if not exists idx_scenarios_share on scenarios(share_token);

-- Row Level Security
alter table scenarios enable row level security;

create policy "Users see own scenarios" on scenarios
  for select using (auth.uid() = user_id);

create policy "Users create own scenarios" on scenarios
  for insert with check (auth.uid() = user_id);

create policy "Users update own scenarios" on scenarios
  for update using (auth.uid() = user_id);

create policy "Users delete own scenarios" on scenarios
  for delete using (auth.uid() = user_id);

-- Auto-update updated_at trigger (reuse existing function if available)
create or replace function update_scenarios_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger scenarios_updated_at
  before update on scenarios
  for each row execute function update_scenarios_updated_at();
