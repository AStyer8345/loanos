# Research: Realtor Referral System
Date: 2026-04-20

## Executive Summary

More is already built than the domain queue implies. LoanOS has a referral-tracking data model (six schema migrations deep), a live `/dashboard/referral/[referrerName]` page showing total referrals / closed loans / volume, a referral intro email workflow in n8n, and a contacts UI that links directly to per-realtor summaries. The actual gaps are: (1) no monthly outbound report email to the realtor themselves, (2) no n8n trigger for the referral acknowledgment moment, (3) no "realtor roster" index view showing all referral partners ranked by production, and (4) no co-branded material templates. The minimum viable system needs only two n8n workflows and one UI view to be complete.

---

## What Already Exists (Don't Rebuild)

### Schema — contacts table (relevant columns)
- `referred_by` (TEXT) — free-text name of the referring person. Used as the join key everywhere.
- `referral_type` (TEXT, enum) — `realtor_referral`, `client_referral`, `web_lead`, `past_client`, `friend_family`, `financial_advisor_referral`, `builder_referral`, `open_house`, `other`
- `referred_by_contact_id` (UUID FK → contacts) — structured FK link to the referrer's own contact record (migration 061)
- `referral_ytd_count` (integer) — referrals sent this calendar year (maintained on the referrer's contact record)
- `referral_lifetime_count` (integer) — lifetime referral count on the referrer's contact record
- `last_referral_date` (date) — last time this realtor sent a referral
- `deals_ytd_count` / `deals_lifetime_count` / `last_deal_closed_date` — closed loan counters on the realtor's own contact record
- `last_outreach_date` (date) — last time Adam made contact
- `referral_source_notes` (text) — freeform notes about the relationship
- `production_tier` (TEXT) — `A` (top partner), `B` (target), `C` (occasional). Replaces old `top_realtor` booleans.
- `realtor_stage` (TEXT) — `Active Partner`, `Prospecting`, `Lead`
- `last_touch_at` (TIMESTAMPTZ) — auto-updated on every `activity_log` insert via trigger

### Schema — loans table (relevant columns)
- `referral_contact_id` (UUID FK → contacts) — structured FK to the referring realtor (migration 061)
- `buyer_agent_contact_id` / `listing_agent_contact_id` (UUID FK → contacts) — agent links on the loan itself (migration 015)
- `closing_date`, `funding_date`, `est_closing_date` — all present
- `status` — tracks the full pipeline (Started → In Process → Submitted → Approved → Clear to Close → Closed/Funded)
- `loan_amount`, `loan_program`, `loan_purpose`, `property_city`, `property_state` — all present

### UI — already built
- `/dashboard/referral/[referrerName]` — per-realtor view: total referrals, closed loans, total volume, borrower list, loan list with status badges. Linked from the contacts table "Referred By" column.
- `/dashboard/contacts` — contacts list shows `referral_type` and `referred_by` columns by default; `referred_by` is a clickable link to the per-realtor page; filter preset "Active Referrers" (contact_type = realtor AND referral_ytd_count >= 2) already exists.
- `/dashboard/contacts/by-name/[name]` and `/dashboard/contacts/by-source/[category]` — drill-down views.

### n8n — already built
- `YbgDnTpPdefcazKy` — Referral Intro Email. Fires when a new contact is added with a `referred_by` value. Sends a warm acknowledgment to the borrower. **Do not redesign.**

---

## Gap Analysis — What's Missing

### Gap 1 — No monthly value report email to the realtor
The LoanOS per-realtor view exists for Adam's eyes. The realtor never sees it. There is no automated monthly email that tells the realtor "here's what's in progress and what closed from your referrals this month." This is the highest-leverage missing piece — it gives the realtor a reason to keep referring.

### Gap 2 — No referral acknowledgment to the realtor (only the borrower)
The existing n8n workflow (`YbgDnTpPdefcazKy`) emails the borrower. The realtor gets nothing when their referral is received. A separate workflow should fire a 2–3 sentence text/email to the referring agent the moment their referral is logged: "Got [name], thank you. I'll reach out today."

### Gap 3 — No realtor roster index view in LoanOS
There is no page that lists all referral partners ranked by production. Adam has to navigate into individual contact records or filter the contacts page. A single `/dashboard/contacts/realtors` or equivalent view showing all realtor contacts sorted by `referral_ytd_count` or `production_tier` would give Adam a at-a-glance roster.

### Gap 4 — No co-branded marketing materials
No buyer guide, no open house flyer, no "working with Adam Styer" template exists. These need to be created in Canva. Not an automation gap — a materials gap.

### Gap 5 — referred_by is free-text; referred_by_contact_id is often null
Migration 061 added `referred_by_contact_id` (the structured FK) but the contacts page UI still writes free-text `referred_by`. Until the FK is populated, the monthly report workflow can't do a clean join — it has to match on string. Not a blocker, but worth backfilling via admin route or noting in the workflow logic.

---

## Minimum Viable Referral System
The 20% of work that delivers 80% of the value.

**Two workflows + one SQL query = done.**

1. **n8n: Referral Acknowledgment to Realtor** — When a contact is created with `referral_type = realtor_referral`, fire an email/SMS to the `referred_by` realtor (looked up by name in contacts). 3 sentences. No template polish needed. "Hey [realtor], just got [borrower name] — thank you. I'll reach out today. I'll keep you posted as things move." This closes the loop with the referral source instantly.

2. **n8n: Monthly Realtor Value Report** — On the 1st of each month, query Supabase for all realtor contacts where `referral_ytd_count > 0`. For each, build a summary: referrals sent YTD, loans in process (status IN process/submitted/approved/CTC), loans closed this month (status closed/funded AND closing_date in prior month), total volume closed. Send each realtor a personalized plain-text email with their numbers. This is their proof that referring to Adam is worth it.

3. **LoanOS: Realtor Roster view** — Filter the existing contacts page to `contact_type = realtor`, sort by `referral_ytd_count DESC`. This already works as a filter — it just needs a saved/pinned view or a dedicated route. Could be a 30-line page pulling from existing data with no new queries.

**Everything else** (co-branded materials, avg time-to-close stats, annual gift trigger) is backlog. The above three items directly serve GOALS.md's "find the one referral partner worth a real conversation right now."

---

## Data Model Assessment

**Are the existing fields sufficient?**

Yes, for core tracking. The schema is more complete than most LOs have at this stage:

| Use Case | Fields Available | Status |
|----------|-----------------|--------|
| Who referred this borrower? | `referred_by` (text) + `referred_by_contact_id` (FK) | Present — FK often null, text always set |
| What type of referral? | `referral_type` enum | Present |
| How many referrals has this realtor sent? | `referral_ytd_count`, `referral_lifetime_count` | Present on realtor contact |
| When did they last refer? | `last_referral_date` | Present |
| Which loans came from this realtor? | `referral_contact_id` on loans (FK) | Present — may not be populated by n8n yet |
| How many deals closed? | `deals_ytd_count`, `deals_lifetime_count` | Present on realtor contact |
| Is the relationship warm? | `last_outreach_date`, `last_touch_at` | Present |
| Realtor tier/stage? | `production_tier` (A/B/C), `realtor_stage` | Present |

**What's missing or underused:**

- `referral_ytd_count` and `deals_ytd_count` are stored as denormalized integers on the contact record. They are NOT auto-updated by any trigger today — they appear to be set manually or via import. The monthly report workflow should calculate these live from the loans table rather than trusting these counters until a trigger is confirmed.
- `referred_by_contact_id` is the right FK but the new-contact form writes only free-text `referred_by`. Backfilling this FK would make the monthly report query cleaner but is not required for MVP.
- Avg time-to-close per realtor is calculable from `closing_date - created_at` on the loan record but no column stores it pre-computed. Fine — compute it in the n8n workflow at report time.

**Conclusion:** No new migration needed for MVP. The data is there.

---

## n8n Workflows Needed

### Priority 1 — Referral Acknowledgment to Realtor (new)
- **Trigger:** Supabase webhook on `contacts` INSERT where `referral_type = 'realtor_referral'` and `referred_by IS NOT NULL`
- **Steps:**
  1. Look up the referring realtor contact by `referred_by` (ilike match on first+last name, org scoped)
  2. If found: send 3-sentence email/SMS to realtor's phone/email
  3. Log to `activity_log` on both the borrower contact and the realtor contact
- **Output:** Realtor gets notified within minutes. Adam looks attentive.
- **Note:** Does NOT replace `YbgDnTpPdefcazKy` (borrower welcome). Runs in parallel.

### Priority 2 — Monthly Realtor Value Report (new)
- **Trigger:** Cron — 1st of each month, 8am CT
- **Steps:**
  1. Query `contacts` WHERE `contact_type = 'realtor'` AND `organization_id = X` AND `referral_lifetime_count > 0` (or calculate live from loans)
  2. For each realtor, run a Supabase query: loans in pipeline (via `referral_contact_id` FK or `referred_by` match on borrower contacts), loans closed in prior month
  3. Build personalized plain-text email per realtor with their numbers
  4. Send via Gmail/SMTP
  5. Log send in `activity_log` with `action = 'realtor_report.sent'`
- **Output:** Realtor gets a monthly touchpoint. Adam's brand stays top-of-mind between transactions.

### Not needed right now
- Annual closing gift trigger — can be a scheduled task once volume justifies it. Backlog.
- New referral acknowledgment (borrower side) — already covered by `YbgDnTpPdefcazKy`.

---

## RESPA Compliance Notes

RESPA Section 8 prohibits any thing of value exchanged for referrals of settlement service business. The referral system here is entirely compliant as designed:

**What is allowed:**
- Tracking referrals and thanking realtors — no value exchanged, just a thank-you
- Monthly value reports to realtors — providing data/information is not a thing of value under RESPA
- Co-branded buyer guides and open house flyers — permitted if costs are split proportionally (realtor pays their share, Adam pays his share). Equal logo exposure = equal value exchange.
- Educational content (first-time buyer guides, market updates) — permitted
- Co-hosting educational events — permitted if costs are shared equally
- Desk space / marketing services arrangements — permitted only if at fair market value with a written MSA

**What is NOT allowed:**
- Paying realtors any fee, commission, or kickback for referrals — ever
- "Co-marketing" where Adam pays significantly more than fair value and the realtor provides referrals in return
- Gifts with material value to realtors tied to referral activity (small promotional items under $10–15 are generally tolerated industry-wide; anything larger requires legal review)
- Written referral fee agreements of any kind

**Safe execution for co-branded materials:**
- Buyer guide flyer: Adam pays printing for his portion, realtor pays theirs. Or Adam produces it digitally for free and uses it for both — digital distribution has no cost to split.
- Open house marketing: co-branded flyer with equal logo treatment. If Adam mails it, he pays postage. No fee to the realtor.
- "Working with [Realtor] + Adam Styer" landing pages — permitted. Pure co-marketing.

---

## Recommended Build Order

### Priority 1 — Referral Acknowledgment to Realtor (n8n)
**Why first:** Closes the loop on referrals Adam is already receiving. The borrower gets a welcome email (existing workflow) but the realtor currently hears nothing. A same-day thank-you to the realtor increases the chance of the next referral. Zero new schema. Fast to build. Directly serves GOALS.md: "find the one referral partner worth a real conversation right now" — this is the automation that makes referral partners feel seen.

### Priority 2 — Realtor Roster View in LoanOS (UI)
**Why second:** Adam needs a single screen to see all his referral partners ranked by activity before he can identify "the one person worth a conversation this week." The contacts filter already supports this (contact_type = realtor, sorted by referral_ytd_count). This could be a 1-hour build: a dedicated `/dashboard/contacts/realtors` page or a pinned filter preset. Feeds directly into the weekly business development goal.

### Priority 3 — Monthly Realtor Value Report (n8n)
**Why third:** Higher effort (requires per-realtor query logic, email composition, send loop). But highest long-term leverage — it turns passive referral tracking into an active retention mechanism. Build after the acknowledgment workflow is live and the data quality (especially `referral_contact_id` FK population) is verified.

### Backlog
- Co-branded materials in Canva — do when a specific realtor relationship warrants it, not proactively
- Avg time-to-close stat in the per-realtor LoanOS view — additive to existing page, low priority
- Annual closing gift trigger — only matters once volume exceeds ~30 closings/year from referral partners
- Backfill `referred_by_contact_id` FK — admin script, low priority, does not block any MVP

---

## Open Questions

1. **Who populates `referral_ytd_count` and `deals_ytd_count` on the realtor contact?** Are these being incremented by a trigger or set manually? If manually, the monthly report must calculate live from loans rather than trusting these columns. Need to verify in Supabase.

2. **Is `referral_contact_id` on loans being set by the Arive webhook?** If not, the structured FK path for monthly report queries won't work — the workflow must fall back to matching loans through `contacts.referred_by` (text). Verify by querying `SELECT COUNT(*) FROM loans WHERE referral_contact_id IS NOT NULL`.

3. **Does Adam want the monthly report to go to ALL realtors with any lifetime referral, or only active ones (e.g., referred in past 12 months)?** Sending to a realtor you haven't heard from in 3 years requires a re-introduction, not a stats report. Recommend: `last_referral_date > NOW() - INTERVAL '12 months'` as the filter for the first version.

4. **Email vs. SMS for the acknowledgment to realtors?** Text is faster and more personal. Email is easier to compose and log. Realtors are heavy texters. Recommend SMS-first if Adam has their mobile numbers in the contacts table, with email fallback.

5. **Co-branded materials format?** Canva is the tool. Does Adam want one generic buyer guide with his logo + a blank realtor logo slot, or does he want fully co-branded versions per realtor? Generic is faster. Per-realtor is more impactful. Start with one generic template.
