# LoanOS — Task Backlog

_Last updated: 2026-03-15 (morning audit)_

---

## 🔴 High Priority

- [ ] **Apply migration 0016** — `todo_items` table (supabase/migrations/0016_create_todo_items.sql). TodoList component on dashboard will silently fail until this is applied. Run in Supabase SQL Editor.
- [ ] **Apply migration 015** — Arive full field expansion (supabase/migrations/015_arive_full_field_expansion.sql). WF1 new-loan webhook will HTTP 400 until applied.
- [ ] **Wire logEmailDraft to pre-approval automation** — n8n workflow `utMvZpkdRwIRZ51u` needs a node to POST draft payload to `/api/email-drafts` (or a new `/api/email-drafts/log` route) after building the email body. Requires n8n access.
- [ ] **n8n Outlook Email Sync** (`JMmstRl2C5ylmuIY`) — needs env vars. Verify if OUTLOOK_CLIENT_ID / SECRET are set in n8n credentials. Flag if not.

---

## 🟡 Medium Priority

- [x] **EmailDraftPreview dark theme** — fixed 2026-03-14 morning audit. All slate/white → zinc-900/zinc-800. AUTOMATION_COLORS → dark variants (bg-*-900/40, text-*-400, border-*-800). Action buttons, skeleton, empty state all updated.
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

## ✅ Completed (session 3 — 2026-03-15 morning audit)

- [x] **Chat route column names fixed** — `est_closing_date` → `estimated_closing_date`, `borrower_name` → `borrower_first_name`/`borrower_last_name` fallback chain. Chat AI context now shows correct borrower and close date for Arive loans.
- [x] **Daily briefing `max_tokens` bumped** — 1024 → 2048. Matches chat route.

## ✅ Completed (session 2 — 2026-03-14)

- [x] Pipeline Dashboard redesign (v1.14.0)
- [x] EmailDraftPreview component built
- [x] `email_drafts` migration + API route + logEmailDraft helper created
- [x] logEmailDraft wired to milestone agent
- [x] **EmailDraftPreview added to dashboard** (2026-03-14 morning audit)
- [x] **Marketing tab crash fixed** — `user_id` added to upsert/select, switched to SSR-aware Supabase client
- [x] **Content Board built** — `/dashboard/marketing/content` kanban (Ideas/In Progress/Published), persisted to `mcc_state` key `content_board`
- [x] **Settings page expanded** — 4 credential sections (Identity, Integrations, Website, Social) + per-section saves + last-saved timestamps + show/hide token fields + Anthropic/Mailchimp test buttons
- [x] **Migration 0017** — `user_settings` table created (⚠️ NOT yet applied — run in Supabase SQL Editor)
- [x] Refi intake email automation (v1.13.0)
- [x] Arive full field expansion + n8n pipeline rebuild (v1.12.0)
- [x] Global Search ⌘K, Activity Feed bell, Kanban, Smart list delete/edit (v1.11.0)
