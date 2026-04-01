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
**Status:** ✅ RESOLVED — 2026-03-29 AM session (commit `1b3f0be`, Adam Styer, 10:00 AM CT)
**Detected:** 2026-03-28 AM session
**Resolved:** 2026-03-29 AM session
**Confirmed:** 2026-03-30 AM post-deploy QA — all 4 pages verified live via WebFetch

### Resolution
Adam ran `git push` from styerteam-mortgage-site repo on 2026-03-29 at 10:00 AM CT. Commit `1b3f0be` deployed:
- `rate-alert.html` — NEW ✅
- `thank-you.html` — Modified (query param branching) ✅
- `austin-mortgage-rates.html` — Modified (CTA block added) ✅
- `get-preapproved.html` + TCPA fixes — Live ✅

Mailchimp env vars confirmed set (MAILCHIMP_API_KEY, MAILCHIMP_BORROWER_LIST_ID). LOANOS_AGENT_SECRET confirmed set (function attempts LoanOS call rather than short-circuiting).

### Remaining (not blocking)
- Adam: Create "Pre-Approval Welcome Series" Customer Journey in Mailchimp UI (triggered by tag `pre-approval-funnel`)
- Adam: Create "Rate Watch Welcome Series" Customer Journey in Mailchimp UI (triggered by tag `rate-alert`)
- Adam: Create recurring weekly Friday Rate Alert campaign

---

---

## BLOCKER-004 — Wrong LOANOS_URL in subscribe-lead.js (CRITICAL)
**Status:** PARTIALLY RESOLVED — Netlify env var added 2026-03-31 by Adam. Builder code change still needed (subscribe-lead.js line 42: read from `process.env.LOANOS_URL` instead of hardcoded URL).
**Detected:** 2026-03-30 AM post-deploy QA
**Source:** Live form test returned `{"success":true,"mailchimp":"ok","loanos":"failed"}` for both funnels

### Issue
`netlify/functions/subscribe-lead.js` line 42 has `LOANOS_URL` hardcoded as `https://loanos.vercel.app`. This domain returns a Next.js 404 HTML page — it is not a valid production domain for the LoanOS project.

**Actual Vercel project domains (verified via Vercel MCP):**
- `loanos-astyer8345s-projects.vercel.app` (primary)
- `loanos-self.vercel.app`
- `loanos-git-main-astyer8345s-projects.vercel.app`

Test of correct domain with invalid auth header returns "Authentication Required" (not 404), confirming the `/api/contacts/web-lead` route EXISTS — the URL is simply wrong.

### Impact
Every lead submitted via get-preapproved.html or rate-alert.html fails to create a LoanOS contact. Mailchimp tag is applied, but no CRM record created and no drip enrollment happens.

### Risk Level
**HIGH** — Lead data is being captured in Mailchimp but not synced to LoanOS. Drip enrollments are failing silently.

### Required Fix
**Option 1 (Best — environment variable approach):**
1. **Adam**: In Netlify dashboard → styermortgage.com → Site settings → Environment variables → Add: `LOANOS_URL = https://loanos-astyer8345s-projects.vercel.app`
2. **Builder**: Change subscribe-lead.js line 42 from `const LOANOS_URL = "https://loanos.vercel.app";` to `const LOANOS_URL = process.env.LOANOS_URL;`

**Option 2 (Quick fix):**
- **Builder**: Hardcode correct URL in subscribe-lead.js: `const LOANOS_URL = "https://loanos-astyer8345s-projects.vercel.app";`
- Risk: breaks if Vercel domain changes

### Who Resolves
- Adam: Add `LOANOS_URL` env var in Netlify (Option 1)
- Builder subagent: Code change in subscribe-lead.js + deploy

---

## BLOCKER-005 — notifyPreApprovalLead() Fire-and-Forget Bug (HIGH)
**Status:** ACTIVE — n8n PA notify not completing from subscribe-lead.js
**Detected:** 2026-03-30 AM post-deploy QA
**Source:** n8n workflow `J9Pe24vUi6fpZtdZ` triggerCount did not increment after PA form test via subscribe-lead.js

### Issue
`netlify/functions/subscribe-lead.js` calls `notifyPreApprovalLead(contactData)` without `await`. In Netlify serverless functions, execution terminates when the handler returns. Any unresolved async work is killed — the HTTP call to n8n never completes.

**Current code (broken):**
```js
notifyPreApprovalLead(contactData);  // fire-and-forget — killed before completing
return { statusCode: 200, body: JSON.stringify({...}) };
```

**Required code:**
```js
await notifyPreApprovalLead(contactData);  // completes before returning
return { statusCode: 200, body: JSON.stringify({...}) };
```

### Evidence
- Direct POST to `https://styer.app.n8n.cloud/webhook/pre-approval-lead` → `{"message":"Workflow was started"}` ✅ (webhook IS live)
- PA form test via subscribe-lead.js → triggerCount unchanged ❌

### Impact
PA leads are not triggering speed-to-lead notification to Adam. 5-minute contact window is being missed on every form submission.

### Risk Level
**HIGH** — Core PA funnel business logic not executing. Every new PA lead fails to trigger notification.

### Required Fix
**Builder**: In `netlify/functions/subscribe-lead.js`, add `await` before `notifyPreApprovalLead()` call. Then redeploy (`git push` from styerteam-mortgage-site repo).

### Who Resolves
Builder subagent (code change) + Adam (deploy: git push)

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
