# Multi-Tenant Audit Remediation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all remaining multi-tenant isolation gaps identified in the Codex security audit — org-scope every query, enable RLS on unprotected tables, and add authentication to public routes.

**Architecture:** Each fix follows the established pattern: API routes call `getOrganization()` for org context and append `.eq('organization_id', organizationId)` to every Supabase query. Client pages use the `useOrg()` hook. New RLS policies use the existing `get_my_organization_id()` SQL function.

**Tech Stack:** Next.js 14 (App Router), Supabase (Postgres + RLS), TypeScript

---

## Audit Triage — Already Fixed (skip these)

The following items from the Codex audit have **already been remediated** in the current codebase:

| Audit Item | Status | Evidence |
|---|---|---|
| arive-webhook fallback | FIXED | Route deprecated; new multi-tenant route at `/api/webhooks/los/arive/[org_slug]` |
| daily-briefing first-org fallback | FIXED | Now requires `org_slug` query param, no fallback (line 38) |
| chat/route.ts session persistence | FIXED | `.eq('organization_id', organizationId)` on update (line 460) and insert (line 469) |
| chat/route.ts record-context lookups | FIXED | contacts/loans both include `.eq('organization_id', organizationId)` (lines 237, 185, 192) |
| chat/social draft reads | FIXED | `.eq('organization_id', organizationId)` on draft select (line 43) |
| social/publish route | FIXED | Uses `getOrganization()` and org-scoped queries |
| ActivityFeed.tsx | FIXED | Delegates to `/api/activity` which is server-side org-scoped |
| SendHistoryList.tsx | FIXED | Same — uses `/api/activity` endpoint |
| email/generate contact lookup (recordType=contact) | FIXED | `.eq('organization_id', organizationId)` on line 61 |
| email/generate loan lookup | FIXED | `.eq('organization_id', organizationId)` on line 75 |
| drip_campaigns/drip_steps/drip_enrollments RLS | FIXED | Migration 072_drip_campaigns_rls.sql |
| loan_milestone_events RLS | FIXED | Migration 076_security_hardening.sql (line 103) |
| milestone_communications RLS | FIXED | Migration 076_security_hardening.sql (line 126) |
| Publer config hardcoded | FIXED | Now loads per-org config from social_settings |
| Default prompts/branding | MOSTLY FIXED | `getLoIdentity()` pattern used in send-email, generate-pdf |

---

## File Structure

**Files to modify:**

| File | Change |
|---|---|
| `src/app/api/agents/pa-extraction/route.ts` | Add org guard + scope loan update |
| `src/app/api/agents/cd-extraction/route.ts` | Add org guard + scope loan update |
| `src/app/api/automations/email/generate/route.ts` | Scope linked-contact lookup by org |
| `src/app/api/scenarios/generate-pdf/route.ts` | Replace user_id scoping with organization_id |
| `src/app/api/performance/route.ts` | Add org filter to GET |
| `src/app/api/settings/test-anthropic/route.ts` | Add auth guard |
| `src/app/api/settings/test-mailchimp/route.ts` | Add auth guard |
| `src/app/dashboard/contacts/page.tsx` | Add org filter to all queries |
| `src/app/dashboard/contacts/[id]/page.tsx` | Add org filter to all queries |
| `src/app/dashboard/contacts/by-name/[name]/page.tsx` | Add org filter |
| `src/app/dashboard/loans/page.tsx` | Add org filter to all queries |
| `src/app/dashboard/loans/[id]/page.tsx` | Add org filter to direct Supabase queries |
| `src/app/dashboard/referral/[referrerName]/page.tsx` | Add org filter |
| `src/components/GlobalSearch.tsx` | Add org filter |
| `src/components/dashboard/HotLeadsWidget.tsx` | Add org filter to dismiss update |

**Files to create:**

| File | Purpose |
|---|---|
| `supabase/migrations/082_social_outlook_rls.sql` | Enable RLS on social_drafts, social_activity, social_settings, outlook_tokens |

---

### Task 1: Org-scope PA and CD extraction routes

**Files:**
- Modify: `src/app/api/agents/pa-extraction/route.ts:64-67`
- Modify: `src/app/api/agents/cd-extraction/route.ts:70-73`

Both routes already look up `organizationId` from the loan record (line 46/49) but don't use it in the update query. The fix is to add `.eq('organization_id', organizationId)` to the update and to fail-closed when the loan has no org.

- [ ] **Step 1: Fix pa-extraction — add org guard and scope update**

In `src/app/api/agents/pa-extraction/route.ts`, after `const organizationId = loan?.organization_id ?? null` (line 46), add a fail-closed guard, then scope the update:

```typescript
// Line 46 — after organizationId resolution, add guard:
if (!organizationId) {
  console.error('[pa-extraction] Loan has no organization_id:', loan_id)
  return NextResponse.json({ error: 'Loan is not assigned to an organization' }, { status: 400 })
}
```

Then change the update at line 64-67 from:

```typescript
const { error: updateError } = await supabase
  .from('loans')
  .update(updates)
  .eq('id', loan_id)
```

to:

```typescript
const { error: updateError } = await supabase
  .from('loans')
  .update(updates)
  .eq('id', loan_id)
  .eq('organization_id', organizationId)
```

- [ ] **Step 2: Fix cd-extraction — same pattern**

In `src/app/api/agents/cd-extraction/route.ts`, add the same guard after line 49:

```typescript
if (!organizationId) {
  console.error('[cd-extraction] Loan has no organization_id:', loan_id)
  return NextResponse.json({ error: 'Loan is not assigned to an organization' }, { status: 400 })
}
```

Then change the update at line 70-73 from:

```typescript
const { error: updateError } = await supabase
  .from('loans')
  .update(updates)
  .eq('id', loan_id)
```

to:

```typescript
const { error: updateError } = await supabase
  .from('loans')
  .update(updates)
  .eq('id', loan_id)
  .eq('organization_id', organizationId)
```

- [ ] **Step 3: Verify build**

Run: `cd /Users/adamstyer/Documents/loanos-clone && npm run build`
Expected: Build passes with no type errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/agents/pa-extraction/route.ts src/app/api/agents/cd-extraction/route.ts
git commit -m "fix: scope pa/cd-extraction loan updates by organization_id

Adds fail-closed guard when loan has no org and scopes the update
query to prevent cross-tenant writes via service role.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 2: Org-scope linked-contact lookup in email generate

**Files:**
- Modify: `src/app/api/automations/email/generate/route.ts:86-91`

The contact and loan lookups for the primary record ARE org-scoped (lines 61, 75). But the secondary contact lookup when `recordType === 'loan'` at line 88 uses only `.eq('id', loan.contact_id)` without org scoping. Since the loan was already verified to belong to the org, the contact_id FK is trusted — but defense-in-depth says scope it anyway.

- [ ] **Step 1: Add org filter to linked contact lookup**

In `src/app/api/automations/email/generate/route.ts`, change lines 87-91 from:

```typescript
        const { data: contact } = await supabase
          .from('contacts')
          .select('first_name, last_name, email, phone')
          .eq('id', loan.contact_id)
          .single()
```

to:

```typescript
        const { data: contact } = await supabase
          .from('contacts')
          .select('first_name, last_name, email, phone')
          .eq('id', loan.contact_id)
          .eq('organization_id', organizationId)
          .single()
```

- [ ] **Step 2: Verify build**

Run: `cd /Users/adamstyer/Documents/loanos-clone && npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/app/api/automations/email/generate/route.ts
git commit -m "fix: scope linked-contact lookup by org in email generate

Defense-in-depth — the parent loan is already org-verified, but
the secondary contact lookup should also be org-scoped.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 3: Replace user_id scoping with organization_id in generate-pdf

**Files:**
- Modify: `src/app/api/scenarios/generate-pdf/route.ts:17-41`

Currently authenticates via `supabase.auth.getUser()` and scopes by `user_id`. This is insufficient for multi-tenant — should use `getOrganization()` and scope by `organization_id`.

- [ ] **Step 1: Switch to getOrganization() and scope by org**

At the top of the file, add the import:

```typescript
import { getOrganization } from '@/lib/getOrganization'
```

Replace the auth block (lines ~17-20) with:

```typescript
    const { organizationId, userId } = await getOrganization()
```

Wrap in try/catch if not already. Then change the scenarios query from:

```typescript
    const { data: scenario, error } = await serviceClient
      .from('scenarios')
      .select('*')
      .eq('id', scenarioId)
      .eq('user_id', user.id)
      .single()
```

to:

```typescript
    const { data: scenario, error } = await serviceClient
      .from('scenarios')
      .select('*')
      .eq('id', scenarioId)
      .eq('organization_id', organizationId)
      .single()
```

And change the user_settings query from:

```typescript
    const { data: settingsRows } = await serviceClient
      .from('user_settings')
      .select('key, value')
      .eq('user_id', user.id)
```

to:

```typescript
    const { data: settingsRows } = await serviceClient
      .from('user_settings')
      .select('key, value')
      .eq('user_id', userId)
```

(user_settings is genuinely per-user, so `userId` from getOrganization is correct here)

- [ ] **Step 2: Verify build**

Run: `cd /Users/adamstyer/Documents/loanos-clone && npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/app/api/scenarios/generate-pdf/route.ts
git commit -m "fix: scope generate-pdf by organization_id instead of user_id

Switches from raw auth.getUser() to getOrganization() and scopes
the scenario lookup by org, not just user.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 4: Add org filter to performance GET

**Files:**
- Modify: `src/app/api/performance/route.ts:6-15`

The GET handler authenticates but queries performance_data by year only — no user or org filter. The POST already resolves the profile's organization_id. Apply the same pattern to GET.

- [ ] **Step 1: Add org filter to GET**

Replace the GET handler:

```typescript
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) return NextResponse.json({ error: 'No organization' }, { status: 400 })

  const { data, error } = await supabase
    .from('performance_data')
    .select('data')
    .eq('year', YEAR)
    .eq('organization_id', profile.organization_id)
    .single()

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: data?.data ?? null })
}
```

- [ ] **Step 2: Verify build**

Run: `cd /Users/adamstyer/Documents/loanos-clone && npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/app/api/performance/route.ts
git commit -m "fix: scope performance GET by organization_id

Prevents cross-tenant performance data reads.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 5: Add auth guards to test-anthropic and test-mailchimp

**Files:**
- Modify: `src/app/api/settings/test-anthropic/route.ts`
- Modify: `src/app/api/settings/test-mailchimp/route.ts`

These routes accept API keys from the request body and proxy them to external services with zero authentication. Any unauthenticated caller can use LoanOS as a credential-validation proxy.

- [ ] **Step 1: Add auth guard to test-anthropic**

Add import and auth check at the top of the POST handler:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  const { api_key } = await req.json()
  // ... rest unchanged
```

- [ ] **Step 2: Add auth guard to test-mailchimp**

Same pattern:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  const { api_key, server_prefix } = await req.json()
  // ... rest unchanged
```

- [ ] **Step 3: Verify build**

Run: `cd /Users/adamstyer/Documents/loanos-clone && npm run build`

- [ ] **Step 4: Commit**

```bash
git add src/app/api/settings/test-anthropic/route.ts src/app/api/settings/test-mailchimp/route.ts
git commit -m "fix: require authentication on credential test endpoints

These routes were unauthenticated proxies for validating external
API keys. Now require a logged-in Supabase user.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 6: Enable RLS on social and outlook tables

**Files:**
- Create: `supabase/migrations/082_social_outlook_rls.sql`

Four tables still have no RLS enabled: `social_drafts`, `social_activity`, `social_settings`, `outlook_tokens`. All have `organization_id` columns. Follow the pattern from `076_security_hardening.sql`.

- [ ] **Step 1: Create the migration**

Create `supabase/migrations/082_social_outlook_rls.sql`:

```sql
-- 082_social_outlook_rls.sql
-- Enable RLS on social tables and outlook_tokens.
-- Fixes audit finding: these tables had no RLS, allowing cross-tenant
-- reads/writes when using the browser Supabase client.

-- ============================================================================
-- social_drafts — org-scoped CRUD
-- ============================================================================
ALTER TABLE public.social_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members read social_drafts" ON public.social_drafts
  FOR SELECT USING (organization_id = get_my_organization_id());

CREATE POLICY "Org members insert social_drafts" ON public.social_drafts
  FOR INSERT WITH CHECK (organization_id = get_my_organization_id());

CREATE POLICY "Org members update social_drafts" ON public.social_drafts
  FOR UPDATE USING (organization_id = get_my_organization_id())
  WITH CHECK (organization_id = get_my_organization_id());

CREATE POLICY "Org members delete social_drafts" ON public.social_drafts
  FOR DELETE USING (organization_id = get_my_organization_id());

-- ============================================================================
-- social_activity — org-scoped read + insert
-- ============================================================================
ALTER TABLE public.social_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members read social_activity" ON public.social_activity
  FOR SELECT USING (organization_id = get_my_organization_id());

CREATE POLICY "Org members insert social_activity" ON public.social_activity
  FOR INSERT WITH CHECK (organization_id = get_my_organization_id());

-- ============================================================================
-- social_settings — org-scoped CRUD
-- ============================================================================
ALTER TABLE public.social_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members read social_settings" ON public.social_settings
  FOR SELECT USING (organization_id = get_my_organization_id());

CREATE POLICY "Org members insert social_settings" ON public.social_settings
  FOR INSERT WITH CHECK (organization_id = get_my_organization_id());

CREATE POLICY "Org members update social_settings" ON public.social_settings
  FOR UPDATE USING (organization_id = get_my_organization_id())
  WITH CHECK (organization_id = get_my_organization_id());

-- ============================================================================
-- outlook_tokens — user-scoped (each user has their own OAuth token)
-- ============================================================================
ALTER TABLE public.outlook_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own outlook_tokens" ON public.outlook_tokens
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users insert own outlook_tokens" ON public.outlook_tokens
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own outlook_tokens" ON public.outlook_tokens
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own outlook_tokens" ON public.outlook_tokens
  FOR DELETE USING (user_id = auth.uid());
```

- [ ] **Step 2: Apply migration to Supabase**

Use the Supabase MCP to apply the migration:

```
apply_migration with name "082_social_outlook_rls" and the SQL above
```

- [ ] **Step 3: Verify no existing queries break**

Run: `cd /Users/adamstyer/Documents/loanos-clone && npm run build`

The social routes already use `createServiceClient()` (service role bypasses RLS), so server-side routes won't break. Client-side social pages will now be properly restricted.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/082_social_outlook_rls.sql
git commit -m "fix: enable RLS on social_drafts, social_activity, social_settings, outlook_tokens

These four tables had no RLS policies, allowing unrestricted
access from the browser Supabase client. Now org/user-scoped.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 7: Org-scope GlobalSearch

**Files:**
- Modify: `src/components/GlobalSearch.tsx:60-84`

The search queries contacts and loans without any org filter. Since this is a `'use client'` component, use the `useOrg()` hook.

- [ ] **Step 1: Add org filter to search queries**

Add the import at the top of the file:

```typescript
import { useOrg } from '@/components/OrgProvider'
```

Inside the component function, add:

```typescript
const { organizationId } = useOrg()
```

Then update the search callback (lines 69-80) to add org filters:

```typescript
    const [{ data: contacts }, { data: loans }] = await Promise.all([
      supabase
        .from('contacts')
        .select('id, first_name, last_name, email, stage, contact_type')
        .eq('organization_id', organizationId)
        .or(`first_name.ilike.%${t}%,last_name.ilike.%${t}%,email.ilike.%${t}%`)
        .limit(5),
      supabase
        .from('loans')
        .select('id, borrower_name, loan_name, status, loan_amount')
        .eq('organization_id', organizationId)
        .or(`borrower_name.ilike.%${t}%,loan_name.ilike.%${t}%`)
        .limit(5),
    ])
```

Also update the useCallback dependency array to include `organizationId`.

- [ ] **Step 2: Verify build**

Run: `cd /Users/adamstyer/Documents/loanos-clone && npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/components/GlobalSearch.tsx
git commit -m "fix: scope GlobalSearch contacts/loans queries by organization_id

Prevents cross-tenant data leakage in search results.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 8: Org-scope contacts list page

**Files:**
- Modify: `src/app/dashboard/contacts/page.tsx`

This page has many Supabase queries for counting and listing contacts — none include organization_id. The component uses `'use client'` so use `useOrg()`.

- [ ] **Step 1: Add useOrg import and hook call**

At the top of the component file, add:

```typescript
import { useOrg } from '@/components/OrgProvider'
```

Inside the component function, add:

```typescript
const { organizationId } = useOrg()
```

- [ ] **Step 2: Add .eq('organization_id', organizationId) to every contacts query**

Every `supabase.from('contacts')` query in the file needs `.eq('organization_id', organizationId)` added. This includes:

1. `fetchCounts()` — all 13+ count queries
2. `fetchContacts()` / `buildContactQuery()` — the main list query
3. `loadMoreContacts()` — pagination query
4. Any update/delete operations (bulk stage update, delete, etc.)

The pattern for each query: add `.eq('organization_id', organizationId)` immediately after `.from('contacts')`.

Also update all relevant `useCallback` dependency arrays to include `organizationId`.

- [ ] **Step 3: Verify build**

Run: `cd /Users/adamstyer/Documents/loanos-clone && npm run build`

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/contacts/page.tsx
git commit -m "fix: scope all contacts list queries by organization_id

Adds org filter to every count, list, update, and delete query
on the main contacts page.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 9: Org-scope loans list page

**Files:**
- Modify: `src/app/dashboard/loans/page.tsx`

Same pattern as contacts — all count and list queries need org scoping.

- [ ] **Step 1: Add useOrg import and hook call**

```typescript
import { useOrg } from '@/components/OrgProvider'
// inside component:
const { organizationId } = useOrg()
```

- [ ] **Step 2: Add org filter to every loans query**

Every `supabase.from('loans')` query needs `.eq('organization_id', organizationId)`. This includes:
- Count queries for each status bucket
- SMART_LISTS queries
- Main loan list fetch
- Update/delete operations
- Activity log queries related to loans

Update all `useCallback` dependency arrays to include `organizationId`.

- [ ] **Step 3: Verify build**

Run: `cd /Users/adamstyer/Documents/loanos-clone && npm run build`

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/loans/page.tsx
git commit -m "fix: scope all loans list queries by organization_id

Adds org filter to every count, list, update, and delete query
on the main loans page.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 10: Org-scope contact detail page

**Files:**
- Modify: `src/app/dashboard/contacts/[id]/page.tsx`

All direct Supabase queries on this page lack org scoping: `fetchContact`, `fetchLoans`, `fetchCoBorrowerLoans`, `fetchReferredLoans`.

- [ ] **Step 1: Add useOrg and scope all queries**

Add `useOrg()` hook, then add `.eq('organization_id', organizationId)` to:

1. `fetchContact()` — line 33: add after `.eq('id', id)`
2. `fetchLoans()` — line 43: add after `.eq('contact_id', id)`
3. `fetchCoBorrowerLoans()` — line 53: add after `.eq('co_borrower_contact_id', id)`
4. `fetchReferredLoans()` — add org filter to the query builder
5. Any note save, stage update, or other mutation queries

Update all `useCallback` dependency arrays.

- [ ] **Step 2: Verify build**

Run: `cd /Users/adamstyer/Documents/loanos-clone && npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/contacts/[id]/page.tsx
git commit -m "fix: scope contact detail queries by organization_id

Adds org filter to contact fetch, loans, co-borrower loans,
referred loans, and all mutations.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 11: Org-scope loan detail page

**Files:**
- Modify: `src/app/dashboard/loans/[id]/page.tsx`

The `fetchAll` function queries loans, documents, email_drafts, and contact_emails by loanId only. Activity is fetched via the org-scoped `/api/activity` endpoint (safe), but the direct Supabase queries need org filters.

- [ ] **Step 1: Add useOrg and scope direct queries**

Add `useOrg()` hook, then add `.eq('organization_id', organizationId)` to:

1. Loan fetch — line 420: `supabase.from('loans').select('*').eq('id', loanId)` → add org filter
2. Documents fetch — line 421: add org filter
3. Email drafts fetch — line 423: add org filter
4. Contact emails fetch — line 424: add org filter (if the table has organization_id)
5. Contact fetch — line 432: add org filter
6. Any delete/update operations later in the file

Update `useCallback` dependency arrays.

- [ ] **Step 2: Verify build**

Run: `cd /Users/adamstyer/Documents/loanos-clone && npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/loans/[id]/page.tsx
git commit -m "fix: scope loan detail queries by organization_id

Adds org filter to loan, documents, email_drafts, contact_emails,
and contact queries on the loan detail page.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 12: Org-scope remaining client components

**Files:**
- Modify: `src/app/dashboard/contacts/by-name/[name]/page.tsx:25-28`
- Modify: `src/app/dashboard/referral/[referrerName]/page.tsx:92-107`
- Modify: `src/components/dashboard/HotLeadsWidget.tsx:33-37`

- [ ] **Step 1: Fix by-name page**

Add `useOrg()` and add `.eq('organization_id', organizationId)` to the contacts query at line 25:

```typescript
let q = supabase.from('contacts').select('id, first_name, last_name').eq('organization_id', organizationId)
```

- [ ] **Step 2: Fix referral page**

Add `useOrg()` and add org filter to both queries:
- Referrer lookup (line 92): add `.eq('organization_id', organizationId)`
- Referred contacts query (line 103): add `.eq('organization_id', organizationId)`
- Any loans queries on this page: add `.eq('organization_id', organizationId)`

- [ ] **Step 3: Fix HotLeadsWidget dismiss**

Add `useOrg()` and scope the dismiss update at line 33:

```typescript
    await supabase
      .from('contacts')
      .update({ hot_lead_dismissed: true } as any)
      .eq('id', id)
      .eq('organization_id', organizationId)
```

- [ ] **Step 4: Verify build**

Run: `cd /Users/adamstyer/Documents/loanos-clone && npm run build`

- [ ] **Step 5: Commit**

```bash
git add src/app/dashboard/contacts/by-name/[name]/page.tsx src/app/dashboard/referral/[referrerName]/page.tsx src/components/dashboard/HotLeadsWidget.tsx
git commit -m "fix: scope by-name, referral, and HotLeads queries by organization_id

Adds org filter to remaining client components that query
contacts/loans without org scoping.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 13: Final build verification and push

- [ ] **Step 1: Full build**

Run: `cd /Users/adamstyer/Documents/loanos-clone && npm run build`
Expected: Clean build, no errors.

- [ ] **Step 2: Push and verify deployment**

```bash
cd /Users/adamstyer/Documents/loanos-clone && git push
```

Then use Vercel MCP to verify deployment reaches `state: READY`.

- [ ] **Step 3: Apply RLS migration to Supabase**

Use Supabase MCP `apply_migration` to run `082_social_outlook_rls.sql` against the production database.

- [ ] **Step 4: Verify RLS is active**

Use Supabase MCP `execute_sql` to confirm:

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('social_drafts', 'social_activity', 'social_settings', 'outlook_tokens');
```

Expected: All four show `rowsecurity = true`.
