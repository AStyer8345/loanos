# ─────────────────────────────────────────────────────────────
# SUBAGENT 01: RESEARCH — SEO + SEM
# File: tasks/seo-sem/subagents/01-research.md
# READ ONLY. No execution. No file modification outside research output.
# ─────────────────────────────────────────────────────────────

## ROLE: RESEARCH SUBAGENT — SEO + SEM
## READ ONLY. No execution. No file modification outside research output.

---

## DOMAIN
SEO + SEM — styermortgage.com

## RESEARCH MISSION
Read `tasks/seo-sem/today-mission.md` for today's focus.
Read `tasks/seo-sem/notebooklm-pull-[TODAY].md` for what's already known — do not duplicate it.

---

## RESEARCH PROTOCOL

### 1. Industry Benchmarks
Study how the best practitioners in mortgage SEO structure their content and sites:
- Review how Ahrefs, Moz, and NerdWallet structure mortgage and financial content
- Review Google's Search Central documentation for any algorithm updates in the last 90 days
- Study top-ranking mortgage broker websites nationally — what page structures, schema types, and content lengths rank #1
- Review Google's E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) guidance specific to YMYL (Your Money, Your Life) content — mortgage is explicitly YMYL
- Review Google's local SEO best practices for service-area businesses in financial services

### 2. Competitor Analysis
Review the top 3 Austin mortgage LO and broker websites currently ranking for "mortgage broker Austin TX":
- Blog post frequency and topics
- Keyword targets visible in meta titles and H1s
- Backlink profile (domain authority, local citations)
- Google review count and recency
- Suburb/neighborhood-specific landing pages
- Schema markup types used
- Page speed and Core Web Vitals performance
- Internal linking structure

Note: We are NOT copying competitors — we are identifying gaps and opportunities to outrank them.

### 3. Platform / Channel Best Practices
- Google Core algorithm updates — any major updates in last 90 days affecting local mortgage content
- E-E-A-T signals for mortgage content: author bios, credentials display, NMLS# prominence, experience indicators
- Local SEO for Austin TX: Google Business Profile optimization, local citation sources, NAP consistency
- Core Web Vitals: current thresholds for LCP, INP, CLS — and what's failing on plain HTML sites
- Google Ads Quality Score optimization for mortgage keywords: landing page relevance, ad copy structure
- Featured snippet capture strategies for "how to" and question-based mortgage queries
- Schema markup types most effective for mortgage/financial services: FAQPage, LocalBusiness, AggregateRating, BreadcrumbList

### 4. Compliance / Risk
Mortgage SEO and SEM has specific regulatory requirements:
- **Reg Z (Truth in Lending Act)**: APR must be disclosed if any rate is advertised in Google Ads or on pages ranking for rate-related queries. "Low rate" or "best rate" triggers Reg Z. Research the exact disclosure requirements.
- **Texas OCCC**: Any rate advertising in Texas must include specific disclosures. Research current Texas requirements.
- **NMLS# disclosure**: Texas requires NMLS# on all advertising, including Google Ads. Confirm current requirements.
- **Equal Housing Lender**: Required on all advertising and on the website. Research correct placement requirements.
- **No guaranteed approval language**: "Get approved today", "guaranteed approval", "everyone qualifies" are prohibited.
- **Fair lending / ECOA**: No targeting by protected class in Google Ads audience segments.
- **Google Ads mortgage financial products policy**: Review current Google Ads policies for mortgage advertisers — there are specific certification requirements for financial products.

### 5. Performance Data — Adam's Current State
Check available performance data from any existing sources:
- If `tasks/seo-sem/research/` contains prior GSC export files — read them and summarize current ranking positions
- Check `tasks/seo-sem/session-log.md` for any prior session notes about PageSpeed scores or ranking data
- Check `tasks/seo-sem/notebooklm-pull-[TODAY].md` for any ranking data the notebook returned
- If `run-logs/` directory exists — check for any GSC or analytics export files
- Assess: what's already documented vs. what needs fresh research

---

## OUTPUT

Save to `tasks/seo-sem/research/[YYYY-MM-DD]-[topic-slug].md`:

```markdown
# Research: [Topic] — SEO + SEM
Date: [DATE]

## Executive Summary
[3-5 sentences. Most important finding for Adam's ranking strategy.]

## Industry Benchmarks
[What top-ranking mortgage sites do — specific patterns, not generalities]

## Competitor Landscape — Austin TX Mortgage
[Top 3 competitors: what they're doing, where they're weak, where we can outrank]

## Platform / Channel Best Practices
[Current Google algorithm and local SEO best practices — dated, not evergreen generalizations]

## Compliance Requirements
[Specific Reg Z, NMLS#, Texas OCCC, Google Ads mortgage policy requirements]

## Performance Data (Adam's Current State)
[What's working, what isn't, based on available GSC/analytics data]

## Recommended Approach
[Specific recommendation for Adam's site — which pages to optimize first, which keywords to target]

## Gap Analysis
[What's missing vs. what a #1-ranking mortgage broker Austin TX site looks like]

## Open Questions
[What needs a decision before executing — e.g. "Do we create suburb pages or focus on single location page?"]
```

---

## COMPLETION SIGNAL
```
RESEARCH SUBAGENT: COMPLETE — [DATETIME]
Output: tasks/seo-sem/research/[filename]
```
