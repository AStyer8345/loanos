# NotebookLM Staleness Audit — 2026-04-02

## Sources Flagged as Stale
| Source | Age | Reason | Action |
|--------|-----|--------|--------|
| SEJ Google mortgage info search (error, no URL stored) | 1 day | Status: error — never successfully loaded; broken source occupying a slot | REMOVE |
| "Answer Engine Optimization: Complete AEO Guide [2026]" (frase.io) | 10 days | Non-authoritative domain (not on approved list: frase.io is a mid-tier SaaS blog); AEO concept covered by more authoritative E-E-A-T / structured data sources already in notebook | REMOVE |
| "Google Ads Guide 2026 — Strategies & CPL Benchmarks" (leadgen-economy.com) | 10 days | Non-authoritative domain; leadgen-economy.com is a marketing agency blog, not on approved list; Google Ads guidance covered by Google Ads Help sources already in notebook | REMOVE |
| "SEO for Mortgage Brokers [Dead Simple Guide] - Padula Media" (padulamedia.com) | 10 days | Non-authoritative domain (small agency blog); superseded by Ahrefs, SEJ, and Backlinko financial services + local SEO sources added in later sessions | REMOVE |

## Sources Confirmed Current
All remaining 47 sources are from March–April 2026 or are authoritative evergreen references (Google Search Central, Moz, Ahrefs, Backlinko, SEJ, Search Engine Land). All within 60-day retention window.

## Notable Status
- Source 50 (SEJ URL) has status: error — never loaded. No content value.
- 4 non-authoritative domain sources from initialization (2026-03-23) remain from first-pass notebook population — now superseded.

## Recommended Removals
1. `d74438e3` — SEJ mortgage SERP URL (error status, 0 content loaded)
2. `9585f9a6` — frase.io AEO guide (non-authoritative)
3. `ae0a2afa` — leadgen-economy.com Google Ads guide (non-authoritative)
4. `a4088305` — padulamedia.com mortgage SEO guide (superseded)

## Post-Removal Plan
Current count after removals: 47 → room for 3 new sources
Add today's session files:
1. styermortgage.com self-employed mortgage blog post (published 2026-04-02)
2. Authoritative self-employed mortgage SEO source (Ahrefs or SEJ)
3. Web research file: research/2026-04-02-self-employed-mortgage-web.md (to be created this PM session)
