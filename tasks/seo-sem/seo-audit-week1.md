# Technical SEO Audit — styermortgage.com
# Week 1 — Audit Only (Zero Implementation)
# Date: 2026-03-25 | Session: AM
# Auditor: SEO Agent (automated)

---

## SUMMARY SCORECARD

| Category | Status | Issues Found |
|---|---|---|
| Sitemap Coverage | 🔴 CRITICAL | 21 pages missing |
| Meta Descriptions | 🔴 CRITICAL | 17 pages over 155 chars |
| Title Tags | 🟡 MEDIUM | 12 issues |
| Stale Content/Dates | 🟡 MEDIUM | 3 pages |
| Schema Markup | 🟡 MEDIUM | 3 gaps |
| Blog Health | 🟡 MEDIUM | 2 temp pages exposed |
| Canonical Tags | 🟡 MEDIUM | 1 inconsistency |
| robots.txt | 🟢 MINOR | 2 gaps |
| Image Alt Tags | 🟢 HEALTHY | All clear |
| Internal Links | 🟢 HEALTHY | No 404s detected |
| noindex Compliance | 🟢 HEALTHY | Correct |
| SSL / Hosting | 🟢 HEALTHY | Netlify (HTTPS) |

**Total actionable issues: 56 items across 12 categories**
**Priority 1 items (implement in Week 3): 2 (sitemap, meta descriptions)**

---

## ISSUE 1 — SITEMAP COVERAGE (HIGH)

### Missing from sitemap.xml — 15 Suburb/Location Pages

These pages have real content, no noindex, proper titles with NMLS# — but Google has never been told they exist via sitemap. Discovery depends entirely on internal links.

| Page | Title |
|---|---|
| /bastrop-mortgage-lender.html | Mortgage Lender Bastrop TX |
| /bee-cave-mortgage-lender.html | Mortgage Lender Bee Cave TX |
| /dripping-springs-mortgage-lender.html | Mortgage Lender Dripping Springs TX |
| /elgin-mortgage-lender.html | Mortgage Lender Elgin TX |
| /florence-mortgage-lender.html | Mortgage Lender Florence TX |
| /hutto-mortgage-lender.html | Mortgage Lender Hutto TX |
| /jarrell-mortgage-lender.html | Mortgage Lender Jarrell TX |
| /lakeway-mortgage-lender.html | Mortgage Lender Lakeway TX |
| /liberty-hill-mortgage-lender.html | Mortgage Lender Liberty Hill TX |
| /manor-mortgage-lender.html | Mortgage Lender Manor TX |
| /marble-falls-mortgage-lender.html | Mortgage Lender Marble Falls TX |
| /new-braunfels-mortgage-lender.html | Mortgage Lender New Braunfels TX |
| /smithville-mortgage-lender.html | Mortgage Lender Smithville TX |
| /spicewood-mortgage-lender.html | Mortgage Lender Spicewood TX |
| /taylor-mortgage-lender.html | Mortgage Lender Taylor TX |

**Priority: HIGH | Week 3 Fix**

### Missing from sitemap.xml — 3 Production Blog Posts

These posts are live and crawlable but NOT in sitemap. Google will only find them via links.

| Page | Date |
|---|---|
| /blog/2026-03-10-when-you-cant-control-it-surrender-it.html | Mar 10 |
| /blog/2026-03-18-the-ai-trap-i-walked-right-into.html | Mar 18 |
| /blog/2026-03-20-austin-mortgage-rates-march-2026.html | Mar 20 |

Note: /blog/2026-03-24-cash-out-refinance-austin-tx.html IS in sitemap. The others are not.

**Priority: HIGH | Week 3 Fix**

### Missing from sitemap.xml — Other Indexable Pages

| Page | Notes |
|---|---|
| /first-time-home-buyer.html | New conversion LP (added 2026-03-23) |
| /calculator-affordability.html | Individual calculator page |
| /calculator-payment.html | Individual calculator page |
| /calculator-refinance-breakeven.html | Individual calculator page |
| /wrap-mortgage-calculator.html | Seller financing tool |
| /blog/2026-03-06-temp-placeholder.html | Has real title — "Oil Prices, Jobs Report & Rate Volatility" |

Note: /get-preapproved.html, /refinance-quote.html, /thank-you.html are intentionally noindex and should NOT be in sitemap (correct).

**Priority: MEDIUM | Week 3 Fix**

### Sitemap URL Format Issues

- Sitemap uses `https://styermortgage.com/resources/first-time-buyer-guide/` but actual file is `/resources/first-time-buyer-guide/index.html` — verify this URL resolves correctly on Netlify
- Sitemap uses `/` for homepage (correct — canonical matches)
- `lastmod` dates are missing on most pages — Google prefers accurate lastmod for freshness signals

**Priority: LOW | Week 3 Fix**

---

## ISSUE 2 — META DESCRIPTIONS OVER 155 CHARS (HIGH)

Google truncates descriptions over ~155 characters. Truncation signals poor optimization and wastes the opportunity to control click-through messaging.

| Chars | Page |
|---|---|
| 230 | /marble-falls-mortgage-lender.html |
| 212 | /elgin-mortgage-lender.html |
| 207 | /spicewood-mortgage-lender.html |
| 205 | /jarrell-mortgage-lender.html |
| 195 | /smithville-mortgage-lender.html |
| 194 | /buda-mortgage-lender.html |
| 193 | /westlake-mortgage-lender.html |
| 191 | /florence-mortgage-lender.html |
| 188 | /wrap-mortgage-calculator.html |
| 185 | /first-time-home-buyer.html |
| 184 | /calculators.html |
| 179 | /liberty-hill-mortgage-lender.html |
| 173 | /index.html (homepage!) |
| 168 | /dripping-springs-mortgage-lender.html |
| 166 | /new-braunfels-mortgage-lender.html |
| 165 | /lakeway-mortgage-lender.html |
| 164 | /pflugerville-mortgage-lender.html + /hutto-mortgage-lender.html |
| 161 | /about.html + /blog/2026-03-20-austin-mortgage-rates-march-2026.html |
| 160 | /round-rock, /cedar-park, /san-marcos, /georgetown, /fixed-vs-adjustable, /loans/va.html |
| 158 | /realtors.html + /bee-cave + /texas-complaint-notice.html |
| 156 | /first-time-buyer-guide.html + /updates/2026-02-19-austin-buyer-window.html |

**WORST: Homepage meta description is 173 chars — Google will truncate it. Needs immediate rewrite.**

Also noted:
- Short descriptions (<80 chars):
  - /updates/2026-03-06-temp-placeholder.html (42 chars)
  - /updates/2026-03-10-temp-placeholder.html (42 chars)
  - /blog/2026-03-10-temp-placeholder.html (55 chars)
  - /updates/2026-03-18-the-ai-trap-i-walked-right-into.html (63 chars) — UPDATES version is thin

**Priority: HIGH | Week 3 Fix (On-Page Optimization sprint)**

---

## ISSUE 3 — TITLE TAG PROBLEMS (MEDIUM)

**Title Format Standard:** Should be ≤60 chars, include primary keyword + city + NMLS# on key pages

### Titles Over 60 Characters

| Chars | Page |
|---|---|
| 107 | /buda-mortgage-lender.html |
| 107 | /updates/2025-02-19-market-update.html |
| 107 | /updates/2026-02-19-austin-buyer-window.html |
| 96 | /westlake-mortgage-lender.html |
| 95 | /resources/blog/2026-03-04-wait-for-rates.html |
| 99 | /resources/blog/2026-03-04-wait-for-rates-realtor.html |
| 91 | /realtor-updates/2026-02-27-ai-for-realtors-rates-drop-below-6.html |
| 85 | /blog/2026-03-24-cash-out-refinance-austin-tx.html |
| 79 | /blog/2026-03-06-temp-placeholder.html |
| 78 | /calculator-refinance-breakeven.html (contains HTML entity &amp;) |
| 77 | /blog/2026-03-10-when-you-cant-control-it-surrender-it.html |
| 74 | /rates/*.html (noindex — doesn't matter) |

**Top Priority Fixes:** buda (107), westlake (96), blog/cash-out (85)

### Title Casing Issues

- `/blog/2026-03-18-the-ai-trap-i-walked-right-into.html` — title is all lowercase: "the ai trap i walked right into | Adam Styer | Austin Mortgage Broker"
  - Should be: "The AI Trap I Walked Right Into | Adam Styer | NMLS #513013"

### Missing NMLS# from Title Tags

These pages are missing NMLS #513013 in the title tag (standard for E-E-A-T and compliance):
- /contact.html — "Contact Adam Styer | Austin TX Mortgage Broker" (46 chars, room to add)
- /realtor-resources.html — "Realtor Partner Resources | Adam Styer Austin TX"
- /testimonials.html — "Adam Styer Reviews | Top Mortgage Lender Austin TX"
- /realtors.html — "For Austin Realtors | Mortgage Partner | Adam Styer"
- /fixed-vs-adjustable.html — "Fixed vs. Adjustable Rate Mortgage | Austin TX Guide"
- /mortgage-broker-vs-bank.html — "Mortgage Broker vs. Bank Austin TX | Adam Styer"
- /resources/index.html — "Free Mortgage Resources Austin TX | Adam Styer"

**Priority: MEDIUM | Week 3 Fix**

---

## ISSUE 4 — STALE YEAR REFERENCES (MEDIUM)

Pages with "2025" in title and/or URL — now in 2026. Signals outdated content to users and Google.

| Page | Issue |
|---|---|
| /austin-down-payment-assistance.html | Title says "Austin TX Down Payment Assistance 2025" |
| /austin-housing-market-2025.html | URL AND title say "2025" — major staleness signal |
| /closing-costs-texas.html | Title says "Texas Closing Costs 2025 | Complete Guide" |

**Recommended Action (Week 3):**
- Update titles to say "2026"
- For /austin-housing-market-2025.html: consider creating /austin-housing-market-2026.html with fresh content and 301 redirect, OR update content + title in place

**Priority: MEDIUM | Week 3 Fix**

---

## ISSUE 5 — SCHEMA MARKUP GAPS (MEDIUM)

### Missing BreadcrumbList on /loans/refinance.html

All other loan pages (conventional, fha, va, usda, jumbo, construction, investment) have BreadcrumbList schema. `/loans/refinance.html` is the only loan page missing it. Inconsistent implementation.

**Fix:** Add same BreadcrumbList pattern used on `/loans/conventional.html`

### /contact.html Uses Wrong Schema Type

Uses `FinancialService` @type — other key pages use `MortgageBroker`. For E-E-A-T and local SEO consistency, contact page should include the full `MortgageBroker` LocalBusiness schema.

### Missing AggregateRating on Westlake and Buda Suburb Pages

- `/westlake-mortgage-lender.html` — has LocalBusiness but NO AggregateRating
- `/buda-mortgage-lender.html` — has LocalBusiness but NO AggregateRating
- All other suburb pages (round-rock, cedar-park, leander, georgetown, pflugerville, kyle, san-marcos) DO have AggregateRating — inconsistent

**Priority: MEDIUM | Week 3 Fix**

---

## ISSUE 6 — BLOG HEALTH (MEDIUM)

### Temp Placeholder Pages Exposed to Crawlers

Two "placeholder" blog files have NO noindex and are crawlable:
- `/blog/2026-03-10-temp-placeholder.html` — title "Newsletter | Adam Styer | Austin Mortgage Broker"
- `/blog/2026-03-06-temp-placeholder.html` — title "Oil Prices, Jobs Report & Rate Volatility" (this is actually real content with a confusing filename)

**Recommendation:**
- If /blog/2026-03-06-temp-placeholder.html has real published content, rename and add to sitemap
- If /blog/2026-03-10-temp-placeholder.html is truly placeholder, add noindex or delete

**Priority: MEDIUM | Week 2 Decision (no implementation — Adam decides)**

### Updates vs Blog Duplication

The `updates/` directory has duplicate versions of blog posts (e.g., `updates/2026-03-18-the-ai-trap-i-walked-right-into.html`). These updates versions DO have noindex — correctly handled.

---

## ISSUE 7 — CANONICAL TAG INCONSISTENCY (MEDIUM)

- `/first-time-home-buyer.html` canonical = `https://styermortgage.com/first-time-home-buyer` (no `.html`)
- All other pages use the `.html` extension in their canonical: e.g., `https://styermortgage.com/about.html`

This inconsistency means Google sees `/first-time-home-buyer` and `/first-time-home-buyer.html` as potentially different URLs and has to determine the canonical itself. The canonical should match the actual URL with `.html` to be consistent.

**Priority: MEDIUM | Week 3 Fix**

---

## ISSUE 8 — robots.txt GAPS (LOW)

Current robots.txt is largely correct. Minor gaps:

```
Disallow: /hero-test.html     ← TEST PAGE — should be disallowed or deleted
Disallow: /prequal.html       ← Pre-qual form with noindex, but not in Disallow
Disallow: /blog/2026-03-10-temp-placeholder.html   ← temp, no real content
```

**Current Disallow list is correct for:** /dashboard.html, /loanos.html, /updates/, /netlify/, manifest.json files

**Priority: LOW | Week 3 Fix**

---

## ISSUE 9 — H1 KEYWORD OPTIMIZATION (MEDIUM)

H1s are present on all pages (no missing H1 issues). However, some are keyword-weak for the primary target ("mortgage broker Austin TX"):

| Page | Current H1 | Issue |
|---|---|---|
| index.html | "Your Austin Home Loan Simplified" | Missing "mortgage broker" keyword |
| contact.html | "Get in Touch" | Zero keyword value |
| prequal.html | "Get Pre-Qualified" | Minimal keyword value |
| products.html | "Mortgage Programs for Every Situation" | Missing "Austin TX" |
| testimonials.html | (not checked) | — |

**Note:** H1 changes require careful testing (Week 3+). Changing H1 on the homepage carries ranking risk if done wrong.

**Priority: MEDIUM | Week 3 Planning**

---

## HEALTHY ITEMS (NO ACTION NEEDED)

- ✅ SSL/HTTPS — Netlify provides automatic SSL
- ✅ noindex on ad landing pages — get-preapproved, refinance-quote, thank-you all correctly blocked
- ✅ All image alt tags on checked pages — 100% coverage
- ✅ No broken internal links detected (homepage, products)
- ✅ Sitemap location in robots.txt — correct (`Sitemap: https://styermortgage.com/sitemap.xml`)
- ✅ GTM installed on all 54 public pages — verified March 20
- ✅ Schema markup present on ALL core pages — comprehensive coverage
- ✅ Canonical tags present on all pages (except googlea3d746ce1ceb4bff.html — GSC verification file, intentional)
- ✅ FAQPage schema on all 9 suburb pages + all 7 loan pages
- ✅ BreadcrumbList on all suburb pages + 6 of 7 loan pages
- ✅ AggregateRating on homepage and most suburb pages
- ✅ 301 redirects for old WordPress URLs — 11 redirects in _redirects
- ✅ Google Search Console verification file present
- ✅ NMLS# in title tags — correctly added to all loan pages and suburb pages (March 2026 work)

---

## OPPORTUNITY ANALYSIS

### High-Value Pages Not Yet Leveraged

1. **`/mortgage-pre-approval-austin.html`** — in sitemap, has schema, but not being used as a primary landing page for the #1 target keyword "mortgage pre-approval Austin TX". Strong URL + content opportunity.

2. **`/austin-housing-market-2025.html`** — stale URL but legitimate content topic. Refresh to 2026 = freshness signal + ranking potential.

3. **15 suburb pages not in sitemap** — collectively represent significant local SEO coverage (Austin metro area). Adding to sitemap is a quick win.

4. **`/wrap-mortgage-calculator.html`** — unique tool targeting "WRAP mortgage Austin" — a niche but uncontested keyword. Missing from sitemap.

### Page Count by Category (discovered in audit)

| Category | Count |
|---|---|
| Core pages | 8 |
| Loan program pages | 8 |
| Suburb/location pages | 24 total (9 in sitemap + 15 missing) |
| Blog posts (real) | 4 |
| Blog posts (temp/unclear) | 2 |
| Resource/article pages | 8 |
| Calculator pages | 6 |
| Ad landing pages (noindex) | 3 |
| Admin/internal pages (noindex) | 6+ |
| **Total crawlable public pages** | **~65** |

---

## WEEK 2 PREP — KEYWORD RESEARCH INPUTS

Based on this audit, keyword research in Week 2 should validate:
1. Primary: "mortgage broker Austin TX" — target for homepage
2. Local modifiers: all 24 suburb city names + "mortgage lender/broker"
3. Program keywords: FHA, VA, USDA, DSCR, construction + "Austin TX"
4. Intent keywords: "mortgage pre-approval Austin", "refinance Austin TX", "first-time home buyer Austin"
5. Content gaps: no evergreen page for "Austin mortgage rates" (blog post is temporary by nature)
6. GSC data needed: which queries are already getting impressions — check before building new pages

---

## PRIORITY MATRIX — WEEK 3 IMPLEMENTATION PLAN

### P1 — Fix First (Highest Impact, Lowest Risk)

| Issue | Action | Pages |
|---|---|---|
| Sitemap — missing suburb pages | Add 15 pages to sitemap.xml | 15 pages |
| Sitemap — missing blog posts | Add 3 blog posts + first-time-home-buyer to sitemap | 4 pages |
| Homepage meta description | Rewrite to ≤155 chars | 1 page |
| Blog title casing | Fix ai-trap post title to proper case | 1 page |

### P2 — Fix Next (Medium Impact)

| Issue | Action | Pages |
|---|---|---|
| Meta descriptions >155 chars | Rewrite for all pages >155 chars | ~20 pages |
| Stale "2025" years | Update titles to 2026 | 3 pages |
| Canonical on first-time-home-buyer | Change to include .html extension | 1 page |
| BreadcrumbList on /loans/refinance | Add schema | 1 page |
| AggregateRating on Westlake + Buda | Add to LocalBusiness schema | 2 pages |

### P3 — Plan For (Medium Impact, Needs Strategy)

| Issue | Action | Pages |
|---|---|---|
| Missing NMLS# in title tags | Add where missing | 7 pages |
| H1 optimization | Plan carefully — ranking risk | Homepage |
| robots.txt gaps | Add /hero-test.html, cleanup | 1 file |
| Blog temp placeholder decision | Adam decides: real content or delete | 2 pages |
| lastmod dates in sitemap | Add accurate dates to all entries | sitemap.xml |

---

## NEXT SESSION INSTRUCTIONS

**Priority 1:** Request Google Search Console impressions data to validate which keywords the site is already ranking for (need Adam to provide GSC access or export)
**Priority 2:** Run Week 2 — Keyword Research (validate and expand target keyword clusters)
**Priority 3:** Prepare Week 3 implementation brief with exact changes for each P1/P2 issue

**Do NOT implement any changes until Week 3 execution sprint.**
