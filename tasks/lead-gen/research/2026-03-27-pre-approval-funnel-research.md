# Research: Pre-Approval Funnel Architecture — Lead Generation
Date: 2026-03-27

## Executive Summary

Adam's contact database is overwhelmingly referral-driven (Realtor Referral is the only cleanly-tracked source at 466 contacts), with 992 contacts tagged "Other" and 801 with no lead source at all — meaning the data is too dirty to produce a meaningful web-vs-referral close rate comparison today. The loans table confirms "Closed" is the correct status value (741 of ~817 loan records), but lead source tagging on the loans table is almost entirely null, so close-rate-by-source is not computable from current data. Website leads exist (7 contacts, most recent March 24 2026) but are tiny. The pre-approval funnel being built has no baseline to beat — it is greenfield, which means any web lead captured is incremental revenue at near-zero marginal cost. Industry best practices point to a 3-5 field multi-step form, a benefit-driven above-fold headline, and a Mailchimp audience split by loan type tag applied at opt-in, with n8n handling the webhook → LoanOS contact creation → SMS/email LO notification stack.

---

## Supabase Lead Source Baseline

### Query 1 — Contacts by Lead Source (all-time)

| Lead Source | Contact Count |
|---|---|
| Other | 992 |
| (null / untagged) | 801 |
| Realtor Referral | 466 |
| Business Referral | 22 |
| Networking Group / Event | 12 |
| Client Referral | 11 |
| Family / Friend | 7 |
| Website | 7 |
| Direct Mail | 4 |
| Zillow | 3 |
| Repeat Client | 2 |
| Web Lead | 1 |
| (blank string) | 1 |
| Seminar | 1 |
| Advertisement | 1 |
| **Total** | **~2,331** |

**Key observation:** "Other" + null + blank = ~1,794 contacts (77% of the database) with no actionable lead source. This is a data hygiene problem, not a lead-mix problem. The 466 Realtor Referral contacts are the only reliably tagged segment. Website + Web Lead = 8 contacts total — a rounding error but proof the capture path works.

### Query 2 — Loans Table Lead Source + Close Rate

| Lead Source | Total Loans | Closed | Close Rate |
|---|---|---|---|
| (null) | 809 | 741 | 91.6% |
| Referral - Business Contact | 5 | 1 | 20.0% |
| Return Client | 2 | 0 | 0.0% |
| Others | 1 | 0 | 0.0% |

**Critical finding:** The loans table lead_source field uses different values than the contacts table ("Referral - Business Contact" vs "Business Referral", etc.) and is almost entirely null. The 91.6% "close rate" on null loans is misleading — those are mostly historical funded loans imported without source tags. **Do not use loans table lead_source for segmentation analysis until data entry discipline is enforced or a migration maps contacts.lead_source → loans.lead_source.**

### Query 3 — Distinct Loan Status Values

| Status | Count |
|---|---|
| **Closed** | **741** |
| Started | 25 |
| Cancelled | 19 |
| On Hold | 9 |
| Dead | 6 |
| APPROVED_WITH_CONDITION | 3 |
| DISCLOSURE_SENT | 3 |
| APPLICATION_INTAKE | 2 |
| CLEAR_TO_CLOSE | 2 |
| Loan in Process | 2 |
| Application | 1 |
| LOAN_FUNDED | 1 |
| PREAPPROVED | 1 |
| Suspended | 1 |
| under_contract | 1 |

**Confirmed:** "Closed" (capitalized) is the primary funded status. LOAN_FUNDED appears once — likely an Arive webhook entry. Status values are a mix of manual entry and Arive webhook formats. Any close rate query must include both `'Closed'` and `'LOAN_FUNDED'` to be accurate.

### Query 4 — Recent Contacts (Last 90 Days) by Lead Source

Results identical to all-time query — the 90-day window captured the full dataset because the bulk of contacts were imported in the March 9 2026 batch (all sources show `most_recent: 2026-03-09`). The March 24 "Website" contact and March 22 "Realtor Referral" contact are the only post-import organic additions visible.

**Key insight for lead gen:** Adam has 7 Website-sourced contacts and they are recent (most recent March 24). The web lead capture system is functioning. Every contact the pre-approval funnel generates is currently uncaptured revenue — there is no cannibalization risk.

---

## Industry Benchmarks — Pre-Approval Funnel

Source: [Kaleidico — High-Converting Mortgage Landing Page](https://kaleidico.com/mortgage-landing-page-2025/), [BankingBridge — 4 Tips for Mortgage Landing Pages That Convert](https://www.bankingbridge.com/post/4-tips-to-help-you-build-mortgage-landing-pages-that-convert), [Genesys Growth — Landing Page Conversion Stats 2026](https://genesysgrowth.com/blog/landing-page-conversion-stats-for-marketing-leaders)

### Conversion Rate Benchmarks

- Mortgage/financial services landing pages average **2–5% conversion** (visitor to lead)
- Top-performing mortgage pages reach **8–12%** with multi-step forms and strong intent matching
- Reducing form fields from 11 → 4 produced a documented **120% conversion lift** in one financial services test
- Page load time matters: **conversion drops 4.42% per second** in the first 5 seconds
- Under 2-second load time is the target for mortgage landing pages

### Field Count and Form Design

- **3–5 fields maximum** for initial form (Kaleidico standard)
- Recommended initial capture fields: First Name, Last Name, Email, Phone, Loan Type (Purchase/Refi)
- Multi-step form (step 1: contact info → step 2: loan details) increases completion rates vs. single long form
- Progressive disclosure: ask timeline and credit range on step 2, not step 1
- Remove navigation from landing pages — every exit link kills conversion

### Above-the-Fold Elements That Drive Conversion

1. Benefit-driven headline matched to traffic source intent (e.g., "See What You Qualify For in 3 Minutes")
2. Reinforcing subheadline (specificity wins: "No credit pull. No obligation.")
3. Lifestyle hero image or short video (mobile-first — over 60% of mortgage research starts on mobile)
4. Single contrasting CTA button — "Get My Rate" or "Check My Approval" outperform generic "Submit"
5. Trust strip below the fold: NMLS ID, Equal Housing logo, BBB badge, years in business

### Thank-You Page Best Practices

- Confirm the action taken: "Your pre-approval request was received."
- Set expectation for next step: "Adam will call you within 5 minutes during business hours."
- Include a secondary CTA: Calendly link for self-scheduling if outside business hours
- Do NOT redirect to the homepage — that breaks the funnel tracking and the user experience

---

## Mailchimp Segmentation Patterns for Mortgage

Source: [Kaleidico — Mortgage Leads Drip Email](https://kaleidico.com/mortgage-leads-drip-email/), [Mailchimp — All Segmenting Options](https://mailchimp.com/help/all-the-segmenting-options/), [MegaLeads — Email Marketing for Mortgage Brokers 2025](https://megaleads.com/blog/email-marketing-for-mortgage-brokers/)

### Audience Structure

- **One Mailchimp audience per business** (not one per loan type) — splitting audiences breaks suppression lists and merge tag consistency
- Use **Tags** to differentiate lead type within a single audience:
  - `pre-approval-funnel` — applied on opt-in from the pre-approval landing page
  - `purchase-buyer` — applied when loan_type = Purchase
  - `refi-interest` — applied when loan_type = Refinance
  - `austin-buyer` — applied when zip code is Austin metro
  - `web-lead` — applied to all web-originated contacts (distinct from realtor referrals)

### Welcome Sequence Timing and Topics

Based on Kaleidico's drip structure with mortgage-specific adaptation:

| Email | Day | Topic |
|---|---|---|
| 1 | Day 0 (immediate) | Welcome + what to expect + Calendly link |
| 2 | Day 2 | "What does pre-approval actually mean?" — educational |
| 3 | Day 5 | "What hurts your approval?" — credit/DTI basics |
| 4 | Day 10 | Rate environment + lock strategy (positions Adam as expert) |
| 5 | Day 17 | Social proof — 1 client story, no jargon |
| 6 | Day 28 | Soft re-engagement — "Still thinking about it?" + direct CTA |

Target benchmarks for this sequence: **40% open rate, 10% CTR, 5% conversion to application within 90 days** (Kaleidico benchmark for mortgage drip).

### Behavioral Triggers for Sequence Advancement

- Clicked Calendly link → pause nurture, flag as hot lead, trigger LO notification
- Opened email 3+ times without clicking → trigger "high interest" tag, send direct follow-up
- No open in 30 days → move to monthly cadence (prevent unsubscribes)
- Submitted application → remove from nurture, add to "active borrower" segment

### Purchase vs. Refi Branching

- Apply tag at opt-in based on form field "Are you buying or refinancing?"
- Purchase track emphasizes: pre-approval speed, purchase timeline, realtor coordination
- Refi track emphasizes: break-even analysis, rate comparison, when it makes sense to refi
- Both tracks share emails 1–2 (universal welcome/education), diverge from email 3 onward

---

## Real-Time LO Notification Patterns

Source: [n8n Webhook integrations](https://n8n.io/integrations/webhook/), [n8n Real Estate Open House Follow-Up Template](https://n8n.io/workflows/9256-automate-real-estate-open-house-follow-ups-with-signsnaphome-hubspot-and-twilio/), [Mailparser — 10 Ways Mortgage Brokers Can Automate Lead Gen](https://mailparser.io/blog/mortgage-brokers-automate-lead-generation/)

### Notification Stack Architecture

The proven pattern for independent mortgage brokers is a 3-channel notification stack, triggered in sequence from a single webhook:

```
Web Form Submit
  → n8n Webhook (existing subscribe-lead.js pattern)
    → Create/Update contact in LoanOS (Supabase)
    → Add contact to Mailchimp (tag: pre-approval-funnel + loan type)
    → Send LO email notification (Outlook via existing n8n credential)
    → Send LO SMS notification (Twilio or similar)
    → Log activity to activity_log table
```

### Email vs. SMS vs. App

- **Email notification**: Always send — it creates a paper trail and works during meetings when phone is silenced. Include full lead details (name, phone, email, loan type, timestamp).
- **SMS notification**: Critical for speed-to-contact. A plain text message fires within 10 seconds of form submission. Format: "New lead: [First] [Last] — [loan type] — [phone]. Reply or call now."
- **App push**: Skip — adds complexity, no meaningful advantage over SMS for a solo LO.

### Webhook to Contact Creation Timing

- Contact should be created in LoanOS Supabase **before** notifications fire — if LO calls back immediately, the contact record needs to already exist
- Mailchimp subscribe can fire async (parallel with notifications) — slight delay acceptable
- Total n8n execution target: under 3 seconds from webhook receipt to all notifications sent

### Existing n8n Pattern to Extend

The existing "LoanOS — Web Lead Automation" workflow (`PiuIsQpBuydtFM4m`) already handles the webhook → Supabase → Mailchimp path. The pre-approval funnel should either:
1. **Extend that workflow** with a new webhook path and notification step, OR
2. **Create a new workflow** for pre-approval specifically (cleaner separation, easier debugging)

Recommendation: New workflow — pre-approval leads have different urgency and data fields than generic web leads.

---

## Compliance Requirements for Pre-Approval Funnel

Source: CFPB mortgage marketing guidelines, TCPA 2026 FCC rules (established — see prior research), CAN-SPAM Act

### Required Elements on the Landing Page

- **NMLS disclosure**: "Adam Styer NMLS #513013 | Adam Styer | Mortgage Solutions LP" — must appear on every page that solicits mortgage business
- **Equal Housing Lender logo** — required for federally regulated mortgage advertising
- **Privacy policy link** — required by CAN-SPAM and best practice for TCPA

### Form Submission Agreement Language

Per BLOCKER-001 (established in 2026-03-25 research), the form must include an explicit TCPA consent checkbox (unchecked by default) with language such as:

> "By checking this box, I consent to receive calls and text messages from Adam Styer at the number provided, including by autodialer. Consent is not a condition of purchase. Message and data rates may apply. Reply STOP to opt out."

The checkbox must be separate from the form submission — a blanket "by submitting you consent" footer is no longer compliant under 2026 FCC one-to-one consent rules.

### Mailchimp / Email Compliance

- CAN-SPAM requires: physical mailing address, clear unsubscribe link, honest subject lines
- Mailchimp's standard footer handles CAN-SPAM automatically
- Do not use misleading subject lines like "Your Pre-Approval is Ready" before one has been issued
- Welcome email must clearly identify sender: "Adam Styer, Mortgage Broker, Austin TX, NMLS #513013"

---

## Recommended Pre-Approval Funnel Stack for Adam

### What to Build (in order)

1. **Landing page** at `styermortgage.com/get-preapproved` (or dedicated `/pre-approval` path)
   - Headline: "Get Pre-Approved in 24 Hours — No Credit Pull Required to Start"
   - 3-field initial form: First Name, Email, Phone
   - Step 2 (same page, revealed after step 1): Loan Type (Purchase/Refi), Timeframe, Estimated Credit
   - Trust strip: NMLS #513013, Equal Housing, "1,000+ loans closed"
   - TCPA checkbox (unchecked, required before submit)
   - Thank-you page with Calendly link and 5-minute callback promise

2. **n8n workflow** — "LoanOS — Pre-Approval Funnel" (new, separate from web lead workflow)
   - Webhook receives form POST
   - Code node normalizes fields
   - Supabase: create contact (lead_source = "Website", tag = "pre-approval-funnel")
   - Mailchimp: subscribe to main audience with tags (pre-approval-funnel + purchase-buyer OR refi-interest)
   - Outlook: send LO notification email with full lead details
   - SMS: send LO text notification (need Twilio credential or use existing SMS path if available)
   - activity_log: log the event

3. **Mailchimp automation** — "Pre-Approval Welcome Series"
   - Trigger: tag added "pre-approval-funnel"
   - 6-email sequence per timing table above
   - Branch at email 3: purchase track vs. refi track based on tag

### How to Wire to subscribe-lead.js Pattern

The existing `subscribe-lead.js` API route (or equivalent) posts to n8n via webhook. The pre-approval form should POST to a new n8n webhook URL (not the same endpoint as the generic web lead form) so the two flows remain independently debuggable. Form submission handler:

```javascript
// On form step 2 submit
const payload = {
  first_name, last_name, email, phone,
  loan_type,       // "purchase" or "refi"
  timeframe,       // "0-3 months", "3-6 months", "6-12 months", "just researching"
  credit_range,    // "760+", "720-759", "680-719", "below 680"
  source: "pre-approval-landing-page",
  tcpa_consent: true,  // only submitted if checkbox was checked
  submitted_at: new Date().toISOString()
};
await fetch('/api/subscribe-preapproval', { method: 'POST', body: JSON.stringify(payload) });
```

### Mailchimp Audience

- **Audience name**: Adam Styer | Mortgage Solutions (existing — do not create a second audience)
- **Tags applied on opt-in**: `pre-approval-funnel`, `web-lead`, and either `purchase-buyer` or `refi-interest`
- **Automation trigger**: Tag = `pre-approval-funnel`

---

## Gap Analysis

| Gap | Current State | Best-in-Class | Priority |
|---|---|---|---|
| Web lead capture volume | 7 contacts ever | 20–50/month from targeted landing page | Critical |
| Lead source data quality | 77% null/Other | Clean tag on every contact | High |
| LO notification speed | Unknown (no SMS step confirmed) | SMS within 10 seconds of form submit | High |
| Mailchimp welcome sequence | None confirmed for web leads | 6-email sequence, purchase/refi branched | High |
| Thank-you page | Unknown — needs audit | Calendly + callback promise | Medium |
| TCPA consent | BLOCKER-001 flagged March 25 | Explicit unchecked checkbox + one-to-one consent | Critical (compliance) |
| Loans table lead_source tagging | Almost entirely null | Tag every loan at creation from contact.lead_source | Medium |
| Status value standardization | Mix of manual + Arive formats | Normalize to single set for reporting | Low |

---

## Open Questions

These need Adam's decision before the Architect can fully spec the pre-approval funnel:

1. **SMS provider**: Does Adam have a Twilio account or equivalent? The n8n notification stack needs an SMS credential. If not, is he open to adding one (~$20/month)?

2. **Landing page URL**: `/get-preapproved` (existing path per BLOCKER-001 audit) vs. `/pre-approval` — which should be canonical? Current prequal.html was found to be broken (BLOCKER-002).

3. **Calendly on thank-you page**: The Calendly link (https://calendly.com/adamstyer/15minutes) is for 15-minute calls. Is that the right CTA post-submission, or should it be a dedicated "pre-approval call" event type?

4. **Mailchimp audience**: Confirm there is one primary audience already set up. If multiple audiences exist, consolidation may be needed before building the automation.

5. **Purchase/Refi branch timing**: Does Adam want fully separate email sequences from email 1, or shared emails 1–2 with a branch at email 3?

6. **Business hours callback window**: The thank-you page should state when Adam will call. What hours? What happens on weekends — does the "5 minutes" promise apply or is it next business day?
