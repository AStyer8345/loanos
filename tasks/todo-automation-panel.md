# Email Automation Panel — Implementation Plan

## Files to Create

| # | Path | Purpose |
|---|------|---------|
| 1 | `src/lib/automations/definitions.ts` | Automation definitions (4 contact + 10 loan), `AutomationDef` type, stage filtering logic |
| 2 | `src/lib/automations/prompts.ts` | `buildAutomationPrompt()` — builds system + user message per automation with safe fallbacks |
| 3 | `src/app/api/automations/generate/route.ts` | POST — fetches record, calls Claude, saves draft via `logEmailDraft()`, returns `{ subject, body, draftId }` |
| 4 | `src/app/api/automations/refine/route.ts` | POST — refines existing draft via Claude, updates `email_drafts` row |
| 5 | `src/app/api/automations/send/route.ts` | POST — sends draft to n8n webhook for Outlook draft creation, updates status + logs activity |
| 6 | `src/components/automations/AutomationPanel.tsx` | Container — lists available automations, queries sent state on mount from `email_drafts` |
| 7 | `src/components/automations/AutomationCard.tsx` | Single automation card — lifecycle: idle → generating → draft → sending → sent |

## Files to Modify

| # | Path | Change |
|---|------|--------|
| 1 | `src/app/dashboard/contacts/[id]/ContactRecordView.tsx` | Add `<AutomationPanel>` as new card section inside Overview tab, after existing cards (Address/Notes area). Add import. No removals. |
| 2 | `src/app/dashboard/loans/[id]/page.tsx` | Add `<AutomationPanel>` inside the existing `AutomationsTab` function, below the PDF-upload workflow grid. Add import. No removals. |

## Build Order

1. **`definitions.ts`** — pure data, no deps
2. **`prompts.ts`** — depends on definitions types + `StageKey` import
3. **`generate/route.ts`** — depends on prompts, uses existing server utilities
4. **`refine/route.ts`** — standalone API, uses existing utilities
5. **`send/route.ts`** — standalone API, uses existing utilities
6. **`AutomationCard.tsx`** — client component, calls the 3 API routes
7. **`AutomationPanel.tsx`** — container, uses definitions + renders AutomationCards
8. **Integration into ContactRecordView.tsx** — add import + render
9. **Integration into loan page.tsx** — add import + render inside AutomationsTab

## Sent-State Query on Mount

`AutomationPanel` fetches sent state from `email_drafts` table on mount:
```
GET /api/email-drafts?status=sent&contact_id={contactId}
```
Wait — existing `/api/email-drafts` GET only filters by `status`, not `contact_id`. Rather than modifying the existing route (constraint says no), the panel will query client-side via Supabase:
```ts
const supabase = createClient()
const { data } = await supabase
  .from('email_drafts')
  .select('automation_name, status, created_at')
  .eq('contact_id', contactId)
  .eq('status', 'sent')
```
This returns all sent drafts for this contact. The panel marks each automation as `sent` if a matching `automation_name` exists. For loan-level: also filter by `loan_id`.

## Regression Prevention

- No existing imports, components, tabs, or functions removed from either target file
- AutomationPanel is purely additive — inserted as a new `<div>` section
- No modifications to existing API routes (`/api/email-drafts`, `/api/chat/social`, etc.)
- No changes to existing Automations tab behavior (PDF-upload workflows remain)
- All new code in new files or clearly scoped additions
- `npm run build` + `npx tsc --noEmit` before push
