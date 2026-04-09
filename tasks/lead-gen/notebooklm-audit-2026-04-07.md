# NotebookLM Staleness Audit — 2026-04-07

Session: PM (10:00 PM)
Current source count: 59 (exceeds 50-source limit)
Target after removals: ~54 (with adds) — flagged for further review

---

## Sources Flagged as Stale

| Source | ID | Age | Reason | Action |
|--------|-----|-----|--------|--------|
| Flip the Script on Mortgage-Lead Generation - Scotsman Guide | 75ac7424 | 8+ years (2018 article) | Explicitly flagged in April 3 PM research as stale; removed from active strategy | REMOVE |
| CONTEXT.md (Apr 4 version) | 7f68afc3 | 3 days old | Modified today at 21:40 — must replace with current | REMOVE + REPLACE |
| Functions overview - Netlify Docs | d79b1c0e | 7+ days | Arive webhook ported to Next.js/Vercel; Netlify functions no longer in use | REMOVE |
| Environment variables and functions - Netlify Docs | a48cde90 | 7+ days | Same reason — Netlify-specific infrastructure superseded by Vercel | REMOVE |
| 2026-03-30-pm-web-research.md | f921ecaf | 8 days | Oldest PM research batch; superseded by 7 newer PM research files | REMOVE |
| 2026-03-31-pm-web-research.md | 39950ece | 7 days | Superseded by newer weekly research batches | REMOVE |
| 2026-04-01-pm-web-research.md | bfe51b96 | 6 days | Superseded by newer weekly research batches | REMOVE |
| 2026-04-02-pm-web-research.md | 5cc2631b | 5 days | FTB research coverage fully replaced by FTB spec + build files | REMOVE |
| 2026-04-03-pm-web-research.md | 2d59bcd7 | 4 days | FTB content superseded; Scotsman "Flip the Script" already removed | REMOVE |

## Sources Confirmed Current

| Source | ID | Age | Status |
|--------|-----|-----|--------|
| 12 CFR Part 1026 - Reg Z | 3c2b8328 | Amended Jan 2026 | CURRENT — regulatory baseline |
| CAN-SPAM Act Guide | c068a394 | Jan 2024 | CURRENT — compliance reference |
| All funnel build/spec/qa files (Mar 27 – Apr 7) | multiple | 0-11 days | CURRENT — active program record |
| Scotsman Guide articles (Apr 4–6) | multiple | 1-3 days | CURRENT — industry context |
| Mailchimp docs | multiple | varies | CURRENT — email platform reference |
| domain-queue.md | 83d563e9 | permanent | CURRENT — foundational |
| lessons.md | 3a6b24a1 | permanent | CURRENT — foundational |

## Recommended Removals
- 9 sources removed as listed above (stale, superseded, or replaced)
- CONTEXT.md removed to be replaced with today's version (Apr 7 21:40)

## Post-Session Source Count
- Before: 59
- Removed: 9
- Added: 1 (updated CONTEXT.md) + 3 web URLs
- After: ~54
- Status: Still 4 over limit — further curation deferred to next session

## Flagged for Next Session Review
- session-log.md (d3791155) — large file, review for truncation
- 2026-04-05-pm-web-research.md (97d6b234) — confirm no unique content before removing
