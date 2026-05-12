# SEO + SEM Backlog
# Prioritized rolling queue. Agent updates this every session.
# Format: [RISK_TIER] Item — rationale

---

## P0 — DATA-DRIVEN URGENT — ALL CLEAR ✅

- ~~[MEDIUM_RISK] Fix duplicate URL split~~ ✅ DONE 2026-03-26 PM (commit ac3afc9) — extensionless→.html redirects confirmed in _redirects for all loan + suburb pages
- ~~[LOW_RISK] Optimize /wrap-mortgage-calculator.html meta description~~ ✅ DONE 2026-03-27 — trimmed 190→141 chars
- ~~[LOW_RISK] /contact-us 404 redirect~~ ✅ DONE 2026-03-26 PM (commit ac3afc9) — `/contact-us → /contact.html 301` confirmed in _redirects

## P1 — ZERO_RISK (implement immediately, no approval)

- [ZERO_RISK] ~~Add 15 suburb pages + 3 blog posts to sitemap.xml~~ ✅ DONE 2026-03-26
- ~~[ZERO_RISK] Update sitemap.xml lastmod dates for all pages updated in 2026-03-27 commit (38 files changed)~~ ✅ DONE 2026-03-27 — commit 9779ef6, removed noindexed austin-housing-market-2025.html from sitemap
- [ZERO_RISK] ~~Add `/hero-test.html` and placeholder blog pages to robots.txt Disallow~~ ✅ DONE 2026-03-27

## P2 — LOW_RISK (implement, log what changed)

- ~~[LOW_RISK] Rewrite homepage meta description~~ ✅ DONE 2026-03-27 — 173→138 chars
- ~~[LOW_RISK] Fix blog post title casing: ai-trap~~ ✅ DONE 2026-03-27
- ~~[LOW_RISK] Fix canonical on first-time-home-buyer.html~~ ✅ DONE 2026-03-27 — added .html
- ~~[LOW_RISK] Add BreadcrumbList schema to /loans/refinance.html~~ ✅ DONE 2026-03-27
- ~~[LOW_RISK] Add AggregateRating to westlake + buda suburb pages~~ ✅ DONE 2026-03-27
- ~~[LOW_RISK] Batch meta description rewrites (18+ pages)~~ ✅ DONE 2026-03-27
- ~~[LOW_RISK] Update stale "2025" year in titles~~ ✅ DONE 2026-03-27 — austin-down-payment, closing-costs
- ~~[LOW_RISK] Add NMLS #513013 to title tags~~ ✅ DONE 2026-03-27 — contact, testimonials, realtors, realtor-resources, fixed-vs-adjustable, mortgage-broker-vs-bank, dscr
- ~~[LOW_RISK] Blog placeholder noindex~~ ✅ DONE 2026-03-27 — both 2026-03-06 and 2026-03-10

## P3 — MEDIUM_RISK (implement with rationale logged)

- ~~[MEDIUM_RISK] Update sitemap.xml lastmod dates for all 38 pages changed 2026-03-27~~ ✅ DONE — promoted to P1 ZERO_RISK, completed commit 9779ef6
- [MEDIUM_RISK] austin-housing-market-2025.html — ✅ noindex added 2026-03-27. Redirect to /austin-mortgage-rates still pending Adam decision (LOW priority — page is noindexed, no urgency)
- [LOW_RISK] ~~rate-alert.html title (79 chars) + canonical (.html fix)~~ ✅ DONE 2026-03-30 — commit dd5dea0
- [LOW_RISK] ~~austin-mortgage-rates.html meta desc (158 chars → 151) + canonical (.html fix)~~ ✅ DONE 2026-03-30 — commit dd5dea0
- ~~[MEDIUM_RISK] Homepage H1~~ ✅ DONE in prior session (2026-03-26 PM) — "Mortgage Broker Austin TX — Adam Styer | NMLS #513013"
- ~~[MEDIUM_RISK] Add /prequal.html to robots.txt Disallow~~ ✅ DONE 2026-03-28 — commit 7879b14
- ~~[MEDIUM_RISK] Verify /contact-us 404 redirect is in _redirects — if not, add it~~ ✅ Confirmed done in prior commit ac3afc9

## P4 — NEEDS GSC DATA (blocked until Adam provides export)

- Validate which suburb pages are already getting impressions vs. which are dead weight
- Identify which queries the site ranks for positions 4-20 (quick-win optimization targets)
- Keyword gap analysis: what Austin mortgage keywords are competitors ranking for that we're not

## P5 — FUTURE CONTENT (Week 4+)

- ~~New page: /self-employed-mortgage-austin.html~~ ✅ DONE 2026-03-27 — commit 9203d1f, full non-QM landing page, FAQPage + BreadcrumbList + FinancialProduct schema, added to sitemap
- ~~Blog post: "How Long Does Mortgage Pre-Approval Take in Austin TX?"~~ ✅ DONE 2026-03-28 — commit 7879b14, FAQPage schema (6 questions), added to sitemap + manifest
- ~~Blog post: "FHA vs Conventional Loan Austin TX — Which Is Right for You?"~~ ✅ DONE 2026-03-28 — commit 45c8f2f, FAQPage schema (6 questions), comparison table, added to sitemap + manifest
- ~~Blog post: "VA Loan Eligibility in Texas — Who Qualifies and How to Use Your Benefit"~~ ✅ DONE 2026-03-29 — commit 1b3f0be, FAQPage schema (6 questions), service table, added to sitemap + manifest
- ~~Blog post: "First-Time Home Buyer Programs Austin TX 2026"~~ ✅ DONE 2026-03-30 — commit dd5dea0, FAQPage 6 questions, MCC/TSAHC/TDHCA coverage, comparison table, added to sitemap + manifest
- ~~Suburb page content audit: are the 15 new-to-sitemap pages strong enough or thin?~~ ✅ SPOT CHECK DONE 2026-03-29 — Jarrell (522 lines, 41 content elements) and Florence (522 lines, 41 content elements) both substantive — NOT thin. All suburb pages appear to be using the same strong template.
- thank-you.html: noindex removed during redesign ✅ FIXED 2026-03-28 — commit 7879b14

---

## COMPLETED

- ✅ Full technical SEO audit — 56 issues documented (2026-03-25 AM)
- ✅ sitemap.xml — added 15 suburb pages + 3 blog posts + 4 other pages (2026-03-26)
- ✅ Week 3 on-page optimization batch — 38 files, commit 359c6e3 (2026-03-27 AM)

## ADDED 2026-03-31 AM

- ~~[LOW_RISK] Fix 2026-03-30-why-rates-jumped title (86 chars) + meta (172 chars)~~ ✅ DONE 2026-03-31 — commit 46cfddb
- ~~[MEDIUM_RISK] Noindex 2026-03-30-temp-placeholder.html + update canonical to proper URL~~ ✅ DONE 2026-03-31 — commit 46cfddb
- ~~[ZERO_RISK] Add 2026-03-30-why-rates-jumped to sitemap + manifest~~ ✅ DONE 2026-03-31 — commit 46cfddb
- ~~[ZERO_RISK] Add 2026-03-30-temp-placeholder to robots.txt Disallow~~ ✅ DONE 2026-03-31 — commit 46cfddb
- ~~Blog post: "DSCR Loans Austin TX 2026 — The Complete Investor's Guide"~~ ✅ DONE 2026-03-31 — commit 46cfddb, FAQPage 6 questions, comparison table, Austin submarket analysis
- ~~[MEDIUM_RISK] Blog post: "How to Choose a Mortgage Lender in Austin TX"~~ ✅ DONE 2026-04-01 — commit 29c9f16, FAQPage 6 questions, broker vs bank table, 60-char title, 143-char meta
- ~~[LOW_RISK] Add TCPA consent checkbox to 24 suburb hero forms~~ ✅ DONE 2026-04-01 — commit 29c9f16, all 24 suburb pages updated (3 form variants handled)
- [P4 — GSC BLOCKED] Check impressions on 5 new blog posts (VA, FHA vs conventional, pre-approval, FTB, DSCR) — after April 5
- [P4 — GSC BLOCKED] Check impressions on 6th blog post (How to Choose a Lender) — after April 10

## ADDED 2026-04-01 AM
- ~~[MEDIUM_RISK] Blog post: "How to Qualify for a Mortgage When Self-Employed in Austin TX"~~ ✅ DONE 2026-04-02 — blog/2026-04-02-self-employed-mortgage-austin-tx.html (written outside session, found in AM audit)
- ~~[LOW_RISK] Add SMS opt-in checkbox to 24 suburb forms~~ ✅ DONE 2026-04-06 — commit 6fb8883 (duplicate of completed entry below; cleaned up 2026-05-11 by styer-site-daily re-verify gate — verified live on 25/25 suburb files via `sms_opt_in` name attr)
- ~~[LOW_RISK] Blog post CTA audit: verify all 12 blog posts link CTAs to /get-preapproved (not raw loan app URL)~~ ✅ DONE 2026-04-05 — all 17 posts pass; mslp.my1003app.com appears only in global nav "Apply Now" button (by design)

## ADDED 2026-04-01 — SEO AUDIT FINDINGS (source: April 2026 full-site audit)

### P1 — HIGH PRIORITY CONTENT GAPS
- ~~[MEDIUM_RISK] New page: Austin Condo Mortgage Guide~~ ✅ DONE 2026-04-03 — blog/2026-04-03-condo-mortgage-austin-tx.html (written outside session, found in AM audit)
- ~~[MEDIUM_RISK] New page: "How to Buy a House in Austin TX"~~ ✅ DONE 2026-04-03 — how-to-buy-a-house-in-austin-tx.html in sitemap (written outside session, QA clean: 51-char title, 132-char meta)
- ~~[MEDIUM_RISK] Monthly Austin Housing Market Report — recurring blog series~~ ✅ DONE 2026-04-04 — blog/2026-04-04-austin-housing-market-report-april-2026.html (written outside session, found in AM audit)
- ~~[LOW_RISK] Expand Non-QM page to cover bank statement loans, asset depletion (currently only DSCR)~~ ✅ DONE (pre-existing) — full bank statement + asset depletion section already in dscr-loan-austin-tx.html at #non-qm
- ~~[LOW_RISK] Add veteran-specific FAQ + eligibility detail to VA loan page~~ ✅ DONE 2026-04-05 — added "What credit score do I need?" + "How do I get a COE?" to accordion + FAQPage schema; dateModified + sitemap lastmod updated

### P2 — MEDIUM PRIORITY CONTENT GAPS
- [LOW_RISK] Mortgage glossary / terms resource page — internal linking opportunity for every loan page
- [LOW_RISK] Investment property ROI examples + calculator tie-in on DSCR page. Keyword: "investment property loan Austin"
- [LOW_RISK] Mortgage document checklist blog post + downloadable PDF. High-intent keyword, easy to rank.
- ~~[LOW_RISK] Add construction loan builder partner content + process walkthrough~~ ✅ DONE 2026-04-11 — commit 811028f, AEO paragraph + 6-step build process walkthrough with Austin builder examples, dateModified updated

### P3 — ONGOING MAINTENANCE (from audit)
- ~~[LOW_RISK] blog.html noscript links — keep in sync when new posts are added~~ ✅ VERIFIED 2026-04-05 — all 4 new April posts already in noscript block
- ~~[LOW_RISK] blog.html CollectionPage schema — keep in sync when new posts are added~~ ✅ VERIFIED 2026-04-05 — all 4 new April posts already in schema (positions 1-4)
- [LOW_RISK] City pages: add unique local data per city (median prices, school districts, commute times) to reduce duplicate content risk — do 2-3 cities per session
- [P4 — GSC BLOCKED] Validate suburb page impressions — which are getting traffic vs. dead weight
- [P4 — GSC BLOCKED] Keyword gap analysis — competitor keywords we're not targeting

## ADDED 2026-04-05 AM

- [P4 — GSC BLOCKED] April 5 GSC window reached — Adam needs to pull GSC export for first impression data on 9 blog posts published Mar 28–Apr 4
- ~~[LOW_RISK] Add SMS opt-in checkbox to 24 suburb forms~~ ✅ DONE 2026-04-06 — commit 6fb8883, all 4 form variants handled (V1 22-space, V2 btn-full, V3 16-space, V4 18-space)
- ~~[LOW_RISK] VA page: add IRRRL (VA streamline refinance) FAQ question~~ ✅ DONE 2026-04-06 — commit 6fb8883, added to accordion + FAQPage schema
- ~~[LOW_RISK] QA check: how-to-buy-a-house-in-austin-tx.html~~ ✅ DONE 2026-04-06 — QA PASS: title 51 chars, meta 132 chars, GTM ✓, canonical ✓, strong internal links ✓
- ~~[LOW_RISK] Mortgage document checklist blog post~~ ✅ DONE 2026-04-06 — commit 6fb8883, blog/2026-04-06-mortgage-document-checklist-austin-tx.html, FAQPage 6 questions, W-2/self-employed/VA/DSCR checklists, added to sitemap + manifest + blog.html

## ADDED 2026-04-06 AM

- [P4 — GSC BLOCKED] April 10 window: check first impression data on "How to Choose a Lender" post (published Apr 1)
- [P4 — GSC BLOCKED] April 12 window: check first impression data on new doc checklist post (published Apr 6)
- ~~[LOW_RISK] City page enrichment: continue 2-3 cities per session — Georgetown ✅ and Taylor ✅ done 2026-04-06; Leander ✅, Hutto ✅, Bastrop ✅ done 2026-04-07~~ Remaining: Bee Cave, Manor, Smithville, Spicewood, Florence, Jarrell, Marble Falls, Liberty Hill, New Braunfels, Lakeway, Elgin
- ~~[LOW_RISK] Mortgage glossary page~~ ✅ DONE 2026-04-07 — mortgage-glossary.html, FAQPage 6 questions, BreadcrumbList, Article schema, added to sitemap
- ~~[LOW_RISK] Investment property ROI examples on DSCR page~~ ✅ DONE 2026-04-07 — 3 Austin scenarios (core Austin LTR, suburban LTR, STR), honest ROI math

## ADDED 2026-04-21b (Tuesday title/meta audit — second run)

- ~~[ZERO_RISK] Remove duplicate mortgage-pre-approval-austin.html entry from sitemap.xml~~ ✅ DONE 2026-04-21b — removed priority 0.8 duplicate at line 95; kept priority 0.9 at line 49
- ~~[LOW_RISK] Trim DSCR title (68 chars) — remove redundant "| Investor Mortgage"~~ ✅ DONE 2026-04-21b — now 48 chars: "DSCR Loans Austin TX | Adam Styer | NMLS #513013"
- ~~[LOW_RISK] Trim Refinance title (67 chars) — reorder to lead with product keyword~~ ✅ DONE 2026-04-21b — now 56 chars: "Cash-Out Refinance Austin TX | Adam Styer | NMLS #513013"
- [LOW_RISK] FHA title missing NMLS ("Austin FHA Loans: Broker, Not a Call Center | Adam Styer" — 56 chars). Adding NMLS would push over 65 chars. Keep current hook; NMLS is in meta + body. Adam awareness only.
- [LOW_RISK] Jumbo title missing NMLS ("Jumbo Loan Austin: 10% Down to $1.5M | Adam Styer" — 49 chars). Same situation. Keep hook; NMLS in meta + body.

## ADDED 2026-04-14 AM (Tuesday title/meta audit)

- ~~[LOW_RISK] Title tag audit — 6 loan/resource pages missing "Adam Styer" and/or NMLS #513013~~ ✅ DONE 2026-04-14 — fixed: first-time-home-buyer (NMLS added), austin-down-payment-assistance (Adam Styer added), fixed-vs-adjustable (Adam Styer added), how-to-buy-a-house-in-austin-tx (Adam Styer added + meta updated), closing-costs-texas (Adam Styer added), improve-credit-score (NMLS added + format corrected). All now match "[Loan Type] in Austin TX | Adam Styer | NMLS #513013" pattern.
- ~~[LOW_RISK] mortgage-broker-vs-bank.html Article schema dateModified~~ ✅ DONE 2026-04-14 — updated 2026-02-26 → 2026-04-14 (per TOMORROW_PRIORITY from Monday run)
- [P4 — GSC BLOCKED] austin-housing-market-2025.html — skipped title fix (page is noindex, optimization waste)

## ADDED 2026-04-07 AM

- ~~[LOW_RISK] City page enrichment: continue 2-3 cities per session~~ ✅ ALL 25 CITIES COMPLETE — ~~Bee Cave ✅, Manor ✅, Smithville ✅~~ done 2026-04-08 AM. ~~New Braunfels ✅, Lakeway ✅~~ done 2026-04-10. ~~Liberty Hill ✅, Elgin ✅~~ done 2026-04-10b. ~~Florence ✅ (already had at a glance), Marble Falls ✅ (added 2026-04-11, commit fbb0dd6)~~
- ~~[LOW_RISK] Add mortgage-glossary.html link to Resources nav dropdown (currently not in nav)~~ ✅ DONE 2026-04-08 AM — 64 pages updated, commit e4ee80b
- ~~[LOW_RISK] Add internal links to mortgage-glossary.html from loan type pages (conventional, FHA, VA, DSCR) for key terms they define~~ ✅ DONE 2026-04-08 AM — all 4 loan pages updated

---

## 2026-04-05 — /loanos Landing Page (LoanOS stream dependency)

**Priority:** HIGH — blocks first-run gate for LoanOS content stream
**Spec reference:** `tasks/social-media/specs/2026-04-05-pillar-framework-v2.md` Section 9.2 + Section 13
**Goal:** Build a long-form "What LoanOS is and why I built it" page on styermortgage.com

**Deliverables:**
1. New page at `styermortgage.com/loanos` (or `/ai`)
2. Content: long-form explainer matching Adam's voice (consult `tasks/social-media/adam-voice-and-workflow.md`). Not a feature list. A story:
   - Why Adam built it (the Jessica → Janie → Claude arc)
   - What it does (dashboard, loans, contacts, automations — plain English)
   - Who it's for (mostly "me", but hints at the waitlist)
   - Call to action: waitlist signup (route to the form built in `tasks/lead-gen/domain-queue.md` entry)
3. SEO metadata: title, description, schema
4. Link from main nav OR footer (Adam decision)

**Copy approval required from Adam before deploy.** Use Adam's voice guide strictly. Apply the Jessica Test — if any section sounds corporate, rewrite.

**Template decision needed from Adam:** Does the page use the existing styermortgage.com template or get a custom layout?

**Blocks:** LoanOS first-run gate in `tasks/social-media/plans/2026-04-05-pillar-framework-v2-plan.md` Task 14

## ADDED 2026-05-07 AM (Thursday Internal Linking + Funnel Flow rotation)

- ~~[LOW_RISK] products.html hero + bottom CTAs route to raw 1003 instead of tracked /get-preapproved~~ ✅ DONE 2026-05-07 — same swap pattern as 2026-05-06 cluster pages (non-qm-loans, investor-loans, dscr-loans-fredericksburg-tx, high-net-worth-mortgage). Removed `target="_blank" rel="noopener"` on internal hero link per 2026-05-06 AM learning.
- [MEDIUM_RISK] products.html — 7 in-card "Get Pre-Approved" buttons (Conventional, FHA, VA, Jumbo, Renovation, Construction, Investment cards at lines ~334/377/420/463/506/561/598) still route directly to `https://mslp.my1003app.com/513013/register` instead of `/get-preapproved`. **Higher-volume click target than hero/bottom CTAs.** Same swap pattern as today's hero+bottom would apply. Adam decision: maintain per-loan-type 1003 routing (current state) or unify under tracked landing page. Defer to next Thursday rotation if Adam wants to swap, OR leave as deliberate choice if per-card direct-apply is intended.
- [LOW_RISK] Site-wide footer link to `/prequal.html` appears in 20 pages including products.html, contact.html, blog.html, calculators.html, fixed-vs-adjustable.html, first-time-buyer-guide.html, improve-credit-score.html, rate-check-buda-kyle.html, rate-check-cedar-park.html, etc. **Re-Verify Gate correction (2026-05-07):** `/prequal.html` is NOT noindexed — HTTP 200 live, listed in sitemap.xml, no `<meta name="robots">` tag. Earlier 2026-03-28 `Disallow: /prequal.html` entry in robots.txt was apparently removed during AEO crawler allowlist expansion. The page (470 lines) shares Netlify form-name "get-preapproved" with /get-preapproved.html, BUT does not fire the `generate_lead`+`lead_type` dataLayer event. Net effect: footer-routed submissions still capture as Netlify Forms leads, but do NOT count as GTM/GA conversions. Lower priority than originally framed — opportunity is conversion-tracking parity, not orphan cleanup. Two paths: (a) add the `generate_lead`+`lead_type:"purchase_prequal"` dataLayer push to prequal.html on form submit so the two pages have parity; or (b) site-wide footer redirect to `/get-preapproved` and let prequal.html exist for organic SEO. Adam decision.
