# NotebookLM Pull Report — 2026-03-29 AM
Active Topic: Rent vs Own Mode (Tier 2 item 3)

## What We Already Know

- All Tier 1 improvements complete: input speed, share page, PDF redesign, AI narrative
- Tier 2 items 1 (2-1 buydown) and 2 (down payment comparison) complete
- Design system: IBM Plex Mono, gold #C9A84C, dark backgrounds, mobile-first
- Compliance rule: trade-offs only, never recommend a product or imply approval
- Share page: borrower-facing, hero stat, summary stat cards, narrative, CTA

## Mortgage Coach Gaps

Still open vs MC NextGen:
1. Mobile-first agility — LoanOS share page lacks optimized mobile view
2. Borrower-facing AI chat (24/7 in-presentation Q&A)
3. "Emotional" scenario modes — rent vs own, total cost of waiting
4. ARM vs Fixed comparison mode
5. Email from builder (send share link directly to borrower)

## Prior Session Summary

Last session (2026-03-28 AM): Built Down Payment Comparison section (DownPaymentSection.tsx)
- 4 down payment tiers (3/5/10/20%), PMI tier effects, break-even month
- Pure client-side math, no API call
- Gold highlight on lowest monthly, green on lowest cash to close

Deferred to this session:
- Rent vs Own mode (Tier 2 item 3) — researched, design ready
- Email from builder (Tier 3 item 1)

## Priority Improvements

1. **Rent vs Own** — IMMEDIATE BUILD. Hero: "Break even in Year X". Timeline chart showing equity accumulation vs renting total cost over 15 years. "Buying saves $X over Y years" emotional hook.
2. Email from builder — Tier 3, send share link from results footer
3. ARM vs Fixed — Tier 3

## Briefing for Builder

DO NOT re-research:
- Down payment comparison (done)
- Buydown display (done)
- Share page hero pattern (done — replicate for rent vs own inputs)
- PDF hero pattern (done)

FOCUS THIS SESSION:
- Build RentVsOwnSection.tsx component (client-side calc, no API call)
- Inputs: monthly rent, purchase price, down%, rate, term, taxes, HOI, HOA
- Key outputs: break-even year, monthly rent vs PITI, equity at year 5/10/15, total cost of renting vs owning
- Hero metric: "Break even in Year X" — bold, gold
- Comply: "illustrative estimates only" footer
- Render in purchase mode, after DownPaymentSection
