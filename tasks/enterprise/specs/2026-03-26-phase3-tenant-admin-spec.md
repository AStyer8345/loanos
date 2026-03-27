# Architecture Spec: Tenant Admin Dashboard
Date: 2026-03-26 PM
Session: Architecture (next queue item after Billing)
Status: ARCHITECTURE COMPLETE — awaiting Billing build sessions first

---

## Purpose

An internal admin dashboard for Adam (and only Adam) to see all tenants, manage plan tiers, monitor health, and manually override billing if needed. This is not a feature for LOs — it's a super-admin interface.

---

## Access Control

### Who can access
- Only users with `role = 'super_admin'` in a system-level table
- Adam's personal user account
- **NOT** accessible to any tenant org members

### Implementation Approach
Use a separate `system_admins` table (not org-scoped) with a single row for Adam's `user_id`. All admin routes check this table first.

```sql
-- Migration: 059_create_system_admins_table.sql
CREATE TABLE system_admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- No RLS on system_admins — only service role reads this table
-- Admin routes use createServiceClient() to bypass RLS

-- Seed Adam's account (replace with real user_id after first login)
-- INSERT INTO system_admins (user_id, email) VALUES ('<ADAM_USER_ID>', 'adam@thestyerteam.com');
```

### Admin Route Guard Helper

```typescript
// src/lib/admin/auth.ts
import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function requireAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const serviceClient = createServiceClient()
  const { data: admin } = await serviceClient
    .from('system_admins')
    .select('user_id')
    .eq('user_id', user.id)
    .single()

  if (!admin) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  return { user, serviceClient }
}
```

---

## Routes

| Route | Purpose |
|-------|---------|
| `/admin` | Dashboard — tenant list, system stats |
| `/admin/tenants/[id]` | Tenant detail — org info, members, billing, logs |
| `/admin/tenants/[id]/billing` | Billing override — manually change plan |

**Security:** All `/admin/*` routes protected by middleware — redirect to `/dashboard` if not super_admin.

---

## Database Queries

### Tenant List View

```typescript
// src/app/api/admin/tenants/route.ts
const { data: tenants } = await serviceClient
  .from('organizations')
  .select(`
    id,
    name,
    slug,
    plan,
    subscription_status,
    plan_period_end,
    stripe_customer_id,
    created_at,
    subscriptions (
      status,
      current_period_end,
      cancel_at_period_end
    ),
    org_members (count)
  `)
  .order('created_at', { ascending: false })
```

### Last Active (Approximate)

```typescript
// Get most recent activity_log entry per org
const { data: lastActivity } = await serviceClient
  .from('activity_log')
  .select('organization_id, created_at')
  .in('organization_id', tenantIds)
  .order('created_at', { ascending: false })
  // Group by org client-side (or use a View)
```

**Note:** Consider creating a Supabase View `org_last_active` for this query to avoid N+1.

### Manual Plan Override

```typescript
// src/app/api/admin/tenants/[id]/override-plan/route.ts
// POST { plan: 'professional' | 'starter' }

// 1. Update organizations.plan
await serviceClient
  .from('organizations')
  .update({ plan: newPlan, subscription_status: 'active' })
  .eq('id', orgId)

// 2. Log to activity_log with admin context
await serviceClient.from('activity_log').insert({
  organization_id: orgId,
  action: 'admin_plan_override',
  entity_type: 'billing',
  entity_id: orgId,
  details: { previous_plan: previousPlan, new_plan: newPlan, overridden_by: adminUserId },
})
```

---

## UI Layout

### `/admin` — Tenant Dashboard

```
┌─────────────────────────────────────────────────────────┐
│  LoanOS Admin                                [Adam]      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  System Overview                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │
│  │  12      │  │   3      │  │  $297    │  │  0     │  │
│  │ Tenants  │  │  Pro     │  │  MRR     │  │ Errors │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘  │
│                                                          │
│  Tenant List                          [Search]           │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Name         │ Plan    │ Members │ Status │ MRR  │   │
│  │ ─────────── │ ─────── │ ─────── │ ─────  │ ─── │   │
│  │ Styer Mtg   │ starter │ 1       │ active │  —   │   │
│  │ LO Company  │ pro     │ 3       │ active │ $99  │   │
│  │ ...          │ ...     │ ...     │ ...    │ ...  │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### `/admin/tenants/[id]` — Tenant Detail

```
┌─────────────────────────────────────────────────────────┐
│  ← Back to Admin           LO Company Inc               │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────────────────┐  ┌──────────────────────┐  │
│  │ Organization             │  │ Billing              │  │
│  │ Name: LO Company Inc    │  │ Plan: Professional   │  │
│  │ Slug: lo-company        │  │ Status: active       │  │
│  │ NMLS: 123456            │  │ Renews: Apr 26 2026  │  │
│  │ Created: Mar 20 2026    │  │ MRR: $99             │  │
│  └─────────────────────────┘  │                      │  │
│                               │ [Override Plan ↓]    │  │
│  ┌─────────────────────────┐  └──────────────────────┘  │
│  │ Members (3)              │                            │
│  │ john@example.com [owner]│                            │
│  │ jane@example.com [member│                            │
│  │ bill@example.com [member│                            │
│  └─────────────────────────┘                            │
│                                                          │
│  Recent Activity (last 10 events)                       │
│  ─────────────────────────────────────────────────────  │
│  [activity log entries]                                  │
└─────────────────────────────────────────────────────────┘
```

---

## File Map

| File | Purpose |
|------|---------|
| `supabase/migrations/059_create_system_admins_table.sql` | system_admins table |
| `src/lib/admin/auth.ts` | requireAdmin() helper |
| `src/app/admin/layout.tsx` | Admin layout with auth guard |
| `src/app/admin/page.tsx` | Tenant list + system stats |
| `src/app/admin/tenants/[id]/page.tsx` | Tenant detail |
| `src/app/api/admin/tenants/route.ts` | GET all tenants (service role) |
| `src/app/api/admin/tenants/[id]/route.ts` | GET tenant detail |
| `src/app/api/admin/tenants/[id]/override-plan/route.ts` | POST plan override |

---

## Middleware: Admin Route Protection

In `proxy.ts` / `middleware.ts`, add admin redirect:

```typescript
// If path starts with /admin — check system_admins table
// If not admin → redirect to /dashboard
// This is a secondary check — the layout also guards, but middleware is the hard gate
```

**Implementation note:** Middleware can't query Supabase with service role (no Node.js runtime access to service key). Instead:
1. Check if user is authenticated in middleware (existing cookie check)
2. On each admin page/layout, call `requireAdmin()` which does the system_admins lookup
3. This is the correct pattern for this stack — don't try to do the admin DB check in middleware

---

## Adam's User ID Setup

Before building, Adam must add himself to `system_admins`:

```sql
-- Run once in Supabase SQL Editor after logging in to LoanOS:
INSERT INTO system_admins (user_id, email)
SELECT id, email FROM auth.users WHERE email = 'adam@thestyerteam.com'
ON CONFLICT DO NOTHING;
```

Add to ADAM-TODO.md: "Run system_admins INSERT after migration 059 is applied."

---

## MVP Scope vs Future

### MVP (this build)
- Tenant list with plan, member count, subscription status
- Tenant detail with billing info + member list
- Manual plan override (upgrade/downgrade without Stripe)
- Recent activity log per tenant

### Future (not MVP)
- Usage metrics per tenant (loans created, emails sent, AI calls)
- Churn risk signals (last login > 30 days, declining activity)
- Bulk actions (export all tenant emails, send blast)
- Feature flag overrides per tenant (override individual entitlements)
- Financial dashboard (MRR graph, churn rate, LTV)

---

## Risk Notes

- **system_admins RLS:** This table intentionally has NO RLS. Service role only. If you accidentally enable RLS without policies, Adam gets locked out. Add a comment to the migration.
- **Admin route is NOT in the tenant org context** — `useOrg()` hook will not work in admin pages. Use raw service client queries throughout.
- **Plan override bypasses Stripe** — it directly sets `organizations.plan`. This is intentional for support/trial management, but Stripe remains the source of truth for paid plans. Document this clearly in the override UI.
- **Migration 059 depends on:** No prior migrations — standalone table. Can build before or after billing sessions.

---

## Build Sequencing

This can be built independently of Billing Sessions 1-3, EXCEPT:
- The tenant detail billing section references `subscriptions` table (migration 057 required)
- The plan override references `organizations.plan` (exists), `subscription_status` (migration 058 required)

**Recommended order:** Build Billing Sessions 1-3 first (when Stripe setup is done), then build Tenant Admin as a standalone session.

**If Stripe is still blocked:** Tenant Admin MVP can be built without the billing columns — just show `organizations.plan` directly. Add the subscription detail panel later.
