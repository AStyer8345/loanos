# Research: Contact Data Architecture — LoanOS CRM
Date: 2026-03-25

---

## Executive Summary

The contacts table has 49 columns but the actual data population tells a very different story: most fields are empty (title: 0%, realtor_email: <1%, source: <1%), while core identity and contact fields are well-populated (email: 99.9%, birthdate: 69%). The schema has three separate phone fields (phone, phone_mobile, home_phone) with serious fragmentation — only 9 contacts have both phone and phone_mobile, and `phone_mobile` is nearly empty at 0.4% (9 records). There is no `contact_activities` table — activity logging is split across `activity_log` and `contact_emails`, which limits automation trigger fidelity. The current smart list set (9 lists) covers the basic funnel but is missing the highest-value lists for a relationship-driven LO: past clients due for a rate review, realtors not touched in 30+ days, and birthdays in the next 30 days.

---

## Current Schema Audit

### Field Inventory (from live DB — 2,377 contacts)

| Field | Data Type | % Populated | Notes |
|-------|-----------|-------------|-------|
| id | uuid | 100% | PK, auto-generated |
| created_at | timestamptz | 100% | Auto |
| updated_at | timestamptz | 100% | Auto |
| first_name | text | 100% | NOT NULL |
| last_name | text | 100% | NOT NULL |
| email | text | 99.9% | UNIQUE constraint |
| contact_type | text | 100% | borrower / realtor / other |
| stage | text | 99.5% | Auto-updated by trigger |
| group_tag | text | 100% | Default: 'Client' |
| birthdate | date | 69.2% | 1,646 records — key automation trigger |
| mailing_street | text | 72.6% | 1,725 records |
| mailing_city | text | 73.2% | 1,740 records |
| mailing_state | text | 72.3% | 1,719 records |
| mailing_zip | text | 71.9% | 1,710 records |
| phone | text | 69.8% | 1,659 records — primary phone |
| lead_source | text | 64.6% | 1,535 records |
| email_opt_out | boolean | 13.5% opted out | 321 records — critical for compliance |
| co_borrower_first | text | 10.9% | 260 records |
| last_touch_at | timestamptz | 27.3% | 648 records — big gap |
| company_name | text | 16.6% | 394 records — mostly realtors |
| referred_by | text | 6.3% | 149 records — should be higher |
| referral_type | text | 6.6% | 156 records |
| top_realtor | boolean | 4.8% | 114 records |
| target_realtor | boolean | 1.6% | 39 records |
| closing_date | date | 2.2% | 53 records — mostly stale/legacy |
| salesforce_id | text | 1.9% | 44 records — partial SF migration |
| home_phone | text | 8.4% | 199 records — legacy import artifact |
| last_activity_date | timestamptz | 2.1% | 50 records — nearly empty |
| last_activity_notes | text | 2.1% | 50 records — nearly empty |
| co_borrower_birthdate | date | — | Low population assumed |
| co_borrower_mobile | text | — | Low population assumed |
| co_borrower_email | text | 0% | 0 records — completely empty |
| phone_mobile | text | 0.4% | 9 records — broken field |
| source | text | 0.4% | 9 records — near-empty |
| title | text | 0% | 0 records — dead column |
| realtor_email | text | <0.1% | 1 record — dead column |
| realtor_phone | text | <0.1% | 1 record — dead column |
| account_name | text | Unknown | SF legacy |
| contact_group | text | Unknown | SF legacy |
| mailing_country | text | Unknown | Rarely populated |
| salesforce_created_date | date | Unknown | SF migration artifact |
| last_touch | text | Unknown | Legacy text field, replaced by last_touch_at |
| organization_id | uuid | 100% | Multi-tenant FK |
| user_id | uuid | 100% | Owner FK |

### Phone Field Fragmentation (Critical Issue)

| Situation | Count | % of Total |
|-----------|-------|------------|
| Has phone only | 1,650 | 69.4% |
| Has home_phone only | 105 | 4.4% |
| Has both phone + phone_mobile | 9 | 0.4% |
| Has phone_mobile only | 0 | 0% |
| No phone at all | 613 | 25.8% |

**Finding:** `phone_mobile` is effectively unused. `home_phone` has 199 records — likely a Salesforce import artifact. The actual "mobile" number for most borrowers is stored in `phone`. This creates a confusing 3-field phone situation with no clear semantic meaning.

### Contact Type Breakdown

| Type | Stage | Count |
|------|-------|-------|
| borrower | Closed | 843 |
| borrower | Lead | 304 |
| borrower | Pre-Approved | 35 |
| borrower | In Process | 21 |
| borrower | Application | 11 |
| borrower | Other | 5 |
| realtor | Lead | 1,043 |
| realtor | (null) | 12 |
| realtor | Closed | 5 |
| other | Lead | 89 |
| other | Closed | 5 |
| other | Pre-Approved | 3 |
| other | (null) | 1 |

**Key observation:** 843 closed borrowers = past client database. This is the highest-value segment for refi outreach, referral asks, and anniversaries. 1,043 realtors in "Lead" stage is misleading — realtors don't move through a borrower pipeline, so "Lead" means "in the database."

---

## Fields That Are Empty / Unused

These are candidates for removal from the UI (not necessarily from the schema — schema changes are destructive):

| Field | Population | Recommendation |
|-------|------------|----------------|
| title | 0% | Hide from all UI — no LO uses professional title on a contact record |
| co_borrower_email | 0% | Needs a data entry prompt on new borrower forms; don't hide, just fix the form |
| realtor_email | <0.1% | Dead — realtors have their own contact record; this field is conceptually wrong |
| realtor_phone | <0.1% | Same — dead |
| source | 0.4% | Overlaps with lead_source; consolidate or remove |
| phone_mobile | 0.4% | Rename to `mobile` or consolidate with phone; current split confuses the UI |
| last_activity_date / last_activity_notes | 2.1% | Superseded by contact_activities logging; these are stale SF fields |
| salesforce_created_date | — | Pure migration artifact; no value in LoanOS |
| account_name | — | SF concept that doesn't translate; hide |
| contact_group | — | Duplicate of group_tag; hide |
| mailing_country | — | 100% domestic; hide unless address suggests international |
| closing_date (on contact) | 2.2% | Closing date belongs on the loan record, not the contact; this field creates confusion |

---

## Fields That Are Missing But Would Add Value

These are fields NOT in the current schema that high-volume LOs use in best-in-class CRMs (Jungo, Total Expert, BNTouch, Surefire):

### For All Contact Types
| Missing Field | Why It Matters | Automation Use |
|---------------|----------------|----------------|
| `preferred_contact_method` | enum: call/text/email/any — lets automation choose the right channel | Route outreach to preferred channel |
| `do_not_call` | Separate from email_opt_out — TCPA compliance | Block SMS/call automations |
| `tags` | text[] array — free-form labels (e.g., "investor", "VA", "jumbo buyer") | Segment lists without adding schema columns |
| `last_loan_closed_date` | Computed or stored date of most recent closed loan | Trigger 1-year anniversary check-in |

### For Borrowers
| Missing Field | Why It Matters | Automation Use |
|---------------|----------------|----------------|
| `home_purchase_anniversary` | Date the borrower closed/moved in (differs from loan closing_date) | Annual "homeversary" touchpoint |
| `current_rate` | The rate on their existing loan | Rate watch threshold trigger |
| `current_loan_balance` | Outstanding balance | Refi opportunity scoring |
| `property_address` (on contact) | Where they live — distinct from mailing address | Homeversary cards, market updates |
| `loan_purpose_history` | Purchase vs. refi history | Predict next transaction type |
| `household_income_range` | Rough bracket — not exact number | Product fit scoring |

### For Realtors
| Missing Field | Why It Matters | Automation Use |
|---------------|----------------|----------------|
| `brokerage_name` | Company they work for (company_name exists but semantic meaning is unclear) | Group realtors by brokerage for targeted outreach |
| `production_tier` | Defined tier — e.g., A/B/C or 1/2/3 — based on annual closed volume with Adam | Prioritize outreach frequency |
| `last_referral_date` | Date of their most recent referral | Trigger thank-you, flag if inactive >90 days |
| `total_referrals_sent` | Lifetime count | Identify top referral partners |
| `preferred_lender_status` | boolean — are they actively sending loans? | Smart list: "Active Referral Partners" |

---

## Industry Benchmarks — What Best-in-Class Mortgage CRM Contact Records Look Like

### Jungo (Salesforce for Mortgage)
Jungo uses the full Salesforce Contact object + custom objects. The fields that generate the most ROI in mortgage:
- Birthday + Anniversary → automated card/text campaigns
- Lead Source → attribution and ROI by channel
- Referral Source (referred_by) → network mapping
- Loan milestone dates → trigger post-close follow-up sequences
- Email opt-out → compliance
- Stage / funnel position → pipeline visibility

Jungo's most-used automation triggers: **birthday, loan anniversary, rate drop alert, annual review date**.

### Total Expert
Total Expert (used by mid-to-large teams) adds:
- **Relationship score** — computed from engagement events
- **Rate watch threshold** — alert when market rate drops below this threshold
- **NPS/review request status** — was review requested? Received?
- **Pre-approval expiration date** — 90-day PA letters expire; needs re-pull
- **Contact source campaign** — which marketing campaign generated the contact

### BNTouch
BNTouch focuses on small independent LOs (Adam's profile). Its killer features:
- **Birthday and anniversary reminders** — SMS on the day
- **Milestone campaigns** — 30/60/90 day post-close sequences
- **Realtor production tracking** — referrals per realtor per year
- **Rate alert subscriptions** — contact gets notified when rate hits their target

### What a High-Volume LO Needs to Know Per Contact
Adam has 1,000+ career loans. The data that drives repeat and referral business:
1. **Who sent them** — `referred_by` + `referral_type` — to close the thank-you loop
2. **What they closed on** — rate, loan type, property — to score refi opportunity
3. **When to reach out** — birthday, loan anniversary, pre-approval expiry
4. **Whether they're reachable** — opt-out status, preferred contact method
5. **Whether the relationship is warm** — days since last touch (last_touch_at)
6. **For realtors specifically** — how many deals have come from them, what tier they are

---

## Recommended Smart Lists

The current 9 smart lists cover the basic funnel. Here are the 8 highest-value lists a mortgage LO actually needs:

| # | Name | Description | WHERE Clause Logic | Recommended Action |
|---|------|-------------|-------------------|--------------------|
| 1 | **Active Pipeline** | All borrowers currently in process | `contact_type = 'borrower' AND stage IN ('Pre-Approved', 'In Process', 'Closing', 'Application')` | Daily review — these are live deals |
| 2 | **Past Clients — Refi Watch** | Closed borrowers who may benefit from a rate review | `contact_type = 'borrower' AND stage = 'Closed'` + join to loans for rate vs. current market | Monthly outreach campaign — highest ROI segment |
| 3 | **Birthdays This Month** | Contacts with birthdays in the current calendar month | `EXTRACT(MONTH FROM birthdate) = EXTRACT(MONTH FROM CURRENT_DATE)` | Automated birthday text/card |
| 4 | **Active Referral Partners** | Realtors marked top_realtor OR target_realtor | `contact_type = 'realtor' AND (top_realtor = true OR target_realtor = true)` | Weekly check-in cadence |
| 5 | **Realtors Not Touched in 30+ Days** | Realtor contacts where last_touch_at is stale | `contact_type = 'realtor' AND (last_touch_at < NOW() - INTERVAL '30 days' OR last_touch_at IS NULL)` AND `email_opt_out = false` | Outreach reminder — relationship maintenance |
| 6 | **Pre-Approval Expiring Soon** | Borrowers Pre-Approved stage, closing date or PA date approaching | `contact_type = 'borrower' AND stage = 'Pre-Approved'` (manual sort by created_at to find oldest) | Follow up — PA letters expire at 90 days |
| 7 | **No Phone on File** | Contacts missing all phone fields — unreachable | `phone IS NULL AND phone_mobile IS NULL AND home_phone IS NULL` | Data cleanup campaign |
| 8 | **Email Opted Out — Review** | Contacts opted out of email — may need re-engagement or archiving | `email_opt_out = true` | Quarterly review — prune or re-engage via phone |

**Note:** Smart lists 3 and 5 require `last_touch_at` to be populated. Currently only 648 of 2,377 contacts (27%) have this field populated. Expanding activity logging to update `last_touch_at` on every interaction is a prerequisite for list 5 to be useful.

**Note on broken list:** The existing "Closed Borrowers" smart list queries `stage = 'Closed Client'` but the actual data uses `stage = 'Closed'`. This should be corrected.

---

## UI Organization Recommendations

### Contact List View (table)
**Default visible columns (current: name, type, phone, email, stage, referred_by, last_touch) — assessment:**
- Good defaults. The column toggle is the right pattern.
- `last_touch` should always be default-on — it's the most actionable signal
- `referral_type` badge should be default-on for borrowers (it answers "where did this lead come from?")
- Consider a "days since last touch" computed column rather than raw date — "47 days" is more scannable than "02/06/2026"

**Missing from list view:**
- Birthday badge (month/day) — especially useful in birthday smart list
- "Active loan" indicator — show a dot/badge if the contact has an open loan in pipeline

### Contact Detail View (single record) — what's above the fold:
**Current header:** name, stage badge, type badge, group_tag, referral_type, referred_by, Call/Text/Email buttons
**This is good.** The action buttons are correctly prioritized.

**Overview tab — recommended field priority order:**
1. Phone + Email (contact info) — already there
2. Stage + Referral type + Referred by — already there
3. **Last touch** — needs to be prominent, currently buried
4. Birthday + anniversary — present but could be more prominent as automation triggers
5. Address — useful for cards; currently shown
6. Co-borrower info — correctly lower priority
7. Notes — correctly at the bottom

**What's missing from the detail view:**
- Linked loans section shows loans but doesn't surface the **rate and loan type** from those loans — these are the two pieces of data that determine refi eligibility and should be visible on the contact record
- No "days since last touch" computation displayed
- No "total loans closed" count for realtors

### Realtor Record — Special Considerations
A realtor record in a mortgage LO's CRM should show different information than a borrower record. Currently LoanOS treats them identically. Recommended realtor-specific fields above the fold:
- Brokerage/company
- top_realtor / target_realtor flag
- Referred loans list (loans where this realtor is the `referred_by`)
- Total referral count + last referral date
- Last touch date with urgency color coding

---

## Compliance Notes

### GLBA / Data Retention
- Contact records containing loan application data (income, credit, assets) are subject to GLBA Safeguards Rule — 5-year retention minimum
- `email_opt_out = true` must be honored for all marketing communications; this field is populated for 321 contacts (13.5%) and must gate all Mailchimp/n8n email automations
- **Do not call** (TCPA): there is no `do_not_call` field in the current schema. If automated SMS outreach is added (n8n + Twilio), this field is legally required before launch
- Birthday/anniversary data is PII — ensure Supabase RLS policies restrict access to authenticated users within the organization only (verify org-scoped RLS on contacts table)
- Salesforce sync fields (`salesforce_id`, `salesforce_created_date`) — if contacts are deleted in LoanOS, consider whether GLBA requires retention in SF as the system of record

### Data Quality / Audit Trail
- No created_by field on contacts — can't audit who added a record
- `updated_at` exists but no field-level change log — if a phone number is changed, the previous value is lost
- For a CFPB audit scenario, activity_log covers loan milestones but contact-level interactions (calls, texts) are in `contact_activities` — ensure this table is retained per GLBA requirements

---

## Open Questions Requiring Adam's Decision

1. **Phone field consolidation:** `phone`, `phone_mobile`, and `home_phone` all exist. For new records going forward, should LoanOS have two phone fields (mobile + direct/office) or just one? The current `phone` field is treated as primary — should we rename it `mobile` to match reality, or keep generic? This affects all future imports and n8n automations.

2. **Realtor stage semantics:** 1,043 realtors are in stage "Lead" because the stage trigger is borrower-centric. Should realtors have a separate stage system (e.g., "Prospecting", "Active Partner", "Inactive", "Churned") or is a simple active/inactive boolean sufficient?

3. **`closing_date` on contact vs. loan:** The contact record has a `closing_date` field (53 records populated). Loan records also have closing_date. These mean different things. Should the contact-level closing_date be deprecated in favor of always pulling from the linked loan? Or does it serve a purpose (e.g., tracking a future closing date before the loan is in Arive)?

4. **Past client refi trigger:** To build the "Past Clients — Refi Watch" smart list with rate comparison, we need to store the borrower's current/closed rate on either the contact or the loan record. Is this data in Arive via the sync workflow? Should it be pulled automatically, or does Adam want to set it manually?

5. **`do_not_call` field:** Before adding any SMS automation via n8n, a `do_not_call` boolean should be added to the contacts schema. Should this be added now (proactively) or when SMS automation is actually being built?

6. **Realtor production tiers:** The current schema has `top_realtor` (boolean) and `target_realtor` (boolean). Would a single `production_tier` field (A/B/C or 1/2/3) replace these two booleans more cleanly, or do the two booleans serve different strategic purposes (top = already sending deals, target = want their deals)?

7. **`last_touch_at` backfill:** Only 648 contacts (27%) have this field populated. Should we run a backfill query that sets `last_touch_at` from `last_activity_date` or `created_at` for the 1,729 contacts missing it? Or leave it null until a real interaction occurs?

8. **Contact dedup on `realtor_email`/`realtor_phone`:** There are 2 contacts with `realtor_email` or `realtor_phone` populated (legacy field). These likely represent borrowers whose realtor was saved incorrectly. Should these be cleaned up and the fields dropped from the UI entirely?
