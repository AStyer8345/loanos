You are building an inbound email sync workflow for LoanOS.

## Objective

When a new email arrives in Adam's Outlook inbox:
- If sender matches a known contact → log to activity_log, attach to contact, update last_touch_at
- If sender is unknown but email looks transactional → log as unmatched for review
- Everything else → ignore, do not log

Realtors are contacts too. Log realtor emails to their contact record only — do NOT attempt to attach to a loan. A realtor may be associated with many loans simultaneously.

## Stack
- n8n (connected to Microsoft Outlook)
- Supabase project ref: uuqedsvjlkeszrbwzizl
- Next.js 14 App Router at ~/Documents/loanos-clone
- Working directory: ~/Documents/loanos-clone

---

## Step 1 — Supabase Migration

Check CONTEXT.md and existing migrations first. Then check if activity_log and contacts tables exist.

Create a new migration file in supabase/migrations/ with:
```sql
-- Activity log table
create table if not exists activity_log (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references contacts(id) on delete set null,
  loan_id uuid references loans(id) on delete set null,
  type text not null,
  -- types: 'email_inbound', 'email_outbound', 'note', 'call', 'task'
  subject text,
  body_snippet text, -- first 500 chars only
  from_address text,
  to_address text,
  occurred_at timestamptz default now(),
  created_at timestamptz default now(),
  metadata jsonb
  -- metadata fields used:
  -- from_name, message_id, contact_type (borrower/realtor/builder),
  -- unmatched: true (if no contact found but looks transactional),
  -- needs_review: true (unmatched emails flagged for manual linking)
);

create index if not exists activity_log_contact_id_idx on activity_log(contact_id);
create index if not exists activity_log_loan_id_idx on activity_log(loan_id);
create index if not exists activity_log_occurred_at_idx on activity_log(occurred_at desc);

-- Add last_touch_at to contacts if missing
alter table contacts add column if not exists last_touch_at timestamptz;

-- Add contact_type to contacts if missing
-- Values: borrower, realtor, builder, past_client, lead
alter table contacts add column if not exists contact_type text;
```

---

## Step 2 — n8n Workflow

Build a workflow called "Inbound Email → Supabase Log". Provide the complete JSON export.

### Node 1: Trigger
Microsoft Outlook — On Message Received
- Folder: Inbox
- Poll every 5 minutes

### Node 2: Extract Fields (Set node)
Extract:
- from_address → sender email address (lowercase)
- from_name → sender display name
- subject → email subject line
- body_snippet → first 500 characters of plain text body
- received_at → timestamp of email
- message_id → unique message ID

### Node 3: Filter — Exclude Noise
IF node. Stop workflow (do nothing) if sender domain matches any of:
- noreply, no-reply, donotreply
- mailchimp, constantcontact, hubspot
- notifications@, alerts@, support@, info@, hello@
- @fanniemae.com, @freddiemac.com, @uhm.com (lender system emails)

Add a comment: "Extend this list as needed. Goal is to ignore bulk/system mail."

If email passes filter → continue to Node 4.

### Node 4: Supabase — Find Contact by Email
Query:
```sql
select id, full_name, email, contact_type
from contacts
where lower(email) = '{{ $json.from_address }}'
limit 1
```

### Node 5: IF — Contact Found?
Check if Node 4 returned a result.

**Branch A — Contact Found (borrower, realtor, builder, any type):**

Node 6a: Supabase Insert → activity_log
- contact_id: from Node 4 result
- loan_id: NULL (do not attempt loan matching here)
- type: 'email_inbound'
- subject: from Node 2
- body_snippet: from Node 2
- from_address: from Node 2
- occurred_at: from Node 2
- metadata: {
    from_name: from Node 2,
    message_id: from Node 2,
    contact_type: from Node 4 result
  }

Node 7a: Supabase Update → contacts
- Set last_touch_at = now()
- Where id = contact_id from Node 4

**Branch B — Contact NOT Found:**

Node 6b: IF — Does email look transactional?
Check subject line for any of these patterns (case insensitive):
- Contains a dollar amount ($XXX,XXX or $XXX,XXX.XX)
- Contains "loan" or "mortgage" or "closing" or "escrow" or "title"
- Contains "application" or "pre-approval" or "approval"
- Contains a street address pattern (number + street name)
- Contains "rate" or "lock" or "commitment"

If YES → Node 7b: Supabase Insert → activity_log
- contact_id: NULL
- loan_id: NULL
- type: 'email_inbound'
- subject: from Node 2
- body_snippet: from Node 2
- from_address: from Node 2
- occurred_at: from Node 2
- metadata: {
    from_name: from Node 2,
    message_id: from Node 2,
    unmatched: true,
    needs_review: true
  }

If NO → Stop. Do not log. Not a transactional email.

---

## Step 3 — Frontend Components

### A. ActivityFeed component
Create: `app/contacts/[id]/components/ActivityFeed.tsx`

- Fetch activity_log where contact_id = contact.id, ordered by occurred_at desc
- Show type badge (color coded: gold for email, etc.)
- Show subject, from_address, occurred_at formatted as "Mar 16 at 2:34 PM"
- Body snippet collapsed by default, expand on click
- Null fields show as em dash — never hidden
- Match LoanOS design system exactly: IBM Plex Mono, dark background, gold accent #C9A84C, no white backgrounds, no new UI libraries

### B. Unmatched Email Review Panel
Create: `app/emails/unmatched/page.tsx`

- Fetch activity_log where metadata->>'needs_review' = 'true', ordered by occurred_at desc
- Table view: from_address, from_name, subject, received date
- Each row has a "Link to Contact" button → opens a search modal to find and attach a contact
- On link: update activity_log set contact_id = selected contact, metadata needs_review = false
- Empty state: "No unmatched emails to review" with em dash styling
- Add this page to the LoanOS nav under a logical section (Emails or Activity)

---

## Step 4 — CONTEXT.md Update
After building, update CONTEXT.md:
- activity_log table created with migration
- Inbound email sync workflow live in n8n
- ActivityFeed component added to contact detail page
- Unmatched email review panel live at /emails/unmatched

---

## Rules
- Supabase is the only data store
- n8n is the only orchestration layer
- No new npm packages unless absolutely necessary
- Match existing dark monochromatic design system exactly
- Show null fields as em dashes, never hide them
- Write migration files — do not run raw SQL directly
- Read CONTEXT.md before starting to confirm current table state
- Read LOANOS_SYSTEM_KNOWLEDGE_BASE.md for schema patterns and code examples

## Verification — Do not mark complete until:
- Migration applies without errors
- n8n workflow activates and polls Outlook successfully
- A test email from a known contact logs correctly to activity_log
- contact last_touch_at updates correctly
- A test email from unknown sender with "closing" in subject logs as unmatched
- A marketing/spam email is filtered and not logged
- ActivityFeed renders on contact detail page
- Unmatched review panel renders and link-to-contact works
- CONTEXT.md is updated
