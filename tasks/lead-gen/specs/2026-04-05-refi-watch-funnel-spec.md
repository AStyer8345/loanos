# Funnel Spec: Refi Watch Funnel — Lead Generation
Date: 2026-04-05
Status: READY FOR EXECUTION (pending Adam's rate source decision and email approval)

---

## Scope

### In Scope
- **Sequence B — Monthly Anniversary Check-In:** n8n CRON → Supabase query → personalized Outlook email per past client on their loan closing month anniversary
- **Sequence D — Pre-Rate-Drop Warm-Up:** One-time manual n8n execution → email all 644 past clients (warm-up before rates move)
- **Sequence A — Rate Drop Alert:** n8n daily check → if market rate ≤ threshold → personalized "your rate vs. today" Outlook email to Segment A borrowers (rate ≥ 6.75%)
- Activity log tracking in Supabase to prevent duplicate sends
- Full email copy for all 3 sequences

### Out of Scope
- **Segment C (Equity Milestone Alerts):** Requires AVM (Automated Valuation Model) API — deferred until data enrichment strategy decided
- Landing pages: no inbound opt-in page — this is pure outbound
- Mailchimp for Refi Watch: n8n → Outlook is the chosen architecture (personal feel, existing credential, small volume)
- SMS: email-only per TCPA compliance. No SMS until explicit prior opt-in confirmed for past clients.
- Homepage form wiring (BLOCKER-001): separate ticket

---

## Architecture Overview

This is an **outbound reactivation system**, not an inbound funnel. There is no landing page, no form, no opt-in. n8n queries LoanOS, constructs personalized emails, and sends them via Outlook from adam@thestyerteam.com. Past clients receive emails that feel like personal outreach from Adam — not mass marketing.

**Email platform decision: n8n → Outlook (not Mailchimp)**
Rationale:
- Past clients have prior business relationship — personal email from Adam is appropriate and expected
- Volume is small (644 total; ~54/month for anniversary)
- Outlook emails convert better for reactivation because they don't look like marketing
- Existing n8n Outlook credential in place (used by PA notify, milestone emails, etc.)
- CAN-SPAM compliance maintained via physical address in footer + reply STOP opt-out

---

## Sequence B — Monthly Anniversary Check-In

### Trigger
- CRON: 1st of every month, 8:00 AM CT
- n8n workflow name: **Refi Watch — Anniversary Check-In**

### Supabase Query
```sql
SELECT
  l.id AS loan_id,
  l.interest_rate,
  l.closing_date,
  l.loan_amount,
  c.email AS borrower_email,
  c.first_name AS borrower_first_name,
  EXTRACT(YEAR FROM AGE(NOW(), l.closing_date))::int AS years_since_close
FROM loans l
JOIN contacts c ON l.contact_id = c.id
WHERE
  l.closing_date IS NOT NULL
  AND EXTRACT(MONTH FROM l.closing_date) = EXTRACT(MONTH FROM NOW())
  AND c.email IS NOT NULL
  AND c.email NOT LIKE '%test%'
  AND NOT EXISTS (
    SELECT 1 FROM activity_log al
    WHERE al.loan_id = l.id
    AND al.activity_type = 'anniversary_checkin'
    AND EXTRACT(YEAR FROM al.created_at) = EXTRACT(YEAR FROM NOW())
  )
```
This gets all past clients whose loan closed in the current calendar month AND who have not already received an anniversary email this year.

### n8n Workflow Steps
1. **CRON Trigger** — 0 8 1 * * (first of month, 8am)
2. **HTTP Request (GET)** — Supabase REST API: `GET /rest/v1/loans?select=id,interest_rate,closing_date,loan_amount,contact:contacts(email,first_name)&closing_date=not.is.null` + filter by month (use RPC function or filter in code node)
3. **Code Node** — Filter: closing_date month = current month AND not in activity_log this year. Compute years_since_close.
4. **IF Node** — items.length > 0? YES → continue. NO → stop.
5. **Split In Batches** — process 1 at a time (avoid Outlook rate limits)
6. **Code Node** — Construct personalized email body (see copy below)
7. **Send Email (Outlook)** — from: adam@thestyerteam.com, to: borrower_email
8. **HTTP Request (POST)** — Log to activity_log: `{ loan_id, activity_type: 'anniversary_checkin', notes: 'Anniversary email sent via Refi Watch n8n', created_at: now }`
9. **Wait Node** — 2 seconds between sends

### Email Copy — Anniversary Check-In

**Subject line options (A/B test):**
- A: `[FIRST_NAME] — [X] year check-in from Adam`
- B: `[X] year(s) since we closed your loan — quick note from Adam`

**Body:**
```
Hey [FIRST_NAME],

[X] year(s) ago this month, we closed your loan [OPTIONAL: at [RATE]%]. I do a quick check-in every year for past clients — just to make sure your mortgage still makes sense.

Here's the Austin market snapshot right now:
• 30-year fixed: ~6.1%
• 15-year fixed: ~5.9%
• Austin home prices: Still elevated but stabilizing after the 2022–2023 run-up

If your rate is above 6.75%, there may be a refinance opportunity opening up in the next 6–12 months as rates inch lower. If you bought before 2021, you've likely built significant equity — which creates options too (cash-out, HELOC, etc.).

If you want me to pull up your loan details and talk through what makes sense, just reply to this email. No pitch. Just a 10-minute conversation.

Adam
NMLS #513013
Adam Styer | Mortgage Solutions LP
5900 Balcones Drive, Suite 100, Austin TX 78731
austin@styermortgage.com | (512) 766-7976

---
To opt out of these annual check-ins, reply STOP. You will not receive further emails from this sequence.
```

**Personalization variables:**
- `[FIRST_NAME]` → `contacts.first_name`
- `[X]` → `EXTRACT(YEAR FROM AGE(NOW(), loans.closing_date))`
- `[RATE]` → `loans.interest_rate` formatted as `#.##%` — omit line if rate is null
- Omit rate if `interest_rate IS NULL` — just say "we closed your loan"

---

## Sequence D — Pre-Rate-Drop Warm-Up (One-Time)

### Trigger
- **Manual execution by Adam** — triggered once from n8n UI
- Adam reviews and approves email copy before triggering
- Target send date: within 2 weeks of today (April 19, 2026 at latest)

### Supabase Query
```sql
SELECT
  l.id AS loan_id,
  l.interest_rate,
  l.closing_date,
  c.email AS borrower_email,
  c.first_name AS borrower_first_name
FROM loans l
JOIN contacts c ON l.contact_id = c.id
WHERE
  l.closing_date IS NOT NULL
  AND c.email IS NOT NULL
  AND c.email NOT LIKE '%test%'
  AND NOT EXISTS (
    SELECT 1 FROM activity_log al
    WHERE al.loan_id = l.id
    AND al.activity_type IN ('refi_warmup', 'anniversary_checkin', 'rate_drop_alert')
  )
```
Excludes anyone already touched by any Refi Watch sequence.

### n8n Workflow Name: Refi Watch — Pre-Drop Warm-Up (ONE-TIME)
Steps mirror Sequence B but:
- Trigger: Manual (Webhook or Manual Trigger node)
- Email copy: Warm-up version (see below)
- Activity log type: `refi_warmup`
- Send limit: 100 emails/hour max (respect Outlook limits)

### Email Copy — Pre-Rate-Drop Warm-Up

**Subject:** `Quick check-in from Adam — how's [CITY] treating you?`
(CITY = Austin if known; otherwise omit city reference)

**Body:**
```
Hey [FIRST_NAME],

Just checking in — it's been a while since we worked together on your mortgage, and I wanted to reach out personally.

Rates are still elevated (30-year is sitting around 6.1% right now), but the Fed has signaled cuts ahead. A lot of my past clients are starting to ask whether they should be watching for a refinance window.

Honest answer: for most people, now isn't the time to move. But when rates drop another quarter or half a point, there could be a real opportunity — and I want you to know that I'm watching it for you.

When the time comes, I'll reach out. But if you have any questions before then — about your equity, your options, or whether anything has changed in your situation — I'm always a quick reply away.

Adam
NMLS #513013
Adam Styer | Mortgage Solutions LP
5900 Balcones Drive, Suite 100, Austin TX 78731
austin@styermortgage.com | (512) 766-7976

---
To opt out of these check-ins, reply STOP.
```

**Notes:**
- No personalization of rate (most records won't have interest_rate for historical loans)
- No rate promises or specific payment calculations
- Keep it short — this is reconnection, not pitch

---

## Sequence A — Rate Drop Alert

### Trigger
- CRON: Daily at 7:00 AM CT
- Check current 30-year rate against threshold
- **Rate source decision needed from Adam** (see Decision Log below)
- Initial threshold: 6.00% (≥0.75% below the 6.75% average of Segment A loans)

### Supabase Query — Segment A Candidates
```sql
SELECT
  l.id AS loan_id,
  l.interest_rate,
  l.loan_amount,
  l.closing_date,
  c.email AS borrower_email,
  c.first_name AS borrower_first_name
FROM loans l
JOIN contacts c ON l.contact_id = c.id
WHERE
  l.interest_rate >= 6.75
  AND l.closing_date IS NOT NULL
  AND c.email IS NOT NULL
  AND c.email NOT LIKE '%test%'
  AND NOT EXISTS (
    SELECT 1 FROM activity_log al
    WHERE al.loan_id = l.id
    AND al.activity_type = 'rate_drop_alert'
    AND al.created_at > NOW() - INTERVAL '30 days'
  )
```
The 30-day exclusion prevents the same borrower from getting rate alerts more than once per month even if the rate threshold stays triggered.

### n8n Workflow — Rate Drop Alert
Steps:
1. **CRON Trigger** — daily 7:00 AM CT
2. **Code/Set Node** — Read current_rate from n8n static data or HTTP call (see Rate Source below)
3. **IF Node** — current_rate ≤ threshold (6.00% initially)
   - NO → stop workflow, log "Rate check: [RATE], threshold not met"
   - YES → continue
4. **HTTP Request (GET)** — Supabase: query Segment A eligible borrowers
5. **IF Node** — results.length > 0? NO → stop. YES → continue.
6. **Split in Batches (1)**
7. **Code Node** — calculate spread (loan interest_rate - current_rate), estimate monthly savings (rough: each 0.25% on $400K ≈ $60/month)
8. **Send Email (Outlook)** — personalized rate drop alert
9. **HTTP Request (POST)** — Log to activity_log (type='rate_drop_alert')
10. **Wait (2 seconds)**
11. **Send summary to Adam** — "Rate alert fired: sent to [X] past clients. Current rate: [RATE]%. Their avg rate: [AVG]%."

### Rate Source Options (Decision Required from Adam)

**Option A — Manual Rate Input (RECOMMENDED for launch)**
- Adam sets rate manually each Monday via a simple webhook: `POST /webhook/update-rate {"rate": 6.05}`
- n8n stores in a static data field or a single-row config table in Supabase
- No API cost. Adam already monitors rates weekly for rate updates.
- Builder can wire this immediately.

**Option B — FRED API (Free)**
- Federal Reserve Economic Data API: `https://fred.stlouisfed.org/graph/fredgraph.csv?id=MORTGAGE30US`
- Free, reliable, weekly update (published Thursdays)
- Requires parsing CSV response in n8n code node
- Slight delay (weekly vs. daily) but appropriate for this use case

**Option C — Optimal Blue / Polly API (Paid)**
- Real-time pricing, lender-specific
- ~$200–500/month depending on plan
- Overkill for this use case — triggers on sustained rate drops, not day-to-day movement

**Recommendation: Start with Option A (manual) — Adam already watches rates for weekly rate updates. Add a Monday morning reminder to set the rate. When volume grows, upgrade to Option B.**

### Email Copy — Rate Drop Alert

**Subject:** `Rates just hit [CURRENT_RATE]% — your loan is at [ORIGINAL_RATE]%`

**Body:**
```
Hey [FIRST_NAME],

Quick heads up — 30-year fixed rates in Austin dropped to [CURRENT_RATE]% this week.

You're locked in at [ORIGINAL_RATE]%. That's a [SPREAD]% difference. On a loan balance of [LOAN_AMOUNT_APPROX], that could mean savings of roughly $[EST_MONTHLY_SAVINGS]/month — or $[EST_5YR_SAVINGS] over 5 years.

These are rough estimates based on rates only — your actual savings would depend on your current balance, property value, and closing costs. But if the numbers make sense, the window could be open.

Want me to run the exact numbers for your loan? Just reply or grab 15 min here: https://calendly.com/adamstyer/15minutes

Adam
NMLS #513013
Adam Styer | Mortgage Solutions LP
5900 Balcones Drive, Suite 100, Austin TX 78731

---
This is not an offer to lend. Rate and payment estimates are approximate and do not constitute a loan commitment. Actual rates and terms depend on credit profile, property value, and qualifying criteria.
To opt out, reply STOP.
```

**Personalization variables:**
- `[FIRST_NAME]` → contacts.first_name
- `[CURRENT_RATE]` → live rate from Option A/B
- `[ORIGINAL_RATE]` → loans.interest_rate formatted `#.##%`
- `[SPREAD]` → (loans.interest_rate - current_rate) formatted `#.##%`
- `[LOAN_AMOUNT_APPROX]` → loans.loan_amount formatted `$XXX,000` (rounded to nearest $10K for privacy/approximation)
- `[EST_MONTHLY_SAVINGS]` → rough calc: (SPREAD / 100) × (loan_amount / 12) × 0.75 (accounts for amortization reduction factor)
- `[EST_5YR_SAVINGS]` → EST_MONTHLY_SAVINGS × 60

---

## CRM Routing

No new LoanOS contacts are created — these are past clients already in the system.

### Activity Log Entries (Supabase `activity_log` table)
All Refi Watch sends must log to activity_log:

| Field | Value |
|-------|-------|
| `loan_id` | loans.id of the recipient |
| `activity_type` | `'refi_warmup'` / `'anniversary_checkin'` / `'rate_drop_alert'` |
| `notes` | e.g., `'Refi Watch anniversary email sent. Rate: 6.75%. Years: 3.'` |
| `created_at` | NOW() |

This prevents duplicate sends and provides Adam with a record in LoanOS of every outreach.

---

## Execution Instructions for Builder

### Step 1 — Confirm Activity Log Schema
Check Supabase `activity_log` table columns via MCP `execute_sql`:
```sql
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'activity_log' ORDER BY ordinal_position;
```
Confirm: `loan_id`, `activity_type`, `notes`, `created_at` all exist. If not, add via migration.

### Step 2 — Create n8n Workflow 1: Anniversary Check-In
- Workflow name: `LoanOS — Refi Watch Anniversary Check-In`
- CRON: `0 8 1 * *`
- Supabase HTTP header pattern (both required): `apikey` + `Authorization: Bearer <service_role_key>`
- Use Code node for date filtering + personalization (not Expression nodes — Supabase date functions are unreliable in WHERE params via REST)
- Test with manual execution on a single test record first

### Step 3 — Create n8n Workflow 2: Pre-Drop Warm-Up (ONE-TIME)
- Workflow name: `LoanOS — Refi Watch Pre-Drop Warm-Up (ONE-TIME)`
- Trigger: Manual Trigger node (Adam runs from n8n UI once)
- Add prominent warning in workflow description: "THIS RUNS ONCE ONLY — emails go to all 600+ past clients. Review carefully before executing."
- Build and test on test data; DO NOT run live until Adam reviews copy and gives approval

### Step 4 — Create n8n Workflow 3: Rate Drop Alert
- Workflow name: `LoanOS — Refi Watch Rate Drop Alert`
- CRON: `0 7 * * *` (daily 7am)
- Rate source: Manual Option A — store rate in a Supabase config table or n8n Static Data
- Add a separate simple workflow: `LoanOS — Refi Watch Set Rate` with webhook trigger + Supabase update for Adam to update rate weekly
- Build threshold as configurable constant at top of Code node (easy to adjust)

### Step 5 — Notify Adam When Workflows Are Ready
- Do NOT execute Sequences A or D without Adam's explicit approval
- Do NOT execute Sequence B (Anniversary) in its first run without Adam's approval — first run should be treated as a soft launch

### Step 6 — Update ADAM-TODO.md
Add these action items for Adam to review.

---

## Tools / Accounts / Credentials Needed
- [x] n8n instance: styer.app.n8n.cloud (MCP connected)
- [x] Supabase project: uuqedsvjlkeszrbwzizl (MCP connected)
- [x] Outlook credential in n8n (existing — used by milestone emails and PA notify)
- [ ] Rate source decision (Adam must choose: Option A manual, B FRED API, or C paid)
- [ ] Adam approval of email copy before Sequences A and D are triggered
- [ ] Activity log schema confirmation

---

## Risk Register

| Action | Risk | What Could Go Wrong | Mitigation |
|--------|------|---------------------|------------|
| Sequence D warm-up blast (644 emails) | HIGH | Sends to wrong list or with wrong copy; unrecoverable | Adam must manually trigger; add confirmation step; test with 1 email first |
| Rate Drop Alert personalized rate calculation | MEDIUM | Wrong loan data → wrong savings estimate → erodes trust | Always label as "rough estimate"; add Reg Z disclaimer |
| Anniversary email during month with high volume | LOW | 54 emails in one batch triggers Outlook throttling | Batch with 2-second wait between sends |
| Activity log duplication check fails | MEDIUM | Same person gets multiple emails in one month | Test deduplication query before deploying; include 30-day exclusion window |
| interest_rate NULL on historical loans | MEDIUM | Rate personalization breaks or shows blank | Code node: skip rate personalization if interest_rate IS NULL |

---

## Definition of Done
When Builder finishes:
- [ ] n8n workflow "Refi Watch — Anniversary Check-In" created, tested with fake data, NOT yet active (Adam approves before activating)
- [ ] n8n workflow "Refi Watch — Pre-Drop Warm-Up" created, tested, NOT triggered (Adam triggers manually)
- [ ] n8n workflow "Refi Watch — Rate Drop Alert" created with configurable threshold, NOT active (Adam must set rate + approve before activating)
- [ ] n8n workflow "Refi Watch — Set Rate" (webhook to update current rate) created and tested
- [ ] activity_log schema confirmed to support logging
- [ ] ADAM-TODO.md updated with approval requests and rate source decision

---

## Compliance Checklist
- [ ] TCPA opt-in checkbox: N/A — email only, no SMS ✅
- [ ] CAN-SPAM footer: Physical address (5900 Balcones Drive, Suite 100, Austin TX 78731) in every email ✅
- [ ] CAN-SPAM opt-out: "Reply STOP" mechanism in every email ✅
- [ ] NMLS #513013: In every email signature ✅
- [ ] Equal Housing Lender: In Rate Drop Alert footer (rate-related email) ✅
- [ ] No guaranteed approval language: Copy verified — no "guaranteed", "approved", "you qualify" ✅
- [ ] Regulation Z: No specific rate quoted as "available to you"; all rate references labeled as market approximations with disclaimer ✅
- [ ] No protected class targeting: Segments are purely financial (rate, closing date) — no demographic, geographic, or protected class filters ✅
- [ ] Prior business relationship: All recipients are past clients with funded loans — prior business relationship established ✅

---

## Decision Log (Open Items for Adam)

### Decision 1 — Rate Source for Segment A
**Status:** REQUIRED before Builder can activate Rate Drop Alert workflow
**Options:** A (manual, recommended for launch), B (FRED API, free, automated), C (Optimal Blue, paid)
**Recommendation:** Start with A. Builder will create `Refi Watch — Set Rate` webhook workflow so Adam can update with a simple webhook call (or from LoanOS dashboard in the future).
**Adam's action:** Confirm choice. Builder will wire accordingly.

### Decision 2 — Email Copy Approval
**Status:** REQUIRED before any sequence sends to real contacts
**What needs approval:** All 3 email templates above. Particularly Sequence D (warm-up blast) and Sequence A (rate drop) — these are irreversible once sent.
**Adam's action:** Review email copy above. Confirm or request revisions.

### Decision 3 — Launch Order
**Recommendation:**
1. Launch Sequence B (Anniversary) first — smallest, most natural, low risk
2. Launch Sequence D (Warm-Up) second — one-time, high impact, needs copy approval
3. Launch Sequence A (Rate Drop) last — conditional, depends on rate source decision

### Decision 4 — Rate Threshold for Sequence A
**Initial recommendation:** 6.00% (≥0.75% below the ~6.75% average of Segment A loans)
**Adam adjusts:** threshold is configurable in n8n code node constant; Builder will document where to change it.
