# Implementation Spec: Stripe Webhook Handler + Checkout Routes
Date: 2026-03-26 PM
Session: Architecture continuation (Build Session 2 pre-work)
Status: READY FOR BUILD — can execute immediately when Stripe env vars are set

---

## Purpose

This spec translates the architecture from `2026-03-26-phase3-billing-spec.md` into production-ready code for Build Session 2. The builder can copy this directly.

**Prerequisite:** Adam must add Stripe env vars to Vercel before this builds. See enterprise-queue.md for the checklist.

---

## File 1: `src/lib/billing/stripe.ts` (Stripe client singleton)

```typescript
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia',  // Use Stripe's latest stable API version
  typescript: true,
})
```

**Note:** Import from this file everywhere — never instantiate `new Stripe()` in route files.

---

## File 2: `src/app/api/webhooks/stripe/route.ts` (Webhook handler)

**Critical implementation notes:**
- Use `req.text()` NOT `req.json()` — required for signature verification
- Use `createServiceClient()` NOT `createClient()` — webhooks bypass RLS
- Add `org_id` to Stripe subscription metadata so we can find the org from any webhook event
- Return 200 for unhandled event types (prevents Stripe retries on intentionally ignored events)
- Return 500 for processing errors (triggers Stripe retry — desirable for transient DB failures)

```typescript
import { stripe } from '@/lib/billing/stripe'
import { createServiceClient } from '@/lib/supabase/service'
import type Stripe from 'stripe'

// Exclude this route from Supabase auth middleware
// (webhook requests come from Stripe, not authenticated users)
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return new Response('Missing stripe-signature header', { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('[stripe/webhook] Signature verification failed:', err)
    return new Response('Webhook signature verification failed', { status: 400 })
  }

  const supabase = createServiceClient()

  try {
    switch (event.type) {
      // ── Checkout completed → subscription active ────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== 'subscription' || !session.subscription) break

        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        )
        const orgId = subscription.metadata.org_id
        if (!orgId) {
          console.error('[stripe/webhook] checkout.session.completed: missing org_id in metadata')
          break
        }

        await upsertSubscription(supabase, orgId, subscription)
        await supabase
          .from('organizations')
          .update({
            plan: 'professional',
            stripe_customer_id: subscription.customer as string,
            subscription_status: 'active',
            plan_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq('id', orgId)
        break
      }

      // ── Subscription updated (upgrade/downgrade/cancel toggle) ──────────
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const orgId = subscription.metadata.org_id
        if (!orgId) break

        await upsertSubscription(supabase, orgId, subscription)
        await supabase
          .from('organizations')
          .update({
            subscription_status: subscription.status,
            plan_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq('id', orgId)
        break
      }

      // ── Subscription canceled (final) → downgrade to starter ───────────
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const orgId = subscription.metadata.org_id
        if (!orgId) break

        await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            canceled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('organization_id', orgId)

        await supabase
          .from('organizations')
          .update({
            plan: 'starter',
            subscription_status: 'canceled',
            plan_period_end: null,
          })
          .eq('id', orgId)
        break
      }

      // ── Invoice paid → refresh period dates, clear past_due ────────────
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        if (!invoice.subscription) break

        const subscription = await stripe.subscriptions.retrieve(
          invoice.subscription as string
        )
        const orgId = subscription.metadata.org_id
        if (!orgId) break

        await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('organization_id', orgId)

        await supabase
          .from('organizations')
          .update({
            subscription_status: 'active',
            plan_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq('id', orgId)
        break
      }

      // ── Invoice failed → flag as past_due, log event ────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        if (!invoice.subscription) break

        const subscription = await stripe.subscriptions.retrieve(
          invoice.subscription as string
        )
        const orgId = subscription.metadata.org_id
        if (!orgId) break

        await supabase
          .from('subscriptions')
          .update({
            status: 'past_due',
            updated_at: new Date().toISOString(),
          })
          .eq('organization_id', orgId)

        await supabase
          .from('organizations')
          .update({ subscription_status: 'past_due' })
          .eq('id', orgId)

        // Log payment failure to activity_log
        await supabase.from('activity_log').insert({
          organization_id: orgId,
          action: 'payment_failed',
          entity_type: 'billing',
          entity_id: orgId,
          details: {
            invoice_id: invoice.id,
            attempt_count: invoice.attempt_count ?? 1,
          },
        } as unknown as Parameters<typeof supabase.from<'activity_log'>>[0])
        break
      }

      default:
        // Unhandled event — return 200 to prevent Stripe retries
        break
    }
  } catch (err) {
    console.error(`[stripe/webhook] Error processing ${event.type}:`, err)
    // Return 500 to trigger Stripe retry (for transient DB failures)
    return new Response('Internal server error', { status: 500 })
  }

  return new Response('OK', { status: 200 })
}

// ── Helper: upsert subscription row ─────────────────────────────────────────

async function upsertSubscription(
  supabase: ReturnType<typeof createServiceClient>,
  orgId: string,
  subscription: Stripe.Subscription
) {
  await supabase
    .from('subscriptions')
    .upsert(
      {
        organization_id: orgId,
        stripe_customer_id: subscription.customer as string,
        stripe_subscription_id: subscription.id,
        stripe_price_id: subscription.items.data[0]?.price.id ?? null,
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        canceled_at: subscription.canceled_at
          ? new Date(subscription.canceled_at * 1000).toISOString()
          : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'organization_id' }
    )
}
```

---

## File 3: `src/app/api/billing/create-checkout/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/billing/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = createClient()

  // Get authenticated user + their org
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get org (uses RLS — only returns orgs the user belongs to)
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, stripe_customer_id, plan')
    .single()

  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
  }

  if (org.plan === 'professional') {
    return NextResponse.json({ error: 'Already on Professional plan' }, { status: 400 })
  }

  if (!org.stripe_customer_id) {
    return NextResponse.json({ error: 'No Stripe customer found. Contact support.' }, { status: 400 })
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: org.stripe_customer_id,
    line_items: [
      {
        price: process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY!,
        quantity: 1,
      },
    ],
    subscription_data: {
      metadata: {
        org_id: org.id,  // CRITICAL: used to look up org in webhook handler
      },
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?tab=billing&success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?tab=billing`,
    allow_promotion_codes: true,
  })

  return NextResponse.json({ url: session.url })
}
```

---

## File 4: `src/app/api/billing/create-portal/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/billing/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('stripe_customer_id')
    .single()

  if (!org?.stripe_customer_id) {
    return NextResponse.json({ error: 'No billing account found' }, { status: 404 })
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: org.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?tab=billing`,
  })

  return NextResponse.json({ url: portalSession.url })
}
```

---

## File 5: Modification to `src/app/api/org/create/route.ts`

**Where to insert:** After the org insert succeeds (after line ~35), add Stripe Customer creation.

```typescript
// After org is created, create a Stripe Customer
// Wrap in try/catch — org creation succeeds even if Stripe fails (customer created lazily on upgrade)
try {
  const customer = await stripe.customers.create({
    name: body.name,  // org name
    email: user.email,
    metadata: {
      org_id: newOrg.id,
      nmls: body.nmls ?? '',
    },
  })

  // Save stripe_customer_id to organizations
  await supabase
    .from('organizations')
    .update({ stripe_customer_id: customer.id })
    .eq('id', newOrg.id)
} catch (stripeError) {
  // Non-fatal: org exists, Stripe customer can be created lazily
  console.warn('[org/create] Stripe customer creation failed (non-fatal):', stripeError)
}
```

**Import to add at top of file:**
```typescript
import { stripe } from '@/lib/billing/stripe'
```

---

## Environment Variable to Add

One additional env var is needed for the checkout/portal routes:

| Variable | Value | Where |
|----------|-------|-------|
| `NEXT_PUBLIC_APP_URL` | `https://loanos-self.vercel.app` | Vercel env (all environments) |

**Note:** If this already exists — use it. If not, add it. It's used as the base URL for Stripe redirect URLs.

---

## Middleware Exclusion for Webhook Route

The Stripe webhook route must NOT be intercepted by Supabase auth middleware (it receives requests from Stripe, not authenticated users).

Check `proxy.ts` or `middleware.ts` in the project root. If it wraps all `/api/*` routes, add an exclusion:

```typescript
// In proxy.ts / middleware.ts matcher config:
export const config = {
  matcher: [
    '/((?!api/webhooks|_next/static|_next/image|favicon.ico).*)',
  ],
}
```

**Important:** Only add this if the existing middleware currently intercepts `/api/webhooks/stripe`. Check first.

---

## Build Verification Steps

After building all 5 files/modifications:

1. `npm run build` — must pass with 0 TypeScript errors
2. Check that `/api/webhooks/stripe` route exists in `.next/server/app/api/webhooks/stripe/`
3. Check that `/api/billing/create-checkout` and `/api/billing/create-portal` routes exist
4. Test locally with Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
5. Trigger a test `checkout.session.completed` event — verify subscriptions table is updated

---

## Risk Notes

- **Activity log insert** — the `details` column is `jsonb`. The insert cast `as unknown as ...` is the existing project pattern. Check the activity_log type definition before inserting.
- **organizations.select('id, name, stripe_customer_id, plan')** — verify `stripe_customer_id` column exists (it's created in migration 058). Builder must run migration 058 BEFORE building these files.
- **`NEXT_PUBLIC_APP_URL`** — if this doesn't exist in Vercel, the Stripe redirect URLs will be broken. Confirm before Build Session 2.
