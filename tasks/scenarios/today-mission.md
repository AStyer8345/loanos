## Scenarios Mission Brief — 2026-03-30 AM

### Focus Area
Email from Builder — send scenario share link directly to borrower from the results tab

### Why This Matters
Mortgage Coach lets LOs send the presentation with one click from inside the tool.
LoanOS currently requires Adam to: (1) copy the share link, (2) open Outlook, (3) compose email, (4) paste link.
That 4-step friction prevents the feature from being used consistently.
This closes the single biggest workflow gap vs MC.

### Session Type
[x] Build

### Objectives
1. "Email Borrower" button in ActionsBar — saves scenario (if needed), shows inline email input
2. Adam enters borrower email → hits Send → Outlook draft created via n8n webhook
3. Build passes, no TypeScript errors

### Files in Scope
- `src/app/dashboard/scenarios/new/ActionsBar.tsx` — add Email button + inline input
- `src/app/api/scenarios/send-email/route.ts` — new API route

### Definition of Done
- Email button appears in ActionsBar alongside PDF/Share/Save buttons
- Clicking opens an inline email input panel (not a modal — stays in-page)
- Adam enters email, clicks Send → success state shown
- API route calls N8N_OUTLOOK_DRAFT_WEBHOOK_URL with share URL + borrower name
- `npm run build` passes with 0 TypeScript errors
- No auth/RLS/multi-tenant changes

### Subagents to Activate
[x] Builder (direct build — no research needed, pattern already established)
[x] QA
[x] Reporter
