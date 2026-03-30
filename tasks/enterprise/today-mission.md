## Mission Brief — 2026-03-30 AM

### Focus Area
Phase 3 — White-Label Options, Build Session 1: Branding Engine

### Session Type
[x] Build

### Objectives
1. Apply migration 063 (slug UNIQUE + custom_email_reply_to on org_settings)
2. Create `src/lib/branding/getBranding.ts` — server helper returning brand data
3. Modify `src/app/layout.tsx` — inject `--brand-primary` CSS custom property from org branding
4. Create branding API route: `src/app/api/org/settings/branding/route.ts` (PATCH brand_color + logo_url)
5. Create branding settings page: `src/app/dashboard/settings/branding/page.tsx` (color picker + preview)
6. Create `canAccessFeature()` stub (billing not built yet)
7. Build passes with 0 TypeScript errors

### Files in Scope
- `supabase/migrations/063_whitelabel_slug_and_email.sql` (create)
- `src/lib/branding/getBranding.ts` (create)
- `src/lib/billing/entitlements.ts` (create — stub)
- `src/app/layout.tsx` (modify — CSS var injection)
- `src/app/api/org/settings/branding/route.ts` (create)
- `src/app/dashboard/settings/branding/page.tsx` (create)
- `src/lib/database.types.ts` (modify — add custom_email_reply_to to org_settings type)

### Definition of Done
- [ ] Migration 063 applied in Supabase (slug UNIQUE, custom_email_reply_to)
- [ ] getBranding() returns correct brand data for authenticated org
- [ ] Root layout injects --brand-primary CSS var for logged-in users
- [ ] Branding settings page: color picker + hex input + live preview
- [ ] API route validates hex, updates organizations table
- [ ] canAccessFeature stub returns true for 'professional' plan
- [ ] `npm run build` passes 0 TypeScript errors

### HIGH RISK Items
- `dangerouslySetInnerHTML` in root layout — mitigated by hex-only regex validation before storage
- Root layout becomes async — Next.js 14 supports async server components

### Notes
- @vercel/blob NOT installed — logo upload deferred (color branding only this session)
- canAccessFeature() is a stub — billing not built yet
- Stripe env vars still blocked. DNS confirmation still needed for Session 2.
