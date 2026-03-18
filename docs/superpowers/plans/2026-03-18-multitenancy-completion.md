# Multi-Tenancy Completion Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete LoanOS multi-tenancy so all data is org-scoped — enabling Adam to add Janie (or other LOs) to his org with proper data sharing and role-based access control.

**Architecture:** Supabase RLS enforces isolation at the DB layer using `organization_id` columns and the existing `get_my_organization_id()` helper. Server-side code calls `getOrganization()` instead of `getUser()` to get org context. A lightweight React context (`OrgProvider`) propagates org context to client components that need it for inserts.

**Tech Stack:** Next.js 14 App Router, Supabase (PostgreSQL + RLS), TypeScript, Vitest for unit tests, Supabase MCP for migration execution.

**Prerequisites (already done):**
- Migrations 029–031: `organizations`, `profiles` tables, `organization_id` on loans/contacts/activity_log/todo_items, RLS policies, `get_my_organization_id()` / `get_my_role()` helper functions, `getOrganization()` server utility

**Execution order:** Chunks must run in sequence — each depends on the previous.

---

## Chunk 1: Database — Add `org_id` to Remaining Tables

**Tables still missing `organization_id`:** `documents`, `email_drafts`, `scenarios`

**Tables intentionally kept per-user** (no org_id needed): `chat_sessions`, `outlook_tokens`, `user_settings`, `mcc_state`, `marketing_activity_log`, `loan_status_history` (accessed via loans join)

---

### Task 1: Write migration 032 — add `organization_id` columns

**Files:**
- Create: `supabase/migrations/032_org_id_documents_drafts_scenarios.sql`

- [ ] **Step 1: Write the migration**

```sql
-- ============================================================
-- Migration 032: Add organization_id to documents, email_drafts, scenarios
-- Idempotent: uses IF NOT EXISTS pattern
-- ============================================================

-- ─────────────────────────────────────────────────
-- DOCUMENTS
-- ─────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE documents ADD COLUMN organization_id UUID REFERENCES organizations(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS documents_organization_id_idx ON documents(organization_id);

-- ─────────────────────────────────────────────────
-- EMAIL_DRAFTS
-- ─────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'email_drafts' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE email_drafts ADD COLUMN organization_id UUID REFERENCES organizations(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS email_drafts_organization_id_idx ON email_drafts(organization_id);

-- ─────────────────────────────────────────────────
-- SCENARIOS
-- ─────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'scenarios' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN organization_id UUID REFERENCES organizations(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS scenarios_organization_id_idx ON scenarios(organization_id);
```

- [ ] **Step 2: Apply via Supabase MCP**

Use `mcp__e3151559__apply_migration` with project_id `uuqedsvjlkeszrbwzizl`, name `032_org_id_documents_drafts_scenarios`, and the SQL above.

- [ ] **Step 3: Verify columns exist**

Use `mcp__e3151559__execute_sql` to run:
```sql
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'organization_id'
  AND table_name IN ('documents', 'email_drafts', 'scenarios')
ORDER BY table_name;
```
Expected: 3 rows.

---

### Task 2: Write migration 033 — RLS policies for new org-scoped tables

**Files:**
- Create: `supabase/migrations/033_org_rls_documents_drafts_scenarios.sql`

- [ ] **Step 1: Write the migration**

```sql
-- ============================================================
-- Migration 033: Org-scoped RLS for documents, email_drafts, scenarios
-- Replaces single-user policies with org-scoped policies.
-- Depends on: 029 (get_my_organization_id, get_my_role)
--             032 (organization_id columns)
-- ============================================================

-- ============================================================
-- DOCUMENTS
-- ============================================================
DROP POLICY IF EXISTS "Users can only access their own documents" ON documents;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'documents' AND policyname = 'Org members can read documents'
  ) THEN
    CREATE POLICY "Org members can read documents"
      ON documents FOR SELECT
      USING (organization_id = get_my_organization_id());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'documents' AND policyname = 'Org members can insert documents'
  ) THEN
    CREATE POLICY "Org members can insert documents"
      ON documents FOR INSERT
      WITH CHECK (organization_id = get_my_organization_id());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'documents' AND policyname = 'Org members can update documents'
  ) THEN
    CREATE POLICY "Org members can update documents"
      ON documents FOR UPDATE
      USING (organization_id = get_my_organization_id())
      WITH CHECK (organization_id = get_my_organization_id());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'documents' AND policyname = 'Org owners and admins can delete documents'
  ) THEN
    CREATE POLICY "Org owners and admins can delete documents"
      ON documents FOR DELETE
      USING (
        organization_id = get_my_organization_id()
        AND get_my_role() IN ('owner', 'admin')
      );
  END IF;
END $$;


-- ============================================================
-- EMAIL_DRAFTS
-- ============================================================
DROP POLICY IF EXISTS "Users can only access their own email drafts" ON email_drafts;
DROP POLICY IF EXISTS "Users can manage their own email drafts" ON email_drafts;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'email_drafts' AND policyname = 'Org members can read email drafts'
  ) THEN
    CREATE POLICY "Org members can read email drafts"
      ON email_drafts FOR SELECT
      USING (organization_id = get_my_organization_id());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'email_drafts' AND policyname = 'Org members can insert email drafts'
  ) THEN
    CREATE POLICY "Org members can insert email drafts"
      ON email_drafts FOR INSERT
      WITH CHECK (organization_id = get_my_organization_id());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'email_drafts' AND policyname = 'Org members can update email drafts'
  ) THEN
    CREATE POLICY "Org members can update email drafts"
      ON email_drafts FOR UPDATE
      USING (organization_id = get_my_organization_id())
      WITH CHECK (organization_id = get_my_organization_id());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'email_drafts' AND policyname = 'Org owners and admins can delete email drafts'
  ) THEN
    CREATE POLICY "Org owners and admins can delete email drafts"
      ON email_drafts FOR DELETE
      USING (
        organization_id = get_my_organization_id()
        AND get_my_role() IN ('owner', 'admin')
      );
  END IF;
END $$;


-- ============================================================
-- SCENARIOS
-- ============================================================
DROP POLICY IF EXISTS "Users can manage their own scenarios" ON scenarios;
DROP POLICY IF EXISTS "Users can read own scenarios" ON scenarios;
DROP POLICY IF EXISTS "Users can insert own scenarios" ON scenarios;
DROP POLICY IF EXISTS "Users can update own scenarios" ON scenarios;
DROP POLICY IF EXISTS "Users can delete own scenarios" ON scenarios;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'scenarios' AND policyname = 'Org members can read scenarios'
  ) THEN
    CREATE POLICY "Org members can read scenarios"
      ON scenarios FOR SELECT
      USING (
        organization_id = get_my_organization_id()
        OR share_token IS NOT NULL  -- public share links remain readable
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'scenarios' AND policyname = 'Org members can insert scenarios'
  ) THEN
    CREATE POLICY "Org members can insert scenarios"
      ON scenarios FOR INSERT
      WITH CHECK (organization_id = get_my_organization_id());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'scenarios' AND policyname = 'Org members can update scenarios'
  ) THEN
    CREATE POLICY "Org members can update scenarios"
      ON scenarios FOR UPDATE
      USING (organization_id = get_my_organization_id())
      WITH CHECK (organization_id = get_my_organization_id());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'scenarios' AND policyname = 'Org owners and admins can delete scenarios'
  ) THEN
    CREATE POLICY "Org owners and admins can delete scenarios"
      ON scenarios FOR DELETE
      USING (
        organization_id = get_my_organization_id()
        AND get_my_role() IN ('owner', 'admin')
      );
  END IF;
END $$;
```

- [ ] **Step 2: Apply via Supabase MCP**

Use `mcp__e3151559__apply_migration` with name `033_org_rls_documents_drafts_scenarios`.

- [ ] **Step 3: Verify policies**

```sql
SELECT tablename, policyname
FROM pg_policies
WHERE tablename IN ('documents', 'email_drafts', 'scenarios')
ORDER BY tablename, policyname;
```
Expected: 4 policies per table (read/insert/update/delete), 12 rows total.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/032_org_id_documents_drafts_scenarios.sql
git add supabase/migrations/033_org_rls_documents_drafts_scenarios.sql
git commit -m "feat(db): add organization_id to documents, email_drafts, scenarios + org RLS"
```

---

### Task 3: Backfill existing data to Adam's org

**Context:** Existing rows in all tables have `organization_id = NULL`. They need to be backfilled to Adam's org ID so they don't disappear under the new RLS policies.

**Files:**
- Create: `supabase/migrations/034_backfill_org_id.sql`

- [ ] **Step 1: Find Adam's user UUID and org UUID**

```sql
-- Run these to get the IDs you'll need
SELECT id, email FROM auth.users ORDER BY created_at LIMIT 5;
SELECT id, name FROM organizations LIMIT 5;
SELECT id, organization_id, role FROM profiles LIMIT 5;
```

Note the values — you'll substitute them in step 2.

- [ ] **Step 2: Write backfill migration** (substitute real UUIDs for `<ADAM_USER_ID>` and `<ADAM_ORG_ID>`)

If Adam has no org yet, create one first:
```sql
-- Only run if profiles.organization_id IS NULL for Adam
INSERT INTO organizations (id, name, slug)
VALUES (gen_random_uuid(), 'Adam Styer | Mortgage Solutions LP', 'adam-styer-mslp')
ON CONFLICT DO NOTHING;

-- Then update Adam's profile
UPDATE profiles
SET organization_id = (SELECT id FROM organizations WHERE slug = 'adam-styer-mslp')
WHERE id = (SELECT id FROM auth.users WHERE email = 'adam@styermortgage.com');
-- (substitute Adam's actual email)
```

Then backfill all tables:
```sql
-- Set org ID for all of Adam's existing records
DO $$
DECLARE
  v_user_id UUID := '<ADAM_USER_ID>';
  v_org_id  UUID := '<ADAM_ORG_ID>';
BEGIN
  UPDATE loans        SET organization_id = v_org_id WHERE user_id = v_user_id AND organization_id IS NULL;
  UPDATE contacts     SET organization_id = v_org_id WHERE user_id = v_user_id AND organization_id IS NULL;
  UPDATE activity_log SET organization_id = v_org_id WHERE user_id = v_user_id AND organization_id IS NULL;
  UPDATE todo_items   SET organization_id = v_org_id WHERE user_id = v_user_id AND organization_id IS NULL;
  UPDATE documents    SET organization_id = v_org_id WHERE user_id = v_user_id AND organization_id IS NULL;
  UPDATE email_drafts SET organization_id = v_org_id WHERE user_id = v_user_id AND organization_id IS NULL;
  UPDATE scenarios    SET organization_id = v_org_id WHERE user_id = v_user_id AND organization_id IS NULL;
END $$;
```

- [ ] **Step 3: Run via Supabase MCP `execute_sql`**

Run the backfill directly (not as a tracked migration — it's a one-time data operation).

- [ ] **Step 4: Verify no NULLs remain on core tables**

```sql
SELECT
  'loans'        AS tbl, COUNT(*) FILTER (WHERE organization_id IS NULL) AS nulls FROM loans
UNION ALL SELECT 'contacts',    COUNT(*) FILTER (WHERE organization_id IS NULL) FROM contacts
UNION ALL SELECT 'activity_log',COUNT(*) FILTER (WHERE organization_id IS NULL) FROM activity_log
UNION ALL SELECT 'todo_items',  COUNT(*) FILTER (WHERE organization_id IS NULL) FROM todo_items
UNION ALL SELECT 'documents',   COUNT(*) FILTER (WHERE organization_id IS NULL) FROM documents
UNION ALL SELECT 'email_drafts',COUNT(*) FILTER (WHERE organization_id IS NULL) FROM email_drafts
UNION ALL SELECT 'scenarios',   COUNT(*) FILTER (WHERE organization_id IS NULL) FROM scenarios;
```
Expected: all nulls = 0.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/034_backfill_org_id.sql
git commit -m "feat(db): backfill organization_id for existing production data"
```

---

## Chunk 2: Org Context Infrastructure

The application needs a clean way to get org context in both server and client contexts.

---

### Task 4: `/api/me` route — org context for client components

**Files:**
- Create: `src/app/api/me/route.ts`

- [ ] **Step 1: Write the route**

```typescript
// src/app/api/me/route.ts
import { NextResponse } from 'next/server'
import { getOrganization } from '@/lib/getOrganization'

export async function GET() {
  try {
    const ctx = await getOrganization()
    return NextResponse.json(ctx)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
```

- [ ] **Step 2: Test it manually**

Start dev server. Log in. Fetch `/api/me` in browser console:
```js
fetch('/api/me').then(r => r.json()).then(console.log)
```
Expected: `{ organizationId: "...", role: "owner", userId: "..." }`

---

### Task 5: `OrgProvider` + `useOrg` hook

Client components that need to INSERT data (todos, contacts, etc.) need `organizationId`. Provide it via React context fetched once at dashboard layout level.

**Files:**
- Create: `src/components/OrgProvider.tsx`
- Create: `src/hooks/useOrg.ts`

- [ ] **Step 1: Write `OrgProvider`**

```typescript
// src/components/OrgProvider.tsx
'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface OrgContext {
  organizationId: string | null
  role: 'owner' | 'admin' | 'member' | null
  userId: string | null
  loading: boolean
}

const Ctx = createContext<OrgContext>({ organizationId: null, role: null, userId: null, loading: true })

export function OrgProvider({ children }: { children: ReactNode }) {
  const [ctx, setCtx] = useState<OrgContext>({ organizationId: null, role: null, userId: null, loading: true })

  useEffect(() => {
    fetch('/api/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setCtx({ organizationId: data.organizationId, role: data.role, userId: data.userId, loading: false })
        } else {
          setCtx(prev => ({ ...prev, loading: false }))
        }
      })
      .catch(() => setCtx(prev => ({ ...prev, loading: false })))
  }, [])

  return <Ctx.Provider value={ctx}>{children}</Ctx.Provider>
}

export function useOrg() {
  return useContext(Ctx)
}
```

- [ ] **Step 2: Write `useOrg` hook (re-export for clean imports)**

```typescript
// src/hooks/useOrg.ts
export { useOrg } from '@/components/OrgProvider'
```

---

### Task 6: Wrap dashboard layout with `OrgProvider`

**Files:**
- Modify: `src/app/dashboard/layout.tsx`

- [ ] **Step 1: Read current file**

Read `src/app/dashboard/layout.tsx` to see the current structure.

- [ ] **Step 2: Add OrgProvider**

Import `OrgProvider` and wrap the layout children:

```typescript
import { OrgProvider } from '@/components/OrgProvider'

// Inside the return:
return (
  <OrgProvider>
    {/* existing layout content */}
  </OrgProvider>
)
```

---

### Task 7: Middleware — redirect to `/onboarding` if user has no profile

**Files:**
- Modify: `src/middleware.ts`
- Create: `src/app/onboarding/page.tsx` (stub — full version in Chunk 5)

- [ ] **Step 1: Write onboarding page stub**

```typescript
// src/app/onboarding/page.tsx
export default function OnboardingPage() {
  return (
    <main style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', fontFamily: "'IBM Plex Mono', monospace" }}>
      <div style={{ textAlign: 'center', color: 'var(--text)' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Setting up your account…</h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>Contact Adam to be added to an organization.</p>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Update middleware to check for profile**

The middleware runs on every request. Add a check: if user is logged in but has no profile row, redirect to `/onboarding`.

Read `src/middleware.ts` first to see the `updateSession` import. The profile check should happen AFTER session update, using the service client (to bypass RLS).

```typescript
// src/middleware.ts
import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const response = await updateSession(request)

  // Skip profile check for non-dashboard routes and onboarding itself
  const { pathname } = request.nextUrl
  const isDashboard = pathname.startsWith('/dashboard')
  if (!isDashboard) return response

  // Check that logged-in user has a profile (org assignment)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll() {},
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return response  // middleware already handles redirect to login

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) {
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/agents/.*|api/marketing/log-social-post|onboarding).*)',
  ],
}
```

- [ ] **Step 3: Verify locally**

Log in as test user. Confirm dashboard still loads (profile exists). Create a test auth.user with no profile row and verify it redirects to `/onboarding`.

- [ ] **Step 4: Commit Chunk 2**

```bash
git add src/app/api/me/route.ts src/components/OrgProvider.tsx src/hooks/useOrg.ts
git add src/app/dashboard/layout.tsx src/middleware.ts src/app/onboarding/page.tsx
git commit -m "feat(auth): org context provider, /api/me route, onboarding redirect middleware"
```

---

## Chunk 3: API Routes — Wire `organization_id` into All Writes

**Pattern:** Every API route that inserts or queries by `user_id` needs to:
1. Replace `supabase.auth.getUser()` with `getOrganization()`
2. Add `organization_id` to INSERT payloads
3. Remove `.eq('user_id', user.id)` from SELECT queries (RLS handles it)
4. Keep `.eq('user_id', userId)` on DELETE/UPDATE when you need to verify ownership

---

### Task 8: Update `todos` routes

**Files:**
- Modify: `src/app/api/todos/route.ts`
- Modify: `src/app/api/todos/[id]/route.ts`

- [ ] **Step 1: Update `todos/route.ts`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { getOrganization } from '@/lib/getOrganization'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { organizationId } = await getOrganization()
    const supabase = createClient()

    const { data, error } = await supabase
      .from('todo_items')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_complete', false)
      .order('is_urgent', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(req: Request) {
  try {
    const { organizationId, userId } = await getOrganization()
    const supabase = createClient()
    const body = await req.json()

    const { data, error } = await supabase
      .from('todo_items')
      .insert({ ...body, user_id: userId, organization_id: organizationId })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
```

- [ ] **Step 2: Read and update `todos/[id]/route.ts`**

Read the file first, then apply same pattern (replace getUser → getOrganization, keep user_id on UPDATE/DELETE ownership checks).

---

### Task 9: Update `contacts` routes

**Files:**
- Modify: `src/app/api/contacts/quick-add/route.ts`
- Modify: `src/app/api/contacts/bulk-action/route.ts`
- Modify: `src/app/api/contacts/[id]/activity/route.ts`

- [ ] **Step 1: Read each file, then apply pattern**

For `quick-add/route.ts`, the INSERT needs `organization_id`:
```typescript
const { organizationId, userId } = await getOrganization()
// ...
await supabase.from('contacts').insert({
  ...body,
  user_id: userId,
  organization_id: organizationId,
})
```

For `bulk-action/route.ts`, the SELECT + UPDATE/DELETE should scope by `organization_id`:
```typescript
const { organizationId } = await getOrganization()
// SELECT: .eq('organization_id', organizationId)
// UPDATE: .eq('organization_id', organizationId)
// DELETE: .eq('organization_id', organizationId)
```

For `[id]/activity/route.ts`, SELECT queries should remove user_id filter (RLS handles it).

---

### Task 10: Update `email-drafts` route

**Files:**
- Modify: `src/app/api/email-drafts/route.ts`

- [ ] **Step 1: Read file, apply pattern**

INSERT adds `organization_id`. SELECT removes `user_id` filter. Note: this route is also called by n8n using service role — the service role bypasses RLS, so n8n writes still work. n8n will need to pass `organization_id` in the payload (see Chunk 5).

---

### Task 11: Update `scenarios/save` route

**Files:**
- Modify: `src/app/api/scenarios/save/route.ts`

- [ ] **Step 1: Update**

```typescript
import { getOrganization } from '@/lib/getOrganization'

export async function POST(req: NextRequest) {
  try {
    const { organizationId, userId } = await getOrganization()
    const supabase = createClient()
    const body = await req.json()
    // ...existing field destructuring...

    const record = {
      user_id: userId,
      organization_id: organizationId,  // ADD THIS
      // ...existing fields...
    }

    if (id) {
      const { data, error } = await supabase
        .from('scenarios')
        .update(record)
        .eq('id', id)
        .eq('organization_id', organizationId)  // scope to org, not just user
        .select('id, share_token')
        .single()
      // ...
    }
    // ...
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
```

---

### Task 12: Update `chat` route

**Files:**
- Modify: `src/app/api/chat/route.ts`

- [ ] **Step 1: Read file, apply pattern**

Chat sessions are per-user (intentionally). Only change needed: wrap the `getUser` call in a try/catch returning 401, consistent with other routes. No org_id needed on chat_sessions.

---

### Task 13: Update `pipeline/stats` route

**Files:**
- Modify: `src/app/api/pipeline/stats/route.ts`

- [ ] **Step 1: Read file, apply pattern**

Replace `getUser()` + `.eq('user_id')` with `getOrganization()`. Stats should be org-wide.

---

### Task 14: Update `arive-webhook` route

**Context:** The Arive webhook is called by n8n using the service role key (bypasses RLS). It needs to stamp `organization_id` on the loan/contact rows it upserts. For now (single org), look up the org by the `user_id` in the payload.

**Files:**
- Modify: `src/app/api/arive-webhook/route.ts`

- [ ] **Step 1: Read current file to see the upsert pattern**

- [ ] **Step 2: Add org lookup + stamp**

After extracting `user_id` from the webhook payload, look up their `organization_id` from profiles:
```typescript
const serviceClient = createServiceClient()

// Look up org for this user
const { data: profile } = await serviceClient
  .from('profiles')
  .select('organization_id')
  .eq('id', userId)
  .single()

const organizationId = profile?.organization_id
if (!organizationId) {
  console.error('[arive-webhook] No org for user', userId)
  return NextResponse.json({ error: 'User has no organization' }, { status: 400 })
}

// Then add organization_id to all upserts:
// contacts upsert: { ...contactData, organization_id: organizationId }
// loans upsert:    { ...loanData,    organization_id: organizationId }
```

---

### Task 15: Update agent routes

**Files:**
- Modify: `src/app/api/agents/cd-extraction/route.ts`
- Modify: `src/app/api/agents/pa-extraction/route.ts`
- Modify: `src/app/api/agents/milestone/route.ts`
- Modify: `src/app/api/agents/daily-briefing/route.ts`

- [ ] **Step 1: Read each file**

Agent routes use the service client (bypasses RLS). They receive a `loan_id` in the payload. Look up the `organization_id` from the loan record itself:
```typescript
const { data: loan } = await serviceClient
  .from('loans')
  .select('organization_id, user_id')
  .eq('id', loanId)
  .single()

// Pass organization_id to any inserts (activity_log, email_drafts, etc.)
```

---

### Task 16: Update remaining routes

**Files:**
- Modify: `src/app/api/outreach/route.ts`
- Modify: `src/app/api/import/loans/route.ts`
- Modify: `src/app/api/import/contacts/route.ts`
- Modify: `src/app/api/marketing/generate-newsletter/route.ts`
- Modify: `src/app/api/marketing/publish-newsletter/route.ts`
- Modify: `src/app/api/marketing/send-mailchimp/route.ts`

- [ ] **Step 1: Read each, apply same pattern**

Import routes need `organization_id` on every inserted row. Marketing routes are per-user by design (mcc_state is per-user) — only `getOrganization()` for auth, no org_id stamping needed on mcc_state.

- [ ] **Step 2: Build check**

```bash
cd /Users/adamstyer/Documents/loanos-clone && npm run build
```
Expected: 0 errors. Fix any TypeScript errors before proceeding.

- [ ] **Step 3: Commit Chunk 3**

```bash
git add src/app/api/
git commit -m "feat(api): wire organization_id into all API route inserts + queries"
```

---

## Chunk 4: Server Components — Pages

Server component pages (those without `'use client'`) currently call `supabase.auth.getUser()` and filter with `.eq('user_id', user.id)`. Replace with `getOrganization()` + let RLS handle scoping.

**Pattern for all server pages:**
```typescript
// Before:
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect('/auth/login')
const { data } = await supabase.from('loans').select('*').eq('user_id', user.id)

// After:
import { getOrganization } from '@/lib/getOrganization'
// ...
try {
  const { organizationId } = await getOrganization()
  const supabase = createClient()
  const { data } = await supabase.from('loans').select('*')
  // RLS automatically scopes to org — no .eq() needed
} catch {
  redirect('/')
}
```

---

### Task 17: Update `dashboard/page.tsx`

**Files:**
- Modify: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Replace auth pattern**

Remove `supabase.auth.getUser()`. Import and call `getOrganization()`. Remove `.eq('user_id', user.id)` from all queries. The RLS from migration 031 will scope loans to the org automatically.

- [ ] **Step 2: Verify build passes**

```bash
npm run build 2>&1 | grep -E 'error|Error'
```

---

### Task 18: Update loan detail page

**Files:**
- Modify: `src/app/dashboard/loans/[id]/page.tsx`

- [ ] **Step 1: Read file, apply pattern**

Replace `getUser()` with `getOrganization()`. Remove `user_id` filters. Verify the loan `id` param is still used in the query.

---

### Task 19: Update contact detail page

**Files:**
- Modify: `src/app/dashboard/contacts/[id]/page.tsx`
- Modify: `src/app/dashboard/contacts/by-name/[name]/page.tsx`

Same pattern — replace getUser with getOrganization, remove user_id filters.

---

### Task 20: Update scenarios pages

**Files:**
- Modify: `src/app/dashboard/scenarios/page.tsx`
- Modify: `src/app/dashboard/scenarios/[id]/page.tsx`
- Modify: `src/app/dashboard/scenarios/new/page.tsx`

Same pattern. For scenarios/new, loan_id lookups should be org-scoped.

---

### Task 21: Update remaining server pages

**Files:**
- Modify: `src/app/dashboard/reports/commission/page.tsx`
- Modify: `src/app/dashboard/reports/volume/page.tsx`
- Modify: `src/app/dashboard/referral/[referrerName]/page.tsx`
- Modify: `src/app/dashboard/briefing/page.tsx`
- Modify: `src/app/dashboard/emails/unmatched/page.tsx`
- Modify: `src/app/dashboard/performance/page.tsx`

Same pattern on each.

---

### Task 22: Fix client component queries

Client components use the browser Supabase client and currently filter with `.eq('user_id', user.id)`. After migration 031, the RLS handles org scoping automatically. Client components need:
1. **SELECTs**: Remove `.eq('user_id', ...)` — RLS returns all org rows
2. **INSERTs**: Add `organization_id` from `useOrg()` hook

**Files:**
- Modify: `src/app/dashboard/loans/page.tsx`
- Modify: `src/app/dashboard/contacts/page.tsx`
- Modify: `src/app/dashboard/scenarios/ScenarioList.tsx`
- Modify: `src/components/ActivityFeed.tsx`
- Modify: `src/components/GlobalSearch.tsx`
- Modify: `src/components/SmartActionQueue.tsx`

- [ ] **Step 1: Grep for user_id in client component files**

```bash
grep -n "user_id" src/app/dashboard/loans/page.tsx src/app/dashboard/contacts/page.tsx src/components/ActivityFeed.tsx
```

- [ ] **Step 2: For each file — remove user_id from SELECT, add org_id to INSERT**

For INSERT in client components, use `useOrg()`:
```typescript
const { organizationId, userId } = useOrg()
// ...
await supabase.from('contacts').insert({
  ...data,
  user_id: userId,
  organization_id: organizationId,
})
```

- [ ] **Step 3: Build + verify**

```bash
npm run build
```
Expected: 0 TypeScript errors.

- [ ] **Step 4: Commit Chunk 4**

```bash
git add src/app/dashboard/
git add src/components/
git commit -m "feat(app): wire org context into all server pages and client components"
```

---

## Chunk 5: Onboarding Flow + Org Admin UI

---

### Task 23: Full onboarding page — create org + profile

When a new user signs in and has no profile, they land at `/onboarding`. This page lets them either (a) create a new org or (b) wait to be invited.

For Adam's use case: Phase 1 is just "create org" (Adam does it once). Invite flow is Phase 2.

**Files:**
- Modify: `src/app/onboarding/page.tsx` (replace stub)

- [ ] **Step 1: Write the page**

```typescript
// src/app/onboarding/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function OnboardingPage() {
  const [orgName, setOrgName] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/org/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orgName, fullName }),
    })

    if (!res.ok) {
      const { error: msg } = await res.json()
      setError(msg || 'Failed to create organization')
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  const ready = !loading && orgName.trim().length > 0

  return (
    <main style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', fontFamily: "'IBM Plex Mono', monospace" }}>
      <div style={{ width: '100%', maxWidth: '400px', padding: '1rem' }}>
        <h1 style={{ color: 'var(--gold)', marginBottom: '0.5rem' }}>Welcome to LoanOS</h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '2rem' }}>Create your organization to get started.</p>

        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ color: 'var(--muted)', fontSize: '0.75rem', display: 'block', marginBottom: '0.25rem' }}>YOUR NAME</label>
            <input
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Adam Styer"
              style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', padding: '0.5rem', borderRadius: '4px', fontFamily: 'inherit' }}
            />
          </div>
          <div>
            <label style={{ color: 'var(--muted)', fontSize: '0.75rem', display: 'block', marginBottom: '0.25rem' }}>ORGANIZATION NAME</label>
            <input
              value={orgName}
              onChange={e => setOrgName(e.target.value)}
              placeholder="Adam Styer | Mortgage Solutions LP"
              required
              style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', padding: '0.5rem', borderRadius: '4px', fontFamily: 'inherit' }}
            />
          </div>

          {error && <p style={{ color: 'var(--red)', fontSize: '0.875rem' }}>{error}</p>}

          <button
            type="submit"
            disabled={!ready}
            style={{ background: ready ? 'var(--gold)' : 'var(--surface2)', color: ready ? '#050505' : 'var(--muted)', padding: '0.75rem', borderRadius: '4px', border: 'none', cursor: ready ? 'pointer' : 'not-allowed', fontFamily: 'inherit', fontWeight: 600 }}
          >
            {loading ? 'Creating…' : 'Create Organization →'}
          </button>
        </form>
      </div>
    </main>
  )
}
```

---

### Task 24: `/api/org/create` route

**Files:**
- Create: `src/app/api/org/create/route.ts`

- [ ] **Step 1: Write the route**

```typescript
// src/app/api/org/create/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(req: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Check they don't already have an org
    const { data: existing } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (existing?.organization_id) {
      return NextResponse.json({ error: 'Already assigned to an organization' }, { status: 400 })
    }

    const { orgName, fullName } = await req.json()
    if (!orgName?.trim()) return NextResponse.json({ error: 'Organization name required' }, { status: 400 })

    // Create slug from name
    const slug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

    // Use service client to bypass RLS for org + profile creation
    const service = createServiceClient()

    // Create org
    const { data: org, error: orgError } = await service
      .from('organizations')
      .insert({ name: orgName.trim(), slug })
      .select('id')
      .single()

    if (orgError) throw orgError

    // Create or update profile
    const { error: profileError } = await service
      .from('profiles')
      .upsert({
        id: user.id,
        organization_id: org.id,
        role: 'owner',
        full_name: fullName?.trim() || null,
        email: user.email,
      })

    if (profileError) throw profileError

    return NextResponse.json({ organizationId: org.id })
  } catch (err) {
    console.error('[org/create]', err)
    return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 })
  }
}
```

---

### Task 25: Org admin — invite user

**Files:**
- Create: `src/app/api/org/invite/route.ts`
- Create: `src/app/api/org/members/route.ts`

- [ ] **Step 1: Write `invite` route**

Inviting in Supabase means creating an auth user via the admin API and assigning them a profile. Simplest approach: create a `pending_invites` table or use Supabase's `auth.admin.inviteUserByEmail()`.

```typescript
// src/app/api/org/invite/route.ts
import { NextResponse } from 'next/server'
import { getOrganization } from '@/lib/getOrganization'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(req: Request) {
  try {
    const { role: myRole, organizationId } = await getOrganization()
    if (!['owner', 'admin'].includes(myRole!)) {
      return NextResponse.json({ error: 'Only owners and admins can invite members' }, { status: 403 })
    }

    const { email, role = 'member' } = await req.json()
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })
    if (!['admin', 'member'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const service = createServiceClient()

    // Invite creates auth user + sends magic link email
    const { data, error } = await service.auth.admin.inviteUserByEmail(email, {
      data: { organization_id: organizationId, role },
    })

    if (error) throw error

    // Pre-create profile row so middleware doesn't redirect them to onboarding
    // (the auth hook will set this after they click the invite link)
    await service.from('profiles').upsert({
      id: data.user.id,
      organization_id: organizationId,
      role,
      email,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[org/invite]', err)
    return NextResponse.json({ error: 'Failed to send invite' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Write `members` route**

```typescript
// src/app/api/org/members/route.ts
import { NextResponse } from 'next/server'
import { getOrganization } from '@/lib/getOrganization'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET() {
  try {
    const { organizationId } = await getOrganization()
    const supabase = createClient()

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, created_at')
      .eq('organization_id', organizationId)
      .order('created_at')

    if (error) throw error
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function PATCH(req: Request) {
  try {
    const { role: myRole, organizationId } = await getOrganization()
    if (!['owner', 'admin'].includes(myRole!)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { userId, role } = await req.json()
    if (!['admin', 'member'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const service = createServiceClient()
    const { error } = await service
      .from('profiles')
      .update({ role })
      .eq('id', userId)
      .eq('organization_id', organizationId)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
```

---

### Task 26: Org settings panel in Settings page

**Files:**
- Modify: `src/app/dashboard/settings/page.tsx`

- [ ] **Step 1: Read current settings page**

- [ ] **Step 2: Add org members section**

Add a new section at the bottom of the settings page that:
1. Lists current org members (name, email, role pill)
2. Shows an "Invite member" form (email + role dropdown → POST `/api/org/invite`)
3. Allows owner/admin to change member roles (PATCH `/api/org/members`)

This is a client component section. Use `useOrg()` to check the current user's role — only show invite/role controls to owner/admin.

- [ ] **Step 3: Commit Chunk 5**

```bash
git add src/app/onboarding/ src/app/api/org/ src/app/dashboard/settings/
git commit -m "feat(onboarding): org creation flow, invite members, org admin settings"
```

---

## Chunk 6: n8n Integration Updates

n8n workflows write to Supabase using the service role (bypasses RLS). However, the rows they write need `organization_id` stamped on them, otherwise they sit with `NULL` org_id and won't appear in the app.

---

### Task 27: Update n8n WF1 (Arive New Loan) to stamp `organization_id`

**Files:**
- n8n workflow `1tagvoU0UXtdDiMY` — updated via n8n API

- [ ] **Step 1: Get current workflow JSON**

```bash
curl -s https://styer.app.n8n.cloud/api/v1/workflows/1tagvoU0UXtdDiMY \
  -H "X-N8N-API-KEY: $(cat memory/tools/n8n.md | grep 'API_KEY' | ...)" \
  | jq '.nodes[] | {name, type}' | head -50
```

- [ ] **Step 2: Add org lookup step**

In the workflow, before the Supabase upsert nodes, add an HTTP Request node:
- GET `https://uuqedsvjlkeszrbwzizl.supabase.co/rest/v1/profiles?select=organization_id&id=eq.{{ $json.user_id }}`
- Headers: `apikey` + `Authorization: Bearer <service_role_key>`
- Extracts `organization_id` for use in subsequent upserts

- [ ] **Step 3: Add `organization_id` to upsert payloads**

In the contact upsert body:
```json
{
  "organization_id": "={{ $('Fetch Org').first().json[0].organization_id }}"
}
```
Same in loan upsert body.

- [ ] **Step 4: Update WF2** (Arive Status Update) with same org lookup pattern

- [ ] **Step 5: Update milestone/email draft workflows**

WF3 (Milestone) and email workflows insert to `activity_log` and `email_drafts`. These should also carry `organization_id`. The loan record itself has `organization_id` — extract it from the loan lookup step that already exists in those workflows.

- [ ] **Step 6: Test with curl**

Send a test webhook payload to WF1 and verify the resulting row in Supabase has `organization_id` populated:
```sql
SELECT id, loan_number, organization_id FROM loans ORDER BY created_at DESC LIMIT 3;
```

- [ ] **Step 7: Commit n8n workflow backups**

Export updated workflow JSON and save to `n8n/workflows/`:
```bash
git add n8n/workflows/
git commit -m "feat(n8n): stamp organization_id on all Supabase writes in n8n workflows"
```

---

## Chunk 7: Final Verification

### Task 28: End-to-end multi-tenant smoke test

- [ ] **Step 1: Create a second test user and add to Adam's org**

```sql
-- In Supabase SQL Editor:
-- 1. Sign up second user via the invite flow (use /dashboard/settings)
-- 2. Verify their profile has correct organization_id + role = 'member'
SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 3;
SELECT * FROM profiles ORDER BY created_at DESC LIMIT 3;
```

- [ ] **Step 2: Log in as second user — verify they see Adam's data**

- Loans list: should show all org loans
- Contacts: should show all org contacts
- Should NOT be able to delete (member role = no DELETE per RLS)

- [ ] **Step 3: Verify RLS blocks cross-org data**

Create a second organization with a third test user. Verify user from org A cannot read data from org B:
```sql
-- Temporarily insert a row with a different org_id and verify the first user can't see it
INSERT INTO loans (id, user_id, organization_id, status)
VALUES (gen_random_uuid(), '<user_a_id>', '<org_b_id>', 'lead');

-- Now query as user A — this row should NOT appear (RLS blocks it)
```

- [ ] **Step 4: Full build + deploy**

```bash
npm run build
git add .
git commit -m "feat: complete multi-tenancy — org-scoped RLS, app layer, onboarding, n8n"
git push origin main
```

Wait for Vercel deploy to complete. Verify via Vercel MCP `list_deployments`.

- [ ] **Step 5: Production smoke test**

Log into production loanos. Confirm dashboard loads correctly. Confirm existing loans/contacts still appear (backfill from Task 3 protected them).

---

## Summary of All Files Changed

| Chunk | New Files | Modified Files |
|-------|-----------|---------------|
| 1 (DB) | `032_*.sql`, `033_*.sql`, `034_*.sql` | — |
| 2 (Infra) | `api/me/route.ts`, `OrgProvider.tsx`, `hooks/useOrg.ts`, `onboarding/page.tsx` | `dashboard/layout.tsx`, `middleware.ts` |
| 3 (API routes) | — | 15+ API route files |
| 4 (Pages) | — | 10+ server pages + client components |
| 5 (Onboarding) | `api/org/create/route.ts`, `api/org/invite/route.ts`, `api/org/members/route.ts` | `onboarding/page.tsx`, `settings/page.tsx` |
| 6 (n8n) | — | n8n workflows (via API), workflow JSON backups |
| 7 (Verify) | — | — |

## Estimated Sessions

| Chunk | Work | Sessions |
|-------|------|---------|
| 1 — DB migrations | Mechanical, fast | 0.5 |
| 2 — Org infrastructure | New files, middleware | 0.5 |
| 3 — API routes | Repetitive pattern across 15 files | 1 |
| 4 — Pages | Repetitive pattern across 12 files | 1 |
| 5 — Onboarding + Admin | New UX, invite flow | 1 |
| 6 — n8n | JSON workflow updates | 0.5 |
| 7 — Verification | Testing | 0.5 |
| **Total** | | **~5 sessions** |
