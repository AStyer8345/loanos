# NotebookLM Pull Report — 2026-03-29 AM
Active Topic: Phase 3 — White-Label Options (Billing blocked on Stripe)

---

## What We Already Know

### Database Foundation (Already Built)
- `organizations` table has `slug`, `logo_url`, `brand_color` columns (Migration 039)
- Feature gating decision made: custom branding = Professional plan only ($99/mo)
- Entitlement enforcement will be app-level via `canAccessFeature` helper, not RLS

### Custom Domains
- `slug` column exists as tenant identifier for URL routing (e.g., `styer-mortgage`)
- Vercel multi-tenant architecture supports unlimited custom domains, auto-SSL, subdomain routing
- Middleware guard already enforces org context — will expand for domain routing
- Originally classified as Phase 4 scope, but enterprise-queue.md lists it as next Phase 3 item

### Custom Email From-Addresses
- Custom email templates restricted to Professional tier
- Supabase Auth Hooks can bypass default templates and send via custom provider (Resend/Postmark)
- "Internal Email Mapping" pattern referenced for perfect isolation (one email, separate contexts per tenant)

### Per-Tenant Branding
- Logo + brand color columns exist but NO UI exists for uploading/setting them
- No settings page for tenant customization yet

## Open Questions

1. **Custom domain routing approach**: Subdomain-based (`tenant.loanos.app`) vs. custom CNAME support? Or both?
2. **Email provider**: Supabase Auth Hooks vs. custom SMTP per tenant vs. shared sender with per-tenant reply-to?
3. **Internal email mapping**: Adopt complex pattern or keep current "one org per user profile" model?
4. **Arive webhook scoping**: Shared endpoint or unique per-tenant URLs? (Carried from prior sessions)
5. **White-label scope for Phase 3**: How much of the full white-label vision to build now vs. defer to Phase 4?
6. **Branding UI**: Where should logo/color settings live — org settings page, onboarding wizard, or both?

## Prior Decisions

- Custom branding = Professional plan entitlement (decided in billing spec)
- `canAccessFeature` helper enforces at app level (decided in billing spec)
- Database columns for branding already exist (Migration 039)
- Slug-based tenant identification (decided in Phase 2)
- White-Label Options listed in enterprise-queue.md as Phase 3 queue item

## Program-Level Priorities

1. **Stripe env vars** — BLOCKED. Adam must add STRIPE_SECRET_KEY + 3 other vars to Vercel. Billing build sessions 1-3 cannot start.
2. **system_admins INSERT** — BLOCKED. Adam must run `INSERT INTO system_admins (user_id) SELECT id FROM auth.users WHERE email = 'adam@thestyerteam.com';` after migration 059 deploys.
3. **Arive webhook scoping** — Decision needed from Adam: shared or per-tenant?
4. **White-Label architecture** — Next buildable item (no external dependencies for architecture phase)

## Briefing for Research Subagent

**DO NOT re-research:**
- Multi-tenant RLS architecture (Phase 2, complete)
- Billing tier structure (decided: Starter free, Professional $99/mo)
- LO Onboarding flow (complete, all 3 sessions done)
- Tenant Admin MVP (complete, migration 059 + 8 admin files)
- Database schema for branding columns (already in organizations table)

**FOCUS new research on:**
- Gap 1: Next.js middleware patterns for subdomain + custom domain routing in multi-tenant SaaS (Vercel for Platforms specifics)
- Gap 2: Per-tenant email sender configuration — Resend vs. Postmark vs. custom SMTP, and how to integrate with Supabase Auth Hooks
- Gap 3: Tenant branding engine — how to inject org-specific logo/colors into a shared Next.js app (CSS variables? Tailwind config? Server component props?)
- Gap 4: DNS/SSL automation for custom domains — Vercel Domains API, wildcard certificates, CNAME validation flow
- Gap 5: Real-world examples of mortgage/fintech SaaS white-label implementations (competitive intelligence)
