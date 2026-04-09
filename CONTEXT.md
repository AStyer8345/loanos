# LoanOS — AI Context File
> Read this at the start of every session before doing anything.
> Keep this file under 150 lines. Session history → CHANGELOG.md. Why decisions → DECISIONS.md. Open work → TODO.md.

## What This Is

LoanOS is a mortgage intelligence platform built by Adam Styer.
Built for personal production use first. Licensed to other LOs in Phase 4.
Replaces: Jungo CRM, Mortgage Coach, scattered Claude workflows.

## Repo

- GitHub: https://github.com/AStyer8345/loanos
- Branch: main
- Deploy: Vercel (auto on push)
- Version: 8.1.9 (as of 2026-04-05)

## Current Status

**Renovation Phase 2 complete. Security hardening ~80% complete. Preparing for LO #2 onboarding.**

- Phase 1 (strip UI to 7 tabs) — done 2026-03-30
- Phase 2 (pipeline bulletproof + Arive sync overhaul) — done 2026-04-02
- Multi-tenancy (org-based RLS, NOT NULL hardening, org_id on all tables) — done 2026-03-25
- UI renovation (shadcn/ui, light/dark mode, 300+ color replacements) — done 2026-04-01
- Drip campaigns v1 (4 tables, 7 API routes, 3-level UI, n8n scheduler) — done 2026-04-02
- Share page redesign (12 components, card-based layout, cash-to-close breakdown, PDF via print) — done 2026-04-05
- Dashboard v6.1 (sparklines, funnel, leaderboard, pipeline table, lead sources) — done 2026-04-04
- Lender knowledge system (DB + NotebookLM + dashboard + auto-ingest) — done 2026-04-04
- Security audit: 3 critical + 9 medium gaps identified 2026-04-05
  - Critical #1 Arive webhook multi-tenant — scaffolded (Zapier middleman, shadow mode)
  - Critical #2 Rate limiting — done (web-lead 30/min, share 60/min + 30/token)
  - Critical #3 PII encryption — Phase 1+2 done (companion table + AES-256-GCM + server read path). Phase 3 (backfill + column drop) pending.
  - Critical #4 Admin route audit — done (middleware + per-route gates)
  - Medium: CORS/CSP done, idempotency done, secret rotation runbook done, 3 items remaining (#5 field-level encryption, #9 admin action log, #10 sys vs org admin)

## Blockers for LO #2 Onboarding

1. Adam: fill in `extractPayloadIdentity()` in `src/lib/los/verifyLosPayload.ts` (check a Zapier run for the field name)
2. ~~Apply migration 075 (`los_integrations`) to Supabase~~ — done 2026-04-08
3. Run PII backfill script (`scripts/backfill-activity-pii.ts`) → then drop plaintext columns
4. Security findings #5, #9, #10 from `tasks/security-hardening-critical-gaps.md`

## Recent Fixes (2026-04-08)

- **Migration 081 (`contact_activity`)**: Table was referenced by API routes, UI, types, and migration 048 but never created. Now live with full RLS (org-scoped). Notes + activity log functional.
- **Migration 075 (`los_integrations`)**: Applied to live Supabase.
- **Social drafts**: Weeks 1-3 (Posts 1-21) rebuilt from build reports and inserted into `social_drafts`.
- **Suburb quick-form tracking**: Fixed `generate_lead` + `thank_you_page_view` gap on styermortgage.com suburb pages.
- **Blog slug rename**: temp-placeholder posts converted to meta-refresh redirects to canonical URLs.
- **Contact schema research**: Q2-Q8 answered in `tasks/crm/research/2026-03-25-contact-data-architecture.md`.

## Active n8n Workflows

See `memory/tools/n8n.md` for full index. Key ones:
- WF1 `1tagvoU0UXtdDiMY` — Arive New Loan → Supabase (active)
- WF2 `9JyzzwKac8v3uQ7d` — Arive Status Update → Supabase (active)
- Drip Scheduler `LqBb3YDLjS2eUrDE` — daily 7am CT, 16 nodes (active)
- Lender Ingest `hHXpKUirhnBCnQTO` — daily 8am CT, Outlook → Claude → Supabase (active)

## Key Architecture

- **Stack:** Next.js 14 (App Router), Supabase (auth + DB + storage), Tailwind, Vercel
- **Tenant isolation:** `org_id` on every table, RLS policies, `get_my_organization_id()` SECURITY DEFINER helper
- **Auth:** Supabase Auth (email/password), middleware gates `/dashboard/*`
- **Webhook security:** 3-layer (slug + hashed secret + payload allowlist), shadow/enforce mode
- **PII:** Dual-write to `activity_log` (inline) + `activity_log_pii` (AES-256-GCM encrypted companion). Read path decrypts server-side via `GET /api/activity`.
- **Share page:** `src/components/share/` — 12 borrower-facing components. PDF = share page + `@media print` + `?print=1`.
- **AI chat:** Multi-round tool use (max 4 rounds), tools: lender DB, mortgage knowledge base, contact lookup, loan lookup

## Key Files & Docs

| File | Purpose |
|------|---------|
| `CHANGELOG.md` | Session-by-session changes (the detailed history that used to live here) |
| `DECISIONS.md` | Architecture decisions with reasoning and alternatives |
| `TODO.md` | Prioritized open work |
| `tasks/ADAM-TODO.md` | Granular action items requiring Adam |
| `tasks/security-hardening-critical-gaps.md` | Security tracker (pre-LO #2) |
| `audits/SECURITY-AUDIT-2026-04-05.md` | Full audit findings (A-1 through A-12, S-1 through S-4, M-1, F-1) |
| `LOANOS_SYSTEM_KNOWLEDGE_BASE.md` | Product truth — features, schema, security posture |
| `RENOVATION-PLAN.md` | Master renovation plan (hide-don't-delete philosophy) |
| `docs/THEME.md` | UI theme spec — colors, components, borders |
| `docs/security/secret-rotation-runbook.md` | Rotation procedures for every secret |
| `/skills/user/` | 10+ user-defined Claude skills |

## Social Media Agent Status
<!-- Social media agent updates these three fields each session. Replace, never append. -->

**Last worked on:** 2026-04-08 AM — Week 14 build (Posts 82-86, June 10-16). 5 EVERGREEN posts in social_drafts. Personal pillar rebalanced to 30%. QA PASS.

**Active blockers:** BLOCKER-LOANOS-001 (selfies not uploaded — LoanOS content stream blocked). Posts 29+30 (Liberation Day) pending decision — auto-archive April 28 if no response.

**What's next:** Week 15 build (Posts 87-91). MANDATORY: 2 Promo posts (Promo at 0% Wks 11-14). Post 39 CPI fill April 10 AM session. Post 80 NFP fill June 5 AM.


## Lead Gen Agent Status
<!-- Lead gen agent updates these three fields each session. Replace, never append. -->

**Last worked on:** 2026-04-08 AM — Built n8n workflows: Anniversary Check-In (ZUeGy8u8P4o6DPM3, INACTIVE) and Set Rate webhook (3iXImUkjgMitpJKt, INACTIVE). Activity_log schema confirmed (uses `action` col, requires org_id).

**Active blockers:** Outlook credential must be connected in n8n UI before Anniversary workflow can activate. FRED API key not registered (blocks Sequence A). Sequences A and D copy approval pending (Adam). LO Waitlist not deployed.

**What's next:** Sequence A (Rate Drop Alert) — pending FRED API key in n8n env. Sequence D (Warm-Up) — pending email copy approval. LO Waitlist smoke test — pending Adam deploy.

## SEO/SEM Agent Status
<!-- SEO/SEM agent updates these three fields each session. Replace, never append. -->

**Last worked on:** 2026-04-07 PM — City enrichment (Leander/Hutto/Bastrop), mortgage-glossary.html created, DSCR ROI examples added. NotebookLM: deprecated styermortgage-context.md removed, CONTEXT.md+ARCHITECTURE.md added as foundational docs.

**Active blockers:** GSC 90-day export OVERDUE (April 5 window passed). ~~Suburb quick-forms: generate_lead fires but thank_you_page_view missing~~ FIXED 2026-04-08. mortgage-glossary.html not in nav yet. ZAPIER_DISPATCH_WEBHOOK_URL not set (digest UNSENT).

**What's next:** Add mortgage-glossary.html to Resources nav + link from loan type pages. Fix suburb quick-form conversion tracking. City enrichment: Bee Cave, Manor, Liberty Hill. Adam: pull GSC export.

## Rules For AI Sessions

- **UI changes**: Prefer `docs/THEME.md` + text spec. Don't require screenshots.
- Always read this file before starting
- Always update this file when something significant changes (keep it short — details go in CHANGELOG)
- Always update CHANGELOG.md at end of session
- Always update the build tracker (`/public/docs/loanos.html`) at end of session
- At end of session: update CONTEXT.md, commit, push to main
- Never break styer-mortgage-site tools
