# NotebookLM Pull Report — 2026-03-25 AM
Active Topic: Week 1 — Multi-Tenant RLS Architecture + Tenant Isolation

---

## What We Already Know

LoanOS multi-tenancy uses a **Shared Database, Shared Schema model** with Supabase PostgreSQL Row-Level Security. All tenants (mortgage organizations) share the same tables but remain logically isolated at the database layer via `organization_id` column + RLS policies.

**Foundation is complete as of 2026-03-25:**
- 15 tables confirmed org-scoped (loans, contacts, documents, email_drafts, scenarios, todo_items, contact_activity, chat_sessions, activity_log, contact_emails, marketing_activity_log, mcc_state, user_settings, org_settings, system_prompts)
- 8 tables hardened with NOT NULL on organization_id (Migration 053): loans, contacts, documents, email_drafts, scenarios, todo_items, contact_activity, chat_sessions
- All RLS policies reviewed and confirmed correct — no cross-tenant gaps
- `get_my_organization_id()` function used in all policies
- daily-briefing route scoped fix applied (milestone_events + milestone_communications)
- 0 null org rows confirmed across all 9 audited tables
- Isolation verification script exists and passes

**Core architectural decisions locked:**
- Shared database/schema model (not per-tenant schema or database)
- No shared data between organizations
- RLS is primary isolation — server-side routes must also explicitly scope queries
- Per-tenant n8n automation (each org gets own webhook endpoints)
- One org per LO by default; Team plan supports multiple users per org

## Open Questions

1. **activity_log NOT NULL hardening** — can it be applied safely? Blocked on WF1/WF2 cloud push confirmation
2. **Performance page localStorage** — when does this get migrated to Supabase? Blocks enterprise licensing
3. **Two competing stage normalization systems** — stageNormalization.ts vs loan-stages.ts — need consolidation?
4. **Onboarding plan selection** — defaulting to 'starter' for now; when does the UI get built?
5. **Stripe billing** — not started; what's the minimum viable billing integration for Phase 4 launch?
6. **White-label readiness** — no per-tenant theming or custom domain support yet (Week 6 in queue)
7. **Admin dashboard** — no cross-tenant visibility tools yet (Week 8 in queue)

## Prior Decisions

| Decision | Status |
|----------|--------|
| Shared DB/schema multi-tenancy | ✅ Locked |
| No shared cross-tenant data | ✅ Locked |
| RLS + explicit server-side scoping | ✅ Locked |
| get_my_organization_id() for all policies | ✅ Locked |
| Per-tenant n8n webhooks | ✅ Locked |
| activity_log nullable until WF1/WF2 confirmed | ✅ Active constraint |
| Outlook Email Sync possibly decommissioned | 🔍 Under review |
| Team plan: multiple users per org | ✅ Architecture supports |

## Program-Level Priorities

1. **Confirm WF1/WF2 pushed to n8n cloud** → unblocks activity_log NOT NULL hardening
2. **Migrate Performance page** from localStorage to Supabase (org-scoped)
3. **Build onboarding plan selection UI** (currently defaults to 'starter')
4. **Start Week 2: Onboarding Flow** — the foundation is ready
5. **Consolidate stage normalization** (stageNormalization.ts + loan-stages.ts)

## Briefing for Research Subagent

**Do NOT re-research** (already established):
- Shared DB/schema model rationale
- RLS policy structure with get_my_organization_id()
- NOT NULL hardening approach
- Table-level org_id audit methodology

**Focus new research here instead:**
- Best practices for migrating localStorage data to Supabase in a Next.js SaaS context (Performance page fix)
- Week 2 onboarding flow patterns — SaaS setup wizard best practices for mortgage LO tools
- Stripe integration patterns for Supabase + Next.js SaaS (minimal viable billing)
- Whether Outlook Email Sync should be replaced with a simpler per-tenant email integration
- Consolidation approach for dual stage normalization systems
