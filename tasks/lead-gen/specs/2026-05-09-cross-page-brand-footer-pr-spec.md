# Cross-Page Brand Consistency + Footer-Address PR — Drop-In Spec
**Date:** 2026-05-09 AM
**Author:** Lead Gen agent (autonomous, scheduled-task SKILL.md mode)
**Type:** PR spec (for Adam authorize → Builder execute → ship to styerteam-mortgage-site)
**Status:** READY FOR ADAM REVIEW (1 small Adam-data prereq — see § 6)
**Repo touched:** `styerteam-mortgage-site` only (Netlify auto-deploy on push)
**Estimated ship time:** ~30 min Builder + ~5 min Adam review = 35 min total
**Compliance impact:** closes the residual cross-page address-disclosure gap (Texas SAFE Act / NMLS MU.4 page-level matching disclosure on `/get-preapproved.html`); removes 6 surviving `thestyerteam.com` brand-rule violations from production.

---

## 1. Why this PR exists

PR-1 (compliance closeout, 05-06), PR-2 (form-page conversion, 05-07), and PR-3 (thank-you conversion, 05-08) explicitly defer cross-page brand consistency and footer-address work to "PR-4." The 05-08 forward rule recommended PR-4 spec for tomorrow.

Even after PR-1 + PR-2 + PR-3 ship, **6 production references to `thestyerteam.com` survive on the funnel pages** (PR-1 only swaps `thank-you.html` line 717; PR-2 only swaps `rate-alert.html` sample-email line 460):

- `index.html` JSON-LD line 113 (MortgageBroker schema email)
- `index.html` JSON-LD line 226 (LocalBusiness schema email)
- `index.html` footer line 1058 (mailto + display)
- `rate-alert.html` footer line 521 (mailto + display)

Plus the page-level physical-address compliance gap on `/get-preapproved.html` (footer has NMLS + EHO but **no street address** — Texas SAFE Act / NMLS Rule MU.4 may require licensed branch address on advertising/landing pages — flagged as M5 in 05-01 audit).

Plus a thank-you M6 attribution-noise issue: the Google Ads conversion event fires unconditionally at lines 614–618, including for `?type=lo-waitlist` (LoanOS-product, not a mortgage lead).

PR-4 bundles all of this into one ship-ready PR. After PR-4 lands, the only remaining outstanding work from the 4-audit series is M-tier and L-tier polish that does not affect compliance or brand consistency (PR-5 light-pass scope).

---

## 2. Files modified (4)

| # | File | Purpose | Lines touched |
|---|------|---------|---------------|
| 1 | `index.html` | (a) JSON-LD MortgageBroker email swap, (b) JSON-LD LocalBusiness email swap, (c) footer mailto + display swap, (d) optional footer address verification | 113, 226, 1058 (+ optional 1059) |
| 2 | `rate-alert.html` | Footer mailto + display swap (line 521) — same line carries `email + address`, both in scope | 521 |
| 3 | `get-preapproved.html` | Add physical address line to footer disclosure (currently absent — M5 gap) | 499 |
| 4 | `thank-you.html` | Wrap Google Ads conversion gtag in per-branch suppression for `?type=lo-waitlist` (M6) | 609–619 |

No backend code changes. No `script.js` / `subscribe-lead.js` / `lead-intake.js` changes. No Mailchimp / Supabase / n8n changes.

---

## 3. Per-file diffs

### 3.1 `index.html` — JSON-LD MortgageBroker email (line 113)

**Current:**
```json
    "email": "adam@thestyerteam.com",
```

**Proposed:**
```json
    "email": "styer.adam@gmail.com",
```

**Rationale:** Per global CLAUDE.md, "never use 'The Styer Team'." The user-facing email shown in CONTEXT.md / userEmail is `styer.adam@gmail.com`. JSON-LD `email` is consumed by Google's Knowledge Graph for entity matching; a deprecated-domain literal here can leak the old brand into rich-result cards. (Alternative: `adam@adamstyer.com` — see § 6 Adam-data prereq for canonical pick.)

### 3.2 `index.html` — JSON-LD LocalBusiness email (line 226)

**Current:**
```json
    "email": "adam@thestyerteam.com",
```

**Proposed:**
```json
    "email": "styer.adam@gmail.com",
```

**Rationale:** Same as 3.1 — second JSON-LD block (LocalBusiness type vs MortgageBroker type). Google parses both. Consistency rule: same email literal everywhere on this page.

### 3.3 `index.html` — footer Contact block (line 1058)

**Current (lines 1056–1060):**
```html
          <p>
            <a href="tel:+15129566010">(512) 956-6010</a><br>
            <a href="mailto:adam@thestyerteam.com">adam@thestyerteam.com</a><br>
            5718 Sam Houston Circle<br>
            Austin, TX 78731
          </p>
```

**Proposed:**
```html
          <p>
            <a href="tel:+15129566010">(512) 956-6010</a><br>
            <a href="mailto:styer.adam@gmail.com">styer.adam@gmail.com</a><br>
            5718 Sam Houston Circle<br>
            Austin, TX 78731
          </p>
```

**Rationale:** Public-facing mailto link is the most obvious brand surface. mailto: links open the user's email client with the literal "to:" address visible — the deprecated-brand domain is read by every visitor who clicks it. Address line **kept verbatim as Sam Houston Circle** pending § 6 Adam-data prereq decision.

### 3.4 `rate-alert.html` — footer (line 521)

**Current:**
```html
      5718 Sam Houston Circle, Austin, TX 78731 | (512) 956-6010 | adam@thestyerteam.com<br>
```

**Proposed:**
```html
      5718 Sam Houston Circle, Austin, TX 78731 | (512) 956-6010 | styer.adam@gmail.com<br>
```

**Rationale:** Same brand-consistency ship as 3.3, single literal. Address kept as Sam Houston Circle pending § 6.

**Note on PR-2 coordination:** PR-2 § 3 ships rate-alert sample-email block at line 460 (separate change, different literal — `From: Adam Styer <adam@thestyerteam.com>` swapped to `adam@styermortgage.com` per PR-2 author's choice). PR-4 does NOT touch line 460. PR-2 + PR-4 land different literals on the same file but different lines — no merge conflict. **However:** PR-2 § 3.5 chose `adam@styermortgage.com` (a Resend-DKIM-verified outbound domain) for a sample-email block; PR-4 § 3.3/§ 3.4 use `styer.adam@gmail.com` for user-facing mailto links. This is intentional asymmetry — sample-email blocks should look like real outbound (DKIM domain); user-facing mailto links should land in Adam's actual inbox. **If Adam wants symmetry, swap PR-4's `styer.adam@gmail.com` to `adam@styermortgage.com` everywhere — all 5 instances in this PR — single 5-instance find-replace.**

### 3.5 `get-preapproved.html` — footer physical address (line 499)

**Current:**
```html
      <p class="lp-nmls">Adam Styer | Mortgage Solutions LP | NMLS #2526130 | Adam Styer | NMLS #513013 | Licensed in Texas | <a href="/texas-complaint-notice.html">Texas Consumer Complaint Notice</a> | <a href="https://www.nmlsconsumeraccess.org/EntityDetails.aspx/COMPANY/2526130" target="_blank" rel="noopener">NMLS Consumer Access</a><br>This is not a commitment to lend. All loans subject to credit approval. Equal Housing Lender.</p>
```

**Proposed:**
```html
      <p class="lp-nmls">Adam Styer | Mortgage Solutions LP | NMLS #2526130 | Adam Styer | NMLS #513013 | Licensed in Texas | <a href="/texas-complaint-notice.html">Texas Consumer Complaint Notice</a> | <a href="https://www.nmlsconsumeraccess.org/EntityDetails.aspx/COMPANY/2526130" target="_blank" rel="noopener">NMLS Consumer Access</a><br>5718 Sam Houston Circle, Austin, TX 78731<br>This is not a commitment to lend. All loans subject to credit approval. Equal Housing Lender.</p>
```

**Rationale:** 05-01 audit M5 — page-level address disclosure under Texas SAFE Act / NMLS Rule MU.4. Pattern matches `rate-alert.html` footer line 521 (also in this PR's § 3.4) so the two pages have identical disclosure structure post-ship. Address pending § 6. Spans the same `<p class="lp-nmls">` so styling carries.

### 3.6 `thank-you.html` — Google Ads conversion suppression (lines 609–619)

**Current (lines 609–619):**
```html
  <script>
    // Fire thank-you page view event for Google Ads conversion tracking (GTM relay)
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'thank_you_page_view' });

    // Fire Google Ads conversion directly (belt-and-suspenders — GTM tag pending config)
    // Conversion ID: AW-18028490942 | Label: XYcDCMqh64wcEL7h05RD
    gtag('event', 'conversion', {
      'send_to': 'AW-18028490942/XYcDCMqh64wcEL7h05RD'
    });
  </script>
```

**Proposed:**
```html
  <script>
    // Fire thank-you page view event for Google Ads conversion tracking (GTM relay)
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'thank_you_page_view' });

    // Fire Google Ads conversion directly (belt-and-suspenders — GTM tag pending config)
    // Conversion ID: AW-18028490942 | Label: XYcDCMqh64wcEL7h05RD
    // Suppress for ?type=lo-waitlist (LoanOS waitlist signup is not a mortgage lead conversion)
    var ads_type = new URLSearchParams(window.location.search).get('type');
    if (ads_type !== 'lo-waitlist') {
      gtag('event', 'conversion', {
        'send_to': 'AW-18028490942/XYcDCMqh64wcEL7h05RD'
      });
    }
  </script>
```

**Rationale:** 05-05 thank-you audit M6. Verbatim from audit recommendation. The `dataLayer.push({ event: 'thank_you_page_view' })` stays unconditional (different surface — GTM/GA4, not Ads); only the direct `gtag('event', 'conversion', ...)` Ads bid-optimization signal is gated. **lo-waitlist signups are not mortgage leads** — counting them under the same Ads label biases bid optimization away from the buyers Adam actually wants and inflates apparent ROAS. Per PR-3 § 6 deferral note, this requires Adam validation that lo-waitlist signups should NOT count against Google Ads conversion budget. Default assumption: yes, suppress (safe choice — under-counting is reversible; over-counting trains Ads bidding incorrectly and is harder to detect).

---

## 4. Test plan

After Builder pushes branch + Netlify produces preview deploy:

1. **`https://styermortgage.com/`** — view-source. Confirm:
   - Lines 113 + 226: JSON-LD `email` value is the chosen canonical (default `styer.adam@gmail.com`).
   - Line 1058: footer mailto matches.
   - **Optional Adam check:** [Google Rich Results Test](https://search.google.com/test/rich-results) on `https://<preview-url>/` confirms both JSON-LD blocks parse without errors.

2. **`https://styermortgage.com/rate-alert.html`** — view-source. Confirm:
   - Line 521: footer email is canonical, no `thestyerteam.com`.
   - Line 460 (sample-email block): unchanged from PR-2's `adam@styermortgage.com` literal (or unchanged from current `thestyerteam.com` literal if PR-2 hasn't shipped yet — PR-4 does NOT touch this line).

3. **`https://styermortgage.com/get-preapproved.html`** — view-source. Confirm:
   - Line 499: footer disclosure now contains `5718 Sam Houston Circle, Austin, TX 78731` (or canonical address) on its own `<br>` line between NMLS Consumer Access and "This is not a commitment to lend."
   - Visual render: address line appears between the licensing line and the legal disclaimer, in the same lp-nmls class styling.

4. **`https://styermortgage.com/thank-you?type=lo-waitlist`** — open Chrome DevTools → Network tab → filter `googleads`. Reload. Confirm:
   - **Zero** requests to `googleads.g.doubleclick.net/pagead/conversion/...` matching the `AW-18028490942/XYcDCMqh64wcEL7h05RD` label.
   - `dataLayer.push({ event: 'thank_you_page_view' })` still fires (visible in Console under `dataLayer[…]`).

5. **`https://styermortgage.com/thank-you?type=preapproval`** — same DevTools workflow. Confirm:
   - **One** request to the conversion URL with the matching label fires.
   - This confirms suppression is gated specifically on `lo-waitlist`, not blanket-disabled.

6. **`https://styermortgage.com/thank-you?type=quick-quote`** + `?type=rate-alert` + `?type=ftb-dpa-guide` + `?type=refinance` + no-`?type=` (default) — same DevTools workflow on each. All five should fire the conversion. Only `lo-waitlist` should NOT fire.

7. **`grep -r "thestyerteam.com" .`** at the styerteam-mortgage-site repo root after merge to main. Expected: only `about.html` (lines 53, 874) still contains the literal — explicitly out of scope (about.html is not a funnel page; SEO/SEM agent's tracking pile). Funnel pages should be 0 hits.

8. **NMLS / Texas SAFE Act sanity check (optional, Adam-only):** confirm the address chosen for § 3.5 / § 3.3 / § 3.4 is the licensed-branch-of-record per the company's NMLS MU.4 record. If Adam wants to use a different licensed-branch address (e.g., a separate Mortgage Solutions LP branch registration), substitute uniformly in all three diffs.

9. **Visual regression sanity:** desktop + mobile render of homepage footer Contact block; rate-alert footer; get-preapproved footer. Address line addition adds one `<br>` row (~22px); homepage already has 2 `<br>` rows so visual delta is zero. Get-preapproved gains one `<br>` row inside the lp-nmls block (~22px taller).

---

## 5. Compliance impact

| Item | Source audit | Closes? |
|---|---|---|
| `/get-preapproved.html` missing licensed branch address (Texas SAFE Act / NMLS MU.4) | 2026-05-01 M5 | ✅ Yes |
| `index.html` JSON-LD email literal `thestyerteam.com` (brand-rule violation × 2 schemas) | (cross-page brand) | ✅ Yes |
| `index.html` footer mailto literal `thestyerteam.com` | (cross-page brand) | ✅ Yes |
| `rate-alert.html` footer email literal `thestyerteam.com` | 2026-05-02 M5 + adjacent to L1 | ✅ Yes |
| `thank-you.html` Google Ads conversion fires for lo-waitlist (mortgage funnel ROAS contamination) | 2026-05-05 M6 | ✅ Yes |
| `rate-alert.html` footer address `5718 Sam Houston Circle` vs canonical `5900 Balcones Drive` discrepancy | 2026-05-02 C1 | ⚠️ Conditionally — see § 6. PR-4 ships with current Sam Houston Circle (production reality); if Adam picks Balcones, a 1-line follow-up swap on rate-alert L521 + index L101 + L244 + L1059 + get-preapproved new line is the entire change. |

| FAIL/issue NOT closed by this PR | Why deferred |
|---|---|
| `thank-you.html` footer has no address | 05-05 audit explicitly marked **N/A** — thank-you is post-submit, not advertising/CAN-SPAM-applicable. Not bundled. |
| `about.html` carries 4 instances of Sam Houston Circle + 2 instances of `thestyerteam.com` | About page is out of funnel scope. Tracked by SEO/SEM agent (about.html LocalBusiness vs index.html MortgageBroker mismatch — 10th run carry-forward). Bundle there if/when the SEO/SEM agent ships its address-mismatch fix. |
| `index.html` JSON-LD geo coordinates (line 109–110) | If address is swapped to Balcones Drive (§ 6), the lat/long must also update or Google may flag schema-vs-display address mismatch. PR-4 does not touch lat/long; if Adam picks Balcones, follow-up swap with new geo coords needed. |

---

## 6. Adam-data prereq — canonical address

**Single 30-second decision needed before Builder ships:**

The 4 funnel pages currently use `5718 Sam Houston Circle, Austin, TX 78731` consistently (verified across `index.html` JSON-LD × 2 + footer × 1, `rate-alert.html` footer × 1, plus `about.html` JSON-LD × 2 + footer × 1). The compliance docs at `tasks/lead-gen/domain-queue.md` line 67 + `BLOCKERS.md` reference `5900 Balcones Drive, Suite 100, Austin TX 78731` as the CAN-SPAM physical address.

These do not match. One is wrong. Adam needs to confirm which is canonical:

- **(a) Sam Houston Circle is correct →** PR-4 ships as-spec'd (no diff changes); update `tasks/lead-gen/domain-queue.md` line 67 + `BLOCKERS.md` to match. SEO/SEM agent's tracker also updates.
- **(b) Balcones Drive is the licensed branch / NMLS MU.4 address →** PR-4 needs a 5-instance address swap (index.html lines 101, 244, 1059 + rate-alert.html line 521 + get-preapproved.html new line 499). All swaps are mechanical. JSON-LD geo coords (index.html lines 109–110) also need re-coding to Balcones Drive lat/long.
- **(c) Sam Houston is residential, Balcones is the licensed branch but only Balcones should appear on advertising landing pages →** swap option (b) for funnel pages, leave about.html with whichever address is the actual operating mailing address (Adam's call). This is the most legally defensible split.

**PR-4 default assumption: option (a)** — the production state across 5 files is consistent and presumably reflects Adam's working choice. If Adam picks (b) or (c), the 5-instance swap is appended in the same Builder session before push.

**Email canonical:** Default is `styer.adam@gmail.com` (per CONTEXT.md userEmail line). If Adam wants `adam@adamstyer.com` or `adam@styermortgage.com` (PR-2 sample-email choice), substitute uniformly across PR-4's 5 instances. Single 5-instance find-replace.

---

## 7. Risk assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Wrong-address (Balcones-vs-Sam-Houston) ships and triggers CFPB / Texas SAFE Act inspection citation | LOW | MEDIUM | § 6 Adam-data prereq is the gate. Default ships current production state (Sam Houston) so worst case the page-level disclosure matches existing JSON-LD on same page. If Balcones is canonical, the full 5-instance swap is a single Builder pass before push. |
| Email literal swap breaks an inbound auto-responder route on `adam@thestyerteam.com` | NONE | — | mailto: links don't route email — they open the user's compose window with the to: address pre-filled. Inbound delivery to `adam@thestyerteam.com` is governed by DNS / mail-server rules and is unchanged by this PR. The old mailbox keeps receiving any pre-existing senders' mail; the public-facing surface just stops promoting the deprecated address. |
| JSON-LD `email` swap breaks Google Knowledge Graph match | LOW | LOW | Google parses JSON-LD email but does not key entity identity off it (entity ID is keyed off `@id` / domain / NAP cluster). Swapping the email value in two schema blocks may temporarily reduce structured-data freshness signal but does not de-list the entity. Both schemas still validate; both ship complete. |
| GA4 / GTM downstream consumers depend on the unconditional `gtag('event', 'conversion', ...)` line | NONE | — | The GA4 / GTM `dataLayer.push({ event: 'thank_you_page_view' })` line is unconditional and unchanged. Only the direct Google Ads bid-optimization signal is gated (a separate API surface, not consumed by GA4). |
| `lo-waitlist` branch DOES belong as a Google Ads conversion (Adam runs LoanOS Ads campaigns under this label) | LOW | MEDIUM | Suppression is conservative — it under-counts mortgage funnel conversions in exchange for cleaner mortgage-funnel ROAS. If Adam later wants lo-waitlist counted, **change** the suppression to a separate conversion label: `if (ads_type === 'lo-waitlist') { gtag('event','conversion',{ 'send_to': 'AW-18028490942/<lo-waitlist-label>' }); } else { ... }`. Default ships with full suppression because no separate label exists today and creating one in Google Ads UI is Adam-scope. |
| Address addition on `get-preapproved.html` footer pushes lp-nmls `<p>` over single-line render in narrow viewports | LOW | LOW | Block is already two-line (NMLS line + legal disclaimer line). Adding the address as a third middle line via `<br>` adds ~22px height. Renders identically on mobile (lp-nmls `font-size` is responsive). |
| about.html out-of-scope leaves brand inconsistency | LOW | LOW | Documented in § 5 deferred table. Out-of-funnel-scope for this audit series. SEO/SEM agent's existing about.html mismatch tracking will pick up the address sweep when its branch ships (10th run). |

---

## 8. Out of scope (do NOT bundle into this PR)

- `about.html` brand + address sweep (4 Sam Houston instances + 2 thestyerteam.com instances) — SEO/SEM agent's surface, not lead-gen.
- All M-tier non-brand-non-address findings (M1 per-branch titles, M2/M3 quick-quote follow-up form fields, M4 per-branch Calendly h2, etc.) — defer to PR-5 light-pass.
- All L-tier findings — defer to PR-5 light-pass.
- TCPA two-checkbox split (already in PR-1 closeout).
- Form-page conversion polish (already in PR-2).
- thank-you IIFE conversion polish (already in PR-3).
- Loan Goal taxonomy unification (`/get-preapproved` M6 + homepage H4) — separate ~25-min PR; touches LoanOS dashboard segmentation downstream (deferred from PR-1 + PR-2).
- subscribe-lead.js / lead-intake.js / LoanOS endpoint schema changes — none required.
- Mailchimp / n8n / Supabase changes — none required.

---

## 9. Builder execution checklist

When Adam authorizes this PR, builder should:

1. **Confirm § 6 with Adam** — canonical address (Sam Houston vs Balcones) and canonical user-facing email (styer.adam@gmail vs adam@adamstyer vs adam@styermortgage). 30-sec exchange.
2. Open `styerteam-mortgage-site` repo, branch `cross-page-brand-footer-2026-05-09` (or similar).
3. If Adam picked Balcones in step 1: also swap `index.html` lines 101, 244, 1059 + `rate-alert.html` line 521 from Sam Houston to Balcones, AND update `index.html` lines 109–110 geo coords (Balcones lat/long). Otherwise skip.
4. If Adam picked an alternate email in step 1: substitute uniformly across all 5 mailto/email instances in this PR.
5. Apply the 6 diffs above (3.1–3.6). Match indentation exactly.
6. `git add` only the 4 touched files: `index.html`, `rate-alert.html`, `get-preapproved.html`, `thank-you.html`.
7. Local manual verification in `.claude/site-server.js` (port 8766): run test-plan steps 1–6 against localhost.
8. `git commit -m "brand+compliance: cross-page email/address sweep + thank-you Ads suppression for lo-waitlist"` (single commit; do not split).
9. `git push origin <branch>` — Netlify auto-builds preview.
10. Run test-plan steps 1–9 against the preview deploy URL.
11. Adam merges to main → Netlify production deploy → re-run test plan against production URL.
12. Update `tasks/lead-gen/domain-queue.md` line 67 with the canonical address (so future agent sessions read consistent ground truth).
13. Update `tasks/ADAM-TODO.md` — flip the cross-page-brand-footer ADAM-TODO line to `[x]`. Audit lines 05-01 / 05-02 / 05-04 / 05-05 stay `[ ]` if their other-tier items are still un-shipped (they are, until PR-5 lands), or get flipped if all their tier items are now shipped (only true if PR-1 + PR-2 + PR-3 + PR-4 + PR-5 have all landed).

---

## 10. Coordination with PR-1 / PR-2 / PR-3

**Recommended ship sequence:** PR-1 → PR-2 → PR-3 → PR-4 (least risk first; brand/footer last).

| File | PR-1 lines | PR-2 lines | PR-3 lines | PR-4 lines | Conflict risk |
|---|---|---|---|---|---|
| `index.html` | 400–406 (TCPA hero), 706–712 (TCPA quick-contact) | 1 combined hero diff (form subhead + CTA — line range TBD per PR-2 § 3.6) | none | 113 (JSON-LD email), 226 (JSON-LD email), 1058 (footer email) | NONE — all four touch different line ranges |
| `rate-alert.html` | 413–419 (TCPA) | 360–479 (hero/form/sample-email block; specifically L460 sample From) | none | 521 (footer email) | NONE — three different line ranges |
| `get-preapproved.html` | 386–391 (TCPA tighten) | 320–407 (hero/form), 459–476 (testimonials), 510–579 (inline submit handler) | none | 499 (footer address insert) | NONE — different line ranges |
| `thank-you.html` | 628–635, 714–719 (#ty-steps hide branches), 717 (mailto swap) | none | 621–720 (IIFE only — H2/H3/H4/H5) | 609–619 (Ads conversion gate) | NONE — different line ranges |
| `script.js` | ~404–411, ~519–528 (TCPA propagate) | 1 diff (purchase_price_range body field) | none | none | NONE — different line ranges |

PR-4 is **independent** of PR-1/PR-2/PR-3. Can ship before, after, or in parallel with all three. **Recommended last** because it's lowest priority (brand polish + 1 attribution noise gate + 1 compliance gap that's been open for weeks already).

If Adam wants to bundle PR-3 + PR-4 into a single Builder push (both touch `thank-you.html` only on different line ranges, both single-file/low-risk), the combined PR is ~50 min Builder + 10 min Adam review. PR-1 + PR-2 should still ship as their own PRs — they touch different files and have higher compliance impact.

---

## 11. After PR-4 ships — what's left from the 4-audit pile?

**Audit series accounting (post-PR-4 hypothetical state):**

| Tier | Total findings across 4 audits | Shipped after PR-1+2+3+4 | Remaining |
|---|---|---|---|
| HIGH | 20 (5 per audit avg) | 20 | 0 |
| MEDIUM | ~24 (6 per audit avg) | ~6 (M5 × 3 footer-address + M5 × 1 thank-you brand + M6 thank-you Ads + M5 rate-alert email = 6) | ~18 |
| LOW | ~24 | 0 | ~24 |
| Compliance FAILs | 5 series-level | 5 | 0 |

Remaining ~18 M-tier + ~24 L-tier items are PR-5 light-pass scope: per-branch titles, meta descriptions, quick-quote follow-up form refinements, JSON-LD MortgageBroker schema across non-homepage pages, OG image fallbacks, Loan Goal taxonomy unification, etc. None block compliance, none block conversion at the same leverage as the 20 HIGH-tier items.

**After all 5 PRs ship**, the agent has nothing left to consolidate from the existing audit pile and must shift to either: (a) `/refinance-quote.html` audit (5/5 funnel coverage), (b) `/austin-mortgage-rates.html` audit (high-traffic SEO landing capture surface), (c) deterministic POST verification probe to characterize the upstream Website-fallback path (now revealed to be SEO-agent manual inserts rather than form submissions — see § 13), or (d) Architect-mode strategic work on net-new lead-gen channels.

---

## 12. Why agent didn't ship this directly

Per `tasks/lead-gen/master-agent.md` STEP 6, the master orchestrator runs Sequence A (Research only) when there is no Adam authorize signal. Sequence C (Execute) requires either: (a) an explicit ADAM-TODO `[x]` authorization line, (b) a brand-new spec that Adam has acknowledged in chat, or (c) a Builder run already in progress. None of those conditions are met for the styerteam-mortgage-site repo today. The scheduled-task SKILL.md additionally restricts this run from "write" actions outside the lead-gen project files. Authoring this spec is the highest-leverage Sequence A output available — completes the consolidation arc started 05-06.

---

## 13. Pipeline state confirmation + new Website-fallback datapoint correction

Read-only Supabase pipeline check (2026-05-09 03:46 CT, 8th consecutive baseline):

- `drip_sends` total: **0**
- `drip_enrollments` total: **0**
- `lead_source = 'Pre-Approval Funnel'` (90d): **0** (17th consecutive day)
- `lead_source = 'Rate Alert Funnel'` (90d): **0** (41 days since deploy)
- `lead_source = 'Quick Quote'` (90d): **0**
- `lead_source = 'Quick Contact'` (90d): **0**
- `lead_source = 'Website'` (90d): **8** (was 10 at 2026-05-08 03:51 CT; **net −2**)
- `contacts_7d`: **3** (was 4)
- Most recent `lead_source = 'Website'`: `seekmycounsel@gmail.com @ 2026-04-30 17:48:29 UTC` (was `lucashdr@hotmail.com @ 2026-05-08 02:29 UTC` yesterday)

**CRITICAL CORRECTION TO PRIOR FRAMING:** The 2 rows that landed as `lead_source='Website'` between 05-06 and 05-08 (`brunalexandra7@hotmail.com` 05-06 + `lucashdr@hotmail.com` 05-08) have been **recategorized to `lead_source='AEO'`** in Supabase. They are now visible in the last-14-days query as `'AEO'` lead source — same pattern as `joshbarron56@gmail.com` (`'AEO: ChatGPT'`) on 04-26.

This means:
- The "Website-fallback channel +2 in 48h pattern shift" framing in 2026-05-07 + 2026-05-08 session-logs was **wrong**.
- Those rows were SEO-agent manual inserts, not form submissions. Reinforces (and corrects) the 2026-04-28 PA-funnel zero-leads diagnosis: "the 'web_lead'-typed contacts in the period are SEO-agent manual inserts (AEO/Claude lead source), not real form submissions."
- The deterministic POST verification probe is **less urgent** than 05-07 + 05-08 framed it. There is no upstream non-script.js path actively writing 'Website' rows. The 05-05 H5 conclusion ("capture path is upstream-of-handler") still stands, but the supporting evidence ("+2 in 48h") was fabricated by SEO-agent reclassification, not organic submissions.
- Real legit recent form submissions: 1 (`emilyprotzman@gmail.com` 05-05 16:33 UTC, lead_source='Web Lead' — likely a `/api/contacts/web-lead` endpoint hit, separate from website Netlify Form path).
- True 'Website' fallback channel: **8 rows in 90d**, most recent 2026-04-30 (`seekmycounsel@gmail.com`). ~1 organic capture every 5–7 days when including 04-28 patrick row, 04-27 chelsea row, 04-26 josh row. Steady-state matches "real homepage submissions extremely rare ~1/wk" framing from 05-04 H5 audit.

This correction does not change PR-4's scope, but does reduce urgency on (e) deterministic POST probe in the 05-09 forward-rule menu. Recommend folding the lead_source taxonomy clean-up into a low-priority SEO/SEM coordination ticket — the SEO agent should adopt explicit `'AEO'` / `'AEO: ChatGPT'` literals on insert, never default to `'Website'`.

---

## 14. References

- Audits this PR consolidates:
  - `tasks/lead-gen/research/2026-05-01-get-preapproved-conversion-audit.md` (M5 footer address)
  - `tasks/lead-gen/research/2026-05-02-rate-alert-conversion-audit.md` (M5 footer email + C1 address mismatch)
  - `tasks/lead-gen/research/2026-05-04-homepage-forms-conversion-audit.md` (M5 footer address — homepage already has address line)
  - `tasks/lead-gen/research/2026-05-05-thank-you-page-audit.md` (M6 Ads conversion suppression)
- Prior-PR specs that scoped PR-4:
  - `tasks/lead-gen/specs/2026-05-06-compliance-closeout-pr-spec.md` § 7 (out-of-scope) + § 5 (FAIL deferred to "PR-3 in 05-05 ship-order plan")
  - `tasks/lead-gen/specs/2026-05-07-conversion-consolidation-pr-spec.md` § 7 (footer-address sweep deferred)
  - `tasks/lead-gen/specs/2026-05-08-thank-you-conversion-pr-spec.md` § 6 (M5 already in PR-1; M6 → PR-4)
- Voice / brand rule: `/Users/adamstyer/Documents/CLAUDE.md` ("never use 'The Styer Team' — always 'Adam Styer | Mortgage Solutions LP'")
- Site CLAUDE: `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site/CLAUDE.md` ("Never use 'The Styer Team'")
- Compliance source: `tasks/lead-gen/domain-queue.md` line 67 (5900 Balcones Drive — note: production HTML uses 5718 Sam Houston Circle; § 6 prereq resolves)
- Cross-agent ref: SEO/SEM agent's about.html LocalBusiness vs index.html MortgageBroker mismatch tracking (10th run carry-forward — bundle-eligible but out of this PR's funnel scope).
