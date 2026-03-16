-- Permanent audit log for all automation-generated emails.
-- Separate from email_drafts (operational draft tracking).
-- Populated by logEmail() called from every automation route.

create table if not exists contact_emails (
  id              uuid primary key default gen_random_uuid(),
  contact_id      uuid references contacts(id) on delete cascade,
  loan_id         uuid references loans(id) on delete set null,
  subject         text not null,
  body_html       text,
  body_text       text,
  sent_at         timestamptz default now(),
  automation_source text, -- 'milestone', 'pre_approval', 'contract_intake', 'cd_email',
                          -- 'new_application', 'referral_intro', 'refi_intake',
                          -- 'review_request', 'rate_update'
  direction       text default 'outbound', -- outbound only for now
  created_at      timestamptz default now()
);

create index if not exists contact_emails_contact_id_idx on contact_emails(contact_id);
create index if not exists contact_emails_loan_id_idx    on contact_emails(loan_id);
create index if not exists contact_emails_sent_at_idx    on contact_emails(sent_at desc);

-- RLS: service role only (same pattern as email_drafts)
alter table contact_emails enable row level security;

create policy "service role full access" on contact_emails
  using (true)
  with check (true);
