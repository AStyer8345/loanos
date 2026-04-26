# Realtor Relationship Drip Sequence — Spec

**Date:** 2026-04-26
**Author:** Lead Gen Master Orchestrator (autonomous AM session)
**Status:** Ready for Builder. Estimated effort: 3–4 hrs.
**Dependency:** None blocking. Realtor Roster + Acknowledgment webhook already shipped.

---

## Goal

Stay top-of-mind with realtor partners after they send a referral. Three touches over 30 days that thank, give value, and ask for more. No quid-pro-quo language (RESPA — no "thing of value" exchange).

## Trigger

Fires when `contacts.referral_ytd_count` increments (a referral closes and Adam logs it). Same hook as the existing Realtor Acknowledgment webhook (n8n workflow `H5doQYLLIAg0zMug`).

The acknowledgment webhook already sends an immediate "thank you for the referral" email. This drip starts AFTER that — at day 3.

## Cadence

- **Step 1 — Day 3:** Soft check-in. "How's [borrower] doing? Anything they need from me?"
- **Step 2 — Day 10:** Value email. Market data point or rate snapshot. No ask.
- **Step 3 — Day 30:** Referral re-open. "Got another buyer who needs a lender? Here's how I made [borrower] easier to close."

## Compliance Bar

- No reference to compensation, gifts, or marketing trade.
- No "exclusive partnership" language.
- Standard CAN-SPAM footer (NMLS #513013, Equal Housing Lender, physical address, unsubscribe link).
- Realtors must be in `contacts` with `category='realtor'` and `email_opt_out=false`.

## Build Steps

### 1. Supabase: Insert campaign + steps

```sql
-- Campaign
INSERT INTO drip_campaigns (id, org_id, name, slug, status, trigger_type, audience)
VALUES (
  gen_random_uuid(),
  '18613f82-fdd9-42dd-a09e-f3c577328258',
  'Realtor Relationship — Post-Referral',
  'realtor-relationship',
  'active',
  'relative_days',
  'realtor'
)
RETURNING id;
-- save returned UUID for next inserts
```

```sql
-- Steps
INSERT INTO drip_steps (campaign_id, step_order, channel, trigger_config)
VALUES
  ('<campaign_uuid>', 1, 'email', '{"days": 3}'::jsonb),
  ('<campaign_uuid>', 2, 'email', '{"days": 10}'::jsonb),
  ('<campaign_uuid>', 3, 'email', '{"days": 30}'::jsonb);
```

### 2. Code: Add to `authored-emails.ts`

Add new entry to `DRIP_CAMPAIGN_IDS`:

```ts
REALTOR_RELATIONSHIP: '<campaign_uuid_from_step_1>',
```

Add 3 authored emails (subject + plain). Drafts below — refine in voice review:

**Step 1 (Day 3):**
- Subject: `Just checking in on {{first_name_borrower}}`
- Plain: Soft, 4-line body. "Wanted to give you a quick update — [borrower] is at [stage]. Anything you're hearing on their end I should know? Easiest to reply to this email."

**Step 2 (Day 10):**
- Subject: `Quick market data point I thought you'd want`
- Plain: 1 paragraph. Current 30-yr rate, % change vs 30 days ago, what it means for their listings. No ask. Sign-off: "Thought you'd want it. Adam"

**Step 3 (Day 30):**
- Subject: `Got another buyer who needs financing?`
- Plain: 5 lines. Reference [borrower] closing (or current stage). One-sentence value reminder. Direct ask: "If you've got another buyer in the pipeline, send them my way — I'll move fast." Calendly link.

> **Note for Builder:** The borrower name `{{first_name_borrower}}` is NOT currently in the merge-vars built by `/api/drip/run/route.ts` (only `first_name` and `referred_by`). Step 1 either needs the merge-var added to the renderer (read from `contacts.referred_borrower_id` → join contacts → first_name) or the copy needs to be generic. Pick generic for v1 to avoid scope creep — refactor merge-vars in a later session.

### 3. n8n: Trigger enrollment

When `contacts.referral_ytd_count` increments via Adam's manual log or the existing realtor ack webhook, POST to `/api/drip/campaigns/{realtor-relationship-uuid}/enrollments` with the realtor's contact_id. The endpoint already computes `next_send_at` from step 1's `trigger_config.days` (shipped 2026-04-23).

Cleanest path: Add one HTTP Request node to the existing `H5doQYLLIAg0zMug` (Realtor Acknowledgment) workflow. Fire after the ack email sends. `body: {"contact_id": "{{$json.contact_id}}"}`. Use the existing LoanOS Agent Secret credential.

### 4. QA

- Insert one test enrollment manually for a realtor contact in `contacts` (e.g., dev realtor record).
- Wait for next cron tick (`/api/drip/run` hourly via vercel.json) — confirm `drip_sends` row created with `status='sent'`.
- Verify CAN-SPAM footer present in the rendered HTML.
- Confirm enrollment advances `current_step` and `next_send_at` to step 2.
- Manually advance time on a 2nd test enrollment (set `next_send_at` to NOW) — verify step 2 fires correctly.

## Out of Scope (Future)

- Per-realtor performance dashboard (separate from Realtor Roster — already live).
- A/B subject line testing.
- Quarterly market report (Sequence C handles this).
- SMS to realtors (TCPA — same Sendblue blocker as borrower path).

## Files to Touch

- `src/lib/drip/authored-emails.ts` (+ ~70 lines)
- Supabase: 1 INSERT to `drip_campaigns`, 3 INSERTs to `drip_steps`
- n8n: `H5doQYLLIAg0zMug` (add 1 HTTP Request node)

## Reviewer Checklist

- [ ] No quid-pro-quo / "thing of value" language in any of the 3 emails (RESPA)
- [ ] CAN-SPAM footer rendered (existing `buildEmailHtml` handles this)
- [ ] Realtor unsubscribe path works (sets `email_opt_out=true` on contact)
- [ ] All 3 emails read in Adam's voice — short sentences, direct, no fluff
- [ ] Build green; route table unchanged

## ADAM Action Required Before Activation

None. The campaign can ship `status='active'` from day one because:
- Existing realtors are already in `contacts` with `email_opt_out` enforced.
- The realtor ack webhook is the only enrollment path — Adam controls when it fires.
- No new credentials needed.
