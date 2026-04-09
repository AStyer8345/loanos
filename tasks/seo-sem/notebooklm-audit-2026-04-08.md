# NotebookLM Staleness Audit — 2026-04-08

## Sources Flagged as Stale
| Source | Age | Reason | Action |
|--------|-----|--------|--------|
| 2026-03-27-content-strategy-web.md | 12 days | Same topic (content strategy) as 2026-03-30-content-strategy-ftb-gsc-web.md which is newer and more comprehensive — duplicate per rule 4 | REMOVE |
| CONTEXT.md | 1 day (stale version) | CONTEXT.md was updated in commit f3ede32 (2026-04-08b daily-opt run) — notebook has yesterday's version | REPLACE |

## Sources Confirmed Current
| Source | Age | Status |
|--------|-----|--------|
| 2026-03-26-keyword-research.md | 13 days | CURRENT — foundational keyword data, not superseded |
| 2026-03-26-keyword-strategy-spec.md | 13 days | CURRENT — active strategy spec, still governing Week 3+ work |
| 2026-03-28-schema-eeat-web.md | 11 days | CURRENT |
| 2026-03-30-content-strategy-ftb-gsc-web.md | 9 days | CURRENT — supersedes March 27 file |
| 2026-04-01-blog-content-tcpa-web.md | 7 days | CURRENT |
| 2026-04-02-self-employed-pillar-web.md | 6 days | CURRENT |
| 2026-04-03-aeo-entity-signals-web.md | 5 days | CURRENT |
| 2026-04-05-gsc-monitoring-web.md | 3 days | CURRENT |
| 2026-04-06-local-seo-ai-web.md | 2 days | CURRENT |
| ARCHITECTURE.md | 1 day | CURRENT — not modified today |
| google-ads-suburb-campaigns.md | 13 days | CURRENT — spec still valid |
| All web sources (March 25 – April 6) | 2–14 days | CURRENT — none exceed 60-day threshold |

## Recommended Removals
- 2026-03-27-content-strategy-web.md — duplicate on content strategy topic; March 30 version is more comprehensive

## Recommended Replacements
- CONTEXT.md (old, notebook ID cc81bd76) → CONTEXT.md (refreshed, updated 2026-04-08b)

## New Web Source to Add
- https://searchengineland.com/seo-page-titles-meta-descriptions-clicks-448381
  - Reason: directly relevant to current Week 3 focus (title tags + meta descriptions); not in notebook; authoritative domain
  - Topic: Page title/meta description optimization for CTR — fills gap alongside existing on-page and E-E-A-T sources

## Capacity
- Before: 50/50
- After: 50/50 (remove 2 + add 2)

## NotebookLM Internal Findings
NotebookLM identified the following as potentially outdated knowledge within sources:
- FID (First Input Delay) referenced in older guides — superseded by INP as Core Web Vital for responsiveness
- FAQ rich results no longer apply to styermortgage.com (restricted to gov/health) — FAQ schema now relevant only for AI citation (AAO)
- "Google My Business" terminology in older guides — should be "Google Business Profile"
- /austin-housing-market-2025.html flagged as stale content — documented in CONTEXT.md, needs 301 redirect or update
- Week 1 "critical" sitemap gaps — already resolved (commit 9313067)
Note: These are within-source observations, not source-level removals. No action needed beyond awareness.
