# Active Blockers — Lead Generation

---

## BLOCKER-001 — TCPA Bundled Consent on Homepage Forms
**Status:** PARTIALLY RESOLVED — Pending deploy + homepage forms still need fix
**Detected:** 2026-03-25 AM session
**Updated:** 2026-03-28 AM session

### What Was Fixed
- `/get-preapproved` page: Two-checkbox TCPA fix applied. Checkbox A (required consent) and Checkbox B (optional SMS opt-in) are separate, both unchecked by default. ✅
- `/prequal.html` (script.js): SMS opt-in checkbox present, unchecked by default, optional. ✅
- Both files are fixed in the local repo — NOT YET DEPLOYED to Netlify (git push pending).

### What Still Needs Fixing
- Homepage Quick Quote form: bundled SMS consent still present (not yet audited post-fix)
- Homepage Quick Contact form: not yet audited

### Risk Level
**LOW** — No SMS automation currently wired to any web form. Risk only activates if SMS is wired before remaining forms are fixed. Get-preapproved (highest traffic) is already fixed.

### Required Action
1. Adam: `git push` from styerteam-mortgage-site repo to deploy TCPA fixes to Netlify
2. Builder: Wire homepage Quick Quote + Quick Contact forms to subscribe-lead.js (separate ticket — homepage form wiring)
3. TCPA SMS opt-in Checkbox B: consider adding "This consent is not required to obtain a loan" for clearest language

### Who Resolves
- Deploy: Adam (`git push`)
- Homepage form wiring: Builder subagent (can bundle with Rate Alert Funnel or Homepage Form Wiring session)

---

## BLOCKER-002 — prequal.html Form Data Goes Nowhere (CRITICAL BUG)
**Status:** RESOLVED — Pending deploy
**Detected:** 2026-03-26 AM session
**Resolved:** 2026-03-28 AM session (confirmed by QA code review)

### Resolution
QA verified that `script.js` lines 673–732 contain a complete async submit handler for `#prequal-form` that:
1. `data-netlify="true"` is present on the form element in prequal.html ✅
2. fetch() call to `/.netlify/functions/subscribe-lead` with full payload ✅
3. Payload includes: fname, lname, email, phone, tag='prequal-lead', loan_goal, lead_source='Pre-Approval Funnel', sms_opt_in, UTM params, page_url ✅
4. Error handling is non-blocking (user sees success even if function fails) ✅
5. SMS opt-in checkbox is present on step 4, unchecked by default ✅

The fix was present in script.js before the 2026-03-28 AM session (exact commit unknown).

### Remaining Action
- Adam: `git push` from styerteam-mortgage-site repo to deploy to Netlify
- Adam: Confirm Netlify env vars are set before testing (MAILCHIMP_API_KEY, MAILCHIMP_BORROWER_LIST_ID, LOANOS_AGENT_SECRET)

---

## BLOCKER-003 — Pre-Approval Funnel Not Live (Deployment Pending)
**Status:** ACTIVE — Blocking lead capture
**Detected:** 2026-03-28 AM session
**Source:** QA subagent — code review confirms build complete but not deployed

### Issue
The Pre-Approval Funnel code is complete and verified. The n8n workflow is ACTIVE. But the HTML/JS changes have NOT been deployed to Netlify. Until Adam runs `git push` from the styerteam-mortgage-site repo, no leads from the updated form will reach n8n/Mailchimp/LoanOS.

Additionally, the Mailchimp "Pre-Approval Welcome Series" Customer Journey has not been created (cannot be done via API — requires Mailchimp UI).

### Required Actions (in order)
1. **Adam**: Confirm these Netlify env vars are set in Netlify dashboard → Site settings → Environment variables:
   - `MAILCHIMP_API_KEY`
   - `MAILCHIMP_BORROWER_LIST_ID` (should match list ID 5053c57af2 used in n8n workflow)
   - `LOANOS_AGENT_SECRET`
2. **Adam**: `git push` from `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site` to deploy to Netlify
3. **Adam**: In Mailchimp UI → Automations → Customer Journeys → create "Pre-Approval Welcome Series" triggered by tag `pre-approval-funnel`
4. **Adam**: Verify MAILCHIMP_BORROWER_LIST_ID matches list 5053c57af2 (the ID hardcoded in the n8n Apply Mailchimp Tags node)

### Risk Level
**MEDIUM** — No leads are being lost from get-preapproved.html (Netlify Forms still captures submissions as safety net), but they won't be routed to LoanOS/Mailchimp/n8n until deployment.

---

## Non-Blocking Bugs (track, fix in next build cycle)

### Bug-001: subscribe-lead.js — lead_source not passed to createLoanosContact() ✅ FIXED 2026-03-28
- File: `netlify/functions/subscribe-lead.js` line ~87
- Fix applied: Added `lead_source,` to createLoanosContact() argument object
- Impact: PA funnel leads will now show "Pre-Approval Funnel" in LoanOS contacts

### Bug-002: subscribe-lead.js — drip campaign_id ✅ NOT A BUG (2026-03-28)
- Supabase query confirmed: `a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d` IS the real campaign ID for "Pre-Approval Welcome Series"
- ORG_ID `18613f82-fdd9-42dd-a09e-f3c577328258` IS the real org ID for Adam Styer | Mortgage Solutions LP
- Both constants are correct. Drip enrollment will work once Netlify env vars are set.

### Bug-003: TCPA SMS opt-in language gap
- File: `get-preapproved.html` — Checkbox B label
- Missing phrase: "This consent is not required to obtain a loan"
- Risk: LOW — current language conveys same meaning, but explicit phrase is clearest practice

---
