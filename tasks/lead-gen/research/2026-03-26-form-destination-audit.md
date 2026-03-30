# Research: Web Form Destination Audit — Lead Generation
Date: 2026-03-26

## Executive Summary

The prequal.html form (/prequal.html — the site's highest-intent form) has a CRITICAL BUG: it collects 4 steps of detailed financial information but the JavaScript submit handler never transmits the data anywhere. It just shows a success message. Every lead who completes this form is permanently lost. This is not a configuration issue — it is a missing `fetch()` call in the JavaScript. This needs an emergency fix before any other lead gen work proceeds.

The homepage forms (Quick Quote, Quick Contact) go to Netlify Forms and sit in the Netlify dashboard with no webhook to n8n or Mailchimp. The Refinance Quote form also goes to Netlify with no automation. Only the First-Time Buyer Guide form is properly wired — it calls subscribe-lead.js which adds to Mailchimp, creates a LoanOS contact, and sends a guide email via n8n.

**The good news:** subscribe-lead.js already handles everything needed for a complete lead capture flow. The fix for every broken form is to call this function.

---

## Form-by-Form Audit

### 1. Pre-Qualification Form (/prequal.html)
**Status: CRITICAL BUG — DATA GOES NOWHERE**

- Form ID: `prequal-form`
- Data-netlify: NOT SET
- Form action: NOT SET
- JavaScript submit handler: Validates step, then shows success message. **No `fetch()` call. No data transmitted.**
- Automation connected: NONE
- Lead data captured: First name, last name, email, phone, purchase price, timeline, loan type, property type, credit score, employment status, income, debts — 4 steps of detailed info
- What happens to this data: IT IS LOST. The browser shows "Pre-Qualification Submitted!" but the data never leaves the user's browser.
- Impact: Every lead who completes this form since the site launched has been lost. No LoanOS contact. No Mailchimp. No email to Adam.
- TCPA: Bundled consent language present. No separate SMS opt-in.

**Fix required (Week 1 — Emergency):**
1. Add `data-netlify="true"` to the form element (basic safety net — stores in Netlify)
2. Wire the submit handler to call `/.netlify/functions/subscribe-lead` with email, fname, lname, phone, tag='prequal-lead', loan_goal from the form
3. Add separate, unchecked SMS opt-in checkbox before submit button (resolves BLOCKER-001 simultaneously)

### 2. Quick Quote Form (index.html hero section)
**Status: NETLIFY ONLY — no automation wired**

- Form name: `hero-quick-form`
- Data-netlify: YES (`data-netlify="true"`)
- Submit destination: Netlify Forms dashboard (POST to `/`)
- Automation: NONE. Submissions sit in Netlify dashboard with no email notification to Adam, no n8n trigger, no Mailchimp add.
- Fields collected: Name, email, phone, loan goal
- Impact: Leads submitted here are visible in Netlify dashboard only. Adam has no real-time notification. No nurture sequence fires.
- TCPA: No SMS opt-in present. No consent language at all on the Quick Quote form.

**Fix required (Week 2 — High Priority):**
Wire hero-quick-form submit handler to call subscribe-lead.js with tag='quick-quote-lead', plus fallback to Netlify Forms.

### 3. Quick Contact Form (index.html #contact-form)
**Status: NETLIFY ONLY — no automation wired**

- Form name: `quick-contact`
- Data-netlify: YES (`data-netlify="true"`)
- Submit destination: Netlify Forms dashboard
- Automation: NONE
- Fields collected: Name, email, phone, message (textarea)
- Impact: Contact requests visible in Netlify dashboard only. No LoanOS contact created. No notification to Adam.
- TCPA: No SMS opt-in. No consent language.

**Fix required (Week 2 — Medium Priority):**
Netlify Form webhook notification → Zapier → n8n Web Lead workflow OR direct subscribe-lead.js call.

### 4. Refinance Quote Form (/refinance-quote.html)
**Status: NETLIFY ONLY — no automation wired, but UTM tracking is present**

- Form name: `refinance-quote`
- Form method: `POST`, action: `/thank-you`, `netlify` attribute set
- Submit destination: Netlify Forms + redirects to /thank-you
- UTM fields: utm_source, utm_medium, utm_campaign, utm_term, utm_content auto-populated by JS ✅
- Automation: NONE. The subscribe-lead.js comment says it was intended to be called here, but the form doesn't call it.
- Fields collected: First name, last name, email, phone, refinance goal, current rate, loan balance, credit score, property type
- TCPA: No SMS opt-in. General consent language present.

**Fix required (Week 3 — High Priority with Refi Funnel):**
Replace Netlify form POST with fetch() call to subscribe-lead.js, tag='refi-quote-lead', pass loan_goal, utm fields.

### 5. First-Time Buyer Guide (/resources/first-time-buyer-guide/)
**Status: FULLY WIRED — pending env var confirmation**

- Calls: `/.netlify/functions/subscribe-lead` with email, fname, tag='ftb-lead'
- subscribe-lead.js does:
  1. Adds to Mailchimp borrower list with tag ✅
  2. Creates LoanOS contact via `/api/contacts/web-lead` ✅
  3. Sends FTB guide welcome email via n8n webhook (`/webhook/ftb-guide-email`) ✅
  4. Opens Gamma.app guide in new tab on success ✅
- TCPA: No SMS opt-in (none needed — email-only at this point)
- Open risk: Requires Netlify env vars: MAILCHIMP_API_KEY, MAILCHIMP_BORROWER_LIST_ID, LOANOS_AGENT_SECRET. Must verify these are set in Netlify dashboard.
- Open risk: Does the n8n FTB guide email webhook exist and is it tested?

---

## Platform / Channel Best Practices Applied

**subscribe-lead.js is the correct pattern for all forms.** The function already implements:
- Mailchimp upsert (creates or updates contact) with tag-based segmentation
- LoanOS contact creation
- n8n notification hook
- Parallel execution (fast)
- Error handling (Promise.allSettled — one failure doesn't break the other)

The Netlify Functions approach is correct for this static HTML site. No server changes needed — just wire the missing forms to the existing function.

**Netlify Forms (data-netlify) should be used as a fallback safety net** for all forms, in case the subscribe-lead.js call fails. Both can coexist.

---

## Compliance Requirements

**TCPA (SMS):**
- BLOCKER-001 is still active: prequal.html bundles SMS consent into submit button copy
- All forms currently lack any SMS opt-in language
- The fix: Add an unchecked checkbox before the submit button on prequal, quick quote, and refi quote. Copy: "I agree to receive text messages about my mortgage inquiry. Msg & data rates may apply. Reply STOP to opt out."
- This checkbox must be separate from the general consent language, NOT required (unchecked by default), and its value must be captured and passed to subscribe-lead.js as a `sms_consent` boolean

**CAN-SPAM:**
- Subscribe-lead.js currently adds contacts to Mailchimp as "subscribed" — this is correct only if the user has given email consent
- The prequal form has no email marketing consent language — it implies "I agree to be contacted" but doesn't specify email marketing specifically
- Recommendation: Add a brief disclosure above the submit button: "By submitting, you agree to receive mortgage-related communications from Adam Styer | Mortgage Solutions LP. You may unsubscribe at any time."

**NMLS:**
- prequal.html footer: ✅ NMLS #513013 and #2526130 present
- All pages audited: ✅ Equal Housing Lender in footer
- New landing pages built for Rate Alert, FTB Guide, etc. must carry same footer

---

## Performance Data (Adam's Current State)

| Form | Status | Leads Captured | Automation | Est. Monthly Volume |
|------|--------|---------------|------------|---------------------|
| Pre-Qual | CRITICAL BUG | 0 (all lost) | None | Unknown — lost |
| Quick Quote (homepage) | Netlify only | In Netlify dashboard | None | Unknown |
| Quick Contact | Netlify only | In Netlify dashboard | None | Unknown |
| Refi Quote | Netlify only | In Netlify dashboard | None | Unknown |
| FTB Guide | Wired (if env vars set) | LoanOS + Mailchimp | FTB email via n8n | Unknown |

**Confirmed: Adam has NO real-time lead notification from ANY website form today.**
The only way he knows a lead submitted is if he checks the Netlify dashboard manually.

---

## Recommended Approach

**Priority 1 — Emergency (this week):** Fix prequal.html
The prequal form is the highest-intent form on the site (multi-step, deep financial disclosure). Losing every submission is a major business impact. Fix: Wire the submit handler to call subscribe-lead.js. Add data-netlify="true" as safety net. Add TCPA-compliant SMS checkbox (resolves BLOCKER-001 simultaneously).

**Priority 2 — Week 2 Build:** Wire homepage forms to subscribe-lead.js
Quick Quote and Quick Contact currently go to Netlify with no automation. Fix: replace or augment the Netlify fetch() with a call to subscribe-lead.js.

**Priority 3 — Confirm FTB Guide env vars are live**
The FTB Guide is the only form that works correctly — but it's useless if MAILCHIMP_API_KEY or MAILCHIMP_BORROWER_LIST_ID aren't set in Netlify. Adam must confirm Netlify env vars are set.

**Priority 4 — Wire Refi Quote (Week 3)**
Wire refinance-quote.html to subscribe-lead.js with tag='refi-quote-lead' during Refi Watch funnel week.

---

## Gap Analysis

| Gap | Impact | Effort | Priority |
|-----|--------|--------|----------|
| prequal.html data never sent | CRITICAL — active revenue loss | Low (add fetch() + data-netlify) | P0 — Emergency |
| No real-time LO notification for any web lead | High — 5-min response window missed | Low (Netlify notification or n8n) | P0 — Emergency |
| Netlify forms not wired to automation | High — no nurture fires | Medium | P1 — Week 2 |
| TCPA bundled consent (BLOCKER-001) | Medium-High (blocks SMS automation) | Low (HTML checkbox) | P1 — Before SMS |
| No Mailchimp sequences for web leads | High — no nurture | High (build sequences) | P2 — Week 3 |
| No UTM tracking on prequal or quick quote | Medium — can't attribute leads | Low (add hidden fields + JS) | P2 — Week 2 |
| FTB Guide env vars may not be set | High — funnel silent failure | Low (check + set in Netlify) | P1 — Verify this week |

---

## Open Questions

1. **Adam must verify:** Are MAILCHIMP_API_KEY, MAILCHIMP_BORROWER_LIST_ID, and LOANOS_AGENT_SECRET set in Netlify Site Configuration → Environment Variables?
2. **Adam must verify:** Is the n8n webhook at `/webhook/ftb-guide-email` live and tested? (FTB Guide welcome email)
3. **Adam input needed:** How many leads have come through the website historically? Has Adam been manually tracking down prequal submissions via phone/email instead of expecting automation?
4. **Mailchimp status:** What audiences currently exist? Is there a "Borrower" list with an active ID? (Needed for subscribe-lead.js)
5. **Salesforce data:** Closed loans by lead source — run this report before Week 2 build to know which channels deserve the most investment.

---

## TCPA Fix HTML Snippet

Ready for Adam to paste into prequal.html, replacing the final step's submit section:

```html
<!-- TCPA-compliant consent block — replace the existing prequal-nav div at end of fieldset 4 -->
<div class="form-group" style="margin-top: 1.5rem; padding: 1rem; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px;">
  <label class="checkbox-label" style="display: flex; align-items: flex-start; gap: 0.75rem; cursor: pointer; font-weight: normal;">
    <input
      type="checkbox"
      id="sms-consent"
      name="sms_consent"
      value="yes"
      style="margin-top: 3px; flex-shrink: 0;"
    >
    <span style="font-size: 13px; color: #6b7280; line-height: 1.5;">
      <strong style="color: #374151;">Optional:</strong> I agree to receive text messages about my mortgage inquiry from Adam Styer | Mortgage Solutions LP (NMLS #513013). Message &amp; data rates may apply. Reply STOP to opt out at any time. Message frequency varies.
    </span>
  </label>
</div>

<p style="font-size: 12px; color: #9ca3af; margin-top: 0.75rem; line-height: 1.5;">
  By submitting this form, you agree to be contacted by Adam Styer | Mortgage Solutions LP regarding your mortgage inquiry via email and phone. For SMS communications, separate opt-in is required above. View our <a href="/privacy-policy.html" style="color: inherit; text-decoration: underline;">Privacy Policy</a>.
</p>

<div class="prequal-nav">
  <button type="button" class="btn btn-outline prequal-prev">Previous</button>
  <button type="submit" class="btn btn-primary btn-lg">Submit Pre-Qualification</button>
</div>
```

**Implementation notes:**
- The SMS checkbox is `type="checkbox"`, NOT required, unchecked by default
- General contact consent is in the paragraph text (email + phone — general TCPA)
- SMS consent is separate and explicit
- When wiring to subscribe-lead.js, pass `sms_consent: document.getElementById('sms-consent').checked`
- Do NOT pass `sms_consent: true` by default — only if the box is checked
