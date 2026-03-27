# NotebookLM Pull Report — 2026-03-26 PM
Active Topic: AI Narrative Upgrade

## What We Already Know
- Input pre-fill already existed (no work needed)
- Share page redesigned 2026-03-25 AM — hero, summary stats, narrative, CTA
- PDF redesigned 2026-03-26 AM — hero block, summary stat cards, lede treatment
- NotebookLM seeded with Mortgage Coach competitor docs, TCA methodology, fintech UX 2026 research

## Mortgage Coach Gaps
- AI narrative is generic — doesn't feel written for the specific borrower
- Mortgage Coach NextGen has AI coaching interface with personalized guidance
- Reporting is static vs. Mortgage Coach's interactive homeowner strategies
- No proactive opportunity identification yet (Week 5 roadmap item)

## Prior Session Summary
- Built: PDF redesign in `src/app/api/scenarios/generate-pdf/route.ts`
  - Hero block with borrower name, hero stat, property address
  - Summary stat cards (purchase: lowest payment/closing/interest; refi: savings/break-even)
  - Lede treatment on AI narrative first paragraph
- Deferred: AI narrative personalization pass

## Priority Improvements
1. AI narrative upgrade — incorporate borrower first name + specific numbers
2. 2-1 buydown scenario type (Tier 2)
3. Down payment comparison mode (Tier 2)

## Briefing for Builder
DON'T re-research:
- Share page design (done)
- PDF layout (done)
- Pre-fill mechanics (done)

Focus new work here:
- `generate-narrative` route — how it currently prompts Claude and what data it receives
- Adding borrower first name to narrative opening
- Weaving in specific loan amounts, monthly payment deltas, break-even months into the 4-paragraph structure
- Keep compliance-safe framing (trade-offs only, no product recommendation)
