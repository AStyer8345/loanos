# Tenant Scoping Audit + Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Verify every user-facing read/write in LoanOS filters by `organization_id`, fix all gaps (absorbing TODO.md A-6), and prove cross-tenant isolation with a live prod probe before Scott Sears logs in.

**Architecture:** Three phases. Phase 1 dispatches Codex to produce a static audit report. Phase 2 applies a per-route conversion template to every gap found (swap service-role client → user-scoped client, verify/add RLS policy, extend RLS integration test, commit). Phase 3 runs an end-to-end live probe against prod with a test user bound to Scott's org and produces the go/no-go report.

**Tech Stack:** Next.js 14 App Router · Supabase (`@supabase/ssr` + `@supabase/supabase-js`) · Vitest · Postgres RLS using the existing `get_my_organization_id()` SECURITY DEFINER helper.

**Naming note:** The spec and TODO.md A-6 reference `createUserScopedClient()`. In this codebase that is the existing `createClient()` export in `src/lib/supabase/server.ts` — no new helper needed. All tasks below use the existing name.

---

## File Structure

### Existing files (referenced, not modified except as noted)
- `src/lib/supabase/server.ts` — exports `createClient()`. User-scoped (anon key + session cookies, RLS enforced). **Every converted route ends here.**
- `src/lib/supabase/service.ts` — exports `createServiceClient()`. Service role, bypasses RLS. Only `keep-with-justification` routes keep this after Phase 2.
- `src/lib/supabase/middleware.ts` — auth middleware, unchanged.
- `supabase/migrations/` — next available number is `091` (per `091_realtor_ack_trigger.sql` already untracked).

### Files created in this plan
- `tasks/tenant-scoping-audit-2026-04-21.md` — Codex's raw audit report (Phase 1 output)
- `tasks/tenant-scoping-conversion-log.md` — per-route conversion tracking (Phase 2 progress)
- `tests/security/helpers/test-users.ts` — reusable test-user fixture helper
- `tests/security/tenant-isolation.integration.test.ts` — cross-tenant RLS assertions
- `supabase/migrations/0XX_<table>_rls.sql` — per-table RLS migrations, only if a Phase 2 step reveals a missing policy
- `tasks/tenant-scoping-live-probe-results.md` — Phase 3 probe table
- `tasks/tenant-scoping-audit-2026-04-21-final.md` — summary + go/no-go for Scott login

### Files modified in this plan
- ~30 route files under `src/app/api/**` (exact list produced by Phase 1)
- Any server component / server action under `src/app/dashboard/**` that uses service role (exact list produced by Phase 1)

---

## Phase 1 — Static Audit (Codex)

### Task 1: Dispatch Codex, receive audit report

**Files:**
- Create: `tasks/tenant-scoping-audit-2026-04-21.md`

- [ ] **Step 1: Compose the Codex dispatch prompt**

The prompt must include every one of these elements. A shorter prompt produces a shorter report.

```
Audit tenant scoping in the LoanOS Next.js 14 repo at /Users/adamstyer/Documents/loanos-clone.

CONTEXT: Scott Sears is about to log in as a second tenant. Today the prod DB has only Adam's data (2,937 contacts / 1,276 loans / 1,819 activity rows / 32 scenarios / 19 notes, all org Adam). Any un-scoped read returns all of it to Scott's session.

TARGET: Produce a Markdown report at tasks/tenant-scoping-audit-2026-04-21.md with one row per file, columns:
| Path | Client type | Tables touched | Org filter method | Pass/Fail | Notes |

Client types: `user-scoped` (calls createClient from src/lib/supabase/server.ts), `service-role` (calls createServiceClient from src/lib/supabase/service.ts), `other`.
Org filter methods: `RLS` (user-scoped client + table has RLS policy calling get_my_organization_id()), `explicit-filter` (query has .eq('organization_id', …)), `none`, `documented-exception`.

A row is PASS only if:
- user-scoped client AND table has active RLS policy on get_my_organization_id(), OR
- service-role client AND every query visibly filters by organization_id resolved from session/webhook payload (not from request body), OR
- explicitly documented as a cross-tenant system exception (admin_audit_log, system_admins, lenders, agents, agent_tools, n8n_run_logs, ai_node_logs).

Anything else is FAIL.

SCAN THESE DIRS:
- src/app/api/** (every route.ts)
- src/app/dashboard/** (every page.tsx + any server actions)
- src/lib/** (server-side helpers that touch Supabase)
- src/app/api/webhooks/** (flag service-role webhooks that take org_id from request body as FAIL — untrusted input)

ORG-SCOPED TABLES (reference list, all have `organization_id` or `org_id`):
contacts, loans, documents, activity_log, automation_logs, chat_sessions, loan_milestone_events, milestone_communications, outlook_tokens, email_drafts, loan_status_history, todo_items, user_settings, scenarios, contact_activity, contact_emails, organizations, profiles, marketing_activity_log, security_audit_log, org_settings, automation_registry, automation_runs, drip_campaigns, drip_steps, drip_enrollments, drip_sends, drip_suppressions, agents, agent_conversations, agent_handoffs, webhook_deliveries, activity_log_pii, los_integrations, notes, resend_webhook_events, workflow_shadow_log, admin_audit_log

CROSS-TENANT SYSTEM TABLES (excluded — do not flag as FAIL if queried without org filter):
system_admins, lenders, agents, agent_tools, n8n_run_logs, ai_node_logs, kids, challenges, responses, performance_data, social_drafts, social_activity, social_settings, rancho_*, mcc_state, waitlist_signups, oauth_state

OUT OF SCOPE:
- n8n workflows (by DECISIONS.md 2026-04-21 policy — frozen, not touched)
- src/workflows/** Workflow DevKit workflows (audited separately, different trust model)
- Marketing site (different repo)
- Test files

DELIVERABLE: The Markdown report above, plus a Summary section with counts (total routes audited / PASS / FAIL / by Action category).

For each FAIL, suggest an Action: `convert` (swap to user-scoped), `keep-with-justification` (legit service role, add explicit filter + comment), `delete` (dead code).
```

- [ ] **Step 2: Dispatch Codex**

Use the `Agent` tool with `subagent_type: "codex:codex-rescue"` and the prompt above as input. Codex may produce the report file directly or return it as text — either is acceptable.

- [ ] **Step 3: Save report to `tasks/tenant-scoping-audit-2026-04-21.md`**

If Codex returned text, write it verbatim. If Codex wrote the file directly, read it and sanity-check it has a Summary section + per-route table + Action column on every FAIL row.

- [ ] **Step 4: Review and refine the Action column**

Sanity check every `convert` row — is there a legitimate reason it can't be user-scoped? Sanity check every `keep-with-justification` row — does it actually need service role, or is Codex being conservative? For any ambiguous row, annotate with `NEEDS-ADAM` and surface in Phase 1 handoff.

- [ ] **Step 5: Commit Phase 1 output**

```bash
git add tasks/tenant-scoping-audit-2026-04-21.md
git commit -m "audit: tenant scoping static audit (Phase 1 of hardening)"
```

- [ ] **Step 6: Report counts to Adam**

Surface to Adam: total routes, PASS count, FAIL count, breakdown of convert/keep/delete, any `NEEDS-ADAM` rows. Wait for Adam to resolve `NEEDS-ADAM` rows before starting Phase 2.

---

## Phase 2 — Per-Route Conversion

### Task 2: Build the tenant-isolation test helper

This gets reused by every subsequent conversion task.

**Files:**
- Create: `tests/security/helpers/test-users.ts`
- Create: `tests/security/tenant-isolation.integration.test.ts`

- [ ] **Step 1: Write the test-user helper**

File: `tests/security/helpers/test-users.ts`

```typescript
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export type TestUserContext = {
  userId: string
  orgId: string
  email: string
  accessToken: string
  cleanup: () => Promise<void>
}

/**
 * Create a signed-in test user bound to the given organization.
 * Returns a usable access token plus a cleanup() callable the caller MUST invoke
 * (profile row + auth user are deleted by cleanup).
 */
export async function createTestUserInOrg(orgId: string, label: string): Promise<TestUserContext> {
  const admin = createSupabaseClient<Database>(SUPABASE_URL, SERVICE_KEY)
  const email = `audit-probe-${label}-${Date.now()}@loanos.test`
  const password = crypto.randomUUID()

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (createErr || !created.user) throw new Error(`createTestUserInOrg auth: ${createErr?.message}`)

  const userId = created.user.id

  const { error: profileErr } = await admin
    .from('profiles')
    .insert({ id: userId, organization_id: orgId, email } as never)
  if (profileErr) throw new Error(`createTestUserInOrg profile: ${profileErr.message}`)

  const userClient = createSupabaseClient<Database>(SUPABASE_URL, ANON_KEY)
  const { data: session, error: signInErr } = await userClient.auth.signInWithPassword({ email, password })
  if (signInErr || !session.session) throw new Error(`createTestUserInOrg signIn: ${signInErr?.message}`)

  return {
    userId,
    orgId,
    email,
    accessToken: session.session.access_token,
    cleanup: async () => {
      await admin.from('profiles').delete().eq('id', userId)
      await admin.auth.admin.deleteUser(userId)
    },
  }
}

/**
 * Supabase client authenticated as the given test user.
 * All queries through this client are RLS-enforced against the user's org.
 */
export function createUserScopedTestClient(ctx: TestUserContext) {
  return createSupabaseClient<Database>(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${ctx.accessToken}` } },
  })
}
```

- [ ] **Step 2: Write the smoke test**

File: `tests/security/tenant-isolation.integration.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createTestUserInOrg, createUserScopedTestClient, type TestUserContext } from './helpers/test-users'

const ADAM_ORG = process.env.AUDIT_ADAM_ORG_ID
const SCOTT_ORG = '40377391-6b4c-4d1a-81d2-ffd743876f0b'

if (!ADAM_ORG) {
  throw new Error('Set AUDIT_ADAM_ORG_ID env var before running tenant-isolation tests')
}

describe('tenant isolation — contacts', () => {
  let adamCtx: TestUserContext
  let scottCtx: TestUserContext

  beforeAll(async () => {
    adamCtx = await createTestUserInOrg(ADAM_ORG, 'adam')
    scottCtx = await createTestUserInOrg(SCOTT_ORG, 'scott')
  }, 30_000)

  afterAll(async () => {
    await adamCtx?.cleanup()
    await scottCtx?.cleanup()
  })

  it('Adam session sees > 0 contacts', async () => {
    const client = createUserScopedTestClient(adamCtx)
    const { count, error } = await client.from('contacts').select('*', { count: 'exact', head: true })
    expect(error).toBeNull()
    expect(count ?? 0).toBeGreaterThan(0)
  })

  it('Scott session sees 0 contacts', async () => {
    const client = createUserScopedTestClient(scottCtx)
    const { count, error } = await client.from('contacts').select('*', { count: 'exact', head: true })
    expect(error).toBeNull()
    expect(count).toBe(0)
  })
})
```

- [ ] **Step 3: Run the smoke test**

First, get Adam's org id:

```bash
# Via Supabase MCP execute_sql:
SELECT id FROM organizations WHERE name ILIKE '%adam%' OR name ILIKE '%styer%' LIMIT 2;
```

Then run:
```bash
AUDIT_ADAM_ORG_ID=<adam-org-uuid> npm test tests/security/tenant-isolation.integration.test.ts
```

Expected: both tests PASS. If Scott's contacts count > 0, the contacts table RLS is already broken — stop, write a fix migration, re-run.

- [ ] **Step 4: Commit helper + smoke test**

```bash
git add tests/security/helpers/test-users.ts tests/security/tenant-isolation.integration.test.ts
git commit -m "test(security): tenant-isolation helper + contacts smoke"
```

---

### Conversion Template (apply per `convert` route from Phase 1)

**Each route = one commit.** For each route marked `convert`:

- [ ] **Step 1: Read the route and note what it does**

Note in a scratch buffer: route path, tables queried, current client, which queries have explicit `.eq('organization_id', …)`, and whether it needs `auth.getUser()` for any other reason (authorization checks, audit logging).

- [ ] **Step 2: Verify RLS on every table the route touches**

Via Supabase MCP `execute_sql`:

```sql
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = '<table>'
ORDER BY cmd;
```

Does at least one policy reference `get_my_organization_id()` per command (SELECT/INSERT/UPDATE/DELETE) the route needs? If yes, continue. If no, jump to Sub-Task: Add RLS Policy below, complete it, then resume.

- [ ] **Step 3: Extend the integration test**

Add one describe block per table the route reads. Example for table `loans`:

```typescript
describe('tenant isolation — loans', () => {
  let adamCtx: TestUserContext
  let scottCtx: TestUserContext

  beforeAll(async () => {
    adamCtx = await createTestUserInOrg(ADAM_ORG, 'adam-loans')
    scottCtx = await createTestUserInOrg(SCOTT_ORG, 'scott-loans')
  }, 30_000)

  afterAll(async () => {
    await adamCtx?.cleanup()
    await scottCtx?.cleanup()
  })

  it('Scott session sees 0 loans', async () => {
    const client = createUserScopedTestClient(scottCtx)
    const { count, error } = await client.from('loans').select('*', { count: 'exact', head: true })
    expect(error).toBeNull()
    expect(count).toBe(0)
  })
})
```

- [ ] **Step 4: Run the new describe block**

```bash
AUDIT_ADAM_ORG_ID=<uuid> npm test tests/security/tenant-isolation.integration.test.ts -t "<table>"
```

Expected: PASS. If FAIL, RLS is not actually enforcing — go back to Step 2 and fix.

- [ ] **Step 5: Swap the route's Supabase client**

Replace:
```typescript
import { createServiceClient } from '@/lib/supabase/service'

const supabase = createServiceClient()
```

With:
```typescript
import { createClient } from '@/lib/supabase/server'

const supabase = createClient()
```

- [ ] **Step 6: Remove redundant explicit org filters**

Any `.eq('organization_id', <value>)` on a query that now goes through the user-scoped client AND whose table has RLS on `get_my_organization_id()` is now redundant. Remove it. Keep only sub-scope filters (e.g. `.eq('id', contactId)`, `.eq('status', 'active')`).

- [ ] **Step 7: Run typecheck**

```bash
npm run build
```

Expected: build passes. If type errors appear about nullable auth users or missing await on `createClient()`, fix inline — `createClient()` is synchronous in this codebase.

- [ ] **Step 8: Manual smoke — hit the route as Adam**

In a second terminal: `npm run dev`. Hit the route via the dashboard UI or curl. Expected: same data Adam saw before the conversion. If rows dropped to zero, the route's RLS policy is expecting a session shape that's not being passed — debug before committing.

- [ ] **Step 9: Commit**

```bash
git add src/app/api/<route-path> tests/security/tenant-isolation.integration.test.ts
git commit -m "security: convert <route-path> to user-scoped client"
```

- [ ] **Step 10: Append to conversion log**

Append to `tasks/tenant-scoping-conversion-log.md`:

```markdown
## <route-path>
- Commit: <short-sha>
- Before: service-role
- After: user-scoped
- Tables: <comma-separated>
- RLS added: none | migration 0XX
- Explicit org filters removed: <n>
- Manual smoke verified: yes
```

---

### Sub-Task: Add RLS Policy (invoked only when Step 2 or Step 4 reveals missing RLS)

**Files:**
- Create: `supabase/migrations/0XX_<table>_rls.sql` — next available number. Current highest is `091`, so start at `092`.

- [ ] **Step A: Write the migration**

Template (replace `<table>`, renumber policies if names collide):

```sql
-- Migration 0XX: add RLS policies to <table>
ALTER TABLE public.<table> ENABLE ROW LEVEL SECURITY;

CREATE POLICY "<table>_select_own_org"
  ON public.<table>
  FOR SELECT
  USING (organization_id = get_my_organization_id());

CREATE POLICY "<table>_insert_own_org"
  ON public.<table>
  FOR INSERT
  WITH CHECK (organization_id = get_my_organization_id());

CREATE POLICY "<table>_update_own_org"
  ON public.<table>
  FOR UPDATE
  USING (organization_id = get_my_organization_id())
  WITH CHECK (organization_id = get_my_organization_id());

CREATE POLICY "<table>_delete_own_org"
  ON public.<table>
  FOR DELETE
  USING (organization_id = get_my_organization_id());
```

- [ ] **Step B: Apply via Supabase MCP**

Use `mcp__e3151559-6ff6-4fec-a1b1-e68a6212bd73__apply_migration` with project ID `uuqedsvjlkeszrbwzizl`, name `add_<table>_rls_policies`, and the SQL from Step A.

- [ ] **Step C: Re-run the describe block for this table**

```bash
AUDIT_ADAM_ORG_ID=<uuid> npm test tests/security/tenant-isolation.integration.test.ts -t "<table>"
```

Expected: PASS.

- [ ] **Step D: Commit migration separately from the route conversion**

```bash
git add supabase/migrations/0XX_<table>_rls.sql
git commit -m "db: add RLS policies to <table>"
```

- [ ] **Step E: Return to the Conversion Template at Step 5**

---

### Sub-Task: keep-with-justification route

For routes marked `keep-with-justification` in Phase 1 (verified webhooks, cron handlers, admin-only system routes):

- [ ] **Step 1: Identify how `organization_id` is resolved from a trusted source**

Valid sources:
- Verified webhook signature + payload body (e.g. Arive webhook with HMAC-verified `org_slug`)
- Cron handler that iterates every org explicitly (loop: `for (const org of allOrgs) …`)
- Admin session with `requireOrgAdmin()` check

**Invalid sources:** `req.body.org_id` without signature verification, `req.headers['x-org-id']` without auth.

- [ ] **Step 2: Add explicit filter + justification comment**

Pattern:
```typescript
/**
 * SERVICE-ROLE JUSTIFIED: <specific reason — e.g. "Arive webhook, no user session".>
 * Tenant safety: `orgId` is resolved from the verified webhook signature payload
 * (see verifyLosPayload.ts). Every query below filters by `organization_id = orgId`.
 * Audited: 2026-04-21 tenant-scoping hardening.
 */
const { orgId } = await verifyAndParseWebhookPayload(req)
if (!orgId) return new Response('missing org', { status: 400 })

const supabase = createServiceClient()
const { data } = await supabase
  .from('loans')
  .select('*')
  .eq('organization_id', orgId) // required — RLS bypassed
```

- [ ] **Step 3: Every `.from(<table>)` in the route must be followed by `.eq('organization_id', orgId)`**

Grep the route. Any query without the filter is a bug — fix before committing.

- [ ] **Step 4: Run typecheck**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/app/api/<route-path>
git commit -m "security: justify service role on <route-path> with explicit org filter"
```

- [ ] **Step 6: Append to conversion log**

```markdown
## <route-path>
- Commit: <short-sha>
- Action: keep-with-justification
- Reason: <webhook / cron / admin>
- Org source: <verified payload / loop over allOrgs / requireOrgAdmin()>
- Manual smoke verified: yes
```

---

### Sub-Task: delete route

For routes marked `delete` in Phase 1:

- [ ] **Step 1: Confirm no callers**

```bash
# Search for fetch('/api/<path>') or router.push('/api/<path>')
grep -rn "<route-path>" src/
```

If callers exist, change the action to `convert` or `keep-with-justification` — do not delete a route with live callers. Escalate to Adam if ambiguous.

- [ ] **Step 2: Delete the file**

```bash
rm src/app/api/<route-path>/route.ts
```

- [ ] **Step 3: Run typecheck**

```bash
npm run build
```

Expected: build passes.

- [ ] **Step 4: Commit**

```bash
git add -A src/app/api/<route-path>
git commit -m "chore: remove dead route <route-path>"
```

- [ ] **Step 5: Append to conversion log**

```markdown
## <route-path>
- Commit: <short-sha>
- Action: delete
- Callers confirmed: zero
```

---

## Phase 3 — Live Probe

### Task 3: End-to-end tenant-isolation probe against prod

**Files:**
- Create: `tasks/tenant-scoping-live-probe-results.md`
- Create: `tasks/tenant-scoping-audit-2026-04-21-final.md`

- [ ] **Step 1: Expand the integration test to cover every org-scoped table**

Replace the single smoke test with a data-driven sweep. Append to `tests/security/tenant-isolation.integration.test.ts`:

```typescript
const ORG_SCOPED_TABLES = [
  'contacts', 'loans', 'documents', 'activity_log', 'automation_logs',
  'chat_sessions', 'loan_milestone_events', 'milestone_communications',
  'outlook_tokens', 'email_drafts', 'loan_status_history', 'todo_items',
  'user_settings', 'scenarios', 'contact_activity', 'contact_emails',
  'marketing_activity_log', 'org_settings', 'automation_registry',
  'automation_runs', 'drip_campaigns', 'drip_steps', 'drip_enrollments',
  'drip_sends', 'drip_suppressions', 'agent_conversations', 'agent_handoffs',
  'webhook_deliveries', 'activity_log_pii', 'los_integrations', 'notes',
  'resend_webhook_events', 'workflow_shadow_log',
] as const

describe('Phase 3 — cross-tenant sweep', () => {
  let scottCtx: TestUserContext

  beforeAll(async () => {
    scottCtx = await createTestUserInOrg(SCOTT_ORG, 'scott-sweep')
  }, 30_000)

  afterAll(async () => {
    await scottCtx?.cleanup()
  })

  it.each(ORG_SCOPED_TABLES)('Scott session sees 0 rows from %s', async (tableName) => {
    const client = createUserScopedTestClient(scottCtx)
    const { count, error } = await client.from(tableName).select('*', { count: 'exact', head: true })
    expect(error).toBeNull()
    expect(count).toBe(0)
  })
})
```

Excluded tables (system cross-tenant, documented in Phase 1 prompt): `organizations`, `profiles`, `security_audit_log`, `admin_audit_log`. `organizations` and `profiles` have their own scoping rules (see membership model). `security_audit_log` and `admin_audit_log` are system tables — covered by admin route tests, not this sweep.

- [ ] **Step 2: Run the full sweep**

```bash
AUDIT_ADAM_ORG_ID=<uuid> npm test tests/security/tenant-isolation.integration.test.ts
```

Expected: every `it.each` entry PASSES with `count === 0`. Any FAIL is a critical gap — stop, identify the route responsible, add it to Phase 2, re-run Phase 2's conversion template, then re-run this sweep.

Do not proceed to Step 3 until every row passes.

- [ ] **Step 3: Write probe results to `tasks/tenant-scoping-live-probe-results.md`**

```markdown
# Tenant Scoping — Live Probe Results

**Date:** 2026-04-21
**Adam org:** <uuid>
**Scott org:** 40377391-6b4c-4d1a-81d2-ffd743876f0b
**Test framework:** Vitest via `tests/security/tenant-isolation.integration.test.ts`

## Per-table results

| Table | Adam count | Scott count | Verdict |
|---|---|---|---|
| contacts | 2937 | 0 | PASS |
| loans | 1276 | 0 | PASS |
<!-- …one row per table in ORG_SCOPED_TABLES… -->

## Excluded tables (system cross-tenant)

| Table | Reason |
|---|---|
| organizations | multi-org membership model |
| profiles | user-level, not org-scoped |
| security_audit_log | system table |
| admin_audit_log | system table |
```

Populate Adam-counts by running an Adam-session sweep (wrap Step 1's block for `adamCtx` too, but only logging counts — not asserting).

- [ ] **Step 4: Write the final audit summary**

File: `tasks/tenant-scoping-audit-2026-04-21-final.md`

```markdown
# Tenant Scoping Audit — Final Report

**Date:** 2026-04-21
**Status:** GREEN | YELLOW | RED

## Phase 1 — Static audit
- Routes audited: <n>
- Files audited: <n>
- PASS: <n>
- FAIL: <n> (all resolved in Phase 2)

## Phase 2 — Consolidation
- Routes converted to user-scoped: <n>
- Routes kept-with-justification: <n>
- Routes deleted: <n>
- RLS migrations added: <n> (list migration numbers)

## Phase 3 — Live probe
- Tables swept: <n>
- Scott-session leaks: 0
- See `tasks/tenant-scoping-live-probe-results.md`

## Go/no-go for Scott login

**<GREEN: GO | YELLOW: GO WITH FLAGS | RED: BLOCK>**

<If YELLOW:>
Feature flags required for Scott's org on day 1:
- <flag name>: <reason, linked follow-on spec>

<If RED:>
Blocking gaps:
- <description + severity + proposed fix>

## Next steps after this spec
- Remove `audit-probe-*@loanos.test` from `auth.users` (Step 7)
- Spec 2 (MISMO 3.4 parser) can start once this is GREEN or YELLOW
```

- [ ] **Step 5: Commit Phase 3 output**

```bash
git add tests/security/tenant-isolation.integration.test.ts \
        tasks/tenant-scoping-live-probe-results.md \
        tasks/tenant-scoping-audit-2026-04-21-final.md \
        tasks/tenant-scoping-conversion-log.md
git commit -m "audit: tenant scoping live probe + final report"
```

- [ ] **Step 6: Push the full phase to main**

Per CLAUDE.md: run local build first (pre-push hook enforces but catch failures early):

```bash
npm run build
git push origin main
```

Then watch the Vercel deploy:
- `mcp__ffdaa602-c6ad-4c4e-a44d-006990b1dafe__list_deployments` — find the latest SHA
- `mcp__ffdaa602-c6ad-4c4e-a44d-006990b1dafe__get_deployment_build_logs` — stream until state is READY

If state becomes ERROR, read logs, fix, push again. Do not end the session with a broken deploy.

- [ ] **Step 7: Clean up test users from Supabase auth**

Via Supabase MCP `execute_sql`:

```sql
SELECT id, email FROM auth.users WHERE email LIKE 'audit-probe-%@loanos.test';
```

For each row returned (there should be zero if every `cleanup()` ran — belt and braces):

```sql
DELETE FROM public.profiles WHERE id = '<uuid>';
-- Then delete auth user via admin API (SQL can't touch auth.users cleanly):
-- Use the Supabase admin client in a one-off script, OR the Supabase dashboard.
```

Confirm final count:
```sql
SELECT count(*) FROM auth.users WHERE email LIKE 'audit-probe-%@loanos.test';
```
Expected: 0.

- [ ] **Step 8: Update TODO.md**

In `/Users/adamstyer/Documents/loanos-clone/TODO.md`:
- Mark **Scott's Pilot → Tenant scoping audit** as DONE with commit SHA
- Mark **Scott's Pilot → RLS coverage verification** as DONE
- Mark **Backlog A-6** as DONE with note: "absorbed into 2026-04-21 tenant scoping hardening"

- [ ] **Step 9: Commit TODO update and push**

```bash
git add TODO.md
git commit -m "docs(todo): mark tenant scoping + A-6 complete"
npm run build && git push origin main
```

Watch Vercel until READY.

---

## Self-Review

**Spec coverage:**
- ✅ Purpose (verify + fix) → Phases 1+2+3
- ✅ Success criteria's three categories → Conversion Template + keep-with-justification Sub-Task + delete Sub-Task
- ✅ In-scope dirs (`src/app/**`, `src/lib/**`) → Phase 1 prompt
- ✅ A-6 absorption → Phase 2 is the A-6 work
- ✅ n8n exclusion → Phase 1 prompt + DECISIONS.md link
- ✅ 3-day timebox with escape hatch → feature-flag escape noted in final report (Step 4 YELLOW branch)
- ✅ Live probe method (two sessions, count rows) → Task 3 Step 1
- ✅ Probe cleanup → Task 3 Step 7
- ✅ Per-route commit discipline → every Sub-Task ends in one commit

**Placeholder scan:** None. Every `<table>`/`<route-path>` appears in a template invoked per-item, with an explicit rule for substitution.

**Type consistency:** `TestUserContext`, `createTestUserInOrg`, `createUserScopedTestClient` used consistently across Task 2 + Task 3. Table names in `ORG_SCOPED_TABLES` match the list in the Phase 1 prompt.

**Known risks surfaced:**
- `profiles` insert in the test helper uses `as never` cast because the Insert type is strict; acceptable given CLAUDE.md's guidance on `as unknown as XyzInsert`.
- The profile-row-before-signIn order is required for `get_my_organization_id()` to resolve. If this order is reversed the helper silently returns zero rows in every test and every assertion passes meaninglessly — critical invariant.
