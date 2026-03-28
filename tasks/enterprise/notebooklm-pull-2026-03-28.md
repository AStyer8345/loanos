# NotebookLM Pull Report — 2026-03-28 AM
Active Topic: Phase 3 — LO Onboarding Flow (Build)

## What We Already Know
- Full 4-step Getting Started wizard spec exists (2026-03-27): Welcome → Connect LOS (Arive) → Import Contacts (CSV) → Review Automations → Completion
- Migration 060 defined: adds 5 columns to org_settings (onboarding_completed, onboarding_step, setup_arive_done, setup_import_done, setup_automations_done)
- 2 new API routes specified: POST `/api/onboarding/step` and POST `/api/contacts/csv-import`
- papaparse + @types/papaparse needed for CSV parsing
- Middleware redirect: `/dashboard` root → `/dashboard/getting-started` when onboarding_completed=false
- Dashboard banner when onboarding incomplete
- Architecture decision: separate `/dashboard/getting-started` page, NOT extending current `/onboarding`
- Current `/onboarding` + `/api/org/create` is working — stores plan as 'starter' or 'professional'
- No external dependencies — this can build independently of Stripe

## Open Questions
1. **Arive webhook URL scoping** — shared single URL or per-tenant? Current assumption: single shared, org scoping in n8n. ADAM INPUT NEEDED.
2. **CSV import scope** — contacts only (recommended) or also loans? Recommendation: contacts only for MVP.
3. **Professional trial logic** — deferred until Stripe is live.

## Prior Decisions
- Fixed-tier billing: starter (free) / professional ($99/mo) — per-seat deferred to Phase 5
- Feature gating in application code (canAccessFeature helper), NOT via RLS
- system_admins table for super-admin access (migration 059 applied)
- Tenant Admin MVP COMPLETE — tenant list, detail, plan override all built
- Phase 2 fully closed (migrations 001-056, all RLS, NOT NULL hardening)

## Program-Level Priorities
1. **LO Onboarding Build** — top priority, no blockers, spec ready (this session)
2. **Stripe env vars** — Adam action required, blocks billing build sessions 1-3
3. **system_admins seed** — Adam must run INSERT after migration 059 deploys
4. **Arive webhook scoping** — decision needed before Step 1 UI ships to real tenants

## Notebook Housekeeping
- Removed 2 wrong-project sources: `domain-queue.md` and `2026-03-26-tier2-web-research.md` (from Scenarios notebook)
- Current source count: 48

## Briefing for Build Session
This is Build Session 1. The spec is at `tasks/enterprise/specs/2026-03-27-phase3-lo-onboarding-spec.md`.

**Do NOT re-research. The spec is complete. Execute it:**
1. Apply migration 060 via Supabase MCP
2. `npm install papaparse @types/papaparse`
3. Create `/api/onboarding/step/route.ts`
4. Create `/api/contacts/csv-import/route.ts`
5. `npm run build` — verify 0 errors

**Gaps to watch for during build:**
- org_settings table may not have all expected columns — verify schema before migration
- CSV import needs batch processing for large files (chunk at 100 rows)
- Middleware redirect must ONLY fire on `/dashboard` root, never sub-paths
