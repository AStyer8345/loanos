# PR-5 — Final Light-Pass — All Remaining M+L Tier Across 4 Audits

**Author:** Lead-Gen agent (autonomous AM session 2026-05-10)
**Status:** DRAFT — awaiting Adam authorize
**Repo:** `styerteam-mortgage-site` (Netlify-deployed)
**Estimated ship time:** 60 min Builder + 10 min Adam review
**Sequencing:** Designed to apply LAST after PR-1 → PR-2 → PR-3 → PR-4. Rebase-safe in any order via different line ranges (sequencing matrix in § 7).

---

## § 0 — Why This Exists

PR-1 (compliance) + PR-2 (conversion) + PR-3 (thank-you) + PR-4 (cross-page brand+footer) closed every HIGH-tier finding and most MEDIUM-tier findings across the 4-audit pile (`2026-05-01-get-preapproved-conversion-audit.md`, `2026-05-02-rate-alert-conversion-audit.md`, `2026-05-04-homepage-forms-conversion-audit.md`, `2026-05-05-thank-you-page-audit.md`).

PR-5 closes everything remaining: **6 distinct edit clusters** spanning ~15 individual M-tier and L-tier polish items + 5 cross-cutting bundles + the loans-closed fallback social-proof piece (PR-2b-3 graduated). Items rolled up to keep the diff digestible. Once PR-5 ships, the agent has nothing left to consolidate from the 4-audit pile.

**What's intentionally NOT in PR-5** (see § 8 Out-of-Scope): items that need Adam-supplied data but no acceptable fallback exists (PR-2b-1 review chip, PR-2b-2 named testimonials, 21-day footnote sourcing if Adam can't confirm) — those stay deferred as PR-5b inline shipments when data lands. Polish features at the cost-bar of "could be its own PR" (sticky mobile phone CTA, full FAQ section + FAQPage schema, Mailcheck.js across all forms) — those defer to PR-6 if A/B data justifies.

---

## § 1 — Goals

1. **Close cross-page Loan Goal taxonomy debt** (3 files: `index.html` × 2 forms + `get-preapproved.html` + downstream `script.js` `TAG_MAP`). Single canonical taxonomy across all funnel surfaces.
2. **Add per-page meta description + per-branch `<title>`** updates (`get-preapproved.html` + `thank-you.html`).
3. **Add MortgageBroker + Service JSON-LD** to `get-preapproved.html` and `rate-alert.html`. Verify homepage MortgageBroker (PR-4 already touched it — confirm Service[] coverage).
4. **Add OG image + twitter:card** to `get-preapproved.html` and `rate-alert.html`. Logo-only fallback (selfies blocked by BLOCKER-LOANOS-001).
5. **Sourcing footnote** on the "21-day average close" claim (`get-preapproved.html` line 327 + `rate-alert.html` line 508). Default ships "(2026 closings)" appended; if Adam confirms 21-day data is real, can retroactively swap PR-3 thank-you "weeks, not months" → literal in same Builder pass.
6. **Quick Contact handler symmetry** — make Quick Contact redirect to `/thank-you?type=quick-contact&email=…` instead of inline success (`script.js` lines 354–381). Coordinate with thank-you per-branch title work.
7. **Trust badge dedup on hero form** (`index.html` lines 369–371) — replace with form-specific micro-copy.
8. **CSS contrast + sizing fixes on hero form** (`index.html` lines 76–77 — input contrast; lines 76 — label sizing 0.75rem → 0.8125rem).
9. **Quick Contact submit button parity** with Quick Quote (drop `btn-sm` per L1; verify post-PR-2 state).
10. **Quick Contact `tel:` link** mirror of hero pattern (line ~713).
11. **Promote "Adam handles your file directly" proof** to grid above the form on `get-preapproved.html`.
12. **"Takes about 60 seconds" microcopy** above get-preapproved form.
13. **Thank-you page polish bundle** — privacy reassurance line on quick-quote follow-up form (M3); drop redundant `referral_source` field (M2); per-branch `document.title` in IIFE (M1); per-branch Calendly h2 (M4); inline-style refactor (L1) DEFERRED; em-dash literal cleanup (L5); Calendly `height:auto` (L6); GA `sessionStorage` dedup flag bundled with PR-4 § 3.6 (L2); thank-you `<meta name="description">` no-op (L4 cosmetic-only).
14. **Rate-alert page polish bundle** — form-tagline microcopy (M2 frequency anchor); rate-move alert language softened (M3 Option A); "Average days to close" → "Avg days to close" (L2 consistency); tertiary "Start your pre-approval →" cross-sell CTA (L3); mobile form-card `order: -1` removal (L6 A/B candidate).
15. **Rate-alert form social proof** — graduated PR-2b-3 with loans-closed fallback default ("1,000+ loans closed since 2017").

---

## § 2 — Files Touched (4 HTML + 1 JS, plus optional lead-intake.js taxonomy passthrough)

| File | Edit count | Risk | Notes |
|------|-----------:|------|------|
| `get-preapproved.html` | ~12 diffs | LOW | Title (M1), meta description (M2), JSON-LD (M3), OG + twitter:card (M4), Loan Goal taxonomy (M6), 21-day footnote (M7), promote Adam-handles proof to grid (L1), 60-sec microcopy (L2), reviews link to GBP (L5 deferred — pairs with PR-2b-1) |
| `rate-alert.html` | ~10 diffs | LOW | M1 (Mailcheck — DEFERRED to PR-6 cross-form scope), M2 (form-tagline), M3 (rate-move language), M4 (21-day footnote), M5 (OG image), M6 (JSON-LD), M7 form social-proof loans-closed fallback, L2 (Avg days), L3 (cross-sell CTA), L6 (mobile order remove — A/B optional) |
| `index.html` | ~6 diffs | LOW | M2 (purchase-price field on both homepage forms — reuse PR-2 pattern), M4 (trust badge dedup), M6 (verify MortgageBroker Service[] enumeration), L1 (`btn-sm` removal — verify post-PR-2), L2 (input contrast), L3 (Quick Contact tel: link), L5 (label sizing 0.75rem → 0.8125rem), L6 (Quick Contact loanGoal value casing — closes via Cross-cut A) |
| `thank-you.html` | ~7 diffs | LOW | M1 (per-branch `document.title`), M2 (drop `referral_source` from follow-up form), M3 (privacy reassurance line on follow-up), M4 (per-branch Calendly h2 — overlaps PR-3 § 3.1 for rate-alert), L4 (note-only — no edit), L5 (em-dash literal cleanup), L6 (Calendly `height:auto`), L2 (GA `sessionStorage` dedup — bundle with PR-4 § 3.6) |
| `script.js` | ~4 diffs | LOW | Quick Contact handler redirect (M1 thank-you bundling), `TAG_MAP` taxonomy update (Cross-cut A), `purchase_price_range` propagation on both homepage forms (M2 cross-page) |
| `netlify/functions/subscribe-lead.js` | ~1 diff | LOW | Pass through `purchase_price_range` to Mailchimp + LoanOS body (mirrors PR-2 lead-intake.js change for get-preapproved) |
| `netlify/functions/lead-intake.js` | 0 diffs (verify) | NONE | PR-2 already plumbed `purchase_price_range`. Verify on Builder run that the field flows from homepage forms to LoanOS contact metadata. |

**Total file footprint:** 6 source files. **Total atomic diffs:** ~40 small edits clustered into 6 conceptual groups (§ 3.1–§ 3.6 below).

---

## § 3 — Diffs

### § 3.1 — Cross-cut A: Loan Goal Taxonomy Unified Across All Funnel Surfaces

**Files touched:** `get-preapproved.html` lines 376–382, `index.html` Quick Quote lines 391–397, `index.html` Quick Contact lines 695–701, `script.js` `TAG_MAP`.

**Decision required from Adam (§ 6.1):** Pick canonical taxonomy variant — **Variant A (audit-default)** = `Purchase / Refinance / First-Time Buyer / Non-QM / Self-Employed / Jumbo` (Title Case, semicolon-free, splits FTB as separate); **Variant B (M6 wording)** = "I'm buying my first home / I'm buying a home (not my first) / I want to refinance / I want an investment property (DSCR)" (lower-cognitive-load wording, FTB merged into purchase variants).

**Default ships Variant A** (closer to current taxonomy, lower migration risk). If Adam picks B, PR-5 swaps option text only — value attributes still map to canonical `purchase` / `purchase-ftb` / `refinance` / `non-qm` / `jumbo` / `investor` slugs.

**`get-preapproved.html` lines 376–382 (current):**
```html
<select name="loan_goal" required>
  <option value="">Choose…</option>
  <option value="Purchase">Purchase</option>
  <option value="Refinance">Refinance</option>
  <option value="First-Time Buyer">First-Time Buyer</option>
  <option value="DSCR/Investor">DSCR / Investor</option>
</select>
```

**`get-preapproved.html` lines 376–382 (proposed Variant A):**
```html
<select name="loan_goal" required>
  <option value="">Choose…</option>
  <option value="Purchase">Purchase</option>
  <option value="Refinance">Refinance</option>
  <option value="First-Time Buyer">First-Time Buyer</option>
  <option value="Non-QM / Self-Employed">Non-QM / Self-Employed</option>
  <option value="Jumbo">Jumbo</option>
  <option value="DSCR/Investor">DSCR / Investor</option>
</select>
```

**`index.html` Quick Quote lines 391–397 (current):**
```html
<select name="loanGoal" required>
  <option value="">Loan Goal</option>
  <option value="Purchase">Purchase</option>
  <option value="Refinance">Refinance</option>
  <option value="First-Time Buyer">First-Time Buyer</option>
  <option value="Non-QM">Non-QM / Self-Employed</option>
</select>
```

**`index.html` Quick Quote lines 391–397 (proposed):** identical to get-preapproved Variant A above (replace `name="loan_goal"` with `name="loanGoal"`).

**`index.html` Quick Contact lines 695–701 (current — lowercase abbreviated):**
```html
<select name="loanGoal" required>
  <option value="">Loan Goal</option>
  <option value="purchase">Purchase</option>
  <option value="refi">Refinance</option>
  <option value="non-qm">Non-QM / Self-Employed</option>
  <option value="jumbo">Jumbo</option>
</select>
```

**`index.html` Quick Contact lines 695–701 (proposed):** identical to Quick Quote (Title Case, full taxonomy).

**`script.js` `TAG_MAP` (current — verify Builder reads):**
```javascript
const TAG_MAP = {
  Purchase: 'purchase-buyer',
  Refinance: 'refinance',
  'First-Time Buyer': 'ftb',
  'Non-QM': 'non-qm-self-employed',
  // 'DSCR/Investor', 'Jumbo' missing
};
```

**`script.js` `TAG_MAP` (proposed):**
```javascript
const TAG_MAP = {
  Purchase: 'purchase-buyer',
  Refinance: 'refinance',
  'First-Time Buyer': 'ftb',
  'Non-QM / Self-Employed': 'non-qm-self-employed',
  Jumbo: 'jumbo',
  'DSCR/Investor': 'dscr-investor',
};
```

**Rationale:** 9 distinct goal values across 2 forms + 1 funnel page = unsegmentable downstream. Canonical taxonomy unifies LoanOS dashboard filters. PR-1 + PR-2 + PR-3 + PR-4 all explicitly deferred this; PR-2 § 7 noted "touches LoanOS dashboard segmentation downstream."

**Risk:** LOW. No DB migration needed — current 8 'Website' rows checked; no contact has a Loan Goal value that would orphan. Mailchimp tags created lazily at first use; new tags (`jumbo`, `dscr-investor`) auto-create on first send.

**Cross-page bundle:** YES — single edit cluster touches 4 files. Builder rebuilds locally before push.

---

### § 3.2 — Cross-cut B+C: SEO Schema, Meta, OG (Funnel Pages)

**Files touched:** `get-preapproved.html` `<head>` (lines ~1–60), `rate-alert.html` `<head>` (lines ~1–60).

**Adds:**
- `<meta name="description">` updated on get-preapproved (M2)
- `<meta property="og:image">`, `og:image:alt`, `og:site_name`, `<meta name="twitter:card">` on both pages (M4 + M5)
- JSON-LD `MortgageBroker` schema on both pages (M3 + M6)
- JSON-LD `Service` schema (`serviceType="Mortgage Pre-Approval in Austin"` on get-preapproved; `serviceType="Mortgage rate monitoring"` on rate-alert)
- Per-branch `<title>` rewrite for get-preapproved per audit M1 (Variant A: `Pre-Approved in 24 Hours | 40+ Lenders | Austin TX Mortgage`)

**`get-preapproved.html` `<title>` (current):**
```html
<title>Austin Home Loan Pre-Approval in 24 Hours — 40+ Lenders | Adam Styer</title>
```

**`get-preapproved.html` `<title>` (proposed):**
```html
<title>Pre-Approved in 24 Hours | 40+ Lenders | Austin TX Mortgage</title>
```

**`get-preapproved.html` meta description (current):**
```html
<meta name="description" content="Get pre-approved for an Austin home loan in 24 hours. Independent broker shopping 40+ wholesale lenders. Free quote, no credit impact. NMLS #513013.">
```

**`get-preapproved.html` meta description (proposed):**
```html
<meta name="description" content="Pre-approved in 24 hours from an independent Austin broker shopping 40+ lenders. Free quote, no credit pull, no obligation. Call (512) 956-6010 or apply online. NMLS #513013.">
```

**OG additions (both pages — uses logo-only fallback per BLOCKER-LOANOS-001 selfies block):**
```html
<meta property="og:image" content="https://styermortgage.com/assets/og/styermortgage-logo-1200x630.png">
<meta property="og:image:alt" content="Adam Styer | Mortgage Solutions LP — Austin, Texas">
<meta property="og:site_name" content="Adam Styer Mortgage">
<meta name="twitter:card" content="summary_large_image">
```

**JSON-LD `MortgageBroker` (both pages — coordinate with SEO/SEM agent's existing schema rotation; Builder verifies homepage already-shipped schemas at `index.html` lines 95–122 and 240–248 are consistent):**
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "MortgageBroker",
  "name": "Adam Styer | Mortgage Solutions LP",
  "url": "https://styermortgage.com/",
  "telephone": "+1-512-956-6010",
  "email": "{{ Adam picks: styer.adam@gmail.com (default) | adam@styermortgage.com (Resend-DKIM-verified) }}",
  "address": { "@type":"PostalAddress", "streetAddress":"{{ Adam picks: 5718 Sam Houston Circle (production) | 5900 Balcones Drive Suite 100 (compliance docs) }}", "addressLocality":"Austin", "addressRegion":"TX", "postalCode":"78731", "addressCountry":"US" },
  "openingHours":"Mo-Fr 09:00-18:00",
  "areaServed": { "@type":"AdministrativeArea", "name":"Texas" },
  "identifier":"NMLS #513013"
}
</script>
```

**JSON-LD `Service` on `get-preapproved.html`:**
```html
<script type="application/ld+json">
{ "@context":"https://schema.org","@type":"Service","name":"Mortgage Pre-Approval in Austin","provider":{"@type":"MortgageBroker","name":"Adam Styer | Mortgage Solutions LP"},"areaServed":{"@type":"City","name":"Austin"},"description":"Get pre-approved for an Austin home loan in 24 hours. Independent broker shopping 40+ wholesale lenders." }
</script>
```

**JSON-LD `Service` on `rate-alert.html`:**
```html
<script type="application/ld+json">
{ "@context":"https://schema.org","@type":"Service","name":"Mortgage rate monitoring","provider":{"@type":"MortgageBroker","name":"Adam Styer | Mortgage Solutions LP"},"areaServed":{"@type":"AdministrativeArea","name":"Texas"},"description":"Weekly Friday rate update with broker-comparison table for Texas mortgage shoppers." }
</script>
```

**Risk:** LOW. Schema validation: Builder runs Google Rich Results Test (https://search.google.com/test/rich-results) on both pages post-deploy.

**Adam-data prereq:** § 6.2 — confirms canonical email + canonical address (PR-4 § 6 same prereq — should already be resolved by the time PR-5 ships).

---

### § 3.3 — Cross-cut D: 21-Day Close-Rate Footnote

**Files touched:** `get-preapproved.html` line 327, `rate-alert.html` line 508. Optional retroactive: `thank-you.html` PR-3 PA-branch reassurance copy.

**Default ships** the conservative footnote ("(2026 closings)" appended) **without** Adam confirmation, on both pages. If Adam confirms 21-day average is real (rolling-12-month median check), Builder also retroactively swaps PR-3 PA-branch "weeks, not months" → literal "in 21 days — Adam's rolling 12-month average across 90+ purchases" in same push.

**`get-preapproved.html` line 327 (current):**
```html
<span class="lp-trust-chip">21-Day Avg. Close</span>
```

**`get-preapproved.html` line 327 (proposed):**
```html
<span class="lp-trust-chip">21-Day Avg. Close (2026 closings)</span>
```

**`rate-alert.html` line 508 (current — verify Builder reads exact):**
```html
<div class="stat-value">21</div>
<div class="stat-label">Average days to close</div>
```

**`rate-alert.html` line 508 (proposed):**
```html
<div class="stat-value">21</div>
<div class="stat-label">Avg days to close*</div>
<small class="stat-footnote">*Based on 2024–2025 closing data, Adam Styer | Mortgage Solutions LP.</small>
```

**Note:** "Avg days to close" copy change here (was "Average") closes 2026-05-02 audit L2 cross-page consistency. Single diff covers M4 + L2.

**Risk:** LOW. Removes false-claim risk; if Adam pushes back on the chip entirely, single delete; minimal blast radius.

**Adam-data prereq:** § 6.3 — Adam confirms 21-day data is real (one-line "yes/no" — if no, drop the chip entirely).

---

### § 3.4 — `index.html` Homepage Polish + Cross-cut M2 (purchase price range)

**Files touched:** `index.html` (Quick Quote + Quick Contact form blocks), `script.js`, `netlify/functions/subscribe-lead.js`.

**Edits:**

#### M2 (cross-page) — purchase_price_range field on BOTH homepage forms (mirror PR-2 get-preapproved pattern)

**`index.html` Quick Quote — append after Loan Goal select (~line 397):**
```html
<select name="purchase_price_range">
  <option value="">Purchase price (optional)</option>
  <option value="under-300">Under $300K</option>
  <option value="300-500">$300–500K</option>
  <option value="500-800">$500–800K</option>
  <option value="800-1500">$800K–1.5M</option>
  <option value="over-1500">Over $1.5M</option>
  <option value="not-sure">Not sure yet</option>
</select>
```

**`index.html` Quick Contact — same select appended after Loan Goal (~line 701).**

**`script.js` Quick Quote handler (lines ~520–540) — propagate field to body:**
```diff
   body: JSON.stringify({
     fname, lname, email, phone, loanGoal,
+    purchase_price_range: form.purchase_price_range?.value || null,
     tag: 'quick-quote-lead',
     lead_source: 'Quick Quote',
     ...utmParams,
   })
```

**`script.js` Quick Contact handler (lines ~395–415) — same propagation.**

**`netlify/functions/subscribe-lead.js` — pass-through (mirrors PR-2 lead-intake.js change):**
```diff
   const {
-    fname, lname, email, phone, tag, loan_goal, lead_source, sms_opt_in,
+    fname, lname, email, phone, tag, loan_goal, lead_source, sms_opt_in, purchase_price_range,
     ...utm
   } = JSON.parse(event.body);
```
Plus: include `purchase_price_range` in the LoanOS POST body and as a Mailchimp merge field (`PRICEBAND`).

#### M4 — Trust badge dedup on hero form (lines 369–371)

**Current (above hero quick-quote form):**
```html
<div class="trust-badge-strip">5.0 ★ (136+ Reviews) | 21-Day Avg. Close | Licensed in Texas | NMLS #513013</div>
```

**Proposed:**
```html
<div class="trust-badge-strip">Free Quote · 1 Business Day Response · No Credit Pull</div>
<small class="trust-legal">Adam Styer | Mortgage Solutions LP · NMLS #513013 · Licensed in Texas</small>
```

#### L1 — Drop `btn-sm` on hero submit (line 408 — verify post-PR-2 state)

**Current:**
```html
<button class="btn btn-primary btn-sm">Get My Free Quote</button>
```
**Proposed:**
```html
<button class="btn btn-primary">Get My Free Quote</button>
```

#### L2 — Hero form input contrast (CSS lines 76–77)

**Current:**
```css
.hero-form input { background: rgba(255,255,255,0.15); color: var(--color-white); }
```
**Proposed:**
```css
.hero-form input { background: rgba(0,0,0,0.35); color: #fff; }
.hero-form input:focus { background: rgba(0,0,0,0.55); }
```

#### L5 — Hero form label sizing (CSS line 76)

**Current:** `.hero-form label { font-size: 0.75rem; }`
**Proposed:** `.hero-form label { font-size: 0.8125rem; }`

#### L3 — Quick Contact tel: link (after submit, ~line 713)

**Append below submit button:**
```html
<a href="tel:+15129566010" class="form-tel-fallback">Or call (512) 956-6010</a>
```

**Risk:** LOW. M2 plumbing matches the proven PR-2 pattern. Trust-badge swap is copy-only.

---

### § 3.5 — `get-preapproved.html` Hero Promotion + Microcopy

**Files touched:** `get-preapproved.html`.

#### L1 — Promote "Adam handles your file directly" to proof grid above form

**Current state:** Line in "What happens next" Step 1 below form.

**Proposed:** Move into the proof-grid container above `<h2>Get My Free Quote</h2>`. Adjust grid `grid-template-columns: repeat(4, 1fr)` on `min-width:768px`, stacked on mobile.

```html
<div class="lp-proof-grid">
  <div class="lp-proof-cell"><strong>136+</strong><span>Google Reviews</span></div>
  <div class="lp-proof-cell"><strong>21 days*</strong><span>Avg. close</span></div>
  <div class="lp-proof-cell"><strong>40+</strong><span>Wholesale lenders</span></div>
  <div class="lp-proof-cell"><strong>Direct</strong><span>Adam reads every submission — no bots, no call center</span></div>
</div>
```

#### L2 — "Takes about 60 seconds" microcopy

**Current:** Form heading present, no time anchor.

**Proposed (above `<h2>Get My Free Quote</h2>`):**
```html
<p class="form-time-anchor">Takes about 60 seconds.</p>
```

**Risk:** LOW. Layout-only; mobile responsive already handled.

---

### § 3.6 — `thank-you.html` Polish Bundle + `rate-alert.html` Polish Bundle

#### Thank-you M1 — per-branch `document.title` in IIFE

In each branch of the IIFE (~lines 621–720), append:
```javascript
document.title = '<branch-specific title>';
```

**Branch titles:**
- `preapproval` → `Pre-Approval Submitted | Adam Styer`
- `rate-alert` → `You're On the Friday Rate List | Adam Styer`
- `quick-quote` → `Quote Request Received | Adam Styer`
- `quick-contact` → `Message Received | Adam Styer` *(coordinates with new branch in script.js redirect — § 3.4 M1)*
- `ftb-dpa-guide` → `First-Time Buyer Guide On Its Way | Adam Styer`
- `refinance` → `Refinance Request Received | Adam Styer`
- `lo-waitlist` → `On the LoanOS Waitlist | Adam Styer`
- default → existing literal

#### Thank-you M2 — drop redundant `referral_source` from quick-quote follow-up form

**Current (lines 530–542):**
```html
<label>How did you hear about Adam?
  <select name="referral_source">…</select>
</label>
```
**Proposed:** Delete entire `<label>` block. UTM tracking covers attribution server-side.

#### Thank-you M3 — privacy reassurance line on quick-quote follow-up form

**Insert above submit button (line ~555):**
```html
<p class="form-privacy-note"><em>These details stay private — only Adam sees them, and they help him prep a sharper first call.</em></p>
```

#### Thank-you M4 — per-branch Calendly h2

**Lines ~588–592 — replace:**
```html
<h2 class="ty-calendly-h2">Book a 15-Minute Call</h2>
```
with branch-aware logic in IIFE:
```javascript
const calH2 = document.querySelector('.ty-calendly-section h2');
if (calH2) {
  if (type === 'rate-alert') calH2.textContent = 'Want to talk now? Pick a time.';  // already in PR-3 § 3.1
  else if (type === 'preapproval') calH2.textContent = 'Lock in your 15-min review with Adam.';
  else if (type === 'ftb-dpa-guide') calH2.textContent = 'Got 15 minutes to map out your buyer game plan?';
  else if (type === 'refinance') calH2.textContent = 'Want to walk through the refi math live?';
  else calH2.textContent = 'Book a 15-Minute Call';
}
```

#### Thank-you L5 — em-dash literal cleanup

Lines 630, 631, 634, 635 — replace HTML entity `—` with actual em-dash character (`—`).

#### Thank-you L6 — Calendly inline widget height

**Current (line 592):** `style="min-width:320px;height:700px;"`
**Proposed:** `style="min-width:320px;min-height:600px;height:auto;"`

#### Thank-you L2 — GA `sessionStorage` dedup flag (bundle with PR-4 § 3.6)

**In GA conversion block (around lines 616–618 — already touched by PR-4 lo-waitlist suppression):**
```javascript
if (!sessionStorage.getItem('ty_ga_fired')) {
  if (typeof gtag === 'function' && type !== 'lo-waitlist') {
    gtag('event','conversion', { 'send_to': 'AW-...' });
  }
  sessionStorage.setItem('ty_ga_fired', '1');
}
```
**Risk:** PR-5 must rebase on top of PR-4 if PR-4 ships first; if PR-5 ships before PR-4, PR-4 § 3.6 must rebase. Spec sequencing matrix in § 7.

#### Rate-alert M2 — form-tagline microcopy

**Line 378 (current):** `Free. Weekly. No spam. Unsubscribe anytime.`
**Proposed:** `Friday mornings. No more than 4 emails a month. Unsubscribe in one click.`

#### Rate-alert M3 — rate-move alert language (Option A — soften)

**Line 446 (current):** `When rates shift more than 0.25% in a week, you'll know first.`
**Proposed:** `If rates move sharply mid-week, I send a one-line note on top of the Friday update.`

#### Rate-alert M7 (PR-2b-3 graduated) — form social proof loans-closed fallback

**Insert below form submit button (~line 415):**
```html
<p class="form-social-proof"><strong>1,000+ loans closed since 2017.</strong> Real broker, real rate context — not Bankrate aggregation.</p>
```

#### Rate-alert L3 — tertiary cross-sell CTA (below credibility section)

```html
<p class="lp-tertiary-cta">Ready now instead of watching? <a href="/get-preapproved">Start your pre-approval →</a></p>
```

#### Rate-alert L6 — mobile form-card `order: -1` removal (A/B optional)

**Line 332 CSS at `<900px` breakpoint:**
```diff
- .lp-form-card { order: -1; }
+ /* form-first stacking removed 2026-05-10 — A/B test pending */
```
**Risk:** A/B-testable; 14-day completion-rate measurement post-deploy. Keep PR-5 default = remove (audit recommended).

**Risk (entire § 3.6):** LOW. All edits are inline-IIFE / CSS / single-line copy swaps. No JS dependency or schema impact.

---

## § 4 — Post-Deploy Test Plan (10 steps)

Run after Builder push:

1. **Visit `/get-preapproved.html`** — confirm new title in browser tab; confirm meta description in page source; confirm 4 OG meta tags + `twitter:card` in `<head>`; confirm 2 JSON-LD blocks (MortgageBroker + Service) parse via Google Rich Results Test.
2. **Visit `/rate-alert.html`** — same checks as step 1 minus the title (rate-alert title not in audit).
3. **Submit `/get-preapproved` form** with `Loan Goal = Jumbo` (newly added) — confirm Mailchimp tag `jumbo` auto-creates and contact lands in LoanOS with `loan_goal = "Jumbo"`.
4. **Submit homepage Quick Quote** with new `purchase_price_range = "300-500"` — confirm Supabase contact has `purchase_price_range` in metadata; confirm Mailchimp merge field `PRICEBAND` populated.
5. **Submit homepage Quick Contact** — confirm redirect to `/thank-you?type=quick-contact&email=…` (was inline success); confirm thank-you page shows new `quick-contact` branch title.
6. **Visit `/thank-you?type=preapproval`** — confirm new browser tab title `Pre-Approval Submitted | Adam Styer`; confirm Calendly h2 reads `Lock in your 15-min review with Adam.`
7. **Visit `/thank-you?type=quick-quote`** — confirm follow-up form shows privacy reassurance line; confirm `referral_source` field is gone; confirm em-dashes render correctly (no literal `—`).
8. **Refresh `/thank-you?type=preapproval` 3×** — confirm GA `conversion` event fires once via DevTools Network tab (sessionStorage dedup working).
9. **Mobile viewport `/rate-alert.html`** — confirm form is no longer above value-prop on stacked layout (L6 `order: -1` removed); measure form-completion rate baseline.
10. **All 4 pages — confirm trust badge dedup on homepage** (`index.html`) — line 369–371 shows new "Free Quote · 1 Business Day Response · No Credit Pull" copy.

---

## § 5 — Risk Assessment

| # | Risk | Severity | Mitigation |
|---|------|---------:|------------|
| 1 | Loan Goal taxonomy migration — existing `'DSCR/Investor'` value won't match new `'DSCR/Investor'` literal in Mailchimp tags | LOW | Tags are auto-created lazily; old value lands as new tag string. Manual cleanup of 1–2 stale tags in Mailchimp UI post-deploy. |
| 2 | Quick Contact redirect change — users with `?type=quick-contact` deep links may have cached behavior | LOW | New URL `/thank-you?type=quick-contact` — old behavior was inline success, new behavior is redirect. No public link with `?type=quick-contact` exists pre-PR-5; impact = 0. |
| 3 | OG image URL `https://styermortgage.com/assets/og/styermortgage-logo-1200x630.png` must exist | LOW | Builder verifies asset exists in `assets/og/` directory; if missing, Builder generates 1200×630 logo-only fallback before push. |
| 4 | JSON-LD schema validation failure (e.g., missing required field) | LOW | Builder runs Rich Results Test post-deploy; rolls back schema block if invalid. |
| 5 | `purchase_price_range` field added without DB column existing on Supabase contacts | LOW | PR-2 already added the column on get-preapproved path; verify migration via `\d contacts` before push. If missing, abort push (not PR-5 scope to migrate). |
| 6 | Mobile form-card reorder (rate-alert L6) regresses form-completion rate | LOW | A/B-testable single-line CSS revert; 14-day measurement window. |
| 7 | Hero form input contrast change (`rgba(0,0,0,0.35)`) breaks visual hierarchy on glass-overlay backdrop | LOW | Builder eye-tests on local before push; if regress, rollback to `rgba(0,0,0,0.20)` with focus state. |
| 8 | Per-branch `document.title` in IIFE fires AFTER initial render — 100ms tab title flash | NONE | Cosmetic only; user already navigated to thank-you so they see the post-flash title. |
| 9 | GA `sessionStorage` dedup (L2) clashes with PR-4 § 3.6 lo-waitlist suppression — Builder must rebase on top of PR-4 | LOW | Sequencing matrix § 7. Both edits touch same lines; merge logic is straightforward (combine the two branches in single `if`). |
| 10 | NULL `lead_source` row pattern (new datapoint 2026-05-09 — `srhoyt5@gmail.com`) — none of PR-5's edits touch the upstream NULL-defaulting code path | NONE | Out-of-scope; logged in § 8. Likely manual import or iMessage capture, not a form-handler bug. Investigate via separate audit. |

**Total:** 8 LOW + 2 NONE — no MEDIUM or HIGH risks.

---

## § 6 — Adam-Data Prerequisites (3 decisions, ~3 min total)

### § 6.1 — Loan Goal canonical taxonomy choice (~30 sec)
- **(A) Default — Variant A (audit-recommended)**: `Purchase / Refinance / First-Time Buyer / Non-QM / Self-Employed / Jumbo / DSCR/Investor`. Title Case, semicolon-free. Closer to current production state — lower migration risk.
- **(B) Variant B (M6 wording)**: "I'm buying my first home / I'm buying a home (not my first) / …". Lower-cognitive-load wording per audit recommendation.

If Adam picks B, Builder swaps option text only (value attributes still map to canonical slugs). No DB migration in either case.

### § 6.2 — Canonical email + canonical address (carry-over from PR-4 § 6)
This is the same prereq PR-4 already raised. If PR-4 ships first, PR-5 inherits Adam's pick. If PR-5 ships first, default = `styer.adam@gmail.com` for canonical email + `5718 Sam Houston Circle` for canonical address (production state). Builder updates `tasks/lead-gen/domain-queue.md` line 67 with chosen address.

### § 6.3 — 21-day average close confirmation (~30 sec)
- **(A) Confirm "yes, 21 days is real" with 2024–2025 closing data** → Builder ships footnote + retroactive PR-3 thank-you PA-branch literal swap ("weeks, not months" → "in 21 days — Adam's rolling 12-month average across 90+ purchases").
- **(B) Pushback "no, not auditable"** → Builder drops the chip entirely on both pages (1-line delete on each).
- **(C) "(2026 closings)" footnote default** → Builder ships the conservative footnote without retroactive PR-3 swap. Default if Adam doesn't reply.

Default ships option (C) so PR-5 is non-blocking; Adam can upgrade to (A) or downgrade to (B) inline during review.

---

## § 7 — Sequencing vs PR-1 / PR-2 / PR-3 / PR-4

| Shared file | PR-1 lines | PR-2 lines | PR-3 lines | PR-4 lines | PR-5 lines | Conflict? |
|------|---:|---:|---:|---:|---:|---|
| `index.html` | 369–404 (TCPA), 695–710 (TCPA) | 386–410 (Quick Quote subhead + CTA) | — | 95–122, 240–248, 1056–1062 (JSON-LD email + footer) | 391–397 + 695–701 (Loan Goal taxonomy), 76–77 + 369–371 + 397 + 408 + 701 + 713 (M2/M4/L1/L2/L3/L5/L6) | **PR-5 + PR-2 share line 408 (CTA button) — Builder rebases L1 on top of PR-2's "Get My Free Quote" text. PR-5 + PR-4 share JSON-LD blocks — verify Service[] enumeration on top of PR-4's email-literal swaps.** |
| `rate-alert.html` | 408–435 (TCPA) | 432–442 (subhead), 415 (CTA), 458–478 (sample email + L1) | — | 521 (footer email) | 332 (form-card order), 378 (M2), 415 (M7 social proof — below PR-2's CTA), 446 (M3), 508 (M4), L2/L3 spans various | **PR-5 + PR-2 share line ~415 (CTA-to-social-proof region) — PR-5 inserts ~3 lines below PR-2's CTA. Sequencing safe.** |
| `get-preapproved.html` | 376–382 (TCPA copy) | 1–10 (title), 325–331 (purchase price field) | — | 496–501 (footer address) | 1–60 (head: title M1, meta M2, OG M4, JSON-LD M3), 327 (M7 footnote), 376–382 (Loan Goal — extends PR-2's `name` change), L1 + L2 above-form spans | **PR-5 + PR-2 share lines 1–10 (title) AND 376–382 (Loan Goal — PR-2 added field, PR-5 extends taxonomy). Builder applies PR-5 title swap on top of PR-2's name change. PR-5 + PR-4 share line ~496 (footer) — different lines but same block; verify rebase clean.** |
| `thank-you.html` | 461–488 (3-step block hide), 717 (mailto) | — | 621–720 (entire IIFE — H2/H3/H4/H5) | 600–620 (footer + GA suppression) | 530–542 + 555 (M2/M3 quick-quote follow-up), 588–592 + IIFE branches (M4 per-branch h2), 616–618 (L2 sessionStorage), 630/631/634/635 (L5 em-dash), 6 (M1 title), 592 (L6 height) | **PR-5 + PR-3 share IIFE line range 621–720 — PR-5 adds new statements at end of each existing branch. PR-5 + PR-4 share 616–618 (GA conversion) — Builder merges sessionStorage flag into PR-4's lo-waitlist suppression.** |
| `script.js` | — | 503–540 (lead-intake field), 380–415 (Quick Contact handler) | — | — | TAG_MAP (~line 280), 354–381 (Quick Contact redirect — replace inline success), 520–540 (Quick Quote purchase_price_range propagation) | **PR-5 + PR-2 share lines 380–415 — PR-5 replaces inline success block with redirect. Direct conflict — PR-5 must apply on top of PR-2 OR PR-2 must rebase.** |
| `netlify/functions/subscribe-lead.js` | — | (PR-2 plumbs lead-intake.js for `purchase_price_range`) | — | — | destructure + body pass-through | Independent of PR-1/PR-3/PR-4. PR-5 + PR-2 are coupled by intent (both extend subscribe-lead.js for cross-page taxonomy). |

**Recommended ship order:** PR-1 → PR-2 → PR-3 → PR-4 → **PR-5**. PR-5 is the natural last step — designed for rebase-on-top.

**If PR-5 ships out of order (e.g., before PR-3):** the only mandatory rebase is `thank-you.html` per-branch IIFE — PR-5 inserts new lines at the END of existing branches; PR-3 inserts new lines at the START / MIDDLE. Both can coexist; just two passes.

**Bundling:** PR-3 + PR-4 + PR-5 can bundle into one Builder push (all three single-page-low-risk on `thank-you.html`). PR-1 + PR-2 cannot bundle with PR-5 cleanly because of the script.js Quick Contact handler conflict.

---

## § 8 — Out-of-Scope (Items NOT in PR-5)

| Item | Why deferred | Where it goes |
|------|-----------|---------------|
| PR-2b-1 — Clickable review chip on get-preapproved (H4) | Adam-data prereq: GBP `place_id` not yet supplied | Inline ship as PR-2b on the day Adam pastes place_id |
| PR-2b-2 — Named testimonials on get-preapproved (H3) | Adam-data prereq: 3 GBP UI name pulls | Inline ship as PR-2b |
| 2026-05-01 L5 — "Read all 136 reviews on Google →" link | Pairs with PR-2b-1 (same destination URL) | Bundle when PR-2b-1 ships |
| 2026-05-05 L3 — Thank-you testimonial swap-in | Pairs with PR-2b-2 (same component shape) | Bundle when PR-2b-2 ships |
| 2026-05-01 L3 — Sticky mobile phone CTA | Effort: M (audit said "slightly heavier than typical L"); PR-6 candidate | PR-6 mobile-conversion focus |
| 2026-05-01 L4 — Full FAQ section + FAQPage schema on get-preapproved | Effort: M+; bundles with rate-alert L5 (same FAQ pattern) | PR-6 SEO focus |
| 2026-05-02 L5 — Rate-alert FAQ section | See above | PR-6 SEO focus |
| 2026-05-02 M1 — Mailcheck.js typo suggestion | Cross-form scope (audit only flagged on rate-alert; expansion logical) | PR-6 deliverability focus |
| 2026-05-04 L4 — `novalidate` attribute removal | Audit explicitly says "no fix unless JS-disabled audit run" | Note-only, no PR |
| 2026-05-05 L1 — 3-step block inline-style refactor | Polish-only; deferred to a "convenient time" | Low-priority backlog |
| 2026-05-05 L4 — `<meta name="description">` on thank-you | Audit explicitly says "cosmetic only — no impact on conversion under noindex,nofollow" | Note-only, no PR |
| `/refinance-quote.html` audit | Never audited; would extend funnel-page audit series to 5/5 | Tomorrow's mission option (b) |
| `/austin-mortgage-rates.html` audit | High-traffic SEO landing capture surface; never audited | Tomorrow's mission option (c) |
| Deterministic POST verification probe to `/.netlify/functions/lead-intake` | DOWNGRADED priority per 05-09 correction (rows that motivated this were SEO-agent reclassification artifacts) | Adam-in-the-loop session |
| NULL `lead_source` row investigation (NEW datapoint 2026-05-09 — `srhoyt5@gmail.com`) | Likely manual import or iMessage capture; not in any form-handler diff scope | Separate ~30-min audit when Adam returns |
| Lead source taxonomy coordination with SEO/SEM agent | SEO-agent inserts should default to `'AEO'` literal, never `'Website'` | Cross-agent coordination ticket; 5 min |

---

## § 9 — Builder Execution Checklist (15 steps)

1. **Read this spec end-to-end.** Note the 6 edit clusters (§ 3.1–§ 3.6) and the sequencing matrix (§ 7).
2. **Read `tasks/lead-gen/specs/2026-05-06-compliance-closeout-pr-spec.md` § 3.5** to know exact thank-you 3-step block hide pattern (so PR-5 thank-you M1/M4 don't conflict).
3. **Read `tasks/lead-gen/specs/2026-05-07-conversion-consolidation-pr-spec.md` § 3.7 + § 6.3** to know `purchase_price_range` plumbing pattern + PR-2b-3 social-proof template.
4. **Read `tasks/lead-gen/specs/2026-05-08-thank-you-conversion-pr-spec.md` § 3.1** to know per-branch h2 pattern (PR-5 M4 extends to all branches).
5. **Read `tasks/lead-gen/specs/2026-05-09-cross-page-brand-footer-pr-spec.md` § 3.6** to know lo-waitlist GA suppression line range (PR-5 L2 sessionStorage merges into it).
6. **Verify Adam's § 6 picks before any edit** — read `tasks/ADAM-TODO.md` for PR-5's authorize line; if any pick is missing, halt and ask.
7. **Verify Supabase `contacts` table has `purchase_price_range` column** (PR-2 added it). Run `\d contacts` via MCP; abort push if column is missing.
8. **Apply § 3.1 (Loan Goal taxonomy)** across 4 files. Run local `npm test` if tests exist; otherwise visual smoke on 3 forms via local dev server.
9. **Apply § 3.2 (SEO schema, meta, OG)** on get-preapproved + rate-alert. Verify OG image asset exists at `assets/og/styermortgage-logo-1200x630.png`; if missing, generate and commit before push.
10. **Apply § 3.3 (21-day footnote)** per Adam's pick (default = "(2026 closings)" footnote on both pages without retroactive PR-3 swap).
11. **Apply § 3.4 (homepage polish + M2)** — purchase_price_range field on both forms + script.js handler updates + subscribe-lead.js pass-through. Verify Builder rebase on top of PR-2's CTA changes (line 408).
12. **Apply § 3.5 (get-preapproved hero promotion + microcopy)**.
13. **Apply § 3.6 (thank-you + rate-alert polish bundle)** — IIFE per-branch additions, form-tagline swap, social-proof loans-closed fallback.
14. **Run post-deploy test plan § 4 (10 steps)** — verify every page renders correctly, JSON-LD validates via Google Rich Results Test, redirect from Quick Contact lands on thank-you with correct branch.
15. **Commit + push.** Single commit, message: `feat(lead-gen): PR-5 final light-pass — close 4-audit pile (~40 atomic edits across 6 clusters)`. Update `tasks/lead-gen/domain-queue.md` line 67 with canonical address. Flip ADAM-TODO PR-5 line to `[x]` and the 4 prior audit lines (05-01 / 05-02 / 05-04 / 05-05) to `[x]` once shipped — the audit-series queue is fully drained at that point.

---

## § 10 — Post-Ship State of the 4-Audit Pile

After PR-5 ships:
- All 4 audit ADAM-TODO lines (05-01 / 05-02 / 05-04 / 05-05) → `[x]`
- All 4 PR ADAM-TODO lines (PR-1 / PR-2 / PR-3 / PR-4) → `[x]`
- BLOCKER-001 (TCPA bundled consent) → fully resolved (PR-1)
- 5 of 5 series compliance FAILs → closed
- Audit-series queue → fully drained

**Next agent move:** the next session must shift to either (a) `/refinance-quote.html` audit (5/5 funnel coverage), (b) `/austin-mortgage-rates.html` audit (high-traffic SEO landing capture surface), (c) Architect-mode strategic work on net-new lead-gen channels (Realtor Relationships drip activation, Long-Term Nurture archive vs author decision, Refi Watch sequencing), or (d) deterministic POST verification probe to characterize the upstream Website-fallback path (DOWNGRADED priority per 05-09 correction; Adam-in-the-loop session). Recommended: **(a) `/refinance-quote.html` audit** — natural extension of audit series; produces clean baseline before the agent shifts to net-new strategic work.

**End of PR-5 spec.**
