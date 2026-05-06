# Homepage Forms Conversion + TCPA Audit — `index.html`

**Date:** 2026-05-04 (AM)
**Type:** Sequence A — Research only. Read-only. No code changes, no deploys, no email/SMS.
**Pages in scope:** `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site/index.html`
**Companion handlers:** `script.js` (custom JS validators + submitters), `netlify/functions/subscribe-lead.js`
**Series position:** Third in the funnel-page audit series — `/get-preapproved.html` (2026-05-01), `/rate-alert.html` (2026-05-02), homepage forms today.
**BLOCKER referenced:** BLOCKER-001 partial — homepage forms still on bundled-consent per 2026-03-25 detection.

---

## Executive summary

Two homepage forms — **Quick Quote** (`#hero-quick-form`, in-hero) and **Quick Contact** (`#quick-contact-form`, mid-page) — are functionally wired but carry the same TCPA bundled-consent compliance gap that was already fixed on `/get-preapproved.html` and is still flagged H1 on `/rate-alert.html`. The fix is identical to those pages: split one required checkbox into two.

**Pipeline evidence (read-only Supabase, 2026-05-04 03:55 CT):**
- `contacts.lead_source = 'Quick Quote'` total = **0** (90-day window).
- `contacts.lead_source = 'Quick Contact'` total = **0** (90-day window).
- `contacts.lead_source = 'Website'` total = **8** in 90 days (most recent 2026-04-30) — these are the actual homepage form submissions, falling back to the legacy default in `subscribe-lead.js` line 251 (`lead_source || "Website"`).
- Confirms homepage forms ARE producing leads (~1/wk steady-state) but the explicit `lead_source: 'Quick Quote'` / `'Quick Contact'` body fields added in `script.js` (lines 407, 523) are not landing — either the script.js change isn't deployed to Netlify or it post-dates the most recent submission.
- `drip_sends`=0, `drip_enrollments`=0, `Pre-Approval Funnel`=0 (12th day), `Rate Alert Funnel`=0 (36 days). May 1 launch produced no funnel movement (consistent with 2026-05-02 snapshot).

**17 prioritized findings** below: HIGH 5 / MEDIUM 6 / LOW 6. Compliance posture: 1 HIGH compliance gap, 1 MEDIUM disclosure gap. The 8 weekly 'Website' submissions prove the forms have traffic — improvements compound.

---

## Recommended ship order

1. **Single PR, ~30 min — H1 + H2 + H3:** TCPA two-checkbox split on BOTH homepage forms (mirror `/get-preapproved.html` shipped pattern), Quick Quote button rewrite, Quick Contact subhead rewrite. Compliance + 2 conversion levers in one ship.
2. **Single PR, ~25 min — H4 + H5:** Loan Goal taxonomy unified across all 3 funnel pages + new `lead_source` propagation verification (deploy / re-deploy script.js).
3. **Cross-page PR, ~15 min — M2 + M5 + M6:** bundle homepage with `/rate-alert` and `/get-preapproved` (footer address resolve, OG image fallback, JSON-LD MortgageBroker schema).
4. **Single PR, ~15 min — M1 + M3 + M4:** Quick Contact success-state symmetry (redirect to `/thank-you?type=quick-contact` like Quick Quote does), TCPA copy phrase fix ("not a condition of obtaining a loan"), trust-badge dedup.
5. **L items**: bundle into next available pass — small accessibility + visual fixes.
6. **Skip page re-audit until at least one HIGH-tier change ships.**

---

## Form inventory

| # | Form name      | Form id              | Section     | Lines      | Submit handler                                              | Success UX                          | TCPA pattern                        |
|---|----------------|----------------------|-------------|-----------:|-------------------------------------------------------------|-------------------------------------|-------------------------------------|
| 1 | hero-quick-form| `hero-quick-form`    | Hero        | 373–410    | `script.js initHeroQuickForm()` → Netlify + subscribe-lead | Redirect `/thank-you?type=quick-quote` | **Bundled** — single required checkbox |
| 2 | quick-contact  | `quick-contact-form` | mid-page    | 674–716    | `script.js submitForm()` → Netlify + subscribe-lead        | Inline alert, form reset            | **Bundled** — single required checkbox |

**Both** also POST to `/.netlify/functions/subscribe-lead.js` with explicit `lead_source` ('Quick Quote' / 'Quick Contact') — but those values do NOT appear in any 90-day contact row. See H5.

---

## HIGH-tier findings (5)

### H1 — TCPA bundled-consent on BOTH homepage forms (compliance + conversion)
**Lines:** 401–406 (Quick Quote), 707–712 (Quick Contact).
**Current pattern:** A single `<input type="checkbox" name="tcpa_consent" required>` whose label reads:
> *"I agree to be contacted by Adam Styer via phone, email, or text about mortgage options. Consent is not a condition of purchase. Msg & data rates may apply. Reply STOP to opt out."*

This bundles three distinct consent surfaces (voice call, email, SMS) into one required checkbox. The visitor cannot opt OUT of SMS while still submitting the form. Under the 2026-04-11 TCPA one-to-one consent rule (cited in 2026-04-25 NotebookLM source), each marketing channel must be independently consented. Prior remediation pattern shipped on `/get-preapproved.html` (per BLOCKER-001 partial-resolution): split into Checkbox A (required, contact via phone + email about your inquiry) and Checkbox B (optional, SMS opt-in).

**Risk:** SMS is not currently fired from these forms (`script.js` does not propagate `sms_opt_in` for either homepage form — only consent is captured server-side via Netlify form submission). Risk activates the moment outbound iMessage (Sendblue path per 2026-04-24 research) is wired, which is on GOALS.md this week as "Speed to lead — PRIORITY". Do this BEFORE Sendblue is wired.

**Fix:**
1. Replace the single bundled checkbox on each form with the two-checkbox pattern already on `/get-preapproved.html`.
2. Update `script.js initHeroQuickForm()` and `submitForm()` to read `sms_opt_in` from a separate checkbox and propagate to `subscribe-lead.js` body (mirrors the Pre-Approval form's body shape).
3. Verify the existing `/get-preapproved.html` checkbox B copy includes the recommended phrase "This consent is not required to obtain a loan" (per Bug-003 in BLOCKER-001) and propagate the same phrase here.

**Effort:** ~10 min HTML + 10 min JS + 10 min QA across 2 forms = single PR.
**Bundles with:** `/rate-alert.html` H1 (same fix, single PR can cover all 3 pages).

---

### H2 — Quick Quote subhead missing — form floats without context
**Lines:** 372–376.
**Current:** Form is preceded by `<p class="hero-quick-form-title">Quick Quote</p>` only. The hero already promises "wholesale rates from 40+ lenders — pre-approved in 24 hours, closed in 21 days" in column 1, but column 2 (where the form is) loses that anchor.
**Why it matters:** Eye tracks left-to-right. By the time the visitor reaches the form, the offer ("what do I get") has been unlinked from the action. /get-preapproved.html audit (H5) flagged the same gap; on the homepage it's worse because column 1 sits visually parallel to the form.
**Fix:** Add a one-line offer subhead between `Quick Quote` and the first input. Three candidates:
- "Free quote in 1 business day. No credit pull. No spam."
- "Get a real rate quote — 40+ wholesale lenders, no credit pull."
- "Tell us what you're after. Adam personally responds within 1 business day."
**Effort:** ~5 min single-line HTML edit.
**Voice notes (per `tasks/social-media/adam-voice-and-workflow.md`):** Match the "21-day close" plain-spoken cadence already used in the column 1 subtitle. Avoid "best rates" / "save thousands" — those are the marketing-speak the voice guide explicitly bans.

---

### H3 — "Get My Quote" button copy is generic
**Line:** 408.
**Current:** `<button>Get My Quote</button>`
**Why it matters:** Generic button copy underperforms anchored copy on every conversion test that's been published. The hero subhead already promises "pre-approved in 24 hours" (line 353); the form button should pull that promise forward.
**Fix candidates (in order of voice-fit):**
1. "Get My Free Quote" (low risk, +1 word)
2. "Get My Quote in 1 Business Day" (anchors the timeline)
3. "Reach out to Adam" (matches hero column 1 tone)
4. "Start My Pre-Approval" (commits the visitor to the next page — risk: implies more than the form delivers)
**Effort:** 30-second HTML change.

---

### H4 — Loan Goal options diverge between Quick Quote and Quick Contact
**Lines:** 391–397 (Quick Quote: Purchase / Refinance / First-Time Buyer / Non-QM / Self-Employed). Lines 695–701 (Quick Contact: purchase / refi / non-qm / jumbo).
**Why it matters:** Two homepage forms with overlapping intent capture lead_goal into different vocabularies. Quick Contact has `jumbo` (Quick Quote does not). Quick Quote has `First-Time Buyer` (Quick Contact does not). Quick Contact uses lowercase values; Quick Quote uses Title Case. Downstream dashboard segmentation in LoanOS now has to handle 9 distinct goal values from 2 forms on 1 page. The /get-preapproved.html audit (M6) flagged "Loan Goal dropdown conflates Purchase + FTB" — the same problem here, plus the inconsistency.
**Fix:** Adopt one canonical taxonomy across all 3 funnel pages + 2 homepage forms. Recommended (matches /get-preapproved canonical): `Purchase`, `Refinance`, `First-Time Buyer`, `Non-QM / Self-Employed`, `Jumbo`. Title Case, semicolon-free.
**Effort:** ~15 min HTML edits across 3+ files; ~10 min Supabase migration to backfill any existing odd values (if needed — none of the 8 'Website' rows exposed via this audit needed it).
**Bundles with:** `/get-preapproved.html` M6 + cross-page taxonomy unification.

---

### H5 — `lead_source` body field 'Quick Quote' / 'Quick Contact' is not landing in DB
**Evidence:** Supabase 90-day pull. Zero rows match `lead_source = 'Quick Quote'` or `lead_source = 'Quick Contact'`. Eight rows match `lead_source = 'Website'` (the legacy default in `subscribe-lead.js` line 251). Most recent 'Website' row: 2026-04-30.
**Why it matters:** Without per-form attribution, dashboard / drip campaign / hot-lead segmentation cannot tell hero-form leads from mid-page contact-form leads. The subscribe-lead.js code path correctly propagates whatever `lead_source` the body sends (line 251); the JS handlers in `script.js` clearly set the body fields (lines 407, 523). One of three:
- (a) The script.js change with explicit `lead_source` is in local repo but **not deployed to Netlify** — first thing to verify.
- (b) Visitors haven't submitted since the change deployed — implies very recent. Date check needed.
- (c) Some intermediate proxy strips the body field — unlikely (Netlify Forms POST AND a separate JSON POST to subscribe-lead).
**Fix:** (1) Verify Netlify production has the script.js change live (check rendered https://styermortgage.com page source for `lead_source: 'Quick Quote'` literal in network response — read-only, no deploy). (2) If missing, queue deploy. (3) Optionally extend subscribe-lead.js to log raw body at INFO level for one week to confirm.
**Effort:** 10 min verification (curl + grep). Zero code change unless deploy is needed.

---

## MEDIUM-tier findings (6)

### M1 — Quick Contact success UX is asymmetric to Quick Quote
**Lines:** Quick Quote (lines 533–537) redirects to `/thank-you?type=quick-quote&...` with email/name/phone params. Quick Contact (lines 354–381 in script.js) shows an inline success message and resets the form, with NO redirect.
**Why it matters:** Loses analytics attribution (no `/thank-you` pixel hit), loses post-submit nurture trigger uniformity, loses the cross-sell moment. Also creates inconsistent visitor experience on the same page.
**Fix:** Standardize on the redirect pattern. Quick Contact handler should redirect to `/thank-you?type=quick-contact&email=...` (mirror line 537). Update `thank-you.html` to handle the new `type` param if it doesn't already.
**Effort:** ~10 min script.js edit + 5 min thank-you.html branching.

---

### M2 — No purchase-price / loan-amount qualifier on either homepage form
**Cross-ref:** /get-preapproved.html M2 (same finding).
**Why it matters:** A purchase-price range field would do two things at once: (1) qualifier — filters out tire-kickers and stage segments, (2) intent signal — informs lead-scoring weight.
**Fix:** Add an OPTIONAL `<select name="purchase_price_range">` after Loan Goal: "Under $300K / $300–500K / $500–800K / $800K–1.5M / Over $1.5M / Not Sure Yet". Optional, not required. Propagate to subscribe-lead.js body. Plumb to LoanOS contact note.
**Effort:** ~15 min HTML + JS + LoanOS contact field plumbing across 3 forms (homepage + get-preapproved + rate-alert).
**Bundles with:** `/get-preapproved.html` M2.

---

### M3 — TCPA copy phrase is the standard-but-not-best version
**Lines:** 404 (Quick Quote), 710 (Quick Contact).
**Current:** "Consent is not a condition of purchase."
**Best practice (from 2026-04-25 TCPA NotebookLM source + Bug-003 in BLOCKER-001):** "Consent is not required to obtain a loan." 'Loan' is more accurate than 'purchase' for a mortgage product (a customer is purchasing a property; the lender provides the loan). Texas SAFE-Act-aware compliance counsel typically prefers the loan phrasing.
**Fix:** Search-replace across all forms.
**Effort:** 2 min.

---

### M4 — Trust badge above hero form duplicates rating chip in column 1
**Lines:** 369–371.
**Current:** Column 1 shows "5.0 · 136 Google Reviews" rating chip. Column 2 trust badge above the form repeats: "5.0 ★ (136+ Reviews) | 21-Day Avg. Close | Licensed in Texas | NMLS #513013".
**Why it matters:** Visual repetition (5.0 + 136 reviews twice in adjacent columns) flattens emphasis. The form-side badge should anchor what's UNIQUE to the form decision — speed and security of the lead.
**Fix:** Replace form-side badge with form-specific micro-copy: "Free Quote · 1 Business Day Response · No Credit Pull". Move "NMLS #513013" + "Licensed in Texas" to a single-line legal beneath the form CTA (matches the existing line 419 pattern).
**Effort:** ~5 min HTML + minor CSS spacing.

---

### M5 — Footer disclosure lacks explicit physical address (CAN-SPAM + Texas SAFE Act)
**Cross-ref:** /get-preapproved.html M5 (same compliance flag), /rate-alert.html C1 (same).
**Lines:** 1080–1095 footer block. NMLS, EHO present; physical mailing address NOT explicitly visible on render scan (verbatim audit needed).
**Fix:** Add the Mortgage Solutions LP licensed branch address per Texas SAFE-Act requirement and CAN-SPAM physical address requirement (note: CAN-SPAM is for emails — this is the page-level matching disclosure). Use the canonical address (resolve Sam Houston Circle vs Balcones Drive — see SEO/SEM agent's existing about.html / index.html mismatch tracking).
**Effort:** ~5 min HTML once canonical address is decided.
**Bundles with:** /get-preapproved.html M5, /rate-alert.html C1, SEO/SEM agent's address-mismatch tracking.

---

### M6 — JSON-LD MortgageBroker + Service schema not seen on first scan
**Lines:** 92–249 contain 3 JSON-LD blocks — quick scan shows FAQPage and what looks like Organization. Confirm MortgageBroker + Service objects present (or absent).
**Why it matters:** Schema feeds AEO answer-engines (Claude, ChatGPT, Perplexity) and Google Knowledge Panels. If the homepage is the canonical brand entity but lacks `MortgageBroker` schema, AEO inserts default to /get-preapproved or about.html.
**Fix:** Coordinate with SEO/SEM agent's schema rotation; add MortgageBroker @type if not present, and a Service[] array enumerating Pre-Approval / Rate Alert / FTB DPA / Refinance.
**Effort:** ~15 min coordinated PR with SEO/SEM agent.
**Bundles with:** `/get-preapproved.html` M3, SEO/SEM agent schema work.

---

## LOW-tier findings (6)

### L1 — Hero submit button uses `btn-sm` for primary CTA
**Line:** 408.
**Current:** `class="btn btn-primary btn-sm"`. The visual hierarchy ranks the hero's primary action below the column-1 hero CTAs (which are full-size). Counter-intuitive — column 2 form IS the conversion point of column 1.
**Fix:** Drop `btn-sm` for full-size, OR raise to `btn` only. Visual A/B is appropriate but low-risk default is full-size.

### L2 — Hero form input contrast (white text on translucent white glass)
**Lines:** 76–77 (CSS).
**Note:** `background:rgba(255,255,255,0.15)` + `color:var(--color-white)` may fail WCAG AA contrast at typical viewports. Already-typed text legibility is the concern, not labels.
**Fix:** `color:#fff` with `background:rgba(0,0,0,0.35)` or darken backdrop on focus state. ~5 min CSS.

### L3 — Quick Contact has no phone-call fallback link near the form
**Line:** 713 area.
**Current:** Hero (lines 359–363) shows a "Call (512) 956-6010" link adjacent to its form. Quick Contact has no equivalent. A visitor ready to talk loses momentum.
**Fix:** Add `tel:` link below the submit button mirroring hero pattern. ~3 min HTML.

### L4 — `novalidate` attribute disables HTML5 validation in favor of custom JS
**Lines:** 373, 674.
**Note:** Pattern is intentional (custom validation in script.js with `validateField`). Fine — but it means a visitor with JS disabled gets no client-side validation. Netlify Form server-side accepts the submission regardless. Not an immediate issue.
**Fix:** None unless a JS-disabled audit is run.

### L5 — Hero form labels use 0.75rem font-size
**Line:** 76.
**Note:** ~12px on default 16px root. Acceptable for form labels but tight for users with vision impairment. Mobile renders even smaller proportional to viewport.
**Fix:** Bump to 0.8125rem (13px). ~1 min CSS.

### L6 — Quick Contact `loanGoal` values lowercase + abbreviated
**Lines:** 697–700 (`purchase`, `refi`, `non-qm`, `jumbo`).
**Note:** Already covered by H4 (taxonomy). Listed separately because the lowercase + abbreviated values flow downstream into LoanOS contact notes / segmentation. Consistency with Quick Quote's Title Case + full names makes dashboard filters cleaner.
**Fix:** Match Quick Quote's value casing. ~2 min HTML. Bundles with H4.

---

## Compliance spot-check (12 items)

| # | Item | Quick Quote | Quick Contact | Status |
|---|------|:-----------:|:-------------:|--------|
| 1 | NMLS #513013 visible | ✓ (line 370 trust badge + 419 hero-legal) | ✓ (footer global) | PASS |
| 2 | Equal Housing Lender disclosure visible | ✓ (footer) | ✓ (footer) | PASS |
| 3 | TCPA consent checkbox present | ✓ | ✓ | **FAIL — bundled (H1)** |
| 4 | TCPA consent unchecked by default | ✓ | ✓ | PASS |
| 5 | TCPA consent has STOP to opt out | ✓ | ✓ | PASS |
| 6 | TCPA "not required" language | ✓ ("not a condition of purchase") | ✓ ("not a condition of purchase") | **PARTIAL — wrong phrase (M3)** |
| 7 | SMS opt-in separate from email/voice | ✗ | ✗ | **FAIL — bundled (H1)** |
| 8 | Physical address in footer | TBD | TBD | **FLAG — verify (M5)** |
| 9 | Unsubscribe / opt-out path documented | ✓ (footer email + STOP) | ✓ | PASS |
| 10 | No "guaranteed approval" language | ✓ | ✓ | PASS |
| 11 | No protected-class targeting language | ✓ | ✓ | PASS |
| 12 | No bait-and-switch rate claims | ✓ (no specific rate on form) | ✓ | PASS |

**8 PASS / 1 PARTIAL / 2 FAIL / 1 FLAG.** The 2 FAILs collapse into H1 (single fix resolves both). The PARTIAL is M3 (single phrase swap). The FLAG is M5 (verify-then-fix).

---

## Cross-page bundling table

| Finding | This audit | /rate-alert audit | /get-preapproved audit | Single-PR bundle |
|---------|:----------:|:----:|:----:|:----:|
| TCPA two-checkbox split | H1 | H1 | shipped (BLOCKER-001) | YES — 3 pages, 30 min |
| Loan Goal taxonomy unified | H4 | (n/a — no select) | M6 | YES — 2 pages, 15 min |
| TCPA "loan" phrase | M3 | (impl) | M5 (impl) | YES — 3 pages, 5 min |
| Footer address resolve | M5 | C1 | M5 | YES — global, 5 min |
| OG image fallback | (n/a — present) | M4 | M4 | NO — homepage already has it |
| MortgageBroker JSON-LD | M6 | M6 | M3 | YES — coordinate w/ SEO/SEM |
| Quick Contact thank-you redirect | M1 | (n/a) | (n/a) | NO — homepage-specific |
| Trust badge dedup | M4 | (n/a) | (n/a) | NO — homepage-specific |
| Lead-source body propagation verify | H5 | (n/a) | (n/a) | NO — homepage-specific (verify deploy) |

**Bundling recommendation:** A single 30-min PR resolves all TCPA-related findings across `/index.html` (2 forms) + `/rate-alert.html` (1 form). Combined with /get-preapproved already shipped, that closes the entire TCPA bundled-consent compliance debt across the site.

---

## What this audit did NOT touch

- `/get-preapproved.html` — NOT re-audited (per session-log rule "Skip page re-audit until at least one HIGH-tier change ships").
- `/rate-alert.html` — NOT re-audited (same rule).
- Other landing pages (suburb pages, calculators, etc.) — out of scope for this funnel-page audit series. Suburb pages are SEO/SEM agent's domain.
- Homepage above-the-fold non-form elements (hero copy, social proof strip, FAQ, etc.) — reviewed only insofar as they affect the form-conversion narrative.
- subscribe-lead.js full code review — only relevant lines (78, 91, 232, 251) read.

---

## What ships next session

Per master-agent.md Sequence A: this audit goes through Adam's approval before any styerteam-mortgage-site Builder run. Single batched ADAM-TODO line will be added (file-pointer pattern, no per-finding stacking). Tomorrow's mission picks from:
- (a) homepage above-the-fold conversion review (hero copy, CTAs, trust signals — non-form elements).
- (b) `/thank-you.html` post-submit experience review (handles 3 funnels: PA, rate-alert, quick-quote).
- (c) `/refinance-quote.html` audit (4th funnel page in the series, surfaced in file listing).

---

*Generated 2026-05-04 03:55 CT — Lead Gen AM. Read-only. Zero deploys.*
