# Execution Report: Pre-Approval Funnel — Lead Generation
Date: 2026-03-27

## What Was Executed

### Already Complete (from prior sessions)
- **get-preapproved.html** — TCPA checkbox split (required contact consent + optional SMS opt-in), form JS wired with `lead_source: 'Pre-Approval Funnel'`, `tag: 'pre-approval-funnel'`, `sms_opt_in`, `loan_type_tag`
- **subscribe-lead.js** — Accepts `lead_source`, `sms_opt_in`, `loan_type_tag` fields. Calls n8n PA lead notify webhook conditionally. Falls back to `lead_source: "Website"` for non-PA forms.
- **thank-you.html** — Headline, body copy, phone CTA, Calendly inline widget, NMLS footer, Google Ads conversion tracking

### Built This Session
- **n8n workflow**: "LoanOS — Pre-Approval Lead Notify" — ID: `J9Pe24vUi6fpZtdZ`
  - Webhook: `POST /webhook/pre-approval-lead`
  - Code node: Normalizes payload, maps loan_goal → Mailchimp tag, computes MD5 email hash
  - HTTP Request: Applies `web-lead` + loan-type tag to Mailchimp subscriber
  - Microsoft Outlook: Sends notification email to adam@thestyerteam.com with lead details
  - Outlook credential: Auto-assigned from existing account
  - Mailchimp credential: **NEEDS MANUAL CONFIG** — set HTTP Header Auth with Mailchimp API key (Basic auth)

## Output Produced
- HTML files: No changes needed (already complete)
  - `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site/get-preapproved.html`
  - `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site/thank-you.html`
- Netlify function: No changes needed (already complete)
  - `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site/netlify/functions/subscribe-lead.js`
- n8n: `J9Pe24vUi6fpZtdZ` — "LoanOS — Pre-Approval Lead Notify"

## What Was Deferred

### Requires Adam's Manual Action
1. **n8n — Configure Mailchimp credential**: Open workflow `J9Pe24vUi6fpZtdZ` → "Apply Mailchimp Tags" node → set HTTP Header Auth credential with Mailchimp API key. Also update the URL to include the actual `MAILCHIMP_BORROWER_LIST_ID` (replace `${MAILCHIMP_LIST_ID}` placeholder).
2. **n8n — Activate workflow**: Toggle workflow to Active after configuring credentials.
3. **Mailchimp — Create "Pre-Approval Welcome Series"**: Customer Journey automation triggered by tag `pre-approval-funnel`. 6 emails per spec (Day 0, 3, 7, 14, 30, 60). This CANNOT be done via API — must be created in Mailchimp UI.
4. **Deploy to Netlify**: `git push` from styerteam-mortgage-site repo to trigger Netlify deploy.
5. **Remove noindex**: get-preapproved.html line 6 has `<meta name="robots" content="noindex, nofollow">` — this blocks Google indexing. Remove if the page should be indexed (spec says it has backlinks and is indexed).

### Out of Scope (per spec)
- prequal.html multi-step form fix (BLOCKER-002)
- Homepage Quick Quote / Quick Contact wiring
- SMS automation (BLOCKER-001 — checkbox added but no SMS sending)
- Paid traffic setup (Week 7)

## Compliance Check
- TCPA opt-in: PRESENT — two separate checkboxes (Checkbox A required, Checkbox B optional), both unchecked by default
- CAN-SPAM footer: N/A this build — Mailchimp emails not yet created (deferred to Adam in Mailchimp UI)
- NMLS #513013: PRESENT on get-preapproved.html footer and thank-you.html footer
- Equal Housing Lender: PRESENT on both pages
- No guaranteed approval language: CONFIRMED — "24-hour response" is process timeline, not guarantee
- No protected class targeting: CONFIRMED

## Review Instructions for Reviewer Subagent
1. Read get-preapproved.html — confirm two TCPA checkboxes, form JS sends correct fields to subscribe-lead.js
2. Read subscribe-lead.js — confirm `lead_source` fallback, conditional n8n webhook call, `notifyPreApprovalLead` function
3. Read thank-you.html — confirm Calendly widget, phone CTA, NMLS footer
4. Verify n8n workflow J9Pe24vUi6fpZtdZ exists via MCP
5. Flag: noindex meta tag on get-preapproved.html needs decision
