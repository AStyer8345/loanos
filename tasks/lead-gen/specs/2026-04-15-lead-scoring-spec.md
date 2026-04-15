# Lead Scoring System — Spec
Date: 2026-04-15
Author: Lead Gen AM Agent
Status: SPEC — Ready for Architect review before build

---

## Problem

LoanOS captures leads from 5+ entry points. Today, all leads are treated identically — no signal about who is hot, warm, or cold. Adam spends time on leads that have booked consultations while cold leads sit in the same queue. Speed-to-lead is the biggest ROI lever in mortgage origination; a 5-minute call vs a 60-minute call doubles conversion probability.

## Goal

Score every contact in LoanOS on a 0–100 scale. Route scores to Adam's UI and n8n so hot leads get an immediate notification, warm leads enter accelerated nurture, and cold leads go on long-term drip.

---

## Signal Inventory

Signals are computed from the `activity_log` table (action column) and `contacts` table.

| Signal | Points | Rationale |
|--------|--------|-----------|
| Calendly booking (`calendly_booking`) | +20 | Highest intent. Prospect allocated time. |
| Pre-approval form submitted (`pre_approval_lead`) | +10 | Active purchase intent. Form asks for loan goal. |
| Refi Watch enrollment (rate_alert tag in Mailchimp) | +8 | Aware of refinance, tracking rates. Medium intent. |
| Rate alert signup (`quick-quote-lead` / `rate-alert` tag) | +5 | Interest in rates, early funnel. |
| Quick Quote or Quick Contact form (`web_lead_created`) | +3 | Site visitor engagement, lowest barrier. |
| Calendly cancellation (`calendly_canceled`) | -5 | Cancelled without rescheduling — cooling signal. |
| Application link clicked (if trackable) | +15 | Strong purchase intent. |

**Note on email engagement:** Mailchimp open/click tracking is not currently fed to LoanOS activity_log. Adding this requires a Mailchimp webhook → n8n pipeline. Deferred — can be added once journey emails are active.

---

## Score Tiers

| Tier | Score Range | Label | Routing |
|------|-------------|-------|---------|
| 🔥 Hot | 20–100 | Hot | Immediate Adam notification (n8n within 5 min) |
| 🟡 Warm | 10–19 | Warm | Accelerated Mailchimp sequence (3-day first touch) |
| ❄️ Cold | 3–9 | Cold | Standard 60-day drip |
| ⬜ New | 0–2 | New | Lead captured, not yet scored |

---

## Data Model

### Option A: Computed Column in contacts (recommended)

Add a `lead_score` integer column to the `contacts` table. Score is recomputed via n8n after every `activity_log` insert that changes score.

```sql
-- Migration: add lead_score to contacts
ALTER TABLE contacts ADD COLUMN lead_score INTEGER NOT NULL DEFAULT 0;
ALTER TABLE contacts ADD COLUMN lead_tier TEXT GENERATED ALWAYS AS (
  CASE
    WHEN lead_score >= 20 THEN 'hot'
    WHEN lead_score >= 10 THEN 'warm'
    WHEN lead_score >= 3  THEN 'cold'
    ELSE 'new'
  END
) STORED;
```

Score update flow:
1. Activity event fires → n8n webhook triggers
2. n8n queries all scored actions for that contact_id from activity_log
3. Sum up points per signal table above
4. PATCH contacts.lead_score with new value

### Option B: Computed on read (no DB write)

Query is: `SELECT contact_id, SUM(points) FROM activity_log WHERE contact_id = X AND action IN (...)` on every page load. Simpler — no migration needed. Risk: performance at scale (2,441 contacts × API calls).

**Recommendation: Option A.** Score persists, powers sorting/filtering in pipeline view, enables n8n triggers on threshold crossing.

---

## n8n Implementation Plan

### Workflow: "LoanOS — Lead Score Updater"
- **Trigger:** Webhook (called after each activity_log insert that carries a scoring signal)
- **Nodes:**
  1. Webhook Trigger — receives `{contact_id, action}`
  2. Lookup Score Table (Code node) — maps action → points
  3. Get All Scored Actions (HTTP → Supabase) — `SELECT action, created_at FROM activity_log WHERE contact_id = X AND action IN (scored_actions)`
  4. Compute Score (Code node) — sum points, clamp 0–100
  5. PATCH contacts (HTTP → Supabase) — update lead_score
  6. Check Tier Change (IF node) — if new score ≥ 20 AND previous < 20 → fire hot lead notification
  7. Notify Adam (Outlook) — "New hot lead: [name], score [X], source [action]"

- **Estimated build time:** 2-3 hours
- **Risk:** Low — read/write only, no emails to leads

### Who Triggers the Webhook?
The `subscribe-lead.js` Netlify function already calls `/api/contacts/web-lead` when a form is submitted. That route creates a contact AND logs `contact_created` to activity_log. A Supabase DB hook (or a call added to the route) can fire the score-update webhook.

Simplest path: Add a call to score-update webhook at the end of the `/api/contacts/web-lead` POST handler in `src/app/api/contacts/web-lead/route.ts`.

---

## Dashboard Integration

Add a `Lead Score` column to the pipeline view (`/dashboard/pipeline`). Sort by score descending by default. Color-code rows: red (hot) / yellow (warm) / gray (cold).

Also: add score badge to the contact detail page header.

---

## Adam Action Required

- **Confirm Seq A threshold** (currently 6.00%) — appropriate? Or move to 6.25% given current 6.37% market?
- **Confirm lead tier routing** — should hot leads (score ≥ 20) trigger an SMS to Adam's phone in addition to email? (TCPA does not restrict texting a loan officer's own phone)
- **Approve Option A (DB column) vs Option B (computed)** — preference?

---

## Build Sequence (when approved)

1. Migration: `ALTER TABLE contacts ADD COLUMN lead_score INTEGER DEFAULT 0` + tier generated column
2. Build n8n workflow "Lead Score Updater" (webhook trigger + score logic + notify)
3. Wire webhook call into `/api/contacts/web-lead/route.ts`
4. Add lead_score column to pipeline table UI
5. Add score badge to contact detail page
6. Backfill existing contacts from activity_log

**Estimated total build time:** 1 focused session (4–5 hours)
