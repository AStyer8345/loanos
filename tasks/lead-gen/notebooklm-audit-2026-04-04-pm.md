# NotebookLM Staleness Audit — 2026-04-04 PM

## Sources Flagged as Stale and Removed

| Source | ID | Reason | Action |
|--------|-----|--------|--------|
| 2026-03-27-pre-approval-funnel-research.md | 09006e6d | First-draft research superseded by finalized PA Funnel spec + build report | REMOVED |
| 2026-03-28-rate-alert-funnel-research.md | d10265f7 | First-draft research superseded by Rate Alert spec + build report | REMOVED |
| 2026-04-02-ftb-expansion-research.md | 82a9a47c | Research superseded by finalized FTB DPA Guide spec (2026-04-02-ftb-dpa-funnel-spec.md) | REMOVED |
| 2026-03-26-form-destination-audit.md | 0bfc5d39 | Early form audit superseded by PA Funnel QA report + post-deploy QA (2026-03-30) | REMOVED |
| Email Marketing Benchmarks & Industry Statistics \| Mailchimp | 62c12d52 | Data last updated Dec 2023 — predates Homebuyers Privacy Protection Act (March 2026); benchmarks are no longer reliable for 2026 planning | REMOVED |
| 2026-03-28-pm-web-research.md | 74644066 | Old general PM web research from Week 2 — topics covered by newer topic-specific files | REMOVED |
| 2026-03-29-pm-web-research.md | 9c3f0fca | Old general PM web research from Week 3 — superseded by more recent research; removed to reach 50-source max | REMOVED |

## Sources Refreshed

| Old Source | New Source | Reason |
|-----------|-----------|--------|
| CONTEXT.md (ecb5e723, 2026-03-30) | CONTEXT.md (7f68afc3, 2026-04-04) | CONTEXT.md updated in commit f982a38 (chatbot loop fix + markdown rendering session) |

## Sources Confirmed Current

All remaining 50 sources are current as of 2026-04-04. See `notebooklm source list` for full inventory.

## Web Research Added This Session

| URL | Title | Status |
|-----|-------|--------|
| https://www.scotsmanguide.com/residential/get-ahead-of-the-next-refi-wave/ | Get Ahead of the Next Refi Wave — Scotsman Guide | ADDED (id: cbb568f9) |

## Web Research Failures

| URL | Domain | Error |
|-----|--------|-------|
| https://www.nationalmortgagenews.com/news/trigger-lead-limits-push-lenders-toward-new-marketing | NMN | Paywall |
| mpamag.com (x3 articles) | MPA | Cloudflare block |

**Note:** mpamag.com and nationalmortgagenews.com are both inaccessible to NotebookLM. Do not attempt these domains in future web research sweeps.

## Final Notebook Count

**50 sources** (at max — maintain this limit going forward)

## Next Audit Recommendation

- Remove `2026-03-30-pm-web-research.md` or `2026-03-31-pm-web-research.md` when adding new Refi Watch specs in the next session
- The Refi Watch Architect spec, when created, will supersede the current research file (190288b2)
