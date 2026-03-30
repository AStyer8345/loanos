# Funnel Spec: Pre-Approval Funnel — Lead Generation
Date: 2026-03-27
Status: AWAITING ADAM CONFIRMATION (env vars + Mailchimp audience)

---

## Scope

### In Scope
- Update existing landing page at `/get-preapproved` (get-preapproved.html) — form + TCPA fix + subscribe-lead.js wiring
- Thank-you page at `/thank-you` (confirm existing or create if missing)
- Mailchimp welcome email sequence — "Pre-Approval Welcome Series" (6 emails, tag-triggered)
- LoanOS contact creation via existing `/api/contacts/web-lead` endpoint
- n8n LO notification — new dedicated workflow "LoanOS — Pre-Approval Funnel Lead Notify"
- TCPA SMS opt-in checkbox (separate, unchecked by default) — resolves BLOCKER-001

### Out of Scope
- prequal.html multi-step form fix (BLOCKER-002 — separate ticket)
- Homepage Quick Quote / Quick Contact wiring (separate ticket)
- Any SMS automation to leads (BLOCKER-001 not yet fully resolved — checkbox only)
- Paid traffic (Google Ads, Facebook) — deferred to Week 7
- Any Salesforce contact creation — all contacts go to LoanOS only

---

## Funnel Architecture

### Traffic Source
Primary: Organic Google search ("get pre-approved Austin TX", "Austin mortgage pre-approval"), referrals from realtors linking to the page, and word-of-mouth from Adam's sphere. Secondary (future): social media link-in-bio, email signature link. No paid traffic in scope for this spec. The page already exists and is indexed — changes are improvements to a live asset, not a net-new build.

### Landing Page Design
- **File**: `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site/get-preapproved.html`
- **URL**: `https://styermortgage.com/get-preapproved` (keep existing — do NOT change slug; it has backlinks and indexed)
- **Decision rationale**: The page already exists with working CSS, mobile-responsive layout, trust chips, testimonials, proof points, and a secondary CTA. The audit (2026-03-26) confirmed the form's `fetch()` call to `subscribe-lead.js` is ALREADY wired correctly. The only change needed is replacing the bundled TCPA checkbox with two separate checkboxes (consent to contact + SMS opt-in). All other structure stays as-is.
- **Netlify form name**: `get-preapproved` (existing — do not change)
- **Above-fold headline**: `Get Pre-Approved for an Austin Home Loan` (existing — keep)
- **Subheadline**: `Independent broker. 40+ lenders. 24-hour response. NMLS #513013.` (existing — keep)
- **Form fields** (5 fields + 2 checkboxes — keep current structure):
  - Field 1: First Name — `name="first_name"`, type=text, placeholder="Jane", required
  - Field 2: Last Name — `name="last_name"`, type=text, placeholder="Smith", required
  - Field 3: Email — `name="email"`, type=email, placeholder="jane@email.com", required
  - Field 4: Phone — `name="phone"`, type=tel, placeholder="(512) 555-1234", required
  - Field 5: Loan Goal — `name="loan_goal"`, type=select, required; options: Purchase | Refinance | First-Time Buyer | DSCR/Investor
  - Checkbox A (TCPA — contact consent, required): `name="tcpa_consent"`, unchecked by default — **Label text**: "I agree to be contacted by Adam Styer via phone, email, or text about mortgage options. Consent is not a condition of purchase. Msg & data rates may apply. Reply STOP to opt out."
  - Checkbox B (SMS opt-in, optional/unchecked): `name="sms_opt_in"`, unchecked by default — **Label text**: "Yes, I also consent to receive automated text messages from Adam Styer at the number I provided. This consent is separate and optional. Message frequency varies. Reply STOP to cancel."
- **CTA button text**: `Get My Free Quote →` (existing — keep)
- **Trust signals** (existing trust chips — keep):
  - "★★★★★ 5.0 (136+ Reviews)"
  - "21-Day Avg. Close"
  - "Licensed in Texas"
  - "(512) 956-6010" (tel link)
- **Trust signal copy note**: The existing chips are accurate and sufficient. Do not add new ones.
- **Below-fold sections** (all existing — keep as-is):
  1. "What happens after you submit" — 3-step numbered process
  2. "Why Austin buyers choose Adam" — 3 proof point cards (24-hr pre-approval, broker advantage, deal protection)
  3. "What buyers say" — 3 testimonial cards (5-star reviews)
  4. "Prefer to talk first?" — phone number + Calendly CTA
- **Thank-you redirect URL**: `/thank-you` (existing redirect in form JS — keep)
- **NMLS footer** (existing — keep): "Adam Styer | Mortgage Solutions LP | NMLS #2526130 | Adam Styer NMLS #513013 | Licensed in Texas | Equal Housing Lender."

### Thank-You Page Design
- **File**: Check for `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site/thank-you.html` — if it does not exist, create it; if it exists, confirm it has Calendly and the right copy
- **URL**: `https://styermortgage.com/thank-you`
- **Headline**: `Your Pre-Approval Request Was Received`
- **Body**: "Adam personally reviews every submission — usually within a few hours during business hours (Mon–Fri, 8am–6pm CT). You'll get a call or text from him directly. No call center. No assistant. If you'd rather choose a time now, book a 15-minute call below."
- **Promise constraint**: Do NOT say "5 minutes" — Adam's research hours make that undeliverable. Use "same business day" framing.
- **Calendly embed**: YES — `https://calendly.com/adamstyer/15minutes` — inline Calendly widget (use Calendly embed script, not just a link)
- **Secondary CTA**: Phone number "(512) 956-6010" as a tap-to-call link, displayed above the Calendly widget for users who want immediate contact
- **NMLS footer**: Same as get-preapproved.html — "Adam Styer | Mortgage Solutions LP | NMLS #513013 | Equal Housing Lender."

### Email Sequence (Mailchimp)
- **Audience**: Use existing single audience "Adam Styer | Mortgage Solutions" — do NOT create a second audience (research confirms single audience + tag segmentation is correct)
- **Tags applied at opt-in** (via subscribe-lead.js tag parameter — loan_goal drives the tag):
  - All pre-approval leads: `pre-approval-funnel` + `web-lead`
  - loan_goal = "Purchase" or "First-Time Buyer": also apply `purchase-buyer`
  - loan_goal = "Refinance": also apply `refi-interest`
  - loan_goal = "DSCR/Investor": also apply `investor-lead`
  - Note: subscribe-lead.js currently applies only one tag per submission (the TAG_MAP value). The Builder must update the JS tag logic to also apply `pre-approval-funnel` and `web-lead` as additional tags — see Execution Step 3.
- **Automation name**: `Pre-Approval Welcome Series`
- **Automation trigger**: Tag `pre-approval-funnel` is added to contact

| # | Day | Subject Line | Body Copy (2-3 sentences) | CTA |
|---|-----|--------------|--------------------------|-----|
| 1 | 0 (immediate) | Your pre-approval request is in — here's what happens next | Adam received your request and will personally review it today. In the meantime, here's what the pre-approval process looks like — and why starting with an independent broker saves you money. | "See Adam's quick overview" → Calendly link |
| 2 | 3 | What "pre-approved" actually means (most buyers get this wrong) | A pre-qualification is a guess. A pre-approval is a verified commitment backed by your income, assets, and credit — and it's the difference between winning and losing an offer in Austin's market. Here's exactly what we verify and why it matters. | "Get my full pre-approval started" → https://mslp.my1003app.com/513013/register |
| 3 | 7 | The 3 things that kill a mortgage approval (and how to avoid them) | Credit score drops, new debt, and job changes during the loan process are the top three ways buyers lose their financing. Here's what to protect — and what to ignore — between now and closing day. | "Talk through my situation" → Calendly link |
| 4 | 14 | Austin market update: what rates look like right now | Rate locks, float-down options, and when to lock — most buyers don't know how this decision affects their payment by $50–$200/month. Here's how Adam approaches it for clients right now. | "See current rates" → styermortgage.com/rates (or homepage if rates page doesn't exist) |
| 5 | 30 | A buyer just like you closed last month — here's their story | One Austin family went from pre-approval to keys in 21 days — in a competitive multiple-offer situation. No stress, no surprises, closed on time. Here's what made the difference. | "Start my application" → https://mslp.my1003app.com/513013/register |
| 6 | 60 | Still thinking about it? No pressure — but here's what's changed | Rates and programs shift. If you started this process a couple months ago and got busy, that's normal. A quick 15-minute call can re-baseline where you stand — no pressure, no commitment. | "Book a free 15-min call" → Calendly link |

**Every email footer must include:**
- Adam Styer | Mortgage Solutions LP
- NMLS #513013
- 5900 Balcones Drive, Suite 100, Austin TX 78731
- Equal Housing Lender
- Unsubscribe link (Mailchimp standard footer handles this automatically)

**Subject line compliance note**: Do NOT use "Your Pre-Approval is Ready" or similar language implying approval has been issued before underwriting. Email 1 uses "request is in" framing — this is compliant.

### Automation Map (n8n)

```
Form submit (get-preapproved.html)
  → JS intercepts submit, calls subscribe-lead.js in parallel with Netlify form POST
    → /.netlify/functions/subscribe-lead (existing Netlify function)
      → Mailchimp: PUT upsert subscriber (existing logic)
      → Mailchimp: POST apply tag(s) — UPDATED to apply pre-approval-funnel + web-lead + loan-type tag
      → LoanOS /api/contacts/web-lead: create contact
          first_name, last_name, email, phone
          lead_source: "Pre-Approval Funnel"   ← CHANGE from current "Website"
          referral_type: "web_lead"
          campaign: utm_campaign || utm_source || ""
          loan_type: loan_goal value
      → n8n webhook: POST to new "LoanOS — Pre-Approval Lead Notify" workflow webhook URL
          payload: { first_name, last_name, email, phone, loan_goal, utm_source, page_url, submitted_at }
          → n8n sends email notification to adam@thestyerteam.com (via Outlook credential)
          → [SMS to Adam — OPTIONAL — add as disabled node; activate when BLOCKER-001 confirmed resolved]
  → Redirect: window.location.href = '/thank-you'
```

**Note on current subscribe-lead.js**: The function already handles Mailchimp upsert + LoanOS contact creation. Two targeted changes are needed:
1. The `lead_source` value sent to LoanOS must change from `"Website"` to `"Pre-Approval Funnel"` — this requires either a parameter passed from the form JS or a change in subscribe-lead.js to use a `source` field if provided.
2. Multiple tags must be applied (pre-approval-funnel + web-lead + loan-type tag) instead of the single tag currently applied.

### CRM Routing
- **Lead Source tag**: `Pre-Approval Funnel` (exact value for `contacts.lead_source` in LoanOS Supabase)
- **LoanOS contact status**: `lead`
- **n8n workflow**: NEW dedicated workflow — "LoanOS — Pre-Approval Lead Notify" (separate from `PiuIsQpBuydtFM4m` Web Lead Automation)
  - **Decision rationale**: Pre-approval leads have higher urgency than generic web leads and different payload fields (loan_goal, TCPA flags). A dedicated workflow allows independent debugging, different notification format, and future branching (e.g., purchase vs. refi routing) without touching the generic web lead path.
- **n8n webhook path**: `https://styer.app.n8n.cloud/webhook/pre-approval-lead` (new path — Builder creates this workflow)
- **Notification email to Adam**:
  - Subject: `New Pre-Approval Lead — [first_name] [last_name] — [loan_goal]`
  - Body: `Name: [first_name] [last_name]\nEmail: [email]\nPhone: [phone]\nLoan Goal: [loan_goal]\nSubmitted: [submitted_at]\nSource: [utm_source] / [utm_medium]\nPage: [page_url]\n\nLog in to LoanOS: https://loanos.vercel.app`

### Conversion Rate Targets
| Stage | Target |
|-------|--------|
| Landing page → opt-in | 20–25% (targeted / warm traffic) |
| Welcome email open (Day 0) | 45%+ |
| Sequence completion (Day 60 email sent) | 30%+ |
| Nurture → qualified lead (booked Calendly call) | 5–8% |
| Qualified lead → application submitted | 50%+ (Adam's close rate on warm leads) |

---

## Execution Instructions for Builder

Dependencies flow: Mailchimp setup first → then subscribe-lead.js changes → then landing page HTML update → then thank-you page → then n8n workflow → then test.

### 1. PRE-CONDITIONS (Adam must confirm before Builder runs)
- [ ] `MAILCHIMP_API_KEY` is live in Netlify env vars (Site config → Environment variables)
- [ ] `MAILCHIMP_BORROWER_LIST_ID` is set in Netlify env vars — this is the audience ID for "Adam Styer | Mortgage Solutions"
- [ ] `LOANOS_AGENT_SECRET` is set in Netlify env vars
- [ ] Adam confirms there is ONE Mailchimp audience (not multiple) — Builder will use whatever `MAILCHIMP_BORROWER_LIST_ID` resolves to

### 2. Step 1 — Mailchimp Setup
1. Log into Mailchimp. Confirm there is one primary audience. Note the audience name for reference.
2. Verify that tags `pre-approval-funnel`, `web-lead`, `purchase-buyer`, `refi-interest`, `investor-lead`, `ftb-lead` do not already exist (or if they do, confirm exact names match). Tags are auto-created on first use via the API — no manual creation required.
3. Create a new Customer Journey automation named exactly: `Pre-Approval Welcome Series`
4. Set trigger: Tag added → tag name = `pre-approval-funnel`
5. Add 6 emails in sequence per the table above. Use the exact subject lines, body copy, and CTAs specified.
6. Set email delays: Email 1 = immediate (0 delay), Email 2 = 3 days after Email 1, Email 3 = 4 days after Email 2 (= Day 7), Email 4 = 7 days after Email 3 (= Day 14), Email 5 = 16 days after Email 4 (= Day 30), Email 6 = 30 days after Email 5 (= Day 60).
7. Add the required footer to each email: Adam Styer | Mortgage Solutions LP, NMLS #513013, 5900 Balcones Drive Suite 100, Austin TX 78731, Equal Housing Lender. Mailchimp's standard merge tag footer handles unsubscribe automatically.
8. Set automation to DRAFT (do NOT activate until test is complete in Step 6).
9. Note: Do NOT create a separate "purchase" vs. "refi" branch automation at this stage — use a single 6-email sequence for all pre-approval leads. Branching is a Week 3+ enhancement.

### 3. Step 2 — subscribe-lead.js Updates
File: `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site/netlify/functions/subscribe-lead.js`

Two changes needed:

**Change A — Accept and forward `lead_source` field:**
In the destructuring block (line 63–66), add `lead_source` to the extracted fields:
```js
const {
  email, fname, lname, phone, tag,
  loan_goal, lead_source, utm_source, utm_medium, utm_campaign, page_url,
} = body;
```
In `createLoanosContact()`, replace the hardcoded `lead_source: "Website"` with:
```js
lead_source: lead_source || "Website",
```

**Change B — Apply multiple Mailchimp tags:**
The current code applies one tag via the `tag` field. Add logic to also apply `pre-approval-funnel` and `web-lead` tags when `lead_source === "Pre-Approval Funnel"`. The cleanest approach: accept a `tags` array in the body and apply all of them. Add to destructuring: `tags`. In `subscribeToMailchimp()`, after applying the primary tag, loop through any additional tags in the `tags` array and apply each with a separate POST to the tags endpoint.

Alternatively (simpler, lower risk): In the form JS (get-preapproved.html), pass `tag: "pre-approval-funnel"` as the primary tag, and call the Mailchimp tags endpoint a second time from n8n after the webhook fires to apply `web-lead` and the loan-type tag. **Recommended approach for Builder: use the simpler form JS approach** — pass `tag: "pre-approval-funnel"` from the form, and let the n8n workflow apply additional tags via Mailchimp API after contact creation. This keeps subscribe-lead.js changes minimal.

**Change C — Pass lead_source from form JS:**
In get-preapproved.html form submit handler, add `lead_source: "Pre-Approval Funnel"` to the subscribe-lead.js POST body. Also add `sms_opt_in: data.get('sms_opt_in') === 'on'` to capture the SMS checkbox state for future use.

### 4. Step 3 — Landing Page HTML Update
File: `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site/get-preapproved.html`

**Only change needed: Replace the single bundled TCPA checkbox with two separate checkboxes.**

Find this block (lines 366–371):
```html
<div class="lp-form-field full" style="margin-top:var(--spacing-sm);">
  <label style="display:flex;align-items:flex-start;gap:8px;font-size:var(--font-size-xs);font-weight:var(--font-weight-normal);color:var(--color-gray);cursor:pointer;line-height:1.5;">
    <input type="checkbox" name="tcpa_consent" required style="margin-top:3px;flex-shrink:0;width:16px;height:16px;">
    <span>By submitting, I agree to be contacted via phone, email, or text about mortgage options. Msg &amp; data rates may apply. Reply STOP to opt out at any time.</span>
  </label>
</div>
```

Replace with:
```html
<!-- TCPA consent — required, unchecked by default -->
<div class="lp-form-field full" style="margin-top:var(--spacing-sm);">
  <label style="display:flex;align-items:flex-start;gap:8px;font-size:var(--font-size-xs);font-weight:var(--font-weight-normal);color:var(--color-gray);cursor:pointer;line-height:1.5;">
    <input type="checkbox" name="tcpa_consent" id="gpa-tcpa" required style="margin-top:3px;flex-shrink:0;width:16px;height:16px;">
    <span>I agree to be contacted by Adam Styer via phone, email, or text about mortgage options. Consent is not a condition of purchase. Msg &amp; data rates may apply. Reply STOP to opt out.</span>
  </label>
</div>
<!-- SMS opt-in — separate, optional, unchecked by default (TCPA one-to-one consent, 2026 FCC rules) -->
<div class="lp-form-field full" style="margin-top:var(--spacing-xs,8px);">
  <label style="display:flex;align-items:flex-start;gap:8px;font-size:var(--font-size-xs);font-weight:var(--font-weight-normal);color:var(--color-gray);cursor:pointer;line-height:1.5;">
    <input type="checkbox" name="sms_opt_in" id="gpa-sms-optin" style="margin-top:3px;flex-shrink:0;width:16px;height:16px;">
    <span>Yes, I also consent to receive automated text messages from Adam Styer at the number I provided. This is separate and optional. Message frequency varies. Reply STOP to cancel.</span>
  </label>
</div>
```

In the form JS submit handler, update the subscribe-lead POST body to include:
```js
lead_source:  'Pre-Approval Funnel',
sms_opt_in:   data.get('sms_opt_in') === 'on',
tag:          'pre-approval-funnel',
```
Also keep the existing `loan_goal` → TAG_MAP tag logic for Mailchimp segmentation (purchase-buyer, refi-interest, etc.) — pass it as a separate field `loan_type_tag` so n8n can apply it as an additional Mailchimp tag.

No other changes to get-preapproved.html. Do not touch CSS, testimonials, proof points, or footer.

### 5. Step 4 — Thank-You Page
File: `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site/thank-you.html`

Check if this file exists. If yes, confirm it has: correct headline, Calendly embed, phone number, NMLS footer. Update if any element is missing.

If it does not exist, create it with this structure:
- Same `<head>` as get-preapproved.html (GTM, fonts, style.css, favicon)
- Logo-only header (same lp-header pattern)
- Hero section: headline "Your Pre-Approval Request Was Received", subhead per spec above
- Phone number as tap-to-call: `(512) 956-6010`
- Inline Calendly widget (use Calendly's embed snippet: `<div class="calendly-inline-widget" data-url="https://calendly.com/adamstyer/15minutes" style="min-width:320px;height:700px;"></div><script type="text/javascript" src="https://assets.calendly.com/assets/external/widget.js" async></script>`)
- NMLS footer: "Adam Styer | Mortgage Solutions LP | NMLS #513013 | Equal Housing Lender."
- No navigation links (landing page pattern)
- No `noindex` meta tag — thank-you pages should be indexable (or set noindex if Adam prefers — default: no noindex)

### 6. Step 5 — n8n Notification Workflow
Create a new n8n workflow named: `LoanOS — Pre-Approval Lead Notify`

Workflow nodes:
1. **Webhook** node — path: `pre-approval-lead`, method: POST, authentication: none (subscribe-lead.js calls it directly without auth)
2. **Code** node — normalize payload:
   ```js
   const body = $('Webhook').first().json.body;
   return [{
     json: {
       first_name:   body.first_name || body.fname || '',
       last_name:    body.last_name  || body.lname || '',
       email:        body.email || '',
       phone:        body.phone || '',
       loan_goal:    body.loan_goal || '',
       sms_opt_in:   body.sms_opt_in || false,
       utm_source:   body.utm_source || '',
       utm_medium:   body.utm_medium || '',
       utm_campaign: body.utm_campaign || '',
       page_url:     body.page_url || '',
       submitted_at: new Date().toISOString(),
     }
   }];
   ```
3. **HTTP Request** node — Mailchimp tag application (apply `web-lead` + loan-type tag):
   - PUT to `https://${DC}.api.mailchimp.com/3.0/lists/${LIST_ID}/members/${emailHash}/tags`
   - Apply tags: `web-lead` + the loan-type tag mapped from `loan_goal` (Purchase → `purchase-buyer`, Refinance → `refi-interest`, First-Time Buyer → `purchase-buyer`, DSCR/Investor → `investor-lead`)
   - Note: `pre-approval-funnel` tag is already applied by subscribe-lead.js before this webhook fires
4. **Send Email (Outlook)** node — send notification to adam@thestyerteam.com:
   - Credential: use existing Outlook credential in n8n
   - Subject: `New Pre-Approval Lead — {{ $json.first_name }} {{ $json.last_name }} — {{ $json.loan_goal }}`
   - Body: `Name: {{ $json.first_name }} {{ $json.last_name }}\nEmail: {{ $json.email }}\nPhone: {{ $json.phone }}\nLoan Goal: {{ $json.loan_goal }}\nSMS Opt-In: {{ $json.sms_opt_in }}\nSubmitted: {{ $json.submitted_at }}\nSource: {{ $json.utm_source }} / {{ $json.utm_medium }}\nCampaign: {{ $json.utm_campaign }}\nPage: {{ $json.page_url }}\n\nLog in to LoanOS → https://loanos.vercel.app`
5. **[DISABLED] SMS** node — add as disabled node placeholder for Adam's number (Twilio or equivalent); activate only after BLOCKER-001 is confirmed resolved

After creating the workflow, get the webhook URL and add it to subscribe-lead.js as a new constant:
```js
const N8N_PA_LEAD_URL = "https://styer.app.n8n.cloud/webhook/pre-approval-lead";
```
Call it (non-blocking) from the subscribe-lead handler after the Mailchimp + LoanOS parallel block:
```js
notifyPreApprovalLead({ email, fname, lname, phone, loan_goal, sms_opt_in, utm_source, utm_medium, utm_campaign, page_url })
  .catch(err => console.error("[subscribe-lead] PA notify failed:", err.message));
```

### 7. Step 6 — Test (in this exact order)
1. Activate the Mailchimp "Pre-Approval Welcome Series" automation (set to Active).
2. Deploy updated files to Netlify (git push to trigger deploy — confirm Netlify build succeeds).
3. Submit a test lead on `https://styermortgage.com/get-preapproved` using a real email address Adam controls (e.g., a Gmail test account). Use loan_goal = "Purchase". Check both TCPA boxes.
4. Verify: Netlify Functions log shows `subscribe-lead` invoked, returns 200.
5. Verify: Mailchimp — test contact appears in the audience with tags `pre-approval-funnel`, `web-lead`, `purchase-buyer`.
6. Verify: Mailchimp — "Pre-Approval Welcome Series" triggered for the test contact (check Journey activity).
7. Verify: LoanOS Supabase — contacts table shows a new row with `lead_source = "Pre-Approval Funnel"`, `status = "lead"`.
8. Verify: adam@thestyerteam.com receives notification email within 60 seconds of form submit.
9. Verify: Browser redirected to `/thank-you` — page loads, Calendly widget renders, phone number visible.
10. Delete test contact from Mailchimp after verification. Delete test contact from LoanOS contacts table via Supabase MCP.

---

## Tools / Accounts / Credentials Needed
- [ ] Netlify account access (styermortgage.com) — to confirm env vars are set
- [ ] Mailchimp account access — to create the "Pre-Approval Welcome Series" automation
- [ ] n8n (styer.app.n8n.cloud) — MCP available; use `mcp__n8n-mcp__create_workflow_from_code`
- [ ] Supabase MCP (project ID: `uuqedsvjlkeszrbwzizl`) — for post-test contact cleanup and verification
- [ ] Git + SSH (git@github.com:AStyer8345/styermortgage-site.git or wherever the site repo lives) — to push changes

---

## Risk Register
| Action | Risk Level | What Could Go Wrong | Mitigation |
|--------|-----------|---------------------|------------|
| Mailchimp automation trigger | MEDIUM | Tag name mismatch — `pre-approval-funnel` must match exactly (case-sensitive) in both subscribe-lead.js and the automation trigger | Confirm tag name in both places before activating automation |
| subscribe-lead.js change (lead_source) | LOW | Other forms using subscribe-lead.js will still pass `lead_source: undefined`, falling through to default "Website" — no regression | Default fallback `|| "Website"` in createLoanosContact protects other callers |
| subscribe-lead.js change (multi-tag) | LOW | subscribe-lead.js currently applies one Mailchimp tag. Passing `tag: "pre-approval-funnel"` replaces the loan-type tag. Loan-type tags (`purchase-buyer`, etc.) must be applied by n8n instead | n8n webhook applies loan-type tag; document this dependency clearly |
| TCPA checkbox split | MEDIUM | The existing checkbox has `required` — if the replacement TCPA checkbox is not also `required`, form can submit without consent | New Checkbox A must keep `required` attribute. Checkbox B must NOT be required |
| n8n webhook not called | LOW | subscribe-lead.js fires async without awaiting the n8n call — if n8n is down, notification is silently lost | Log the failure in Netlify function logs; acceptable for v1 — no retry needed |
| thank-you.html Calendly widget | LOW | Calendly widget loads async — slow connections may see blank area briefly | Calendly widget is loaded async by default; acceptable UX |
| prequal.html still broken | HIGH | BLOCKER-002 is unchanged — any user who navigates to /prequal.html still submits into a void | Explicitly out of scope; must be fixed separately before any traffic is sent to that page |

---

## Definition of Done
- [ ] Landing page live at `https://styermortgage.com/get-preapproved` with two-checkbox TCPA/SMS consent
- [ ] Form submission routes to `subscribe-lead.js` successfully (200 response confirmed in Netlify logs)
- [ ] Mailchimp: test subscriber tagged `pre-approval-funnel` + `web-lead` + loan-type tag
- [ ] Mailchimp: "Pre-Approval Welcome Series" automation triggered for test subscriber
- [ ] LoanOS: contact created with `lead_source = "Pre-Approval Funnel"` and `status = "lead"`
- [ ] adam@thestyerteam.com receives notification email within 60 seconds of test submission
- [ ] Thank-you page loads at `/thank-you` with Calendly widget rendering correctly
- [ ] NMLS #513013 and Equal Housing Lender visible on landing page footer
- [ ] Unsubscribe link in all 6 emails (handled by Mailchimp standard footer)
- [ ] Both TCPA checkboxes unchecked by default on page load

---

## Compliance Checklist
- [ ] Checkbox A (contact consent) — present, separate, unchecked by default, required — resolves BLOCKER-001
- [ ] Checkbox B (SMS opt-in) — present, separate, optional, unchecked by default — TCPA one-to-one consent compliant per 2026 FCC rules
- [ ] CAN-SPAM footer on all 6 emails: unsubscribe link + 5900 Balcones Drive, Suite 100, Austin TX 78731
- [ ] NMLS #513013 on landing page (existing footer — already present)
- [ ] Equal Housing Lender on landing page (existing footer — already present)
- [ ] No guaranteed approval language — "pre-approval in 24 hours" is a process timeline, not a guarantee; "no credit impact" refers to the initial inquiry (compliant)
- [ ] No protected class targeting in copy or audience segmentation
- [ ] Sender identity clear in all emails: "Adam Styer, Mortgage Broker, Austin TX, NMLS #513013"
