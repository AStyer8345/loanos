# GSC Analysis — styermortgage.com
# Export date: 2026-03-26 | Period: Last 3 months (data starts ~Mar 18 — site connected recently)

---

## DATA CONTEXT

GSC data only goes back to ~March 18. This is 8 days of data.
GTM (and likely GSC verification) was installed March 20.
All impressions/clicks are very early-stage — treat as baseline, not trend.

Total clicks (7 days): 5
Total impressions (7 days): ~1,100
Overall avg position: ~44

---

## CRITICAL FINDING: DUPLICATE URL ISSUE (HIGH PRIORITY)

Google is indexing BOTH `.html` and non-`.html` versions of the same pages.
This splits impressions and link equity across two URLs for the same content.

| Page | URL with .html | URL without .html | Issue |
|---|---|---|---|
| FHA | pos 40.14, 65 imp | pos 17.17, 94 imp | Non-.html ranking BETTER |
| Jumbo | pos 14.1, 30 imp, 1 click | pos 27.68, 72 imp | .html ranking better |
| Round Rock | pos 38.8, 15 imp | pos 16.38, 21 imp | Non-.html ranking better |

**Root cause:** Netlify likely serves both `/loans/fha` and `/loans/fha.html` as valid URLs.
The canonical in the HTML says `.html` — but Google is preferring the extensionless version on FHA and Round Rock.

**Fix needed (MEDIUM_RISK):** Add Netlify redirects to 301 non-.html → .html for all loan/suburb pages, OR flip canonicals to the extensionless version consistently. Cannot do both — pick one and commit.

**Recommendation:** Redirect extensionless → .html (matches existing canonicals). Add to `_redirects`.

---

## QUICK WIN OPPORTUNITIES

### 1. Wraparound Mortgage Calculator — Position 8.75 (BEST RANKING)
Query: `wraparound mortgage calculator`
Impressions: 8 | Clicks: 0 | Position: 8.75

**This is almost page 1.** Zero clicks likely because the title/meta description isn't enticing enough.
Page: `/wrap-mortgage-calculator.html`
Action: Optimize title tag + meta description for this query. Already in backlog as LOW_RISK.

### 2. FHA Cluster — Strong Impression Volume
| Query | Position | Impressions |
|---|---|---|
| fha loans austin tx | 21.2 | 15 |
| fha lenders near me | 17.14 | 14 |
| fha lenders austin tx | 16.83 | 12 |
| fha lenders | 15.75 | 8 |
| fha loan near me | 21 | 4 |
| fha loan austin tx | 28.5 | 4 |

**FHA is the #2 opportunity after fixing duplicate URLs.** Position 16-21 = page 2.
Page: `/loans/fha.html` (but currently split between .html and extensionless — fix that first)

### 3. Mortgage Broker Cluster — Position 14-35
| Query | Position | Impressions |
|---|---|---|
| mortgage broker | 14.44 | 25 |
| mortgage broker near me | 23.94 | 17 |
| austin mortgage broker | 25.08 | 13 |
| mortgage brokers austin tx | 25.75 | 4 |
| mortgage broker austin tx | 33 | 4 |
| mortgage broker austin | 35 | 8 |

**Homepage is ranking for these at position 14-35.** Position 14 for generic "mortgage broker" is strong.
The duplicate URL fix + meta description rewrite on homepage could move these to page 1.

### 4. Jumbo Cluster — Position 14-20
| Query | Position | Impressions |
|---|---|---|
| jumbo mortgage austin | 14.67 | 3 |
| jumbo loan austin | 17 | 2 |
| jumbo mortgage lenders | 17 | 1 |
| jumbo lenders austin tx | 12 | 1 |

`/loans/jumbo.html` already has 1 click and position 14. Strong page — fix the duplicate URL and it should consolidate authority.

### 5. Mortgage Specialist — Position 19.7 (Unexpected)
Query: `mortgage specialist`
Impressions: 40 | Position: 19.7

This is a generic (non-Austin) term getting 40 impressions. That's the most impressions of any single query.
Likely tied to the About page (pos 13.86) or homepage.

---

## PAGE PERFORMANCE

| Page | Clicks | Impressions | Position | Notes |
|---|---|---|---|---|
| Homepage (/) | 3 | 751 | 45.82 | Highest impressions — too deep |
| /loans/jumbo.html | 1 | 30 | 14.10 | Best CTR conversion — consolidate URLs |
| /contact.html | 1 | 24 | 30.29 | Getting clicks — good |
| /loans/fha (no .html) | 0 | 94 | 17.17 | Duplicate URL — needs redirect |
| /loans/jumbo (no .html) | 0 | 72 | 27.68 | Duplicate URL — needs redirect |
| /loans/fha.html | 0 | 65 | 40.14 | Being split from extensionless |
| /calculators.html | 0 | 25 | 31.96 | Good topic, deep position |
| /round-rock-mortgage-lender | 0 | 21 | 16.38 | Duplicate URL — needs redirect |
| /about.html | 0 | 14 | 13.86 | Ranking well, no CTR |
| /realtor-resources.html | 0 | 8 | 7.75 | Best position on site — no clicks |

**UNEXPECTED:** `/realtor-resources.html` at position 7.75 is the best-positioned page. 8 impressions only but the position is strong. This page may rank well once more queries find it.

**UNEXPECTED:** `/contact-us` getting 1 impression — this URL doesn't exist. 404 or redirect gap.

---

## DEVICE SPLIT

Desktop: 401 impressions, 4 clicks, 1% CTR, pos 29
Mobile: 692 impressions, 1 click, 0.14% CTR, pos 46

Mobile is getting 63% of impressions but only 20% of clicks. Mobile positions are much deeper (46 vs 29). Mobile performance is the primary bottleneck.

---

## UPDATED PRIORITY RECOMMENDATIONS

### Immediate (add to backlog P1):
1. Fix duplicate URL split (`.html` vs extensionless) — add Netlify redirects
2. Optimize wrap-mortgage-calculator meta description (position 8.75, 0 clicks)

### Already in backlog, now validated by data:
- Homepage meta description rewrite (751 impressions, 0.4% CTR)
- FHA page optimization (high impression volume, page 2)

### Deprioritize:
- Suburb pages below Hutto/Taylor (no impressions yet — not worth optimizing before fixing core pages)

### New content gap:
- `mortgage specialist` getting 40 impressions with no dedicated page — might be worth an About page content update or new service page
- `lenders in austin capitol` getting 11 impressions at position 66 — suggests geographic content opportunity (Austin neighborhoods/districts)
