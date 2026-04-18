## Scenarios Mission Brief — 2026-04-18 AM

### Focus Area
Borrower-facing AI chat on share page (Tier 7 Item 1)

### Why This Matters
The biggest remaining Mortgage Coach gap: 24/7 interactive Q&A. When a borrower opens a
share link at 9pm with questions, today they either call Adam, do nothing, or go to Google.
After this: they get instant, scenario-specific answers without Adam lifting a finger.
MC charges extra for this. LoanOS does it for free via the existing Anthropic client.

### Session Type
[x] Build

### Objectives
1. Public POST /api/share/[token]/chat endpoint — takes question + history, fetches scenario
   by token, calls Claude with scenario context, returns plain-text answer
2. BorrowerChat.tsx component — input field, message thread, loading dots, max 3 turns,
   renders below BorrowerQA on share page, print:hidden

### Files in Scope
- src/app/api/share/[token]/chat/route.ts (new)
- src/components/share/BorrowerChat.tsx (new)
- src/components/share/SharePageLayout.tsx (add token prop + render chat)
- src/app/share/[token]/page.tsx (pass params.token to layout)

### Definition of Done
- npm run build passes, 0 TypeScript errors
- Chat endpoint returns a scenario-specific answer for a test question
- Component renders below BorrowerQA, matches LoanOS dark theme
- print:hidden (does not appear in PDF)
- Rate limiting applied (20/min per IP, 10/min per token)
- Max 3 user turns enforced client-side

### Subagents to Activate
[ ] Research Subagent — skipped (MC gap is well-understood)
[x] Builder Subagent — master agent acting as builder
[x] QA Subagent — npm run build + TypeScript check
[ ] Reporter Subagent — session log update (master agent handles)
