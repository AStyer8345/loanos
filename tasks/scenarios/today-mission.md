## Scenarios Mission Brief — 2026-04-08 AM

### Focus Area
"Commonly Chosen" visual highlight on share page OptionCards

### Why This Matters
Mortgage Coach guides borrowers to focus on one option visually — LoanOS Scenarios shows all options equally, leaving borrowers overwhelmed. Adding a "Commonly Chosen" badge on the lowest-payment card gives borrowers a visual anchor without violating compliance (no recommendation, no "Best Option" framing).

### Session Type
[x] Build

### Objectives
1. OptionCardsGrid computes which scenario has the lowest total monthly payment
2. That card renders a "Commonly Chosen" badge and receives the gold visual treatment
3. Compliant framing only — never "Best Option", never imply approval
4. Works for 1, 2, or 3 scenarios (badge hidden if only 1 scenario)

### Files in Scope
- src/components/share/OptionCard.tsx
- src/components/share/OptionCardsGrid.tsx
ONLY these two files.

### Definition of Done
- npm run build passes (0 TypeScript errors)
- "Commonly Chosen" badge appears on the card with the lowest totalMonthlyPayment
- Gold card accent follows the badge (not hardcoded to index 0)
- Badge hidden when there is only 1 scenario
- Committed and pushed

### Subagents to Activate
[x] Builder Subagent (inline this session)
[ ] QA Subagent
[ ] Reporter Subagent
