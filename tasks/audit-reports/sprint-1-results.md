# LoanOS — Sprint 1 Results: Security Lockdown + Infrastructure
> Executed: 2026-03-15
> Branch: main
> Build: ✅ Passes (`npm run build` — zero errors, 2 pre-existing ESLint warnings only)

---

## Checklist — All Done

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | Lock down `/api/agents/*` routes | ✅ | Auth check on all 4 routes |
| 2 | Create `validateAgentSecret` helper | ✅ | `src/lib/auth/validateAgentSecret.ts` |
| 3 | Create `createServiceClient` helper | ✅ | `src/lib/supabase/service.ts` |
| 4 | Replace `getServiceClient()` in 7 routes | ✅ | All 7 routes now import from service.ts |
| 5 | `LOANOS_AGENT_SECRET` in `.env.local` | ✅ | UUID generated: `0bbc8cff-94b2-43bb-b005-a8b0665b1f7d` |
| 6 | `NEXT_PUBLIC_N8N_WEBHOOK_BASE` in `.env.local` | ✅ | Added |
| 7 | Fix hardcoded n8n URL in `loans/[id]/page.tsx` | ✅ | Reads from env var, falls back to hardcoded |
| 8 | Fix hardcoded n8n URLs in `automations/page.tsx` | ✅ | Added `N8N_BASE` const, replaced 2 inline fetch URLs |
| 9 | Migration 019 — fix `activity_log` RLS (no DELETE) | ✅ | Created, ready to apply |
| 10 | Migration 020 — fix `chat_sessions` RLS (add `user_id`) | ✅ | Created, ready to apply |
| 11 | Migration 021 — fix `email_drafts` RLS (add `user_id`) | ✅ | Created, ready to apply |
| 12 | Migration 022 — disable contract webhook trigger | ✅ | Drops `on_contract_document_inserted` trigger |
| 13 | Delete `netlify.toml` | ✅ | Gone |
| 14 | Remove `@netlify/plugin-nextjs` from `package.json` | ✅ | Removed from devDependencies |
| 15 | `npm install` | ✅ | Lockfile updated |
| 16 | Rename `0016_` / `0017_` migrations to 3-digit | ✅ | Now `017_` and `018_` (016 already existed) |
| 17 | `npm run build` | ✅ | Zero errors |

---

## Deviations From Sprint Plan

### stageNormalization.ts — NOT deleted
The audit flagged `src/lib/stageNormalization.ts` as dead code. This was incorrect.
Both `api/contacts/quick-add/route.ts` and `api/contacts/bulk-action/route.ts` import
`normalizeStage` from this file. Deleting it would break both routes. File stays.

### Migration numbering
A `016_agent_phone_columns.sql` already existed (added after the audit, not in the original
sprint plan). Renaming `0016_create_todo_items.sql` → `016_` would have created a collision.
Corrected to: `0016` → `017`, `0017` → `018`. New migrations: `019`–`022`.

---

## Follow-Up Actions — Status

### 1. ✅ Apply migrations to Supabase — DONE (2026-03-15)
Applied via Supabase MCP (`apply_migration` tool), project `uuqedsvjlkeszrbwzizl`:
- `019_fix_activity_log_rls.sql` ✅
- `020_fix_chat_sessions_rls.sql` ✅
- `021_fix_email_drafts_rls.sql` ✅
- `022_fix_contract_webhook.sql` ✅

### 2. ⏳ Add env vars to Vercel — PENDING (manual — Vercel dashboard)
In Vercel dashboard → Project Settings → Environment Variables:
- `LOANOS_AGENT_SECRET` = `0bbc8cff-94b2-43bb-b005-a8b0665b1f7d`
- `NEXT_PUBLIC_N8N_WEBHOOK_BASE` = `https://styer.app.n8n.cloud/webhook`

### 3. ✅ Update n8n auth headers — DONE (2026-03-15)
Investigation found only **WF3 (Milestone)** actually calls a LoanOS `/api/agents/*` route.
WF5 (PA), WF8 (CD), WF9 (New App) call Supabase REST + Anthropic API directly — not agent routes.
- WF3 `1hjOmS7inZcxEJQr` updated via n8n REST API — `Authorization: Bearer 0bbc8cff-94b2-43bb-b005-a8b0665b1f7d` added alongside existing `X-Webhook-Secret` header ✅

### 4. ✅ Deploy to Vercel — DONE
Deployed on initial commit push to main.

---

## Files Changed
```
src/lib/auth/validateAgentSecret.ts         (new)
src/lib/supabase/service.ts                 (new)
src/app/api/agents/daily-briefing/route.ts  (auth + service refactor)
src/app/api/agents/milestone/route.ts       (auth + service refactor)
src/app/api/agents/cd-extraction/route.ts   (auth + service refactor)
src/app/api/agents/pa-extraction/route.ts   (auth + service refactor)
src/app/api/chat/route.ts                   (service refactor)
src/app/api/contacts/quick-add/route.ts     (service refactor)
src/app/api/contacts/bulk-action/route.ts   (service refactor)
src/app/dashboard/loans/[id]/page.tsx       (n8n env var)
src/app/dashboard/automations/page.tsx      (n8n env var)
.env.local                                  (LOANOS_AGENT_SECRET + NEXT_PUBLIC_N8N_WEBHOOK_BASE)
package.json                                (@netlify/plugin-nextjs removed)
netlify.toml                                (deleted)
supabase/migrations/0016_create_todo_items.sql → 017_create_todo_items.sql
supabase/migrations/0017_user_settings.sql  → 018_user_settings.sql
supabase/migrations/019_fix_activity_log_rls.sql    (new)
supabase/migrations/020_fix_chat_sessions_rls.sql   (new)
supabase/migrations/021_fix_email_drafts_rls.sql    (new)
supabase/migrations/022_fix_contract_webhook.sql    (new)
```
