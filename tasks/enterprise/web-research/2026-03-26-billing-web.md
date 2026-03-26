# Web Research — 2026-03-26 AM
## Topic: Phase 3 — Stripe Billing + Subscriptions for Next.js/Supabase SaaS

---

### Query 1: Stripe Subscription Billing + Supabase + Next.js Best Practices 2026
**Key findings:**
- Stripe Checkout Sessions created via Next.js API routes (or Server Actions) is the standard pattern
- Subscription data synced to Supabase via webhooks — never trust client-side success URLs alone
- Vercel has an official Stripe + Supabase SaaS starter kit that serves as reference implementation
- Upgrades use `stripe.subscriptions.update()` with `proration_behavior: 'create_prorations'`
- Downgrades apply at end of billing period with `proration_behavior: 'none'`

**Sources (authoritative):**
- https://docs.stripe.com/billing/subscriptions/build-subscriptions (official Stripe docs)
- https://vercel.com/templates/next.js/stripe-supabase-saas-starter-kit (Vercel reference implementation)
- https://github.com/vercel/nextjs-subscription-payments (open source reference)

### Query 2: Fixed-Tier vs Per-Seat Pricing for Mortgage Fintech 2026
**Key findings:**
- Per-seat pricing is declining — IDC forecasts 70% of vendors will refactor away from pure per-seat by 2028
- AI agent adoption reduces seat count, making per-seat less predictable for vendors
- **Countertrend:** Buyers prefer predictable, budgetable pricing. Per-seat maps to existing procurement budgets.
- For mortgage LO SaaS: fixed-tier is correct. Individual LOs don't scale by adding seats — they scale by loan volume.
- Hybrid models (base tier + usage component) are gaining traction in fintech

**Sources (authoritative):**
- https://www.nxcode.io/resources/news/saas-pricing-strategy-guide-2026 (2026 pricing guide)
- https://editorialge.com/saas-trends-q1/ (seat-based pricing decline trend)
- https://blog.alguna.com/saas-pricing-models/ (SaaS pricing models 2026)

### Query 3: Stripe Webhooks + Next.js App Router Pattern 2026
**Key findings:**
- Route Handlers (not Server Actions) required for webhooks — Stripe needs a static URL to POST to
- "Golden Pattern": `app/api/webhooks/stripe/route.ts` with raw body + signature verification
- Critical: use `req.text()` not `req.json()` for signature verification to work
- Key lifecycle events: `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`
- Server Actions OK for creating Checkout Sessions, but webhooks are how you actually fulfill orders

**Sources (authoritative):**
- https://dev.to/thekarlesi/stripe-subscription-lifecycle-in-nextjs-the-complete-developer-guide-2026-4l9d (2026 lifecycle guide)
- https://dev.to/thekarlesi/how-to-handle-stripe-and-paystack-webhooks-in-nextjs-the-app-router-way-5bgi (App Router webhook pattern)
- https://www.pedroalonso.net/blog/stripe-subscriptions-nextjs/ (practical implementation)

---

## Architecture Implications for LoanOS

1. **Webhook route must bypass Supabase auth middleware** — it receives Stripe POST requests, not user requests
2. **Stripe Customer created at org signup** — ensures upgrade flow is seamless (customer already exists)
3. **Fixed-tier pricing confirmed** — Starter (free) + Professional ($99/mo) aligns with mortgage LO market
4. **Denormalize subscription status onto organizations** — avoids JOIN on every feature-gating check
5. **Stripe Billing Portal for self-service** — reduces support burden for plan changes, payment updates
