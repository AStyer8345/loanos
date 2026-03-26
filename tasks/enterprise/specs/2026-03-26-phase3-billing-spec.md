# Architecture Spec: Phase 3 — Billing + Subscriptions
Date: 2026-03-26
Session: AM
Status: ARCHITECTURE COMPLETE — READY FOR BUILD (next session)

---

## Executive Summary

LoanOS needs Stripe-powered subscription billing to transition from Adam's personal tool to a licensed SaaS for other loan officers. This spec covers the database schema, Stripe integration architecture, webhook handling, feature gating, and customer self-service.

**Decision: Fixed-tier billing for MVP.** Starter (free) + Professional ($99/mo). Per-seat pricing deferred to Phase 5.

---

## Scope

### In Scope
- Stripe Customer + Subscription lifecycle integration
- `subscriptions` table in Supabase (synced via webhooks)
- Webhook handler route (`/api/webhooks/stripe`)
- Feature gating helper (`canAccessFeature(orgId, feature)`)
- Customer Portal integration (self-service plan management)
- Plan tier standardization (resolve 'professional' vs 'pro' naming)
- Migrations for new tables + organizations column additions

### Out of Scope
- Per-seat billing (Phase 5)
- Usage metering / consumption billing (Phase 5)
- White-label / custom domain (Phase 4 — separate queue item)
- Admin dashboard for tenant management (separate queue item)
- Stripe Connect / marketplace payouts
- Tax calculation (Stripe Tax can be added later — not MVP)

---

## Plan Tier Definition

### Standardized Plan Names

**Decision: Standardize on 'starter' and 'professional'.** The code already uses these. The knowledge base references to 'pro' and 'team' are outdated. Update knowledge base, not code.

| Plan | Slug | Price | Stripe Price | Target |
|------|------|-------|-------------|--------|
| Starter | `starter` | Free | No Stripe subscription needed | Solo LO getting started |
| Professional | `professional` | $99/mo | `price_professional_monthly` | Production LO with full feature set |

### Feature Entitlements

| Feature | Starter | Professional |
|---------|---------|-------------|
| Unlimited loans | ✅ | ✅ |
| AI milestone agent | ✅ | ✅ |
| Pre-approval & CD emails | ✅ | ✅ |
| Daily briefing | ✅ | ✅ |
| Scenario Builder | ✅ | ✅ |
| Contact import (CSV) | 500 limit | Unlimited |
| Team members | 1 (owner only) | Up to 5 |
| Custom branding (logo + color) | ❌ | ✅ |
| Priority support | ❌ | ✅ |
| API access | ❌ | ✅ |
| Custom email templates | ❌ | ✅ |
| Marketing tab | ✅ (basic) | ✅ (full) |

**Note:** These entitlements are enforced in application code, NOT in RLS. RLS handles data isolation. Feature gating is a separate concern.

---

## Data Model Changes

### New Table: `subscriptions`

```sql
CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_customer_id text NOT NULL,
  stripe_subscription_id text UNIQUE,  -- NULL for free tier (no Stripe sub)
  stripe_price_id text,
  status text NOT NULL DEFAULT 'active',
    -- active, trialing, past_due, canceled, unpaid, incomplete, paused
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  canceled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT unique_org_subscription UNIQUE (organization_id)
);

-- RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can read own subscription" ON subscriptions
  FOR SELECT USING (organization_id = get_my_organization_id());

-- No INSERT/UPDATE/DELETE policies for users — only service role writes (from webhooks)
```

### Modified Table: `organizations`

Add columns for Stripe linkage:

```sql
ALTER TABLE organizations
  ADD COLUMN stripe_customer_id text UNIQUE,
  ADD COLUMN subscription_status text DEFAULT 'active',
  ADD COLUMN plan_period_end timestamptz;
```

**Why denormalize `subscription_status` onto organizations?**
- Most feature-gating checks only need org plan + status
- Avoids JOIN to `subscriptions` on every page load
- Webhook handler updates both tables atomically
- `subscriptions` table is the source of truth; `organizations` columns are a read cache

### Migration Files

| Migration | Purpose |
|-----------|---------|
| `057_create_subscriptions_table.sql` | Create subscriptions table + RLS |
| `058_add_stripe_columns_to_organizations.sql` | Add stripe_customer_id, subscription_status, plan_period_end |

---

## Stripe Integration Architecture

### Flow 1: New Org Signup (Free Tier)

```
User → /onboarding → selects Starter → POST /api/org/create
  → Creates organization (plan: 'starter')
  → Creates Stripe Customer (name, email, metadata: {org_id})
  → Saves stripe_customer_id to organizations table
  → No Stripe Subscription created (free tier)
  → Redirect to /dashboard
```

**Change to `/api/org/create`:** After org creation, call `stripe.customers.create()` and save the customer ID. This ensures every org has a Stripe customer from day one — simplifies upgrade flow later.

### Flow 2: Upgrade to Professional

```
User → /dashboard/settings/billing → clicks "Upgrade"
  → POST /api/billing/create-checkout
  → Creates Stripe Checkout Session (mode: 'subscription')
    → customer: org.stripe_customer_id
    → price: price_professional_monthly
    → success_url: /dashboard/settings/billing?success=true
    → cancel_url: /dashboard/settings/billing
  → Redirect to Stripe Checkout
  → User pays → Stripe fires webhooks
  → Webhook handler updates subscriptions + organizations tables
  → User returns to success_url → sees Professional plan active
```

### Flow 3: Manage Subscription (Portal)

```
User → /dashboard/settings/billing → clicks "Manage Subscription"
  → POST /api/billing/create-portal
  → Creates Stripe Billing Portal Session
    → customer: org.stripe_customer_id
    → return_url: /dashboard/settings/billing
  → Redirect to Stripe Portal
  → User can: update payment method, cancel, view invoices
  → Stripe fires webhooks on changes
```

### Flow 4: Payment Failure

```
Stripe → invoice.payment_failed webhook
  → Update subscriptions.status = 'past_due'
  → Update organizations.subscription_status = 'past_due'
  → Stripe sends dunning emails automatically (Smart Retries)
  → After 3 failed attempts over ~28 days:
    → customer.subscription.deleted webhook
    → Update subscriptions.status = 'canceled'
    → Update organizations.plan = 'starter' (downgrade)
    → Update organizations.subscription_status = 'canceled'
```

**Grace period:** Stripe's built-in Smart Retries handle dunning. No custom grace period logic needed for MVP.

---

## Webhook Handler

### Route: `/api/webhooks/stripe/route.ts`

```
POST /api/webhooks/stripe
  → Verify Stripe signature (STRIPE_WEBHOOK_SECRET)
  → Parse event type
  → Switch on event:
    → checkout.session.completed
    → customer.subscription.created
    → customer.subscription.updated
    → customer.subscription.deleted
    → invoice.payment_succeeded
    → invoice.payment_failed
  → Update subscriptions table
  → Update organizations table (denormalized fields)
  → Return 200
```

### Critical Events

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Link subscription to org. Update plan to 'professional'. |
| `customer.subscription.updated` | Sync status, period dates, cancel_at_period_end. |
| `customer.subscription.deleted` | Downgrade org to 'starter'. Mark subscription canceled. |
| `invoice.payment_succeeded` | Update period dates. Clear any past_due status. |
| `invoice.payment_failed` | Set status to 'past_due'. Log to activity_log. |

### Webhook Security

```ts
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    return new Response('Webhook signature verification failed', { status: 400 })
  }

  // ... handle event
  return new Response('OK', { status: 200 })
}
```

**Important:** This route must NOT use the Supabase auth middleware. It receives requests from Stripe, not authenticated users. Raw `req.text()` is required (not `req.json()`) for signature verification.

---

## Feature Gating

### Helper: `src/lib/billing/entitlements.ts`

```ts
type Plan = 'starter' | 'professional'
type Feature = 'team_members' | 'custom_branding' | 'api_access' | 'custom_email_templates' | 'unlimited_import' | 'priority_support' | 'marketing_full'

const ENTITLEMENTS: Record<Feature, Plan[]> = {
  team_members: ['professional'],
  custom_branding: ['professional'],
  api_access: ['professional'],
  custom_email_templates: ['professional'],
  unlimited_import: ['professional'],
  priority_support: ['professional'],
  marketing_full: ['professional'],
}

export function canAccess(plan: Plan, feature: Feature): boolean {
  return ENTITLEMENTS[feature].includes(plan)
}

export function getContactImportLimit(plan: Plan): number {
  return plan === 'professional' ? Infinity : 500
}

export function getTeamMemberLimit(plan: Plan): number {
  return plan === 'professional' ? 5 : 1
}
```

### Usage Pattern (Server Components)

```ts
const org = await getOrganization()  // existing helper
if (!canAccess(org.plan, 'custom_branding')) {
  // Show upgrade prompt instead of branding settings
}
```

### Usage Pattern (API Routes)

```ts
const org = await getOrganization()
if (!canAccess(org.plan, 'api_access')) {
  return NextResponse.json({ error: 'Upgrade to Professional for API access' }, { status: 403 })
}
```

---

## New Files to Create

| File | Purpose |
|------|---------|
| `src/lib/billing/stripe.ts` | Stripe client singleton |
| `src/lib/billing/entitlements.ts` | Feature gating helpers |
| `src/app/api/webhooks/stripe/route.ts` | Webhook handler |
| `src/app/api/billing/create-checkout/route.ts` | Create Stripe Checkout Session |
| `src/app/api/billing/create-portal/route.ts` | Create Stripe Billing Portal Session |
| `src/app/dashboard/settings/billing/page.tsx` | Billing settings UI |
| `supabase/migrations/057_create_subscriptions_table.sql` | New table |
| `supabase/migrations/058_add_stripe_columns_to_organizations.sql` | Org columns |

## Files to Modify

| File | Change |
|------|--------|
| `src/app/api/org/create/route.ts` | Add Stripe Customer creation after org insert |
| `src/app/onboarding/page.tsx` | No changes needed (plan UI already works) |
| `package.json` | Add `stripe` dependency |

---

## Environment Variables Required

| Variable | Purpose | Where |
|----------|---------|-------|
| `STRIPE_SECRET_KEY` | Server-side Stripe API calls | Vercel env (secret) |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature verification | Vercel env (secret) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client-side Stripe.js (if needed) | Vercel env (non-secret) |
| `STRIPE_PRICE_PROFESSIONAL_MONTHLY` | Price ID for Professional plan | Vercel env |

**Adam action required:** Create Stripe account, create Product + Price, configure webhook endpoint, add env vars to Vercel.

---

## Implementation Order (Build Sessions)

### Session 1: Infrastructure (est. 45 min)
1. `npm install stripe`
2. Apply migration 057 (subscriptions table)
3. Apply migration 058 (organizations stripe columns)
4. Create `src/lib/billing/stripe.ts` (client singleton)
5. Create `src/lib/billing/entitlements.ts` (feature gating)
6. Verify build passes

### Session 2: Webhook + Checkout (est. 60 min)
1. Create `/api/webhooks/stripe/route.ts`
2. Create `/api/billing/create-checkout/route.ts`
3. Create `/api/billing/create-portal/route.ts`
4. Modify `/api/org/create/route.ts` (add Stripe customer creation)
5. Test with Stripe CLI (`stripe listen --forward-to`)

### Session 3: UI + Polish (est. 45 min)
1. Create `/dashboard/settings/billing/page.tsx`
2. Add feature gating to relevant components (branding, team members, import)
3. Add upgrade prompts where features are gated
4. Build + deploy + verify

---

## Risk Register

| Risk | Level | Mitigation |
|------|-------|-----------|
| Webhook handler receives events before Stripe env vars set | MEDIUM | Guard: return 500 if env vars missing, Stripe retries |
| Stripe Customer creation fails in org/create | LOW | Wrap in try/catch, org still creates, customer can be created lazily |
| Webhook signature verification fails | LOW | Use raw body (req.text()), not parsed JSON |
| Subscription table RLS blocks webhook writes | NONE | Webhooks use service role, bypasses RLS |
| Free tier users never touch Stripe | NONE | By design — Stripe Customer created at signup, but no subscription until upgrade |

---

## GLBA Compliance Notes (Phase 3 — Weeks 5-6)

For reference — not built this session. These are Phase 3 Security Hardening items:

1. **MFA enforcement** — Supabase Auth supports TOTP. Enable per-org or globally for Professional tier.
2. **Audit log completeness** — activity_log covers most actions. Identify gaps: login events, permission changes, data exports.
3. **Data retention policy** — Document how long PII is retained. Add purge/export workflow for tenant offboarding.
4. **Penetration testing** — Annual, external. Budget $3-10K.
5. **Written Information Security Program (WISP)** — Document for compliance. Not a code task.
6. **Incident response plan** — 30-day notification requirement. Document process.

---

## Decision Log

| Decision | Chosen | Rejected | Why |
|----------|--------|----------|-----|
| Billing model | Fixed-tier (starter/professional) | Per-seat, usage-based | Simpler for MVP. Mortgage LOs are individual practitioners — per-seat doesn't map well at this scale. Per-seat deferred to Phase 5 for Team plan. |
| Plan names | 'starter' / 'professional' | 'starter' / 'pro' / 'team' | Code already uses these. 'team' is a future tier, not MVP. |
| Stripe Customer creation timing | At org signup (always) | At first upgrade only | Having a customer ID from day one simplifies upgrade flow. Stripe doesn't charge for customer objects. |
| Subscription data storage | Dedicated `subscriptions` table + denormalized cols on `organizations` | Only organizations table | Subscriptions table is source of truth with full Stripe data. Organizations gets read-cache fields for fast gating checks. |
| Webhook route | `/api/webhooks/stripe` (no auth middleware) | Authenticated route | Webhooks come from Stripe, not users. Signature verification replaces auth. |
| Feature gating approach | Application-level helper function | RLS-based or middleware | Feature gating is UI/API logic, not data access. RLS already handles data isolation. Keep concerns separate. |
| Payment failure handling | Stripe Smart Retries (built-in) | Custom dunning logic | Stripe handles retry scheduling, dunning emails, and escalation. No custom code needed for MVP. |
| Free tier Stripe subscription | None (just customer object) | $0 subscription | Unnecessary complexity. Plan column on organizations is sufficient. |
