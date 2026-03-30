# QA Report: Pre-Approval Funnel — Lead Generation
Date: 2026-03-28
QA: Lead Gen QA Subagent
Verdict: PASS WITH CAVEATS

## Pre-Condition Check
Reviewer verdict: APPROVED WITH NOTES — QA proceeding.

## Landing Page Verification: PASS
## Form Submission Test: PARTIAL (live test not executed — see note)
## Email Sequence Verification: N/A (Mailchimp sequence not yet created — Adam action pending)
## Compliance Check: PASS
## Regression Check: PASS
## UTM Verification: PASS

---

## Test Actions Taken

### 1. Landing Page Verification

| Check | Result |
|-------|--------|
| HTML file exists: /get-preapproved.html | ✅ PASS |
| Page title includes NMLS | ✅ PASS — "Get Pre-Approved | Austin Mortgage | Adam Styer NMLS #513013" |
| NMLS #513013 visible in subheadline | ✅ PASS — "Independent broker. 40+ lenders. 24-hour response. NMLS #513013." |
| NMLS #513013 in footer | ✅ PASS |
| "Adam Styer | Mortgage Solutions LP" in footer | ✅ PASS (not "The Styer Team") |
| Equal Housing Lender in footer | ✅ PASS |
| Netlify form name="get-preapproved" | ✅ PASS |
| form-name hidden input present | ✅ PASS — `<input type="hidden" name="form-name" value="get-preapproved">` |
| data-netlify present | ✅ PASS — `netlify` shorthand attribute on form element |
| All 5 form fields present | ✅ PASS — first_name, last_name, email, phone, loan_goal |
| TCPA consent checkbox: present, unchecked by default | ✅ PASS — required, unchecked |
| SMS opt-in checkbox: present, optional, unchecked | ✅ PASS — separate checkbox, no `required` attr |
| CTA button visible above fold | ✅ PASS — button inside form card within hero section |
| Thank-you redirect: /thank-you | ✅ PASS — window.location.href = '/thank-you' in finally() |
| noindex meta tag: ABSENT (page is indexable) | ✅ PASS — no noindex in current file |
| Mobile responsive: breakpoints at 900px, 600px | ✅ PASS |

### 2. Form Submission Test

**Note:** Live end-to-end form submission test not executed. Executing a live test would:
- Create a real contact in Mailchimp
- Create a real LoanOS contact in production Supabase
- Fire a real Outlook email to adam@thestyerteam.com
- Require the site to be deployed to Netlify first (not yet deployed)

**Code-level verification performed instead:**
- subscribe-lead.js fetch call: ✅ PASS — correct endpoint `/.netlify/functions/subscribe-lead`
- Payload fields correct: ✅ PASS — email, fname, lname, phone, tag='pre-approval-funnel', lead_source='Pre-Approval Funnel', sms_opt_in captured, UTM params captured
- n8n PA notify webhook: ✅ PASS — fires conditionally when lead_source === 'Pre-Approval Funnel'
- n8n webhook URL: ✅ PASS — https://styer.app.n8n.cloud/webhook/pre-approval-lead
- Parallel fetch pattern: ✅ PASS — Netlify + subscribe-lead called in Promise.all()
- Error handling: ✅ PASS — subscribe-lead errors are non-blocking (user still redirected)

**Partial failure flagged:**
- lead_source NOT passed to createLoanosContact() — LoanOS contacts will show "Website" not "Pre-Approval Funnel" (see Review Note 1)
- drip enrollment campaign_id is placeholder — enrollment will silently fail (see Review Note 2)

### 3. n8n Workflow Verification (via MCP)

| Check | Result |
|-------|--------|
| Workflow ID J9Pe24vUi6fpZtdZ exists | ✅ PASS |
| Workflow name: "LoanOS — Pre-Approval Lead Notify" | ✅ PASS |
| Workflow active: true | ✅ PASS — ACTIVE (build report incorrectly said inactive) |
| Webhook node: POST /webhook/pre-approval-lead | ✅ PASS |
| Production webhook URL: https://styer.app.n8n.cloud/webhook/pre-approval-lead | ✅ PASS — matches N8N_PA_LEAD_URL in subscribe-lead.js |
| Normalize Payload node: reads $('Webhook').first().json.body | ✅ PASS — correct n8n pattern |
| TAG_MAP matches subscribe-lead.js TAG_MAP | ✅ PASS |
| email_hash computed via MD5 | ✅ PASS |
| Apply Mailchimp Tags: web-lead + loan_type_tag applied | ✅ PASS |
| Mailchimp list ID: 5053c57af2 (real value, not placeholder) | ✅ PASS |
| Authorization header: contains API key (not placeholder) | ✅ PASS |
| Error handling: continueErrorOutput on Mailchimp node | ✅ PASS |
| Notify Adam: Outlook to adam@thestyerteam.com | ✅ PASS |
| Email subject includes lead details | ✅ PASS |
| Email body includes LoanOS link | ✅ PASS |

### 4. Email Sequence Verification

**Status: DEFERRED**
The "Pre-Approval Welcome Series" Mailchimp Customer Journey must be created manually in the Mailchimp UI — it cannot be created via API. This is an open Adam action item.

Email sequence QA will run in a future session after:
1. Adam creates the Customer Journey in Mailchimp UI
2. Adam confirms the trigger tag (pre-approval-funnel) is set correctly

### 5. Compliance Spot-Check

| Check | Result |
|-------|--------|
| NMLS #513013 visible on landing page | ✅ PASS |
| No guaranteed approval language | ✅ PASS |
| CAN-SPAM footer | N/A — email sequence not yet created |
| TCPA opt-in unchecked by default | ✅ PASS |
| No rates mentioned — no APR required | ✅ PASS |

### 6. Regression Check

| Check | Result |
|-------|--------|
| subscribe-lead.js: existing FTB guide email still fires | ✅ PASS — sendGuideEmail() fires for all callers |
| get-preapproved.html: no existing Netlify form names changed | ✅ PASS |
| n8n workflow: no existing workflows modified | ✅ PASS — J9Pe24vUi6fpZtdZ is a NEW workflow |
| prequal.html: BLOCKER-002 fix confirmed in script.js | ✅ PASS — fetch() call present at line 703 |

### 7. UTM Verification

| Check | Result |
|-------|--------|
| UTM hidden fields in form: 5 fields (source, medium, campaign, term, content) | ✅ PASS |
| UTM auto-population via JS | ✅ PASS — JS reads URLSearchParams and populates fields |
| UTM fields passed to subscribe-lead.js | ✅ PASS — utm_source, utm_medium, utm_campaign in payload |

---

## Failures Requiring Fix

None that block deployment. The following should be fixed before the next full build cycle:

1. **subscribe-lead.js: missing lead_source in createLoanosContact() call** (data quality)
2. **subscribe-lead.js: placeholder drip campaign_id** (silent failure — drip enrollment won't work)
3. **TCPA SMS checkbox: add "not required to obtain a loan" phrase** (minor compliance language gap)

---

## Deployment Readiness

The Pre-Approval Funnel is deployment-ready with the following caveats:
- [ ] Adam must `git push` from styerteam-mortgage-site repo to deploy HTML/JS changes to Netlify
- [ ] Adam must confirm Netlify env vars are set: MAILCHIMP_API_KEY, MAILCHIMP_BORROWER_LIST_ID, LOANOS_AGENT_SECRET
- [ ] Adam must create "Pre-Approval Welcome Series" Customer Journey in Mailchimp UI
- [ ] Adam must confirm MAILCHIMP_BORROWER_LIST_ID matches list 5053c57af2 used in n8n workflow

The n8n workflow (J9Pe24vUi6fpZtdZ) is already ACTIVE and ready to receive webhooks.
