# Realtor Relationships Drip — Activation Spec (Architect-Mode)

**Authored:** 2026-05-14 AM (autonomous, scheduled task)
**Domain:** Lead Generation
**Campaign:** `Realtor Relationships` (Supabase `drip_campaigns.id = ef52ed56-8a22-4d15-9f12-a1796ccf17b6`, status=`active`, audience=`realtor`, org=Adam Styer | Mortgage Solutions LP)
**Drafts source:** `tasks/lead-gen/drafts/2026-04-30-realtor-relationships-email-bodies.md` (4 bodies, peer-to-peer voice-aligned)
**Goal of this spec:** Re-cast the two ADAM-TODO 2026-04-27 #2 open questions (cadence + activation criterion) in the context of what the drip pipeline can actually fire **today**, and propose a Phase-1 ship-now plan + Phase-2 deferred plan.

---

## 1. Why this spec exists

The 04-27 ADAM-TODO entry framed activation as "Adam needs to make 2 cadence decisions before Builder ships." That framing **is wrong** — the gating constraint is not Adam's cadence decision, it's the trigger pipeline. Two of the 4 steps' trigger types (`annual_date`, `condition`) have no evaluator implementation, so even with Adam's decisions, those steps can't fire on a `next_send_at` schedule today.

The 04-30 drafts also assume 4 contact-record merge tags that **do not exist as columns**: `transaction_address`, `transaction_buyer_name`, `deal_count`, `first_deal_date`. They must be JOIN-resolved from `loans` at send-time, which requires a resolver extension.

This spec re-prioritizes the work: ship the realtor channel under simpler trigger semantics first, prove that emails actually land + get reply-rates worth measuring, then build the harder trigger types if engagement justifies.

---

## 2. Read-only state findings (2026-05-14 03:55 CDT)

### 2.1 Realtor universe (Adam's org)

| Pool | Definition | Count |
|---|---|---|
| Total realtors in CRM | `contacts.contact_type='realtor'` | **1,059** |
| Pool A — "active referrer YTD" | + `referral_ytd_count > 0` | **24** (was 28 per 04-27 — reclassification overnight, normal) |
| Pool B — "1+ linked closed deal" | At least 1 `loans` row with `status IN ('Closed','LOAN_FUNDED') AND buyer_agent_contact_id = contact.id` | **158 distinct realtors** |
| Pool C — full closed-loan inventory | All closed loans irrespective of linkage | 753 (368 linked, 385 unlinked-by-string-only) |

**Implication:** Pool A is what 04-27 audit assumed. Pool B is the actually-loan-anchored universe — it's the only pool where Step 1 (Deal Anniversary, requires `first_deal_date`) can fire without a NULL merge tag.

### 2.2 Drip system live state

| Metric | Value | Source |
|---|---|---|
| `drip_enrollments` total (org-wide, all campaigns) | **0** | `SELECT COUNT(*) FROM drip_enrollments WHERE org_id=...` |
| `drip_sends` total (org-wide) | **0** | same — campaign system has fired exactly zero emails since shipping 2026-04-02 |
| `Realtor Relationships` enrollments | **0** | same |

→ **Zero-state confirmed.** Any new structure has no rollback risk on this campaign; nothing is in motion.

### 2.3 What the run-route actually supports today

`src/app/api/drip/run/route.ts` lines 119-129 compute `next_send_at` only for `relative_days` triggers:

```ts
const nextTrigger = (nextStepRow?.trigger_config as unknown as TriggerConfig | null)
const nextSendAt = typeof nextTrigger?.days === 'number'
  ? new Date(new Date(row.enrolled_at).getTime() + nextTrigger.days * 86400000).toISOString()
  : null
```

| Trigger Type | Pipeline status | Evidence |
|---|---|---|
| `relative_days` | ✅ Working | Used live by 5 lead campaigns (PA Welcome, DPA, Ghost Referral, Incomplete App, Went Quiet) |
| `annual_date` | ❌ Unimplemented — `next_send_at` returns `null`, enrollment moves to `completed` after first step | No evaluator for `trigger_config.date_field='first_deal_date'` or `'holiday_thanksgiving'`; no US holiday calendar lookup; anchor-date resolver doesn't exist |
| `condition` | ❌ Unimplemented — same null-trigger fallthrough | No worker watches `loans` for `deals_milestone:5` crossings; no event-driven enrollment path exists |

→ **Steps 1, 2, 4 (as currently specified in `drip_steps`) cannot fire on schedule today.** Only Step 3 (`relative_days: 180`) would fire under the current trigger pipeline.

### 2.4 Merge-tag resolver coverage

`drip-render.ts` `renderDripHtml(plain, vars)` is generic — it substitutes any `{{key}}` present in `vars`. The bottleneck is upstream in `run/route.ts` line 112-115, which only populates `first_name` + `referred_by`:

```ts
const vars: Record<string, string> = {
  first_name: row.contact_first_name ?? '',
  referred_by: referredBy,
}
```

To support the 4 realtor merge tags, run-route needs a JOIN on `loans` keyed by `buyer_agent_contact_id = row.contact_id` before computing `vars`.

---

## 3. Phase-1 plan — ship this week (relative_days only)

**Goal:** Get the 158-realtor Pool B enrolled in a working sequence within 1 Builder session (~60 min).

### 3.1 Step redesign (all `relative_days`)

Re-author the 4 steps so every trigger is `relative_days` against `enrollment.enrolled_at`. Anchor day-0 to "first business day after enrollment" so realtors don't get a Monday-morning enrollment send on Sunday.

| Step | Original trigger | Phase-1 trigger | Days from enrollment | Justification |
|---|---|---|---|---|
| 1. Deal Anniversary | `annual_date` on `first_deal_date` | `relative_days: 0` | 0 | Send the appreciation note immediately on enrollment. The "anniversary" framing in subject line still resonates because Pool B is enrolled-with-a-closed-deal — Adam can still reference the specific transaction in copy. |
| 2. Milestone Celebration | `condition` on `deals_milestone:5` | `relative_days: 90` | 90 | 3-month follow-up. Subject re-anchored to "deal count" pulled at send-time — `{{deal_count}}` works regardless of crossing milestone. |
| 3. Co-Marketing Offer | `relative_days: 180` | `relative_days: 180` | 180 | Unchanged. Already works. |
| 4. Holiday (Thanksgiving) | `annual_date` on `holiday_thanksgiving` | `relative_days: 270` | 270 | 9-month follow-up. Subject re-anchored to "year-end check-in" (drop Thanksgiving framing — fires year-round, not Nov 4th week). |

**Cadence rationale:** 0/90/180/270 = roughly quarterly. Aligns with the campaign description ("3-4 touchpoints/year for referral partners"). After day 270 the enrollment marks `completed` and the realtor exits — Phase-2 re-enrolls them annually if/when those triggers ship.

### 3.2 Activation criterion (Phase-1)

**Recommendation: Pool B batch enroll, gated on email_opt_out + bounce history.**

```sql
INSERT INTO drip_enrollments (org_id, campaign_id, contact_id, status, enrolled_at, enrolled_by, current_step, next_send_at)
SELECT DISTINCT
  '18613f82-fdd9-42dd-a09e-f3c577328258' AS org_id,
  'ef52ed56-8a22-4d15-9f12-a1796ccf17b6' AS campaign_id,
  l.buyer_agent_contact_id AS contact_id,
  'active' AS status,
  NOW() AS enrolled_at,
  'auto' AS enrolled_by,
  0 AS current_step,
  NOW() AS next_send_at  -- Step 1 fires on next cron tick
FROM loans l
JOIN contacts c ON c.id = l.buyer_agent_contact_id
WHERE l.organization_id = '18613f82-fdd9-42dd-a09e-f3c577328258'
  AND l.status IN ('Closed','LOAN_FUNDED')
  AND l.buyer_agent_contact_id IS NOT NULL
  AND c.contact_type = 'realtor'
  AND COALESCE(c.email_opt_out, false) = false
  AND c.email IS NOT NULL
  AND c.email <> ''
  AND NOT EXISTS (
    SELECT 1 FROM activity_log a
    WHERE a.contact_id = c.id
      AND a.event_type IN ('email.bounced','email.complained')
      AND a.created_at > NOW() - INTERVAL '90 days'
  );
```

**Why batch + Pool B not Pool A:**
- Pool A (24 referrers YTD) is too small a sample to validate engagement. 24 sends does not meaningfully signal whether the channel works.
- Pool B (158 distinct realtors) is everyone who's actually sent Adam a deal that funded. The CRM is the source of truth — `referral_ytd_count` is a derived YTD aggregate that misses anyone who funded a deal pre-Jan 1 but hasn't sent another in 2026.
- Batch enrollment + 0/90/180/270 cadence = entire 158 cohort gets the sequence in roughly the next 9 months. Spread risk: if 158 send-1s all bounce, the bounce-90 day exit rule already handles it; if reply rate is high, Adam learns within the first week.

**Alternative if Adam prefers smaller pilot:** filter to `closing_date > NOW() - INTERVAL '24 months'` — gives ~50-80 realtors with more recent transactions. Cleaner anchor for "one year ago" subject line.

### 3.3 Merge-tag resolver extension

`src/app/api/drip/run/route.ts` — add after line 67 contact/activity fetch, before the vars block (line 112):

```ts
// Realtor campaigns need closed-loan context. Fetch most-recent closed deal
// keyed by buyer_agent_contact_id, plus a count for milestone copy.
let realtorContext: {
  transaction_address: string
  transaction_buyer_name: string
  deal_count: string
  first_deal_date: string
} | null = null

if (row.campaign_id === DRIP_CAMPAIGN_IDS.REALTOR_RELATIONSHIPS) {
  const [{ data: lastDeal }, { data: dealCountRow }, { data: firstDeal }] = await Promise.all([
    supabase
      .from('loans')
      .select('property_address, borrower_name, closing_date')
      .eq('organization_id', row.org_id)
      .eq('buyer_agent_contact_id', row.contact_id)
      .in('status', ['Closed', 'LOAN_FUNDED'])
      .order('closing_date', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('loans')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', row.org_id)
      .eq('buyer_agent_contact_id', row.contact_id)
      .in('status', ['Closed', 'LOAN_FUNDED']),
    supabase
      .from('loans')
      .select('closing_date')
      .eq('organization_id', row.org_id)
      .eq('buyer_agent_contact_id', row.contact_id)
      .in('status', ['Closed', 'LOAN_FUNDED'])
      .order('closing_date', { ascending: true })
      .limit(1)
      .maybeSingle(),
  ])
  realtorContext = {
    transaction_address: lastDeal?.property_address ?? '',
    transaction_buyer_name: lastDeal?.borrower_name ?? '',
    deal_count: String(dealCountRow ?? 0),
    first_deal_date: firstDeal?.closing_date
      ? new Date(firstDeal.closing_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : '',
  }
}
```

Then extend `vars` (replace line 112-115):

```ts
const vars: Record<string, string> = {
  first_name: row.contact_first_name ?? '',
  referred_by: referredBy,
  ...(realtorContext ?? {}),
}
```

Also add `REALTOR_RELATIONSHIPS` to `DRIP_CAMPAIGN_IDS` in `src/lib/drip/authored-emails.ts` line 16-22 (currently absent).

### 3.4 Email body adjustments

The 04-30 drafts are mostly transferable, but Step 2 + Step 4 need subject/intro line tweaks because the trigger framing changes from `condition`/`annual_date` to time-since-enrollment.

| Step | Original subject (04-30) | Phase-1 subject |
|---|---|---|
| 1 | "One year ago — our first closing" | **"Quick note about {{transaction_address}}"** — drops "one year ago" since enrollment isn't time-anchored to first deal |
| 2 | "{{deal_count}} closings in — that's not nothing" | **Unchanged** — `{{deal_count}}` resolves to current count, framing still works |
| 3 | "Want me to make you something?" | **Unchanged** |
| 4 | "Thanksgiving" | **"Year-end check-in"** — fires at enrollment + 270 days, not on calendar |

Body-text reanchor for Step 1 (replaces first 3 lines of draft):

```
Hi {{first_name}},

Pulling up your file just now — {{transaction_address}} for {{transaction_buyer_name}} was your most recent closing with me.

That was the start of this. Wanted to say thanks.
```

Step 4 first paragraph reanchor:

```
Hi {{first_name}},

No pitch, no ask. End-of-cycle check-in.

The business takes more than most clients see, and the realtor-LO partnership runs on a kind of trust that's easy to miss until it breaks. I'm grateful you trust me with your buyers. I don't take that for granted.

Hope things are good on your side.

Adam
```

### 3.5 Trigger-pipeline change to drip_steps

Builder needs ONE migration to flip Steps 1, 2, 4 to `relative_days`:

```sql
UPDATE drip_steps
SET trigger_type = 'relative_days',
    trigger_config = '{"days": 0}'::jsonb,
    updated_at = NOW()
WHERE campaign_id = 'ef52ed56-8a22-4d15-9f12-a1796ccf17b6' AND step_order = 1;

UPDATE drip_steps
SET trigger_type = 'relative_days',
    trigger_config = '{"days": 90}'::jsonb,
    updated_at = NOW()
WHERE campaign_id = 'ef52ed56-8a22-4d15-9f12-a1796ccf17b6' AND step_order = 2;

-- Step 3 unchanged (already relative_days:180)

UPDATE drip_steps
SET trigger_type = 'relative_days',
    trigger_config = '{"days": 270}'::jsonb,
    updated_at = NOW()
WHERE campaign_id = 'ef52ed56-8a22-4d15-9f12-a1796ccf17b6' AND step_order = 4;
```

`requires_approval` flags can stay as-is (`true` on Steps 2 + 3, `false` on Steps 1 + 4) — that gates whether the send goes out automatically or queues for Adam review. Recommendation: **flip all 4 to `requires_approval: false`** for Phase-1 to actually test deliverability + engagement; otherwise the queue piles up unread.

---

## 4. Phase-2 plan — defer (build full trigger pipeline if Phase-1 engagement justifies)

**Trigger criteria for starting Phase-2:** ≥30% open rate + ≥3% reply rate across Phase-1's first 50 sends. If lower, the channel isn't worth the extra build investment — fold it into general PA Welcome / GBP-driven follow-ups instead.

### 4.1 What Phase-2 builds (estimate: ~3 hours Builder)

1. **`annual_date` trigger evaluator** in `get_due_drip_enrollments` RPC (Supabase function): when `trigger_config.date_field='first_deal_date'`, JOIN loans to compute anchor + check if today matches (month/day across years). Same pattern for `holiday_thanksgiving` → hardcoded US holiday calendar.
2. **`condition` trigger evaluator** — separate cron worker that watches `loans` for state changes and triggers enrollment-advance when `deals_milestone:5,10,15...` crosses. Or simpler: a Postgres trigger on `loans` UPDATE → INSERT into `drip_enrollments` for milestone steps.
3. **Restructure `drip_steps` back to original 4-trigger plan.** Re-enroll Pool B with annual cadence so Step 1 fires on actual deal anniversaries going forward.

### 4.2 Open question Phase-2 doesn't solve

The voice-guide-edge call-out from drafts §161 ("correspondent lender" positioning) — Phase-2 isn't a change-driver here. Adam can decide independently of trigger pipeline whether to surface that framing in Step 1 / Step 2. Default = leave out (peer-to-peer doesn't need it).

---

## 5. Adam decisions needed for Phase-1 (3 questions, ~5 min)

| # | Question | Default if no answer | Builder ships with default if Adam silent 7+ days |
|---|---|---|---|
| 1 | **Activation pool:** Pool B (158 realtors with linked closed deal) or Pool B-recent (~50-80, last 24 months only)? | **Pool B full** — broader engagement sample | Yes |
| 2 | **All 4 steps `requires_approval: false` for Phase-1** (auto-send), or queue for Adam review? | **`false` (auto-send)** — otherwise queue won't move, Phase-1 doesn't validate anything | Yes |
| 3 | **Step 2 + Step 4 copy reanchor** as proposed in § 3.4 (drops "one year ago" + "Thanksgiving" framing)? | **Yes, as written** | Yes |

If Adam wants something different on any of these, the build path doesn't change — just the param values. Total decision time: 5 minutes.

---

## 6. Risk assessment

| Row | Risk | Severity | Mitigation |
|---|---|---|---|
| 1 | Mass-enrollment send to 158 realtors triggers spam complaints | LOW | Pool B is realtors Adam has closed deals with — pre-existing business relationship. CAN-SPAM physical address + unsubscribe link added by `buildEmailHtml()`. |
| 2 | `transaction_address` or `transaction_buyer_name` resolves to empty string and email reads "Pulling up your file just now — for was your most recent closing" | MEDIUM | Resolver code in § 3.3 falls back to empty string on NULL. Add a check before send: skip if both `transaction_address` AND `transaction_buyer_name` are empty (Pool B pre-filter ensures this is rare). |
| 3 | Bounce/complaint cascade burns sender reputation (Resend domain) | LOW | Exit-rule pre-check in run-route line 70-89 already skips contacts with bounce/complaint in last 30 days. Phase-1 SQL also pre-filters at enroll time (90-day bounce). |
| 4 | Realtors flag email as "not interested" → unsubscribe spike | LOW | Expected outcome of any channel re-activation. Track unsubscribe rate as a Phase-1 success criterion (< 5% is healthy). |
| 5 | Cron `/api/drip/run` blocked on missing `CRON_SECRET` in Vercel | RESOLVED | Adam set `CRON_SECRET` 2026-04-23 (ADAM-TODO line `[LEAD-GEN] 2026-04-23` marked `[x]`). Verified working in 04-27 audit. |
| 6 | Realtor JOIN query for 158 contacts at send time slows cron tick | LOW | Each tick processes only enrollments due NOW. With 0/90/180/270 spread and 158 total, max ~158 sends ever per realtor cohort over 9 months. Three serial queries per send × ~5 enrollments per cron tick = ~15 DB roundtrips/tick worst case. Run-route already does similar work for lead campaigns. |
| 7 | Pool B includes realtors Adam doesn't want re-engaged (e.g., ones who burned a deal) | MEDIUM | Add a manual hold-list pre-filter. § 7 below. |

---

## 7. Builder execution checklist (Phase-1)

1. Add `REALTOR_RELATIONSHIPS: 'ef52ed56-8a22-4d15-9f12-a1796ccf17b6'` to `DRIP_CAMPAIGN_IDS` in `src/lib/drip/authored-emails.ts`.
2. Append `[DRIP_CAMPAIGN_IDS.REALTOR_RELATIONSHIPS]: { 1: {...}, 2: {...}, 3: {...}, 4: {...} }` to `AUTHORED_EMAILS` using the 04-30 drafts with § 3.4 subject/intro adjustments.
3. In `src/app/api/drip/run/route.ts` — add the realtor-context block from § 3.3 after the contactData fetch; extend `vars` with `realtorContext` spread.
4. Run the 3 UPDATE statements from § 3.5 against prod Supabase to flip trigger types on Steps 1, 2, 4.
5. Optionally: flip all 4 steps' `requires_approval` to `false` (1 UPDATE) per Adam decision #2.
6. Build the Phase-1 SQL from § 3.2 — **do not execute yet**. Output a count-only dry-run first: replace `INSERT INTO ... SELECT` with `SELECT COUNT(DISTINCT buyer_agent_contact_id) ...` to confirm cohort size (~140-160 expected).
7. If count looks right and Adam green-lights pool choice (decision #1), run the actual INSERT.
8. Hand-test: pick one enrolled realtor → confirm `next_send_at` is NOW or future → wait for cron tick → confirm `drip_sends` row appears with `status='sent'` + populated `generated_subject` + `generated_body` containing real `{{transaction_address}}`.
9. Pre-push: `npm run build` from `loanos-clone` must pass.
10. After deploy: confirm Vercel build READY. Watch first cron tick (`/api/drip/run` hourly) → verify `stats.processed` and `stats.sent` increment.
11. After Day 7: pull engagement metrics (open rate, click rate, reply rate, unsubscribe rate, bounce rate) from `activity_log` joined to `drip_sends`. Surface in a 2026-05-22 follow-up ADAM-TODO line: ship Phase-2 if metrics justify.
12. Flip THIS ADAM-TODO line to `[x]` + flip the 04-27 ADAM-TODO #2 line to `[x]` (same session).

---

## 8. Out-of-scope (kept deferred)

- **Long-Term Nurture** (campaign `7fd91187-8a2b-4edd-8c0b-ff3c5a9de109`) — separate 04-27 ADAM-TODO line, separate authoring loop.
- **Past Client Retention** (`92706ea7-77ce-4097-9d67-7b3e60ddab7a`) — same.
- **Realtor onboarding flow** (different from Realtor Relationships — onboarding is for first-time partner pickup; Relationships is for already-converted partners). Not currently a campaign.
- **GBP review request integration** — already shipped as a separate n8n workflow (`AK1fBcaX1cPcdlGx`), not part of this campaign.
- **Annual re-enrollment loop** — depends on Phase-2 trigger pipeline; explicit Phase-2 deliverable.

---

## 9. After this ships

Once Phase-1 is live and ≥1 send has fired with a non-empty `generated_body`:
- BLOCKER side: closes the 04-27 ADAM-TODO #2 cadence/activation question.
- Forward-rule pivot: lead-gen agent shifts back to either (a) `/austin-mortgage-rates.html` audit, (b) PA-funnel GSC/GA4 traffic analysis, or (c) Long-Term Nurture / Past Client Retention authoring sessions (each closes a different 04-27 ADAM-TODO line).
- GOALS.md alignment: "Drip campaigns — not working the way they should. Spend time this week fixing so Scott and I can both use them. Critical for beta utility." → this spec is the first concrete diagnostic + fix proposal addressing that priority since GOALS.md was last refreshed 2026-04-20.

---

## 10. Files referenced

| File | Purpose |
|---|---|
| `src/app/api/drip/run/route.ts` | Cron handler — add merge-tag resolver block |
| `src/lib/drip/authored-emails.ts` | Add 4 realtor email bodies + REALTOR_RELATIONSHIPS campaign key |
| `src/lib/workflows/drip-render.ts` | No changes — generic `{{var}}` substitution already works |
| `src/lib/drip/types.ts` | No changes — types support the trigger types already |
| `tasks/lead-gen/drafts/2026-04-30-realtor-relationships-email-bodies.md` | Source drafts (use with § 3.4 adjustments) |
| Supabase `drip_steps` | 3 UPDATEs to flip Steps 1/2/4 trigger_type |
| Supabase `drip_enrollments` | 1 batch INSERT of ~140-160 realtors |

---

## 11. Pipeline baseline (read-only, 2026-05-14 03:55 CDT)

13th consecutive baseline. Functionally identical to all prior. `drip_sends_total=0`, `drip_enrollments_total=0`. `lead_source='Pre-Approval Funnel'=0` (22nd day), `'Rate Alert Funnel'=0` (46 days), `'Quick Quote'=0` (90d), `'Quick Contact'=0` (90d), `'Website'=8 (90d, unchanged)`, `'AEO'=4 (90d, unchanged)`, `'Web Lead'=2 (90d)`, NULL=`1393 (90d)` (unchanged per 05-11 diagnostic, expected — Arive + Scott pilot + manual realtor inserts). Signal: drip channel still at 0/0; this spec is the first attempt to break that streak.
