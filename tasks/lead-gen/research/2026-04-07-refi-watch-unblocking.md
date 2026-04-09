# Research: Refi Watch Unblocking — Rate Source + Email Re-engagement + Mailchimp Setup
Date: 2026-04-07
Session: AM — Research (Sequence A)

---

## Executive Summary

The FRED API is the clear winner for Refi Watch Sequence A (Rate Drop Alert). It's free, automated, and pulls from the same Freddie Mac Primary Mortgage Market Survey that every major mortgage dashboard uses — updated every Thursday. One API call, one rate, zero maintenance. Compare that to a manual webhook (requires Adam to remember to update it every week) or Optimal Blue (~$300+/mo for full API access). Recommendation: use FRED API. Adam's only action is registering for a free API key (5 minutes). The n8n workflow can poll FRED every Thursday at 9 AM CT and compare against Segment A borrowers automatically.

For email re-engagement (Sequences B and D), the research confirms Adam's existing copy is on the right track — personal tone, no marketing language, genuine value (market data + specific rate comparison). The warm-up sequence (Sequence D) going to 644 past clients should lead with the anniversary/check-in angle rather than a rate pitch — the spec's existing copy handles this well.

For Mailchimp Customer Journeys (the 3 pending nurture sequences): setup is straightforward but must be done manually in the UI. Total time: ~45 minutes for all 3 journeys combined. This document includes a step-by-step guide Adam can follow.

---

## FRED API — Rate Source Deep Dive

### What MORTGAGE30US Is
- Series: 30-Year Fixed Rate Mortgage Average in the United States
- Source: Freddie Mac Primary Mortgage Market Survey (PMMS)
- Update frequency: Weekly — every Thursday, ~10:00 AM ET
- Data lag: 3–5 days (survey week ends Saturday, published the following Thursday)
- Historical depth: 1971 to present

### API Access
- **Free** — requires a free API key (register at https://fred.stlouisfed.org/docs/api/api_key.html)
- No rate limits for basic usage; standard call limit is 120 per minute
- FRED launched API v2 in November 2025 — no breaking changes to series observations endpoint

### API Call to Get Current Rate (n8n HTTP Request Node)

**URL:**
```
https://api.stlouisfed.org/fred/series/observations
```

**Query Parameters:**
```
series_id=MORTGAGE30US
api_key={{ $env.FRED_API_KEY }}
file_type=json
sort_order=desc
limit=1
```

**Full URL for testing:**
```
https://api.stlouisfed.org/fred/series/observations?series_id=MORTGAGE30US&api_key=YOUR_KEY&file_type=json&sort_order=desc&limit=1
```

**Response format:**
```json
{
  "observations": [
    {
      "date": "2026-04-03",
      "value": "6.64"
    }
  ]
}
```

**n8n Code Node to extract rate:**
```javascript
const obs = $input.first().json.observations;
const rate = parseFloat(obs[0].value);
const date = obs[0].date;
return [{ json: { current_rate: rate, rate_date: date } }];
```

### Rate Source Comparison

| Option | Cost | Automation | Reliability | Setup |
|--------|------|-----------|-------------|-------|
| **FRED API (recommended)** | $0/month | Fully automated — n8n polls Thursday 9 AM CT | Freddie Mac data — same source as every mortgage app | 5 min: register free API key, add to n8n env |
| Manual Webhook | $0/month | Zero — Adam must remember to update weekly | 100% accurate but depends on Adam's schedule | 30 min to build the webhook endpoint; then ongoing manual work |
| Optimal Blue API | ~$300–$500/mo | Fully automated, real-time lock pricing | Best for live lock pricing, overkill for rate monitoring | Requires vendor contract + technical setup |

**Recommendation: FRED API.** Manual webhook fails during market events (busy weeks = missed updates = broken rate alerts). Optimal Blue is production-grade pricing engine, not a monitoring tool. FRED is perfect for a weekly threshold check against a static borrower rate.

### Required Adam Action
1. Register for free FRED API key: https://fred.stlouisfed.org/docs/api/api_key.html (takes 5 minutes — just email + password)
2. Add `FRED_API_KEY` as an n8n credential (Environment Variable) in n8n dashboard
3. Reply with approval on Refi Watch email copy (see ADAM-TODO for the specific copy that needs approval)

---

## Email Re-engagement Research — Refi Watch Sequences B and D

### Industry Benchmarks (2025–2026)
- Mortgage email re-engagement open rates: **25–35% industry average** for opt-in lists; **15–20%** for cold/lapsed audiences
- AI-optimized timing delivers 30–50% improvement in engagement vs. static send times
- Rate alert emails consistently outperform generic check-ins: click-through rates 2–3x higher when a specific number is mentioned (e.g., "your rate of 7.125% vs. today's 6.64%")
- SMS has 98% open rate vs. email's 20% — but TCPA compliance blocks SMS for Refi Watch (no prior written consent confirmed for past clients). Email is the correct channel.

### Subject Line Best Practices for Past Clients
**What works (confirmed for Sequence B — Anniversary Check-In):**
- Personalize with years and context: `[FIRST_NAME] — [X] year check-in from Adam` — already in spec ✅
- Avoid "just checking in" — it signals low-value and gets ignored
- Rate-specific hooks lift open rates significantly: `Your 7.125% rate — what's changed in 3 years` (for when rate data is available)
- Keep it plain text in subject — no emojis, no ALL CAPS, no "Free" or "Save"

**What works (for Sequence D — Pre-Drop Warm-Up):**
- The spec's current subject `Quick check-in from Adam — how's [CITY] treating you?` is strong: personal, non-salesy, curiosity hook
- Alternative to A/B test: `[FIRST_NAME] — market update for Austin homeowners`
- Avoid explicit rate language in warm-up subject — the goal is re-establishing contact, not pitching a refi

### Warm-Up Sequence Timing for Cold Audiences
For audiences that have been dormant 2+ years (which applies to the bulk of the 644 past clients):
1. **Email 1 (Sequence D warm-up):** Pure value — market update + homeownership content. No ask. This is the existing spec copy ✅
2. **Email 2 (Sequence B anniversary OR Sequence A rate alert):** After re-establishing contact, a specific offer or comparison is appropriate
3. **Spacing:** Minimum 7–14 days between warm-up and rate alert — too soon looks like a blast campaign

**Implication for execution order:**
- Launch Sequence D (warm-up) FIRST — manually triggered, goes to all 644
- Wait 2 weeks minimum, then launch Sequence B (first monthly anniversary CRON)
- Sequence A (Rate Drop Alert) can run concurrently with B, but only after warm-up

### CAN-SPAM Compliance Check (Sequences B and D)
The spec's email copy already includes:
- ✅ Physical address: 5900 Balcones Drive, Suite 100, Austin TX 78731
- ✅ NMLS #513013 in signature
- ✅ Reply STOP opt-out mechanism
- ✅ From: adam@thestyerteam.com (identifiable sender)
- ✅ No deceptive subject lines
- ✅ No guaranteed approval language

**One gap:** Sequence A (Rate Drop Alert) is not yet written — when it is, confirm the same footer elements are present.

---

## Mailchimp Customer Journey Setup Guide

Adam needs to build 3 journeys manually. Here's exactly how.

### Before You Start (One-Time)
- Log into Mailchimp: https://mailchimp.com
- Confirm these tags exist in your audience: `pre-approval-funnel`, `rate-alert`, `ftb-dpa-guide`
  - To check: Audience → All contacts → Tags tab
  - If missing: tags are created automatically when subscribe-lead.js runs — submit a test form to generate them

### Journey 1: Pre-Approval Welcome Series
**Trigger tag:** `pre-approval-funnel`
**Number of emails:** 6 over 45 days (copy in `tasks/lead-gen/specs/2026-03-27-pre-approval-funnel-spec.md`)
**Time estimate:** ~15 minutes

**Steps:**
1. Automations → Marketing Automation Flows
2. Click "Build from scratch"
3. Name: `Pre-Approval Welcome Series`
4. Choose Audience: your main borrower audience
5. Click "Choose a trigger" → Select **"Tag added"** → Choose tag: `pre-approval-funnel` → Save
6. Click + to add first email step → "Send email" → design your first welcome email
7. Add a **Wait** node: 3 days
8. Add email #2 → Wait 7 days → email #3 → etc.
9. After all 6 emails are added: click **Turn on** (top right)

**CRITICAL:** Contacts tagged BEFORE you turn on the journey will NOT receive it. Only new tag events (new form submissions) trigger enrollment. If you want to enroll existing tagged contacts, you'll need to remove and re-add the tag manually — or just move forward for new leads.

---

### Journey 2: Rate Watch Welcome Series
**Trigger tag:** `rate-alert`
**Number of emails:** 4 over 14 days (copy in `tasks/lead-gen/specs/2026-03-28-rate-alert-funnel-spec.md`)
**Time estimate:** ~10 minutes

Steps: same as Journey 1. Name: `Rate Watch Welcome Series`. Trigger: tag = `rate-alert`.

---

### Journey 3: FTB DPA Guide Welcome Series
**Trigger tag:** `ftb-dpa-guide`
**Number of emails:** 8 over 60 days (copy in `tasks/lead-gen/specs/2026-04-02-ftb-dpa-funnel-spec.md`)
**Time estimate:** ~20 minutes (8 emails)

Steps: same structure. Name: `FTB DPA Guide Welcome Series`. Trigger: tag = `ftb-dpa-guide`.

**Note:** Email #1 delivers the DPA Guide PDF. You'll need the hosted URL before building this journey. Options:
- Upload to Google Drive → get shareable link
- Upload to Netlify public folder: `/public/ftb-dpa-guide.pdf` (preferred — keeps it on your domain)

---

## Performance Data (Adam's Current State)

From NotebookLM context and prior session research:
- **Live funnels:** 4 (PA, Rate Alert, FTB Guide, DPA Guide)
- **Total web leads captured since launch:** 7–8 (very low — mostly from direct link sharing, not organic)
- **Mailchimp active sequences:** 0 (none of the 3 journeys have been built)
- **Past client database:** 644 loans with closing_date — high-value, zero activation so far
- **n8n workflows active for lead routing:** Pre-approval lead notify (J9Pe24vUi6fpZtdZ) ✅, Web lead automation (PiuIsQpBuydtFM4m) ✅
- **LO Waitlist:** Built, NOT deployed — pending Adam copy review

**Biggest gap:** Leads are captured, confirmed in Mailchimp, but get zero automated follow-up. PA leads get speed-to-lead notification to Adam (great) but no nurture sequence. This is the "leaky bucket" — fixing Mailchimp journeys doubles the value of every lead already captured.

---

## Recommended Approach

**Immediate (this week):**
1. Adam: Register for free FRED API key → adds 5-min to his day → unblocks Refi Watch Sequence A entirely
2. Adam: Review and approve Refi Watch Sequence D email copy → unblocks warm-up to 644 past clients (biggest near-term ROI)
3. Adam: Build 3 Mailchimp journeys using the guide above → ~45 min total → every new lead now gets automated nurture

**Next session (2026-04-07 PM or 2026-04-08 AM):**
- Once FRED API key is confirmed, Builder can immediately create all 3 Refi Watch n8n workflows
- Once Sequence D is approved, Builder executes the workflow and sends warm-up to 644 clients
- Sequence B (Anniversary CRON) goes live immediately after Sequence D sends

**Expected impact:**
- Refi Watch Sequence D: 644 outbound emails → estimated 15–20% open rate = 97–129 opens → 2–3% reply rate = 13–19 re-engaged past clients in first 2 weeks
- Mailchimp journeys: every future web lead gets 4–8 email nurture sequence → 25–35% open rate on welcome email
- Combined: estimated +3–5 leads/month from owned channels immediately upon activation

---

## Gap Analysis

| Gap | Impact | Blocked By |
|-----|--------|-----------|
| Refi Watch Sequence A not built | HIGH — rate drop alerts to 644 clients not firing | Adam: FRED API key + copy approval |
| Refi Watch Sequence D not sent | HIGH — no warm-up to past clients | Adam: copy approval |
| Mailchimp journeys not built | HIGH — all new leads get zero nurture | Adam: 45-min Mailchimp setup |
| LO Waitlist not deployed | MEDIUM — LO acquisition funnel offline | Adam: copy review + git push |
| Homepage forms Netlify-only | MEDIUM — Quick Quote/Contact leads lost | Builder: can fix next build session |
| DPA Guide PDF not hosted | LOW — blocks FTB journey email #1 | Adam: upload PDF to Google Drive or Netlify |

---

## Open Questions

1. **FRED API key:** Will Adam register for the free key this week? (Unblocks Refi Watch Sequence A)
2. **Copy approval:** Has Adam reviewed the Refi Watch Sequence D email in the spec? (Unblocks largest send)
3. **Rate threshold:** Confirm 0.75% spread trigger for Sequence A (rate drops to ≤ borrower_rate - 0.75%)
4. **DPA Guide PDF:** Does the file exist? Where should it be hosted — Netlify or Google Drive?
5. **Execution order:** Should Sequence D (warm-up to all 644) go out first, followed by Sequence A? Recommended yes — cold audience needs warm-up before a rate pitch.
