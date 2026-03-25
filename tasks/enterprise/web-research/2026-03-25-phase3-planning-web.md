# Web Research — 2026-03-25 PM
## Topic: Phase 2 Security Validation + Phase 3 Billing/Compliance Planning

---

### Query 1: Supabase RLS INSERT WITH CHECK Security
**Key finding:** Official Supabase docs confirm INSERT policies use WITH CHECK to inspect incoming row values, separate from USING clause (which controls reads). Our migration 055 correctly applied this pattern. The `with_check` condition ensures organization_id on every inserted row equals the caller's org — closes the security gap identified in AM session.
- https://supabase.com/docs/guides/database/postgres/row-level-security (official, authoritative)
- https://makerkit.dev/blog/tutorials/supabase-rls-best-practices (production patterns, multi-tenant)

### Query 2: Stripe Per-Tenant SaaS Billing with Next.js
**Key finding:** Two proven patterns for Phase 3 billing:
1. **Per-seat billing** — Stripe `quantity` field on subscription, auto-updates as members join/leave org
2. **Fixed-tier billing** — starter/pro/enterprise plans with Stripe Checkout + customer portal
Vercel Stripe+Supabase starter kit is a direct reference implementation for our stack.
- https://docs.stripe.com/billing/subscriptions/build-subscriptions (official Stripe)
- https://makerkit.dev/recipes/per-seat-stripe-subscriptions (per-seat pattern)
- https://vercel.com/templates/next.js/stripe-supabase-saas-starter-kit (reference implementation)

### Query 3: GLBA Compliance for Mortgage LO SaaS
**Key finding:** Mortgage brokers fall under GLBA Safeguards Rule (FTC, not OCC). 2023 updates require:
- Encryption at rest and in transit
- MFA for system access
- Penetration testing annually
- Written Information Security Program (WISP)
- Incident response plan with 30-day notification
Shared-database RLS isolation (our current approach) is acceptable at early scale. Enterprise tenants in regulated industries may eventually require schema-per-tenant or database-per-tenant for compliance.
- https://www.saltycloud.com/blog/glba-compliance/ (GLBA 2026 guide)
- https://redis.io/blog/data-isolation-multi-tenant-saas/ (multi-tenant isolation architecture)

---

## Phase 3 Architectural Notes (from research)

**Billing decision needed:**
- Fixed-tier (starter $X/mo, pro $Y/mo, enterprise $Z/mo) → simpler to implement, predictable revenue
- Per-seat → aligns cost with value, but requires usage tracking (user count per org)
- Recommendation: Start with fixed-tier, add per-seat option in Phase 5

**GLBA compliance roadmap for Phase 3 Security Hardening:**
- MFA enforcement (Supabase Auth supports TOTP — enable per-org)
- Audit log completeness (activity_log covers most actions — identify gaps)
- Data retention policy (document how long PII is retained, add delete workflow)
- Penetration test (annual, external — budget $3-10K for third-party)
