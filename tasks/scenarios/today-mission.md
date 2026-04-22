## Scenarios Mission Brief — 2026-04-22 AM

### Focus Area
Tier 8 Items 1 + 3: Borrower Intent Capture + LO Personal Note

### Why This Matters
Borrower intent: Adam currently has no signal on which option a borrower is leaning toward before they call.
"Which option interests you most?" tap closes this gap — MC charges for this signal, LoanOS does it free.

LO personal note: Share page feels impersonal — just data and an AI voice.
A gold-bordered handwritten note from Adam makes the presentation feel like it was written for this specific borrower.

### Session Type
[x] Build

### Objectives
1. BorrowerIntentCapture.tsx — 3-button tap on share page, writes to scenarios.borrower_intent, notifies Adam via Resend
2. LONoteCard.tsx — per-scenario note (max 250 chars) in ActionsBar panel, renders gold-bordered on share page above BorrowerChat
3. Migration 093: borrower_intent JSONB + lo_note TEXT columns on scenarios table

### Files in Scope
- supabase/migrations/093_scenario_intent_and_note.sql (new)
- src/lib/scenarios/types.ts (add loNote to ScenarioState)
- src/app/api/scenarios/save/route.ts (accept lo_note)
- src/app/api/share/[token]/route.ts (return lo_note)
- src/app/api/share/[token]/intent/route.ts (new — public POST)
- src/app/dashboard/scenarios/new/ScenarioBuilder.tsx (loNote state + pass to ActionsBar)
- src/app/dashboard/scenarios/[id]/page.tsx (pass lo_note to initialState)
- src/app/dashboard/scenarios/new/ActionsBar.tsx (loNote props + note panel)
- src/components/share/BorrowerIntentCapture.tsx (new)
- src/components/share/LONoteCard.tsx (new)
- src/components/share/SharePageLayout.tsx (render 2 new components, add lo_note to SharedScenario)
- src/app/share/[token]/page.tsx (add lo_note to SharedScenario type)

### Definition of Done
- npm run build passes (0 TypeScript errors)
- Share page shows BorrowerIntentCapture when 2+ scenarios exist (print:hidden)
- Tapping an option posts to /api/share/[token]/intent, writes to DB, shows confirmation
- Adam sees gold note card on share page when lo_note is set
- ActionsBar has "Add Note" toggle panel with 250-char textarea
- Note saves/restores when scenario is saved/reloaded
