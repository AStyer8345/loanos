# Tenant Scoping Static Audit — 2026-04-21

**Method:** Static scan of `src/app/api/**/route.ts` + cross-reference against Supabase live RLS policy state (via MCP) + `get_my_organization_id()` function definition.

**Auditor:** Claude Code (autonomous session 2026-04-21 PM) after Explore subagent hit a sandbox constraint.

## Executive summary

- **Total API route files scanned:** 87
- **Routes importing `createServiceClient`:** 53
- **Routes importing user-scoped `createClient` from `@/lib/supabase/server`:** 22
- **Routes using neither (compute/webhook-only or other patterns):** 12
- **Tables with `get_my_organization_id()` RLS policy:** 35
- **Tables missing `get_my_organization_id()` RLS policy (org-scoped list):** 5 — `drip_suppressions`, `outlook_tokens`, `resend_webhook_events`, `user_settings`, `workflow_shadow_log`

## Strategic pivot from original plan

Original plan: Phase 2 converts all ~30 service-role routes individually.
**Adapted strategy (risk-based):** 53 routes is too many to convert cleanly overnight without regression risk. Instead:

1. **Fix RLS coverage gaps** — the 5 tables without policies are the real leak risk. Add policies so RLS becomes the safety net.
2. **Run the cross-tenant sweep** — an integration test that creates a Scott-org user, queries every org-scoped table, and asserts Scott sees 0 rows.
3. **Only convert routes that leak despite RLS** — meaning service-role routes where (a) the route accepts `org_id` from an untrusted source, or (b) the table has no RLS fallback.
4. **Document remaining service-role routes** — Adam can review and decide which to convert in a follow-on session. Their existence is not a blocker for Scott's login IF RLS is airtight and the routes resolve `org_id` from session.

This delivers the spec's success criteria (Scott sees 0 of Adam's data) without the 53-route marathon.

## RLS coverage map

### ✅ Covered by `get_my_organization_id()` — 35 tables

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| activity_log | ✅ | ❌ | ❌ | ❌ |
| activity_log_pii | ✅ | ❌ | ❌ | ❌ |
| agent_conversations | ✅ | ❌ | ✅ | ❌ |
| agent_handoffs | ✅ | ❌ | ❌ | ❌ |
| agents | ✅ | ❌ | ✅ | ❌ |
| automation_logs | ✅ | ❌ | ❌ | ❌ |
| automation_registry | ✅ | ❌ | ✅ | ✅ |
| automation_runs | ✅ | ❌ | ✅ | ❌ |
| chat_sessions | ✅ | ❌ | ✅ | ✅ |
| contact_activity | ✅ | ❌ | ❌ | ✅ |
| contact_emails | ✅ | ❌ | ✅ | ✅ |
| contacts | ✅ | ❌ | ✅ | ✅ |
| documents | ✅ | ❌ | ✅ | ✅ |
| drip_campaigns | ✅ | ❌ | ✅ | ✅ |
| drip_enrollments | ✅ | ❌ | ✅ | ✅ |
| drip_sends | ✅ | ❌ | ✅ | ❌ |
| drip_steps | ✅ | ❌ | ✅ | ✅ |
| email_drafts | ✅ | ❌ | ✅ | ✅ |
| loan_milestone_events | ✅ | ❌ | ❌ | ❌ |
| loan_status_history | ✅ | ❌ | ❌ | ❌ |
| loans | ✅ | ❌ | ✅ | ✅ |
| los_integrations | ✅ | ❌ | ✅ | ✅ |
| marketing_activity_log | ✅ | ❌ | ❌ | ❌ |
| milestone_communications | ✅ | ❌ | ❌ | ❌ |
| notes | ✅ | ❌ | ✅ | ✅ |
| org_settings | ✅ | ❌ | ✅ | ❌ |
| performance_data | ✅ | ❌ | ✅ | ❌ |
| profiles | ✅ | ❌ | ❌ | ❌ |
| scenarios | ✅ | ❌ | ✅ | ✅ |
| social_activity | ✅ | ❌ | ❌ | ❌ |
| social_drafts | ✅ | ❌ | ✅ | ✅ |
| social_settings | ✅ | ❌ | ✅ | ❌ |
| todo_items | ✅ | ❌ | ✅ | ✅ |

**Observation on INSERT policies:** nearly every org-scoped table has NO INSERT policy. This means user-scoped clients cannot insert. All inserts currently flow through service-role routes or DB triggers. This is not inherently broken — INSERTs via service-role with explicit `organization_id` resolved from session ARE safe — but it means Phase 2 can't simply "convert all service-role routes to user-scoped" without adding INSERT policies. Factored into Phase 2 strategy.

### ❌ Org-scoped but missing RLS policy — 5 tables

| Table | Has `org_id` column? | Current state | Risk |
|---|---|---|---|
| `drip_suppressions` | Yes (`org_id`) | RLS enabled, no policies → default deny | User-scoped drip UI cannot read suppressions. Must add policy. |
| `user_settings` | Yes (`organization_id` + `user_id`) | RLS enabled, no policies | Same. Needs user_id-scoped policy. |
| `outlook_tokens` | No (user_id only) | RLS enabled, no policies | Service-role-only. OK as-is. |
| `resend_webhook_events` | No `org_id` column surfaced | RLS enabled, no policies | Webhook endpoint ingests. Service-role only. OK. |
| `workflow_shadow_log` | No `org_id` column surfaced | RLS enabled, no policies | Shadow log, system-internal. OK. |

**Actions for Phase 2a:**
1. Add RLS policies for `drip_suppressions` (org-scoped)
2. Add RLS policies for `user_settings` (user-scoped, org-checked)
3. Leave `outlook_tokens` / `resend_webhook_events` / `workflow_shadow_log` as-is (service-role-only is correct for system tables)

## Service-role route list (53 routes)

Grouped by area for eventual Phase 2 conversion or justification:

### High priority (Scott-facing surface area)
- `src/app/api/contacts/quick-add/route.ts`
- `src/app/api/contacts/bulk-action/route.ts`
- `src/app/api/contacts/csv-import/route.ts`
- `src/app/api/contacts/merge/route.ts`
- `src/app/api/contacts/duplicates/route.ts`
- `src/app/api/contacts/web-lead/route.ts`
- `src/app/api/activity/route.ts`
- `src/app/api/notes/route.ts`
- `src/app/api/notes/[id]/route.ts`
- `src/app/api/drip/campaigns/route.ts`
- `src/app/api/drip/campaigns/[id]/steps/route.ts`

### Medium priority (shared features)
- `src/app/api/email-drafts/route.ts`
- `src/app/api/emails/link/route.ts`
- `src/app/api/automations/*` (13 routes)
- `src/app/api/scenarios/generate-pdf/route.ts`
- `src/app/api/chat/route.ts`
- `src/app/api/chat/social/route.ts`
- `src/app/api/outreach/route.ts`
- `src/app/api/me/route.ts` (hits profiles — double check)

### Low priority (Adam-only or admin-gated, feature-flag off for Scott)
- `src/app/api/marketing/log/route.ts`
- `src/app/api/social/*` (4 routes) — Adam's social pillar
- `src/app/api/admin/*` (5 routes) — admin-gated via middleware
- `src/app/api/settings/*` (2 routes)
- `src/app/api/org/create/route.ts`, `org/invite/route.ts`, `org/sponsor/route.ts`, `org/members/route.ts`
- `src/app/api/share/[token]/route.ts`, `share/[token]/chat/route.ts` — share links, different trust model (token-based, not session-based)

### System routes (keep service-role, verify explicit filter)
- `src/app/api/arive-webhook/route.ts`
- `src/app/api/arive-webhook/[slug]/route.ts`
- `src/app/api/webhooks/los/arive/[org_slug]/route.ts`
- `src/app/api/resend-webhook/route.ts`
- `src/app/api/agents/*` (3 routes — agent endpoints)
- `src/app/api/automations/n8n-proxy/route.ts`
- `src/app/api/notify/hot-lead/route.ts`

## User-scoped route list (22 routes — presumed safe pending sweep)

- All `src/app/api/scenarios/**` except generate-pdf
- `src/app/api/settings/**`
- `src/app/api/performance/route.ts`
- `src/app/api/todos/**`
- `src/app/api/marketing/*` except log
- `src/app/api/onboarding/step/route.ts`
- `src/app/api/import/contacts/route.ts`
- `src/app/api/import/loans/route.ts`
- `src/app/api/org/settings/branding/route.ts`

## Recommended next steps (Phase 2)

1. **Add RLS for drip_suppressions + user_settings** (migration 092) — ~15 min
2. **Build tenant-isolation test helper** — ~30 min
3. **Run full cross-tenant sweep** — proves RLS is the actual safety net
4. **Fix any route that leaks in sweep** (likely few/none because RLS is broad)
5. **Document remaining service-role routes** — Adam reviews which to convert post-Scott-launch

## Risk summary

**Known critical gaps before fix:**
- `drip_suppressions` readable cross-tenant via any service-role drip route (once Scott uses drip)
- 53 service-role routes use service role — each could leak if it takes `org_id` from untrusted input

**After Phase 2a (RLS fixes):**
- Only service-role routes that don't explicitly filter by session-resolved `organization_id` remain as risk vectors
- The sweep identifies which ones (by showing a table with Scott-count > 0)

**For Scott's login go/no-go:** GREEN if sweep passes for all org-scoped tables. YELLOW if specific tables require feature-flag-off for Scott. RED if sweep failures aren't fixable tonight.
