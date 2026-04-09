# Build Report — FTB DPA Guide Funnel
Date: 2026-04-03
Session: AM Builder (Sequence C)
Spec: tasks/lead-gen/specs/2026-04-02-ftb-dpa-funnel-spec.md
Status: COMPLETE — Ready for git push + Netlify deploy

---

## Files Created / Modified

### CREATED: `ftb-dpa-guide.html`
- **Path:** `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site/ftb-dpa-guide.html`
- **URL slug:** `styermortgage.com/ftb-dpa-guide`
- **Template source:** `get-preapproved.html` (same header, CSS vars, GTM, footer pattern)
- **Form:** 3 fields — `fname` (required), `email` (required), `phone` (optional)
- **Hidden fields:** `tag=ftb-dpa-guide`, `lead_source=FTB DPA Guide`, `page_url`, UTM params (source/medium/campaign/term/content)
- **Form name:** `ftb-dpa-guide-form` (Netlify native form + `data-netlify="true"`)
- **CTA button:** "Send Me the Free Guide →"
- **JS submit handler:** intercepts submit → POSTs to `/.netlify/functions/subscribe-lead` → redirects to `/thank-you.html?type=ftb-dpa-guide`
- **Error handling:** On fetch error, redirects anyway (user experience preserved)
- **noindex:** ABSENT (page is indexable per spec)
- **NMLS #513013:** Present in page title and footer ✅
- **Equal Housing Lender:** Present in footer ✅
- **Below-fold sections:**
  - "What's in the Guide" (3 bullets)
  - "Do I Qualify?" checklist (4 items with green checkboxes)
  - Credibility block (blockquote + chips)
  - Program preview (TSAHC, TDHCA, City of Austin) with disclaimer
- **Compliance:** No guaranteed approval language; all DPA amounts use "up to" or "eligible buyers may receive" framing; program disclaimer present ✅

### MODIFIED: `netlify/functions/subscribe-lead.js`
- **Path:** `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site/netlify/functions/subscribe-lead.js`
- **Change 1 (lines 97–103):** Wrapped `sendGuideEmail()` in `if (tag === "ftb-guide")` — prevents FTB Guide Outlook email from firing for DPA leads (they use Mailchimp automation instead)
- **Change 2 (lines 105–113):** Changed LO notification condition from `lead_source === "Pre-Approval Funnel"` to `lead_source === "Pre-Approval Funnel" || lead_source === "FTB DPA Guide"` — DPA guide leads now trigger `notifyPreApprovalLead()` (warm/high-intent)
- **Change 3 (lines 115–123):** Separated drip enrollment into its own block (`lead_source === "Pre-Approval Funnel"` only) — DPA leads use Mailchimp Journey, not LoanOS drip

### MODIFIED: `thank-you.html`
- **Path:** `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site/thank-you.html`
- **Change:** Added `if (type === 'ftb-dpa-guide')` block before existing `if (type === 'rate-alert')` block
  - Headline: "Your Austin DPA Guide Is On Its Way"
  - Subheadline: Check inbox, guide arriving in minutes
  - Phone CTA: Replaced with Calendly booking prompt + secondary apply link
  - Calendly widget: **VISIBLE** (DPA leads are warm — Calendly is appropriate)
- **Existing types unaffected:** `rate-alert`, `quick-quote`, `refinance`, `preapproval`, and no-param all behave identically to pre-change

---

## Regression Check — All 3 Existing Funnels

| Funnel | Tag | lead_source | sendGuideEmail | notifyLead | enrollDrip |
|--------|-----|-------------|---------------|------------|------------|
| PA Funnel | pre-approval-funnel | Pre-Approval Funnel | ❌ No (correct) | ✅ Yes | ✅ Yes |
| Rate Alert | rate-alert | Rate Alert Funnel | ❌ No (correct) | ❌ No (correct) | ❌ No (correct) |
| FTB Guide | ftb-guide | (n/a) | ✅ Yes (correct) | ❌ No (correct) | ❌ No (correct) |
| **DPA Guide** | **ftb-dpa-guide** | **FTB DPA Guide** | **❌ No ✅** | **✅ Yes ✅** | **❌ No ✅** |

All 4 routing paths verified correct. ✅

---

## Open Items (Builder Cannot Complete)

1. **Adam: `git push` from `styerteam-mortgage-site` repo** — deploy to Netlify to go live
2. **Adam: Create "FTB DPA Guide Welcome Series" in Mailchimp UI**
   - Trigger: tag `ftb-dpa-guide`
   - 8 emails (Day 0, 2, 5, 10, 17, 25, 38, 52)
   - Full copy: `tasks/lead-gen/specs/2026-04-02-ftb-dpa-funnel-spec.md` (Email Sequence section)
   - Setup guide: `tasks/lead-gen/assets/Mailchimp-FTB-DPA-Setup-Guide.md`
3. **Adam: Host the DPA guide PDF and replace `[INSERT PDF LINK HERE]` in Mailchimp Emails 1 and 2**
   - PDF file: `tasks/lead-gen/assets/Austin-FTB-DPA-Guide-2026.pdf`
   - Upload to Google Drive or Netlify public folder → get shareable link
4. **Adam: Verify current TSAHC income/purchase price limits at tsahc.org before promoting funnel live**
   - Spec uses 2025 effective figures ($167,250 income, $593K purchase price)
5. **Adam: Review `ftb-dpa-guide.html` for DPA program accuracy before going live**
   - Check TSAHC stated as "up to 5%" (not fixed dollar) — verified in this build ✅
   - "Eligible buyers" language used throughout — verified ✅
   - NMLS #513013 visible — verified ✅
6. **Adam (optional): Update n8n `J9Pe24vUi6fpZtdZ` notification email subject** to distinguish DPA vs. PA leads (currently says "Pre-Approval Lead" — could be updated to show lead source)

---

## Compliance Checklist

- [x] TCPA: Email-only funnel — no phone opt-in checkbox, no SMS, no TCPA checkbox required
- [x] CAN-SPAM: Mailchimp handles unsubscribe + physical address in email footer (spec-specified)
- [x] NMLS #513013: In page title, trust signals, and footer
- [x] Equal Housing Lender: In footer
- [x] No guaranteed approval language: "eligible buyers may receive," "up to," "you may qualify" throughout
- [x] No protected class targeting: "first-time buyer" is a legal segment
- [x] DPA amounts use "up to" framing: all program details use "up to 5%" or "up to $X"
- [x] Program disclaimer: "subject to program availability" — present on landing page
- [x] No Regulation Z trigger words: No specific rate quoted on landing page

---

## Definition of Done — Status

- [x] `subscribe-lead.js` modified: `sendGuideEmail()` gated on `tag === "ftb-guide"` ✅
- [x] `subscribe-lead.js` modified: `notifyPreApprovalLead()` includes `lead_source === "FTB DPA Guide"` ✅
- [x] Regression confirmed: PA, Rate Alert, FTB Guide funnels unaffected ✅
- [x] `ftb-dpa-guide.html` created: 3-field form, JS handler, hidden fields, no noindex, NMLS + EHL footer ✅
- [x] `thank-you.html`: DPA-specific copy + Calendly widget for `?type=ftb-dpa-guide` ✅
- [x] Other thank-you states unaffected ✅
- [ ] Local test (browser) — Adam to verify; agent confirmed payload structure and redirect in code review
- [x] Build report written ✅
- [x] Adam action items logged ✅ (see Open Items above)
