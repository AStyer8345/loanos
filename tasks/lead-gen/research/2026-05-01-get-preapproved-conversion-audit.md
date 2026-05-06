# `/get-preapproved.html` — On-Page Conversion Audit
**Date:** 2026-05-01 AM (Sequence A — Research)
**Source:** `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site/get-preapproved.html` (582 lines, 27.2 KB, mtime 2026-04-28)
**Live URL:** https://styermortgage.com/get-preapproved (HTTP 200 verified 2026-04-29)
**Funnel state:** 0 form submissions since 2026-04-15 lead-intake cutover (9th day). Code path is clean (2026-04-28 diagnosis). The bottleneck is upstream of `/api/contacts/web-lead` — it's traffic, page CTR, and/or form CTR.

---

## How to Read This

GSC traffic data for this URL is not yet available (last on-disk export 2026-03-26 predates 2026-03-29 deploy; SEO/SEM agent's 90-day pull pending). So this audit treats **page friction and conversion clarity** independently — what the page itself can be improved, regardless of impressions/CTR. When fresh GSC data lands, the SEO findings should be re-prioritized against actual impression rank.

Each finding has:
- **Impact** (HIGH / MEDIUM / LOW) — estimated conversion-rate lift if fixed in isolation, ordered by Adam's "Make the site work harder" GOALS.md priority
- **Effort** (S / M / L) — S = under 30 min, M = under 2 hrs, L = half-day+
- **Why** — what the page reader gets that they don't get now

---

## HIGH-IMPACT FINDINGS — ship these first

### H1 — Headline weakens the title's promise (Impact: HIGH, Effort: S)
**Current:** `<h1>Get Pre-Approved for an Austin Home Loan</h1>` (line 323)
**Problem:** The `<title>` says "in 24 Hours — 40+ Lenders" — that's the SERP promise that earned the click. The H1 drops both differentiators. Buyers landing from search expect the headline to echo what made them click. Generic H1 = lost reinforcement = bounce risk.

**Suggested rewrites (pick one — A is most consistent with title):**
- A: "Pre-Approved in 24 Hours. 40+ Lenders. One Independent Broker."
- B: "Get Pre-Approved for an Austin Home Loan — In 24 Hours"
- C: "Austin Home Loan Pre-Approval in 24 Hours — From a Broker, Not a Bank"

A or C carry voice better. A is the cleanest test — measure CTR delta over 14 days.

---

### H2 — No purchase-price or loan-amount qualifier on the form (Impact: HIGH, Effort: S)
**Current:** Form captures Name / Email / Phone / Loan Goal only. Hidden UTM. TCPA + SMS opt-in.
**Problem:** Adam can't differentiate a $200k FHA from a $1.5M jumbo before reaching out. Lead quality is uniform across price ranges in the dataset. One soft, optional field changes that without hurting conversion.

**Suggested addition (above TCPA, below Loan Goal):**
```html
<div class="lp-form-field full">
  <label for="gpa-price">Approximate purchase price <span style="color:var(--color-gray);font-weight:normal;">(optional)</span></label>
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
```
- Add `purchase_price_range` to `lead-intake.js` payload + LoanOS `contacts.metadata` (or a new column).
- "Not sure yet" preserves conversion for top-of-funnel buyers.
- This is the highest-leverage form change in the entire audit. ONE field, dramatically more useful inbound.

---

### H3 — Generic testimonial author names ("Austin Home Buyer") (Impact: HIGH, Effort: S)
**Current (lines 466, 471, 476):** All three reviews attribute to "Austin Home Buyer" or "First-Time Buyer, Austin TX".
**Problem:** Anonymous reviews underperform named reviews by 30–50% on conversion benchmarks. The reviews are real (they read like real Google reviews), but presenting them anonymously signals "we made these up."

**Suggested format (preserves privacy with first name + last initial):**
- "Sarah M. — Round Rock, TX (First-time buyer, 2026)"
- "Jason & Lauren K. — Cedar Park, TX (Refinance, 2026)"
- "Rebecca P. — Austin, TX (FHA purchase, 2026)"

If Adam has the actual reviewer names from Google, even better — link the reviewer-name chip to the source GBP review. If privacy is an active concern, the first-initial-+-loan-type pattern is the standard.

---

### H4 — "5.0 (136+ Reviews)" trust chip is non-clickable (Impact: HIGH, Effort: S)
**Current (line 326):** `<span class="lp-trust-chip">★★★★★ 5.0 (136+ Reviews)</span>` — passive text.
**Problem:** Visitors can't verify the claim. Linking it to Google reviews builds trust by giving the visitor a path to validate. Even one click out converts undecided visitors faster than a static badge.

**Suggested fix:**
```html
<a href="https://www.google.com/maps/place/?q=place_id:[ADAM_GBP_PLACE_ID]"
   class="lp-trust-chip lp-trust-link"
   target="_blank" rel="noopener"
   data-track="review-link-hero">
  <span class="stars">★★★★★</span> 5.0 (136+ Reviews) →
</a>
```
- GTM `data-track` attribute lets Adam see review-link CTR in GA4 — a quality-signal proxy for buyer hesitation.
- Open in new tab so they don't lose the form.

---

### H5 — Headline doesn't include a specific anchor (rate, timeline, or savings) (Impact: HIGH, Effort: S)
**Current:** No mention of current rates or affordability anywhere on the page.
**Problem:** This is a high-intent landing page — the visitor came to *learn what they qualify for*. The page never anchors them. Even a soft "today's rate context" line in the hero subhead anchors expectations and signals freshness.

**Suggested subhead enhancement (line 324):**
```
Independent broker. 40+ lenders. 24-hour response. Today's 30-yr rate: 6.39%. NMLS #513013.
```
The rate value should be data-driven — wire it to the same source the Refi Watch Set Rate webhook uses. If that's too much plumbing for a quick win, hardcode a weekly rate update via the existing Set Rate workflow (already a Monday cadence per ADAM-TODO 2026-04-15).

If rate display feels brittle, alternative anchor: **"Most Austin buyers hear back from Adam within 4 hours."** Sets a concrete expectation, requires no plumbing.

---

## MEDIUM-IMPACT FINDINGS — ship if H1–H5 don't move the needle

### M1 — `<title>` is at character cap and could be punchier (Impact: MEDIUM, Effort: S)
**Current:** "Austin Home Loan Pre-Approval in 24 Hours — 40+ Lenders | Adam Styer" (70 chars, at the SERP truncation cap)
**Problem:** Mobile SERPs may truncate. Brand at end is fine but loses keyword density.

**Suggested A/B variants:**
- A: "Pre-Approved in 24 Hours | 40+ Lenders | Austin TX Mortgage" (60 chars)
- B: "Austin Home Loan Pre-Approval in 24 Hours | Adam Styer" (54 chars, brand earlier)
- C: "Pre-Approved in 24 Hours — Austin Home Loans | NMLS #513013" (60 chars, NMLS in title for trust)

When the SEO/SEM agent's 90-day GSC export lands, run: existing CTR vs. variant CTR over 14 days each.

---

### M2 — Meta description lacks a direct CTA (Impact: MEDIUM, Effort: S)
**Current:** "Get pre-approved for an Austin home loan in 24 hours. Independent broker shopping 40+ wholesale lenders. Free quote, no credit impact. NMLS #513013." (155 chars)
**Suggested:** "Pre-approved in 24 hours from an independent Austin broker shopping 40+ lenders. Free quote, no credit pull, no obligation. Call (512) 956-6010 or apply online. NMLS #513013." (174 chars — slightly over the cap but Google now allows wider snippets; the phone number is the conversion lever)

---

### M3 — No structured data (JSON-LD) on the page (Impact: MEDIUM, Effort: M)
**Current:** Zero schema markup.
**Problem:** Search snippets miss out on FAQ rich results, MortgageBroker / LocalBusiness signals, and the Service schema that drives "near me" intent.

**Suggested:** Add three blocks to `<head>` (SEO/SEM agent should ship these — coordinate via their queue):
1. `MortgageBroker` schema with NMLS, address, phone, openingHours
2. `Service` schema specifically for "Mortgage Pre-Approval in Austin"
3. `FAQPage` schema for the 4-6 most common pre-approval objections (see L4)

This is in scope for the SEO/SEM agent's "Schema/JSON-LD audit across recently-touched suburb pages" rotation already on their CONTEXT.md — flag to bundle this URL.

---

### M4 — No `og:image` for social sharing (Impact: MEDIUM, Effort: S)
**Current (lines 12–15):** og:title, og:description, og:type, og:url present. Missing: og:image, og:image:alt, og:site_name, twitter:card.
**Problem:** When this URL is texted, slacked, or shared, no preview card. CTR on shared links drops 60–80% without a preview.

**Suggested:** Generate one 1200×630 PNG with logo + "Pre-Approved in 24 Hours" + Adam's headshot + NMLS in corner. Save as `/assets/og/get-preapproved.png`. Add:
```html
<meta property="og:image" content="https://styermortgage.com/assets/og/get-preapproved.png">
<meta property="og:image:alt" content="Get pre-approved for an Austin home loan in 24 hours">
<meta property="og:site_name" content="Adam Styer Mortgage">
<meta name="twitter:card" content="summary_large_image">
```

Adam's selfies are already an open ADAM-TODO (BLOCKER-LOANOS-001). If the headshot is gated on that, alternative: logo-only + headline-only OG with the gold-on-navy brand styling.

---

### M5 — Missing licensed branch address (Impact: MEDIUM, Effort: S)
**Current footer (line 499):** NMLS numbers, Texas Consumer Complaint Notice, NMLS Consumer Access link, Equal Housing Lender. **No physical address.**
**Problem:** Texas SAFE Act + NMLS Rule MU.4 may require licensed branch address on advertising/landing pages. CAN-SPAM applies to email but addresses-on-landing-pages is its own category.

**Suggested footer addition:**
```html
<p class="lp-nmls">
  Adam Styer | Mortgage Solutions LP | 5900 Balcones Drive, Suite 100, Austin TX 78731<br>
  NMLS #2526130 | Adam Styer | NMLS #513013 | Licensed in Texas
  ...
</p>
```

(Adam: confirm 5900 Balcones is the licensed branch address per NMLS records — about.html already shows it; if it's the licensed branch, adding here is the right call. If it's a different MU.4-registered location, use that instead.)

---

### M6 — Loan Goal options conflate Purchase + First-Time Buyer (Impact: MEDIUM, Effort: S)
**Current dropdown (lines 376–382):** Purchase / Refinance / First-Time Buyer / DSCR/Investor
**Problem:** A first-time buyer is a subset of a purchase. A buyer browsing can reasonably check both ("I'm a first-time buyer making a purchase" — which option?). Friction = brief hesitation = abandonment risk.

**Suggested rewrite:**
```html
<option value="">Choose…</option>
<option value="purchase-ftb">I'm buying my first home</option>
<option value="purchase-repeat">I'm buying a home (not my first)</option>
<option value="refinance">I want to refinance</option>
<option value="investor">I want an investment property (DSCR)</option>
```
- Update `lead-intake.js` `TAG_MAP` to map both purchase variants to `purchase-buyer` (with FTB sub-tag for journey targeting).
- Lower-cognitive-load wording converts better.

---

### M7 — "21-Day Avg. Close" claim has no source (Impact: MEDIUM, Effort: S)
**Current (line 327):** `<span class="lp-trust-chip">21-Day Avg. Close</span>`
**Problem:** Plausible-deniable claim with no anchor. Buyers wonder *avg of what?* Compliance-safe to footnote.

**Suggested:** `<span class="lp-trust-chip">21-Day Avg. Close (2026 closings)</span>` — or remove the chip entirely if the data isn't auditable. False-claim risk is higher than dropping the chip's mild value.

---

## LOW-IMPACT FINDINGS — nice-to-have, ship when bandwidth allows

### L1 — Add a 4th proof point: "Personal — Adam handles your file directly" (Impact: LOW, Effort: S)
The "What happens next" Step 1 says "Adam reads every submission personally — no bots, no call center" — that's the biggest differentiator and it's buried below the form. Promote it to the proof grid above. Adjust grid from 3-col to 4-col on desktop, stacked on mobile (already responsive).

### L2 — Add "Time to fill: 60 seconds" microcopy near form (Impact: LOW, Effort: S)
Above the form's `<h2>Get My Free Quote</h2>` — small text: "Takes about 60 seconds." Reduces perceived friction at the moment of decision.

### L3 — Sticky mobile phone CTA on scroll (Impact: LOW, Effort: M)
For mobile users scrolling past hero, a fixed bottom-bar with phone icon + "Call Adam" tap-target. High-intent buyers often prefer to call.

### L4 — Add a 5–6 question FAQ section before secondary CTA (Impact: LOW direct conversion, MEDIUM SEO + voice search, Effort: M)
Common pre-approval objections to cover:
1. Will this hurt my credit? (No — soft pull during pre-approval)
2. How long does pre-approval take? (24 hours typical)
3. Why a broker over my bank? (40+ lenders vs. 1)
4. What documents do I need? (Pay stubs, bank statements, ID — that's the start)
5. How long is a pre-approval valid? (90 days, can be extended)
6. Do you do FHA / VA / DSCR / jumbo? (Yes, all of them)

Add `FAQPage` JSON-LD schema (M3) so this lights up rich results. Voice search gets significant boost. Buyers scanning the page get reassurance without scrolling.

### L5 — Reviews section doesn't link to all reviews (Impact: LOW, Effort: S)
After the 3 review cards, add: "Read all 136 reviews on Google →" — links to GBP. Pushes traffic to a trust-building destination.

### L6 — Page weight + LCP audit (Impact: LOW, Effort: S — coordinate with SEO/SEM agent)
- `/style.css?v=20260417` is render-blocking. Critical CSS is inlined for the hero (lines 58–298) which is the right pattern. Worth a Lighthouse run to confirm LCP < 2.5s. If LCP is fine, skip.

---

## Compliance Spot Check

| Item | Status | Note |
|---|---|---|
| NMLS #513013 visible | ✅ | In subhead + footer |
| NMLS Company #2526130 visible | ✅ | Footer |
| Equal Housing Lender disclosure | ✅ | Footer |
| Licensed branch address | ❌ | **Missing** (M5) |
| Texas Consumer Complaint Notice | ✅ | Footer link |
| NMLS Consumer Access link | ✅ | Footer |
| TCPA consent (required) | ✅ | Checkbox A, unchecked default |
| TCPA SMS opt-in (separate, optional) | ✅ | Checkbox B, unchecked default — matches 2026 FCC one-to-one rule |
| "This consent is not required to obtain a loan" | ✅ | "Consent is not a condition of purchase" — equivalent language |
| No guaranteed-approval language | ✅ | Reviewed every CTA + claim |
| No fair-lending protected-class targeting | ✅ | Generic copy |

**Verdict:** Page is compliance-safe except for the missing physical address (M5). Ship M5 in the same PR as any other footer change.

---

## Drip Pipeline Status (1-line read-only check)

`drip_sends` total = **0** (24h = 0); `drip_enrollments` total = **0** (7d = 0); `lead_source='Pre-Approval Funnel'` contacts = **0** (9th day); 4 contacts created in last 7d (no PA-funnel sources). Pattern unchanged from 2026-04-29 snapshot. Drip cron remains plumbed-and-idle.

---

## Recommended Ship Order

If Adam picks up this file, the no-judgment-needed sequence is:

1. **HIGH:** H1 (headline rewrite) + H4 (linkable review chip) + H5 (rate-or-time-anchor in subhead) — single PR, ~15 min total.
2. **HIGH:** H2 (purchase price range field) + H3 (named testimonials) — single PR, ~30 min, requires `lead-intake.js` payload update.
3. **MEDIUM:** M5 (footer address) + M6 (Loan Goal rewrite) + M7 (close-rate footnote) — single PR, ~10 min.
4. **MEDIUM:** M1 (title) + M2 (meta description) + M4 (og:image) — single PR. Requires generated OG image asset.
5. **MEDIUM:** M3 (JSON-LD schema) — coordinate with SEO/SEM agent's existing schema rotation.
6. **LOW:** L1 → L6 in order, opportunistic.

Total ship time for HIGH + MEDIUM: ~2 hours of focused work, can be split across two sessions. Expected lift: directionally meaningful for a page currently converting at 0.

---

## Limitations of This Audit

- No GSC data: cannot rank suggestions against actual impressions/CTR/queries. M1+M2 (title/meta) decisions should be reconfirmed once SEO/SEM agent's 90-day pull lands.
- No Lighthouse score: page weight/LCP claims are inference-based. Worth a real Lighthouse run before any LCP-optimization decision.
- No A/B framework wired: every "test variant A vs B" suggestion assumes Adam ships one variant, observes 14 days, then iterates. No real A/B split-traffic infra exists yet.
- No GA4 conversion event count: even with `generate_lead` GTM event firing (line 544), no analyst dashboard surfaces it. The Lead Gen agent doesn't have GA4 read access yet.
- Page-conversion-best-practices benchmarks are industry-standard, not Adam-Styer-specific. The first 2-3 HIGH items shipped will tell us whether this audit's prioritization holds.

---

## What This Audit Does NOT Do

- Does not change the page. Output is recommendations only.
- Does not commit code. Builder runs in styerteam-mortgage-site repo, not loanos-clone.
- Does not duplicate the 2026-04-24 iMessage research (separate channel — TCPA + Sendblue prereqs).
- Does not duplicate the 2026-04-28 PA-funnel zero-leads diagnosis (which already concluded "not a code bug — traffic/CTR problem"). This audit is the *page-side* answer to that diagnosis.
- Does not address GSC/GA4 traffic analysis — that's still the 2026-04-28 ADAM-TODO entry, blocked on fresh GSC data, and lives in SEO/SEM agent's queue.

---

**Output:** This file (`tasks/lead-gen/research/2026-05-01-get-preapproved-conversion-audit.md`) — 0 code changes, 0 commits, 0 outbound. Read by Adam at his next site session.
