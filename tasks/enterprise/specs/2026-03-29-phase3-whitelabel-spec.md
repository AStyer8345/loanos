# Phase 3 — White-Label Options Architecture Spec
Date: 2026-03-29
Author: Enterprise Architect Subagent
Status: READY TO BUILD (no external dependencies)

---

## Overview

White-label support enables each tenant to present LoanOS under their own brand identity. For Phase 3, this means:
- Per-tenant logo + brand color (CSS variable injection)
- Subdomain routing (`tenant.loanos.app`) — each LO gets their own URL
- Branding settings UI in the dashboard

Custom CNAME domains and per-tenant email from-addresses are scoped to Phase 4 (requires Vercel Domains API provisioning flow and Resend domain verification per tenant).

---

## Foundation Already Built

| Asset | Location | Status |
|-------|----------|--------|
| `organizations.brand_color` | Supabase | ✅ exists (nullable string) |
| `organizations.logo_url` | Supabase | ✅ exists (nullable string) |
| `organizations.slug` | Supabase | ✅ exists (nullable string, e.g. "styer-mortgage") |
| `getOrganization()` helper | `src/lib/auth/organization.ts` | ✅ loads org on each request |
| Middleware | `src/middleware.ts` | ✅ exists, handles onboarding redirect |
| Vercel deployment | loanos.vercel.app | ✅ loanos.app domain on Vercel |

No new package installs required. No external API dependencies.

---

## Database Schema Changes

### Migration 063 — `organizations` slug constraints + `org_settings` email column

```sql
-- 063_whitelabel_slug_and_email.sql

-- Ensure slug is unique and URL-safe
ALTER TABLE organizations
  ADD CONSTRAINT organizations_slug_unique UNIQUE (slug);

-- Add custom_email_reply_to for per-tenant reply-to override (Phase 3 email branding)
ALTER TABLE org_settings
  ADD COLUMN custom_email_reply_to TEXT DEFAULT NULL;
-- Example: 'adam@thestyerteam.com' — used as Reply-To header in all org's outbound emails

COMMENT ON COLUMN org_settings.custom_email_reply_to IS 'LO reply-to email for outbound communications. Leave null to use org owner email.';
```

No RLS changes needed — organizations and org_settings already have org-scoped RLS.

**Risk level: LOW** — additive only. Unique constraint on slug requires all existing slugs to be unique (they are — only 2 orgs exist, both have distinct slugs per prior session audit).

---

## Session 1: Branding Engine (Recommended first — no routing complexity)

### What Gets Built

**Files to create:**
- `src/lib/branding/getBranding.ts` — server helper that loads org's brand_color and logo_url
- `src/app/dashboard/settings/branding/page.tsx` — branding settings UI

**Files to modify:**
- `src/app/layout.tsx` — inject CSS custom properties into root layout
- `src/app/dashboard/layout.tsx` — (if needed) pass org brand to dashboard children

**Migration to apply:**
- `supabase/migrations/063_whitelabel_slug_and_email.sql`

---

### `src/lib/branding/getBranding.ts`

```typescript
import { createClient } from '@/lib/supabase/server'
import { getOrganization } from '@/lib/auth/organization'

export interface OrgBranding {
  logoUrl: string | null
  brandColor: string | null // hex, e.g. "#C9A84C"
  orgName: string
  slug: string | null
}

// Default LoanOS branding (fallback when org has no custom branding)
export const DEFAULT_BRANDING: OrgBranding = {
  logoUrl: null,
  brandColor: '#C9A84C', // LoanOS gold
  orgName: 'LoanOS',
  slug: null,
}

export async function getBranding(): Promise<OrgBranding> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return DEFAULT_BRANDING

    const org = await getOrganization()
    if (!org) return DEFAULT_BRANDING

    return {
      logoUrl: org.logo_url ?? null,
      brandColor: org.brand_color ?? DEFAULT_BRANDING.brandColor,
      orgName: org.name,
      slug: org.slug ?? null,
    }
  } catch {
    return DEFAULT_BRANDING
  }
}

// Converts hex color to CSS custom properties for Tailwind hsl() compatibility
// Only used if we want HSL injection — for Phase 3 MVP, raw hex is sufficient
export function brandColorToCssVars(hex: string): string {
  return `--brand-primary: ${hex}; --brand-primary-hex: ${hex};`
}
```

---

### Root Layout Injection Pattern (`src/app/layout.tsx`)

Add branding CSS variables in the `<head>` inside a `<style>` tag:

```tsx
// In RootLayout (server component)
import { getBranding } from '@/lib/branding/getBranding'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const branding = await getBranding()

  const cssVars = branding.brandColor
    ? `--brand-primary: ${branding.brandColor};`
    : ''

  return (
    <html lang="en">
      <head>
        {cssVars && (
          <style dangerouslySetInnerHTML={{ __html: `:root { ${cssVars} }` }} />
        )}
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}
```

**Why `dangerouslySetInnerHTML`**: Required for injecting a `<style>` tag with dynamic content in server components. The content is 100% controlled — brand_color comes from our database, not user input. Input sanitization (hex validation) happens in the branding settings API route.

**Tailwind usage after injection:**
```css
/* In globals.css or component CSS */
.accent-color { color: var(--brand-primary, #C9A84C); }
.accent-bg { background-color: var(--brand-primary, #C9A84C); }
```

---

### `src/app/dashboard/settings/branding/page.tsx`

Branding settings page with:
- Logo upload (via Vercel Blob — `@vercel/blob`)
- Brand color picker (hex input + color swatch preview)
- Live preview section (shows logo + color applied to a mock nav bar)
- Save button → PATCH `/api/org/settings/branding`

**Files to also create:**
- `src/app/api/org/settings/branding/route.ts` — PATCH handler
  - Validates hex color (regex: `/^#[0-9A-Fa-f]{6}$/`)
  - Uploads logo to Vercel Blob if file provided
  - Updates `organizations.brand_color` and `organizations.logo_url`
  - Returns updated branding object

**Entitlement check:**
- `canAccessFeature('customBranding', plan)` — Professional tier only
- Starter plan sees the page but with an upgrade prompt (UpgradePrompt component from billing UI spec)

---

## Session 2: Subdomain Routing

### What Gets Built

**Files to modify:**
- `src/middleware.ts` — extend to detect subdomain + set `X-Tenant-Slug` header
- `src/app/layout.tsx` — read tenant from header if subdomain context

**Files to create:**
- `src/lib/tenant/getTenantFromHostname.ts` — parses hostname → slug
- `src/app/api/org/settings/domain/route.ts` — GET/PATCH for org's custom slug

---

### Subdomain Routing Pattern

```typescript
// src/lib/tenant/getTenantFromHostname.ts

export function getTenantSlugFromHostname(hostname: string): string | null {
  // Production: tenant.loanos.app
  // Preview: tenant.loanos-self.vercel.app (Vercel preview deployments)
  // Local dev: tenant.localhost:3000

  const productionDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'loanos.app'

  // Strip port if present
  const host = hostname.split(':')[0]

  if (host === productionDomain || host === `www.${productionDomain}`) {
    return null // Root domain — no tenant slug
  }

  // Check if it's a subdomain of the root domain
  if (host.endsWith(`.${productionDomain}`)) {
    return host.replace(`.${productionDomain}`, '')
  }

  // Local dev: anything.localhost
  if (host.endsWith('.localhost')) {
    return host.replace('.localhost', '')
  }

  return null
}
```

```typescript
// Middleware extension (adds to existing middleware.ts)
// After existing auth check:

import { getTenantSlugFromHostname } from '@/lib/tenant/getTenantFromHostname'

const hostname = request.headers.get('host') ?? ''
const tenantSlug = getTenantSlugFromHostname(hostname)

if (tenantSlug) {
  // Attach tenant slug for downstream server components
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('X-Tenant-Slug', tenantSlug)
  return NextResponse.next({ request: { headers: requestHeaders } })
}
```

### DNS Setup Required (Adam Action)

1. Add wildcard `*.loanos.app` to the LoanOS Vercel project
2. Ensure loanos.app nameservers are Vercel's (`ns1.vercel-dns.com`, `ns2.vercel-dns.com`)
3. Each LO's subdomain (`styer.loanos.app`) resolves automatically — no per-tenant DNS config needed

**OPEN QUESTION for Adam:** Is loanos.app currently using Vercel nameservers or CNAME method? Wildcard requires Vercel nameservers.

---

### Domain Settings API

```typescript
// src/app/api/org/settings/domain/route.ts

// GET — returns current slug + preview URL
// PATCH — validates slug availability (unique in organizations table), updates org slug
// Validation rules:
//   - 3-50 chars
//   - Lowercase alphanumeric + hyphens only: /^[a-z0-9-]+$/
//   - Must not be a reserved word: ['admin', 'api', 'app', 'www', 'mail', 'dashboard', 'loanos']
//   - Must be unique in organizations.slug column
```

---

## Session 3: Settings UI + Polish

### What Gets Built

- Branding settings page in `/dashboard/settings` tab navigation
- Domain settings section: current subdomain display + slug edit
- Reply-to email field: per-tenant email address for outbound comms
- Integration with entitlements: Professional plan gate on branding + custom slug

### Settings Tab Addition

Currently `/dashboard/settings` has tabs for: Account, Integrations, Notifications (assumed structure).
Add: **Branding** tab (logo, color, domain slug, reply-to email).

The branding tab should check `canAccessFeature('customBranding', plan)`:
- Professional: full editor
- Starter: read-only preview with UpgradePrompt

---

## Risk Register

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| `dangerouslySetInnerHTML` in root layout | LOW | MEDIUM | brand_color is validated to hex-only regex before storage — no XSS vector |
| Slug uniqueness constraint breaks existing slug | LOW | LOW | Only 2 orgs; both have distinct slugs; constraint is additive |
| Subdomain routing breaks existing middleware | MEDIUM | HIGH | Add tenant slug detection AFTER all existing auth checks; test on localhost first |
| CSS variable injection adds latency | LOW | LOW | DB call is already made for org lookup; getBranding() reuses same request scope |
| Blob upload fails for large logos | LOW | MEDIUM | Validate file type (png/jpg/svg only) + max size (500KB) client-side before upload |

---

## Open Questions for Adam

1. **DNS method**: Is loanos.app using Vercel nameservers or CNAME? Wildcard subdomain requires nameservers.
2. **Slug for existing org**: Adam's org slug is... what? Check: `SELECT slug FROM organizations WHERE name ILIKE '%styer%'`
3. **Branding scope**: Does the white-label apply to the public-facing onboarding page (`/onboarding`) as well, or just the authenticated dashboard?
4. **Logo placement**: Header nav only? Or also PDF outputs (Scenario Builder), email templates?

---

## Build Sequence Summary

| Session | Focus | Files | Migration |
|---------|-------|-------|-----------|
| Session 1 | Branding engine | getBranding.ts, layout.tsx update, branding/page.tsx, branding API route | 063 |
| Session 2 | Subdomain routing | middleware.ts update, getTenantFromHostname.ts, domain API route | None |
| Session 3 | Settings UI + polish | Settings branding tab, reply-to field, entitlement gates, end-to-end QA | None |

---

## Definition of Done

- [ ] Migration 063 applied with 0 errors
- [ ] `getBranding()` returns correct brand data for authenticated org
- [ ] Root layout injects `--brand-primary` CSS var for logged-in users
- [ ] Branding settings page allows logo upload + color change, saves to Supabase
- [ ] Subdomain `styer.loanos.app` routes to Adam's org dashboard (requires DNS wildcard setup)
- [ ] Slug edit validates uniqueness + reserved words
- [ ] `custom_email_reply_to` stored in org_settings, used in email dispatch
- [ ] Starter plan users see UpgradePrompt on branding tab
- [ ] `npm run build` passes 0 TypeScript errors
- [ ] No regressions to existing auth, onboarding, or tenant admin flows

---

## Dependency Map

```
getBranding.ts
  → getOrganization() (already exists)
  → createClient() (already exists)
  → organizations.brand_color, logo_url, slug (already in DB)

Middleware subdomain routing
  → getTenantFromHostname.ts (new)
  → src/middleware.ts (existing, extend)
  → NEXT_PUBLIC_ROOT_DOMAIN env var (add to Vercel)

Branding settings page
  → @vercel/blob (already installed — used by existing file upload)
  → canAccessFeature() (from billing spec — build Session 1 adds this)
  → organizations PATCH (new API route)

Migration 063
  → organizations.slug UNIQUE constraint (2 orgs, both distinct slugs — safe)
  → org_settings.custom_email_reply_to (new nullable column)
```

---

## Next Session Instructions

**Before building:** Confirm with Adam:
1. Is loanos.app on Vercel nameservers? (`dig NS loanos.app` → should show vercel-dns.com)
2. What is Adam's org slug? (Supabase query above)

**Build Session 1** (no blockers):
1. Apply migration 063
2. Create `src/lib/branding/getBranding.ts`
3. Modify `src/app/layout.tsx` — inject CSS vars
4. Create `src/app/dashboard/settings/branding/page.tsx`
5. Create `src/app/api/org/settings/branding/route.ts`
6. Run `npm run build` — verify 0 errors

Spec references: This file (Session 1 section above)
