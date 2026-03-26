# SEO + SEM Backlog
# Prioritized rolling queue. Agent updates this every session.
# Format: [RISK_TIER] Item — rationale

---

## P0 — DATA-DRIVEN URGENT (GSC validated — act first)

- [MEDIUM_RISK] **Fix duplicate URL split** — Netlify serving both `/loans/fha` and `/loans/fha.html` as live URLs. Same for `/loans/jumbo` and `/round-rock-mortgage-lender`. Add 301 redirects in `_redirects`: extensionless → .html for all loan + suburb pages. This is splitting impressions and link equity. (Source: GSC 2026-03-26)
- [LOW_RISK] **Optimize /wrap-mortgage-calculator.html meta description** — ranking position 8.75 for "wraparound mortgage calculator" with 0 clicks. Best ranking on the site. Fix the meta description (currently 188 chars, truncated). This is the fastest path to a first page 1 result.
- [LOW_RISK] **Investigate /contact-us 404** — GSC shows impressions for a URL that doesn't exist. Add redirect in `_redirects`: `/contact-us` → `/contact.html`

## P1 — ZERO_RISK (implement immediately, no approval)

- [ZERO_RISK] ~~Add 15 suburb pages + 3 blog posts to sitemap.xml~~ ✅ DONE 2026-03-26
- [ZERO_RISK] Add lastmod dates to sitemap entries as pages are updated (ongoing)
- [ZERO_RISK] Add `/hero-test.html` and `/blog/2026-03-10-temp-placeholder.html` to robots.txt Disallow
- [ZERO_RISK] Add `blog/2026-03-06-temp-placeholder.html` to sitemap if it has real content, or add noindex if placeholder

## P2 — LOW_RISK (implement, log what changed)

- [LOW_RISK] Rewrite homepage meta description (173 chars → ≤155) — highest traffic page, pure CTR improvement
- [LOW_RISK] Fix blog post title casing: "the ai trap i walked right into" → proper title case
- [LOW_RISK] Fix canonical on first-time-home-buyer.html: remove trailing slash / add .html for consistency
- [LOW_RISK] Add BreadcrumbList schema to /loans/refinance.html (all other loan pages have it)
- [LOW_RISK] Add AggregateRating to westlake-mortgage-lender.html LocalBusiness schema
- [LOW_RISK] Add AggregateRating to buda-mortgage-lender.html LocalBusiness schema
- [LOW_RISK] Rewrite meta descriptions >155 chars — batch by page type:
  - Batch A (suburb pages): marble-falls (230), elgin (212), spicewood (207), jarrell (205), smithville (195), buda (194), westlake (193), florence (191), dripping-springs (168), new-braunfels (166), lakeway (165), pflugerville (164), hutto (164)
  - Batch B (core pages): calculators (184), liberty-hill (179), about (161)
  - Batch C (conversion pages): first-time-home-buyer (185), wrap-calculator (188)
- [LOW_RISK] Update stale "2025" year in titles: austin-down-payment-assistance, closing-costs-texas
- [LOW_RISK] Add NMLS #513013 to title tags missing it: contact, realtor-resources, testimonials, realtors, fixed-vs-adjustable, mortgage-broker-vs-bank, resources/index

## P3 — MEDIUM_RISK (implement with rationale logged)

- [MEDIUM_RISK] Update austin-housing-market-2025.html title + consider /austin-housing-market-2026.html with 301
- [MEDIUM_RISK] Homepage H1 — "Your Austin Home Loan Simplified" doesn't include "mortgage broker" keyword. Plan change carefully — assess ranking risk first.
- [MEDIUM_RISK] Add /prequal.html to robots.txt Disallow (has noindex but not disallowed)
- [MEDIUM_RISK] Decide on blog/2026-03-10-temp-placeholder.html — real content or delete?

## P4 — NEEDS GSC DATA (blocked until Adam provides export)

- Validate which suburb pages are already getting impressions vs. which are dead weight
- Identify which queries the site ranks for positions 4-20 (quick-win optimization targets)
- Keyword gap analysis: what Austin mortgage keywords are competitors ranking for that we're not

## P5 — FUTURE CONTENT (Week 4+)

- Evergreen /austin-mortgage-rates page (blog post is temporary — need a permanent URL)
- Blog post briefs: first-time buyer deep dive, FHA vs conventional, VA eligibility guide
- Suburb page content audit: are the 15 new-to-sitemap pages strong enough or thin?

---

## COMPLETED

- ✅ Full technical SEO audit — 56 issues documented (2026-03-25 AM)
- ✅ sitemap.xml — added 15 suburb pages + 3 blog posts + 4 other pages (2026-03-26)
