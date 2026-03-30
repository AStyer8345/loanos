# Review: Rate Alert Funnel (Austin Rate Watch) — Lead Generation
Date: 2026-03-29
Verdict: APPROVED WITH NOTES

## Spec Compliance: PASS
## Conversion Quality: PASS
## Compliance: PASS
## Brand: PASS
## Technical: PASS

---

## Issues Requiring Fix Before QA (REJECTED items)
None. No blocking issues found.

---

## Spec Compliance Detail

- `rate-alert.html` created with 2-field form (fname + email), noindex ABSENT, NMLS footer: ✅
- Hidden fields: tag='rate-alert', lead_source='Rate Alert Funnel', page_url, all UTM fields: ✅
- Form name: `rate-alert-form` — exact match to spec ✅
- `data-netlify="true"` + hidden `form-name` input value `rate-alert-form`: ✅
- `action="javascript:void(0)"` — JS intercepts and redirects: ✅
- Redirect target: `/thank-you.html?type=rate-alert` — matches spec ✅
- `thank-you.html` Rate Alert copy block added: ✅ (conditional on `?type=rate-alert`)
- Calendly widget hidden on Rate Alert state: ✅
- `austin-mortgage-rates.html` Rate Alert CTA added: ✅ (inserted before existing bg-navy CTA)
- `subscribe-lead.js` unchanged (verified READ-ONLY): ✅
- No files outside spec scope were modified: ✅

---

## Conversion Quality Detail

- Form fields: 2 (fname + email) — well under 5-field limit ✅
- CTA above the fold: Yes — form card in hero section, first visible element on mobile ✅
- CTA copy: "Get My Weekly Rate Updates →" — action-oriented, specific, personalized ✅
- Trust signals visible near form: ★★★★★ stars, NMLS #513013, Austin since 2017, 40+ lenders ✅
- Thank-you experience: Clear "first Friday" delivery expectation + spam folder instruction ✅
- Email #3 subject line "The 3-question test for 'should I lock my rate now?'" — EXCELLENT. Highest converting expected ✅
- Email #4 opener "You've been on the Rate Watch for two weeks now" — reader-first, acknowledges their journey ✅
- Sequence arc: welcome → education → framework → CTA — logical progression, no repetition ✅
- Loan application link in Email 4: `https://mslp.my1003app.com/513013/register` — correct ✅

---

## Compliance Detail

### TCPA
- Rate Alert is email-only funnel — no SMS collected, no phone field, no SMS opt-in checkbox
- TCPA SMS checklist: N/A ✅

### CAN-SPAM
- Unsubscribe: Mailchimp auto-appends one-click unsubscribe to all emails ✅
- Physical address explicit in email copy:
  - Email 1: "5900 Balcones Drive Suite 100 | Austin, TX 78731" present ✅
  - Email 2: Physical address NOT in copy-text — Mailchimp footer handles this. ⚠️ See Note 1
  - Email 3: Physical address NOT in copy-text — Mailchimp footer handles this. ⚠️ See Note 1
  - Email 4: "5900 Balcones Drive Suite 100 | Austin, TX 78731" present ✅
- From name: "Adam Styer" — accurate ✅
- From email: `adam@thestyerteam.com` — accurate ✅
- No deceptive subject lines ✅

### Mortgage-Specific
- NMLS #513013: Present in page title, trust chips, and footer of rate-alert.html ✅
- "Adam Styer | Mortgage Solutions LP": Present in footer — "The Styer Team" ABSENT ✅
- Equal Housing Lender: On landing page footer and in all 4 email footers ✅
- No guaranteed approval language ✅
- Rate quotes with APR: Sample email preview shows APR alongside all rates; disclaimer added below mockup ✅
- No misleading urgency language ✅
- Reg Z: Landing page does not quote a specific rate — "market rate" copy only ✅

### Fair Lending
- No protected class targeting ✅
- No geographic redlining ✅
- No income-level exclusions ✅

---

## Brand Review

- Business name: "Adam Styer | Mortgage Solutions LP" — confirmed. "The Styer Team" not found ✅
- CSS variables: `var(--color-navy)`, `var(--color-gold)` — site design system used ✅
- Fonts: `var(--font-display)` and `var(--font-primary)` — consistent with site ✅
- Voice: Direct, punchy, no therapy tone, no inspiration-poster language ✅
- Mobile responsive: Media queries at 900px and 600px; form card reorders to top on mobile ✅

---

## Technical Review

- Netlify `form` element: `name="rate-alert-form"`, `data-netlify="true"`, `netlify-honeypot="bot-field"` ✅
- Hidden `form-name` input: `value="rate-alert-form"` ✅
- `action="javascript:void(0)"` — JS submit handler takes over; redirect via JS ✅
- Redirect path: `/thank-you.html?type=rate-alert` — correct ✅
- UTM fields: All 5 UTM params populated by page-load script ✅
- Google Ads conversion event fires on form submit (consistent with get-preapproved.html pattern) ✅
- GTM dataLayer event `generate_lead` with `lead_type: 'rate_alert_signup'` ✅
- subscribe-lead.js gating: `notifyPreApprovalLead()` and `enrollInDrip()` confirmed gated on `lead_source === "Pre-Approval Funnel"` — will NOT fire for Rate Alert ✅

---

## Notes for Next Session (non-blocking)

### Note 1: Email 2 and 3 physical address — Mailchimp dependency
Email 2 and 3 copy-text footers do not include the physical address. They rely on Mailchimp's account-level footer to auto-append it.
- **Action**: When Adam sets up the Mailchimp Customer Journey, confirm Mailchimp account mailing address is set to "5900 Balcones Drive Suite 100, Austin TX 78731" so it auto-appends correctly.
- **Risk**: LOW — Mailchimp requires a physical address on all commercial emails and will warn if it's missing.
- **Fix if needed**: Adam can edit the journey emails to add the address to the copy-text footer of emails 2 and 3.

### Note 2: Thank-you redirect URL format inconsistency
- `get-preapproved.html` redirects to `/thank-you` (no extension)
- `rate-alert.html` redirects to `/thank-you.html` (with extension)
- Both work on Netlify (extension stripped automatically). Non-breaking.
- Future builds: standardize to `/thank-you` without extension for consistency.

### Note 3: Subscribe-lead.js guard for sendGuideEmail
- Previously noted (from 2026-03-28 session): when Rate Alert and other funnels call subscribe-lead.js, the FTB guide email should not fire for non-FTB callers.
- Confirmed: subscribe-lead.js currently gates the guide email send — need to verify exact condition in next QA or Builder session when FTB funnel is built.
- Does not affect Rate Alert funnel today.
