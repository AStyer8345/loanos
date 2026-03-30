# Funnel Spec: Rate Alert Funnel (Austin Rate Watch) — Lead Generation
Date: 2026-03-28
Status: READY FOR EXECUTION
Session: 2026-03-28 AM (Session 2) — Architect

---

## Scope

### In Scope
- New landing page: `rate-alert.html` (single new file)
- Thank-you page: modify `thank-you.html` to support `?type=rate-alert` query param with Rate Alert-specific copy
- Mailchimp: 4-email welcome sequence copy (Builder creates in Mailchimp UI — cannot be done via API)
- Optional enhancement: secondary CTA on `austin-mortgage-rates.html` linking to `/rate-alert`
- subscribe-lead.js: **ZERO CODE CHANGES** — existing function already handles rate-alert tag/lead_source correctly

### Out of Scope
- n8n workflow: no LO notification needed for Rate Alert opt-ins (low-intent; not hot lead)
- SMS follow-up: email-only funnel; SMS opt-in NOT collected at this stage
- Rate data automation: weekly email is manually composed by Adam (5 min/week); Optimal Blue automation deferred to Month 3
- Homepage hero CTA update: secondary CTA ("Get Weekly Rate Updates →") deferred to a separate homepage build session
- prequal.html changes: out of scope this funnel
- Drip campaign in LoanOS: Rate Alert nurture lives in Mailchimp only

### Pre-Conditions Before Builder Executes
- [ ] Adam must confirm Netlify env vars are live (MAILCHIMP_API_KEY, MAILCHIMP_BORROWER_LIST_ID, LOANOS_AGENT_SECRET) — same vars required for PA funnel. If not yet set, Builder can write rate-alert.html but cannot test end-to-end
- [ ] Adam git push for rate-alert.html can bundle with PA funnel deploy (BLOCKER-003) or go separately

---

## Funnel Architecture

### Traffic Source
1. **Primary (near-term):** Direct URL share — Adam texts/emails prospects "check your rates at styermortgage.com/rate-alert"
2. **Secondary:** Link from `austin-mortgage-rates.html` (existing high-SEO page) — add "Get free weekly alerts" CTA
3. **Tertiary (later):** Homepage hero secondary CTA alongside "Get Pre-Approved"
4. **Email:** Adam can mention in weekly rate emails: "Forward this to someone who should be watching rates →"

### Landing Page Design
- **URL slug:** `/rate-alert` (maps to file `rate-alert.html` in site root)
- **Netlify form name:** `rate-alert-form`
- **Page title:** `Austin Rate Watch | Free Weekly Mortgage Rate Updates | Adam Styer NMLS #513013`
- **Meta description:** `Get Austin mortgage rates delivered every Friday. Know when to lock. Independent broker, 40+ lenders. Free — no spam ever.`
- **noindex:** `NO` — this page should be indexed and rank for "Austin mortgage rate alerts" and "mortgage rate watch Austin"
- **Above-fold headline:** `Rate Watch: Know When Austin Mortgage Rates Drop`
- **Subheadline:** `Free weekly rate intel from an independent broker with access to 40+ lenders — delivered every Friday morning`
- **Form fields (2 total):**
  1. `fname` — First Name (placeholder: "First Name")
  2. `email` — Email Address (placeholder: "Your Email", type="email")
- **No phone field** — research confirms phone drops opt-in rate ~60% at this stage
- **No SMS opt-in checkbox** — email-only funnel, TCPA SMS consent not required
- **Hidden form fields (pass via JS before submit):**
  - `tag` = `rate-alert`
  - `lead_source` = `Rate Alert Funnel`
  - `page_url` = `window.location.href`
  - `utm_source` = read from URL param (or `direct` if none)
  - `utm_medium` = read from URL param (or `web` if none)
  - `utm_campaign` = read from URL param (or `rate-alert-funnel` if none)
  - `utm_term` = read from URL param (or empty)
  - `utm_content` = read from URL param (or empty)
- **CTA button text:** `Get My Weekly Rate Updates →`
- **Trust signals (below button, above fold):**
  - `No spam. Unsubscribe anytime. Join Austin homebuyers watching rates.`
  - NMLS #513013 | Equal Housing Lender [logo or text]
- **Netlify attribute:** `data-netlify="true"` on `<form>` element (safety net for Netlify Forms dashboard, even though fetch() handles primary routing)
- **Form action:** `action="javascript:void(0)"` — JS submit handler intercepts; no page redirect on form tag itself
- **Thank-you redirect:** After successful fetch(), redirect to `/thank-you.html?type=rate-alert`

### Below-Fold Structure

```
WHAT YOU GET (3 bullets — concise)
├── Every Friday: 30yr, 15yr, FHA, VA rates for Austin market
├── Rate move alerts when rates shift more than 0.25% in a week
└── My take: "Should you lock now or wait?" — one honest sentence

CREDIBILITY BLOCK
├── Independent broker — I work for you, not a bank
├── NMLS #513013 | Austin, TX since 2017 | 1,000+ loans closed
├── Access to 40+ wholesale lenders (lower rates than retail)
└── Google rating badge (if available) or "500+ families helped"

SAMPLE RATE UPDATE (shows what they'll receive)
[Screenshot or styled mockup of a Friday rate email]

FOOTER
└── © Adam Styer | Mortgage Solutions LP | NMLS #513013
    Equal Housing Lender | 5900 Balcones Drive Suite 100, Austin TX 78731
    Adam is licensed in Texas. Rates shown are for informational purposes only and are subject to change.
    Not an offer to lend. All loans subject to underwriting approval.
```

### Thank-You Page Modification (`thank-you.html`)
Currently: generic "Request Received" copy
Required: support `?type=rate-alert` query param to show Rate Alert-specific confirmation copy

**Builder instruction:** In `thank-you.html`, add a JS block near the top of the `<body>` `<script>` section that reads `URLSearchParams` for `type` param. If `type=rate-alert`, replace the main headline and body text:
- Headline: `You're on the Austin Rate Watch list`
- Subheadline: `You'll get your first rate update this Friday — check your inbox. (If you don't see it, check spam once and mark as "not spam.")`
- Remove the Calendly booking widget (not appropriate for low-intent rate-watch opt-in)
- Keep NMLS footer

If `type` param is absent or anything other than `rate-alert`, show the default PA funnel copy (no change to existing behavior).

---

## Email Sequence — Full Copy

**Mailchimp setup:**
- Audience: existing Borrower audience (same list used for PA funnel — tag-based segmentation)
- Trigger: tag `rate-alert` applied to member
- Automation type: Customer Journey
- Journey name: `Rate Watch Welcome Series`
- Exit criteria: 14 days after entry OR member unsubscribes

---

### Email 1 — Day 0 (send immediately on tag applied)
**Subject:** `You're in — here's this week's Austin rates`
**Preview text:** `What you'll get every Friday (plus today's numbers)`

---

Hi [First Name],

You just joined the Austin Rate Watch — welcome.

Here's what you signed up for:

Every Friday morning, I send a short note with the current Austin mortgage rates. Not a wall of financial jargon. Just the numbers that matter, what's moving them, and whether now is a good time to lock or wait.

Here's a quick snapshot of where rates are right now:

- 30-year fixed: Check Freddie Mac PMMS or call me for your scenario
- 15-year fixed: Usually 0.50–0.75% lower than the 30-year
- FHA 30-year: Good option if credit is under 700 or down payment is under 10%

*(I update these every Friday with real Austin market numbers.)*

—

You'll hear from me again in a few days. Until then, if you have a quick question, just reply to this email. I read everything.

Adam Styer
NMLS #513013 | Adam Styer | Mortgage Solutions LP
(512) 956-6010 | https://styermortgage.com
5900 Balcones Drive Suite 100 | Austin, TX 78731

*You're receiving this because you signed up at styermortgage.com. Unsubscribe anytime — no hard feelings.*
*Equal Housing Lender | Not an offer to lend. All loans subject to underwriting approval.*

---

### Email 2 — Day 3
**Subject:** `Why I know rates other brokers don't have access to`
**Preview text:** `The difference between a bank and an independent broker`

---

Hi [First Name],

Quick background in case we haven't met:

I'm an independent mortgage broker. That means I don't work for a bank — I work for you.

The difference matters when it comes to rates:

**Banks offer one set of rates.** Their rates. They can't go outside their own products.

**I work with 40+ wholesale lenders.** I shop your loan across all of them and bring you the best combination of rate, fees, and terms. Wholesale rates are generally lower than retail bank rates — because there's no branch overhead baked in.

That's why I built the Rate Watch: not to sell you something, but to give you a real picture of the Austin market so you can make a smart decision when the time is right.

No pressure. When you're ready to talk numbers for your specific situation — I'm here.

Adam Styer
NMLS #513013 | (512) 956-6010
https://styermortgage.com

*Unsubscribe anytime. Equal Housing Lender.*

---

### Email 3 — Day 7
**Subject:** `The 3-question test for "should I lock my rate now?"`
**Preview text:** `How to stop second-guessing your rate lock timing`

---

Hi [First Name],

One of the most common questions I get: "Should I lock my rate now, or wait for rates to drop?"

Here's the honest answer: nobody knows exactly where rates are going.

But here's a framework that cuts through the noise:

**Question 1: How far out is your close date?**
If you're closing in 30 days or less — lock now. The risk of rates moving against you is real. If you're 90+ days out, you have more flexibility to watch.

**Question 2: Can you absorb a 0.25% move?**
If rates go up 0.25% before you lock, that's roughly $30–50/month more on a $400k loan. If that changes your numbers significantly — lock early and remove the variable.

**Question 3: What's your "it's good enough" rate?**
If the rate you can get today meets your monthly payment goal — it's good enough. Don't gamble trying to beat a market that no one can predict.

If you want to run your specific numbers — just reply to this email or grab a 15-minute call: https://calendly.com/adamstyer/15minutes

Adam Styer
NMLS #513013 | (512) 956-6010
https://styermortgage.com

*Rates mentioned are illustrative. Your rate depends on credit, loan type, and property. Call for a real quote.*
*Unsubscribe anytime. Equal Housing Lender.*

---

### Email 4 — Day 14
**Subject:** `Ready to see what rate you'd actually qualify for?`
**Preview text:** `No obligation — just real numbers for your situation`

---

Hi [First Name],

You've been on the Rate Watch for two weeks now. I hope the Friday updates have been useful.

At some point, general market rates stop being the interesting number — and your rate becomes the interesting number.

What does the market rate actually mean for your specific situation? Your credit score, down payment, loan amount, and property type all move the number. The only way to know is to run it.

When you're ready — here's how to get a real rate quote:

→ **Apply in 15 minutes:** https://mslp.my1003app.com/513013/register
→ **Book a quick call:** https://calendly.com/adamstyer/15minutes
→ **Just reply to this email** — I'll get back to you same day

No cost. No obligation. No sales pitch — just numbers.

Adam Styer
NMLS #513013 | (512) 956-6010 | adam@thestyerteam.com
Adam Styer | Mortgage Solutions LP
5900 Balcones Drive Suite 100 | Austin, TX 78731

*You're receiving this because you signed up for Austin Rate Watch at styermortgage.com.*
*Unsubscribe anytime. Equal Housing Lender. All loans subject to credit approval.*

---

### Ongoing Cadence (post Day 14)
- **Every Friday:** Weekly rate email (Adam composes manually — template in research file)
- **Optional monthly:** Deeper market commentary when Fed meets, big economic event, etc.
- **Triggered:** Rate drop alert when rates shift >0.25% in a week (manually triggered by Adam for now)

---

## Automation Map

```
[1] User submits rate-alert.html form
    │
    ▼
[2] subscribe-lead.js (/.netlify/functions/subscribe-lead)
    Payload: { fname, email, tag='rate-alert', lead_source='Rate Alert Funnel', page_url, UTM params }
    (NO: lname, phone, loan_goal, sms_opt_in, loan_type_tag — not collected at this stage)
    │
    ├──▶ [3a] Mailchimp: upsert member to Borrower audience + apply tag 'rate-alert'
    │         → Triggers "Rate Watch Welcome Series" Customer Journey
    │         → Day 0 email fires immediately
    │
    ├──▶ [3b] LoanOS (Supabase): create contact
    │         - first_name: fname
    │         - email: email
    │         - lead_source: 'Rate Alert Funnel'
    │         - status: 'lead'
    │         - no phone, no loan_goal (not collected)
    │
    └──▶ [3c] No n8n LO notification (low-intent opt-in — Adam does not need to be alerted)
              NOTE: If lead later books a Calendly call (Day 7 or 14 email), Calendly → n8n handles notification

[4] User redirected to: /thank-you.html?type=rate-alert
    → Shows Rate Alert-specific confirmation copy (no Calendly widget)
```

**What does NOT fire:**
- `notifyPreApprovalLead()` — only fires for `lead_source === 'Pre-Approval Funnel'` (confirmed in subscribe-lead.js)
- `enrollInDrip()` — only fires for PA funnel tag (confirmed in subscribe-lead.js)
- n8n Pre-Approval Lead Notify workflow (J9Pe24vUi6fpZtdZ) — does not fire for Rate Alert

---

## CRM Routing

| Field | Value |
|-------|-------|
| Lead Source tag (LoanOS) | `Rate Alert Funnel` |
| Mailchimp tag | `rate-alert` |
| LoanOS contact status | `lead` |
| n8n notification workflow | None (no hot-lead notification at opt-in) |
| Mailchimp Customer Journey | `Rate Watch Welcome Series` (trigger: tag `rate-alert`) |

---

## Conversion Rate Targets

| Stage | Target | Benchmark Source |
|-------|--------|-----------------|
| Page visitor → opt-in | 4–8% | Unbounce Q4 2024 (specific offer) |
| Email 1 open rate | 45–60% | Mailchimp (welcome emails, mortgage vertical) |
| Email sequence open rate (ongoing) | 22–28% | Mailchimp mortgage benchmarks |
| Weekly rate email → click | 2.5–3.5% | Mailchimp mortgage benchmarks |
| Subscriber → lead inquiry (Year 1) | 3–5% | Scotsman Guide 2025 |
| 500 subscribers → leads/month | ~20 leads | Modeled projection |

---

## Execution Instructions for Builder

Execute in this exact order. Do NOT skip steps.

**Step 1 — Create `rate-alert.html`**
- File location: `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site/rate-alert.html`
- Use `get-preapproved.html` as the structural template (same header, footer, CSS imports, GTM, etc.)
- Page is a standalone landing page: strip nav links (`.lp-header` class pattern same as get-preapproved.html)
- Form fields: `fname` (text, required) and `email` (email, required) ONLY
- Hidden fields added by JS before submit: `tag`, `lead_source`, `page_url`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`
- Form has `data-netlify="true"` and `name="rate-alert-form"` attributes
- JS submit handler: intercepts submit event, builds FormData, calls `fetch('/.netlify/functions/subscribe-lead', { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } })`, then redirects to `/thank-you.html?type=rate-alert` on success
- Error handling: show inline error message if fetch fails (non-blocking — don't break UX)
- UTM params: read from `window.location.search` using `URLSearchParams` on page load; store in JS variables for use in submit handler
- noindex meta tag: **ABSENT** (this page should be indexed — do NOT add `<meta name="robots" content="noindex">`)
- Include Google Ads conversion tracking consistent with how it's done on thank-you.html (fire on form submit, not page load)

**Step 2 — Modify `thank-you.html` to support `?type=rate-alert`**
- Add a `<script>` block after the existing GTM/analytics scripts
- Logic: if `new URLSearchParams(window.location.search).get('type') === 'rate-alert'`, replace:
  - Main headline with: `You're on the Austin Rate Watch list`
  - Subheadline/body with: `Check your inbox — your first rate update arrives this Friday. If you don't see it, check your spam folder once and mark us as "not spam."`
  - **Hide** the Calendly inline booking widget (add `style="display:none"` to the Calendly container if `type=rate-alert`)
  - **Show** a simple "Back to site" or "See current rates" CTA link to `/austin-mortgage-rates.html`
- Do NOT change any existing behavior for `type=pre-approval` or no `type` param (PA funnel must be unaffected)

**Step 3 — Add secondary CTA to `austin-mortgage-rates.html`**
- Find the main content section of the page
- Add a styled CTA section after the rates table or below-fold:
  - Heading: `Never miss a rate move`
  - Body: `Get Austin mortgage rates delivered every Friday — free. Join 300+ homebuyers watching the market.`
  - Button: `Join Austin Rate Watch →` linking to `/rate-alert`
- This is low-risk (adding a link, not modifying form logic) but should be tested visually before deploy

**Step 4 — Verify subscribe-lead.js handles rate-alert tag correctly (READ-ONLY check)**
- Confirm lines handling `notifyPreApprovalLead()` and `enrollInDrip()` do NOT fire when `tag !== 'pre-approval-funnel'`
- Do NOT modify subscribe-lead.js unless a bug is found

**Step 5 — Local test**
- Open `rate-alert.html` in browser
- Fill out form (First Name + Email)
- Verify fetch call fires to `/.netlify/functions/subscribe-lead` (check browser Network tab)
- Verify redirect to `/thank-you.html?type=rate-alert` happens
- Verify thank-you page shows Rate Alert-specific copy
- Verify Calendly widget is hidden on `?type=rate-alert`

**Step 6 — Write build report**
- Save to `tasks/lead-gen/build-reports/[DATE]-rate-alert-funnel-build.md`
- Document every file created/modified, any open items, and Adam action items

---

## Mailchimp Instructions for Adam (cannot be done by Builder via API)

After Builder completes the HTML, Adam must create the Mailchimp automation manually:

1. Go to Mailchimp → Automations → Customer Journeys
2. Create new Journey: `Rate Watch Welcome Series`
3. Starting Point trigger: `Tag is applied` → select tag: `rate-alert`
4. Add 4 journey points with email copy from this spec (Days 0, 3, 7, 14)
5. Set send times: Day 0 = immediate, Day 3 = 3 days after trigger, Day 7 = 7 days, Day 14 = 14 days
6. Set From Name: `Adam Styer` | From Email: `adam@thestyerteam.com`
7. Add unsubscribe footer with physical address: 5900 Balcones Drive Suite 100, Austin TX 78731
8. Activate Journey when testing is complete

Ongoing: create a weekly recurring campaign (every Friday 9:00 AM CT) to send the weekly rate update to all `rate-alert` tagged subscribers.

---

## Tools / Accounts / Credentials Needed

- [x] Netlify account access (styermortgage.com) — Builder can write HTML locally
- [ ] Netlify env vars confirmed: MAILCHIMP_API_KEY, MAILCHIMP_BORROWER_LIST_ID, LOANOS_AGENT_SECRET (required to test subscribe-lead.js end-to-end; same as PA funnel — may already be set)
- [ ] Mailchimp account access (Adam must create Customer Journey in UI)
- [x] Supabase MCP — for verifying LoanOS contact creation (project ID: uuqedsvjlkeszrbwzizl)
- [x] Git / deploy — Adam `git push` from styerteam-mortgage-site repo (can bundle with BLOCKER-003 PA funnel deploy)

---

## Risk Register

| Action | Risk | What Could Go Wrong | Mitigation |
|--------|------|---------------------|------------|
| Create rate-alert.html | LOW | HTML syntax errors; CSS inconsistency | Copy structure from get-preapproved.html |
| Modify thank-you.html | LOW | Breaking existing PA funnel thank-you | Test both `?type=rate-alert` and no-param version before deploy |
| JS submit handler | LOW | fetch() fails silently; lead lost | Show inline error; Netlify Forms `data-netlify="true"` acts as safety net |
| Add CTA to austin-mortgage-rates.html | LOW | Visual regression on SEO page | Check in browser before deploy; revert if broken |
| Mailchimp Customer Journey | MEDIUM | Wrong trigger tag; journey fires to wrong segment | Double-check tag name is exactly `rate-alert` (lowercase, no spaces) |
| Weekly rate email campaigns | MEDIUM | Rate data accuracy — publishing wrong rates | Adam double-checks numbers before each Friday send; template has "check Freddie Mac" note |

---

## Definition of Done

Builder session is complete when:
- [ ] `rate-alert.html` exists in site root with correct form, JS handler, hidden fields, noindex ABSENT, NMLS footer
- [ ] `thank-you.html` shows Rate Alert-specific copy when `?type=rate-alert` is in URL
- [ ] Calendly widget hidden on Rate Alert thank-you state
- [ ] `austin-mortgage-rates.html` has "Join Austin Rate Watch" secondary CTA
- [ ] subscribe-lead.js verified unchanged (READ-ONLY)
- [ ] Local test passes: form submits, redirect happens, correct thank-you copy shows
- [ ] Build report written
- [ ] Mailchimp Customer Journey created by Adam (separate from Builder — add to ADAM-TODO.md)

---

## Compliance Checklist

- [x] TCPA opt-in checkbox: N/A — email-only funnel, no SMS collected at opt-in stage
- [x] CAN-SPAM footer on all emails: Handled by Mailchimp (physical address auto-added to footer; unsubscribe one-click)
- [x] NMLS #513013 on landing page: Required in page title, subheadline, and footer
- [x] Equal Housing Lender on landing page: Required in footer (logo or text)
- [x] No guaranteed approval language: Spec copy does not include any
- [x] No protected class targeting: No geographic, demographic, or income segmentation in this funnel
- [x] Regulation Z: Landing page does not quote a specific rate (general "market rate" copy only). If rate is shown in sample email screenshot, APR must be displayed alongside
- [x] Physical address in email footer: 5900 Balcones Drive Suite 100, Austin TX 78731 (must be in all 4 welcome emails and weekly rate emails)
- [x] Disclaimer in email footer: "Not an offer to lend. All loans subject to credit approval." (in all emails)

---

## Open Questions (non-blocking — Builder can proceed without answers)

1. **Mailchimp list ID**: Confirm `MAILCHIMP_BORROWER_LIST_ID` env var matches the list ID where Rate Watch subscribers should land (same list as PA funnel = 5053c57af2). Same list + tag segmentation is correct strategy.
2. **"Join 300+ Austin homebuyers"**: Use aspirational social proof at launch. Update copy when real subscriber count is known.
3. **Sample rate email screenshot/mockup**: Builder can include a styled text mockup in the "What You Get" section in lieu of an actual screenshot (which doesn't exist yet since the email hasn't been sent).
4. **URL on Netlify**: The live URL will be `https://styermortgage.com/rate-alert` after git push + Netlify deploy. Confirm before promoting.
5. **Google Ads conversion tracking event name**: Check `thank-you.html` for existing GA/Google Ads event names to keep consistent.
