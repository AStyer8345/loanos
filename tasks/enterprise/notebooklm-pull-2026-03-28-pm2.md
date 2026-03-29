# NotebookLM Pull Report — 2026-03-28 PM2
Active Topic: Phase 3 — LO Onboarding Flow (Session 2: Wizard UI)

## What We Already Know
- Two-stage onboarding: mandatory org creation at `/onboarding` + 4-step Getting Started wizard at `/dashboard/getting-started`
- Stage 2 wizard steps: Welcome (plan-based features) → Connect LOS (Arive webhook URL) → Import Contacts (CSV) → Review Automations
- All data tenant-scoped via RLS on `organization_id`
- Plan assignment defaults to 'starter'; 'professional' ($99/mo) ready when Stripe is configured
- Backend APIs for Session 1 are COMPLETE: migration 060 (5 tracking columns), POST /api/onboarding/step, POST /api/contacts/csv-import, middleware redirect

## Open Questions
- Arive webhook URL: shared single endpoint vs per-tenant URL (ADAM INPUT NEEDED)
- CSV import scope: contacts only vs including loan data (recommendation: contacts only for MVP)
- Professional trial logic: deferred until Stripe is live
- Middleware redirect QA: must verify no infinite loop once /dashboard/getting-started UI exists

## Prior Decisions
- Fixed-tier billing (starter/professional) — per-seat deferred to Phase 5
- Shared DB, shared schema model with RLS isolation
- Stripe Customer created immediately at org signup (even free tier)
- org_settings tracks onboarding state (not a separate table)
- Step-level persistence: each wizard step independently tracked (setup_arive_done, setup_import_done, setup_automations_done)

## Program-Level Priorities
1. **[ADAM ACTION]** Stripe env vars in Vercel — blocks billing build sessions 1-3
2. **[ADAM ACTION]** system_admins INSERT SQL after migration 059 deploys
3. **[BUILD]** GettingStartedWizard.tsx + page wrapper + dashboard banner (THIS SESSION)
4. **[ADAM INPUT]** Arive webhook scoping decision

## Briefing for Build Session
Do NOT re-research:
- Onboarding architecture (fully spec'd)
- CSV import pipeline (built in Session 1)
- Middleware redirect logic (already implemented)

Focus this session on:
- Build GettingStartedWizard.tsx client component (4 steps)
- Build getting-started/page.tsx server wrapper
- Build dashboard banner for resuming setup
- Verify middleware redirect doesn't loop
- Run npm run build — 0 errors
