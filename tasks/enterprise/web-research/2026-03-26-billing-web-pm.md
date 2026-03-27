# Web Research — Phase 3 Billing (PM Supplement)
Date: 2026-03-26 PM
Session: PM — Architecture continuation (Stripe blocked on Adam's setup)
Queries run: 3
Sources captured: 5

---

## Query 1: Stripe Webhook Handler Next.js App Router 2026

**Key findings:**
- `req.text()` (not `req.json()`) is the definitive pattern for raw body access in App Router webhook routes — required for Stripe signature verification
- Stripe-Signature header + `stripe.webhooks.constructEvent(body, sig, secret)` is the standard verification flow
- The timestamp in the signature is checked automatically by the SDK — events older than 5 minutes are rejected (clock skew protection)
- Even with signature verification: add rate limiting to the webhook route (valid signatures can be replayed)
- Route Handlers are required for Stripe webhooks — Server Actions cannot receive external HTTP POST requests

**Sources:**
- [Stripe Webhooks Official Docs](https://docs.stripe.com/webhooks)
- [How to Handle Stripe Webhooks in Next.js App Router](https://dev.to/thekarlesi/how-to-handle-stripe-and-paystack-webhooks-in-nextjs-the-app-router-way-5bgi)
- [Webhook Security Best Practices 2025-2026](https://dev.to/digital_trubador/webhook-security-best-practices-for-production-2025-2026-384n)

---

## Query 2: Stripe + Supabase + Next.js Feature Gating 2026

**Key findings:**
- Vercel maintains an official Stripe+Supabase+Next.js Starter Kit — confirms our chosen architecture
- Supabase official docs show Stripe webhook handling via Edge Functions, but our App Router route approach is equivalent and preferred (no cold starts, no separate deployment)
- Pattern confirmed: Create Stripe Customer at signup → Create Checkout Session on upgrade → Sync via webhooks → Gate features on plan column
- MakerKit's production SaaS kit uses exactly the same fixed-tier + feature gating approach we've spec'd

**Sources:**
- [Vercel Stripe+Supabase Starter Kit](https://vercel.com/templates/next.js/stripe-supabase-saas-starter-kit)
- [Supabase Handling Stripe Webhooks](https://supabase.com/docs/guides/functions/examples/stripe-webhooks)
- [Stripe Integration Guide Next.js 15 + Supabase](https://dev.to/flnzba/33-stripe-integration-guide-for-nextjs-15-with-supabase-13b5)

---

## Query 3: Tenant Admin Dashboard Design Patterns 2026

**Key findings:**
- Internal admin dashboards in 2026 use collapsible left-sidebar navigation with modular widget layouts
- "North Star Metric" principle: top-left quadrant shows the single most important number (for LoanOS admin: active tenants)
- Feature flag management per tenant is a standard pattern in mature SaaS platforms
- Key data points admin dashboards track: plan tier, last active, usage stats, churn signals
- Drag-and-drop modular layouts are premium-tier; for MVP internal tooling, static layout is sufficient
- Usage telemetry should capture: logins, feature activations, data volume — these inform pricing decisions

**Sources:**
- [SaaS Feature Flags Implementation Guide 2026](https://designrevision.com/blog/saas-feature-flags-guide)
- [Multi-Tenant Deployment: Complete Guide 2026](https://qrvey.com/blog/multi-tenant-deployment/)
- [SaaS Dashboard High-Performance Design 2026](https://www.saasframe.io/blog/the-anatomy-of-high-performance-saas-dashboard-design-2026-trends-patterns)

---

## Architecture Implications for LoanOS

1. **Webhook handler is confirmed correct** — our spec's `req.text()` approach + `createServiceClient()` is the right pattern
2. **Stripe Customer at signup is confirmed** — create customer in `/api/org/create`, pass org_id in metadata
3. **Feature gating on org.plan column is confirmed** — application-level, not RLS
4. **Tenant Admin MVP** — static layout, show: tenant name, plan, user count, last login, payment status; manual plan override
5. **Usage telemetry deferred** — Phase 5 (Usage Metering queue item)
