# Funnel Spec: First-Time Buyer DPA Guide — Lead Generation
Date: 2026-04-02
Status: READY FOR EXECUTION
Week: 4 of 8

---

## Scope

### In Scope
- New landing page: `ftb-dpa-guide.html` (single new file — do NOT touch existing ftb-guide pages)
- Thank-you page: modify `thank-you.html` to support `?type=ftb-dpa-guide` query param with DPA-specific copy
- Mailchimp: 8-email "FTB DPA Guide Welcome Series" automation (Builder writes copy; Adam creates in Mailchimp UI)
- subscribe-lead.js: **ONE CODE CHANGE** — suppress `sendGuideEmail()` for `ftb-dpa-guide` tag so the FTB Guide n8n Outlook email does NOT fire for DPA funnel leads (see Integration section)
- n8n routing: reuse existing `LoanOS — Web Lead Automation` workflow (ID: `PiuIsQpBuydtFM4m`) — no new workflow needed
- LO notification: **YES** — DPA leads are warm/high-intent; add DPA funnel to notify condition alongside PA funnel

### Out of Scope
- SMS follow-up: email-only funnel. No phone field, no TCPA opt-in checkbox.
- PDF creation: the guide PDF is a separate deliverable (Adam or Canva). The landing page describes the guide and delivers a download link — Builder can use a placeholder link for now.
- Calculator/interactive tool: deferred (identified as a Week 5 upgrade opportunity)
- Realtor co-branded version: deferred
- Long-term evergreen sequence (post Day 52): out of scope for this build; add to backlog
- Homepage hero CTA update: deferred to a separate build session
- prequal.html changes: out of scope

### Pre-Conditions Before Builder Executes
- [ ] Confirm Netlify env var `LOANOS_URL` is set (required for subscribe-lead.js contact creation)
- [ ] Confirm `MAILCHIMP_BORROWER_LIST_ID`, `MAILCHIMP_API_KEY`, `LOANOS_AGENT_SECRET` are set (same as PA funnel — should already be live)
- [ ] Adam must have a DPA guide PDF or placeholder download link before promoting the funnel live
- [ ] Adam creates "FTB DPA Guide Welcome Series" in Mailchimp UI after Builder delivers email copy

---

## Funnel Architecture

### Traffic Source
1. **Primary (near-term):** Social posts — Adam shares on Facebook, Instagram, LinkedIn via Publer with "Get the free Austin DPA guide" CTA linking to `styermortgage.com/ftb-dpa-guide`
2. **Secondary:** Realtor referrals — Adam emails top 5–10 realtor partners: "Pass this to any buyer who asks about down payment help"
3. **Tertiary:** Existing FTB content pages on styermortgage.com — add a link/banner to DPA guide from the FTB guide landing page (if it exists) and from any FTB blog content
4. **Future (Month 2+):** Google Ads targeting "Austin first-time home buyer" + "Texas down payment assistance" search terms

### Landing Page Design
- **URL slug:** `ftb-dpa-guide` (→ styermortgage.com/ftb-dpa-guide)
- **HTML file:** `ftb-dpa-guide.html` (placed in site root alongside get-preapproved.html)
- **Page title:** `Free Austin DPA Guide | First-Time Buyer Down Payment Help | Adam Styer NMLS #513013`
- **Meta description:** `Eligible Austin buyers may receive up to $25,000 as a grant toward their down payment. Download the free guide and see which programs you qualify for. No obligation.`
- **noindex:** NO — this page should be indexed
- **Netlify form name:** `ftb-dpa-guide-form`
- **Above-fold headline:** `Austin First-Time Buyers: You May Qualify for Up to $25,000 in Down Payment Help`
- **Subheadline:** `Most buyers have no idea these programs exist. Download the free guide and find out if you're eligible — takes 60 seconds.`
- **Form fields (3 total):**
  1. `fname` — First Name (placeholder: "First Name", required)
  2. `email` — Email Address (placeholder: "Your Email", type="email", required)
  3. `phone` — Phone Number (placeholder: "Phone (optional)", type="tel", NOT required — included because DPA leads are warm and Adam wants a call path)
- **SMS opt-in checkbox:** NO (email-only funnel)
- **Hidden form fields (added by JS before submit):**
  - `tag` = `ftb-dpa-guide`
  - `lead_source` = `FTB DPA Guide`
  - `page_url` = `window.location.href`
  - `utm_source` = read from URL param (or `direct` if none)
  - `utm_medium` = read from URL param (or `web` if none)
  - `utm_campaign` = read from URL param (or `ftb-dpa-guide` if none)
  - `utm_term` = read from URL param (or empty)
  - `utm_content` = read from URL param (or empty)
- **CTA button text:** `Send Me the Free Guide →`
- **Trust signals (below button, above fold):**
  - `Free. No spam. Unsubscribe anytime.`
  - `NMLS #513013 | Equal Housing Lender`
  - `1,000+ Austin families helped since 2017`
- **Thank-you redirect URL:** `/thank-you.html?type=ftb-dpa-guide`
- **Lead Source tag:** `FTB DPA Guide`

### Below-Fold Structure

```
WHAT'S IN THE GUIDE (3 bullets — scannable)
├── Which Austin DPA programs are open right now — and who qualifies
├── The "Do I Qualify?" checklist: 5 questions that take 2 minutes
└── How to get the grant without adding a second monthly payment

"DO I QUALIFY?" MINI-CHECKLIST (conversion booster — 4 bullets w/ checkboxes)
├── ☑ First-time buyer (or haven't owned a home in 3 years)
├── ☑ Household income under $167,000 (Travis County)
├── ☑ Credit score 620 or above
└── ☑ Buying in Austin or Travis County
→ "If you checked 3 or 4 of these, you likely qualify. Get the guide."

CREDIBILITY BLOCK
├── "I've helped Austin buyers close with as little as $3,000 out of pocket using these exact programs."
├── Independent broker — I work for you, not a bank
├── NMLS #513013 | Austin, TX since 2017 | 1,000+ loans closed
└── Access to 40+ wholesale lenders

PROGRAM PREVIEW (brief — tease the guide content)
├── TSAHC Home Sweet Texas: up to 5% as a true grant — no repayment ever
├── TDHCA My First Texas Home: up to 5% deferred second mortgage, 0% interest
└── City of Austin: up to $40,000 forgivable loan (income-restricted)
→ Small disclaimer: "Program availability and limits subject to change. Verify current terms at program websites."

FOOTER
└── © Adam Styer | Mortgage Solutions LP | NMLS #513013
    Equal Housing Lender | 5900 Balcones Drive Suite 100, Austin TX 78731
    Adam is licensed in Texas. This is not an offer to lend. All loans subject to underwriting approval.
    DPA program details are for informational purposes only and subject to program availability.
```

### subscribe-lead.js Integration

**Required payload fields:**
```json
{
  "email": "lead@example.com",
  "fname": "First",
  "phone": "5125551234",
  "tag": "ftb-dpa-guide",
  "lead_source": "FTB DPA Guide",
  "page_url": "https://styermortgage.com/ftb-dpa-guide",
  "utm_source": "social",
  "utm_medium": "organic",
  "utm_campaign": "ftb-dpa-guide"
}
```

**One code change required in subscribe-lead.js:**

The existing `sendGuideEmail()` call (line 97–101) fires unconditionally for ALL submissions and sends an email via the `ftb-guide-email` n8n webhook. This is the FTB Guide welcome email — it must NOT fire for DPA funnel leads.

**Fix:** Wrap the `sendGuideEmail()` call in a tag check:

```javascript
// BEFORE (current code):
sendGuideEmail({ email, fname }).catch(err =>
  console.error("[subscribe-lead] Guide email failed:", err.message)
);

// AFTER (required change):
if (tag === "ftb-guide") {
  sendGuideEmail({ email, fname }).catch(err =>
    console.error("[subscribe-lead] Guide email failed:", err.message)
  );
}
```

**LO Notification:** DPA leads are warm/high-intent. Add DPA funnel lead notification. Extend the existing `notifyPreApprovalLead()` condition to include DPA leads:

```javascript
// BEFORE:
if (lead_source === "Pre-Approval Funnel") {

// AFTER:
if (lead_source === "Pre-Approval Funnel" || lead_source === "FTB DPA Guide") {
```

This fires the same `N8N_PA_LEAD_URL` (`pre-approval-lead` webhook) for DPA leads so Adam gets an Outlook notification. The n8n workflow `LoanOS — Pre-Approval Lead Notify` (ID: `J9Pe24vUi6fpZtdZ`) already handles this pattern.

**What does NOT fire for `ftb-dpa-guide` tag:**
- `sendGuideEmail()` — FTB Guide email webhook (suppressed per fix above)
- `enrollInDrip()` — PA drip enrollment (only fires for PA funnel)

**What DOES fire:**
- `subscribeToMailchimp()` — applies `ftb-dpa-guide` tag → triggers Mailchimp automation
- `createLoanosContact()` — creates contact with `lead_source: "FTB DPA Guide"`
- `notifyPreApprovalLead()` — sends LO notification (DPA is warm lead, same as PA)

---

## Email Sequence — Full Copy (All 8 Emails)

**From name:** Adam Styer
**From email:** adam@styermortgage.com
**Reply-to:** adam@styermortgage.com

**Standard footer (append to every email):**
```
Adam Styer | NMLS #513013
Adam Styer | Mortgage Solutions LP
(512) 956-6010 | styermortgage.com
5900 Balcones Drive Suite 100 | Austin, TX 78731

You're receiving this because you downloaded the Austin DPA Guide at styermortgage.com.
Unsubscribe anytime — link below. Equal Housing Lender.
Not an offer to lend. All loans subject to credit approval. DPA program details are subject to change — verify current terms with program administrators.
```

---

### Email 1 — Day 0 (send immediately on tag applied)
**Subject:** `Your Austin DPA guide is here (read this first)`
**Preview text:** `One thing to do today while it's still fresh`

---

Hi [First Name],

Your guide is attached — but before you dig in, I want to flag the single most important thing in it.

Most Austin first-time buyers are sitting on the sideline waiting until they have 20% saved. That's $80,000+ on a $400K home. It could take years.

Here's what most of them don't know: there are programs that give eligible Austin buyers up to 5% of the purchase price as a grant. No repayment. No second mortgage payment. A true gift toward your down payment.

On a $350,000 home, that's $17,500 you didn't have to save.

The guide breaks down every major program available in Austin right now, who qualifies, and exactly how the money works.

Read pages 1–3 first — that's the program overview and the "Do I Qualify?" checklist.

**→ [Download the Austin DPA Guide] (link placeholder)**

One question for you: Are you already working with a real estate agent, or are you still in the research phase? Just reply — I read every message.

Adam

---

### Email 2 — Day 2
**Subject:** `The myth that's kept Austin buyers renting for years`
**Preview text:** `73% of first-time buyers put down less than 15%. Here's what they actually paid.`

---

Hi [First Name],

Most buyers believe they need 20% down before they can buy a home. I hear it constantly.

It's wrong — and it's costing people years.

NAR data shows 73% of first-time buyers put down 15% or less. The typical first-time buyer puts down 6–9%. FHA requires just 3.5%. Conventional loans start at 3%.

And with down payment assistance? Some Austin buyers close with $3,000–$5,000 out of pocket total.

The 20% myth exists because it was true decades ago and because the internet keeps repeating it. The mortgage market moved on. The myth didn't.

Here's what matters for Austin in 2026:

The TSAHC Home Sweet Texas program — the one I lead with in your guide — allows household incomes up to $167,250 in Travis County. That covers the majority of Austin households. And the assistance is a grant. Not a loan. Not a deferred second mortgage. A grant.

Eligible buyers can receive up to 5% of their purchase price. On a $400,000 home, that's $20,000 you don't have to save.

If you haven't looked at the "Do I Qualify?" checklist in the guide yet — now's the time.

**→ [Get the guide again] (link placeholder)**

Adam

---

### Email 3 — Day 5
**Subject:** `DPA is not a second payment. Here's what it actually is.`
**Preview text:** `The most common DPA misconception — and why it matters`

---

Hi [First Name],

A lot of buyers assume DPA programs come with a catch: a second mortgage payment on top of your regular payment, making the whole thing unaffordable.

That's not how Texas DPA works.

Here's what's actually available right now:

**TSAHC Home Sweet Texas (the one I recommend most):**
You choose a grant or a forgivable second lien. If you take the grant — it's yours. No repayment. No lien. Gone. On a $350,000 home, you're looking at up to $17,500 as a gift.

**TDHCA My First Texas Home:**
A 0% interest second mortgage with no monthly payment. It's deferred — nothing due until you sell or refinance. Most buyers stay in their home long enough that it essentially disappears.

**Travis County Hill Country DPA:**
4–6% of the purchase price, forgiven after 10 years. No payment required during that time.

The only real "catch" with forgivable programs: if you sell or refinance before the forgiveness period ends, you may owe back a portion. But if you stay in the home — which most buyers do — it costs you nothing.

None of these programs add a monthly payment.

If you want to see how the numbers would work for your specific purchase price, reply with your approximate target home price and I'll run it for you.

Adam

---

### Email 4 — Day 10
**Subject:** `How a buyer closed their Austin home with $4,100 out of pocket`
**Preview text:** `Real numbers from an Austin first-time buyer`

---

Hi [First Name],

I want to tell you about a buyer I helped close last year — I'll call her Sarah.

She was renting in South Austin. Her household income was around $88,000. She had $18,000 saved and thought she needed at least $40,000 before she could buy.

She was wrong.

We ran her through the TSAHC Home Sweet Texas program. She qualified for a 5% grant — $16,750 on a $335,000 home. We paired it with a conventional loan and seller concessions for closing costs.

Her total cash out of pocket at closing: $4,100.

She's been in her home for 18 months. No second payment. No repayment on the grant. She owns a home she thought was 3+ years away.

Sarah is not unusual. Eligible buyers at her income level are exactly who TSAHC was designed for — working households who earn too much for deep-subsidy programs but not enough to save 10–20% in Austin's market.

If her income and situation sounds close to yours, there's a real chance you qualify too.

When you're ready to find out — that's what the next step looks like: a quick 15-minute call where I pull your scenario and we run the actual numbers.

No credit pull. No obligation. Just your numbers.

**→ Book a free 15-minute call: https://calendly.com/adamstyer/15minutes**

Adam

---

### Email 5 — Day 17
**Subject:** `Does your credit score qualify for DPA? (Here's the threshold)`
**Preview text:** `You might already be there — check these 3 numbers`

---

Hi [First Name],

I get this question a lot: "My credit isn't perfect. Will I still qualify?"

For most Texas DPA programs, the minimum is lower than you probably think.

Here's the breakdown:

**TSAHC Home Sweet Texas:** 620 minimum FICO score
**TDHCA My First Texas Home:** 620 minimum (participating lenders typically require 640)
**Travis County Hill Country DPA:** 640 minimum

If your score is 620–680, you're in the FHA sweet spot. FHA + DPA is one of the most powerful combinations available for first-time buyers. The rate is slightly higher than conventional, but the lower down payment and grant mean your total cash out of pocket is dramatically lower.

If your score is above 680, you may qualify for conventional financing paired with DPA — which eliminates FHA's mortgage insurance premium and often results in a lower monthly payment.

If your score is below 620, that doesn't close the door forever. It means we spend 3–6 months getting it there first. I've helped buyers do exactly that.

Take 60 seconds and run through these 3 self-qualification questions:

1. Is your credit score 620 or above? (Check Credit Karma — it's free)
2. Is your household income below $167,250?
3. Have you owned a home in the last 3 years?

If you answered yes, yes, no — you're in range.

Reply and tell me where you landed. I'll point you to the right program.

Adam

---

### Email 6 — Day 25
**Subject:** `What's changed in Austin's market (and why FTBs are moving)`
**Preview text:** `Austin's median price dropped 20%+ from its 2022 peak`

---

Hi [First Name],

Quick market update — because a lot of buyers I talk to are still mentally stuck in 2021.

Austin's housing market has changed significantly since the peak.

The metro median sale price dropped from $550,000+ at the 2022 peak to around $412,000–$430,000 in early 2026. Inventory is up. Days on market are longer. Sellers are negotiating again.

That matters for first-time buyers for two reasons:

**Reason 1:** Prices are lower than they were — which means your down payment assistance goes further. A 5% grant on a $415,000 home is $20,750. On a $550,000 home, the math and eligibility get harder.

**Reason 2:** You can negotiate. In 2021, buyers were waiving inspections and paying $100K over asking. Today, you can ask for seller concessions toward closing costs — which reduces your out-of-pocket even further when stacked with DPA.

We're not in a buyer's market. But we're closer to one than any time since 2019.

The buyers who waited for "the crash" mostly got left behind. The buyers who understood their numbers and moved when they qualified — they're building equity.

If you've been watching and waiting, this is worth a real conversation.

**→ Book a 15-minute call: https://calendly.com/adamstyer/15minutes**

No pressure. Just numbers.

Adam

---

### Email 7 — Day 38
**Subject:** `It takes 15 minutes. Here's exactly what happens when you get pre-approved.`
**Preview text:** `No surprises. No hard sell. Here's the whole process.`

---

Hi [First Name],

A lot of people put off getting pre-approved because they don't know what they're walking into.

Here's the entire process, start to finish:

**Step 1 — 15-minute application**
You fill out a short form online. Basic info: income, employment, assets, the type of home you're looking for. No documents yet — just numbers.

**→ Apply here: https://mslp.my1003app.com/513013/register**

**Step 2 — Soft credit pull (no score impact)**
I pull a soft inquiry first to review your credit profile. Your score does not change.

**Step 3 — I run your DPA eligibility**
Once I have your numbers, I check every program you qualify for — TSAHC, TDHCA, Travis County, City of Austin if applicable — and show you exactly what each program means for your monthly payment and cash to close.

**Step 4 — You get a real pre-approval letter**
If you qualify, you get a pre-approval letter for your specific purchase price and loan type. Takes 24–48 hours after your application.

That's it. No obligation. No cost. No sales pitch at the end.

The pre-approval doesn't lock you in. It just tells you exactly where you stand — which means when the right house comes up, you can move fast.

If you have a question before you start, just reply. I'm here.

Adam

---

### Email 8 — Day 52
**Subject:** `Still renting? Let's run your actual numbers for free.`
**Preview text:** `One call. Real numbers. No guessing after that.`

---

Hi [First Name],

You downloaded the Austin DPA guide about 7 weeks ago.

I want to ask you a direct question: what's keeping you from taking the next step?

If it's "I'm not sure I qualify" — that's exactly what the call is for.
If it's "I don't feel financially ready" — I'll tell you honestly whether you are or not.
If it's "I'm not in a rush" — fair. But Austin inventory doesn't stay put, and DPA programs are funded on a first-come basis.

Here's what I'm offering: one free 15-minute call. I'll look at your income, credit range, and purchase price target. I'll tell you which programs you likely qualify for, how much assistance you'd receive, and what your monthly payment would look like.

No credit pull. No commitment. No sales pressure.

If the numbers work, great — we move forward together. If they don't work yet, I'll tell you what to do differently and when to come back.

Either way, you stop guessing.

**→ Book your free 15-minute call: https://calendly.com/adamstyer/15minutes**
**→ Or apply directly: https://mslp.my1003app.com/513013/register**

If neither of those fits, just reply to this email. We'll figure it out.

Adam

---

## Mailchimp Automation Trigger

- **Audience:** Borrower audience (existing list — same as PA funnel and Rate Alert; tag-based segmentation)
- **Trigger:** Tag `ftb-dpa-guide` applied to member
- **Automation name:** `FTB DPA Guide Welcome Series`
- **Automation type:** Customer Journey
- **Send schedule:**
  - Email 1: Immediately on trigger (Day 0)
  - Email 2: 2 days after trigger
  - Email 3: 5 days after trigger
  - Email 4: 10 days after trigger
  - Email 5: 17 days after trigger
  - Email 6: 25 days after trigger
  - Email 7: 38 days after trigger
  - Email 8: 52 days after trigger
- **From name:** Adam Styer
- **From email:** adam@styermortgage.com
- **Reply-to:** adam@styermortgage.com
- **Exit condition:** Member unsubscribes OR completes all 8 emails. No auto-exit based on conversion event (Mailchimp can't detect Calendly bookings natively — Adam removes tag manually if lead converts before sequence ends)
- **Do NOT cross-trigger:** Verify the trigger tag is exactly `ftb-dpa-guide` — not `ftb-guide` (that tag triggers the separate FTB Guide Welcome Series)

---

## n8n Workflow / LoanOS Routing

- **Workflow handling new lead capture:** `LoanOS — Web Lead Automation` (ID: `PiuIsQpBuydtFM4m`) — this workflow receives the contact created by subscribe-lead.js via `/api/contacts/web-lead` and handles LoanOS record creation and activity logging. No new workflow needed.
- **LO notification workflow:** `LoanOS — Pre-Approval Lead Notify` (ID: `J9Pe24vUi6fpZtdZ`) — fires via `N8N_PA_LEAD_URL` webhook after the subscribe-lead.js code change adds `FTB DPA Guide` to the notify condition
- **LoanOS contact fields to populate:**

| Field | Value |
|-------|-------|
| `first_name` | From form `fname` |
| `last_name` | Empty (not collected) |
| `email` | From form `email` |
| `phone` | From form `phone` (optional — may be empty) |
| `lead_source` | `FTB DPA Guide` |
| `referral_type` | `web_lead` |
| `status` | `lead` (default in LoanOS) |
| `campaign` | From `utm_campaign` or `utm_source` |

- **Stage in LoanOS:** Lead
- **Adam notification:** YES — Outlook notification fires via `J9Pe24vUi6fpZtdZ` (same as PA funnel). DPA guide opt-in is warm/high-intent; Adam should know within minutes.

---

## Conversion Rate Targets

| Stage | Target |
|-------|--------|
| Landing page → opt-in | 15–20% |
| Email 1 open rate | 55–65% (warm, just opted in) |
| Email sequence avg open rate | 30–40% |
| Nurture → qualified lead (books a call) | 5–8% |

---

## Execution Instructions for Builder

Execute in this exact order. Do not skip steps.

**Step 1 — Modify `subscribe-lead.js`**
- File: `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site/netlify/functions/subscribe-lead.js`
- **Change 1:** Wrap the `sendGuideEmail()` call at lines 97–101 in a tag check: `if (tag === "ftb-guide") { sendGuideEmail(...) }` — prevents FTB Guide Outlook email from firing for DPA leads
- **Change 2:** Change the `notifyPreApprovalLead()` condition from `if (lead_source === "Pre-Approval Funnel")` to `if (lead_source === "Pre-Approval Funnel" || lead_source === "FTB DPA Guide")` — enables LO notification for DPA leads
- Regression test: after changes, verify Rate Alert submissions still do NOT trigger `sendGuideEmail()` or `notifyPreApprovalLead()`, and FTB Guide submissions still trigger `sendGuideEmail()`

**Step 2 — Create `ftb-dpa-guide.html`**
- File location: `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site/ftb-dpa-guide.html`
- Use `get-preapproved.html` as the structural template (same header, footer, CSS imports, GTM setup)
- Strip nav links (use landing page header pattern — same as get-preapproved.html's `.lp-header` pattern)
- Build the page per the Landing Page Design section above (headline, subheadline, form, below-fold structure)
- Form fields: `fname` (text, required), `email` (email, required), `phone` (tel, optional)
- Hidden fields set by JS: `tag`, `lead_source`, `page_url`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`
- Form attributes: `data-netlify="true"`, `name="ftb-dpa-guide-form"`, `action="javascript:void(0)"`
- JS submit handler: intercept submit → build payload → `fetch('/.netlify/functions/subscribe-lead', { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } })` → on success redirect to `/thank-you.html?type=ftb-dpa-guide`
- Error handling: show inline error message if fetch fails
- UTM params: read from `window.location.search` on page load, store in JS vars for payload
- noindex: ABSENT (this page should be indexed)
- NMLS #513013 in page title AND footer
- Equal Housing Lender in footer

**Step 3 — Modify `thank-you.html` to support `?type=ftb-dpa-guide`**
- Add to the existing `type` param JS block in `thank-you.html`:
  - If `type === "ftb-dpa-guide"`:
    - Headline: `Your Austin DPA Guide Is On Its Way`
    - Subheadline: `Check your inbox — it'll arrive in the next few minutes. While you wait, book a free 15-minute call to find out exactly which programs you qualify for.`
    - Show Calendly widget (DPA leads are warm — Calendly IS appropriate, unlike Rate Alert)
    - Add secondary CTA link: `Or start your application: https://mslp.my1003app.com/513013/register`
- Do NOT modify behavior for `type=pre-approval`, `type=rate-alert`, or no `type` param

**Step 4 — Verify subscribe-lead.js changes are correct (re-read the file after edits)**
- Confirm `sendGuideEmail()` only fires when `tag === "ftb-guide"`
- Confirm `notifyPreApprovalLead()` fires when `lead_source === "Pre-Approval Funnel" || lead_source === "FTB DPA Guide"`
- Confirm `enrollInDrip()` still only fires for `lead_source === "Pre-Approval Funnel"` (no drip for DPA leads — Mailchimp handles the sequence)

**Step 5 — Local test**
- Open `ftb-dpa-guide.html` in browser
- Fill out form with test data (use `test+dpa@thestyerteam.com` — NOT real email)
- Verify fetch fires to `/.netlify/functions/subscribe-lead` (check browser Network tab)
- Verify payload includes `tag: "ftb-dpa-guide"` and `lead_source: "FTB DPA Guide"`
- Verify redirect to `/thank-you.html?type=ftb-dpa-guide`
- Verify thank-you page shows DPA-specific copy and Calendly widget is visible

**Step 6 — Write build report**
- Save to: `tasks/lead-gen/build-reports/2026-04-02-ftb-dpa-funnel-build.md`
- Document: every file created/modified, any open items, and Adam action items

---

## Tools / Accounts / Credentials Needed

- [ ] Netlify (styermortgage.com) — create `ftb-dpa-guide.html` and deploy via git push
- [ ] Mailchimp — Adam must create "FTB DPA Guide Welcome Series" Customer Journey in UI (Builder provides full email copy — Adam pastes it in)
- [ ] n8n — verify `PiuIsQpBuydtFM4m` (Web Lead Automation) is active; verify `J9Pe24vUi6fpZtdZ` (PA Lead Notify) is active
- [ ] Supabase MCP — verify contacts table accepts `lead_source = "FTB DPA Guide"` (no schema migration needed — `lead_source` is a text column)
- [ ] PDF guide — Adam needs to create or have ready a DPA guide PDF before promoting. Placeholder link in email copy: `[Download the Austin DPA Guide]` — Builder leaves this as a comment/placeholder in HTML and email copy

---

## Risk Register

| Action | Risk | What Could Go Wrong | Mitigation |
|--------|------|---------------------|------------|
| subscribe-lead.js code change | MEDIUM | Breaking existing PA or Rate Alert funnel routing | Regression test all 3 funnels after changes: PA (lead_source=Pre-Approval Funnel), Rate Alert (tag=rate-alert), FTB Guide (tag=ftb-guide). Gate deploy on regression pass. |
| subscribe-lead.js `sendGuideEmail()` wrap | LOW | FTB Guide welcome email stops firing for existing FTB Guide funnel | Test by submitting ftb-guide form after change; confirm n8n `ftb-guide-email` webhook fires. |
| LO notify fires for DPA leads | LOW | Adam gets notified for every DPA opt-in (higher volume than PA) | DPA is high-intent; LO notification is appropriate. If volume gets high, Adam can adjust the threshold in n8n. |
| ftb-dpa-guide.html form | LOW | HTML/JS errors | Copy structure from get-preapproved.html; test in browser before deploy |
| thank-you.html modification | LOW | Breaking PA or Rate Alert thank-you copy | Test all 3 param states: `?type=pre-approval`, `?type=rate-alert`, `?type=ftb-dpa-guide`, and no param |
| Mailchimp Customer Journey | MEDIUM | Wrong trigger tag fires existing FTB Guide sequence | Tag is exactly `ftb-dpa-guide` — different from `ftb-guide`. Adam must double-check tag name when creating automation. |
| DPA program details accuracy | HIGH | Stated income limits or program availability become outdated | All program details include "subject to program availability" disclaimer. Spec uses "up to" language throughout. Adam to verify current limits at TSAHC.org before promoting live. |
| PDF guide not ready at launch | MEDIUM | Leads opt-in, guide link is a placeholder, trust breaks | Do not promote funnel until guide PDF is ready. Email 1 and landing page both reference the guide as the lead magnet. |

---

## Definition of Done

Builder session is complete when all of the following are true:

- [ ] `subscribe-lead.js` modified: `sendGuideEmail()` gated on `tag === "ftb-guide"`; `notifyPreApprovalLead()` includes `lead_source === "FTB DPA Guide"` condition
- [ ] Regression confirmed: PA funnel, Rate Alert funnel, FTB Guide funnel all behave identically to pre-change behavior
- [ ] `ftb-dpa-guide.html` exists in site root with correct form (3 fields), JS handler, hidden fields, no noindex, NMLS + Equal Housing footer
- [ ] `thank-you.html` shows DPA-specific copy and Calendly widget when `?type=ftb-dpa-guide` is in URL
- [ ] All other thank-you states unaffected (PA, Rate Alert, no-param)
- [ ] Local test passes: form submits → redirect → correct thank-you
- [ ] Build report written
- [ ] Adam action item logged: create "FTB DPA Guide Welcome Series" in Mailchimp UI using email copy from this spec

---

## Compliance Checklist

- [ ] TCPA: No SMS capture (email-only funnel — no phone opt-in for SMS, no TCPA checkbox needed)
- [ ] CAN-SPAM footer on all emails: physical address (5900 Balcones Drive Suite 100, Austin TX 78731) + unsubscribe link in every email
- [ ] NMLS #513013 on landing page: in page title, trust signals block, and footer
- [ ] Equal Housing Lender on landing page: in trust signals block and footer
- [ ] No guaranteed approval language: all copy uses "eligible buyers may receive," "up to," "you may qualify" — never "you will receive" or "guaranteed"
- [ ] No protected class targeting: "first-time buyer" is not a protected class; DPA programs are HUD-compliant; no geographic, racial, or demographic targeting
- [ ] DPA amounts use "up to" language: all dollar figures in copy use "up to $X" or "eligible buyers can receive up to" framing
- [ ] Unsubscribe link in all emails: handled by Mailchimp's standard footer (one-click unsubscribe)
- [ ] Physical address in email footer: 5900 Balcones Drive Suite 100, Austin TX 78731 (in every email)
- [ ] Disclaimer in email footer: "Not an offer to lend. All loans subject to credit approval. DPA program details are subject to change."
- [ ] Program details labeled as subject to availability: all TSAHC/TDHCA/Travis County program details include "subject to program availability" language
- [ ] No Regulation Z trigger words (no specific rate quoted on landing page without APR)
- [ ] PDF guide (when created): must include same NMLS, Equal Housing, and program disclaimer language

---

## Adam Action Items (Builder Cannot Do These)

1. **Create Mailchimp Customer Journey** — `FTB DPA Guide Welcome Series`, trigger: tag `ftb-dpa-guide`, 8 emails using copy from this spec. Set From: `Adam Styer` / `adam@styermortgage.com`.
2. **Create or obtain the DPA guide PDF** — 4–6 page PDF per research file recommendation. Title: "The Austin First-Time Buyer DPA Guide." Include "Do I Qualify?" checklist. Use Canva or outsource. Must be ready before funnel goes live.
3. **Update PDF download link** in email copy (Email 1 and landing page) once PDF is hosted.
4. **Verify current TSAHC income/purchase price limits** at tsahc.org before promoting funnel — limits are updated periodically.
5. **Verify n8n `J9Pe24vUi6fpZtdZ` notification email looks correct** for DPA leads (same format as PA notify — may want to update subject line to indicate DPA vs. PA lead).

---

## Open Questions (Non-Blocking — Builder Can Proceed Without Answers)

1. **PDF hosting location:** Will the guide PDF be hosted on Supabase Storage, Netlify, or a Google Drive link? Builder can leave a `PDF_DOWNLOAD_URL` placeholder comment in the HTML.
2. **n8n PA Notify email subject:** The existing `J9Pe24vUi6fpZtdZ` notification email may say "Pre-Approval Lead" in the subject. Adam may want to distinguish DPA vs. PA notifications in n8n. Non-blocking for this build.
3. **Social proof number:** Copy says "1,000+ Austin families helped since 2017." Verify this is accurate or adjust to match Adam's actual closed loan count.
4. **Email 4 buyer story ("Sarah"):** This is a composite/example. Adam can swap in a real anonymized buyer story if preferred. Names/details should be changed if using a real borrower.
