# Schema Audit — LoanOS Supabase
**Date:** 2026-03-16
**Project:** uuqedsvjlkeszrbwzizl

## Auth Model
- Uses **Supabase Auth** (`auth.users`) — no separate profiles/users table
- All data tables scope via `user_id UUID REFERENCES auth.users(id)`
- RLS enabled on all tables — policies enforce `auth.uid() = user_id`
- Service role key bypasses RLS (used by n8n webhooks)

## Tables (Public Schema)

| Table | Rows | RLS | Purpose |
|-------|------|-----|---------|
| contacts | 2,314 | ✅ | Borrowers, realtors, other contacts |
| loans | 819 | ✅ | Loan pipeline — all stages |
| activity_log | 45 | ✅ | Communication log (calls, emails, texts) |
| documents | 15 | ✅ | File attachments linked to loans/contacts |
| chat_sessions | 10 | ✅ | AI chat history per record |
| scenarios | 3 | ✅ | Mortgage Coach-style loan comparisons |
| todo_items | 0 | ✅ | User task list |
| email_drafts | 0 | ✅ | Queued email drafts from automations |
| user_settings | 0 | ✅ | Per-user app settings (JSON) |
| mcc_state | 0 | ✅ | Mortgage Coach Calculator state |
| loan_milestone_events | 1 | ✅ | Milestone webhook events from Arive |
| milestone_communications | 0 | ✅ | Auto-generated comms from milestones |
| loan_status_history | 0 | ✅ | Status change audit trail |
| automation_logs | 0 | ✅ | Automation execution log |
| outlook_tokens | 0 | ✅ | OAuth tokens for Outlook integration |
| oauth_state | 16 | ✅ | CSRF state for OAuth flows |

## Key Columns for Seeding

### contacts
- `id` UUID PK (auto)
- `user_id` UUID NOT NULL → auth.users
- `first_name` TEXT NOT NULL, `last_name` TEXT NOT NULL
- `email` TEXT UNIQUE (nullable)
- `phone` TEXT, `phone_mobile` TEXT
- `contact_type` TEXT CHECK (`borrower`, `realtor`, `other`)
- `group_tag` TEXT DEFAULT 'Client'
- `stage` TEXT DEFAULT 'Lead'
- `source` TEXT, `lead_source` TEXT
- `company_name` TEXT, `title` TEXT
- `notes` TEXT

### loans
- `id` UUID PK (auto)
- `user_id` UUID NOT NULL → auth.users
- `contact_id` UUID → contacts (FK)
- `status` TEXT DEFAULT 'lead' — maps to pipeline stages via STAGE_MAP
- `loan_amount` NUMERIC, `purchase_price` NUMERIC
- `loan_type` TEXT, `loan_purpose` TEXT
- `interest_rate` NUMERIC
- `property_address` TEXT, `property_city` TEXT, `property_state` TEXT, `property_zip` TEXT
- `borrower_first_name` TEXT, `borrower_last_name` TEXT, `borrower_email` TEXT, `borrower_phone` TEXT
- `referring_agent_name` TEXT, `referring_agent_email` TEXT, `referring_agent_phone` TEXT
- `buyer_agent_contact_id` UUID → contacts
- `commission_amount` DECIMAL(10,2)
- `closing_date` DATE, `funding_date` DATE
- `notes` TEXT
- `loan_name` TEXT (display name)

### activity_log
- `id` UUID PK (auto)
- `user_id` UUID → auth.users
- `loan_id` UUID → loans, `contact_id` UUID → contacts
- `action` TEXT NOT NULL (e.g., 'communication.logged')
- `type` TEXT (e.g., 'Call', 'Email', 'Text')
- `summary` TEXT (description)
- `entity_type` TEXT, `entity_id` UUID
- `created_at` TIMESTAMPTZ DEFAULT now()

## Status → Pipeline Stage Mapping (from dashboard page.tsx)

| DB status value | Dashboard Stage |
|----------------|-----------------|
| `lead` | Pre-Approval |
| `pre_approved` | Pre-Approval |
| `application_intake` | Pre-Approval |
| `started`, `qualification` | Pre-Approval |
| `processing`, `in process` | Processing |
| `underwriting`, `submitted_to_uw` | Underwriting |
| `conditional_approval`, `approved` | Underwriting |
| `clear_to_close`, `ctc`, `closing` | Clear to Close |
| `funded`, `closed` | Funded |
| `cancelled`, `dead`, `denied` | Cancelled |

## Constraints to Watch
- `contacts.email` has UNIQUE constraint — no duplicate emails
- `loans.arive_loan_id` has UNIQUE constraint — leave NULL for test data
- `contacts.contact_type` CHECK: must be `borrower`, `realtor`, or `other`
- `contacts.first_name` and `last_name` are NOT NULL
- `loans.user_id` and `contacts.user_id` are NOT NULL
