## Scenarios Mission Brief — 2026-03-26 PM

### Focus Area
AI Narrative Personalization — name-driven opening, possessive language, property address context

### Why This Matters
Mortgage Coach narratives feel personal because they reference the borrower by name and use possessive language. LoanOS narrative currently frames the prompt "for [name]" but never directs Claude to OPEN with the name or say "your payment". The output reads like a generic analysis that could belong to anyone. Borrowers who receive a share link or PDF that says "Sarah, the 30-year fixed saves you $127/month..." feel seen. They share it. They call back.

### Session Type
[x] Build (system prompt edit only — no new architecture)

### Objectives
1. Paragraph 1 opens with borrower's first name directly ("Sarah, Option A...")
2. Possessive language throughout ("your monthly payment", "your closing costs", "your break-even")
3. Property address added to data context so Claude can reference the specific home
4. Narrative still compliance-safe: trade-offs only, no product recommendation, no protected classes

### Files in Scope
- `src/app/api/scenarios/generate-narrative/route.ts` — ONLY this file

### Definition of Done
- `borrowerName` first name extracted and used in paragraph opening instruction
- `propertyAddress` extracted from body and added to data context
- System prompt paragraph instructions updated with name + possessive language directives
- `npm run build` passes with 0 TypeScript errors
- No auth/RLS/multi-tenant code touched

### Subagents to Activate
Note: Only 00-notebooklm.md subagent exists. Builder/QA/Reporter running inline.
[x] Builder (inline)
[x] QA (npm run build)
[x] Reporter (session-log.md update)
