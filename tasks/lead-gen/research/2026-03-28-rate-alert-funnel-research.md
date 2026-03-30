# Research: Rate Alert Funnel
Date: 2026-03-28
Researcher: Lead Gen Research Subagent
Session: AM — Week 3 pipeline preparation

---

## Executive Summary

The Rate Alert Funnel is the second planned owned-channel lead generation system (after the Pre-Approval Funnel). The core mechanism: prospective buyers and homeowners opt in to receive weekly mortgage rate updates. Adam sends value every week → stays top-of-mind → converts when timing is right (rate drop, life event, refinance trigger).

**Why this matters now:** The Homebuyers Privacy Protection Act (effective March 5, 2026) bans trigger lead reselling — lenders can no longer legally purchase lists of people who just applied elsewhere. This eliminates one of the largest wholesale lead channels and makes owned subscriber lists substantially more valuable.

**Projected conversion mechanics:**
- Generic "newsletter signup": 0.5–1.5% opt-in conversion
- Specific weekly rate alert offer ("know when to lock"): 4–8% opt-in conversion
- Email list engaged leads → loan inquiry rate: ~3–5% (mortgage vertical benchmark)
- 500 subscribers × 4% inquiry rate = 20 leads/month from email alone

---

## 1. Landing Page Design

### What Converts

**Headline formula:** Outcome + Timeframe + Mechanism
- "Know exactly when Austin mortgage rates drop — free weekly update"
- "Never miss a rate move. Get Austin's best mortgage rates in your inbox every Friday."
- "Rate Watch: weekly Intel from a local mortgage broker, not a bank"

**Above-the-fold requirements:**
- Single opt-in form: First name + Email (maximum 2 fields — phone kills conversion at this stage)
- Specific offer framing (NOT "subscribe to newsletter") — "Get the Rate Watch" or "Join Rate Watch"
- Social proof: "Join 340+ Austin homebuyers tracking rates" — even at launch use "[be among the first]"
- One-sentence credibility: "Adam Styer | NMLS #513013 | Independent broker, 40+ lenders"

**What kills opt-in rate:**
- Asking for phone number (drops by ~60%)
- "Subscribe to my newsletter" language (generic, low-value signal)
- No specific benefit statement ("stay informed" → "know when rates drop below 6.5%")
- Long form with 4+ fields

**Trust signals below fold:**
- Specific recent rate data sample (shows what they'll actually receive)
- NMLS disclosure
- TCPA-lite: "No spam. Unsubscribe anytime. We never sell your info."
- Sample email preview or screenshot

### Recommended Page Structure

```
HERO
├── Headline: "Rate Watch: Know When Austin Mortgage Rates Drop"
├── Subheadline: "Weekly rate intel from an independent broker with access to 40+ lenders — free"
├── Form: First Name + Email + [Subscribe] button
├── Trust: "No spam. Unsubscribe anytime. Join 300+ Austin homebuyers."
└── NMLS disclosure

WHAT YOU GET (3 bullets)
├── Every Friday: current 30yr and 15yr rates in Austin market
├── Alert when rates shift more than 0.25% in a week
└── Occasional analysis: "Should you lock now or float?"

CREDIBILITY BLOCK
├── "Independent broker — I work for you, not a bank"
├── "NMLS #513013 | Austin, TX since 2017 | 1,000+ loans closed"
└── Sample rate update screenshot

FOOTER
└── NMLS legal footer + unsubscribe instructions
```

---

## 2. Lead Magnet Strategy

### Specific vs. Generic Offer

Data consistently shows specific, named offers outperform generic newsletter signups 4–8x.

**Recommended offer name:** "Austin Rate Watch"
- Weekly email: current Austin mortgage rates (30yr, 15yr, FHA, VA, jumbo)
- Format: plain text or minimal HTML — lands better, reads more authentic
- Length: under 300 words — focus on rates + one actionable insight
- Send time: Friday 9–11am CT (mortgage decisions happen on weekends)

**Optional tier-2 upgrade (Week 4+):** "Lock Timing Guide" PDF
- One-page guide: "When to lock vs. float your mortgage rate"
- Gates higher-commitment opt-in: offers lead who already subscribed an upgrade
- Not required for initial funnel — adds complexity, defer to next build cycle

### What Adam Writes Each Week (5 min max)

Template:
```
Subject: Austin Mortgage Rates — Week of [DATE]

Hi [First Name],

This week's Austin mortgage rates (as of [DATE]):

30-year fixed: X.XX% (X.X% APR)
15-year fixed: X.XX% (X.X% APR)
FHA 30-year: X.XX%
VA 30-year: X.XX%

[One paragraph: What's moving rates this week — Fed, inflation, jobs report, etc.]

[One sentence: My take — should buyers lock now or wait?]

Best,
Adam Styer | NMLS #513013
[Direct: (512) 956-6010]
[Apply: https://mslp.my1003app.com/513013/register]
```

---

## 3. Mailchimp Sequence Architecture

### Segmentation Logic

Two primary segments based on opt-in source or declared intent:
1. **Purchase buyers** — actively looking to buy or within 6–18 months
2. **Refinance candidates** — homeowners who could benefit from rate drop

Both receive the same weekly rate email. Segmentation affects nurture tracks only.

### Welcome Sequence (Days 0–14)

**Day 0 — Confirmation + First Value**
- Subject: "You're in — here's this week's Austin rates"
- Send immediately on opt-in
- Include current rate snapshot + what to expect going forward
- No sales pitch

**Day 3 — Context**
- Subject: "Why working with an independent broker beats the bank"
- Short explanation: 40+ lenders vs 1, no hidden markups, Adam works for you
- CTA: "Have questions? Reply to this email."

**Day 7 — Rate Alert Education**
- Subject: "How to know when to lock your rate (and when to wait)"
- 3-question framework for the lock decision
- Soft CTA: "Want a rate quote for your situation? Takes 2 minutes."

**Day 14 — Soft Conversion**
- Subject: "Ready to see what rate you'd qualify for?"
- Direct CTA: apply link or Calendly
- No pressure framing: "When the time is right..."

### Ongoing Cadence (Post-Welcome)

- Every Friday: weekly rate email (same template, auto-send)
- Monthly: deeper market commentary (optional, 300–500 words)
- Triggered: rate drop alert when rates shift more than 0.25% in a week (manually triggered or automated via rate API)

---

## 4. Technical Architecture

### Integration Stack

```
Rate Alert Landing Page (rate-alert.html)
    │
    ├── Form fields: first_name, email
    ├── Hidden: tag='rate-alert', lead_source='Rate Alert Funnel', page_url, UTM params
    │
    ▼
subscribe-lead.js (Netlify Function)
    │
    ├── Mailchimp: upsert member + apply tag 'rate-alert'
    ├── LoanOS: create contact (lead_source='Rate Alert Funnel')
    └── n8n: optional notify (low-priority — no PA lead notification needed at opt-in)
    │
    ▼
Mailchimp Customer Journey
    ├── Trigger: tag 'rate-alert' applied
    ├── Day 0: welcome + rate snapshot
    ├── Day 3: broker value prop
    ├── Day 7: lock timing education
    └── Day 14: soft conversion CTA
    │
    ▼
Weekly Rate Email (Mailchimp Campaign, every Friday)
    └── Send to all 'rate-alert' subscribers
```

### Subscribe-lead.js Changes Required

Minimal — existing function already handles:
- `tag` field → applied to Mailchimp member
- `lead_source` field → passed to LoanOS (fixed in this session)
- `fname`, `email` → Mailchimp member fields
- UTM params → captured

**What's NOT needed for Rate Alert:**
- `loan_goal` (not collected at this stage)
- `sms_opt_in` (only collect at deeper funnel stage)
- `notifyPreApprovalLead()` conditional → does NOT fire for Rate Alert (lead_source check)
- `enrollInDrip()` conditional → does NOT fire for Rate Alert (only PA funnel triggers drip)

**Result: subscribe-lead.js requires ZERO code changes for Rate Alert Funnel.** Just create the HTML page using the same endpoint with `tag='rate-alert'`.

### New Files Required

| File | Purpose |
|------|---------|
| `rate-alert.html` | Landing page — rate alert opt-in form |
| `rate-alert-confirm.html` OR reuse `/thank-you.html` | Post-opt-in confirmation page |

**Recommendation:** Reuse `/thank-you.html` with a query param: `thank-you.html?type=rate-alert` to show slightly different copy. Avoids creating a second thank-you page. Defer to builder decision.

### TCPA Compliance for Rate Alert

Rate Alert is email-only (no SMS at opt-in). TCPA requirements are lighter:
- No SMS opt-in checkbox required at this stage
- CAN-SPAM footer required in all Mailchimp emails (auto-added by Mailchimp)
- One-click unsubscribe must work (Mailchimp handles)
- NMLS disclosure in email footer

**No bundled consent issue** — this is a pure email opt-in, simpler than the PA funnel's two-checkbox pattern.

---

## 5. Conversion Benchmarks

| Metric | Benchmark | Source |
|--------|-----------|--------|
| Landing page opt-in rate (specific offer) | 4–8% | Unbounce Q4 2024 |
| Landing page opt-in rate (generic newsletter) | 0.5–1.5% | Unbounce Q4 2024 |
| Email open rate (mortgage vertical) | 22–28% | Mailchimp industry benchmarks |
| Email click rate (mortgage) | 2.5–3.5% | Mailchimp industry benchmarks |
| Subscriber → lead inquiry rate | 3–5% | Scotsman Guide 2025 |
| Welcome sequence → Calendly book rate | 1–2% | Internal estimate |

**Modeled projection (Year 1 steady state):**
- 500 subscribers (achievable in 6–9 months from organic + nurture)
- 25% open rate, 3% click rate
- 4% lead inquiry rate → 20 leads/month
- At 3% close rate from email leads → 6 additional closed loans/year

---

## 6. Open Questions for Architect

1. **Segmentation at opt-in**: Should the landing page ask "Are you a buyer or homeowner?" to segment immediately, or keep it frictionless (first name + email only) and let behavior in the welcome sequence segment?
   - Recommendation: Keep frictionless. Segment by behavior — buyers click "apply now" links, homeowners click "refi" content. Mailchimp tags applied automatically.

2. **Rate data source**: Adam needs to update the weekly email with current rates. Options:
   - Manual: Adam fills template each Friday (5 min) — simplest, most accurate for local market
   - Automated: Pull from Freddie Mac PMMS API or Optimal Blue → auto-populate weekly campaign
   - Recommendation: Start manual. Automate in Month 3 once cadence is established.

3. **Homepage promotion**: Where on styermortgage.com does Rate Alert get promoted?
   - Recommendation: Hero section secondary CTA ("Get Weekly Rate Updates →") alongside primary "Get Pre-Approved" CTA

4. **Existing Rate Update page**: Does the current `/rate-update.html` overlap with this funnel?
   - Need to audit — if it exists, Rate Alert landing page should replace or redirect it

5. **Drip campaign in LoanOS**: Rate Alert subscribers are in Mailchimp nurture. Should they also enroll in a LoanOS drip campaign?
   - Recommendation: No — keep LoanOS for high-intent PA funnel leads. Rate Alert nurture lives in Mailchimp only.

---

## 7. Recommended Build Sequence (Week 3)

**Session 1 (Architect):** Design `rate-alert.html` spec — page layout, copy, form fields, TCPA, Mailchimp tag, redirect

**Session 2 (Builder):** Build `rate-alert.html`, wire to subscribe-lead.js, test locally

**Session 3 (Reviewer + QA):** Review compliance, test form submission end-to-end

**Session 4 (Builder):** Create Mailchimp welcome sequence (4-step Customer Journey triggered by 'rate-alert' tag)

**Deployment:** Adam git pushes when rate-alert.html is ready (bundles with PA funnel deploy if timing aligns)

---

## Key Takeaways for Architect Subagent

1. **Zero backend changes** — subscribe-lead.js already handles rate alert opt-in without modification
2. **Single new file** — rate-alert.html is the only deliverable for Week 3 build session
3. **Mailchimp Journey is the nurture engine** — 4-email welcome sequence + ongoing Friday cadence
4. **Plain-text email style** — higher deliverability, more authentic voice, less design overhead
5. **Specific offer naming matters** — "Austin Rate Watch" or "Rate Watch" beats "newsletter" 4–8x
6. **March 2026 regulatory tailwind** — HPA trigger lead ban makes owned list more defensible than paid leads
