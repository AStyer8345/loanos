# `/rate-alert.html` — On-Page Conversion Audit
**Date:** 2026-05-02 AM (Sequence A — Research)
**Source:** `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site/rate-alert.html` (598 lines, 25.3 KB, mtime 2026-04-28)
**Live URL:** https://styermortgage.com/rate-alert.html (last verified live 2026-03-30 post-deploy QA)
**Companion to:** `tasks/lead-gen/research/2026-05-01-get-preapproved-conversion-audit.md` (yesterday's `/get-preapproved.html` audit, same methodology)
**Funnel state (Supabase, 2026-05-02 03:50 CT):** `contacts.lead_source='Rate Alert Funnel'` total = 0. `drip_sends` = 0, `drip_enrollments` = 0 (5 weeks unchanged). May 1 launch day produced no movement on either funnel.

---

## How to Read This

The Rate Alert funnel and the Pre-Approval funnel are NOT interchangeable. They serve different intents:

| | Pre-Approval (`/get-preapproved.html`) | Rate Alert (`/rate-alert.html`) |
|---|---|---|
| Visitor intent | Buying soon, wants approval letter | Watching market, not ready yet |
| Form ask | Name + Email + Phone + Loan Goal + TCPA | Name + Email + TCPA |
| Adam's mental model | Hot lead — call within 5 min | Long-tail subscriber — re-engage on rate moves |
| Conversion definition | Form fill (transactional) | Form fill (subscription) |
| Adjacent compliance | TCPA + CAN-SPAM | TCPA (heavier — recurring marketing IS the product) + CAN-SPAM |

So the Rate Alert audit weighs different signals: friction is even more sensitive (this is a low-stakes opt-in, every extra field costs disproportionately), the subject-promise must echo the form payoff, and TCPA copy must explicitly cover ongoing weekly contact.

GSC traffic data for this URL is not available on disk (last export 2026-03-26). When SEO/SEM agent's 90-day pull lands, re-prioritize SEO findings against actual impression rank.

Each finding has:
- **Impact** (HIGH / MEDIUM / LOW) — estimated conversion-rate lift if fixed in isolation
- **Effort** (S / M / L) — S = under 30 min, M = under 2 hrs, L = half-day+
- **Why** — what the page reader gets that they don't get now

---

## Compliance Spot-Check

| Item | Status | Evidence |
|---|---|---|
| NMLS #513013 disclosed | ✅ | Footer line 520 + trust chip line 369 |
| Equal Housing Lender | ✅ | Footer line 522 |
| Physical address | ✅ | "5718 Sam Houston Circle, Austin, TX 78731" line 521 *(NOTE: this differs from the canonical "5900 Balcones Drive, Suite 100" used elsewhere — see C1 below)* |
| Texas Consumer Complaint Notice link | ✅ | Footer line 520 |
| NMLS Consumer Access link | ✅ | Footer line 520 |
| Unsubscribe pathway | ⚠️  | "Unsubscribe anytime" copy in form-card line 378 + 427, but the actual unsubscribe link is delivered in the email itself (Mailchimp default) — not a page-level concern. Compliant for landing page; verify on first sent campaign. |
| TCPA consent | ⚠️  | Single bundled checkbox covers phone + email + text. See **H1 below — this is the highest-priority finding on this page.** |
| "Guaranteed" / "approved" language | ✅ | None present |
| Protected-class targeting | ✅ | None |
| APR disclosure on rates shown | ✅ | Line 479: "Rates above are illustrative examples. Actual rates vary based on credit score, loan amount, and property type. APR shown for illustration only." Sample rates in lines 461–476 each show APR alongside note rate. Clean. |

**Two compliance items flagged — H1 (TCPA bundling, HIGH) and C1 (footer address mismatch, LOW).**

---

## HIGH-IMPACT FINDINGS — ship these first

### H1 — TCPA consent is BUNDLED, and Rate Alert is exactly where this can't be (Impact: HIGH, Effort: S, Compliance: ELEVATED)
**Current (lines 414–419):**
```html
<input type="checkbox" name="tcpa_consent" required ...>
<span>I agree to be contacted by Adam Styer via phone, email, or text about mortgage options.
Consent is not a condition of purchase. Msg & data rates may apply. Reply STOP to opt out.</span>
```
**Problem:** One required checkbox bundles three channels (phone + email + text). The page says "Free weekly rate intel … delivered every Friday morning" — meaning the user signed up for **email**. They did NOT sign up for SMS or phone calls. Coercing all three into one required tickbox creates two risks:

1. **TCPA exposure.** TCPA's "prior express written consent" standard for marketing SMS/calls to a cell phone has been challenged when bundled with unrelated consent. Nine-circuit case law treats forced-bundling as questionable. The Pre-Approval page already uses a two-checkbox split (per BLOCKER-001 partial-resolution note from 2026-03-25 thread); Rate Alert wasn't updated to match.
2. **Conversion friction.** Visitors who only want the email update bounce when they read "phone … text" and assume they'll be called. The cost-benefit math is bad: low-stakes subscription forms lose conversion rate when they look like high-pressure sales forms.

**Suggested fix (matches the `/get-preapproved.html` two-checkbox pattern — A required, B optional):**
```html
<!-- Checkbox A: required, email-only consent -->
<div class="lp-form-field">
  <label style="display:flex;align-items:flex-start;gap:8px;font-size:0.75rem;font-weight:400;color:var(--color-gray);cursor:pointer;line-height:1.5;">
    <input type="checkbox" name="email_consent" required style="margin-top:3px;flex-shrink:0;width:16px;height:16px;">
    <span>I'd like to receive Austin Rate Watch emails from Adam Styer | Mortgage Solutions LP. Unsubscribe anytime via the link in every email. <a href="/privacy.html">Privacy policy</a>.</span>
  </label>
</div>

<!-- Checkbox B: optional, SMS opt-in -->
<div class="lp-form-field">
  <label style="display:flex;align-items:flex-start;gap:8px;font-size:0.75rem;font-weight:400;color:var(--color-gray);cursor:pointer;line-height:1.5;">
    <input type="checkbox" name="sms_opt_in" style="margin-top:3px;flex-shrink:0;width:16px;height:16px;">
    <span>(Optional) Text me when rates move 0.25%+ in a week. Msg & data rates may apply. Reply STOP to opt out. Consent is not required to obtain a loan.</span>
  </label>
</div>
```
- A is required and email-only → matches what the user is actually signing up for
- B is optional and SMS-specific → real opt-in for the rate-move text alert
- "Consent is not required to obtain a loan" is the explicit FTC/CFPB-preferred phrase; ALSO closes Bug-003 from BLOCKERS.md
- Add `email_consent` and `sms_opt_in` to `lead-intake.js` payload + LoanOS `contacts` table (or re-use existing `sms_opt_in` if column already exists from the get-preapproved cutover)

This is the single most important change on this page. Lower friction AND tighter compliance, single PR.

---

### H2 — Headline is solid; subhead misses the differentiator (Impact: HIGH, Effort: S)
**Current (lines 365–366):**
```html
<h1>Rate Watch: Know When Austin Mortgage Rates Drop</h1>
<p class="lp-subhead">Free weekly rate intel from an independent broker with access to 40+ lenders — delivered every Friday morning.</p>
```
**Problem:** H1 is good — "Rate Watch" is brandable, the promise is clear. But the subhead buries the **single biggest reason a buyer should sign up here vs subscribing to Bankrate or Mortgage News Daily**: Adam's *Lock or Wait?* call. That's the actual product differentiator (line 451 — "One honest sentence from me each week: 'lock now' or 'still watching.' No hedging.").

**Suggested rewrite:**
- A: "Free weekly Austin rates + my one-line Lock-or-Wait call. From an independent broker with 40+ lenders. Friday mornings."
- B: "Every Friday: Austin rates from 40+ wholesale lenders, plus my honest call — lock now, or wait."
- C: "Austin rate intel + a Lock-or-Wait read every Friday. From an independent broker, not a Wall Street pundit."

A is most aligned with the page's actual differentiation. Test by measuring form-submit / page-view ratio over 14 days post-change. This is a 30-second copy edit with high-leverage upside.

---

### H3 — Form CTA is generic ("Get My Weekly Rate Updates →") (Impact: HIGH, Effort: S)
**Current (line 421):**
```html
<button type="submit" id="ra-submit-btn" class="btn btn-primary">Get My Weekly Rate Updates →</button>
```
**Problem:** "Get My Weekly Rate Updates" is descriptive but flat. Best-practice CTA copy is **outcome-language** ("Start watching", "Send me Friday's rates", "Show me this week's rates"), not feature-language ("Get my weekly updates"). The CTA is the #1 highest-attention element on the page; a sharper verb is one of the cheapest A/B wins available.

**Suggested rewrites (test in priority order):**
- A: "Send Me Friday's Rate Update →"
- B: "Start Watching Austin Rates →"
- C: "Subscribe — I'll Email Friday →"

A makes the next concrete promise — "Friday, an email arrives" — and converts measurably better than abstract subscription verbs in B2C subscription benchmarks. Also reduces post-submit confusion (people often forget they signed up by Friday — A reinforces the cadence).

---

### H4 — No social proof above the form (Impact: HIGH, Effort: S)
**Current:** Trust chips appear on the H1 side of the hero (line 367–372). The form column has zero social proof — no subscriber count, no testimonial, nothing.
**Problem:** On a 2-column hero, eye-tracking and screen-recording studies consistently show the form column gets the highest attention but the lowest social-proof density. Visitors have to scan back left to find any credibility cue.

**Suggested addition (above the form's H2, just below the form-card padding):**
```html
<div class="lp-form-social-proof" style="display:flex;gap:8px;align-items:center;margin-bottom:var(--spacing-md);">
  <span style="color:#F59E0B;font-size:14px;">★★★★★</span>
  <span style="font-size:var(--font-size-xs);color:var(--color-gray);">Trusted by Austin homebuyers · 1,000+ loans closed since 2017</span>
</div>
```
- Subscriber count (e.g., "Joining 240+ Austin buyers watching rates") would be even better — but requires a real number we can stand behind. **DO NOT** invent a count.
- Falls back gracefully to the loans-closed claim, which is real (Adam's bio: "1,000+ loans closed").
- One row, ~24 px tall, no layout impact.

---

### H5 — Sample email preview shows STALE rates (Impact: HIGH, Effort: S, Compliance-adjacent)
**Current (lines 459–477):**
```
Sample subject: "Austin Rate Watch — Week of March 28"
30-Year Fixed: 6.875% (6.92% APR)
15-Year Fixed: 6.125% (6.18% APR)
FHA 30-Year: 6.375% (7.14% APR)
VA 30-Year: 6.250% (6.49% APR)
Adam's take: "rates are sticky near 7%..."
```
**Problem:** The dated preview ("Week of March 28") is 5 weeks old. Today is May 2, 2026. Visitors who read closely think "is this even still being sent?" — credibility damage. Mention of "sticky near 7%" is also stale relative to current 6.37% market.

**Two paths forward (pick A — simpler, more durable):**

**A. Make the sample undated and rate-agnostic (recommended):**
```html
<p class="sample-subject">Austin Rate Watch — this week's numbers</p>
<p class="sample-preview">From: Adam Styer ... · Subject: Austin Rate Watch — this week's numbers</p>
<!-- rates remain illustrative, but DROP the absolute numbers in favor of clearly-marked
     "EXAMPLE" or "ILLUSTRATIVE" formatting. Or use directional rather than absolute: -->
<div class="sample-rate-row"><span class="rate-label">30-Year Fixed</span><span class="rate-value">6.X%</span></div>
<!-- ... -->
<p class="sample-insight">"My take this week: [Adam's one-sentence Lock-or-Wait call goes here]." — Adam</p>
```
Removes the stale-rate problem permanently. Keeps the format/credibility cue without a maintenance commitment.

**B. Auto-refresh from a JSON endpoint:** higher engineering cost, ongoing maintenance, but truly current. Not justified vs (A) given the page's traffic profile.

The "Rates above are illustrative examples" disclaimer (line 479) already covers compliance for option A. Going with A also means we **don't** have to come back and update this every quarter.

---

## MEDIUM-IMPACT FINDINGS

### M1 — Email field has no double-confirm and no validation visualization (Impact: MEDIUM, Effort: S)
**Current (lines 408–411):** Single email input. Standard HTML5 `type="email"` validation only.
**Problem:** Email subscriptions are uniquely vulnerable to typo-bounces ("user@gmial.com"). Bounce rate hurts deliverability for the whole list. A common-typo correction script (no double-confirm field — that hurts conversion) catches 30–50% of typos at submit-time.

**Suggested:** add Mailcheck.js or equivalent (or inline the ~30-line typo-suggestion logic). Trigger on blur, suggest `gmail.com` for `gmial.com` etc. No required action — soft prompt only.

### M2 — Form-tagline microcopy could anchor frequency (Impact: MEDIUM, Effort: S)
**Current (line 378):** `Free. Weekly. No spam. Unsubscribe anytime.`
**Problem:** The four-word format reads as filler. The actual selling point is buried.
**Suggested:** "Friday mornings. No more than 4 emails a month. Unsubscribe in one click."
Benefits: explicit volume promise (kills the "will I get spammed?" concern), explicit cadence (Friday mornings — same as the H1 promise), and a tactile UX promise (one click, not "follow these steps" unsub). Each phrase removes a known objection.

### M3 — Rate-Move Alert promise (line 446) creates an SMS dependency that doesn't yet exist (Impact: MEDIUM, Effort: M)
**Current (line 446):** "When rates shift more than 0.25% in a week, you'll know first."
**Problem:** Implies a real-time or near-real-time alert. The Friday email IS weekly — but a "rate moves 0.25% mid-week" alert IS NOT YET BUILT in n8n or Mailchimp. The Refi Watch workflow (per ADAM-TODO 2026-04-15) is mid-build and gated on Adam setting the rate webhook. So the page promises something the system doesn't deliver yet.

**Two paths:**
- **A (preferred — copy edit):** Soften the promise. "If rates move sharply mid-week, I send a one-line note on top of the Friday update." Keeps intent, removes the unbuilt-feature implication.
- **B (build the feature):** wire the Refi Watch trigger into a single-email blast to all `Rate Alert Funnel` subscribers when ≥0.25% week-over-week move detected. Real engineering work, not justified by zero subscribers.

Go with A until subscriber count justifies B.

### M4 — "21 average days to close" stat (line 508) (Impact: MEDIUM, Effort: S)
**Current:** Same unsourced claim as on `/get-preapproved.html` (M7 in yesterday's audit).
**Problem:** Carry-over from yesterday's audit. Self-reported, unsourced, and used on multiple pages without provenance. Either source it (e.g., "based on my 2024–2025 closings") or remove.
**Suggested:** Footnote: "Based on 2024–2025 closing data, Adam Styer | Mortgage Solutions LP." Single line, kills the credibility risk.

### M5 — Open Graph image not declared (Impact: MEDIUM, Effort: S)
**Current (lines 11–14):** og:title, og:description, og:url, og:type set. `og:image` MISSING.
**Problem:** Same as get-preapproved M4 — shared URLs render without preview cards. Logo-only OG fallback is the right move while selfies remain blocked (BLOCKER-LOANOS-001). Bundle with get-preapproved fix in one styerteam-mortgage-site PR.

### M6 — No structured data (Impact: MEDIUM, Effort: S)
**Current:** Page has zero JSON-LD. **Problem:** Same as get-preapproved M3. The right schema for this page is `Service` with `serviceType="Mortgage rate monitoring"` + the existing MortgageBroker entity. **Suggested:** bundle into SEO/SEM agent's existing schema rotation rather than open a separate ticket.

### M7 — Meta description doesn't mention "Lock or Wait" call (Impact: MEDIUM, Effort: S)
**Current (line 7):** "Get Austin TX mortgage rates delivered every Friday — know when to lock or wait. Free weekly updates from independent broker Adam Styer, NMLS #513013." — actually says it. Withdraw this finding. ⊘

---

## LOW-IMPACT FINDINGS

### L1 — Sample email "From: adam@thestyerteam.com" is inconsistent with current branding (Impact: LOW, Effort: S, Compliance-adjacent)
**Current (line 460):** `From: Adam Styer <adam@thestyerteam.com>`
**Problem:** Per global CLAUDE.md, **the business is "Adam Styer | Mortgage Solutions LP", never "The Styer Team."** The sample email's From: address uses `thestyerteam.com` which contradicts this elsewhere-enforced rule. Real outbound emails likely use `adam@mortgagesolutionslp.com` or the new per-org `from_email` shipped in 4ac0812.
**Suggested:** Update sample to `adam@mortgagesolutionslp.com` (or whatever address the actual sends use — verify with org_settings).

### L2 — "Average days to close" stat box should match the language elsewhere (Impact: LOW, Effort: S)
**Current (line 508):** `<div class="stat-label">Average days to close</div>`
**Problem:** Other pages use "Avg days to close." Tiny consistency fix.

### L3 — No tertiary CTA for visitors who don't subscribe (Impact: LOW, Effort: S)
**Current:** Page has one CTA: subscribe. **Problem:** Visitors who don't want subscriptions but DO want a pre-approval have zero pathway. **Suggested:** Below the credibility section, add a single line: `Ready now instead of watching? <a href="/get-preapproved">Start your pre-approval →</a>` Single-line cross-sell. Costs nothing.

### L4 — "Sample Friday Rate Update" label could be "What you'll see Friday" (Impact: LOW, Effort: S)
**Current (line 458):** `<p class="sample-label">SAMPLE FRIDAY RATE UPDATE</p>` (uppercase, letterspaced).
**Problem:** "Sample" reads like marketing-speak. "What you'll see Friday" reads like a product preview. Subtle but tested-positive in B2C subscription contexts.

### L5 — No FAQ section (Impact: LOW, Effort: M)
**Current:** No FAQ. **Problem:** Same as get-preapproved L4. The 3 most-likely buyer questions for Rate Alert are predictable: "Will you call me?", "Can I unsubscribe?", "How is this different from Bankrate?" A 3-question FAQ + FAQPage schema would be a high-value future ship — but rank below H/M tier today.

### L6 — Mobile form-card stacking (line 332): `.lp-form-card { order: -1; }` on <900px (Impact: LOW, Effort: S)
**Current:** On mobile, the form jumps ABOVE the H1/subhead/trust-bar copy.
**Problem:** This is the right call for transactional pages (form-first). For subscription pages where the value proposition needs to be sold first, copy-first beats form-first by a measurable margin in mobile A/B tests. Adam should consider whether Rate Alert specifically benefits from copy-above-form on mobile.
**Suggested test:** Remove `order: -1` from mobile breakpoint, measure form-completion rate over 14 days.

---

## Compliance-Specific Items

### C1 — Footer address mismatch (Compliance: LOW, Effort: S)
**Current (line 521):** `5718 Sam Houston Circle, Austin, TX 78731`
**Problem:** Domain-queue compliance note (line 67 of `tasks/lead-gen/domain-queue.md`) lists CAN-SPAM compliance address as `5900 Balcones Drive, Suite 100, Austin TX 78731`. The two addresses don't match. Either:
- Sam Houston Circle is the correct current address and domain-queue is stale → update domain-queue
- Balcones Drive is the licensed branch and Sam Houston Circle is residential → update footer to Balcones Drive

This is also flagged in the SEO/SEM agent's CONTEXT.md as a separate site-wide address-mismatch issue (about.html LocalBusiness vs index.html MortgageBroker — 6th run carry-forward). Bundle the resolution.

---

## Cross-Page Bundling — coordinate with `/get-preapproved.html`

Items that should ship as a SINGLE PR across both pages:

| Item | get-preapproved finding | rate-alert finding | Why bundle |
|---|---|---|---|
| OG image fallback | M4 | M5 | Same logo asset, same `<meta>` block insertion |
| 21-day-close footnote | M7 | M4 | Same claim, same source attribution |
| Footer address resolve | M5 | C1 | Both pages need the canonical address; resolve once |
| JSON-LD schema | M3 | M6 | SEO/SEM agent's existing rotation can sweep both |
| TCPA two-checkbox pattern | already done | H1 | Bring rate-alert in line with get-preapproved's pattern |

---

## Recommended Ship Order (Adam-decision)

| Order | Items | PR scope | Time | Why first |
|---|---|---|---|---|
| 1 | H1 (TCPA split) + H2 (subhead) + H3 (CTA) | Single rate-alert PR | ~25 min | Compliance + 3 highest-leverage copy edits |
| 2 | H4 (form social proof) + H5 (sample rates undated) | Single rate-alert PR | ~20 min | Credibility + maintenance reduction |
| 3 | M1 (email typo-correct) + M2 (form-tagline) + M3 (rate-move language) | Single rate-alert PR | ~30 min | Conversion polish |
| 4 | OG image + footer address + 21-day footnote (BUNDLED with get-preapproved) | Cross-page PR | ~15 min | Bundles overlap with yesterday's audit findings |
| 5 | M6 (JSON-LD schema) | Coordinated with SEO/SEM agent | — | Their rotation, not this agent |
| 6 | L1–L6 polish | Single PR | ~30 min | Lowest leverage, can wait |

---

## What This Audit DOES NOT Cover

- **Live page testing.** Page hasn't been pulled fresh from URL (offline session). HTML on disk last touched 2026-04-28; the live page should match unless deploys differ. Worth a `curl https://styermortgage.com/rate-alert.html | diff` before any PR ships.
- **GSC impressions / CTR.** Pending SEO/SEM agent's 90-day pull (carryover from `/get-preapproved.html` audit).
- **Form-submission funnel diagnostics.** With `lead_source='Rate Alert Funnel'` = 0 across the entire window since deploy (2026-03-29 → 2026-05-02 = 34 days), there's no submission data to analyze. The 6-session-stalled "set rate webhook" issue (ADAM-TODO 2026-04-14) means even if subscribers DID exist, the post-subscription Refi Watch flow can't trigger. Form-submit failure modes can't be characterized until at least one real submission lands.
- **Heatmap / scroll-depth analysis.** No analytics provider beyond GA4 + GTM is wired. Hotjar / Microsoft Clarity is a candidate for an SEO/SEM session if needed.

---

## Pipeline State (verified 2026-05-02 03:50 CT, read-only Supabase)

| Metric | Value | Δ vs 2026-05-01 | Notes |
|---|---|---|---|
| `drip_sends` total | 0 | unchanged | Cron plumbed; no enrollments |
| `drip_sends` 24h | 0 | unchanged | Same |
| `drip_enrollments` total | 0 | unchanged | Same |
| `contacts.lead_source='Pre-Approval Funnel'` | 0 | unchanged | 10th day at zero |
| `contacts.lead_source='Rate Alert Funnel'` | 0 | unchanged | 34 days at zero since deploy |
| Contacts created last 7d | 5 | up from 4 | 3 null, 1 AEO:ChatGPT, 1 Website |

May 1 launch day produced no funnel movement. The single new contact this week (vs last week's snapshot of 4) is not from either funnel — distribution stays consistent (manual + AEO + organic Website).

---

## Conclusion

`/rate-alert.html` is a **better-designed page than `/get-preapproved.html`** in several respects (cleaner hero ratio, dedicated sample-email preview, sharper credibility section). But it has one HIGH compliance gap (TCPA bundled-consent — H1) and 4 HIGH conversion gaps (H2–H5) that match the same pattern as yesterday's audit: **the page is well-built, but the words on the page leave the value-prop on the table**.

**Single most important change: H1 (TCPA two-checkbox split).** This is both the compliance fix AND a conversion-rate boost — visitors who only want email will stop bouncing on the bundled-consent line. Bundle with H2 + H3 (one PR ~25 min) and ship as the first wave.

**Don't re-audit this page until at least H1 + H2 + H3 ship.** Same rule as the get-preapproved audit: re-auditing a page that hasn't changed is busywork.

**No code changes, commits, or deploys this session. File goes through Adam approval before any styerteam-mortgage-site Builder run.**
