# PR-2 — Conversion Consolidation (Drop-In Spec)

**Author:** Lead Gen Master Orchestrator (autonomous AM cron)
**Date:** 2026-05-07
**Repo:** `styerteam-mortgage-site` (deploys to Netlify on push)
**Sequencing:** Apply AFTER `2026-05-06-compliance-closeout-pr-spec.md` ships. Designed to apply cleanly on top.
**Estimated ship time:** 45 min Builder + 10 min Adam review.

---

## 1. Why this PR exists

The 4 funnel-page audits authored 2026-05-01 → 2026-05-05 surfaced **20 HIGH-tier findings**, of which:

- **5 H1 findings = compliance / TCPA** — bundled into yesterday's `2026-05-06-compliance-closeout-pr-spec.md` (PR-1).
- **15 H2–H5 findings = conversion-focused** — pile-up was a major reason no funnel page change has shipped in 14+ days.

This PR-2 spec consolidates the **conversion-focused HIGH-tier findings on the 3 form pages** (get-preapproved, rate-alert, homepage) into one ship-ready PR. Thank-you-page H2–H5 findings stay separate — they live in a different file (`thank-you.html`'s inline IIFE) and serve post-submit branching, not capture, so bundling them here would conflate concerns.

**What is intentionally NOT in this PR:**
- Thank-you page H2–H5 — defer to PR-3 (`thank-you.html` IIFE-only edits).
- All M-tier and L-tier findings — defer to PR-4+ light-pass.
- Loan Goal taxonomy unification (`/get-preapproved` M6 + homepage H4) — same out-of-scope decision as PR-1; touches LoanOS dashboard segmentation downstream.
- 3 conversion findings that require Adam-supplied data (real testimonial names, GBP `place_id`, real subscriber count) — **see § 6 "Adam-data prerequisites"**. Copy-paste templates ready; Builder applies once data lands.

**Pipeline state read-only (2026-05-07 03:46 CT):** drip_sends=0, drip_enrollments=0, PA Funnel=0 (15th day), Rate Alert=0 (39 days), Quick Quote/Contact=0, Website=9 (90d, +1 new row 2026-05-06: brunalexandra7@hotmail.com — first 'Website' fallback row in 7 days). contacts_7d=4. **Pattern still anchored: real funnel pages capturing 0; generic Website row trickle continues, suggesting source other than the explicit-tagged form handlers.**

---

## 2. Files modified (4)

| # | File path                                                | Purpose                                          | Atomic diffs |
|---|----------------------------------------------------------|--------------------------------------------------|-------------:|
| 1 | `get-preapproved.html`                                   | H1 headline rewrite + H2 purchase-price field + H5 hero subhead anchor | 3 |
| 2 | `rate-alert.html`                                        | H2 subhead Lock-or-Wait + H3 CTA copy + H5 undated sample email | 3 |
| 3 | `index.html`                                             | Homepage Quick Quote H2 subhead + H3 CTA copy   | 1 (combined) |
| 4 | `script.js` (Quick Quote handler) + inline `get-preapproved.html` handler | Propagate `purchase_price_range` field to lead-intake.js body | 1 |

**Total: 8 atomic diffs across 4 files.**

---

## 3. Per-file diffs

### 3.1 `get-preapproved.html` — H1 headline rewrite

**Audit ref:** 2026-05-01 H1 (lines 22–32 of audit).
**Why:** Page `<title>` says "in 24 Hours / 40+ Lenders" (the SERP promise that earned the click). H1 drops both differentiators. Reinforce in the headline so the visitor's first 1.5-second scan validates the click decision.
**Recommended variant:** A (most consistent with title; cleanest A/B test). B and C in audit are alternates if A reads heavy on mobile.

**Current (line 323):**
```html
<h1>Get Pre-Approved for an Austin Home Loan</h1>
```

**Proposed:**
```html
<h1>Pre-Approved in 24 Hours. 40+ Lenders. One Independent Broker.</h1>
```

---

### 3.2 `get-preapproved.html` — H5 hero subhead anchor

**Audit ref:** 2026-05-01 H5 (lines 91–101 of audit).
**Why:** No specific anchor (rate, timeline, savings). Concrete expectation > generic credentials. Audit recommended either (1) live rate or (2) "respond within 4 hours" as alternative if rate plumbing is too brittle. **Picking (2)** — zero plumbing, no maintenance, no compliance exposure (no rate disclosure obligation triggered).

**Current (line 324):**
```html
<p class="lp-subhead">Independent broker. 40+ lenders. 24-hour response. NMLS #513013.</p>
```

**Proposed:**
```html
<p class="lp-subhead">Independent broker. 40+ lenders. Most Austin buyers hear back from Adam within 4 hours. NMLS #513013.</p>
```

**Note for Builder:** if Adam prefers the live-rate variant ("Today's 30-yr rate: 6.39%"), wire to the Set Rate webhook source per `tasks/lead-gen/build-reports/2026-04-13-rate-email-template.md` cadence. Adds ~30 min for the data plumb. The "4 hours" variant is the recommended ship default.

---

### 3.3 `get-preapproved.html` — H2 purchase-price-range field (highest-leverage form change in entire audit series)

**Audit ref:** 2026-05-01 H2 (lines 35–56 of audit).
**Why:** Adam can't differentiate $200k FHA from $1.5M jumbo before reaching out. Lead quality is uniform across price ranges in the dataset today. ONE optional field changes that without measurably hurting conversion (the "Not sure yet" option preserves top-of-funnel).

**Current (lines 374–383, ends with `</select></div>` for Loan Goal):**
```html
                <div class="lp-form-field full">
                  <label for="gpa-goal">Loan Goal</label>
                  <select id="gpa-goal" name="loan_goal" required>
                    <option value="">Choose…</option>
                    <option value="Purchase">Purchase</option>
                    <option value="Refinance">Refinance</option>
                    <option value="First-Time Buyer">First-Time Buyer</option>
                    <option value="DSCR/Investor">DSCR / Investor</option>
                  </select>
                </div>
              </div>
```

**Proposed (insert NEW field between Loan Goal `</div>` and the `</div>` that closes `.lp-form-row`):**
```html
                <div class="lp-form-field full">
                  <label for="gpa-goal">Loan Goal</label>
                  <select id="gpa-goal" name="loan_goal" required>
                    <option value="">Choose…</option>
                    <option value="Purchase">Purchase</option>
                    <option value="Refinance">Refinance</option>
                    <option value="First-Time Buyer">First-Time Buyer</option>
                    <option value="DSCR/Investor">DSCR / Investor</option>
                  </select>
                </div>
                <div class="lp-form-field full">
                  <label for="gpa-price">Approximate purchase price <span style="color:var(--color-gray);font-weight:normal;font-size:0.85em;">(optional)</span></label>
                  <select id="gpa-price" name="purchase_price_range">
                    <option value="">Choose…</option>
                    <option value="<300k">Under $300,000</option>
                    <option value="300-500k">$300,000 – $500,000</option>
                    <option value="500-750k">$500,000 – $750,000</option>
                    <option value="750k-1m">$750,000 – $1,000,000</option>
                    <option value="1m+">Over $1,000,000</option>
                    <option value="not-sure">Not sure yet</option>
                  </select>
                </div>
              </div>
```

**Companion JS change** (see § 3.8 — adds `purchase_price_range` to the lead-intake.js POST body).

**Bundles with:** rate-alert.html M-tier "form qualifier" (deferred to PR-4) — paving the way here means the Mailchimp tag + LoanOS contact metadata field exists before that PR ships.

---

### 3.4 `rate-alert.html` — H2 subhead Lock-or-Wait differentiator

**Audit ref:** 2026-05-02 H2 (lines 93–106 of audit).
**Why:** Subhead currently buries the **single biggest reason a buyer should sign up here vs Bankrate or Mortgage News Daily** — Adam's *Lock or Wait?* call (already named on the page at line 451 as the actual product differentiator). Surface it in the subhead.

**Current (line 366):**
```html
<p class="lp-subhead">Free weekly rate intel from an independent broker with access to 40+ lenders — delivered every Friday morning.</p>
```

**Proposed (variant A from audit — most aligned with page's actual differentiation):**
```html
<p class="lp-subhead">Free weekly Austin rates + my one-line Lock-or-Wait call. From an independent broker with 40+ lenders. Friday mornings.</p>
```

---

### 3.5 `rate-alert.html` — H3 CTA button copy

**Audit ref:** 2026-05-02 H3 (lines 110–123 of audit).
**Why:** Generic "Get My Weekly Rate Updates →" describes the product but doesn't anchor the next concrete promise (an email arrives Friday). Outcome-language CTAs measurably outperform feature-language CTAs in B2C subscription benchmarks. Also reduces post-submit confusion (visitors often forget they signed up by Friday — the CTA reinforces the cadence).

**Current (line 421):**
```html
<button type="submit" id="ra-submit-btn" class="btn btn-primary">Get My Weekly Rate Updates &rarr;</button>
```

**Proposed:**
```html
<button type="submit" id="ra-submit-btn" class="btn btn-primary">Send Me Friday's Rate Update &rarr;</button>
```

---

### 3.6 `rate-alert.html` — H5 undated, rate-agnostic sample email

**Audit ref:** 2026-05-02 H5 (lines 143–171 of audit).
**Why:** Sample preview shows "Week of March 28" + 6.875% / 6.125% / 6.375% / 6.250% rates — 5+ weeks stale, ~50bp off market. Visitors who read closely think "is this even still being sent?" — credibility damage. Eliminating absolute numbers permanently removes the maintenance-rot risk.

Also closes audit's L1 "From: adam@thestyerteam.com" finding in the same diff (`thestyerteam.com` violates global CLAUDE.md "never use The Styer Team" rule; per-org `from_email` shipped commit `4ac0812` is the actual outbound — see ADAM-TODO 2026-05-02 reference).

**Current (lines 459–477):**
```html
          <p class="sample-label">Sample Friday Rate Update</p>
          <p class="sample-subject">Austin Rate Watch — Week of March 28</p>
          <p class="sample-preview">From: Adam Styer &lt;adam@thestyerteam.com&gt; &nbsp;·&nbsp; Subject: Austin Rate Watch — this week's numbers</p>
          <div class="sample-rate-row">
            <span class="rate-label">30-Year Fixed</span>
            <span class="rate-value">6.875% (6.92% APR)</span>
          </div>
          <div class="sample-rate-row">
            <span class="rate-label">15-Year Fixed</span>
            <span class="rate-value">6.125% (6.18% APR)</span>
          </div>
          <div class="sample-rate-row">
            <span class="rate-label">FHA 30-Year</span>
            <span class="rate-value">6.375% (7.14% APR)</span>
          </div>
          <div class="sample-rate-row">
            <span class="rate-label">VA 30-Year</span>
            <span class="rate-value">6.250% (6.49% APR)</span>
          </div>
          <p class="sample-insight">"My take: rates are sticky near 7%. If you're closing in 30 days, lock now. If you're 60+ days out, floating still makes sense — but set a lock trigger at 6.75%." — Adam</p>
```

**Proposed:**
```html
          <p class="sample-label">What lands every Friday</p>
          <p class="sample-subject">Austin Rate Watch — this week's numbers</p>
          <p class="sample-preview">From: Adam Styer &lt;adam@styermortgage.com&gt; &nbsp;·&nbsp; Subject: Austin Rate Watch — this week's numbers</p>
          <div class="sample-rate-row">
            <span class="rate-label">30-Year Fixed</span>
            <span class="rate-value sample-rate-illustrative">[ this week's rate ]</span>
          </div>
          <div class="sample-rate-row">
            <span class="rate-label">15-Year Fixed</span>
            <span class="rate-value sample-rate-illustrative">[ this week's rate ]</span>
          </div>
          <div class="sample-rate-row">
            <span class="rate-label">FHA 30-Year</span>
            <span class="rate-value sample-rate-illustrative">[ this week's rate ]</span>
          </div>
          <div class="sample-rate-row">
            <span class="rate-label">VA 30-Year</span>
            <span class="rate-value sample-rate-illustrative">[ this week's rate ]</span>
          </div>
          <p class="sample-insight">"My take this week: my one-sentence Lock-or-Wait call goes here." — Adam</p>
```

**Note for Builder:** The existing disclaimer at line 479 ("Rates above are illustrative examples") already covers compliance for this format change. Optional: add a `.sample-rate-illustrative { font-style: italic; opacity: 0.75; }` rule to the page-level `<style>` block to visually signal "placeholder" — but the bracket notation is sufficient on its own and avoids touching CSS in this PR.

**Verify Builder confirms** `adam@styermortgage.com` is the canonical outbound address before pushing — falls back to `adam@adamstyer.com` if that's the live alias on Resend (per CONTEXT.md "Resend (already DKIM-verified for styermortgage.com)").

---

### 3.7 `index.html` — Homepage Quick Quote subhead + CTA polish (combined)

**Audit refs:** 2026-05-04 H2 (lines 70–80) + H3 (lines 83–93).
**Why:** (H2) Form is preceded by `<p class="hero-quick-form-title">Quick Quote</p>` only — column 1 promises "wholesale rates from 40+ lenders — pre-approved in 24 hours, closed in 21 days" but column 2 (where the form is) loses that anchor. (H3) "Get My Quote" button is generic.

Single-diff bundle: subhead insertion + button copy in the same form block.

**Current (lines 372–408 — relevant portions):**
```html
            <form id="hero-quick-form" name="hero-quick-form" novalidate data-netlify="true" class="hero-quick-form">
              <input type="hidden" name="form-name" value="hero-quick-form">
              <p class="hero-quick-form-title">Quick Quote</p>
              <div class="hero-quick-form-grid">
                ... (form fields unchanged) ...
              </div>
              <!-- TCPA consent -->
              ... (closeout PR-1 modifies this block) ...
              <div class="hero-quick-form-actions">
                <button type="submit" class="btn btn-primary btn-sm">Get My Quote</button>
              </div>
            </form>
```

**Proposed (additions only — title gains subhead + button copy changes; PR-1 TCPA changes preserved):**
```html
            <form id="hero-quick-form" name="hero-quick-form" novalidate data-netlify="true" class="hero-quick-form">
              <input type="hidden" name="form-name" value="hero-quick-form">
              <p class="hero-quick-form-title">Quick Quote</p>
              <p class="hero-quick-form-subhead" style="margin:0 0 var(--spacing-sm,8px) 0;font-size:0.85rem;color:rgba(255,255,255,0.85);text-shadow:0 1px 2px rgba(0,0,0,0.4);">Free quote in 1 business day. No credit pull. No spam.</p>
              <div class="hero-quick-form-grid">
                ... (form fields unchanged) ...
              </div>
              <!-- TCPA consent (per PR-1 closeout — two-checkbox split) -->
              ... (PR-1 closeout block) ...
              <div class="hero-quick-form-actions">
                <button type="submit" class="btn btn-primary btn-sm">Get My Free Quote</button>
              </div>
            </form>
```

**Subhead voice check (per `tasks/social-media/adam-voice-and-workflow.md`):** matches "21-day close" plain-spoken cadence; no "best rates" or "save thousands" marketing-speak. ✅
**Button voice check:** "Get My Free Quote" is the lowest-risk +1-word audit option. Adam may swap to "Get My Quote in 1 Business Day" if the timeline anchor reads better — single-word HTML edit, no further code change.

---

### 3.8 `get-preapproved.html` inline handler — propagate `purchase_price_range` to lead-intake.js

**Reason:** § 3.3 adds the `<select name="purchase_price_range">` field. The Netlify Form layer auto-captures it (the `name=""` attribute is enough). The `/.netlify/functions/lead-intake` POST body (lines 555–573) must explicitly add the new field so it lands in LoanOS contact metadata.

**Current (lines 555–573):**
```javascript
          fetch('/.netlify/functions/lead-intake', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email:         data.get('email')        || '',
              fname:         data.get('first_name')   || '',
              lname:         data.get('last_name')    || '',
              phone:         data.get('phone')        || '',
              tag:           tag,
              loan_goal:     loanGoal,
              lead_source:   'Pre-Approval Funnel',
              sms_opt_in:    data.get('sms_opt_in') === 'on',
              loan_type_tag: loanTypeTag,
              utm_source:    data.get('utm_source')   || '',
              utm_medium:    data.get('utm_medium')   || '',
              utm_campaign:  data.get('utm_campaign') || '',
              page_url:      data.get('page_url')     || window.location.href,
            }),
          }).catch(function (err) { console.error('lead-intake error:', err); }),
```

**Proposed (single line addition — `purchase_price_range`):**
```javascript
          fetch('/.netlify/functions/lead-intake', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email:                 data.get('email')                || '',
              fname:                 data.get('first_name')           || '',
              lname:                 data.get('last_name')            || '',
              phone:                 data.get('phone')                || '',
              tag:                   tag,
              loan_goal:             loanGoal,
              purchase_price_range:  data.get('purchase_price_range') || '',
              lead_source:           'Pre-Approval Funnel',
              sms_opt_in:            data.get('sms_opt_in') === 'on',
              loan_type_tag:         loanTypeTag,
              utm_source:            data.get('utm_source')           || '',
              utm_medium:            data.get('utm_medium')           || '',
              utm_campaign:          data.get('utm_campaign')         || '',
              page_url:              data.get('page_url')             || window.location.href,
            }),
          }).catch(function (err) { console.error('lead-intake error:', err); }),
```

**Builder verification step:** open `netlify/functions/lead-intake.js` and confirm the handler accepts arbitrary body fields (precedent: closeout PR-1 § 3.6 verified this for `email_consent` / `sms_opt_in`). If the handler explicitly destructures only known keys, Builder must add `purchase_price_range` to the destructure + Mailchimp merge-tag map + LoanOS payload. Estimated +10 min if so.

**LoanOS-side propagation:** `purchase_price_range` should land in `contacts.metadata.purchase_price_range` (JSON column). No schema change required — existing `metadata` jsonb absorbs it. Dashboard segmentation can be added later as a separate ticket once data accrues. **Out of scope for this PR.**

---

## 4. Test plan (post-deploy)

Run after Netlify production deploy completes (~60–90 sec from `git push`).

1. **`/get-preapproved` headline + subhead:** load page, confirm new H1 reads "Pre-Approved in 24 Hours. 40+ Lenders. One Independent Broker." and subhead reads "...Most Austin buyers hear back from Adam within 4 hours. NMLS #513013."
2. **`/get-preapproved` purchase-price field:** scroll to form. Confirm new "Approximate purchase price (optional)" select field appears between Loan Goal and TCPA checkbox. Confirm it is NOT marked required (form submits without selecting an option). Pick "$500,000 – $750,000".
3. **`/get-preapproved` round-trip:** submit form with test data + selected price range. Confirm browser DevTools Network tab shows POST to `/.netlify/functions/lead-intake` with `purchase_price_range: "500-750k"` in payload body.
4. **LoanOS-side verification:** open Supabase contacts table (or LoanOS `/dashboard/contacts`) and confirm new test row's `metadata` jsonb includes `purchase_price_range: "500-750k"`. If field is missing in `metadata`, Builder did not patch `lead-intake.js` per § 3.8 Builder verification step.
5. **`/rate-alert` subhead + CTA:** load page, confirm subhead now reads "Free weekly Austin rates + my one-line Lock-or-Wait call..." and CTA button reads "Send Me Friday's Rate Update →".
6. **`/rate-alert` sample email:** scroll to "What lands every Friday" sample block. Confirm rate values now show `[ this week's rate ]` (bracketed placeholder) instead of stale absolute numbers. Confirm From: address shows `adam@styermortgage.com` (NOT thestyerteam.com).
7. **Homepage Quick Quote:** load `/`, confirm Quick Quote form now shows new subhead "Free quote in 1 business day. No credit pull. No spam." between title and Name field. Confirm CTA button reads "Get My Free Quote".
8. **Homepage TCPA preserved:** confirm PR-1 closeout TCPA two-checkbox split is still present on Quick Quote form (not regressed by this PR — should be unchanged).
9. **No console errors:** check browser DevTools Console after submitting each form — no JS errors, no failed network requests.

---

## 5. Risk assessment

| Risk | Severity | Mitigation |
|------|---------:|------------|
| `purchase_price_range` field not landing in `lead-intake.js` body destructure | **MEDIUM** | Builder verification step in § 3.8 catches this pre-deploy. If destructured, +10 min to patch. |
| H1 headline rewrite hurts CTR by under-anchoring known intent | **LOW** | A/B reversion is single-line revert. Variant A is the audit's recommended starting point; B and C are documented alternates. |
| H5 "4 hours" claim misrepresents actual response time | **LOW** | Adam's reply cadence per CRM data (per CONTEXT.md hot-lead routing pattern) confirms <4 hr typical for inbound during business hours. Not a guarantee, not warranty language — same posture as "24-hour pre-approval" claim already on page. |
| Rate-alert sample preview "this week's rate" placeholder confuses visitors | **LOW** | Existing line 479 disclaimer ("Rates above are illustrative examples") covers it. Bracketed format is industry-standard "form preview" notation. |
| Homepage subhead text gets clipped on narrow mobile viewports | **LOW** | Inline `style=""` uses `font-size:0.85rem` matching other hero microcopy; no fixed width. Visual check at 360px width during step 7 catches any wrap issue. |
| PR-2 ships before PR-1 (closeout) lands → TCPA changes not yet present | **NONE** | Each diff in this spec is independent of PR-1 changes (no PR-1 lines are referenced or modified by PR-2 except as preservation note in § 3.7). Order doesn't matter; PR-1-then-PR-2 sequencing is preferred but PR-2 alone is also safe. |

---

## 6. Adam-data prerequisites — separate "PR-2b" once data lands

These 3 HIGH-tier findings need Adam-supplied data Builder cannot generate. Copy-paste templates ready; Builder ships in <10 min once data arrives.

### 6.1 `get-preapproved.html` H4 — clickable review chip
**Needs from Adam:** The Google Business Profile `place_id` for Adam Styer | Mortgage Solutions LP. Find via `https://developers.google.com/maps/documentation/places/web-service/place-id` paste GBP URL → returns ID like `ChIJN1t_tDeuEmsRUsoyG83frY4`.

**Drop-in once received** (replaces line 326 in current source — note: closeout PR-1 may modify nearby; rebase if needed):
```html
<a href="https://search.google.com/local/writereview?placeid=[ADAM_GBP_PLACE_ID]"
   class="lp-trust-chip lp-trust-link"
   target="_blank" rel="noopener"
   data-track="review-link-hero">
  <span class="stars">★★★★★</span> 5.0 (136+ Reviews) →
</a>
```
(URL pattern `search.google.com/local/writereview?placeid=` opens Google Maps reviews for the GBP — visitors land on the source. Add `data-track="review-link-hero"` for GA4 quality-signal proxy.)

---

### 6.2 `get-preapproved.html` H3 — named testimonials (replace 3× "Austin Home Buyer")
**Needs from Adam:** First name + last initial + city + loan type for the 3 reviews currently rendered at lines 466 / 471 / 476. Adam owns the source GBP reviews — pulling reviewer name + review-text-match takes ~5 min in GBP UI.

**Drop-in template** (apply to all 3 `<span class="lp-review-author">` lines):
```html
<span class="lp-review-author">Sarah M. — Round Rock, TX (First-time buyer, 2026)</span>
<span class="lp-review-author">Jason &amp; Lauren K. — Cedar Park, TX (Refinance, 2026)</span>
<span class="lp-review-author">Rebecca P. — Austin, TX (FHA purchase, 2026)</span>
```
(Privacy-preserving first-name-+-initial format. Builder swaps with Adam-supplied actuals.)

---

### 6.3 `rate-alert.html` H4 — form social proof above the form
**Needs from Adam:** Either (a) real subscriber count ("Joining N Austin buyers watching rates") OR (b) confirmation to ship the loans-closed fallback ("1,000+ loans closed since 2017").

**Drop-in once decided** (insert above form `<h2>` in the form column at line 376):
```html
<div class="lp-form-social-proof" style="display:flex;gap:8px;align-items:center;margin-bottom:var(--spacing-md);">
  <span style="color:#F59E0B;font-size:14px;">★★★★★</span>
  <span style="font-size:var(--font-size-xs);color:var(--color-gray);">Trusted by Austin homebuyers · 1,000+ loans closed since 2017</span>
</div>
```
(DO NOT invent a subscriber count. The fallback claim is real and audit-cleared.)

---

## 7. Out of scope (do NOT bundle into this PR)

- Loan Goal taxonomy unification (`/get-preapproved` M6 + homepage H4 + rate-alert M2) — separate ~25-min cross-page PR. Touches LoanOS dashboard segmentation downstream. Same out-of-scope decision as PR-1 closeout.
- Thank-you page conversion findings (H2 Calendly visibility for rate-alert, H3 FTB-DPA append-vs-replace, H4 PA branch reassurance copy, H5 dataLayer instrumentation) — defer to PR-3 (`thank-you.html` IIFE-only edits).
- All M-tier and L-tier findings across the 4 audits — defer to PR-4 light-pass.
- Cross-page brand-consistency + footer-address sweep (4 funnel pages) — defer to PR-4 (already scoped in 05-05 session-log).
- JSON-LD MortgageBroker / Service / FAQPage schema — coordinate with SEO/SEM agent's existing schema rotation; not a Lead Gen-owned ship.
- Live rate display in `/get-preapproved` subhead (alternative to "4 hours" anchor in § 3.2) — adds ~30 min for Set Rate webhook plumbing; unblock if Adam wants it instead.

---

## 8. Builder execution checklist

When Adam authorizes this PR, Builder should:

1. Confirm PR-1 closeout (`2026-05-06-compliance-closeout-pr-spec.md`) has shipped to main + Netlify production. If not, ship PR-1 first or rebase PR-2 against the un-merged PR-1 branch.
2. Open `styerteam-mortgage-site` repo, branch `conversion-consolidation-2026-05-07` (or similar).
3. Apply the 8 diffs above. Match indentation exactly — files use mixed tabs/spaces in places.
4. **Verify lead-intake.js destructures**: open `netlify/functions/lead-intake.js`. If `purchase_price_range` would not pass through (handler explicitly destructures), patch handler to (a) accept the field, (b) propagate to LoanOS contact `metadata.purchase_price_range`, (c) optionally add Mailchimp merge tag `*|PURCHASE_PRICE_RANGE|*` for use in PA Welcome Series subject lines.
5. `git add` only the 4 touched files: `get-preapproved.html`, `rate-alert.html`, `index.html`, plus `netlify/functions/lead-intake.js` (if § 3.8 / step 4 required a patch).
6. Local manual verification in `.claude/site-server.js` (port 8766): all 3 form pages render; headline + subhead changes visible on /get-preapproved; rate-alert sample shows bracketed placeholders; homepage Quick Quote shows new subhead + new button copy.
7. `git commit -m "conversion(consolidation): H2-H5 conversion polish across get-preapproved/rate-alert/homepage"` (single commit; do not split).
8. `git push origin <branch>` — Netlify auto-builds preview. Verify preview deploy URL behavior on test plan steps 1–9.
9. Adam merges to main → Netlify production deploy → re-run test plan against production URL.
10. Update `tasks/ADAM-TODO.md` — flip the three 05-01 / 05-02 / 05-04 audit lines to `[x]` (now-shipped). Leave 05-05 thank-you line `[ ]` (PR-3 territory).
11. Update `tasks/lead-gen/specs/2026-05-07-conversion-consolidation-pr-spec.md` header with `**Status:** SHIPPED commit <SHA> 2026-05-XX`.

---

## 9. Why agent didn't ship this directly

Per `tasks/lead-gen/master-agent.md` STEP 6, the master orchestrator runs Sequence A (Research only) when there is no Adam authorize signal. Sequence C (Execute) requires either: (a) an explicit ADAM-TODO `[x]` authorization line, (b) a brand-new spec that Adam has acknowledged in chat, or (c) a Builder run already in progress. None of those conditions are met for the styerteam-mortgage-site repo today. The scheduled-task SKILL.md additionally restricts this run from "write" actions outside the lead-gen project files. Authoring this spec is the highest-leverage Sequence A output available — building on yesterday's closeout-spec consolidation pattern.

---

## 10. References

- Audits this PR consolidates:
  - `tasks/lead-gen/research/2026-05-01-get-preapproved-conversion-audit.md` (H1, H2, H3, H4, H5)
  - `tasks/lead-gen/research/2026-05-02-rate-alert-conversion-audit.md` (H2, H3, H4, H5; H1 in PR-1)
  - `tasks/lead-gen/research/2026-05-04-homepage-forms-conversion-audit.md` (H2, H3; H1 in PR-1; H4 out of scope; H5 informational only)
- Sequencing reference: `tasks/lead-gen/specs/2026-05-06-compliance-closeout-pr-spec.md` (PR-1 closeout — must ship first or PR-2 rebase against open branch)
- Voice + tone: `tasks/social-media/adam-voice-and-workflow.md` (authoritative Styer mortgage voice guide)
- Active blocker context: `tasks/lead-gen/BLOCKERS.md` (BLOCKER-001 closes via PR-1; PR-2 has no compliance dependencies)
- Pipeline state: read-only Supabase query 2026-05-07 03:46 CT — drip_sends=0, drip_enrollments=0, PA Funnel=0 (15th day), Rate Alert=0 (39 days), Quick Quote/Contact=0, Website=9 (90d, +1 new row brunalexandra7@hotmail.com on 2026-05-06).
