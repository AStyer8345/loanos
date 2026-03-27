# NotebookLM Pull Report — 2026-03-27 AM
Active Topic: Phase 3 — Billing + Subscriptions / Tenant Admin MVP

## What We Already Know
- **Billing architecture is fully spec'd**: Fixed-tier model (Starter free, Professional $99/mo), Stripe integration with immediate customer creation at org signup, subscriptions table + denormalized org columns, webhook handler bypassing Supabase auth middleware, feature gating via `canAccessFeature` helper in application code (not RLS).
- **Tenant Admin architecture is fully spec'd**: system_admins table (migration 059), requireAdmin() helper, /admin route map with tenant list/detail/plan override UI.
- **Webhook handler spec is complete**: Production TypeScript for 5 Stripe events with raw body signature verification, upsertSubscription() helper, org_id in Stripe metadata.
- **Billing settings page spec is complete**: Standalone `/dashboard/settings/billing` page with upgrade → Stripe Checkout, portal, plan comparison, past_due warning.
- **Phase 2 is 100% complete**: All multi-tenancy items done (migrations 001-056), RLS across 15 tables, onboarding flow working, plan UI verified.

## Open Questions
- **Stripe env vars**: Are they in Vercel yet? This determines whether this session builds billing or tenant admin.
- **org_members table name**: Needs verification before Tenant Admin build (quick Supabase query).

## Prior Decisions
- Fixed-tier billing for MVP (Starter/Professional), per-seat deferred to Phase 5
- Plan names standardized: 'starter' and 'professional' (code is authoritative)
- Stripe Customer created at org signup (even free tier)
- Feature gating in application code, data isolation in RLS
- Webhook route bypasses Supabase auth middleware
- Stripe-hosted Billing Portal for self-service management
- No shared data between organizations (strict isolation)

## Program-Level Priorities
1. **Stripe setup** (Adam action required) — blocks billing build sessions 1-3
2. **Tenant Admin MVP** — buildable now without Stripe
3. **GLBA compliance** items (MFA, audit logs, incident response) — Phase 3 weeks 5-6

## NotebookLM Knowledge Staleness Alert
The notebook still reports several items as unresolved that were **completed on 2026-03-25**:
- WF1/WF2 cloud push → DONE (2026-03-25)
- activity_log NOT NULL → APPLIED as migration 056 (2026-03-25 PM)
- SEED_LOANS real borrower names → ANONYMIZED (2026-03-25 PM)
- stageNormalization.ts consolidation → COMPLETED + file deleted (2026-03-25 PM)
- Onboarding plan selection UI → VERIFIED working (2026-03-26)

These foundational docs (CONTEXT.md, LOANOS_SYSTEM_KNOWLEDGE_BASE.md) need to be refreshed in the notebook to prevent future query drift.

## Briefing for Research Subagent
Do NOT re-research:
- Billing architecture (fully spec'd in 2026-03-26 specs)
- Webhook patterns (spec complete with production TypeScript)
- Feature gating patterns (decided: application code, not RLS)
- Multi-tenant RLS (Phase 2 closed)

Focus new research on:
- Tenant admin dashboard UX patterns for small SaaS platforms (< 100 tenants)
- Supabase `org_members` or equivalent table schema for role/permission lookups
- System admin authentication patterns (separate table vs role flag)
