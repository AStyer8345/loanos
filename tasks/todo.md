# LoanOS — Task Backlog

_Last updated: 2026-03-14 (morning audit)_

---

## 🔴 High Priority

- [ ] **Apply migration 0016** — `todo_items` table (supabase/migrations/0016_create_todo_items.sql). TodoList component on dashboard will silently fail until this is applied. Run in Supabase SQL Editor.
- [ ] **Apply migration 015** — Arive full field expansion (supabase/migrations/015_arive_full_field_expansion.sql). WF1 new-loan webhook will HTTP 400 until applied.
- [ ] **Wire logEmailDraft to pre-approval automation** — n8n workflow `utMvZpkdRwIRZ51u` needs a node to POST draft payload to `/api/email-drafts` (or a new `/api/email-drafts/log` route) after building the email body. Requires n8n access.
- [ ] **n8n Outlook Email Sync** (`JMmstRl2C5ylmuIY`) — needs env vars. Verify if OUTLOOK_CLIENT_ID / SECRET are set in n8n credentials. Flag if not.

---

## 🟡 Medium Priority

- [ ] **EmailDraftPreview dark theme** — component uses light colors (bg-emerald-100, text-slate-900) while dashboard is zinc-950 dark. Visually inconsistent. Update AUTOMATION_COLORS and card styles to match dark theme.
- [ ] **Wire logEmailDraft to refi-intake** — `/api/automations/refi-intake/route.ts` calls Claude but doesn't log to `email_drafts`. Add after n8n webhook call.
- [ ] **Wire logEmailDraft to final-cd** — same pattern as refi-intake.
- [ ] **E2E test WF1 + WF2** — after migrations applied: trigger test webhook, verify loan row in Supabase, verify loan_status_history row.
- [ ] **Verify migration 013 applied** — confirm `email_drafts` table exists in production Supabase. If not, apply it.

---

## 🟢 Low Priority / Cleanup

- [ ] **Remove console.log statements** — audit all API routes for leftover debug logs
- [ ] **Briefing page dark theme** — uses light bg-white/slate-200 while rest of app is dark. Consider unifying.
- [ ] **Kanban board** — contacts page has LIST | KANBAN toggle. Verify drag-and-drop works after last `@hello-pangea/dnd` install.

---

## ✅ Completed

- [x] Pipeline Dashboard redesign (v1.14.0)
- [x] EmailDraftPreview component built
- [x] `email_drafts` migration + API route + logEmailDraft helper created
- [x] logEmailDraft wired to milestone agent
- [x] **EmailDraftPreview added to dashboard** (2026-03-14 morning audit)
- [x] Refi intake email automation (v1.13.0)
- [x] Arive full field expansion + n8n pipeline rebuild (v1.12.0)
- [x] Global Search ⌘K, Activity Feed bell, Kanban, Smart list delete/edit (v1.11.0)
