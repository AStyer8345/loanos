-- Migration 057: waitlist_signups table
-- Personal admin table — not org-scoped, no RLS
-- Only accessible via service role key or from Adam's waitlist dashboard page

create table if not exists waitlist_signups (
  id               uuid        default gen_random_uuid() primary key,
  name             text        not null,
  email            text        not null unique,
  company          text,
  source           text        not null default 'marketing-site',
  mailchimp_status text        not null default 'pending',
  notes            text,
  created_at       timestamptz not null default now()
);

-- No RLS — this table is personal admin data, accessed only via service role
-- or the gated /dashboard/waitlist page (server-side auth check)
alter table waitlist_signups disable row level security;
