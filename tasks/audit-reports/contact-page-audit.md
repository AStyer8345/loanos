# Contact Page Audit — 2026-03-16

## 1. Contact Detail Page Layout (`src/app/dashboard/contacts/[id]/ContactRecordView.tsx`)

### Header Section
- Avatar (initials), name, stage badge, type badge, group_tag badge, "via [referrer]" link
- Action buttons: **Call** (`tel:`), **Text** (`sms:`), **Email** (`mailto:`)
  - Call & Text only show when phone exists; Email only when email exists
  - All three already use correct href protocols
  - No post-click "Log this?" prompt exists

### Active Loan Card
- Shows between header and tab area (only first active loan via `isActiveLoan()`)
- Badge uses raw `loan.status` string passed to `getStageBadgeStyle()` — does NOT normalize
- Shows: address, loan amount, rate, type, closing date

### Tabs: Overview | Loans | Emails
- **Overview**: Contact Info (editable grid), Address, Relationship, Notes (textarea, saves on blur)
- **Loans**: Full table of all loans for this contact
- **Emails**: Email drafts from `email_drafts` table

### Activity Feed (right sidebar, 340px)
- Header: "ACTIVITY FEED"
- Log form: textarea + "Log Note" button
- Timeline: `ActivityTimeline` component rendering `activity_log` rows
- "Log Note" inserts into `activity_log` with `action: 'note.added'`, `entity_type: 'contact'`

## 2. Activity Feed Data Source

- Reads from `activity_log` table (public, 119 rows, RLS enabled)
- Columns: id, created_at, action, entity_type, entity_id, metadata (jsonb), user_id, type, summary, raw_payload, external_id, loan_id, contact_id
- Fetches: (1) rows where contact_id = this contact, (2) rows where loan_id in contact's loans
- Merges and deduplicates by id, sorts by created_at DESC
- "Log Note" saves to `activity_log` — works correctly

## 3. Call / Text / Email Buttons

- **Call**: `<a href="tel:{digits}">` — works, opens dialer
- **Text**: `<a href="sms:{digits}">` — works, opens Messages
- **Email**: `<a href="mailto:{email}">` — works, opens mail client
- **Missing**: No post-click prompt to log the activity

## 4. Contacts Table Schema

| Column | Type | Notes |
|--------|------|-------|
| last_touch | TEXT | From Salesforce import, likely null/empty for all |
| last_activity_date | TIMESTAMPTZ | Exists but nothing populates it |
| last_activity_notes | — | Does NOT exist |
| last_activity_type | — | Does NOT exist |

## 5. Contacts List (`src/app/dashboard/contacts/page.tsx`)

- LAST TOUCH column reads `c.last_touch` (TEXT field)
- Renders: `c.last_touch ? new Date(c.last_touch).toLocaleDateString(...) : '—'`
- Shows em dashes because `last_touch` is null/empty for all contacts
- No color coding, no tooltip with notes
- Not in default columns list (`DEFAULT_COLUMNS` = name, type, phone, email, stage, referred_by)

## 6. Tables That Do NOT Exist Yet
- `contact_activity` — needs to be created
- `loan_activity` — does NOT exist (the table is `activity_log`)
