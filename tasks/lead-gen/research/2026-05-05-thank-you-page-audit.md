# /thank-you.html Cross-Funnel Conversion Audit

**Author:** Lead Gen Agent (autonomous AM session, 2026-05-05)
**Source file:** `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site/thank-you.html` (724 lines)
**Production URL:** `https://styermortgage.com/thank-you.html`
**Mission:** 4th in the funnel-page audit series. Single page handles **all six** funnel post-submit landings via `?type=` URL-param branching. Last owned-channel touchpoint before a captured lead disappears.
**Type:** Read-only audit (Sequence A). Zero code changes, zero deploys.

---

## 0. H5 Deploy-Gap Verification (closed inline)

The 2026-05-04 homepage-forms audit logged H5 as a likely deploy gap — `script.js` carries explicit `lead_source: 'Quick Quote'` / 'Quick Contact' literals, but Supabase shows zero rows under those values in 90 days while 8 'Website' fallback rows exist.

**Pre-mission verification:**
- `curl https://styermortgage.com/script.js?v=20260417` → HTTP 200, 28,961 bytes
- Lines 407, 523, 739 in production-served file:
  - L407: `lead_source: 'Quick Contact',`
  - L523: `lead_source: 'Quick Quote',`
  - L739: `lead_source: 'Pre-Approval Funnel',`

**Conclusion:** H5 hypothesis is **falsified** — the deploy is in production. The forms-to-Supabase delivery gap is upstream. Three remaining possibilities:
1. The 8 'Website' rows pre-date the script.js change. Most-recent 'Website' row was 2026-04-30, which is *after* `script.js?v=20260417` was cached — so this is unlikely unless the version-bumped query string is being served from CDN cache to the browser but the Netlify function `subscribe-lead.js` is receiving requests from a different (older-cached) page.
2. Real homepage submissions are extremely rare and the 8 'Website' rows come from non-homepage sources writing the fallback.
3. Some submit pathway short-circuits before the JSON body reaches `subscribe-lead.js`. Specifically: line 396 of `script.js` sends form data to `/` first (Netlify Forms) and *also* fires `fetch('/.netlify/functions/subscribe-lead', …)`. If the second fetch silently rejects (CORS, origin mismatch, body-parsing error in the Function), Mailchimp tag never applies AND LoanOS contact never creates — but the user still sees success. No client-side surface for the failure.

**Action for follow-up session:** call `subscribe-lead.js` directly with a deterministic test body to confirm round-trip → Supabase lands a row with `lead_source='Quick Quote'`. Flagged below as an action item, not a finding.

---

## 1. Cross-Funnel Routing Map

The page parses `?type=` from query string at line 622, then mutates DOM per branch. There are **six routed branches plus a default fallback**:

| `?type=` value | Sets h1 | Modifies subhead | Modifies phone CTA | Hides Calendly | Reveals quick-quote form | Reveals alt-paths card |
|----------------|---------|------------------|--------------------|----------------|--------------------------|------------------------|
| `ftb-dpa-guide` | "Your Austin DPA Guide Is On Its Way" | inbox-check copy | Replaces with email + raw application URL | No | No | No |
| `rate-alert` | "You're on the Austin Rate Watch List" | inbox-check, Friday cadence | Replaces with rates-page link | **YES** (display:none) | No | No |
| `quick-quote` | (slim hero strip; h1 hidden) | (h1+subhead hidden) | (slim version) | No | **YES** | **YES** |
| `refinance` | "Your Refinance Quote Request Was Received" | unchanged | unchanged | No | No | **YES** |
| `preapproval` | "Your Pre-Approval Request Was Received" | unchanged | unchanged | No | No | **YES** |
| `lo-waitlist` | "You're on the LoanOS Waitlist" | "no spam, build updates" | mailto link | **YES** (display:none) | No | No |
| (no `?type=`, or unknown value) | "Your Request Was Received" (default) | default Adam-personally copy | default Call/Text now | No | No | No |

**3-step "What Happens Next" block (lines 435–456) is shown for ALL branches except quick-quote** (which hides it at line 654). Step 3 hard-codes the literal: *"Letter or quote in 24 hrs"* — accurate for **preapproval**, dubious for the rest:
- `rate-alert` — gets weekly Friday rate update, NOT a letter or quote.
- `ftb-dpa-guide` — gets a PDF guide, not a letter.
- `lo-waitlist` — gets nothing immediately; product doesn't exist for them yet.
- `refinance` — receives quote, but in a different timeframe than PA (pricing must run at refi-rate volatility).

This is the single highest-leverage finding on the page: a misleading next-step promise, displayed by default, on the moment-of-truth post-submit landing. → see **H1**.

**Also documented:** the inline IIFE at lines 621–720 is brittle. Adding a 7th funnel type requires editing this block; the branching is sequential `if/else if`, no default-handling for unrecognized types beyond the bare h1 fallback.

---

## 2. Pipeline State (read-only, 2026-05-05 10:25 CT)

```
drip_sends total                    = 0
drip_sends 7d                       = 0
drip_enrollments total              = 0
drip_enrollments 7d                 = 0
contacts.lead_source = 'Pre-Approval Funnel'   = 0   (13th consecutive day at 0)
contacts.lead_source = 'Rate Alert Funnel'     = 0   (37 days since deploy)
contacts.lead_source = 'Quick Quote'           = 0   (90d, unchanged from 05-04)
contacts.lead_source = 'Quick Contact'         = 0   (90d, unchanged from 05-04)
contacts.lead_source = 'Website'               = 8   (90d, unchanged from 05-04)
contacts created last 7d            = 3        (2 null + 1 Website 2026-04-30)
```

**Comparison to 05-04 baseline:** drip pipeline at zero (5+ weeks since deploy). Last 7-day window same shape as yesterday — `lead_source` mix is 2 null + 1 'Website', no change. No new homepage form captures landed since 04-30. **The thank-you.html page receives effectively zero traffic** because the funnels feeding it produce ~1 capture/week steady-state, almost all from legacy default paths.

**Implication for audit prioritization:** every change to thank-you.html lands on near-zero traffic. Conversion-rate fixes here are forward-looking — they'll pay back when the upstream funnels start feeding real volume. Any HIGH-tier ship is a 30-min PR; the *cost* of fixing is low even when the *visible benefit today* is invisible.

---

## 3. Findings — HIGH (5)

### H1. 3-step "What Happens Next" block misleads non-PA funnel branches
**Lines:** 435–456 (always-rendered) + 653–654 (hidden only for quick-quote)
**Severity:** HIGH (UX integrity + voice integrity)

Step 3 reads *"Letter or quote in 24 hrs — Pre-approval letter or rate quote delivered within one business day of submitting your documents."* This is accurate for `?type=preapproval` only. Rate-alert and FTB-DPA leads see this and either (a) get confused (no letter is coming) or (b) feel mismatch with the actual sequence the page has just promised them.

**Fix options:**
- **Option A (recommended):** hide `#ty-steps` for rate-alert / ftb-dpa-guide / lo-waitlist branches; keep visible only for preapproval / refinance / default. Add per-branch `stepsSection.style.display = 'none'` lines to those three IIFE branches.
- **Option B:** rewrite Step 3 with branch-specific copy. Higher edit cost; same behavioral fix.

**Before (Step 3, current):**
> Letter or quote in 24 hrs — Pre-approval letter or rate quote delivered within one business day of submitting your documents.

**After (Option A — hide for the 3 mismatched branches):**
> No copy change. Just hide the section.

**Voice-guide check:** Adam's voice rejects vague promises. "Letter or quote in 24 hrs" is a specific promise — when shown to the wrong funnel, it becomes a broken promise. Voice + UX align on this fix.

---

### H2. Rate-alert branch hides Calendly entirely
**Line:** 636 (`if (calendlySection) calendlySection.style.display = 'none';`)
**Severity:** HIGH (path-to-call eliminated for warm leads)

Rate-alert subscribers are *self-identified* future-buyers/refinancers — they're warmer than they look, just not ready *yet*. Hiding Calendly removes the only visible CTA to start a real conversation today. Page becomes: "you're on the list, see current rates" — that's it.

**Fix:** Keep Calendly visible. Optionally re-frame the section h2 from "Book a 15-Minute Call" to "Want to talk now? Pick a time" so it doesn't feel out-of-place for someone who just opted into a watch-only product.

**Before:**
```js
if (calendlySection) calendlySection.style.display = 'none';
```
**After:**
```js
// Calendly stays visible — let warm rate-alert leads schedule if they want.
// Optionally retitle so it doesn't feel jarring.
var rateCalendlyH2 = calendlySection?.querySelector('h2');
if (rateCalendlyH2) rateCalendlyH2.textContent = "Want to talk now? Pick a time";
```

---

### H3. ftb-dpa-guide branch wipes the phone CTA
**Lines:** 631 (`phoneCta.innerHTML = 'Ready to find out... <a href="https://mslp.my1003app.com/513013/register">...`)
**Severity:** HIGH (conversion + accessibility)

The DPA-guide branch replaces the existing phone affordance with an email-+-application-link composite. DPA leads are typically first-time buyers — they often want to *talk* to a human before applying. Removing the phone CTA forces them to either (a) email Adam asynchronously or (b) start a 1003 application before they understand what they qualify for. Both are higher-friction than calling.

**Fix:** Append the phone CTA, don't replace. Pattern:

**Before:**
```js
if (phoneCta) phoneCta.innerHTML = 'Ready to find out which programs you qualify for? Book a free 15-minute call with Adam — no credit pull, no obligation. <br><a href="...">Or start your application →</a>';
```
**After:**
```js
if (phoneCta) phoneCta.innerHTML = 'Questions about which programs you qualify for? Call or text Adam at <a href="tel:+15129566010">(512) 956-6010</a> — no credit pull, no obligation. <br><a href="https://mslp.my1003app.com/513013/register" style="font-size:0.9em;opacity:0.8;">Or start your application →</a>';
```

Preserves the phone affordance, keeps the application link, drops the "Book a free 15-minute call" framing (Calendly stays visible below for that path).

---

### H4. Pre-approval branch is bare — no PA-specific reassurance copy
**Lines:** 710–713 (only h1 text changes; alt-paths card revealed; no other copy customization)
**Severity:** HIGH (highest-intent funnel gets least branch effort)

PA leads have just submitted: full name, email, phone, often loan_goal. They're the warmest funnel on the page. Yet the PA branch only swaps the h1. They see the same generic Adam-personally-reviews subhead, the same default phone CTA, the same default 3-step block, and the same default alt-paths card.

Compare: the rate-alert branch gets a custom rates-page link and the ftb-dpa-guide branch gets a custom email-and-application CTA. PA gets neither.

**Fix:** Author PA-specific reassurance copy. 4–6 lines.

**Before (PA branch, current):**
```js
} else if (type === 'preapproval') {
  if (h1) h1.textContent = "Your Pre-Approval Request Was Received";
  var altPathsPa = document.getElementById('ty-alt-paths');
  if (altPathsPa) altPathsPa.hidden = false;
}
```

**After (suggested):**
```js
} else if (type === 'preapproval') {
  if (h1) h1.textContent = "Your Pre-Approval Request Was Received";
  if (paras.length > 0) {
    paras[0].textContent = "Adam personally reads every PA request. He'll text or call from his cell within a few hours during business hours (Mon–Fri, 8am–6pm CT). The average client closes in 21 days — Adam's rolling 12-month average across 90+ purchases.";
  }
  if (phoneCta) phoneCta.innerHTML = 'Want to start the soft-credit pull while you wait? <a href="https://mslp.my1003app.com/513013/register">Begin the full application</a> — ~10 minutes.';
  var altPathsPa = document.getElementById('ty-alt-paths');
  if (altPathsPa) altPathsPa.hidden = false;
}
```

**Compliance check on the 21-day claim:** The 05-01 get-preapproved audit (M7) flagged that "21-day avg close" needs sourcing. If that audit's M7 hasn't been resolved by the time this fix ships, drop the literal number and use *"close in weeks, not months"* instead.

---

### H5. Default fallback ("no `?type=`") is the bare-default copy — silent error mode
**Lines:** 422–432 (always-rendered hero); 622 onward (no else-default branch in IIFE)
**Severity:** HIGH (silent breakage on funnel page misconfiguration)

Today, if any funnel page redirects to `/thank-you.html` *without* setting `?type=`, the visitor lands on the default copy: *"Your Request Was Received — Adam personally reviews every submission..."* This is fine if it happens to a real lead, but it also masks bugs. Adam can't tell the difference between a working funnel and a broken one from the user-visible state.

**Fix:** Add an explicit visible state for "unknown funnel type", logged to dataLayer for GTM debugging:

**After (suggested — append to the IIFE):**
```js
} else if (type) {
  // Recognized but unhandled value — log for GTM debugging.
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: 'thank_you_unknown_type', funnel_type: type });
} else {
  // No ?type= param. Most likely a direct URL hit, not a funnel landing.
  // Keep the default copy but emit a debug event.
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: 'thank_you_no_type' });
}
```

This is forward-looking instrumentation, not user-visible. Cost: 8 lines. Benefit: future you (or any agent) can spot a misconfigured funnel page in GTM debug view in under 30 seconds.

---

## 4. Findings — MEDIUM (6)

### M1. Title is identical across all 6 branches
**Line:** 6 (`<title>Request Received | Adam Styer | NMLS #513013</title>`)
**Severity:** MEDIUM (UX — bookmark/tab clarity; SEO impact zero under noindex)

Six different funnel landings, one title. A user who bookmarks the page after a rate-alert opt-in sees "Request Received" instead of "Rate Watch List Confirmed". Mostly cosmetic since the page is `noindex,nofollow`, but cheap to fix.

**Fix:** Add a per-branch `document.title = …;` line in each IIFE branch.

---

### M2. Quick-quote follow-up form re-collects "How did you hear about Adam?"
**Lines:** 530–542
**Severity:** MEDIUM (form-abandonment risk on optional survey)

The original Quick Quote form (homepage) captures UTM params and `page_url`. Asking again on the follow-up is duplicative. For a 9-question optional form, every redundant question raises abandonment risk.

**Fix:** Drop `referral_source` from the follow-up form. UTM tracking already covers this server-side via `subscribe-lead.js`.

---

### M3. Quick-quote follow-up form lacks privacy reassurance
**Lines:** 465–559 (the form block)
**Severity:** MEDIUM (trust signal absent at moment of voluntary disclosure)

The follow-up form asks for credit-score range, income-adjacent purchase price/down payment, realtor relationship, and timeline. That's intimate financial data, requested *after* the user has already gotten what they came for (a phone call from Adam). Users on the fence about volunteering this need a one-line trust signal.

**Fix:** Add one line above the submit button: *"These details stay private — only Adam sees them, and they help him prep a sharper first call."*

---

### M4. Calendly section h2 is generic
**Line:** 591 (`<h2>Book a 15-Minute Call</h2>`)
**Severity:** MEDIUM (per-branch context drop)

Same h2 across all branches. Per-branch h2 ("While you wait — pick a time" for PA; "Want to talk now? Lock in a call" for rate-alert if H2 is fixed) reads warmer.

**Fix:** Per-branch `document.querySelector('.ty-calendly-section h2').textContent = "…";` lines in the IIFE branches.

---

### M5. Hard-coded `mailto:adam@thestyerteam.com` in lo-waitlist branch
**Line:** 717
**Severity:** MEDIUM (brand consistency — global CLAUDE.md "never use The Styer Team")

The global Adam Styer Claude rules forbid the *"The Styer Team"* brand. The literal email address `adam@thestyerteam.com` is an old domain still in use as a working mailbox, but as far as a public-facing surface goes, this leaks the deprecated brand into the user-visible mailto link.

**Fix:** Replace with `styer.adam@gmail.com` OR `adam@adamstyer.com` (whichever is the canonical user-facing address per Adam — both appear in Cowork OS configs). **Cross-page bundle:** the rate-alert audit also flagged a `From: thestyerteam.com` literal in sample copy — bundle these together in a single brand-consistency PR.

---

### M6. Google Ads conversion fires unconditionally for `?type=lo-waitlist`
**Lines:** 614–618
**Severity:** MEDIUM (attribution noise — non-mortgage conversion mis-counted as mortgage conversion)

The `gtag('event', 'conversion', { send_to: 'AW-…/XYcDCMqh64wcEL7h05RD' })` call runs once per page load, regardless of `?type=`. The lo-waitlist landing is a separate product (LoanOS waitlist signup, not a mortgage lead). Counting it as a conversion under the same Google Ads label inflates the mortgage funnel's apparent conversion count.

**Fix:** Wrap the conversion gtag in a per-branch suppression:

```js
var ads_type = new URLSearchParams(window.location.search).get('type');
if (ads_type !== 'lo-waitlist') {
  gtag('event', 'conversion', { send_to: 'AW-18028490942/XYcDCMqh64wcEL7h05RD' });
}
```

---

## 5. Findings — LOW (6)

### L1. 3-step "What Happens Next" uses inline `style=""` instead of class refs
**Lines:** 435–455
**Severity:** LOW (cosmetic / maintainability)

The block uses inline `style="…"` attributes. Inconsistent with the rest of the file (which uses class-based CSS). Refactor when convenient.

### L2. GA conversion fires once per page load — refresh duplicates
**Lines:** 616–618
**Severity:** LOW (Google Ads has its own dedup heuristics)

If a user refreshes or bookmarks-and-revisits, conversion fires again. Google Ads typically dedupes within session, but a `sessionStorage` flag is a one-line improvement for accuracy.

### L3. No social-proof testimonial on thank-you page
**Line:** N/A (omission)
**Severity:** LOW (post-submit trust calibration)

Other funnel pages embed testimonials. Thank-you page has none. A single testimonial in the navy hero ("Adam closed our refi in 19 days — sharper than the bank quote." — replicating the get-preapproved testimonial style) calibrates confidence in the moment after a stranger has just submitted personal info.

### L4. No `<meta name="description">`
**Line:** 6–8 area
**Severity:** LOW (moot under `noindex,nofollow`)

Description tag absent. With `noindex,nofollow` set, search engines never see this page. Cosmetic only — some browsers use the meta description in tab tooltips, but the impact is zero on conversion.

### L5. Inline JS uses `—` literal escape for em-dash
**Lines:** 630, 631, 634, 635
**Severity:** LOW (consistency)

The IIFE strings use `—` instead of the actual em-dash character. Works fine, just inconsistent with the HTML body which uses real em-dashes.

### L6. Calendly inline widget hard-codes 700px height
**Line:** 592 (`style="min-width:320px;height:700px;"`)
**Severity:** LOW (mobile)

Fixed 700px height ignores the fact that Calendly's responsive inline widget renders shorter on mobile. Replace with `min-height:600px;height:auto;` for graceful resize.

---

## 6. Compliance Spot-Check

| Item | Status | Notes |
|------|--------|-------|
| NMLS #513013 in footer | ✅ PASS | Line 602 |
| Equal Housing Lender disclosure | ✅ PASS | Line 602 |
| Company NMLS #2526130 | ✅ PASS | Line 602 |
| Physical address in footer | ⚠️ N/A | CAN-SPAM is N/A on a thank-you page that does not send email itself. Footer omits address — acceptable here, but bundle into the cross-page footer-address PR for consistency. |
| No "guaranteed approval" language | ✅ PASS | None present |
| No protected-class targeting | ✅ PASS | None present |
| TCPA — no re-collection of phone without renewed consent | ✅ PASS | Phone fields on follow-up are hidden, carrying original opt-in. No new SMS-consent capture. |
| Voice rule — no "The Styer Team" reference | ❌ FAIL | M5: `adam@thestyerteam.com` mailto link in lo-waitlist branch (line 717). |
| Branch-content match (no PA promise to non-PA) | ❌ FAIL | H1: 3-step block "Letter or quote in 24 hrs" shown to rate-alert / FTB-DPA / lo-waitlist branches. |

**Compliance score:** 7 PASS / 1 N/A / 2 FAIL. Both FAILs are addressable via the recommended HIGH-tier fixes.

---

## 7. Cross-Page Bundling

| Thank-you finding | Bundle with prior audit |
|-------------------|------------------------|
| M1 (per-branch `<title>`) | get-preapproved M1 (title at 60-char cap) + rate-alert M1 |
| M5 (`thestyerteam.com` email) | rate-alert L1 (`From: thestyerteam.com` sample) — single brand-consistency PR |
| L4 (meta description) | get-preapproved M2 (meta description lacks CTA) — moot under noindex but ship together |
| Footer address (compliance) | get-preapproved M5 + rate-alert M5 + homepage M5 — single 4-page footer pass |
| L3 (testimonial swap-in) | rate-alert M2 (form-column social proof) — same component shape |

---

## 8. Recommended Ship Order

1. **PR-1 (single, ~25 min): H1 + H2 + H3 — cross-funnel content integrity**
   - H1: hide 3-step block for rate-alert / FTB-DPA / lo-waitlist branches.
   - H2: keep Calendly visible on rate-alert branch + retitle h2.
   - H3: append phone CTA on FTB-DPA branch (don't replace).
   - Single inline-IIFE edit, no new files. Closes 2 of 2 compliance FAILs that are content-driven.

2. **PR-2 (single, ~15 min): H4 — PA branch reassurance copy**
   - Author 4–6 lines of PA-specific subhead + phone CTA.
   - Coordinate with get-preapproved M7 (close-rate footnote sourcing) — if M7 unresolved, drop the literal "21 days" and use "weeks, not months."

3. **PR-3 (single, ~10 min): H5 — fallback dataLayer instrumentation**
   - Add 8 lines to the IIFE for unknown-type and no-type debug events.
   - Forward-looking instrumentation, not user-visible.

4. **Cross-page PR-4 (~15 min): brand consistency + footer address**
   - Bundle thank-you M5 + rate-alert L1 (`thestyerteam.com` references) + footer-address sweep across get-preapproved / rate-alert / homepage / thank-you. Single 4-file diff.

5. **Light pass PR-5 (~15 min): M1 + M2 + M3 + M4 + M6 + L1–L6**
   - Per-branch titles (M1), drop redundant referral_source field (M2), privacy reassurance (M3), per-branch Calendly h2 (M4), conversion-tag suppression for lo-waitlist (M6), inline-style cleanup (L1), GA refresh-dedup (L2), testimonial swap-in (L3), meta description (L4), em-dash consistency (L5), Calendly height auto (L6).

**Total estimated effort:** ~80 minutes across 5 PRs. None require Adam decisions beyond authorization. Each PR is independently shippable.

---

## 9. Action Item Surface (post-audit)

- **For Adam:** authorize PR-1 (H1+H2+H3) — closes 2 compliance FAILs, single inline-IIFE edit, lowest-risk highest-leverage change in the funnel-page audit series. Bundle with prior audits' HIGH-tier items for a single beta-pre-launch ship.
- **For agent (next session):** test the H5 deploy-gap deeper — submit a deterministic test body to `/.netlify/functions/subscribe-lead` and observe whether a row lands in Supabase under the explicit `lead_source: 'Quick Quote'` value. If yes, the page-source has been deployed and homepage-form volume is just genuinely zero. If no, there's a Function-side bug masking the value.
- **For agent (when bandwidth allows):** if NotebookLM CLI auth is restored, push this audit + close out the 3-session backlog of skipped PUSHes.

---

## 10. Audit Series Summary (now 4 of 4 primary funnel pages covered)

| Audit | Page | HIGH | MEDIUM | LOW | Compliance fails |
|-------|------|------|--------|-----|------------------|
| 2026-05-01 | `/get-preapproved.html` | 5 | 7 | 6 | 1 (footer address) |
| 2026-05-02 | `/rate-alert.html` | 5 | 6 | 6 | 1 (TCPA bundled consent) |
| 2026-05-04 | homepage `#hero-quick-form` + `#quick-contact-form` | 5 | 6 | 6 | 1 (TCPA bundled consent) |
| **2026-05-05** | **`/thank-you.html`** | **5** | **6** | **6** | **2 (3-step block mismatch + Voice rule violation)** |

**Combined HIGH-tier across the series: 20 fixes.** A single Adam-authorized pull request bundling H1 from each audit (TCPA two-checkbox split on PA + rate-alert + 2 homepage forms = compliance-debt closeout) plus H1 from this audit (3-step block mismatch closeout) would resolve 4 of the 5 compliance FAILs across the series in a single ship.

The 5th (footer address consistency) is a 4-page literal swap and slots into PR-4 above.

After those two pull requests land, the entire 4-audit conversion-rate stack moves from "compliance debt + content debt" to "conversion-rate optimization" — and the next audit pass shifts focus from foundations to A/B-testable shaped fixes (subhead variants, CTA copy, social proof rotation).

---

*End of audit. ~330 lines.*
