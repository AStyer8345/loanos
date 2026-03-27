# Implementation Spec: Billing Settings Page + Feature Gating
Date: 2026-03-26 PM
Session: Architecture continuation (Build Session 3 pre-work)
Status: READY FOR BUILD — can execute immediately when Stripe env vars are set

---

## Purpose

This spec provides the complete implementation for Build Session 3:
- Billing settings tab in `/dashboard/settings`
- Feature gating in components
- Upgrade prompts

---

## Settings Page Integration

The existing `/dashboard/settings/page.tsx` is a client component with a section system (`SectionKey` type). The billing section follows the same pattern.

### Step 1: Add 'billing' to SectionKey

```typescript
// In page.tsx, update the type:
type SectionKey = 'integrations' | 'website' | 'social' | 'identity' | 'ai' | 'outreach' | 'billing'
```

### Step 2: Add billing to the nav (wherever the section tabs/buttons are rendered)

Add a billing entry alongside the existing sections. Match the existing tab pattern.

---

## File: `src/app/dashboard/settings/billing/page.tsx`

**Decision:** Create billing as a standalone page at `/dashboard/settings/billing` rather than a section within the settings page. This is cleaner for URL sharing and future deep-linking (e.g., email payment failure links directly to `/dashboard/settings/billing`).

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CreditCard, CheckCircle, AlertTriangle, Loader2, ExternalLink, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useOrg } from '@/hooks/useOrg'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Subscription {
  status: string
  current_period_end: string | null
  cancel_at_period_end: boolean
  stripe_subscription_id: string | null
}

type BillingState = 'loading' | 'loaded' | 'error'

// ── Component ─────────────────────────────────────────────────────────────────

export default function BillingPage() {
  const { org } = useOrg()
  const searchParams = useSearchParams()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [state, setState] = useState<BillingState>('loading')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const successParam = searchParams.get('success')

  useEffect(() => {
    if (!org) return
    const supabase = createClient()
    supabase
      .from('subscriptions')
      .select('status, current_period_end, cancel_at_period_end, stripe_subscription_id')
      .single()
      .then(({ data, error }) => {
        if (error && error.code !== 'PGRST116') {
          // PGRST116 = row not found (free tier — no subscription row)
          setState('error')
          return
        }
        setSubscription(data ?? null)
        setState('loaded')
      })
  }, [org])

  async function handleUpgrade() {
    setActionLoading('upgrade')
    try {
      const res = await fetch('/api/billing/create-checkout', { method: 'POST' })
      const { url, error } = await res.json()
      if (error) throw new Error(error)
      window.location.href = url
    } catch (err) {
      console.error('Checkout error:', err)
      setActionLoading(null)
    }
  }

  async function handleManage() {
    setActionLoading('manage')
    try {
      const res = await fetch('/api/billing/create-portal', { method: 'POST' })
      const { url, error } = await res.json()
      if (error) throw new Error(error)
      window.location.href = url
    } catch (err) {
      console.error('Portal error:', err)
      setActionLoading(null)
    }
  }

  if (!org || state === 'loading') {
    return (
      <div className="flex items-center gap-2 text-zinc-400 p-8">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm font-mono">Loading billing…</span>
      </div>
    )
  }

  const isProfessional = org.plan === 'professional'
  const isPastDue = subscription?.status === 'past_due'
  const isCanceling = subscription?.cancel_at_period_end === true
  const periodEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric',
      })
    : null

  return (
    <div className="max-w-2xl space-y-8">
      {/* ── Success banner ── */}
      {successParam && (
        <div className="flex items-center gap-3 p-4 rounded-lg border border-emerald-800 bg-emerald-950/30">
          <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
          <div>
            <p className="text-sm font-mono text-emerald-300 font-semibold">Upgrade successful</p>
            <p className="text-xs text-emerald-400 mt-0.5">
              Welcome to LoanOS Professional. All features are now unlocked.
            </p>
          </div>
        </div>
      )}

      {/* ── Past due warning ── */}
      {isPastDue && (
        <div className="flex items-center gap-3 p-4 rounded-lg border border-amber-700 bg-amber-950/30">
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
          <div>
            <p className="text-sm font-mono text-amber-300 font-semibold">Payment failed</p>
            <p className="text-xs text-amber-400 mt-0.5">
              Your last payment didn't go through. Update your payment method to avoid losing access.
            </p>
          </div>
          <button
            onClick={handleManage}
            disabled={actionLoading === 'manage'}
            className="ml-auto shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-semibold bg-amber-600 hover:bg-amber-500 text-white transition-colors disabled:opacity-50"
          >
            {actionLoading === 'manage' ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
            Fix payment
          </button>
        </div>
      )}

      {/* ── Current plan ── */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-1">Current Plan</p>
            <p className="text-2xl font-mono font-bold text-white">
              {isProfessional ? 'Professional' : 'Starter'}
            </p>
            <p className="text-sm text-zinc-400 mt-1">
              {isProfessional ? '$99 / month' : 'Free'}
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-mono"
            style={{
              borderColor: isProfessional ? '#C9A84C40' : '#3f3f46',
              color: isProfessional ? '#C9A84C' : '#71717a',
              backgroundColor: isProfessional ? '#C9A84C10' : 'transparent',
            }}>
            {isProfessional ? '⭐ Professional' : 'Starter'}
          </div>
        </div>

        {/* Period info */}
        {isProfessional && periodEnd && (
          <p className="text-xs text-zinc-500 font-mono mt-4">
            {isCanceling
              ? `Access ends ${periodEnd}`
              : `Renews ${periodEnd}`}
          </p>
        )}

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          {isProfessional ? (
            <button
              onClick={handleManage}
              disabled={actionLoading === 'manage'}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-mono border border-zinc-700 hover:border-zinc-600 text-zinc-300 hover:text-white transition-colors disabled:opacity-50"
            >
              {actionLoading === 'manage'
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <ExternalLink className="h-4 w-4" />}
              Manage subscription
            </button>
          ) : (
            <button
              onClick={handleUpgrade}
              disabled={actionLoading === 'upgrade'}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-mono font-semibold transition-colors disabled:opacity-50"
              style={{ backgroundColor: '#C9A84C', color: '#0a0a0a' }}
            >
              {actionLoading === 'upgrade'
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Zap className="h-4 w-4" />}
              Upgrade to Professional — $99/mo
            </button>
          )}
        </div>
      </div>

      {/* ── Feature comparison ── */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-4">Plan Features</p>
        <div className="space-y-3">
          {FEATURE_ROWS.map(({ label, starter, professional }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-sm text-zinc-300 font-mono">{label}</span>
              <div className="flex gap-16">
                <span className={`text-xs font-mono w-20 text-right ${starter ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  {starter || '—'}
                </span>
                <span className={`text-xs font-mono w-20 text-right ${professional ? 'text-amber-400' : 'text-zinc-600'}`}>
                  {professional || '—'}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-4 pt-4 border-t border-zinc-800">
          <span />
          <div className="flex gap-16">
            <span className="text-xs font-mono text-zinc-500 w-20 text-right">Starter</span>
            <span className="text-xs font-mono text-amber-500 w-20 text-right">Professional</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Feature comparison data ───────────────────────────────────────────────────

const FEATURE_ROWS = [
  { label: 'Loans + contacts',       starter: 'Unlimited',   professional: 'Unlimited' },
  { label: 'AI milestone agent',     starter: '✓',           professional: '✓' },
  { label: 'Email automations',      starter: '✓',           professional: '✓' },
  { label: 'Daily briefing',         starter: '✓',           professional: '✓' },
  { label: 'Scenario Builder',       starter: '✓',           professional: '✓' },
  { label: 'Contact import',         starter: '500 limit',   professional: 'Unlimited' },
  { label: 'Team members',           starter: '1',           professional: 'Up to 5' },
  { label: 'Custom branding',        starter: null,          professional: '✓' },
  { label: 'Custom email templates', starter: null,          professional: '✓' },
  { label: 'Priority support',       starter: null,          professional: '✓' },
  { label: 'API access',             starter: null,          professional: '✓' },
]
```

---

## Settings Page Navigation: Add Billing Link

In `src/app/dashboard/settings/page.tsx`, add a billing link that routes to `/dashboard/settings/billing`. This keeps the settings page architecture simple (billing = separate page, not embedded section).

**Add to nav area** (wherever other section tabs are defined):
```tsx
<Link href="/dashboard/settings/billing">
  <CreditCard className="h-4 w-4" />
  Billing
</Link>
```

---

## Feature Gating: Contact Import Limit

In `src/app/api/import/contacts/route.ts`, add plan check:

```typescript
import { canAccess, getContactImportLimit } from '@/lib/billing/entitlements'

// After getting org:
const importLimit = getContactImportLimit(org.plan as 'starter' | 'professional')
if (contacts.length > importLimit) {
  return NextResponse.json(
    { error: `Import limit exceeded. Starter plan supports up to ${importLimit} contacts. Upgrade to Professional for unlimited imports.` },
    { status: 403 }
  )
}
```

---

## Feature Gating: Team Member Invite

In `src/app/api/org/invite/route.ts` (or wherever member invites are handled):

```typescript
import { getTeamMemberLimit } from '@/lib/billing/entitlements'

// Count existing members + check limit
const { count } = await supabase
  .from('org_members')
  .select('*', { count: 'exact', head: true })
  .eq('organization_id', org.id)

const memberLimit = getTeamMemberLimit(org.plan as 'starter' | 'professional')
if ((count ?? 0) >= memberLimit) {
  return NextResponse.json(
    { error: `Team member limit reached. Upgrade to Professional for up to ${memberLimit} members.` },
    { status: 403 }
  )
}
```

**Note:** Check if `org_members` is the correct table name before writing this.

---

## Upgrade Prompt Component

For use in settings sections that show Professional-only features:

```typescript
// src/components/UpgradePrompt.tsx
import Link from 'next/link'
import { Zap } from 'lucide-react'

export function UpgradePrompt({ feature }: { feature: string }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-lg border border-zinc-800 bg-zinc-900/30">
      <Zap className="h-4 w-4 text-amber-400 shrink-0" />
      <div>
        <p className="text-sm font-mono text-zinc-300">
          {feature} is available on Professional
        </p>
        <Link
          href="/dashboard/settings/billing"
          className="text-xs font-mono text-amber-400 hover:text-amber-300 mt-0.5 block"
        >
          Upgrade to Professional →
        </Link>
      </div>
    </div>
  )
}
```

**Usage:**
```tsx
{!canAccess(org.plan as Plan, 'custom_branding') && (
  <UpgradePrompt feature="Custom branding" />
)}
```

---

## Build Verification Steps

1. Navigate to `/dashboard/settings/billing`
2. Starter plan: shows "Upgrade to Professional" button
3. Starter plan: upgrade button calls `/api/billing/create-checkout` → redirects to Stripe Checkout
4. After test payment: redirects to `/dashboard/settings/billing?success=true` → shows success banner
5. Professional plan: shows "Manage subscription" button → redirects to Stripe Portal
6. Past due: shows warning banner with "Fix payment" CTA
7. `npm run build` — 0 TypeScript errors
