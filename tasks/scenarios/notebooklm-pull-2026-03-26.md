# NotebookLM Pull Report — 2026-03-26 AM
Active Topic: PDF Redesign (Tier 1 — next after share page)

## What We Already Know
- LoanOS Scenarios has functional PDF with dark header, gold bar, tables, charts, narrative, closing costs
- Share page was redesigned last session (2026-03-25 AM) — now has hero stat, summary stat bar, narrative with lede, CTA block
- PDF opens with "Sarah — Purchase Analysis" headline then immediately dumps the comparison table — no emotional hook
- Mortgage Coach presentations lead with aspirational content, not data tables
- Best practice: comparison tools should lead with the most important number (lowest payment or savings), not the table itself
- IBM Plex Mono + gold #C9A84C + dark backgrounds = LoanOS design system
- Compliance rule: trade-offs only, never recommend a product or imply approval

## Mortgage Coach Gaps (still open after 2026-03-25 AM)
- PDF is "functional but not impressive — borrowers don't share it"
- No hero stat in PDF header (share page has it, PDF does not)
- No summary stat bar in PDF (share page has 3-card summary, PDF does not)
- AI narrative renders flat — no visual lede or first-sentence emphasis
- AI narrative is generic — doesn't feel personalized (deferred to future session)

## Prior Session Summary
**2026-03-25 AM — Share Page Redesign:**
- Added hero section: borrower first name + "Starting At $X/mo" (purchase) or "Save $X/mo" (refi)
- Added summary stat bar: 3 cards (lowest payment, lowest CTC, lowest 15yr interest / savings, 5yr, break-even)
- AI narrative rendered with first sentence gold-highlighted as lede
- CTA block: Calendly + application link
- Build ✅, commit c2fa685, pushed to main

**Deferred:**
- PDF redesign (today's priority)
- AI narrative upgrade (personalization — session after PDF)

## Priority Improvements
1. **PDF hero stat** — add to PDF header: borrower name as headline + hero number (Starting At $X/mo or Save $X/mo)
2. **PDF summary stat cards** — 3 cards at top matching share page pattern
3. **PDF narrative lede** — first paragraph gets gold left border + slightly larger text
4. AI narrative upgrade — more personalized (next session)
5. 2-1 buydown scenario type (Tier 2)

## Briefing for Builder
Do NOT re-research:
- Share page structure (already built, reference it for patterns)
- PDF route structure (already read — `src/app/api/scenarios/generate-pdf/route.ts`)
- Design system (IBM Plex Mono, #C9A84C gold, #0A1628 dark navy, #F2F0EB warm cream)

Focus new work on:
- Add `renderHeroTitleBlock()` replacing the current title + meta section in PDF HTML
- Add `renderSummaryStatCards()` with 3 cards matching share page pattern
- Update `renderNarrativeHTML()` to gold-border the first paragraph
- Only touch `src/app/api/scenarios/generate-pdf/route.ts`
