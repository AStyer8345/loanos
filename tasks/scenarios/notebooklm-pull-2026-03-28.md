# NotebookLM Pull Report — 2026-03-28 AM
Active Topic: Down payment comparison mode

## What We Already Know
- All Tier 1 items complete (input speed, share page, PDF redesign, AI narrative)
- 2-1 buydown display complete (2026-03-27 AM) — buydown cost, break-even month, year-by-year grid
- Design system: IBM Plex Mono, gold #C9A84C, dark backgrounds, mobile-first share page
- Compliance: never recommend a product, never imply approval — trade-offs only
- Build must pass TypeScript strict mode after every change

## Mortgage Coach Gaps Still Open
- Down payment comparison (3% / 5% / 10% / 20%) — PMI tier effects, monthly delta, cash required
- Rent vs own mode — monthly rent vs PITI + equity build, 5-year breakeven
- ARM vs fixed comparison
- Total cost of waiting calculator
- Email scenario from builder

## Prior Session Summary
- 2026-03-27 AM: Built BuydownSection.tsx — year-by-year P&I grid, buydown cost, break-even month
- Commit 77b9828, Vercel dpl_oeAJMdtBaSq5pS5Yjp7npRqFWwt3 READY
- Next: down payment comparison mode

## Priority Improvements
1. Down payment comparison (Tier 2) — next
2. Rent vs own (Tier 2)
3. Email from builder (Tier 3)

## Briefing for Builder
- Do NOT re-research share page, PDF, or narrative — those are done
- Focus: down payment comparison mode
  - Same purchase scenario at 3% / 5% / 10% / 20% down
  - Show: monthly P&I, PMI (if applicable), total PITI, cash to close, DTI impact
  - PMI tiers: typically drops at 10%, eliminated at 20%
  - Use existing calculation engine patterns from route.ts
  - New component: DownPaymentSection.tsx (follows BuydownSection.tsx pattern)
  - Only renders in purchase mode when user selects "down payment comparison" or when multiple down pcts present
