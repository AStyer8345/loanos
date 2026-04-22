# Tenant Scoping Audit + Hardening — Design

**Date:** 2026-04-21
**Owner:** Adam Styer (w/ Codex as reviewer)
**Status:** Draft — awaiting Adam review
**Parent plan:** Scott's Pilot / Uncle Launch (Path B resequenced)

## Purpose

Verify every user-facing read/write in LoanOS filters by `organization_id` **and fix all gaps** before Scott Sears logs in. Adam's production Supabase has **2,937 contacts + 1,276 loans + 1,819 activity rows + 32 scenarios + 19 notes** — all Adam's. A single un-scoped query returns all of it to Scott the moment he authenticates.

This spec absorbs TODO.md backlog item **A-6** (consolidate ~30 service-role routes onto `createUserScopedClient()`). Audit + fix are merged because fixing separately would require re-running the audit anyway.

n8n workflows are **out of scope by policy**, not by omission. See [DECISIONS.md — n8n Freeze, 2026-04-21](../../../DECISIONS.md). Scott's tenant has zero n8n surface; Adam's n8n footprint is frozen at current state.

## Success criteria

100% of queries against org-scoped tables must satisfy at least one of:

1. **RLS-covered** — query uses the anon/user-scoped Supabase client, and the table has an active RLS policy that calls `get_my_organization_id()`.
2. **Service-role with explicit org filter** — query uses service role and explicitly passes `organization_id = <resolved-from-session>` in WHERE/INSERT.
3. **Documented system exception** — query is intentionally cross-tenant (e.g., admin audit log, lender DB, system_admins). Must be listed in the audit report with reason.

Anything else = gap.

## Scope

**In:**
- All pages under `src/app/dashboard/**`
- All routes under `src/app/api/**` (especially service-role routes — known risk from TODO.md A-6)
- All server actions / lib helpers that query Supabase
- All RLS policies on tables with `org_id` column (40+ tables per `list_tables`)

**Out:**
- Marketing site (`loanos-marketing` is a separate repo, no org data)
- n8n workflows (handled separately — they hit Supabase via service role and already have known gaps documented)
- Writing fixes (only identifies them)

## Method

**Three phases, in order:**

### Phase 1 — Static audit (Codex, ~0.5 day)

Codex scans the repo and produces a report with one row per file/route:

| Path | Client type | Tables touched | Org filter method | Pass/Fail | Notes |
|---|---|---|---|---|---|
| `src/app/api/drip/campaigns/route.ts` | user-scoped | drip_campaigns | RLS | PASS | |
| `src/app/api/foo/route.ts` | service-role | loans | none | **FAIL** | Returns all orgs' loans |

Codex focuses on: service-role clients, raw SQL, `.from()` calls without visible org filter, queries that bypass RLS via `.schema('public')` tricks, and routes flagged under TODO.md A-6.

### Phase 2 — Consolidation (Claude Code, ~2 days)

For each gap identified in Phase 1, categorize and fix:

1. **Convert to user-scoped** (~default path) — swap service-role client for `createUserScopedClient()`. Verify table has adequate RLS policy; add policy if missing. ~20 routes expected per A-6.
2. **Keep service-role, add explicit org resolution** — only for webhooks, cron jobs, and system routes that legitimately need service role. Must resolve `organization_id` from session/webhook-payload and filter explicitly. Document reason in code comment.
3. **Delete** — routes that are dead or duplicated. Grep callers before removing.

Every conversion includes:
- Test that RLS now blocks cross-tenant reads (integration test + live probe)
- TypeScript build passes
- Pre-push hook passes (`npm run build`)

### Phase 3 — Live probe (Claude Code + human, ~0.5 day)

For each table with `org_id`, run two probes against prod:

1. **As Adam's user session** — count rows. Expect > 0 for most.
2. **As a test user bound to Scott's existing org** (`40377391-6b4c-4d1a-81d2-ffd743876f0b`) — count rows. Expect 0 for all org-scoped tables.

Any table where Scott's session sees > 0 rows of Adam's data = critical gap. **Stop, fix, re-probe.** Do not proceed to go/no-go until Scott's session returns 0 everywhere it should.

Probe cleanup: delete test user session + auth record after audit completes.

## Deliverable

`tasks/tenant-scoping-audit-2026-04-21.md` with:

- **Summary**: X routes audited, Y converted, Z deleted, N kept-as-service-role-with-reason, 0 remaining gaps
- **Conversion log**: per-route before/after (old client → new client, RLS policy added/verified)
- **Live probe results**: table / Adam-count / Scott-count / verdict
- **Go/no-go**: explicit green-light for Scott login

## Timebox

**~3 days total.** Phase 1: 0.5 day · Phase 2: 2 days · Phase 3: 0.5 day.

If Phase 2 discovers a gap too large to fix inside the timebox (e.g., a route that would need a schema change to scope), freeze that route's feature flag OFF for Scott's org and spawn a follow-on spec. Don't stretch the timebox — Scott can live without the flagged feature.

## Out of scope / explicit non-goals

- **n8n workflows** — out by DECISIONS.md policy, not by omission. Scott's tenant feature-flags off all n8n surfaces; Adam's n8n footprint is frozen.
- **Adding `organization_id` columns** to tables that don't have them (would be a schema change, too much blast radius)
- **Multi-tenant UI** (org switcher, invite flow, org-admin dashboards)
- **Billing / seat management**
- **Net-new RLS policies** on tables that currently have none, unless directly required to ship a Phase 2 conversion

## Dependencies

- None. Can start immediately.

## Risks

- **Live probe on prod**: test user is real, counts against Supabase auth quota by 1. Clean up session + user record after audit. Use obvious email like `audit-probe-2026-04-21@loanos.test` so it's greppable.
- **Codex accuracy**: static audit can miss dynamic queries (computed table names, interpolated SQL). Phase 3 live probe is the safety net — it catches what static missed.
- **Phase 2 blast radius**: ~30 routes touched. Each conversion is small but collectively a big PR surface. Commit per-route, not as one mega-PR, so regressions are easy to revert.
- **RLS gaps revealed**: if a table has no RLS policy at all but is queried by a newly-converted user-scoped route, the route returns zero rows (or errors). Must add the policy as part of the conversion, not defer it.
