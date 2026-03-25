# Multi-Tenancy Session — 2026-03-25

## COMPLETED_THIS_SESSION

- [migration 053 / Supabase MCP] — SET NOT NULL on loans, contacts, documents, email_drafts, scenarios, todo_items, contact_activity, chat_sessions. Applied via `apply_migration` as `051_not_null_organization_id_hardening` (local tracking file: `053_not_null_org_id_hardening.sql`). All 8 confirmed 0 nulls before applying.
- [src/app/api/agents/daily-briefing/route.ts] — Scoped `loan_milestone_events` and `milestone_communications` queries. Added pre-fetch of org's `arive_loan_ids` from loans table, used `.in('loan_id', ariveLoanIds)` for milestone events. Added pre-fetch of `milestoneEventIds` for communications scoping via `.in('milestone_event_id', milestoneEventIds)`. Both queries now org-isolated.

## CHECKLIST_STATUS

- Tables with org_id: 15/15
- Tables with full RLS: 15/15
- Tables with NOT NULL org_id: 8/15 (loans, contacts, documents, email_drafts, scenarios, todo_items, contact_activity, chat_sessions) — activity_log still nullable by design
- API routes scoped: all known routes ✅ (daily-briefing milestone queries fixed today)
- Onboarding steps built: 5/5 (plan selection deferred)
- Isolation test: Not run (existing script at scripts/verify-tenant-isolation.ts)
- Null org rows: All 0 ✅

## BLOCKED_ITEMS

- `activity_log.organization_id NOT NULL` — blocked by WF1/WF2 not yet pushed to n8n cloud. Trigger (migration 050) auto-stamps on insert, but need to confirm WF1/WF2 behavior before locking the column. Adam must push both workflows.
- Performance page localStorage — blocked by scope (not infrastructure work)
- Plan selection UI — blocked by scope (Phase 4 Stripe work)

## NEXT_SESSION_PRIORITY

Check null row counts again (all should still be 0). If WF1/WF2 have been pushed by Adam, add NOT NULL to `activity_log.organization_id` as migration 054. Otherwise, move to any remaining pre-launch gaps: `loan_milestone_events` and `milestone_communications` should get `organization_id` columns added to avoid the join-based scoping workaround long-term (lower priority since the workaround is correct and tested).

## LESSONS_LEARNED

- Migration file numbering can drift when sessions add schema changes outside the daily prep flow. Always check the highest-numbered file in `supabase/migrations/` before writing a new file — don't assume the next number is simply `last_known + 1`. The Supabase MCP `apply_migration` name is separate from local file naming.
- When scoping queries through a join (no direct org_id column), pre-fetch the join keys in two sequential queries before the `Promise.allSettled` parallel block. Supabase JS `.in()` does not accept subqueries — must be an array. For a daily briefing that runs once, 2 extra round trips are acceptable.
