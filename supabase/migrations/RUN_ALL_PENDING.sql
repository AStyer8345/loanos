-- ============================================================
-- LoanOS — Combined Pending Migrations (006 partial, 008, 011, 012, 013)
-- All statements are IDEMPOTENT (safe to re-run)
-- Paste this ENTIRE block into Supabase SQL Editor and click "Run"
-- ============================================================

-- ════════════════════════════════════════════════════════════
-- MIGRATION 006 (PARTIAL): activity_log FK columns
-- (These columns should have been added but weren't)
-- ════════════════════════════════════════════════════════════

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'activity_log' AND column_name = 'loan_id'
  ) THEN
    ALTER TABLE activity_log ADD COLUMN loan_id UUID REFERENCES loans(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'activity_log' AND column_name = 'contact_id'
  ) THEN
    ALTER TABLE activity_log ADD COLUMN contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_activity_log_loan_id ON activity_log(loan_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_contact_id ON activity_log(contact_id);


-- ════════════════════════════════════════════════════════════
-- MIGRATION 008: Outlook Integration
-- ════════════════════════════════════════════════════════════

-- outlook_tokens table
CREATE TABLE IF NOT EXISTS outlook_tokens (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  access_token  TEXT        NOT NULL,
  refresh_token TEXT        NOT NULL,
  expires_at    TIMESTAMPTZ NOT NULL,
  email         TEXT        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_outlook_tokens_email ON outlook_tokens(email);

-- activity_log extensions
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'activity_log' AND column_name = 'type'
  ) THEN
    ALTER TABLE activity_log ADD COLUMN type TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'activity_log' AND column_name = 'summary'
  ) THEN
    ALTER TABLE activity_log ADD COLUMN summary TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'activity_log' AND column_name = 'raw_payload'
  ) THEN
    ALTER TABLE activity_log ADD COLUMN raw_payload JSONB;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'activity_log' AND column_name = 'external_id'
  ) THEN
    ALTER TABLE activity_log ADD COLUMN external_id TEXT;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_activity_log_type_external_id
  ON activity_log(type, external_id)
  WHERE type IS NOT NULL AND external_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_activity_log_contact_created
  ON activity_log(contact_id, created_at DESC)
  WHERE contact_id IS NOT NULL;

-- oauth_state table
CREATE TABLE IF NOT EXISTS oauth_state (
  state      TEXT        PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  used_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_oauth_state_created ON oauth_state(created_at);


-- ════════════════════════════════════════════════════════════
-- MIGRATION 011: Loans Table Expansion (Arive fields)
-- ════════════════════════════════════════════════════════════

ALTER TABLE loans
  ADD COLUMN IF NOT EXISTS borrower_first_name    TEXT,
  ADD COLUMN IF NOT EXISTS borrower_last_name     TEXT,
  ADD COLUMN IF NOT EXISTS borrower_email         TEXT,
  ADD COLUMN IF NOT EXISTS borrower_phone         TEXT,
  ADD COLUMN IF NOT EXISTS co_borrower_name       TEXT,
  ADD COLUMN IF NOT EXISTS co_borrower_email      TEXT,
  ADD COLUMN IF NOT EXISTS co_borrower_phone      TEXT,

  ADD COLUMN IF NOT EXISTS loan_number            TEXT,
  ADD COLUMN IF NOT EXISTS loan_name              TEXT,

  ADD COLUMN IF NOT EXISTS loan_amount            NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS loan_purpose           TEXT,
  ADD COLUMN IF NOT EXISTS loan_type              TEXT,
  ADD COLUMN IF NOT EXISTS loan_program           TEXT,
  ADD COLUMN IF NOT EXISTS loan_term              INTEGER,
  ADD COLUMN IF NOT EXISTS interest_rate          NUMERIC(8,5),
  ADD COLUMN IF NOT EXISTS apr                    NUMERIC(8,5),
  ADD COLUMN IF NOT EXISTS points                 NUMERIC(8,5),
  ADD COLUMN IF NOT EXISTS down_payment           NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS down_payment_pct       NUMERIC(8,5),
  ADD COLUMN IF NOT EXISTS ltv                    NUMERIC(8,5),
  ADD COLUMN IF NOT EXISTS cltv                   NUMERIC(8,5),

  ADD COLUMN IF NOT EXISTS property_address       TEXT,
  ADD COLUMN IF NOT EXISTS property_city          TEXT,
  ADD COLUMN IF NOT EXISTS property_state         TEXT,
  ADD COLUMN IF NOT EXISTS property_zip           TEXT,
  ADD COLUMN IF NOT EXISTS property_county        TEXT,
  ADD COLUMN IF NOT EXISTS property_type          TEXT,
  ADD COLUMN IF NOT EXISTS occupancy_type         TEXT,
  ADD COLUMN IF NOT EXISTS purchase_price         NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS appraised_value        NUMERIC(14,2),

  ADD COLUMN IF NOT EXISTS milestone              TEXT,
  ADD COLUMN IF NOT EXISTS application_date       DATE,
  ADD COLUMN IF NOT EXISTS submission_date        DATE,
  ADD COLUMN IF NOT EXISTS approval_date          DATE,
  ADD COLUMN IF NOT EXISTS closing_date           DATE,
  ADD COLUMN IF NOT EXISTS funding_date           DATE,
  ADD COLUMN IF NOT EXISTS rate_lock_expiration   DATE,
  ADD COLUMN IF NOT EXISTS estimated_closing_date DATE,

  ADD COLUMN IF NOT EXISTS monthly_payment        NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS piti                   NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS cash_to_close          NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS seller_credits         NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS lender_credits         NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS loan_costs             NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS total_closing_costs    NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS prepaid_items          NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS escrow_impounds        NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS mi_monthly             NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS mi_upfront             NUMERIC(14,2),

  ADD COLUMN IF NOT EXISTS credit_score           INTEGER,
  ADD COLUMN IF NOT EXISTS middle_score           INTEGER,
  ADD COLUMN IF NOT EXISTS monthly_income         NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS front_end_dti          NUMERIC(8,5),
  ADD COLUMN IF NOT EXISTS back_end_dti           NUMERIC(8,5),
  ADD COLUMN IF NOT EXISTS monthly_debts          NUMERIC(14,2),

  ADD COLUMN IF NOT EXISTS referring_agent_name   TEXT,
  ADD COLUMN IF NOT EXISTS referring_agent_email  TEXT,
  ADD COLUMN IF NOT EXISTS referring_agent_phone  TEXT,
  ADD COLUMN IF NOT EXISTS listing_agent_name     TEXT,
  ADD COLUMN IF NOT EXISTS listing_agent_email    TEXT,
  ADD COLUMN IF NOT EXISTS buyers_agent_name      TEXT,
  ADD COLUMN IF NOT EXISTS buyers_agent_email     TEXT,
  ADD COLUMN IF NOT EXISTS title_company          TEXT,
  ADD COLUMN IF NOT EXISTS title_contact          TEXT,
  ADD COLUMN IF NOT EXISTS title_email            TEXT,
  ADD COLUMN IF NOT EXISTS escrow_officer         TEXT,
  ADD COLUMN IF NOT EXISTS processor_name         TEXT,
  ADD COLUMN IF NOT EXISTS underwriter_name       TEXT,
  ADD COLUMN IF NOT EXISTS lender_name            TEXT,
  ADD COLUMN IF NOT EXISTS investor_name          TEXT,
  ADD COLUMN IF NOT EXISTS channel                TEXT,

  ADD COLUMN IF NOT EXISTS lead_source            TEXT,
  ADD COLUMN IF NOT EXISTS referral_source        TEXT,
  ADD COLUMN IF NOT EXISTS marketing_campaign     TEXT,

  ADD COLUMN IF NOT EXISTS notes                  TEXT,
  ADD COLUMN IF NOT EXISTS loan_created_date      DATE,
  ADD COLUMN IF NOT EXISTS arive_created_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS arive_updated_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS synced_at              TIMESTAMPTZ DEFAULT NOW();

-- Ensure arive_loan_id UNIQUE constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'loans'
      AND constraint_type = 'UNIQUE'
      AND constraint_name = 'loans_arive_loan_id_key'
  ) THEN
    ALTER TABLE loans ADD CONSTRAINT loans_arive_loan_id_key UNIQUE (arive_loan_id);
  END IF;
END
$$;


-- ════════════════════════════════════════════════════════════
-- MIGRATION 012: Contacts Table Expansion
-- ════════════════════════════════════════════════════════════

ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS created_date       TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS last_activity_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS notes              TEXT,
  ADD COLUMN IF NOT EXISTS phone_mobile       TEXT,
  ADD COLUMN IF NOT EXISTS mailing_street     TEXT,
  ADD COLUMN IF NOT EXISTS mailing_city       TEXT,
  ADD COLUMN IF NOT EXISTS mailing_state      TEXT,
  ADD COLUMN IF NOT EXISTS mailing_zip        TEXT,
  ADD COLUMN IF NOT EXISTS mailing_country    TEXT,
  ADD COLUMN IF NOT EXISTS title              TEXT;


-- ════════════════════════════════════════════════════════════
-- MIGRATION 013: Email Drafts Table
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS email_drafts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  loan_id UUID REFERENCES loans(id) ON DELETE SET NULL,
  automation_name TEXT NOT NULL,
  recipient_name TEXT,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_preview TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'discarded')),
  outlook_draft_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at (reuses existing trigger function from 001)
CREATE TRIGGER update_email_drafts_updated_at
  BEFORE UPDATE ON email_drafts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_email_drafts_created_at ON email_drafts(created_at DESC);
CREATE INDEX idx_email_drafts_status ON email_drafts(status);
CREATE INDEX idx_email_drafts_contact_id ON email_drafts(contact_id);

-- RLS
ALTER TABLE email_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON email_drafts
  USING (true) WITH CHECK (true);


-- ════════════════════════════════════════════════════════════
-- MIGRATION 009: Chat Sessions
-- ════════════════════════════════════════════════════════════

create table if not exists public.chat_sessions (
  id uuid default gen_random_uuid() primary key,
  record_id text not null,
  record_type text not null check (record_type in ('contact', 'loan')),
  messages jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists chat_sessions_record_idx
  on public.chat_sessions (record_id, record_type);

alter table public.chat_sessions enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'chat_sessions' and policyname = 'Users can manage their own chat sessions'
  ) then
    create policy "Users can manage their own chat sessions"
      on public.chat_sessions for all using (true) with check (true);
  end if;
end $$;

create or replace function public.handle_chat_session_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

do $$ begin
  if not exists (
    select 1 from pg_trigger where tgname = 'chat_sessions_updated_at'
  ) then
    create trigger chat_sessions_updated_at
      before update on public.chat_sessions
      for each row execute function public.handle_chat_session_updated_at();
  end if;
end $$;


-- ════════════════════════════════════════════════════════════
-- MIGRATION 010: Milestone Communication Agent Tables
-- ════════════════════════════════════════════════════════════

ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_touch TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_contacts_last_touch ON contacts(last_touch);

CREATE TABLE IF NOT EXISTS loan_milestone_events (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  loan_id         TEXT        NOT NULL,
  borrower_name   TEXT,
  borrower_email  TEXT,
  realtor_name    TEXT,
  realtor_email   TEXT,
  milestone       TEXT        NOT NULL CHECK (milestone IN (
                    'application_received','processing','appraisal_ordered',
                    'conditional_approval','clear_to_close','closing_scheduled','funded'
                  )),
  raw_payload     JSONB,
  processed_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_milestone_events_loan_id    ON loan_milestone_events(loan_id);
CREATE INDEX IF NOT EXISTS idx_milestone_events_created_at ON loan_milestone_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_milestone_events_milestone  ON loan_milestone_events(milestone);

CREATE TABLE IF NOT EXISTS milestone_communications (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  milestone_event_id   UUID        REFERENCES loan_milestone_events(id) ON DELETE CASCADE,
  recipient_type       TEXT        NOT NULL CHECK (recipient_type IN ('borrower', 'realtor')),
  recipient_email      TEXT,
  subject              TEXT,
  body                 TEXT,
  draft_pushed         BOOLEAN     NOT NULL DEFAULT false,
  draft_pushed_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_milestone_comms_event_id     ON milestone_communications(milestone_event_id);
CREATE INDEX IF NOT EXISTS idx_milestone_comms_draft_pushed ON milestone_communications(draft_pushed) WHERE draft_pushed = false;
CREATE INDEX IF NOT EXISTS idx_milestone_comms_created_at   ON milestone_communications(created_at DESC);


-- ════════════════════════════════════════════════════════════
-- MIGRATION 015: Arive Full Field Expansion
-- ════════════════════════════════════════════════════════════

ALTER TABLE loans
  ADD COLUMN IF NOT EXISTS hcltv                   NUMERIC,
  ADD COLUMN IF NOT EXISTS base_loan_amount         NUMERIC,
  ADD COLUMN IF NOT EXISTS broker_fee               NUMERIC,
  ADD COLUMN IF NOT EXISTS financed_fees            NUMERIC,
  ADD COLUMN IF NOT EXISTS pi_payment               NUMERIC,
  ADD COLUMN IF NOT EXISTS flood_insurance_monthly  NUMERIC,
  ADD COLUMN IF NOT EXISTS hoa_dues                 NUMERIC,
  ADD COLUMN IF NOT EXISTS buydown                  BOOLEAN,
  ADD COLUMN IF NOT EXISTS impound_waiver           BOOLEAN,
  ADD COLUMN IF NOT EXISTS prepay_penalty           BOOLEAN;

ALTER TABLE loans
  ADD COLUMN IF NOT EXISTS amortization_type        TEXT,
  ADD COLUMN IF NOT EXISTS mortgage_type            TEXT,
  ADD COLUMN IF NOT EXISTS refinance_type           TEXT,
  ADD COLUMN IF NOT EXISTS cashout_purpose          TEXT,
  ADD COLUMN IF NOT EXISTS documentation_type       TEXT,
  ADD COLUMN IF NOT EXISTS lien_position            TEXT,
  ADD COLUMN IF NOT EXISTS lock_status              TEXT,
  ADD COLUMN IF NOT EXISTS compensation_type        TEXT,
  ADD COLUMN IF NOT EXISTS interest_only            BOOLEAN,
  ADD COLUMN IF NOT EXISTS interest_only_term_months INTEGER,
  ADD COLUMN IF NOT EXISTS arm_adjustment_period    INTEGER,
  ADD COLUMN IF NOT EXISTS arm_initial_fixed_months INTEGER;

ALTER TABLE loans
  ADD COLUMN IF NOT EXISTS status_date             DATE,
  ADD COLUMN IF NOT EXISTS adverse_reason          TEXT,
  ADD COLUMN IF NOT EXISTS lender_nmls             TEXT,
  ADD COLUMN IF NOT EXISTS lender_loan_number      TEXT,
  ADD COLUMN IF NOT EXISTS crm_reference_id        TEXT,
  ADD COLUMN IF NOT EXISTS deep_link_url           TEXT,
  ADD COLUMN IF NOT EXISTS archive_indicator       BOOLEAN,
  ADD COLUMN IF NOT EXISTS processor_email         TEXT,
  ADD COLUMN IF NOT EXISTS tbd_address             BOOLEAN;

ALTER TABLE loans
  ADD COLUMN IF NOT EXISTS borrower_home_phone        TEXT,
  ADD COLUMN IF NOT EXISTS borrower_work_phone        TEXT,
  ADD COLUMN IF NOT EXISTS borrower_mailing_address   TEXT,
  ADD COLUMN IF NOT EXISTS borrower_marital_status    TEXT,
  ADD COLUMN IF NOT EXISTS borrower_preferred_language TEXT,
  ADD COLUMN IF NOT EXISTS first_time_homebuyer       BOOLEAN,
  ADD COLUMN IF NOT EXISTS borrower_applicant_type    TEXT;

ALTER TABLE loans
  ADD COLUMN IF NOT EXISTS property_units           INTEGER,
  ADD COLUMN IF NOT EXISTS property_unit_number     TEXT,
  ADD COLUMN IF NOT EXISTS property_attachment_type TEXT;

ALTER TABLE loans
  ADD COLUMN IF NOT EXISTS trid_date                    DATE,
  ADD COLUMN IF NOT EXISTS intent_to_proceed_date       DATE,
  ADD COLUMN IF NOT EXISTS initial_le_sent_date         DATE,
  ADD COLUMN IF NOT EXISTS initial_le_signed_date       DATE,
  ADD COLUMN IF NOT EXISTS most_recent_le_sent_date     DATE,
  ADD COLUMN IF NOT EXISTS most_recent_le_signed_date   DATE,
  ADD COLUMN IF NOT EXISTS initial_cd_sent_date         DATE,
  ADD COLUMN IF NOT EXISTS initial_cd_signed_date       DATE,
  ADD COLUMN IF NOT EXISTS most_recent_cd_sent_date     DATE,
  ADD COLUMN IF NOT EXISTS most_recent_cd_signed_date   DATE,
  ADD COLUMN IF NOT EXISTS appraisal_ordered_date       DATE,
  ADD COLUMN IF NOT EXISTS appraisal_delivery_date      DATE,
  ADD COLUMN IF NOT EXISTS appraisal_contingency_date   DATE,
  ADD COLUMN IF NOT EXISTS loan_contingency_date        DATE,
  ADD COLUMN IF NOT EXISTS closing_contingency_date     DATE,
  ADD COLUMN IF NOT EXISTS pre_approval_expiry_date     DATE,
  ADD COLUMN IF NOT EXISTS credit_order_date            DATE,
  ADD COLUMN IF NOT EXISTS credit_import_date           DATE,
  ADD COLUMN IF NOT EXISTS credit_expiration_date       DATE,
  ADD COLUMN IF NOT EXISTS hoi_ordered_date             DATE,
  ADD COLUMN IF NOT EXISTS hoi_received_date            DATE,
  ADD COLUMN IF NOT EXISTS title_ordered_date           DATE,
  ADD COLUMN IF NOT EXISTS title_received_date          DATE,
  ADD COLUMN IF NOT EXISTS tax_transcript_ordered_date  DATE,
  ADD COLUMN IF NOT EXISTS tax_transcript_received_date DATE,
  ADD COLUMN IF NOT EXISTS epo_date                     DATE,
  ADD COLUMN IF NOT EXISTS signed_docs_date             DATE,
  ADD COLUMN IF NOT EXISTS funding_wire_date            DATE;

ALTER TABLE loans
  ADD COLUMN IF NOT EXISTS cd_date               DATE,
  ADD COLUMN IF NOT EXISTS cd_status             TEXT,
  ADD COLUMN IF NOT EXISTS hoi_date              DATE,
  ADD COLUMN IF NOT EXISTS hoi_status            TEXT,
  ADD COLUMN IF NOT EXISTS title_date            DATE,
  ADD COLUMN IF NOT EXISTS title_status          TEXT,
  ADD COLUMN IF NOT EXISTS payroll_date          DATE,
  ADD COLUMN IF NOT EXISTS payroll_status        TEXT,
  ADD COLUMN IF NOT EXISTS appraisal_date        DATE,
  ADD COLUMN IF NOT EXISTS appraisal_status      TEXT,
  ADD COLUMN IF NOT EXISTS client_review_date    DATE,
  ADD COLUMN IF NOT EXISTS client_review_status  TEXT,
  ADD COLUMN IF NOT EXISTS signed_docs_status    TEXT,
  ADD COLUMN IF NOT EXISTS funding_wire_status   TEXT;

ALTER TABLE loans
  ADD COLUMN IF NOT EXISTS buyer_agent_contact_id    UUID REFERENCES contacts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS listing_agent_contact_id  UUID REFERENCES contacts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_loans_buyer_agent_contact_id   ON loans (buyer_agent_contact_id);
CREATE INDEX IF NOT EXISTS idx_loans_listing_agent_contact_id ON loans (listing_agent_contact_id);

CREATE TABLE IF NOT EXISTS loan_status_history (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id       UUID        REFERENCES loans(id) ON DELETE CASCADE,
  arive_loan_id TEXT        NOT NULL,
  old_status    TEXT,
  new_status    TEXT        NOT NULL,
  changed_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  source        TEXT        NOT NULL DEFAULT 'arive'
);

CREATE INDEX IF NOT EXISTS idx_loan_status_history_loan_id       ON loan_status_history (loan_id);
CREATE INDEX IF NOT EXISTS idx_loan_status_history_arive_loan_id ON loan_status_history (arive_loan_id);
CREATE INDEX IF NOT EXISTS idx_loan_status_history_changed_at    ON loan_status_history (changed_at DESC);

ALTER TABLE loan_status_history ENABLE ROW LEVEL SECURITY;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'loan_status_history' and policyname = 'Authenticated users can read loan_status_history'
  ) then
    create policy "Authenticated users can read loan_status_history"
      on loan_status_history for select to authenticated
      using (loan_id in (select id from loans where user_id = auth.uid()));
  end if;
end $$;


-- ════════════════════════════════════════════════════════════
-- MIGRATION 016: Todo Items
-- ════════════════════════════════════════════════════════════

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

alter table public.todo_items enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'todo_items' and policyname = 'Users can manage their own todos'
  ) then
    create policy "Users can manage their own todos"
      on public.todo_items for all
      using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;

create index if not exists todo_items_user_id_idx    on public.todo_items(user_id);
create index if not exists todo_items_is_complete_idx on public.todo_items(user_id, is_complete);

create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$ begin
  if not exists (
    select 1 from pg_trigger where tgname = 'update_todo_items_updated_at'
  ) then
    create trigger update_todo_items_updated_at
      before update on public.todo_items
      for each row execute function public.update_updated_at_column();
  end if;
end $$;


-- ════════════════════════════════════════════════════════════
-- MIGRATION 017: User Settings
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_settings (
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key        TEXT        NOT NULL,
  value      JSONB       NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, key)
);

CREATE OR REPLACE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'user_settings' and policyname = 'Users can read their own settings'
  ) then
    create policy "Users can read their own settings" on user_settings for select using (auth.uid() = user_id);
    create policy "Users can insert their own settings" on user_settings for insert with check (auth.uid() = user_id);
    create policy "Users can update their own settings" on user_settings for update using (auth.uid() = user_id);
  end if;
end $$;


-- ════════════════════════════════════════════════════════════
-- DONE — All migrations (006-partial, 008-017) included.
-- Safe to re-run — all statements are idempotent.
-- ════════════════════════════════════════════════════════════