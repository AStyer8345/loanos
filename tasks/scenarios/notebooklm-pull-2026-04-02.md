# NotebookLM Pull Report — 2026-04-02 AM
Active Topic: ARM vs Fixed Comparison (Tier 3 item 2)

## What We Already Know
- Tier 1 (share page, PDF, AI narrative, input speed) — all COMPLETE
- Tier 2 (2-1 buydown, down payment comparison, rent vs own) — all COMPLETE
- Tier 3 item 1 (Email from Builder) — COMPLETE 2026-03-30 AM
- Build system: Next.js 14 App Router, Supabase, Tailwind, IBM Plex Mono, gold #C9A84C, dark backgrounds
- Design standard: diagrams beat grids on mobile (70%+ borrowers on phones)
- Compliance rule: trade-offs only, never recommend a product, never imply approval

## Mortgage Coach Gaps
Remaining advantages not yet closed:
- ARM vs Fixed comparison — LO must show initial savings vs long-term rate risk
- Total Cost of Waiting — "What does waiting 6 months cost?" emotional urgency tool
- Engagement tracking — know when borrower views the share page
- Equity build curves as standalone emotional chart (bar charts exist but no overlaid balance curve)
- Mobile-optimized share page view (tables may not scan well on small screens)

## Prior Session Summary
2026-03-30 AM: Email from Builder completed
- ActionsBar.tsx: "Email Borrower" button → inline email input → API saves scenario → n8n Outlook draft
- No modal, in-page panel, 4-second success state
- MC gap closed: 1 step instead of 4 to send share link to borrower

## Priority Improvements
1. **ARM vs Fixed** (Tier 3 item 2) — immediate next per session log
2. **Total cost of waiting** (Tier 3 item 3) — urgency/emotional tool
3. **Engagement tracking** — view_count display after save (schema already has column)

## Briefing for Builder
DO NOT re-research:
- Share page design (done)
- PDF layout (done)
- AI narrative personalization (done)
- Buydown, down payment, rent vs own calculation patterns (done)

Focus new work on:
- ARM vs Fixed: show 5/1 ARM initial savings vs 30yr fixed, break-even year if rates rise
- Use existing calculation patterns from BuydownSection / DownPaymentSection as model
- Client-side math only (no API call needed)
- Must render in purchase mode results
- Must pass `npm run build` with zero TypeScript errors
