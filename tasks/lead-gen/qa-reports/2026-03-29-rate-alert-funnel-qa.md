# QA Report: Rate Alert Funnel (Austin Rate Watch) — Lead Generation
Date: 2026-03-29
Verdict: PASS WITH CAVEATS

Pre-condition check: Reviewer verdict = APPROVED WITH NOTES → QA can proceed ✅

## Landing Page Verification: PASS
## Form Submission Test: DEFERRED (deployment pending — code-level checks PASS)
## Email Sequence Verification: DEFERRED (Mailchimp Journey not yet created — Adam action)
## Compliance Check: PASS
## Regression Check: PASS
## UTM Verification: PASS

---

## Test Actions Taken

### 1. Landing Page — Code-Level Verification (Deployment Pending)

| Check | Result | Detail |
|-------|--------|--------|
| File exists at correct path | ✅ PASS | `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site/rate-alert.html` (24,385 bytes) |
| form name="rate-alert-form" | ✅ PASS | Exact match to spec |
| data-netlify="true" present | ✅ PASS | Count: 2 (form element + honeypot) |
| hidden form-name input with value "rate-alert-form" | ✅ PASS | Present |
| NMLS #513013 visible | ✅ PASS | Count: 3 (title, trust chip, footer) |
| Equal Housing Lender | ✅ PASS | Present in footer |
| noindex meta tag ABSENT | ✅ PASS | Count: 0 — page is indexable per spec |
| subscribe-lead function called | ✅ PASS | `/.netlify/functions/subscribe-lead` in JS handler |
| Redirect to /thank-you.html?type=rate-alert | ✅ PASS | Both on success and catch paths |
| No guaranteed approval language | ✅ PASS | Count: 0 |
| "The Styer Team" absent | ✅ PASS | Count: 0 |
| No phone field | ✅ PASS | Confirmed — 2 fields only (fname, email) |
| No SMS opt-in checkbox | ✅ PASS | Confirmed — email-only funnel |
| UTM hidden fields present | ✅ PASS | All 5 UTM fields (source, medium, campaign, term, content) |
| tag='rate-alert' in hidden field | ✅ PASS | Default value set; also hardcoded in JS payload |
| lead_source='Rate Alert Funnel' in hidden field | ✅ PASS | Default value set; also hardcoded in JS payload |
| Google Ads conversion event on submit | ✅ PASS | `gtag('event', 'conversion', ...)` in submit handler |
| GTM dataLayer event | ✅ PASS | `generate_lead` with `lead_type: 'rate_alert_signup'` |
| LP header nav links hidden | ✅ PASS | `.lp-header .nav-links` display:none |
| Mobile responsive media queries | ✅ PASS | 900px and 600px breakpoints present |

### 2. Form Submission Test — DEFERRED

Live end-to-end test requires:
- [ ] Netlify env vars confirmed (MAILCHIMP_API_KEY, MAILCHIMP_BORROWER_LIST_ID, LOANOS_AGENT_SECRET)
- [ ] Adam's git push (BLOCKER-003 + new Rate Alert files)
- [ ] Netlify deploy complete
- [ ] Supabase contact creation verification
- [ ] n8n execution log check (verify pre-approval workflow does NOT fire for Rate Alert — critical)

**Cannot test until deployment. Document as deferred, not failed.**

### 3. Email Sequence — DEFERRED (Adam action pending)

Mailchimp "Rate Watch Welcome Series" Customer Journey has not been created yet.
- Email copy in spec at: `tasks/lead-gen/specs/2026-03-28-rate-alert-funnel-spec.md`
- Adam must create in Mailchimp UI — cannot be created via API
- QA re-run for email sequence: schedule for Week 3 Session 3 (post-deploy session)

### 4. Compliance Spot-Check — PASS

| Check | Result |
|-------|--------|
| NMLS #513013 on landing page | ✅ PASS |
| No guaranteed approval language (rate-alert.html, thank-you.html) | ✅ PASS |
| APR present alongside rates in sample preview | ✅ PASS — with disclaimer |
| TCPA: N/A (email-only funnel, no SMS) | ✅ PASS |
| "Rate Watch" offer copy reviewed for Reg Z compliance | ✅ PASS — no specific rate quoted on landing page |

### 5. Regression Check — PASS

| Check | Result | Detail |
|-------|--------|--------|
| subscribe-lead.js unmodified | ✅ PASS | File mtime: 2026-03-28 03:16 (not modified today) |
| Existing Netlify form names unaffected | ✅ PASS | hero-quick-form, get-preapproved, etc. unchanged |
| n8n LoanOS — Pre-Approval Lead Notify workflow | ✅ ACTIVE | ID: J9Pe24vUi6fpZtdZ, active: true (verified via MCP) |
| thank-you.html PA funnel copy preserved | ✅ PASS | Original H1 "Your Pre-Approval Request Was Received" still in HTML; only hidden by JS when `?type=rate-alert` |
| austin-mortgage-rates.html existing CTA preserved | ✅ PASS | "Get Your Personalized Rate Quote Today" bg-navy section still present |

### 6. UTM Verification — PASS

| Check | Result |
|-------|--------|
| All 5 UTM fields present in form | ✅ PASS |
| JS reads from window.location.search via URLSearchParams | ✅ PASS |
| Default values set: utm_source='direct', utm_medium='web', utm_campaign='rate-alert-funnel' | ✅ PASS |
| UTM values passed in subscribe-lead.js fetch() payload | ✅ PASS |

---

## Caveats (non-blocking — do not prevent deploy)

1. **Form submission end-to-end test deferred** — deployment required. Schedule re-test after Adam deploys.
2. **Email sequence QA deferred** — Mailchimp Customer Journey creation required first (Adam action).
3. **n8n non-fire regression** — critical test that `notifyPreApprovalLead()` does NOT fire for Rate Alert requires a live test submission with `lead_source='Rate Alert Funnel'`. Code confirms the gate is correct; execution-level confirmation needed post-deploy.

---

## Failures Requiring Fix
None. All code-level checks pass. No blocking failures.

---

## Post-Deploy QA Checklist (run after Adam deploys + Mailchimp Journey created)

- [ ] Submit test form at https://styermortgage.com/rate-alert with test+rate-alert-qa@thestyerteam.com
- [ ] Confirm redirect to /thank-you?type=rate-alert
- [ ] Confirm thank-you page shows "You're on the Austin Rate Watch list" (not PA funnel copy)
- [ ] Confirm Calendly widget is hidden
- [ ] Check Supabase contacts table: new contact with lead_source='Rate Alert Funnel', status='lead'
- [ ] Check n8n execution log: pre-approval workflow (J9Pe24vUi6fpZtdZ) should NOT have fired
- [ ] Check Mailchimp: contact added to Borrower audience with tag 'rate-alert'
- [ ] Check Mailchimp sent: Rate Watch Welcome Series Day 0 email delivered
- [ ] Check Netlify Forms dashboard: submission captured as safety net
