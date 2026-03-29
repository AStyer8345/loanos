# Research: Automation Coverage Audit — LoanOS CRM
Date: 2026-03-27
Researcher: CRM Research Subagent (PM session)

## Executive Summary

LoanOS has solid automation coverage for the top of funnel (lead intake, referral intro, pre-approval email) and the bottom (post-close review request, drip nurture for pre-approval leads). The core Arive → Supabase sync pipeline (WF1 + WF2) is active and mature as of today. The biggest gaps are in the mid-funnel milestone events (rate lock, appraisal, UW submission, CTC, closing scheduled) and in post-close relationship touchpoints (30-day check-in, 1-year anniversary, rate watch). These gaps are high-impact because they represent the moments borrowers are most anxious — and where competitors with better automation win referrals. Schema data is solid: `pre_approval_expiry_date`, `rate_lock_expiration`, `funding_date`, `closing_date`, `birthdate`, `email_opt_out`, and `do_not_call` are all live. The drip system infrastructure (drip_campaigns / drip_steps / drip_enrollments) exists and has one active campaign (Pre-Approval Welcome Series, 6 steps, 0 active enrollments). All 15 core LoanOS n8n workflows are confirmed Active. Four structural questions require Adam's decision before building the mid-funnel milestone chain.

---

## n8n Workflow Live Status (Verified 2026-03-27)

| Workflow | ID | Confirmed Status |
|----------|----|----|
| LoanOS — Arive New Loan → Supabase | 1tagvoU0UXtdDiMY | ✅ Active |
| LoanOS — Arive Status Update → Supabase | 9JyzzwKac8v3uQ7d | ✅ Active (updated today — closing_date + contact rate sync) |
| LoanOS — Referral Intro Email | YbgDnTpPdefcazKy | ✅ Active |
| LoanOS — Pre-Approval Email | utMvZpkdRwIRZ51u | ✅ Active |
| LoanOS — Final CD Email | SkzrWeR0bHZs8kWX | ✅ Active |
| LoanOS — New Application Received | cWESnXXy9UOLB13q | ✅ Active |
| LoanOS — Contract Received | UfNcdpoVKQZqy0fj | ✅ Active |
| LoanOS — Refi Intake Email | yCTydQ7RfZK4DyUg | ✅ Active |
| LoanOS — Inbound Email → Supabase Log | qgb99Eh2ziy0INMk | ✅ Active (updated today — org_id fix + loan linking) |
| LoanOS — Web Lead Automation | PiuIsQpBuydtFM4m | ✅ Active |
| LoanOS — Drip Email Scheduler | LqBb3YDLjS2eUrDE | ✅ Active |
| LoanOS — iMessage → Supabase Log | nccX5ml82mMGyE9T | ✅ Active |
| Closed Loan — Review Request Email | AK1fBcaX1cPcdlGx | ✅ Active |
| LoanOS — Pre-Approval Lead Notify | J9Pe24vUi6fpZtdZ | ✅ Active (was Inactive — now Active as of 2026-03-27) |
| Website — FTB Guide Welcome Email | yTkiV6pf2eZaJw82 | ✅ Active |
| Weekly GBP + Social Post | V6RhmJpOb7pOzMte | ✅ Active |
| Weekly Testimonial Social Post | eJG4wckrj6SmSpm1 | ✅ Active |
| LoanOS — Milestone Communication Agent | 1hjOmS7inZcxEJQr | 🗄️ Archived (overlaps with Arive) |
| LoanOS — Outlook Email Sync | JMmstRl2C5ylmuIY | 🗄️ Archived (redundant with WF4) |
| TEMP - List Mailchimp Journeys | 5CkBP28mJSZCJjxl | 🗄️ Archived |

**Key data points from Supabase (live):**
- Activity log entries (last 30 days): **466**
- Milestone events in `loan_milestone_events`: **1 record** (milestone: `conditional_approval`) — nearly empty; Arive webhooks are the real milestone source
- Contact sources: only `arive_webhook` appears in the `source` column — all other contacts have NULL source
- Drip campaigns: 1 active — "Pre-Approval Welcome Series" (6 steps, 60-day sequence) — **0 active enrollments**
- Loan status distribution: 741 Closed, 25 Started, 19 Cancelled, 13 funded, 9 On Hold — confirms this is primarily a historical closed-loan database plus ~20-30 active loans

---

## Coverage Map

### LEAD INTAKE

| Event | Coverage | Workflow | Notes |
|-------|----------|----------|-------|
| Website lead form submitted | LIVE | LoanOS — Web Lead Automation (`PiuIsQpBuydtFM4m`) | Creates contact, sends confirmation email, alerts Adam via Outlook |
| FTB guide download (website) | LIVE | Website — FTB Guide Welcome Email (`yTkiV6pf2eZaJw82`) | Sends welcome email to guide subscribers |
| Pre-approval funnel lead (website) | LIVE | LoanOS — Pre-Approval Lead Notify (`J9Pe24vUi6fpZtdZ`) | Tags Mailchimp, notifies Adam |
| Referral received from realtor | LIVE | LoanOS — Referral Intro Email (`YbgDnTpPdefcazKy`) | Sends personalized intro email |
| Refi inquiry | LIVE | LoanOS — Refi Intake Email (`yCTydQ7RfZK4DyUg`) | Sends intake email to collect refi info |
| Inbound phone/walk-in lead | NONE | — | No automation; manual CRM entry only |
| Realtor referral — realtor notification | NONE | — | Referral intro goes to borrower, but no "we received your referral" touchpoint to the realtor |

### PRE-APPROVAL

| Event | Coverage | Workflow | Notes |
|-------|----------|----------|-------|
| Pre-approval granted | LIVE | LoanOS — Pre-Approval Email (`utMvZpkdRwIRZ51u`) | Congratulations email with approval details |
| Pre-approval nurture drip | LIVE (no active enrollments) | LoanOS — Drip Email Scheduler (`LqBb3YDLjS2eUrDE`) + "Pre-Approval Welcome Series" campaign | 6 emails / 60 days. Infrastructure built. 0 active enrollments — enrollment trigger not wired |
| Pre-approval expiring (14-day warning) | NONE | — | `pre_approval_expiry_date` column exists on loans table. No scheduled check or trigger built |
| Pre-approval expired (action required) | NONE | — | No automation; no alert to Adam or borrower |
| Pre-approval extension granted | NONE | — | No automation |

### UNDER CONTRACT

| Event | Coverage | Workflow | Notes |
|-------|----------|----------|-------|
| Contract received (PDF) | LIVE | LoanOS — Contract Received (`UfNcdpoVKQZqy0fj`) | Extracts contract fields, logs to LoanOS |
| Application completed (1003) | LIVE | LoanOS — New Application Received (`cWESnXXy9UOLB13q`) | Logs borrower info, notifies Adam |
| Option period expiring | NONE | — | `option_expiration` column exists on loans. No trigger |
| Earnest money deadline | NONE | — | `earnest_money` stored, no date-based alert |

### IN PROCESS

| Event | Coverage | Workflow | Notes |
|-------|----------|----------|-------|
| Rate locked | NONE | — | `rate_lock_date` + `rate_lock_expiration` columns exist. WF2 syncs from Arive but no outbound communication to borrower on lock |
| Rate lock expiring (5-day warning) | NONE | — | `rate_lock_expiration` column exists. No scheduled check |
| Appraisal ordered | NONE | — | `appraisal_ordered_date` column exists. No borrower communication |
| Appraisal received / completed | NONE | — | `appraisal_delivery_date` + `appraisal_date` exist. No trigger |
| UW submission | NONE | — | `submission_date` column exists. No borrower update |
| Conditional UW approval | PARTIAL — data only | WF2 (`9JyzzwKac8v3uQ7d`) + `loan_milestone_events` | WF2 syncs milestone to Supabase. 1 record in `loan_milestone_events` (milestone: `conditional_approval`). No outbound email |
| Full UW approval (CTC) | NONE | — | Arive fires milestone event. No outbound communication built |
| PTD conditions outstanding | NONE | — | No automation; Janie manages manually |
| CD sent to borrower | LIVE | LoanOS — Final CD Email (`SkzrWeR0bHZs8kWX`) | Sends CD summary email with closing cost breakdown |
| Closing scheduled | NONE | — | `closing_date` now syncs via WF2. No "closing scheduled" notification to borrower or realtor |

### CLOSING

| Event | Coverage | Workflow | Notes |
|-------|----------|----------|-------|
| Final CD sent | LIVE | LoanOS — Final CD Email (`SkzrWeR0bHZs8kWX`) | Manually triggered (Adam runs it) |
| Closing day reminder | NONE | — | `closing_date` stored. No day-before or day-of message |
| Funded / closed | PARTIAL — data only | WF2 (`9JyzzwKac8v3uQ7d`) | Syncs `closing_date` + contact `current_rate`/`current_loan_balance` on fund. No outbound "Congratulations, you closed!" message |
| Realtor post-close thank you | NONE | — | No workflow; realtor email stored on loan |

### POST-CLOSE

| Event | Coverage | Workflow | Notes |
|-------|----------|----------|-------|
| Review request (days after close) | LIVE | Closed Loan — Review Request Email (`AK1fBcaX1cPcdlGx`) | Active — confirmed live today. Manually triggered or triggered by Arive close event |
| 30-day check-in | NONE | — | Not built. High-value referral touchpoint |
| 6-month check-in | NONE | — | Not built |
| 1-year home anniversary | NONE | — | Not built. `funding_date` exists for anchor. `birthdate` also on contacts |
| Rate drop / refi watch | NONE | — | Not built. `current_rate` now stored on contact (added 2026-03-27). Infrastructure ready for comparison logic |
| Annual equity update / home value check | NONE | — | Not built |

### REALTOR TOUCHPOINTS

| Event | Coverage | Workflow | Notes |
|-------|----------|----------|-------|
| Referral received — intro to borrower | LIVE | LoanOS — Referral Intro Email (`YbgDnTpPdefcazKy`) | Sends to borrower |
| Referral received — thank you to realtor | NONE | — | No outbound to the referring realtor at time of referral |
| Post-close realtor thank you | NONE | — | No automation; realtor email captured on loan record |
| Quarterly check-in / value email | NONE | — | Not built. Would use Mailchimp + drip system |
| Realtor production update / market report | NONE | — | Not built. Was a Jungo feature |
| Contract-in-process status updates to realtor | NONE | — | Arive sends some, but LoanOS has no realtor communication layer |
| Closing confirmation to realtor | NONE | — | Not built |

### DRIP / NURTURE

| Event | Coverage | Workflow | Notes |
|-------|----------|----------|-------|
| Pre-approval lead welcome series | LIVE (not enrolled) | LoanOS — Drip Email Scheduler + "Pre-Approval Welcome Series" | Campaign built (6 steps / 60 days). **0 active enrollments** — no enrollment trigger is wired to auto-enroll new pre-approval contacts |
| Cold lead nurture (long-term) | NONE | — | No campaign defined. Drip infrastructure exists |
| Past client annual database touch | NONE | — | No campaign. 741 closed loans in DB |
| Birthday email | NONE | — | `birthdate` column exists on contacts. No trigger |
| Home purchase anniversary | NONE | — | `funding_date` on loans. No trigger |
| Rate drop alert (personalized) | NONE | — | `current_rate` now on contacts (as of today). Logic needed: compare stored rate vs. current market |

---

## Top Automation Gaps (Prioritized)

| Rank | Gap | Event | Impact | Effort (1-5) | Notes |
|------|-----|-------|--------|--------------|-------|
| 1 | Pre-approval drip — enrollment trigger missing | Pre-approval lead added → auto-enroll in Welcome Series | HIGH | 1 | Campaign already built. Need: 1 n8n trigger on contact stage change or Pre-Approval Lead Notify webhook output to enroll in drip. Zero schema changes |
| 2 | Closing day borrower communication | Funded → "Congratulations, you closed!" email | HIGH | 2 | WF2 already fires on fund status. Add outbound email node. No schema change |
| 3 | Post-close 30-day check-in | 30 days after `funding_date` → check-in email | HIGH | 2 | `funding_date` exists. New drip campaign or scheduled n8n query. Referral gen moment |
| 4 | Referral thank-you to realtor | Referral intro sent → thank-you to referring realtor | HIGH | 1 | Realtor email already in Referral Intro webhook payload. Add email node to existing workflow |
| 5 | Pre-approval expiry warning (14-day) | `pre_approval_expiry_date` - 14 days → alert Adam + email borrower | HIGH | 2 | `pre_approval_expiry_date` column exists. Scheduled n8n query (daily cron) |
| 6 | Rate lock confirmation to borrower | `rate_lock_date` set in Arive → WF2 fires → email borrower | MEDIUM | 2 | `rate_lock_date` + `rate_lock_expiration` exist. WF2 detects milestone. Add email branch |
| 7 | CTC / full approval notification | Arive CTC milestone → borrower email "You're Clear to Close!" | HIGH | 2 | Arive fires `loan_milestone_events`. WF2 milestone branch not yet wired to outbound |
| 8 | Closing scheduled notification | `closing_date` set or updated → borrower + realtor notification | MEDIUM | 2 | WF2 now syncs `closing_date`. Add downstream email node |
| 9 | Rate drop refi watch | Nightly: compare `contacts.current_rate` vs. today's rate → flag or email | MEDIUM | 3 | `current_rate` stored as of today. Need rate input (manual or API). High-value long-term |
| 10 | 1-year home anniversary | `funding_date` + 365 days → anniversary email | MEDIUM | 2 | Scheduled n8n cron. 741 closed borrowers in DB — large coverage opportunity |
| 11 | Post-close realtor thank-you | Funded → thank-you email to buyer's agent | MEDIUM | 1 | Realtor email on loan record (`buyers_agent_email`). Add branch to WF2 on fund status |
| 12 | UW submission update to borrower | `submission_date` set → "Your file is with underwriting" email | MEDIUM | 2 | Arive fires milestone. WF2 detects. Add email branch |
| 13 | Appraisal ordered notification | `appraisal_ordered_date` set → "Appraisal ordered" email | LOW | 2 | Nice-to-have communication; borrowers often anxious about this step |
| 14 | Birthday email | Contact `birthdate` → annual birthday email | LOW | 2 | Data exists. Scheduled cron. Goodwill / relationship touchpoint |
| 15 | Cold database long-term nurture | Past clients → quarterly value email / market update | LOW | 3 | Requires content strategy + campaign definition first |
| 16 | Quarterly realtor check-in | Active realtors → quarterly market stats email | LOW | 3 | Requires realtor segmentation + content |

---

## What's Working Well

- **WF1 + WF2 pipeline**: Arive → Supabase sync is solid. WF2 now handles closing_date, contact rate, and contact loan balance on fund. This is the backbone.
- **Lead intake layer**: Website form → Web Lead Automation, FTB guide → FTB Welcome Email, pre-approval funnel → Lead Notify. Three separate funnels all wired.
- **Communication workflows**: Referral Intro, Pre-Approval Email, CD Email are all active and well-scoped. These cover the highest-anxiety borrower moments.
- **Drip infrastructure**: drip_campaigns / drip_steps / drip_enrollments schema is live. Drip Scheduler runs hourly. One campaign (Pre-Approval Welcome Series) fully built. Ready to add campaigns without schema work.
- **Compliance columns**: `email_opt_out` enforced in milestone route, `do_not_call` live (2,376 contacts defaulted false). Both gates exist before any SMS build.
- **Communication logging**: Inbound Email → Supabase (now with loan linking) + iMessage → Supabase both active. Activity log has 466 entries in last 30 days.

---

## Compliance Notes

- **email_opt_out enforcement**: LIVE — milestone route checks `email_opt_out` before sending; confirmed added 2026-03-26. Status: complete for milestone emails. Should be verified in ALL outbound n8n workflows (not just milestone route).
- **do_not_call gate for SMS**: Column exists (boolean, all 2,376 defaulted false). No SMS workflow built yet — column is ready when SMS is added. TCPA-safe: gate exists before first SMS is ever sent.
- **TCPA compliance gaps**:
  - No SMS workflows exist yet (no gap currently)
  - `email_opt_out` is checked in the Next.js milestone route but n8n workflows (Referral Intro, Pre-Approval Email, CD Email, Review Request) do NOT have an explicit opt-out check — they pull the contact and send. If a contact has `email_opt_out = true`, these workflows would still send. This is a medium-priority compliance gap once the drip volume scales.
  - Recommendation: Add a Supabase lookup step in each outbound n8n workflow to check `email_opt_out` before the send node.

---

## Platform Best Practices

**1. Milestone-triggered communication is table stakes — but timing is everything.** Industry data consistently shows that the highest unsubscribe rates in mortgage drip sequences occur when communication frequency doesn't match where the borrower is in the loan process. Borrowers in processing want fewer, more meaningful updates (rate lock, appraisal in, CTC) — not daily check-ins. The current LoanOS architecture (Arive milestones → WF2 → Supabase) is perfectly positioned to fire communication only on real events. The remaining work is wiring outbound email nodes to existing milestone branches rather than building new triggers.

**2. Post-close is where the referral flywheel lives.** The first 30-90 days after closing are statistically the highest-intent window for referrals from new homeowners. Automated touchpoints at 30 days, 6 months, and 1 year dramatically outperform cold outreach to the same database. The 741 closed borrowers in LoanOS with `funding_date` data represent an immediate opportunity — even a single 30-day check-in campaign to this group, if 5% refer one person, generates 37 new leads from existing data with zero acquisition cost.

---

## Open Questions Requiring Adam's Decision

1. **Drip enrollment trigger**: Should new pre-approval contacts be auto-enrolled in the Welcome Series when the Pre-Approval Lead Notify webhook fires — or when Adam manually changes their stage in LoanOS? (Affects: Gap #1 — easiest win on the board)

2. **Outbound email in WF2**: WF2 currently only syncs data to Supabase. Should it also send outbound borrower emails on specific milestone events (rate lock, CTC, funded)? Or should those be separate standalone workflows triggered by Arive webhooks? (Affects: Gaps #2, #6, #7, #8, #11, #12)

3. **Review Request trigger**: The Closed Loan Review Request Email is Active — what triggers it? Is it Adam running it manually, Arive firing on fund, or a scheduled query? If manual, it's not truly automated and should be wired to WF2's fund detection. (Affects: Gap status accuracy for post-close)

4. **Rate watch input source**: For refi watch (Gap #9), where does today's market rate come from? Options: (a) Adam enters weekly via LoanOS UI, (b) pull from a rate API (Optimal Blue, Polly), (c) compare against the rate Adam sends in weekly rate update email. Affects build approach significantly.

---

## Adam's Answers — 2026-03-28

| # | Question | Answer |
|---|----------|--------|
| 1 | Drip enrollment trigger | Manual stage change (not auto on webhook) |
| 2 | WF2 architecture | PENDING — needs clarification (see subagent-status.md) |
| 3 | Review Request trigger | Arive fund event |
| 4 | Rate watch source | Compare against rate update email Adam already sends |

**Status:** 3 of 4 answered. Q2 (WF2 architecture) still pending Adam's response.
