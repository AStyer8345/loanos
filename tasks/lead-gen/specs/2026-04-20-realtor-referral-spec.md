# Realtor Referral System — Build Spec
Date: 2026-04-20
Goal: Close the three gaps in the existing referral infrastructure. No new schema. No new data model. Ship in order.

## Context

More is already built than expected. Existing assets:
- Schema fields: `referred_by`, `referral_type`, `referred_by_contact_id`, `referral_ytd_count`, `deals_ytd_count`, `production_tier`, `realtor_stage`, `last_referral_date`, `last_outreach_date`, `last_touch_at`
- UI: `/dashboard/referral/[referrerName]` — live per-realtor detail page
- UI: `/dashboard/contacts` — contacts table with `referred_by` click-through and "Active Referrers" filter preset
- n8n `YbgDnTpPdefcazKy` — Referral Intro Email to the *borrower* — already live, do not touch

Three gaps remain. Build in this order.

---

## Priority 1 — Realtor Acknowledgment Email (n8n workflow)

**What it does:** When a new contact is created with `referral_type = 'realtor_referral'`, fire a short email to the *referring realtor* confirming their referral was received. Today only the borrower gets an email. The realtor hears nothing.

### Trigger
Supabase webhook on `contacts` INSERT where:
- `referral_type = 'realtor_referral'`
- `referred_by IS NOT NULL`

### Database reads
1. From the inserted contact: `referred_by` (text), `first_name`, `last_name`, `organization_id`
2. Lookup query: `SELECT id, email, phone, first_name FROM contacts WHERE organization_id = $1 AND LOWER(TRIM(first_name || ' ' || last_name)) ILIKE LOWER(TRIM($referred_by)) LIMIT 1`
   - If no match: log a warning to `activity_log` and exit gracefully. Do not error.

### Output
Email via Resend (existing credential — not Outlook, Outlook is broken).

**Subject:** `I got your referral — [Borrower First Name] is in.`

**Body:**
> Hey [Realtor First Name] —
>
> Just got [Borrower First Name] [Borrower Last Name] from you — thank you. I'll reach out to them today and get things moving.
>
> I'll keep you posted as it progresses.
>
> — Adam

After send: write one `activity_log` row on the realtor's contact record: `action = 'referral_ack.sent'`, `notes = 'Acknowledgment email sent for referral: [Borrower Name]'`.

### RESPA note
This is a courtesy notification only — no compensation, no thing of value. Fully compliant under RESPA Section 8.

### Estimated effort
2–3 hours. Single-path workflow. Uses existing Supabase + Resend n8n pattern. Only tricky part is the ILIKE name lookup — add a fallback log if no realtor contact is found.

---

## Priority 2 — Realtor Roster View (LoanOS UI)

**What it does:** A dedicated `/dashboard/contacts/realtors` page that lists all referral partners ranked by production. Replaces the manual filter dance Adam does today on `/dashboard/contacts`.

### Trigger
User navigates to `/dashboard/contacts/realtors`. Read-only. No mutations.

### Database reads
Single query:
```sql
SELECT
  id, first_name, last_name, email, phone,
  referral_ytd_count, deals_ytd_count,
  last_referral_date, production_tier, realtor_stage
FROM contacts
WHERE organization_id = $1
  AND (referral_ytd_count > 0 OR deals_ytd_count > 0)
ORDER BY referral_ytd_count DESC, deals_ytd_count DESC
```
No new tables. No migrations.

### Output
A `'use client'` page at `src/app/dashboard/contacts/realtors/page.tsx`.

Table columns (in order):
| Name | Referrals YTD | Deals Closed YTD | Last Referral | Tier |
|------|---------------|------------------|---------------|------|
| Clickable link → `/dashboard/referral/[referrerName]` | integer | integer | date | A / B / C badge |

- Sortable client-side by any column (default: Referrals YTD desc)
- Tier badge: A = green, B = yellow, C = gray
- Empty state: "No referral contacts yet. Add a contact with referral_type = realtor_referral to get started."
- Nav: add a "Realtors" link under the Contacts section in the sidebar, or a tab on `/dashboard/contacts`

Match existing page styles from `/dashboard/contacts/page.tsx` — same table structure, same Tailwind classes.

### RESPA note
Read-only data display. No compliance surface.

### Estimated effort
2–4 hours. No new schema, no API routes needed (direct Supabase client call). The hardest part is wiring the sort state and matching the existing table style.

---

## Priority 3 — Monthly Realtor Value Report (n8n workflow) — Build after 1 and 2 are live

**What it does:** On the 1st of each month, email every active referral partner a personalized summary of their pipeline and closed stats. Keeps Adam top-of-mind between transactions without a manual touchpoint.

**Flag:** Build this only after Priority 1 and 2 are confirmed working. Verify that `referral_contact_id` on the loans table is being populated before building the query path that relies on it. If not populated, the workflow must fall back to joining loans through `contacts.referred_by` (text match).

### Trigger
n8n Schedule node: `0 8 1 * *` (8am CT, 1st of each month)

### Database reads
Step 1 — Get active realtors:
```sql
SELECT id, first_name, last_name, email, organization_id
FROM contacts
WHERE organization_id = $1
  AND contact_type = 'realtor'
  AND last_referral_date > NOW() - INTERVAL '12 months'
  AND email IS NOT NULL
```

Step 2 — For each realtor, calculate stats live (do not trust `referral_ytd_count` / `deals_ytd_count` until a DB trigger is confirmed):
```sql
-- Loans in pipeline
SELECT COUNT(*), SUM(loan_amount)
FROM loans
WHERE referral_contact_id = $realtorId
  AND status IN ('In Process','Submitted','Approved','Clear to Close')
  AND organization_id = $1

-- Loans closed prior month
SELECT COUNT(*), SUM(loan_amount)
FROM loans
WHERE referral_contact_id = $realtorId
  AND status IN ('Closed','Funded','Closed/Funded')
  AND closing_date >= date_trunc('month', NOW() - INTERVAL '1 month')
  AND closing_date < date_trunc('month', NOW())
  AND organization_id = $1
```

If `referral_contact_id` is NULL on most rows (verify first), fall back to matching via borrower contacts: join `loans` → `contacts` on `contacts.referred_by ILIKE realtorFullName`.

### Output
Plain-text email via Resend per realtor. Subject: `Your referral pipeline with Adam Styer — [Month Year]`

Body example:
> Hi [First Name] —
>
> Quick update on your referrals with me this month:
>
> In process: 2 loans ($940,000)
> Closed last month: 1 loan ($485,000)
>
> I appreciate every referral you send. If anyone in your pipeline needs a rate check or pre-approval, send them my way.
>
> — Adam Styer | NMLS #513013

After send: write `activity_log` row per realtor: `action = 'monthly_report.sent'`.

### RESPA note
Informational report only — sharing data about the realtor's own referrals. No value exchanged. Providing factual status information to a business partner is permitted under RESPA.

### Open questions before building
1. Is `referral_contact_id` on loans being populated by the Arive webhook? Run: `SELECT COUNT(*) FROM loans WHERE referral_contact_id IS NOT NULL` before building queries.
2. Should the filter be `last_referral_date > 12 months` or `referral_lifetime_count > 0`? Recommend 12-month window for first version.

### Estimated effort
4–6 hours. The per-realtor query loop and stats calculation are the main complexity. Email composition is simple. Resend credential is already available in n8n.
