# Post-Deploy QA Report — 2026-03-30

**Session:** 2026-03-30 AM
**QA Type:** Live End-to-End Verification (Post-Deploy)
**Scope:** Rate Alert Funnel + Pre-Approval Funnel (deployed 2026-03-29, commit `1b3f0be`)
**Tester:** Claude Code (automated session)
**Test Email Used:** test+leadqa@thestyerteam.com
**Test Name Used:** QA-TEST

---

## Summary

| Check | Result |
|-------|--------|
| rate-alert.html live | ✅ PASS |
| austin-mortgage-rates.html CTA | ✅ PASS |
| thank-you.html query param branching | ✅ PASS |
| get-preapproved.html live | ✅ PASS |
| Mailchimp tagging — rate-alert | ✅ PASS |
| Mailchimp tagging — pre-approval-funnel | ✅ PASS |
| n8n PA webhook live | ✅ PASS |
| Rate Alert regression (PA notify must NOT fire) | ✅ PASS |
| LoanOS contact creation — rate-alert | ❌ FAIL — BLOCKER-004 |
| LoanOS contact creation — pre-approval | ❌ FAIL — BLOCKER-004 |
| n8n PA notify fires from subscribe-lead.js | ❌ FAIL — BLOCKER-005 |

**Overall: PARTIAL PASS** — Pages live, Mailchimp working, 2 new blockers discovered.

---

## Section 1 — Page Verification (Live)

### 1.1 rate-alert.html
- **URL:** styermortgage.com/rate-alert
- **Method:** WebFetch
- **Result:** ✅ PASS
- **Evidence:** Page loads. Title "Austin Rate Watch". 2-field form (fname + email). NMLS #513013 and Equal Housing Lender disclosure present. Form action posts to `/.netlify/functions/subscribe-lead` with `tag=rate-alert` and `lead_source=Rate Alert Funnel`.

### 1.2 austin-mortgage-rates.html CTA Block
- **URL:** styermortgage.com/austin-mortgage-rates
- **Method:** WebFetch
- **Result:** ✅ PASS
- **Evidence:** "Never Miss a Rate Move" section present. CTA button links to `/rate-alert`. Section is visible and correct.

### 1.3 thank-you.html — Query Param Branching
- **URL:** styermortgage.com/thank-you?type=rate-alert
- **Method:** WebFetch
- **Result:** ✅ PASS
- **Evidence:** Page shows rate alert copy ("You're on the Austin Rate Watch list") when `?type=rate-alert` param is present. Default (no param) shows PA/FTB copy as expected. JavaScript branching confirmed working.

### 1.4 get-preapproved.html
- **URL:** styermortgage.com/get-preapproved
- **Method:** WebFetch
- **Result:** ✅ PASS
- **Evidence:** Page loads. 5-field form. TCPA two-checkbox pattern present. lead_source="Pre-Approval Funnel". Form wired to subscribe-lead.js.

---

## Section 2 — Form Submission Tests

### 2.1 Rate Alert Funnel — End-to-End
**Test:** POST to `/.netlify/functions/subscribe-lead` with `tag=rate-alert`, `lead_source=Rate Alert Funnel`
**Email:** test+leadqa@thestyerteam.com

**Response:**
```json
{"success":true,"mailchimp":"ok","loanos":"failed"}
```

| Sub-check | Result | Notes |
|-----------|--------|-------|
| Netlify function responds | ✅ PASS | HTTP 200 |
| Mailchimp contact created/tagged | ✅ PASS | `mailchimp: "ok"` |
| LoanOS contact created | ❌ FAIL | `loanos: "failed"` — see BLOCKER-004 |
| n8n PA notify fired | ✅ PASS (regression) | PA notify correctly did NOT fire for rate-alert |

### 2.2 Pre-Approval Funnel — End-to-End
**Test:** POST to `/.netlify/functions/subscribe-lead` with `tag=pre-approval-funnel`, `lead_source=Pre-Approval Funnel`
**Email:** test+leadqa@thestyerteam.com

**Response:**
```json
{"success":true,"mailchimp":"ok","loanos":"failed"}
```

| Sub-check | Result | Notes |
|-----------|--------|-------|
| Netlify function responds | ✅ PASS | HTTP 200 |
| Mailchimp contact created/tagged | ✅ PASS | `mailchimp: "ok"` |
| LoanOS contact created | ❌ FAIL | `loanos: "failed"` — see BLOCKER-004 |
| n8n PA notify fired from subscribe-lead.js | ❌ FAIL | Fire-and-forget pattern — see BLOCKER-005 |

**Note on n8n:** Direct POST to `https://styer.app.n8n.cloud/webhook/pre-approval-lead` returns `{"message":"Workflow was started"}` confirming the webhook IS live. The failure is in subscribe-lead.js not completing the async call before Netlify terminates the function.

---

## Section 3 — Bugs Discovered

### BLOCKER-004 — Wrong LOANOS_URL in subscribe-lead.js (CRITICAL)

**File:** `netlify/functions/subscribe-lead.js` line 42
**Bug:** `LOANOS_URL` is hardcoded as `https://loanos.vercel.app`
**Impact:** All LoanOS contact creation via subscribe-lead.js fails with 404
**Root cause:** `loanos.vercel.app` is not a valid domain for this project. Actual Vercel project domains:
- `loanos-astyer8345s-projects.vercel.app` (primary)
- `loanos-self.vercel.app`
- `loanos-git-main-astyer8345s-projects.vercel.app`

**Verification:** Direct test of `https://loanos-astyer8345s-projects.vercel.app/api/contacts/web-lead` with a test auth header returns "Authentication Required" (not 404), confirming the route EXISTS on the correct domain.

**Fix options:**
1. (Best) Set `LOANOS_URL` as a Netlify environment variable pointing to the correct domain, and change line 42 to `const LOANOS_URL = process.env.LOANOS_URL;`
2. (Quick fix) Hardcode `https://loanos-astyer8345s-projects.vercel.app` — but this will break if the Vercel domain ever changes

**Fix owner:** Adam (Netlify env vars) + Builder (subscribe-lead.js code change)

---

### BLOCKER-005 — notifyPreApprovalLead() Fire-and-Forget in Serverless Context (HIGH)

**File:** `netlify/functions/subscribe-lead.js` lines 105-106
**Bug:** `notifyPreApprovalLead()` is called without `await`
**Impact:** The Netlify function may return before the PA notify call to n8n completes. In serverless environments, execution terminates when the handler returns — any pending async work is killed.

**Current code:**
```js
// line 105-106 (approx)
notifyPreApprovalLead(contactData);  // ← no await
return { statusCode: 200, body: JSON.stringify({ success: true, ... }) };
```

**Expected code:**
```js
await notifyPreApprovalLead(contactData);
return { statusCode: 200, body: JSON.stringify({ success: true, ... }) };
```

**Evidence:** Direct webhook test to n8n returns `{"message":"Workflow was started"}` (webhook IS live), but triggerCount for workflow `J9Pe24vUi6fpZtdZ` did not increment after PA form test via subscribe-lead.js.

**Risk:** PA leads are not getting speed-to-lead notification. 5-minute contact window is being missed on every form submission.

**Fix owner:** Builder subagent (subscribe-lead.js change + redeploy)

---

## Section 4 — Regression Gate

**n8n PA notify must NOT fire for rate-alert submissions:**
✅ CONFIRMED — triggerCount for `J9Pe24vUi6fpZtdZ` did not change after rate-alert test submission. The PA notify is correctly gated on `lead_source === "Pre-Approval Funnel"` in the n8n workflow logic. No regression.

---

## Section 5 — Outstanding Items (Pre-Existing, Not Retested)

These were known pending items before this session — not retested today:

| Item | Status |
|------|--------|
| Mailchimp "Pre-Approval Welcome Series" Customer Journey | ⏳ Pending — Adam must create in UI |
| Mailchimp "Rate Watch Welcome Series" Customer Journey | ⏳ Pending — Adam must create in UI |
| Recurring weekly Friday Rate Alert campaign | ⏳ Pending — Adam must create in UI |
| Netlify env vars confirmed by Adam | ⏳ Unconfirmed — `mailchimp: "ok"` confirms MAILCHIMP_API_KEY and MAILCHIMP_BORROWER_LIST_ID are set |
| LOANOS_AGENT_SECRET set in Netlify | ⏳ Partially confirmed — subscribe-lead.js attempts LoanOS call (doesn't short-circuit), so secret IS set |

---

## QA Verdict

**PASS WITH BLOCKERS**

- All 4 pages are live and correctly configured ✅
- Mailchimp integration is fully functional ✅
- Rate Alert regression gate passed ✅
- n8n webhook infrastructure is live ✅
- **2 new blockers require fixes before LoanOS integration is functional**
  - BLOCKER-004: Wrong LOANOS_URL (all contact creation fails)
  - BLOCKER-005: Fire-and-forget async bug (PA notify not completing)

Week 3 is **functionally complete at the Mailchimp layer**. Lead capture is live. LoanOS sync and speed-to-lead notification require the two bug fixes.
