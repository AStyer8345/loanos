# Active Blockers — Lead Generation

---

## BLOCKER-006 — Lead Scoring Workflow Erroring on Every Live Lead (HIGH)
**Status:** ✅ RESOLVED — 2026-06-09 AM session (REST PUT, credentials preserved + QA-verified). TWO bugs fixed (second was hidden behind the first).
**Detected:** 2026-06-08 AM session (Lead Flow Audit)
**Severity:** HIGH — silent; defeated the domain PRIMARY GOAL (route hot leads to Adam in 5 min) and the GOALS North Star (same-day lead response).

### Resolution (2026-06-09 AM)
Verified still broken live first (workflow `updatedAt` still 2026-04-24, `responseMode=responseNode`, no Respond node; two NEW errored execs 23867/23915 on 06-08 = live leads dropped). Then fixed both bugs via n8n REST PUT (per memory/tools/n8n.md — preserves credential bindings; MCP update_workflow would wipe them):

**Bug 1 (trigger, the filed one):** `Lead Score Webhook` node `responseMode` changed `responseNode` → `onReceived`. Removes the Respond-to-Webhook dependency (scoring is fire-and-forget). Killed the `WorkflowConfigurationError: No Respond to Webhook node found`.

**Bug 2 (hidden, surfaced only after Bug 1):** With the trigger fixed, the test execution flowed into `Get Scored Actions` and failed `Authorization failed — Invalid API key`. The Supabase Custom Auth credential `qjRCjm5wKJgPGXXY` ("Supabase Service Role"), used by `Get Scored Actions` + `Patch Lead Score` + `Surface Hot Lead`, had a stale/wiped secret (raw service-role key from memory returns HTTP 200, so keys were NOT rotated — likely a prior MCP `update_workflow` credential-wipe). The n8n public API can't update an existing credential's secret, and the cred was used by only this one workflow (checked all 53), so: created NEW `httpCustomAuth` cred `Bi7VTMWZeMnTrS3h` ("Supabase Service Role (rebuilt 2026-06-09)", headers apikey + Authorization Bearer) and re-pointed the 3 nodes to it. `Notify Adam`'s separate `LoanOS Agent Secret` cred (`0f41tr1CKLbSsd50`) left untouched.

### QA evidence
- After both fixes, versions in sync (`versionId == activeVersionId`); published webhook = `onReceived`.
- Test POST `{"contact_id":"00000000-…0000"}` → exec **24136 status=success** (2.45s). Path: Webhook → Extract Fields → Get Scored Actions → Compute Score (score=0) → Patch Lead Score → Is Hot Lead? (false). `Surface Hot Lead` + `Notify Adam` correctly NOT executed (fake contact scored 0 → no notification to Adam, no real data mutated).
- All 4 credential bindings confirmed intact in the PUT response (3× `Bi7VTMWZeMnTrS3h`, 1× `0f41tr1CKLbSsd50`).

### Follow-ups (not blocking the fix)
- **Backfill:** 25 of 26 contacts created since 2026-05-01 are `lead_score=0`/`tier=new` (unscored during the ~3-wk outage). Now that scoring works, re-POST each `{"contact_id":"<id>"}` to `https://styer.app.n8n.cloud/webhook/lead-score-update` to score/surface them — BUT that re-fires `Notify Adam` for hot ones, so Adam (or a non-restricted session) should run it. Filed in ADAM-TODO.
- **Cleanup (optional, Adam):** delete orphaned credential `qjRCjm5wKJgPGXXY` in n8n UI (now used by 0 workflows). Left in place — not deleted autonomously.
- **Memory updated:** `memory/tools/n8n.md` notes the new credential id.

### Original diagnosis (preserved)

### Root Cause (verified live)
n8n workflow `nOCDV73m4M0jyL1B` ("LoanOS — Lead Score Updater") is **active** but every recent execution errors in ~45ms with:
> `WorkflowConfigurationError: No Respond to Webhook node found in the workflow`

The `Lead Score Webhook` node is configured `responseMode: "responseNode"` (respond via a Respond-to-Webhook node), but **no Respond-to-Webhook node exists** in the workflow. n8n rejects the call at the trigger — it never reaches Extract Fields / Compute Score / Notify Adam.

### Evidence
- Errored executions: `21055` (2026-06-01 01:17, matches contact "Quailton"), `15829` (2026-05-19), `14323` (2026-05-15) — all status `error`, same stack.
- Supabase: web leads since mid-May all land `lead_score=0` / `lead_tier="new"`. Last successfully scored lead: "Emily" 70/hot on 2026-05-05.
- Workflow `updatedAt` 2026-04-24; last known-good test was exec 5936 on 2026-04-22. Misconfig introduced sometime after.

### Impact
Every owned-channel web lead is unscored; hot-lead surfacing (`hot_lead_dismissed=false`) and the `Notify Adam` call (`/api/notify/hot-lead`) never fire. Speed-to-lead notification has been dead ~3+ weeks.

### Required Fix (do NOT use MCP update_workflow — it wipes this workflow's 4 credential bindings)
Pick one, then redeploy via **n8n REST PUT** (preserves credentials) or Adam edits in the n8n UI:
- **Simplest:** Lead Score Webhook node → set **Respond** = "Immediately" (`responseMode: onReceived`). Scoring is fire-and-forget; the caller doesn't need the score back. Removes the Respond-node dependency entirely.
- **Alt:** keep `responseNode` and add a "Respond to Webhook" node (200) after Extract Fields.
Then QA: re-POST one test payload `{"contact_id":"<test>"}` to `https://styer.app.n8n.cloud/webhook/lead-score-update`, confirm execution `success` and `contacts.lead_score` updates.

### Who Resolves
- Builder subagent (REST PUT per memory/tools/n8n.md) + QA replay — OR Adam (one-click in n8n UI). Per CRITICAL RULE #1, route through Reviewer/QA before marking resolved.

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
**Status:** ✅ FULLY RESOLVED — 2026-04-01 AM verification
**Resolved:** Code fixed in commit `1a4f90c` (2026-03-30 08:41 CT). Env var `LOANOS_URL` added by Adam in Netlify dashboard 2026-03-31. Both code + env var confirmed present. Fix is deployed (ancestor of latest origin/main commit `ede505e`).
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
**Status:** ✅ FULLY RESOLVED — 2026-04-01 AM verification
**Resolved:** Code fixed in commit `1a4f90c` (2026-03-30 08:41 CT). Both `notifyPreApprovalLead()` and `enrollInDrip()` are now called inside `await Promise.allSettled([...])` — both execute to completion before function returns. Fix is deployed (ancestor of latest origin/main commit `ede505e`).
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
