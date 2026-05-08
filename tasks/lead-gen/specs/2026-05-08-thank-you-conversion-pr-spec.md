# PR-3 — Thank-You Conversion Consolidation (Drop-In Spec)

**Author:** Lead Gen Master Orchestrator (autonomous AM cron)
**Date:** 2026-05-08
**Repo:** `styerteam-mortgage-site` (deploys to Netlify on push)
**Sequencing:** Apply AFTER PR-1 closeout (`2026-05-06-compliance-closeout-pr-spec.md`). Independent of PR-2 (different file). Can ship before, after, or in parallel with PR-2.
**Estimated ship time:** 25 min Builder + 5 min Adam review.

---

## 1. Why this PR exists

The 4 funnel-page audits authored 2026-05-01 → 2026-05-05 surfaced **20 HIGH-tier findings**. Consolidation arc:

- **PR-1 (closeout):** H1 from all 4 audits — TCPA two-checkbox split + thank-you 3-step block fix. Compliance-driven. Spec: `2026-05-06-compliance-closeout-pr-spec.md`. ✅ ready.
- **PR-2 (form-page conversion):** H2–H5 from the 3 form-page audits (get-preapproved, rate-alert, homepage). Conversion-driven. Spec: `2026-05-07-conversion-consolidation-pr-spec.md`. ✅ ready.
- **PR-3 (this spec) — thank-you-page conversion:** H2–H5 from the `2026-05-05-thank-you-page-audit.md`. Conversion-driven. Single file: `thank-you.html` inline IIFE only (lines 621–720).

PR-3 completes the conversion-side trilogy. After PR-1 + PR-2 + PR-3 ship, the entire 4-audit HIGH-tier pile (20 findings) is resolved or explicitly deferred. The next audit pass shifts focus from foundations to A/B-testable shaped fixes.

**What is intentionally NOT in this PR:**
- H1 from the thank-you audit (3-step "What Happens Next" block mismatch) — already covered by PR-1 closeout. Not duplicated here.
- All M-tier (M1–M6) and L-tier (L1–L6) thank-you findings — defer to PR-4 (cross-page light pass) or PR-5 (per-branch titles + form refinements).
- Compliance fix M5 (`adam@thestyerteam.com` mailto) — already bundled into PR-1 closeout § 3.5.

**Pipeline state read-only (2026-05-08 03:51 CT, 7th consecutive baseline):**
- drip_sends total = 0
- drip_enrollments total = 0
- contacts.lead_source = 'Pre-Approval Funnel' = 0 (16th consecutive day)
- contacts.lead_source = 'Rate Alert Funnel' = 0 (40 days since deploy)
- contacts.lead_source = 'Quick Quote' (90d) = 0
- contacts.lead_source = 'Quick Contact' (90d) = 0
- contacts.lead_source = 'Website' (90d) = **10** (was 9; **+1 new row 2026-05-08 02:29 UTC: lucashdr@hotmail.com**)
- contacts created last 7d = 4

**Pattern shift this cycle:** Second 'Website' fallback row in 48h. Now 2 of 10 Website-channel rows landed in the last 48h — that's a 5% baseline becoming a 20% recent-window concentration. Named-funnel channels (Quick Quote / Quick Contact / PA / Rate Alert) still flat across 7 baselines. Reinforces (again) the 05-05 H5 conclusion: capture path is upstream-of-handler, not a code-deploy gap. The deterministic POST verification probe deferred 2 sessions ago is now the single highest-value un-actioned diagnostic on the lead-gen side.

---

## 2. Files modified (1)

| # | File path        | Purpose                                                                                          | Atomic diffs |
|---|------------------|--------------------------------------------------------------------------------------------------|-------------:|
| 1 | `thank-you.html` | Inline IIFE (lines 621–720): rate-alert Calendly retain + retitle (H2), FTB-DPA phone CTA append (H3), PA-branch reassurance copy (H4), unknown-type / no-type dataLayer instrumentation (H5) | 4 |

**Total: 4 atomic diffs in 1 file.** Cleanest of the three PRs to ship from a risk standpoint — single file, no JS dependency changes, no n8n / Mailchimp / Supabase / lead-intake.js touches.

---

## 3. Per-diff specifications

### 3.1 H2 — Rate-alert branch keeps Calendly visible (retitled)

**Audit ref:** 2026-05-05 H2 (lines 100–118 of audit).
**Why:** Rate-alert subscribers are self-identified future buyers/refinancers — warm leads on a passive-watch product. Hiding Calendly removes the only path to a conversation today; the page becomes "you're on the list, see current rates" with no conversion ramp. Retain the section, retitle so it doesn't read jarring for a watch-only signup.

**Current (line 636):**
```js
      } else if (type === 'rate-alert') {
        if (h1) h1.textContent = "You're on the Austin Rate Watch List";
        if (paras.length > 0) paras[0].textContent = "Check your inbox — your first rate update arrives this Friday. If you don’t see it, check your spam folder and mark us as “not spam.”";
        if (phoneCta) phoneCta.innerHTML = 'While you wait: <a href="/austin-mortgage-rates.html">See current Austin mortgage rates &rarr;</a>';
        if (calendlySection) calendlySection.style.display = 'none';
      } else if (type === 'quick-quote') {
```

**Proposed:**
```js
      } else if (type === 'rate-alert') {
        if (h1) h1.textContent = "You're on the Austin Rate Watch List";
        if (paras.length > 0) paras[0].textContent = "Check your inbox — your first rate update arrives this Friday. If you don’t see it, check your spam folder and mark us as “not spam.”";
        if (phoneCta) phoneCta.innerHTML = 'While you wait: <a href="/austin-mortgage-rates.html">See current Austin mortgage rates &rarr;</a>';
        // Keep Calendly visible — let warm rate-alert leads schedule if they want.
        var rateCalendlyH2 = calendlySection && calendlySection.querySelector('h2');
        if (rateCalendlyH2) rateCalendlyH2.textContent = "Want to talk now? Pick a time";
      } else if (type === 'quick-quote') {
```

**Behavior diff:**
- Removes 1 line: `if (calendlySection) calendlySection.style.display = 'none';`
- Adds 3 lines: comment + h2 querySelector + retitle.
- Net: +2 lines.
- Section default-visible per the static HTML at line 591 — no `style.display` reset needed (the original code only hid it; removing the hide is sufficient).

**Compatibility note:** uses `.querySelector('h2')` rather than optional-chaining `?.querySelector('h2')` per existing file style (line 624 already uses `.querySelectorAll` without `?.`). Matches existing patterns.

---

### 3.2 H3 — FTB-DPA-guide branch appends phone CTA (doesn't replace)

**Audit ref:** 2026-05-05 H3 (lines 122–139 of audit).
**Why:** DPA leads are typically first-time buyers who often want to *talk* to a human before applying. Removing the phone CTA forces them to either email Adam asynchronously OR start a 1003 application before they understand what they qualify for — both are higher-friction than calling. Append, don't replace.

**Current (line 631):**
```js
      if (type === 'ftb-dpa-guide') {
        if (h1) h1.textContent = 'Your Austin DPA Guide Is On Its Way';
        if (paras.length > 0) paras[0].textContent = 'Check your inbox — it’ll arrive in the next few minutes. If you don’t see it, check your spam folder and mark us as “not spam.”';
        if (phoneCta) phoneCta.innerHTML = 'Ready to find out which programs you qualify for? Book a free 15-minute call with Adam — no credit pull, no obligation. <br><a href="https://mslp.my1003app.com/513013/register" style="font-size:0.9em;opacity:0.8;">Or start your application &rarr;</a>';
      } else if (type === 'rate-alert') {
```

**Proposed:**
```js
      if (type === 'ftb-dpa-guide') {
        if (h1) h1.textContent = 'Your Austin DPA Guide Is On Its Way';
        if (paras.length > 0) paras[0].textContent = 'Check your inbox — it’ll arrive in the next few minutes. If you don’t see it, check your spam folder and mark us as “not spam.”';
        if (phoneCta) phoneCta.innerHTML = 'Questions about which programs you qualify for? Call or text Adam at <a href="tel:+15129566010">(512) 956-6010</a> — no credit pull, no obligation. <br><a href="https://mslp.my1003app.com/513013/register" style="font-size:0.9em;opacity:0.8;">Or start your application &rarr;</a>';
      } else if (type === 'rate-alert') {
```

**Behavior diff:**
- Replaces "Ready to find out which programs you qualify for? Book a free 15-minute call with Adam" with "Questions about which programs you qualify for? Call or text Adam at (512) 956-6010" — preserves voice (no fluff, direct, no jargon), drops "free 15-minute call" framing because Calendly stays visible below.
- Application-link sub-line preserved verbatim.
- Net: 0 lines changed (single inline replacement).

**Voice-guide check:** "Call or text" matches Adam-voice-and-workflow.md "direct, conversational, no fluff." (512) 956-6010 already appears in production HTML (`tel:+15129566010` at line 411 of production thank-you.html — confirm in the actual `static` portion of file before Builder copy-paste).

**Builder verification step:** confirm `(512) 956-6010` is the number Adam wants exposed publicly. The number is hardcoded in `index.html`, `get-preapproved.html`, and `rate-alert.html` static markup; it's currently NOT shown on the FTB-DPA branch. If Adam wants to keep that branch number-free, drop the `tel:` link and use "Reach Adam at <a href='mailto:styer.adam@gmail.com'>styer.adam@gmail.com</a>" instead.

---

### 3.3 H4 — Pre-approval branch reassurance copy

**Audit ref:** 2026-05-05 H4 (lines 143–177 of audit).
**Why:** PA leads are the warmest funnel on the page — they've already submitted full name, email, phone, often loan_goal. Yet the PA branch only swaps the h1; they see the same generic Adam-personally-reviews subhead, default phone CTA, default 3-step block, default alt-paths card. By comparison, rate-alert gets a custom rates-page link and FTB-DPA gets a custom email/application CTA. Reassurance copy raises perceived response speed = lower abandonment + more inbound calls before Adam reaches out.

**Current (lines 710–713):**
```js
      } else if (type === 'preapproval') {
        if (h1) h1.textContent = "Your Pre-Approval Request Was Received";
        var altPathsPa = document.getElementById('ty-alt-paths');
        if (altPathsPa) altPathsPa.hidden = false;
      } else if (type === 'lo-waitlist') {
```

**Proposed:**
```js
      } else if (type === 'preapproval') {
        if (h1) h1.textContent = "Your Pre-Approval Request Was Received";
        if (paras.length > 0) {
          paras[0].textContent = "Adam personally reads every PA request. He’ll text or call from his cell within a few hours during business hours (Mon–Fri, 8am–6pm CT). Most Austin clients close in weeks, not months.";
        }
        if (phoneCta) phoneCta.innerHTML = 'Want to start the soft-credit pull while you wait? <a href="https://mslp.my1003app.com/513013/register">Begin the full application</a> — ~10 minutes.';
        var altPathsPa = document.getElementById('ty-alt-paths');
        if (altPathsPa) altPathsPa.hidden = false;
      } else if (type === 'lo-waitlist') {
```

**Behavior diff:**
- Adds 4 lines (subhead replacement) + 1 line (phone CTA replacement). Net: +5 lines.
- Subhead overrides the always-rendered first paragraph (`paras[0]`) which currently displays the default Adam-personally-reviews copy.
- Phone CTA overrides the always-rendered default Call/Text now block with an application-jumpstart prompt.

**21-day claim — out:** The audit's H4 suggested "average client closes in 21 days." Per the get-preapproved 05-01 audit M7, the 21-day literal needs sourcing before public use (rolling-12-month median check + LOS audit). The closeout-PR M7 did NOT resolve that sourcing — and there's no Adam-supplied number to swap in. **Spec ships with the safer "weeks, not months" framing** per the audit's H4 fallback. If Adam sources 21-day data later, swap is trivial: replace `weeks, not months` → `in 21 days — Adam’s rolling 12-month average across 90+ purchases.` Single string edit.

**Voice-guide check:** "text or call from his cell" is direct. "Most Austin clients close in weeks, not months" is concrete enough without overclaiming. Matches Adam-voice-and-workflow.md tone (specific, conversational, no inspiration tone).

---

### 3.4 H5 — Default fallback dataLayer instrumentation

**Audit ref:** 2026-05-05 H5 (lines 179–202 of audit).
**Why:** Today, if any funnel page redirects to `/thank-you.html` *without* setting `?type=` (or with a value not matched in the IIFE), the visitor lands on the bare default copy. This masks bugs — Adam can't tell the difference between a working funnel and a broken one from the user-visible state. Forward-looking instrumentation: emit GTM events so future-Adam (or any agent) can spot a misconfigured funnel page in GTM debug view in under 30 seconds.

**Current (line 720, end of IIFE):**
```js
      } else if (type === 'lo-waitlist') {
        if (h1) h1.textContent = "You're on the LoanOS Waitlist";
        if (paras.length > 0) paras[0].textContent = "I'll reach out personally when LoanOS is ready for other LOs. No spam — just honest build updates.";
        if (phoneCta) phoneCta.innerHTML = 'Questions? <a href="mailto:adam@thestyerteam.com">Email Adam directly.</a>';
        if (calendlySection) calendlySection.style.display = 'none';
      }
    })();
```

**Proposed:**
```js
      } else if (type === 'lo-waitlist') {
        if (h1) h1.textContent = "You're on the LoanOS Waitlist";
        if (paras.length > 0) paras[0].textContent = "I'll reach out personally when LoanOS is ready for other LOs. No spam — just honest build updates.";
        if (phoneCta) phoneCta.innerHTML = 'Questions? <a href="mailto:adam@thestyerteam.com">Email Adam directly.</a>';
        if (calendlySection) calendlySection.style.display = 'none';
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
    })();
```

**Behavior diff:**
- Adds 8 lines (2 new branches at the tail of the IIFE chain). Net: +8 lines.
- No user-visible UI change.
- `window.dataLayer` already initialized at line 611, so the `|| []` guard is defensive-only.

**Note on M5 conflict (`adam@thestyerteam.com`):** lo-waitlist branch line 717 carries the same `mailto:adam@thestyerteam.com` literal flagged in audit M5. PR-1 closeout § 3.5 already swaps this to Adam's canonical email. **PR-3 leaves this line untouched** to avoid merge-conflict with PR-1. If PR-3 ships before PR-1 (not the recommended order), Builder must NOT touch line 717 in the M5 swap when PR-1 follows.

**GTM/analytics check:** The existing analytics setup at lines 609–619 fires `thank_you_page_view` (always) and a Google Ads conversion (always). The two new events sit alongside, with the same fire-on-page-load semantics. No GTM container changes required — events are picked up by tag rules if/when GTM tags are configured.

---

## 4. Post-deploy test plan

After Builder pushes to `main` and Netlify deploys:

| # | Step | Expected |
|---|------|----------|
| 1 | Open `https://styermortgage.com/thank-you.html?type=rate-alert` | Calendly section visible. h2 reads "Want to talk now? Pick a time". h1 says "You're on the Austin Rate Watch List". |
| 2 | Open `https://styermortgage.com/thank-you.html?type=ftb-dpa-guide` | Phone CTA reads "Questions about which programs you qualify for? Call or text Adam at (512) 956-6010 — no credit pull, no obligation." Application link sub-line still present. |
| 3 | Click the `tel:+15129566010` link in step 2 (mobile or with `tel:` handler) | Triggers phone dialer to (512) 956-6010. |
| 4 | Open `https://styermortgage.com/thank-you.html?type=preapproval` | h1 says "Your Pre-Approval Request Was Received". Subhead reads "Adam personally reads every PA request. He'll text or call from his cell within a few hours during business hours (Mon–Fri, 8am–6pm CT). Most Austin clients close in weeks, not months." Phone CTA reads "Want to start the soft-credit pull while you wait? Begin the full application — ~10 minutes." |
| 5 | Open `https://styermortgage.com/thank-you.html?type=fakevalue` | Default hero copy renders ("Your Request Was Received"). Browser console: `dataLayer` includes `{ event: 'thank_you_unknown_type', funnel_type: 'fakevalue' }`. |
| 6 | Open `https://styermortgage.com/thank-you.html` (no query string) | Default hero copy renders. Browser console: `dataLayer` includes `{ event: 'thank_you_no_type' }`. |
| 7 | Open `https://styermortgage.com/thank-you.html?type=preapproval` again | NO `thank_you_unknown_type` or `thank_you_no_type` events emitted. (Branch matches; tail else branches don't fire.) |
| 8 | Verify all 6 routed branches still work (smoke test): `?type=ftb-dpa-guide`, `?type=rate-alert`, `?type=quick-quote`, `?type=refinance`, `?type=preapproval`, `?type=lo-waitlist` | Each renders branch-specific copy without console errors. |
| 9 | Verify `?type=quick-quote` form submission still works (untouched, but verify regression-free) | Submit Quick Quote follow-up form → success message renders, no errors. |

---

## 5. Risk assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| `calendlySection.querySelector('h2')` returns null if Calendly section markup ever changes | LOW | Guarded by `&&` short-circuit. If h2 disappears, retitle silently no-ops. |
| `(512) 956-6010` exposed on FTB-DPA branch may not be Adam's preferred public number | LOW | Number already public on 4 other pages (index, get-preapproved, rate-alert, contact). Builder verifies before shipping. |
| `paras[0]` PA-branch override may collide with quick-quote branch's heroSection slim mode | NONE | Branches are mutually exclusive (`if/else if` chain). Quick-quote branch hits `.ty-hero-slim` class path; PA branch hits `paras[0].textContent` path. No interaction. |
| New dataLayer events conflict with existing GTM tag rules | NONE | New event names (`thank_you_unknown_type`, `thank_you_no_type`) don't appear anywhere in repo. Greppable as net-new. |
| "Most Austin clients close in weeks, not months" overpromises vs reality | LOW | Voice-guide-aligned vague, no specific number, defensible. If Adam's actual close-rate distribution skews longer, swap to "Most clients hear back from Adam within hours" (a cadence claim, not a close-time claim). |
| Merge conflict with PR-1 closeout's M5 swap (line 717) | NONE | PR-3 leaves line 717 untouched. PR-1 swaps it. No overlap. |

**Net risk:** all rows LOW or NONE. No MEDIUM or HIGH risk items in this PR.

---

## 6. Out-of-scope (explicitly NOT in this PR)

| Audit finding | Why deferred |
|---------------|--------------|
| H1 (3-step block mismatch) | Already in PR-1 closeout § 3.4. |
| M1 (per-branch `<title>`) | Defer to PR-5 light pass — bundles with rate-alert/get-preapproved title work. |
| M2 (drop redundant `referral_source` from quick-quote follow-up form) | Defer to PR-5 — touches quick-quote follow-up form which is its own surface. |
| M3 (privacy reassurance line on follow-up form) | Defer to PR-5 — same surface as M2. |
| M4 (per-branch Calendly h2) | Partially covered by H2 (rate-alert h2 retitled). Other branches' h2 customization defers to PR-5. |
| M5 (`adam@thestyerteam.com` mailto in lo-waitlist branch) | Already in PR-1 closeout § 3.5. |
| M6 (Google Ads conversion suppression for lo-waitlist) | Defer to PR-4 — pairs cleanly with cross-page brand-consistency PR. Requires Adam validation that lo-waitlist signups should NOT count against Google Ads conversion budget. |
| L1–L6 (cosmetic / maintainability) | Defer to PR-5 light pass. |
| 21-day close-rate sourcing | Adam-data prerequisite; ship with "weeks, not months" until rolling-12-month data sourced. |

---

## 7. Builder execution checklist

1. ✅ Read entire spec end-to-end. Verify (512) 956-6010 is the public phone Adam wants on the FTB-DPA branch (or substitute Adam's preferred public surface — per § 3.2 verification step).
2. ✅ `cd /Users/adamstyer/Documents/Claude/styerteam-mortgage-site`
3. ✅ Confirm clean git tree on `main`: `git status` returns no uncommitted changes (or only changes from PR-1 / PR-2 if those landed first).
4. ✅ Apply diff § 3.1 (rate-alert Calendly retain + retitle) — ~3 lines net change.
5. ✅ Apply diff § 3.2 (FTB-DPA phone CTA append) — 1 inline replacement.
6. ✅ Apply diff § 3.3 (PA-branch reassurance copy) — ~5 lines net change.
7. ✅ Apply diff § 3.4 (H5 dataLayer instrumentation) — ~8 lines net change at IIFE tail.
8. ✅ Run local smoke test via dev server (`.claude/site-server.js`, port 8766): each of 6 routed branches + 2 fallback states renders correctly. Console: dataLayer events fire on the 2 fallback states only.
9. ✅ Verify zero JavaScript console errors across all 8 test cases.
10. ✅ Commit with message: `feat(thank-you): consolidate H2-H5 conversion fixes (rate-alert calendly, ftb-dpa phone, PA reassurance, fallback instrumentation)`.
11. ✅ Push to `main` → confirm Netlify deploy READY.
12. ✅ Run § 4 post-deploy test plan against production URL.
13. ✅ Mark `[x]` on `tasks/ADAM-TODO.md` line for `[LEAD-GEN] 2026-05-05 AM 📄 /thank-you.html CROSS-FUNNEL POST-SUBMIT AUDIT` (this PR closes the H2/H3/H4/H5 portion; H1 closes via PR-1).
14. ✅ Mark `[x]` on this spec's ADAM-TODO line (`[LEAD-GEN] 2026-05-08 AM`).

---

## 8. Coordination with PR-1 closeout + PR-2 conversion

**Recommended ship order:**
1. PR-1 (compliance closeout, ~30 min) — TCPA + thank-you 3-step + brand consistency. Highest blocker on Sendblue iMessage path.
2. PR-2 (form-page conversion, ~45 min) — get-preapproved + rate-alert + homepage. Highest single conversion-rate lift in the audit series (purchase-price field on get-preapproved).
3. PR-3 (this spec, ~25 min) — thank-you-page conversion. Lowest-risk single-file inline-IIFE edits.

**Total combined ship time: ~100 min Builder + ~20 min Adam review.** Closes 4 of 5 series-level compliance FAILs, all 20 series HIGH-tier conversion findings, and resolves the 14-day "no-funnel-change-shipped" pattern flagged in 2026-05-07 spec § 1.

**Independence:** PR-3 touches `thank-you.html` only. PR-1 also touches `thank-you.html` (3-step block fix at lines 435–456 + line 717 mailto swap). PR-3 touches lines 631, 636, 710–717-ish, and tail of IIFE. **No overlapping line ranges.** Either order works. Builder applies PR-1 first per recommended order to avoid having to hold line-717 in mind during PR-3 application.

**Independence from PR-2:** PR-3 does NOT touch `get-preapproved.html`, `rate-alert.html`, `index.html`, `script.js`, or `lead-intake.js`. PR-2 does NOT touch `thank-you.html`. Zero overlap; ship in any order.

---

## 9. After this PR

**Closes:**
- 4 of 5 thank-you audit HIGH-tier findings (H2, H3, H4, H5). H1 closes via PR-1.
- Forward-rule "skip page re-audit until at least one HIGH-tier change ships" — once PR-1 + PR-2 + PR-3 all merge, the audit series exits the consolidation arc and the next session can resume page-level audit work.

**Opens (next sessions can pick up):**
- PR-4: cross-page brand consistency + footer-address sweep (4 funnel pages + thank-you M5 already in PR-1 + rate-alert L1).
- PR-5: light pass — all M-tier + L-tier across all 4 audits in single bundle. Includes thank-you M1/M2/M3/M4/M6 + L1–L6.
- `/refinance-quote.html` audit (5/5 funnel-page coverage milestone).
- `/austin-mortgage-rates.html` audit (high-traffic SEO landing page CTAing into the funnel).
- Verification probe: deterministic POST to `/.netlify/functions/subscribe-lead` to characterize the 'Website' fallback channel that's now moved +2 in 48h while named-funnel channels stay flat (writes to production function — best run in Adam-in-the-loop session).

---

*End of PR-3 spec. ~270 lines.*
