# NotebookLM Staleness Audit — 2026-03-27 PM

Notebook: LoanOS Enterprise (54 sources — over 50 max limit)
Active Phase: Phase 3 — Billing + Subscriptions (Stripe build blocked)
Phase 2 (Multi-Tenancy): 100% COMPLETE as of 2026-03-25 PM

---

## Sources Flagged as Stale — REMOVE

| Source ID | Title | Reason | Action |
|-----------|-------|--------|--------|
| b8750659 | Custom Claims & RBAC Supabase Docs (2nd copy) | Duplicate of fcd9fc78 source on same URL pattern | REMOVE |
| e2059804 | Row Level Security Supabase Docs (auth/row-level-security) | Duplicate — index 33 (04b7b1a0) is better curated PM-session version | REMOVE |
| 23a68d21 | How to Scale Tables with Time-Based Partitioning — OneUptime | PostgreSQL partitioning not relevant to Phase 3 billing | REMOVE |
| 21fee668 | Partition Tables and RLS — Answer Overflow | Phase 2 schema work complete | REMOVE |
| 248a4695 | Partitioning tables — Supabase Docs | Phase 2 schema work complete | REMOVE |
| 11e923ec | Schema Design with Supabase: Partitioning + Normalization | Phase 2 schema work complete | REMOVE |
| 1093c0c7 | Auto-Generate Profile for Every User with PostgreSQL Triggers — egghead | Auth trigger pattern no longer needed; Phase 2 done | REMOVE |
| 0ba30e86 | Mastering Supabase RLS as Beginner — DEV Community | Beginner tutorial superseded by production-grade RLS sources now in notebook | REMOVE |
| f40e378c | Free tool that catches Supabase security mistakes — Reddit | Security audit phase complete; Phase 2 RLS verified | REMOVE |
| 04897104 | Setting tenant in multi-tenant setup — Reddit | Phase 2 multi-tenant setup complete | REMOVE |
| a38c37c0 | Supabase Test Suite — GitHub | Testing phase not active; low value for Phase 3 | REMOVE |
| 162b72d1 | Testing Overview — Supabase Docs | Testing phase not active; low value for Phase 3 | REMOVE |
| 46cac447 | Token Security and Row Level Security — Supabase Docs | Phase 2 token/RLS work complete | REMOVE |
| 514b0d38 | postgres role lacks ownership of auth.users — GitHub Discussion | Specific Phase 2 bug reference; resolved | REMOVE |
| 041be9ca | row-level security policies in Supabase for multitenant — GitHub | Phase 2 complete | REMOVE |
| 30a23d96 | Supabase RLS Security Audit with MCP — Continue Docs | RLS audit complete; Phase 2 closed | REMOVE |

**Total removals: 16 → brings notebook from 54 to 38 sources**

---

## Sources Confirmed Current — KEEP

| Source | Age | Status |
|--------|-----|--------|
| CONTEXT.md (39627524) | 2 days | CURRENT — last commit 2026-03-25 confirmed |
| LOANOS_SYSTEM_KNOWLEDGE_BASE.md (92c89f4c) | 2 days | CURRENT |
| CLAUDE.md (451f9251) | 2 days | CURRENT |
| 2026-03-26-phase3-billing-spec.md (55fe7709) | 1 day | CURRENT — main Phase 3 architecture |
| 2026-03-26-billing-web.md (fcd9fc78) | 1 day | CURRENT — Phase 3 web research |
| Stripe Subscription Lifecycle (2b32fb5c) | 1 day | CURRENT |
| SaaS Pricing Strategy Guide 2026 (b2ea0ca5) | 1 day | CURRENT |
| Stripe Build Subscriptions docs (8b6a6666) | 1 day | CURRENT |
| Stripe billing webhooks (5222630e) | 1 day | CURRENT |
| Stripe subscriptions overview (2d3755c3) | 1 day | CURRENT |
| Per-seat billing — MakerKit (c7728558) | 2 days | CURRENT |
| GLBA Compliance 2026 (1556f041) | 2 days | CURRENT |
| Row Level Security — Supabase Docs (04b7b1a0) | 2 days | CURRENT — keep as reference |
| Auth Hooks — Supabase Docs (9a06e6e2) | 2 days | CURRENT — relevant for Phase 3 auth |
| Supabase Multi-Tenant Architecture (474085e9) | 2 days | CURRENT — foundational |
| Custom Claims RBAC — Supabase (1d25b103) | 2 days | CURRENT |
| How to Design Multi-Tenant SaaS — Clerk (039ced24) | 2 days | CURRENT |
| Multi-Tenant Database Patterns — Bytebase (70dc5efd) | 2 days | CURRENT |
| Supabase RLS Best Practices — MakerKit (26c3f67c) | 2 days | CURRENT |
| Supabase RLS Guide — DesignRevision (09a70ea4) | 2 days | CURRENT |
| Supabase Multi-Tenancy CRM Integration (7aff1f85) | 2 days | CURRENT |
| Authorization via RLS — Supabase Features (32a9b5a4) | 2 days | CURRENT |
| Best Practices for Supabase — Leanware (5d2a77f8) | 2 days | CURRENT |
| Database Architecture for Multi-Tenant — Reddit (0a215bd1) | 2 days | CURRENT |
| Supabase RLS Policy — Reddit multi-tenant (359052be) | 2 days | CURRENT |
| How to Test Supabase RLS — SecurifyAI (0ea8f5f4) | 2 days | CURRENT |
| Supabase Security Checklist — SupaExplorer (6932f011) | 2 days | CURRENT |
| Enforce RLS — LockIn multi-tenant (21da87b1) | 2 days | CURRENT |
| Enable RLS for Multi-Tenant — supaexplorer (25214aeb) | 2 days | CURRENT |
| JWT — Supabase Docs (09dec61f) | 2 days | CURRENT |
| Next.js 16 + Supabase Multi-tenant template (99fe13d0) | 2 days | CURRENT |
| Scaling Postgres — pgEdge (9ec3f410) | 2 days | CURRENT |
| Next.js Layouts and Pages docs (92c7b561) | 2 days | CURRENT |
| Mortgage resources — CFPB (32ce2954) | 2 days | CURRENT |
| Vercel Functions docs (5d9317e8) | 2 days | CURRENT |
| Is Supabase Auth good for multi-tenant — Reddit (4b470381) | 2 days | CURRENT |
| Supabase RLS Troubleshooting (30cc0508) | 2 days | CURRENT |
| Postgres Triggers — Supabase Docs (018dd0fe) | 2 days | CURRENT |

---

## Missing Sources — Need to ADD

The following files were created in the 2026-03-26 PM session but are NOT in the notebook (adds appear to have been recorded in session log but not confirmed as present in source list):

1. `tasks/enterprise/specs/2026-03-26-phase3-webhook-impl.md` — production webhook handler + checkout routes
2. `tasks/enterprise/specs/2026-03-26-phase3-billing-ui.md` — billing settings page + feature gating
3. `tasks/enterprise/specs/2026-03-26-phase3-tenant-admin-spec.md` — Tenant Admin architecture + migration 059

Also needs to be added:
4. `tasks/enterprise/notebooklm-pull-2026-03-27.md` — today's pull report

---

## Recommended Web Research
Active topic: Phase 3 — Billing + Subscriptions (Stripe blocked)
Fallback topic (Tenant Admin can be built now): Internal admin dashboards for SaaS
- "Stripe Checkout integration Next.js 2026"
- "SaaS internal admin dashboard Next.js Supabase"
- "Tenant Admin dashboard patterns multi-tenant SaaS"
- "Next.js role-based admin access pattern"
- "Stripe webhook reliability production patterns 2026"
