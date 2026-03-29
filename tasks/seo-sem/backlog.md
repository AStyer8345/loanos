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
- [MEDIUM_RISK] austin-housing-market-2025.html — ✅ noindex added 2026-03-27 (Option C). Redirect to /austin-mortgage-rates is STILL pending — need Adam decision on whether to do 301 redirect
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
- Blog post: "FHA vs Conventional Loan Austin TX — Which Is Right for You?" — comparison format, targets buyers deciding between the two
- Blog post: "VA Loan Eligibility in Texas — Who Qualifies and How to Use Your Benefit" — veteran buyers, high-intent
- Blog post: "First-Time Home Buyer Programs Austin TX 2026" — complements DPA post, more process-focused
- Suburb page content audit: are the 15 new-to-sitemap pages strong enough or thin?
- thank-you.html: noindex removed during redesign ✅ FIXED 2026-03-28 — commit 7879b14

---

## COMPLETED

- ✅ Full technical SEO audit — 56 issues documented (2026-03-25 AM)
- ✅ sitemap.xml — added 15 suburb pages + 3 blog posts + 4 other pages (2026-03-26)
- ✅ Week 3 on-page optimization batch — 38 files, commit 359c6e3 (2026-03-27 AM)
