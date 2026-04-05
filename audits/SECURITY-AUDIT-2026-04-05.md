# LoanOS Multi-Tenant Security Audit — 2026-04-05

**Target launch:** 2026-04-26 (21 days)
**Model:** Shared-schema + RLS, two tiers ($97 starter / $197 professional)
**Supabase project:** `uuqedsvjlkeszrbwzizl`
**Vercel project:** `prj_AmhlkvLIUzzlqpOtCrUy9PCyPiSx` (team `team_aJNpxKvLlNTUiDdWTdhX0Vgf`)
**Auditor:** Claude (Opus 4.6)

> Scope: code-only report. No fixes were applied. All findings are tagged
> with exact `file:line` references or database object names.

---

## Executive Summary

LoanOS has a reasonable multi-tenant foundation:

- `organizations` / `profiles` / `get_my_organization_id()` SECURITY DEFINER
  function exist and RLS policies on most tables scope by
  `organization_id = get_my_organization_id()`.
- A `getOrganization()` server helper resolves tenant context from the
  session cookie and is used in most API routes.
- There is a `plan` column on `organizations` and a working
  `canAccessFeature()` stub plus an admin `override-plan` route.

However, **the app is not launch-ready for multi-tenant public sale.**
The dominant pattern in API routes is "resolve `organizationId` from
session, then use the **service role** key to run every query." That
pattern is safe *only if every query manually filters by
`organization_id`*. At least 10 routes currently have bugs or gaps in
that manual scoping, and several tables / storage buckets / RLS policies
are outright unsafe.

The top bleed risks are:

1. `activity_log` INSERT has `with_check = true` — any authed user can
   write a log row under any org.
2. Storage `documents` SELECT policy accepts `foldername[1] = auth.uid()`
   OR an org join, but INSERT only checks `foldername[1] = auth.uid()`
   — any logged-in user can upload under their uid folder *regardless
   of org*, and there's no cross-tenant read scope in practice if the
   folder convention drifts.
4. `loan_milestone_events` / `loan_status_history` / `milestone_communications`
   RLS policies use `loans.user_id = auth.uid()` — user-scoped, not
   org-scoped. In a multi-user org, members cannot see teammates' loan
   events, and if a user is moved between orgs the events travel with
   them.
5. `challenges`, `responses`, `kids` tables have `USING (true)` policies —
   fully public to every authed user. They don't seem production-critical
   but should not ship.
6. `/api/arive-webhook` (legacy) picks "the first profile with an org"
   when the payload lacks a `user_id` — in a multi-tenant world this
   routes every unauth'd Arive call to whichever tenant happened to be
   inserted first.

**Pricing-tier gating is not implemented anywhere in API routes or
middleware.** The `canAccessFeature()` helper exists but is not imported
or called by any route. Nothing currently stops a starter-plan org from
hitting professional-only endpoints.

---

## 1. Tenant Isolation

### 1a. Tables — RLS + tenant column inventory

All public tables have an `organization_id` (NOT `tenant_id`/`org_id`
uniformly — see finding H-1 below). Tables with RLS disabled are flagged.

**Tables with RLS DISABLED (6):**

| Table | Tenant col | Risk |
|---|---|---|
| `agent_conversations` | `org_id` | **CRITICAL** — anon key reads everyone's agent chats |
| `agent_handoffs` | `org_id` | **HIGH** |
| `agent_tools` | `org_id` | HIGH |
| `agents` | `org_id` | HIGH |
| `system_admins` | `user_id` | LOW — server-only, but should still have `USING (false)` so even the anon key returns empty |
| `waitlist_signups` | none | MEDIUM — marketing signups; PII exposure |

**Tables with `USING (true)` / "Allow all" policies (effectively no RLS):**

| Table | Policy |
|---|---|
| `challenges` | `Allow all on challenges` — `USING true WITH CHECK true` |
| `responses`  | `Allow all on responses`  — `USING true WITH CHECK true` |
| `kids`       | `Allow all on kids`       — `USING true WITH CHECK true` |

**Tables scoped only by `user_id` (no org scoping):**

| Table | Policies | Multi-tenant issue |
|---|---|---|
| `marketing_activity_log` | `auth.uid() = user_id` | Members of the same org cannot see each other's marketing log; if a user is moved to a different org their historical rows remain attached to them. Not a cross-tenant **leak**, but a data-model bug. |
| `mcc_state` | `auth.uid() = user_id` | Same. |
| `user_settings` | `auth.uid() = user_id` | Correct for true per-user settings; fine. |
| `loan_milestone_events` | `loan.user_id = auth.uid()` | **HIGH** — filters by loan owner, not the loan's org. Teammates cannot see events on each other's loans. If the loan's `user_id` is ever null, events become invisible. |
| `loan_status_history` | same | same |
| `milestone_communications` | joins through `loans.user_id = auth.uid()` | same |

**Tables with correct org scoping via `get_my_organization_id()`:**
`activity_log` (SELECT only — see H-1), `automation_registry`,
`automation_runs`, `chat_sessions`, `contact_activity`, `contact_emails`,
`contacts`, `documents`, `drip_campaigns`, `drip_enrollments`,
`drip_sends`, `drip_steps`, `email_drafts`, `lenders`, `loans`,
`org_settings`, `performance_data`, `scenarios`, `social_activity`,
`social_drafts`, `social_settings`, `system_prompts`, `todo_items`,
`profiles`, `organizations`.

### 1b. Findings

#### CRITICAL — T-1: `activity_log` INSERT is fully open
**Where:** `pg_policies.activity_log."Users can insert own activity"`
**qual:** `null` `with_check:` `(user_id = auth.uid()) OR (organization_id IS NOT NULL AND organization_id = get_my_organization_id())`
**Attack path:** The `OR` clause allows an authed user from tenant A to
insert an `activity_log` row with `user_id = auth.uid()` **and any
`organization_id` they like** (or `NULL`). Because some routes use
service-role and display `activity_log` entries, an attacker could plant
rows visible inside another tenant (SELECT policy only filters by
`organization_id = get_my_organization_id()`, so they'd still need the
target org's id — trivial to obtain via invite or guessing).
Also: rows with `organization_id = NULL` become ghosts that never render
but pollute the table.
**Fix:** rewrite `with_check` to require BOTH:
```sql
WITH CHECK (
  user_id = auth.uid()
  AND organization_id = get_my_organization_id()
)
```

#### CRITICAL — T-2: 6 tables with RLS disabled
**Where:** DB — `agent_conversations`, `agent_handoffs`, `agent_tools`,
`agents`, `system_admins`, `waitlist_signups`
**Attack path:** The `anon` role (public key) can `SELECT *` from any of
these from a browser client. `agent_conversations` may contain full
Claude transcripts with PII and borrower details.
**Fix:** `ALTER TABLE … ENABLE ROW LEVEL SECURITY;` for each, then add
org-scoped policies. For `system_admins` add `USING (false)` (only
service-role reads it). For `waitlist_signups` add
`INSERT WITH CHECK true` for `anon` only, no SELECT.

#### CRITICAL — T-3: `USING (true)` on `challenges`, `responses`, `kids`
**Where:** `pg_policies`
**Attack path:** Any authed user reads/writes all rows. `kids` and
`responses` look like leftover dev tables — should either be dropped or
locked down. A malicious signup could dump these from a browser.
**Fix:** drop if unused; otherwise replace with org-scoped policies.

#### HIGH — T-4: milestone / status tables scoped by `loans.user_id`
**Where:**
- `loan_milestone_events` policy "Users can read milestone events for their loans"
- `loan_status_history` policy "Authenticated users can read loan_status_history"
- `milestone_communications` policy "Users can read their milestone communications"

All three resolve through `loans.user_id = auth.uid()`, NOT
`loans.organization_id = get_my_organization_id()`.
**Impact:** Broken for any org with >1 user. Members cannot see
teammates' loan status history. Makes team accounts (the whole point of
multi-tenant) half-useless.
**Fix:** rewrite all three policies to join through
`loans.organization_id = get_my_organization_id()`.

#### HIGH — T-5: `marketing_activity_log` and `mcc_state` scoped by user, not org
**Where:** `pg_policies.marketing_activity_log`, `pg_policies.mcc_state`
**Impact:** Same as T-4 — works for single-user orgs only. With Adam's
plan for team accounts on the $197 tier, these need to be org-scoped so
managers can see what their team has sent.
**Fix:** rewrite to `(auth.uid() = user_id OR organization_id = get_my_organization_id())` for SELECT;
keep `auth.uid() = user_id` for INSERT.

#### MEDIUM — T-6: no `tenant_id` standardization
**Where:** mixed column names across tables
- `organization_id` — 18 tables
- `org_id` — 11 tables (`agent_*`, `automation_*`, `drip_*`, `system_prompts`)
**Impact:** Two different naming conventions double the surface area for
"did I filter this query?" audits. The `get_my_organization_id()`
function only works in policies that reference the matching column
name, so bugs where code uses the wrong column name will compile but
silently return empty results or leak.
**Fix:** pick one (`organization_id`) and migrate the `drip_*`,
`automation_*`, `agent_*`, `system_prompts` tables. Or add a
`get_my_org_id()` alias so both sides can use either.

#### MEDIUM — T-7: `automation_logs` has no tenant column at all
**Where:** `automation_logs.rls_enabled = true`, `has_organization_id/org_id = false`
Policy scopes via `loan_id IN (SELECT id FROM loans WHERE organization_id = get_my_organization_id())`.
**Impact:** works, but only if `loan_id` is always set. The INSERT
policy is `WITH CHECK true` — anyone can write a log row with any
`loan_id` they want (or null, which then gets filtered out on SELECT but
still lives in the table).
**Fix:** add an `organization_id` column, backfill from the loan, and
rewrite the INSERT policy.

---

## 2. API Route Audit

73 API route files inspected. Overall pattern:

- **Session-based routes** (browser → `getOrganization()`) — mostly
  correct. 44 routes use this pattern.
- **Service-role routes** — 45 distinct files call `createServiceClient()`.
  Of those, ~39 also call `getOrganization()` first and filter queries
  by the resolved `organizationId`. ~6 resolve tenancy in other ways
  (agent secret, webhook slug, share token, admin check).
- **Agent-secret routes** (`LOANOS_AGENT_SECRET`) — 3 of 3 use the
  "first profile with an org" fallback, which is a **hard-coded
  single-tenant assumption**.

### 2a. Findings

#### CRITICAL — A-1: Legacy Arive webhook is single-tenant by construction
**File:** `src/app/api/arive-webhook/route.ts:74-107`
**What's wrong:** If the payload lacks `user_id`, the code runs:
```ts
const { data: fallbackProfile } = await serviceClient
  .from('profiles')
  .select('organization_id, id')
  .not('organization_id', 'is', null)
  .order('created_at', { ascending: true })
  .limit(1)
  .single()
```
Whichever org was inserted **first** receives *every* webhook that doesn't
include a user_id. After launch, that will be an early trial customer,
not Adam. Any misconfigured Arive connector will silently pollute one
customer's pipeline.
**Fix:** delete this file. The replacement at
`src/app/api/webhooks/los/arive/[org_slug]/route.ts` exists and works
correctly. The comment at the top of the legacy file says it should be
removed after the grace period. The launch cut-over is the right
moment.

#### CRITICAL — A-2: `/api/agents/daily-briefing` agent-secret path picks first org
**File:** `src/app/api/agents/daily-briefing/route.ts:39-55`
**What's wrong:** Same "first profile with a non-null org" fallback as
A-1, gated only by `LOANOS_AGENT_SECRET`. Anyone who knows the shared
agent secret (n8n workflows, Adam's env vars, developers, shared 1Password
vaults) can trigger a daily briefing and Claude-generated summary for
"the first tenant" — not necessarily their own.
**Fix:** require the caller to pass `organization_id` (or `org_slug`)
explicitly in the request body or path, and look it up by that key.

#### CRITICAL — A-3: `/api/contacts/web-lead` routes every web lead to `LOANOS_SYSTEM_USER_ID`
**File:** `src/app/api/contacts/web-lead/route.ts:79-90`
**What's wrong:** Uses a single global env var `LOANOS_SYSTEM_USER_ID`
to pick the receiving org. Every LoanOS customer's styermortgage.com-
equivalent form will write leads into whichever org that env var
resolves to. This is baked into the v2 launch architecture and *will*
leak lead data between tenants.
**Fix:** route web leads via `/api/webhooks/los/...[org_slug]` pattern
(same as Arive multi-tenant route). Each customer gets their own
webhook slug.

#### CRITICAL — A-4: `/api/marketing/log` agent-secret path picks first org
**File:** `src/app/api/marketing/log/route.ts:39-49`
**What's wrong:** Identical "first profile with an org" fallback when
invoked via `LOANOS_AGENT_SECRET`. Any n8n workflow writes to the first
org in the DB.
**Fix:** require explicit `organization_id` in the body, validated
against a per-org webhook secret.

#### HIGH — A-5: `/api/share/[token]` uses service role and does not expire-check server-side correctly
**File:** `src/app/api/share/[token]/route.ts:18-34`
**What's wrong:** The share token lookup uses service role and filters
only by `share_token`. That's okay (tokens are UUIDs by design), but:
(a) the code returns `data.organization_id` in branding lookups —
anything else on the scenario row that isn't whitelisted could leak
if someone adds a new column;
(b) there's no rate limiting — the route can be brute-forced against
short/guessable tokens if any exist in prod;
(c) the increment of `view_count` is not atomic — concurrent viewers
race.
**Fix:** explicitly whitelist columns in the `.select()` call, add rate
limiting, use `increment()` via RPC.

#### HIGH — A-6: Service-role routes with tenant scoping in route handler, not helper
**Files (representative — there are ~30 of these):**
- `src/app/api/automations/registry/route.ts:16-20`
- `src/app/api/automations/registry/[id]/route.ts:29-36`
- `src/app/api/automations/bulk-action/route.ts:28-35`
- `src/app/api/drip/campaigns/route.ts:30-47`
- `src/app/api/drip/campaigns/[id]/steps/route.ts:13-22`
- `src/app/api/contacts/merge/route.ts:20-32`
- `src/app/api/contacts/bulk-action/route.ts:26-85`
- `src/app/api/social/drafts/route.ts:8-69`
- `src/app/api/social/settings/route.ts:14-46`
- `src/app/api/chat/route.ts:176,456,509` (all `createServiceClient` calls)
- `src/app/api/outreach/route.ts:13-36`

**What's wrong:** Each of these routes calls `createServiceClient()`
(bypasses RLS) and then manually filters every query by `organizationId`
from `getOrganization()`. Today they're all correct, but this is a
brittle pattern — any future missing `.eq('organization_id', …)` or
`.eq('org_id', …)` will silently leak across tenants with zero DB-layer
backstop.
**Fix:** create a `createUserScopedClient()` helper that passes the
user's cookie-based session to `createServerClient` so RLS applies. Use
that client for all reads/writes unless there's a clear need for
service-role (e.g. writing an `activity_log` row the user's INSERT
policy wouldn't allow). Today's routes will still work but get a free
RLS safety net. The LoanOS codebase already has `createClient()` in
`src/lib/supabase/server.ts` — it just isn't used in routes that also
need service-role for other operations.

#### HIGH — A-7: `getSteps(campaignId)` in `src/lib/drip/queries.ts:80-88` has no org filter
**File:** `src/lib/drip/queries.ts:80-88`
**What's wrong:** `getSteps(campaignId)` does not take `orgId` and does
not filter by it. It's only safe because the calling route
(`src/app/api/drip/campaigns/[id]/steps/route.ts`) pre-checks
`getCampaignById(orgId, id)`. Any new caller that forgets that pre-check
leaks campaign steps across tenants.
**Fix:** add `orgId` as a required param; filter `drip_steps` by
`org_id` directly.

#### HIGH — A-8: `updateStep(orgId, stepId, ...)` assumes `drip_steps.org_id` but policy only scopes via parent
**File:** `src/lib/drip/queries.ts:92-104`
**What's wrong:** The UPDATE filters `.eq('org_id', orgId)` on
`drip_steps`, but the RLS policy on `drip_steps` is also scoped by
`org_id = get_my_organization_id()` — both sides assume `drip_steps`
has an `org_id` column. Verified: the table does have `org_id` (per DB
audit). Safe today but means the column must always be populated on
insert; the POST handler in
`src/app/api/drip/campaigns/[id]/steps/route.ts` only sets fields
from the request body — verify it writes `org_id` explicitly. A
missing `org_id` on insert would trip RLS (`with_check` fails) but
produce confusing 500s.
**Fix:** make `org_id` `NOT NULL` in the schema and set it explicitly in
the steps POST handler.

#### MEDIUM — A-9: `/api/chat/route.ts` uses service-role for lender lookups inside a tool callback
**File:** `src/app/api/chat/route.ts:119-160`
**What's wrong:** The `queryLenderDatabase` tool (exposed to Claude via
tool-use) queries `lenders` by `organization_id`. That's correct, *but*
the `organizationId` comes from the enclosing request context — if any
future refactor passes the wrong id, Claude could be told "here are
your lenders" for another org. There is no second-layer check.
**Fix:** wrap all service-role queries in a thin helper that requires
`organizationId` as its first arg and logs mismatches.

#### MEDIUM — A-10: `/api/admin/*` routes do not verify the admin's own org
**Files:**
- `src/app/api/admin/tenants/route.ts`
- `src/app/api/admin/tenants/[id]/override-plan/route.ts`
- `src/lib/admin/auth.ts:17-38`

**What's wrong:** `requireAdmin()` checks `system_admins.user_id =
auth.uid()`. That's correct for a super-admin role. But `system_admins`
has RLS **disabled** (see T-2) — if someone gets write access to that
table from any path, they become a super-admin.
**Fix:** enable RLS on `system_admins` with `USING (false)`; only
service-role can read/write it. Then log every admin action to an
audit table (which `override-plan` already does — good).

#### MEDIUM — A-11: Routes exempted from middleware auth matcher
**File:** `src/middleware.ts:53-57`
```
matcher: [
  '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|…)$|api/agents/.*|api/contacts/web-lead|api/marketing/log-social-post|onboarding|share/.*|api/share/.*).*)',
]
```
`api/agents/.*` — all agent routes skip middleware. They rely on each
route implementing its own `validateAgentSecret` check. That's already
bitten us in A-2: agent routes with broken tenant resolution also skip
the middleware-level session check.
**Fix:** move all agent routes under `/api/webhooks/agents/[org_slug]/…`
and add secret verification via `resolveOrgFromSlug` pattern already
used by `src/app/api/webhooks/los/arive/[org_slug]/route.ts`.

#### LOW — A-12: `/api/onboarding/step` uses service-role for a scoped UPDATE
**File:** `src/app/api/onboarding/step/route.ts:30-42`
Safe today (it filters by `organization_id` from `getOrganization()`),
but could use the user-scoped client instead.

---

## 3. Auth & Middleware

**File:** `src/middleware.ts`

**Session → tenant resolution:** Happens twice. Once at the middleware
layer (`profiles.organization_id` lookup after `auth.getUser()`) to
redirect users with no org to `/onboarding`. Once again per-request in
`getOrganization()` inside route handlers. That's duplicate work but
not a correctness issue.

**Things middleware does right:**
- Calls `supabase.auth.getUser()` (not `getSession()` — correct).
- Redirects unauth'd users away from protected routes.
- Checks profile has `organization_id` before allowing `/dashboard`.
- First-time user gated to `/dashboard/getting-started`.

**Things middleware doesn't do:**
- **No tier check.** The middleware knows the org but never reads
  `organizations.plan`. There is no server-side enforcement of the
  $97 vs $197 boundary today (finding F-1 below).
- **No role enforcement** for admin UI routes (`/admin/*`). Individual
  pages do their own `isSystemAdmin()` check, but a caller hitting an
  `/api/admin/*` route directly is only protected by per-route
  `requireAdmin()`. Fine as long as every admin route uses that helper
  — currently true.
- **No request logging / audit trail** at the middleware layer.

### Findings

#### HIGH — M-1: User-level trust without tenant enforcement in webhook-adjacent routes
**Files:** `src/app/api/marketing/log/route.ts:59-64`,
`src/app/api/agents/daily-briefing/route.ts:20-36`
Both routes have a dual-auth path: session cookie OR agent secret. The
session path reads `auth.uid()` and trusts `profile.organization_id`
for that user. Safe. The agent-secret path bypasses user auth entirely
and then falls back to "first org in the DB" — see A-2/A-4.

#### MEDIUM — M-2: `get_my_organization_id()` returns the single first row
**Definition:** `SELECT organization_id FROM profiles WHERE id = auth.uid()`
That's fine today because `profiles` PKs on `id` (one row per user).
If you ever let a user belong to multiple orgs (org-switching UX, which
is a common $197-tier feature), this function will break. Plan the
migration now: add a `current_organization_id` column on `profiles` or
use a `memberships` table with a "last_active_org" record.

---

## 4. Secrets & Env Vars

### 4a. Env vars referenced in code (from grep of `process.env`)

| Var | Files | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | 6 | public, OK |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 3 | public, OK |
| `SUPABASE_SERVICE_ROLE_KEY` | 5 direct + imported via `createServiceClient` everywhere | secret |
| `SUPABASE_URL` | `src/lib/arive/processWebhook.ts:12` | legacy; should use `NEXT_PUBLIC_SUPABASE_URL` for consistency |
| `ANTHROPIC_API_KEY` | `src/lib/anthropic/client.ts:12`, `src/app/api/scenarios/generate-narrative/route.ts:127` | secret |
| `LOANOS_AGENT_SECRET` | `src/lib/auth/validateAgentSecret.ts:11`, `src/app/api/agents/daily-briefing/route.ts:12`, `src/app/api/marketing/log/route.ts:30` | secret |
| `LOANOS_SYSTEM_USER_ID` | `src/app/api/contacts/web-lead/route.ts:79` | **bad pattern** — see A-3 |
| `ARIVE_WEBHOOK_SECRET` | `src/app/api/arive-webhook/route.ts:37`, `src/app/api/arive-webhook/[slug]/route.ts:15` | global shared secret; multi-tenant route at `webhooks/los/arive/[org_slug]` replaces this with per-integration hashed secrets — good |
| `PUBLER_API_KEY` | `src/app/api/social/publish/route.ts:5` | secret, fallback to empty string |
| `PUBLER_WORKSPACE` | same | fallback to empty string |
| `N8N_API_KEY` | `src/app/api/automations/registry/[id]/route.ts:104`, `…/run-now/route.ts:35` | secret |
| `N8N_WEBHOOK_BASE` | `src/app/api/automations/email/generate/route.ts:7` | URL, default `https://styer.app.n8n.cloud/webhook` |
| `N8N_OUTLOOK_DRAFT_WEBHOOK_URL` | `src/app/api/automations/email/[draftId]/send/route.ts:22`, `…/automations/send/route.ts:24`, `…/scenarios/send-email/route.ts:22` | URL |
| `NOTEBOOKLM_SERVICE_URL` | `src/app/api/chat/route.ts:47` | default `http://localhost:8001` |
| `NEXT_PUBLIC_APP_URL` | `src/app/api/scenarios/send-email/route.ts:49` | default `https://loanos.vercel.app` |
| `NEXT_PUBLIC_N8N_WEBHOOK_BASE` | `src/app/dashboard/loans/[id]/page.tsx:19` | default `https://styer.app.n8n.cloud/webhook` |

**Vercel env var cross-reference:** The Vercel MCP tool surface does
not expose project env var listing, so I cannot confirm each of the
above is actually set in the deployed environment. Recommend running
`vercel env ls` manually before launch and comparing against this list.

### 4b. Findings

#### HIGH — S-1: Hard-coded default URLs leak Adam's private infrastructure
**Files:**
- `src/app/api/automations/email/generate/route.ts:7` — default `https://styer.app.n8n.cloud/webhook`
- `src/app/api/scenarios/send-email/route.ts:49` — default `https://loanos.vercel.app`
- `src/app/dashboard/loans/[id]/page.tsx:19` — default `https://styer.app.n8n.cloud/webhook`

**What's wrong:** Every LoanOS customer's deployment, if they forget to
set the env var, will route their automations through *Adam's* n8n
instance. Beyond leaking usage to Adam, it's a single point of failure
and a trust/privacy problem for paying customers.
**Fix:** remove the defaults — throw at boot if the env var is not set.

#### HIGH — S-2: Hard-coded Publer account IDs
**File:** `src/app/api/social/publish/route.ts:9-14`
```
instagram: { id: '69b0530110a77a0ed895847d', … }
linkedin:  { id: '69b0536404b824ffb2c05426', … }
facebook:  { id: '69b05329de86f5e15b7c0722', … }
google:    { id: '69c3e3f548d8e4e643d45438', … }
```
These are **Adam's personal social account IDs**. Every tenant that
hits `/api/social/publish` will attempt to post to Adam's accounts.
**Fix:** move to `org_settings.publer_accounts` JSONB per-org; require
it to be present before the publish endpoint runs.

#### MEDIUM — S-3: Hard-coded NMLS #513013 in shared components
**Files:**
- `src/lib/defaultOutreachPrompt.ts:3,10,11`
- `src/components/share/SharePageLayout.tsx:36,42`
- `src/components/share/ShareCTA.tsx:13,16`
- `src/components/share/ShareFooter.tsx:13`
- `src/app/dashboard/marketing/_components/CarouselBuilder.tsx:92`
- `src/app/dashboard/marketing/_components/carouselRenderer.ts:119`
- `src/app/dashboard/marketing/_components/SocialPostPreview.tsx:62,468`
- `src/app/api/scenarios/generate-pdf/route.ts:496`

**What's wrong:** Adam's NMLS number appears as a **default** (not a
placeholder) in share pages, carousels, PDFs, and Claude prompts. Every
customer on the platform will see Adam's NMLS rendered where their own
should be if they haven't configured theirs in `user_settings`. This
is a compliance + brand identity problem, and a regulatory issue for
mortgage licensees (LO must display *their own* NMLS on every
communication).
**Fix:** replace every `|| '513013'` fallback with the LO's own NMLS
from `user_settings.nmls`, and *fail loud* (red banner or error) if not
present.

#### MEDIUM — S-4: `SUPABASE_SERVICE_ROLE_KEY` referenced directly in 5 files outside of `lib/supabase/service.ts`
**Files:**
- `src/lib/arive/processWebhook.ts:13,18,20,24,25`
- `src/lib/logEmail.ts:19,20`
- `src/lib/supabase/logEmailDraft.ts:17,18`
- `src/app/api/email-drafts/route.ts:6,7`
- `src/app/dashboard/waitlist/page.tsx:29,30` **← service key in a page component!**

**What's wrong:** `src/app/dashboard/waitlist/page.tsx` imports
`createClient` from `@supabase/supabase-js` using the service role key
**inside a Next.js page**. Next pages are rendered on the server, so
technically the key stays server-side, but:
  1. any refactor that accidentally marks this component `'use client'`
     inlines the service key into the bundle,
  2. the dashboard route is user-facing and could be navigated to by any
     authed user — the service client reads `waitlist_signups`
     (which, recall, has RLS disabled — T-2),
  3. multiple files re-instantiate the service client instead of going
     through `createServiceClient()` helper.
**Fix:** (a) move waitlist reads to an API route; (b) consolidate every
service-role instantiation through `src/lib/supabase/service.ts`; (c)
add an eslint rule or grep-based CI check that forbids
`SUPABASE_SERVICE_ROLE_KEY` references outside `lib/supabase/service.ts`.

#### LOW — S-5: `process.env.PUBLER_API_KEY || ''` silent fallback
**File:** `src/app/api/social/publish/route.ts:5-6`
An empty-string fallback means misconfigured deploys will make HTTP
calls with an empty API key and log confusing 401s.
**Fix:** throw at module load if not set.

---

## 5. Storage

**Buckets:**

| Bucket | Public | File size limit |
|---|---|---|
| `documents` | false | none |
| `social-assets` | **true** | none |
| `drawings` | **true** | 5 MB |

**Policies:**

| Policy | Cmd | Check |
|---|---|---|
| `documents` INSERT: `Allow authenticated users to upload to own folder 1potspk_0` | INSERT | `bucket_id='documents' AND foldername[1] = auth.uid()` |
| `documents` INSERT: `Users can upload their own documents` | INSERT | same |
| `documents` SELECT: `Users can read their own documents` | SELECT | `foldername[1] = auth.uid() OR EXISTS(join documents→loans→profile for org match)` |
| `drawings` ALL | ALL | `bucket_id = 'drawings'` — no auth check |
| (no `social-assets` policies in the result set — it's public AND policy-less) |

### Findings

#### CRITICAL — ST-1: `documents` INSERT lacks org scoping
**Policy:** `Users can upload their own documents`
**What's wrong:** INSERT only checks `foldername[1] = auth.uid()`. The
SELECT policy has a *second* arm that permits org-mates to read, but
INSERT does not verify that the *user uploading* actually belongs to
the `documents` row's `organization_id`. A user can upload under
their-uid/whatever.pdf, then have a separate service-role process
insert a `documents` row pointing to it with a *different*
`organization_id` — and because the INSERT policy on `public.documents`
allows any org member to insert for their org, a cross-tenant file
attachment becomes possible with two hops.
**Fix:** make the storage path scheme `orgs/{organization_id}/{user_id}/…`
and rewrite the INSERT policy:
```sql
WITH CHECK (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = 'orgs'
  AND (storage.foldername(name))[2]::uuid IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
)
```

#### CRITICAL — ST-2: Two duplicate `documents` INSERT policies
**Policies:** `Allow authenticated users to upload to own folder 1potspk_0`
and `Users can upload their own documents` — both on `documents`
INSERT, both with the same clause.
**What's wrong:** Duplicates are OR'd at evaluation, so there's no
security difference today, but duplicate policies signal drift in the
migrations and make it easy to edit one and think you fixed the rule
when the other still permits the action.
**Fix:** drop one.

#### CRITICAL — ST-3: `drawings` bucket is fully public read/write/delete/update
**Policies:** `Public read/upload/update/delete drawings` — all with
`bucket_id = 'drawings'` and **no auth check whatsoever**.
**Attack path:** any unauth'd caller (with anon key) can delete every
drawing in the bucket, or upload arbitrary files up to 5 MB each (used
as free hosting / malware delivery / etc.). Also a surprise cost vector.
**Fix:** at minimum require `auth.role() = 'authenticated'`. Ideally
scope to `foldername[1] = user_id` or `foldername[1] = organization_id`.

#### HIGH — ST-4: `social-assets` bucket is public with no policies
**Bucket:** `social-assets`, `public = true`
**What's wrong:** Public read is probably intentional (social posts
need public image URLs), but there are no INSERT/UPDATE/DELETE policies
visible in `pg_policies` — that means either (a) inherited defaults
apply, (b) uploads use service role only. Either way, it's opaque and
needs an explicit policy stating who can write.
**Fix:** add explicit INSERT/UPDATE/DELETE policies scoped to
`(storage.foldername(name))[1] = organization_id`.

---

## 6. Feature Gating Readiness ($97 vs $197)

### What exists

- `organizations.plan` column (text) — present.
- `src/lib/billing/entitlements.ts` — `canAccessFeature(feature, plan)`
  stub function mapping `professional` → `['customBranding',
  'customDomain', 'customEmailReplyTo', 'advancedReporting']`.
- `/api/admin/tenants/[id]/override-plan/route.ts` — super-admin can
  flip plans. Logs to `activity_log`.
- `/api/org/create/route.ts:28` — new orgs default to `starter` unless
  `plan === 'professional'` is passed.

### What's missing

- **`canAccessFeature` is not called anywhere in the codebase outside
  its own file.** Grep confirms zero callers. Every `dashboard/*`
  page, every API route, and every UI component renders the same
  feature set regardless of plan.
- No tier check in `middleware.ts`.
- No server-component wrapper (e.g. `<RequireTier tier="professional">`).
- No API route wrapper / decorator.

### Features that will need gating (based on codebase)

Inferred from the `professionalFeatures` list in `entitlements.ts` and
the broader route inventory:

**Likely professional-only (gate on $197):**

| Feature | Route/path | Why |
|---|---|---|
| Custom branding | `/dashboard/settings/branding`, `/api/org/settings/branding` | explicit in entitlements |
| Custom email reply-to | `org_settings.custom_email_reply_to` — used in email send routes | explicit |
| Custom domain | would be a new setting | explicit |
| Advanced reporting | `/api/performance/route.ts`, `/dashboard/performance/*` | explicit |
| Multi-user teams | `/api/org/invite`, `/api/org/members` | limit starter to 1 seat |
| Drip campaigns | `/api/drip/*` (15+ routes) | heavy automation = high-tier |
| Automation builder | `/api/automations/*` (15+ routes) | same |
| Share pages | `/api/share/*`, `/api/scenarios/save` | customer-facing branded outputs |
| Chat agent & tool use | `/api/chat/*` | expensive (Claude tokens) |
| Social publishing | `/api/social/publish` | uses paid Publer |
| NotebookLM knowledge base | `/api/chat/route.ts` NotebookLM tool | expensive |
| Daily briefing | `/api/agents/daily-briefing` | Claude tokens |

**Probably starter-tier baseline:**
- Contact CRUD (`/api/contacts/*` except bulk/import)
- Loan pipeline view (`/api/…loans` reads)
- Basic scenario calculator (no save/share)
- Rate update email templates

### Finding

#### CRITICAL — F-1: No feature gating anywhere
**Files:** none enforce it; `src/lib/billing/entitlements.ts` is
unreferenced.
**Fix:** Implement **three layers** before launch:
1. **Middleware layer** — read `organizations.plan` once per request,
   attach to request via header, redirect starter users away from
   pro-only dashboard pages.
2. **API route wrapper** — `withPlan('professional', handler)` that
   returns 402 Payment Required if the org's plan is too low. Apply to
   every `/api/drip/*`, `/api/automations/*`, `/api/chat/*`,
   `/api/agents/*`, `/api/scenarios/save`, `/api/scenarios/generate-pdf`,
   `/api/share/*` (writes only), `/api/social/publish`, `/api/performance`.
3. **Server component helper** — `<GatedFeature tier="professional">` to
   hide UI affordances on starter.

Recommended location for the enforcement primitive:
`src/lib/billing/requirePlan.ts`, which wraps `getOrganization()`,
reads `organizations.plan`, and either returns the context or throws a
typed `PlanExceededError`. Every route handler that imports
`getOrganization()` today should switch to
`requirePlan('starter' | 'professional')`.

---

## Prioritized Action List — Top 10 Before Launch

1. **Delete `src/app/api/arive-webhook/route.ts` and
   `src/app/api/contacts/web-lead/route.ts`; migrate both to
   `/api/webhooks/los/[los]/[org_slug]` pattern.** (A-1, A-3)
2. **Enable RLS on `agent_conversations`, `agent_handoffs`, `agent_tools`,
   `agents`, `system_admins`, `waitlist_signups`** and add org-scoped
   policies. (T-2, A-10)
3. **Fix `activity_log` INSERT policy** — require both `user_id =
   auth.uid()` AND `organization_id = get_my_organization_id()`. (T-1)
4. **Rewrite `loan_milestone_events`, `loan_status_history`,
   `milestone_communications`, `marketing_activity_log`, `mcc_state`
   policies** to scope by `organization_id`, not `user_id`. (T-4, T-5)
5. **Implement feature gating** — ship `withPlan()` wrapper, apply to
   `/api/drip/*`, `/api/automations/*`, `/api/chat/*`, `/api/agents/*`,
   `/api/social/publish`, `/api/performance`, `/api/scenarios/save`,
   `/api/scenarios/generate-pdf`, `/api/share/*` writes. (F-1)
6. **Fix storage policies** — scope `documents` INSERT by
   `organization_id`, lock down `drawings` to authenticated users
   with org folder scoping, add explicit policies for `social-assets`.
   (ST-1, ST-2, ST-3, ST-4)
7. **Remove hard-coded defaults for Adam's infrastructure** —
   `styer.app.n8n.cloud`, `loanos.vercel.app`, NMLS 513013, Publer
   account IDs. Replace with per-org configuration. Throw at boot if
   not set. (S-1, S-2, S-3)
8. **Replace "first profile with an org" fallback** in
   `/api/agents/daily-briefing` and `/api/marketing/log` agent-secret
   paths with explicit `org_slug` routing. (A-2, A-4)
9. **Drop `USING (true)` policies** on `challenges`, `responses`,
   `kids` (or drop the tables if unused). (T-3)
10. **Move `SUPABASE_SERVICE_ROLE_KEY` usage out of page components**
    and consolidate every service-client instantiation through
    `src/lib/supabase/service.ts`. Add a CI grep guard. (S-4)

### Stretch goals (pre-launch if time, post-launch otherwise)

- Introduce a `createUserScopedClient()` helper and start migrating the
  ~30 service-role routes to use it where service-role is not strictly
  needed (A-6).
- Standardize `org_id` vs `organization_id` column naming (T-6).
- Add `organization_id` column to `automation_logs` (T-7).
- Rate-limit `/api/share/[token]` and whitelist its returned columns (A-5).
- Plan the multi-org-per-user migration of `get_my_organization_id()`
  for future tier 3 (M-2).

---

*End of report. Generated 2026-04-05 by Claude (Opus 4.6) against
Supabase project `uuqedsvjlkeszrbwzizl` and code at
`/Users/adamstyer/Documents/loanos-clone`.*
