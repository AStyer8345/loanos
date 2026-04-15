## Scenarios Mission Brief — 2026-04-15 AM

### Focus Area
Tier 6 launch: DetailAccordion cleanup + Pre-generated Borrower Q&A on share page

### Why This Matters
Tier 5 is complete. The single biggest remaining MC gap: borrowers receive a link with data
but no way to ask "what does this mean for me?" MC has a conversational layer that helps
borrowers self-serve. LoanOS can close this gap with pre-generated Q&A — 5 scenario-specific
questions answered by Claude at save time, surfaced on the share page as a mobile-friendly
accordion. Zero cost per view (generated once, stored in DB). No compliance risk (trade-offs,
no recommendations). Instant value for any borrower who doesn't understand the numbers.

Also: the "Full Scenario Comparison" accordion item in DetailAccordion is now fully redundant —
ScenarioComparisonTable displays the same data persistently above it. Remove it.

### Session Type
[x] Full cycle (Research → Build → Test)

### Objectives
1. DetailAccordion shows only 5-Year & 15-Year Projections; "Full Scenario Comparison" removed
2. Pre-generated Q&A: 5 borrower-specific Q&A pairs stored in scenarios.borrower_qa JSONB
3. Q&A renders on share page as expandable accordion (mobile-first, print:hidden)
4. Q&A generated fire-and-forget after ActionsBar save — zero UI latency on the LO side
5. npm run build passes, Vercel deploys READY

### Files in Scope
- src/components/share/DetailAccordion.tsx
- src/components/share/BorrowerQA.tsx (new)
- src/components/share/SharePageLayout.tsx
- src/app/api/scenarios/generate-qa/route.ts (new)
- src/app/api/share/[token]/route.ts
- src/app/share/[token]/page.tsx
- src/app/dashboard/scenarios/new/ActionsBar.tsx
- Supabase migration: borrower_qa JSONB on scenarios

### Definition of Done
- DetailAccordion no longer has "Full Scenario Comparison" item
- When LO saves a scenario, Q&A is generated in background (fire-and-forget)
- Share page shows "Common Questions" accordion with 5 Q&A pairs if present
- Build passes with 0 TypeScript errors
- Vercel deployment reaches READY

### Subagents to Activate
[x] Builder (direct — no separate subagents available)
[x] QA (npm run build)
[x] Reporter (session-log + CONTEXT.md + CHANGELOG updates)
