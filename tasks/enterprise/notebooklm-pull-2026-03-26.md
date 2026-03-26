# NotebookLM Pull Report — 2026-03-26 AM
Active Topic: Phase 3 — Billing + Subscriptions

## What We Already Know
- Organizations table has a `plan` column (string) — currently stores 'starter' or 'professional'
- 2 orgs exist: Adam Styer | Mortgage Solutions LP (starter) and LoanOS Demo Account (starter)
- Onboarding page has a working plan selection UI (Starter = Free, Professional = $99/mo)
- `/api/org/create` validates and stores selectedPlan — defaults to 'starter' if not 'professional'
- Stripe is the confirmed billing provider — no code exists yet, only architectural decisions
- Fixed-tier billing recommended for MVP, per-seat as Phase 5 option
- The LOANOS_SYSTEM_KNOWLEDGE_BASE references 3 tiers: 'starter', 'pro', 'team' — but actual code uses 'starter' and 'professional'. This naming discrepancy needs resolution.

## Open Questions
1. **Tier naming**: Code uses 'starter'/'professional' but knowledge base references 'starter'/'pro'/'team'. Which is authoritative? Need to standardize.
2. **Feature gating**: No application-level feature gating exists. What features are gated per tier?
3. **Free tier limits**: Is 'starter' truly free forever, or is it a trial? If free, what's gated?
4. **Stripe Customer creation**: When does the Stripe customer get created — at org creation or first upgrade?
5. **Subscription table**: Do we need a `subscriptions` table in Supabase, or just sync from Stripe webhooks?
6. **Payment failure handling**: What happens when payment fails? Grace period? Downgrade?
7. **Admin override**: Can Adam manually upgrade/downgrade tenants without Stripe?

## Prior Decisions
- Shared database, shared schema, RLS isolation (decided Week 1, confirmed)
- Stripe as billing provider (decided in knowledge base)
- Fixed-tier before per-seat (decided in Phase 3 planning research)
- No Stripe integration before Phase 3 formally starts (constraint — now lifted, Phase 3 is active)

## Program-Level Priorities
1. Phase 3 architecture spec for Billing + Subscriptions (THIS SESSION)
2. Stripe webhook infrastructure + subscriptions table
3. Feature gating middleware/helper
4. Customer portal for self-service plan management
5. GLBA compliance items (MFA, audit log completeness) — Week 5-6

## Briefing for Research Subagent
Do NOT re-research:
- Multi-tenant RLS architecture (done, Phase 2 complete)
- Supabase RLS patterns (done, all policies verified)
- General Stripe overview (done in 2026-03-25 web research)

Focus new research on:
- Stripe Customer Portal integration with Next.js App Router
- Webhook signature verification pattern for Supabase + Next.js
- Feature entitlement patterns (plan-based feature gating in React/Next.js)
