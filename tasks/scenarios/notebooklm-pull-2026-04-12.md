# NotebookLM Pull Report — 2026-04-12 AM
Active Topic: Tier 5 — Depth + Conversion

## What We Already Know
- Tiers 1-4 complete: input speed, share page redesign, PDF branding, AI narrative, all scenario types, workflow integration, mobile audit, "Commonly Chosen" badge, video embed
- Last session (2026-04-11): Scenario naming affordance — pencil icon on hover, labels flow to share page + PDF. Tier 5 item 3 COMPLETE.
- Design standards: IBM Plex Mono, gold #C9A84C, dark backgrounds, mobile-first
- Compliance: never recommend, never imply approval — trade-offs only
- The Golden Rule: tables ≤ 5 items, progressive disclosure, headline metric first

## Mortgage Coach Gaps (still open)
- Persistent comparison table (side-by-side on main view, not behind a tap)
- Refi builder pre-fill from loan record
- Social proof block (compliance-safe)
- Borrower-facing AI chat (longer-term)
- Mobile LO builder (longer-term)

## Prior Session Summary
Built: Scenario naming affordance (ScenarioCard.tsx). Label field + data flow were already wired end-to-end. Added gold Pencil icon on hover with tooltip. Commit 7648a9a → Vercel READY.

## Priority Improvements (Tier 5 remaining)
1. Comparison table on share page (item 2) — persistent below OptionCardsGrid
2. Refi builder: current loan pre-fill (item 4)
3. Social proof block (item 5)

## Briefing for Builder
Do NOT re-research:
- Share page architecture (12 components in src/components/share/)
- OptionCardsGrid / OptionCard pattern
- DetailAccordion location (already has the data — needs to be surfaced)
- PDF generation (separate, not in scope today)
New work: surface the comparison table data from DetailAccordion onto the main share page as a persistent, visible section below OptionCardsGrid
