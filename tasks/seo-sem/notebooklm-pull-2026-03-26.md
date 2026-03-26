# NotebookLM Pull Report — 2026-03-26 AM
Active Topic: Week 2 — Keyword Research

## What We Already Know

**Site:** styermortgage.com — HTML/CSS/JS on Netlify. No CMS. 54 public pages.

**Keyword targets already defined:**
- Primary: "mortgage broker Austin TX" → homepage (H1 is keyword-weak, currently "Your Austin Home Loan Simplified")
- FHA/VA/USDA/DSCR/Construction loans + Austin TX → loan program pages
- Suburb modifiers: 24 Austin suburb pages (Round Rock, Cedar Park, Leander, Georgetown, Pflugerville, Kyle, San Marcos, Westlake, Buda — 9 live + 15 more not in sitemap)
- High-intent transactional: "mortgage pre-approval Austin", "refinance Austin TX", "first-time home buyer Austin"
- Niche/uncontested: "WRAP mortgage Austin" → /wrap-mortgage-calculator.html

**Technical issues already documented (Week 1 audit — 56 total):**
- CRITICAL: 21 indexable pages missing from sitemap.xml (15 suburb + 3 blog posts + wrap calculator)
- CRITICAL: Homepage meta description 173 chars (truncates at ~155)
- 17 pages with meta descriptions over 155 chars
- H1s keyword-weak on homepage, contact, products
- 7+ pages with stale "2025" references
- Blog posts (surrender, ai-trap) had no FAQPage schema — FIXED 2026-03-23
- NMLS# format inconsistencies — FIXED across most pages

**Changes made since audit baseline:**
- /austin-mortgage-rates evergreen page built (2026-03-25) — addresses the rates hub gap
- Internal links from two blog posts to /austin-mortgage-rates added (2026-03-26)
- GTM installed on all 54 pages, GA4 firing, conversion tracking verified

## Open Questions

1. GSC data not available — need Adam to export or grant access. Without it, can't validate actual ranking positions.
2. Placeholder blog posts (2 temp) — crawlable with no noindex — index or delete?
3. Austin housing market 2025 page — update to 2026 or 301 redirect?
4. Suburb page prioritization — which of 24 suburbs have highest ROI for sitemap repair?

## Prior Decisions

- Week 1 = audit only, zero implementation (DONE)
- Week 2 = keyword research and mapping → proceed this session
- Week 3 = on-page implementation (meta rewrites, sitemap fix, H1 updates)
- All on-page changes go in ~/Documents/Claude/styerteam-mortgage-site/

## Technical Issues Already Documented

See tasks/seo-sem/seo-audit-week1.md for full list. Top items waiting for Week 3 execution:
- Sitemap: add 21 missing pages
- Meta descriptions: rewrite 17 pages over 155 chars
- H1 rewrites: homepage, contact, products
- BreadcrumbList: add to /loans/refinance.html (only loan page missing it)
- AggregateRating: add to Westlake + Buda suburb pages

## Briefing for Research Subagent

What NOT to re-research:
- Technical site health (already audited — 56 issues documented)
- Schema coverage (already verified across all pages)
- GTM/analytics/tracking (all done)
- /austin-mortgage-rates gap (ADDRESSED — page built 2026-03-25)

Focus NEW research here:
1. Competitor landscape — who ranks #1-5 for "mortgage broker Austin TX" and what do their sites look like
2. Keyword volume estimates for all 5 clusters using available web research signals
3. Search intent mapping — transactional vs. informational vs. navigational for each cluster
4. Long-tail keyword opportunities in Austin mortgage space
5. AEO/AI Overview readiness — what question-based queries to target
6. Suburb page prioritization — which Austin suburbs have highest mortgage search volume
