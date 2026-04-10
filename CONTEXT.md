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

1. ~~`extractPayloadIdentity()` in `src/lib/los/verifyLosPayload.ts`~~ — DONE. Function implemented with `loanOfficerEmail` field (confirmed from 2026-04-04 Zapier run on loan 15755447). Verified by daily briefing agent 2026-04-09.
2. ~~Apply migration 075 (`los_integrations`) to Supabase~~ — done 2026-04-08
3. Run PII backfill script (`scripts/backfill-activity-pii.ts`) → then drop plaintext columns
4. Security findings #5, #9, #10 from `tasks/security-hardening-critical-gaps.md`

## Recent Fixes (2026-04-09)

- **Activity log + notes** (GOALS.md #1): Fully working. Migration 081 (`contact_activity`) live with RLS. Duplicate entries fixed — `updateLastTouch()` echo actions filtered from system feed.
- **iMessage integration** (GOALS.md #4): n8n workflow `nccX5ml82mMGyE9T` updated — writes `contact_id`, `loan_id`, `occurred_at` to columns (was metadata-only). 126 entries backfilled. Blue icon + snippet in UI.
- **Inbound email rendering**: `email.received` entries show From + Subject with green icon in activity feed.
- **Migration 075 (`los_integrations`)**: Applied to live Supabase (2026-04-08).
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

**Last worked on:** 2026-04-10 AM — Week 18 complete (Posts 102-106, July 8-15). Full cycle: context load → refresh report (CPI not yet released at 2 AM) → architect → builder → quality (avg 8.0/10, all 5 ≥7/10) → reviewer (APPROVED, 0 compliance failures) → QA (5/5 PASS). Pillar rebalancing: 2 Personal + 1 Promo address rolling-window deficit. All 5 posts evergreen.

**Active blockers:** BLOCKER-LOANOS-001 (selfies not uploaded — LoanOS pool has 0 ready entries). Post 39 CPI template awaits Refresh fill — CPI releases April 10 at 7:30 AM CT. Posts 29+30 Liberation Day decision due April 28.

**What's next:** PM session: fill Post 39 CPI template after 7:30 AM CT data drop. Week 19 build (Posts 107-111). Posts 29+30 Liberation Day decision — 18 days to April 28 deadline. Promo still low in rolling mix — Week 19 should include 1 promo post.


## Lead Gen Agent Status
<!-- Lead gen agent updates these three fields each session. Replace, never append. -->

**Last worked on:** 2026-04-10 AM — Sequence C (Quarterly Rate Review) built. Confirmed Adam activated Seq A, B, Set Rate webhook since last session. Seq D org_id bug flagged.

**Active blockers:** Seq C needs Outlook credential connected + activation (Adam). Seq D has org_id bug (`45a5b7e8-...` → fix to `18613f82-...`) — flagged in ADAM-TODO. FRED API key not registered (low priority — not blocking anything).

**What's next:** Fix Seq D org_id bug (agent task, 5 min). Verify Set Rate webhook has been called with current rate. End-to-end test: check activity_log for refi_rate_update entries + Seq A execution history. Seq C: Adam activates once Outlook verified.

## SEO/SEM Agent Status
<!-- SEO/SEM agent updates these three fields each session. Replace, never append. -->

**Last worked on:** 2026-04-09 PM — NotebookLM PUSH+CURATE. AM session: city enrichment for Spicewood/Florence/Jarrell (commit 06fbfad) + San Marcos AEO paragraph (commit 55d6797). AEO rollout: 13/25 suburb pages confirmed; Buda + Westlake remain. Notebook: 3 removed (keyword-research superseded, FTB content strategy superseded, old CONTEXT.md), 3 added (CONTEXT.md refresh, SEL location pages guide, audit file). 50/50 maintained. Digest SENT (Zapier success).

**Active blockers:** GSC 90-day export overdue — keyword prioritization inference-based. 24 suburb pages need manual "Request Indexing" in GSC. Buda + Westlake AEO paragraphs deferred (Thursday target).

**What's next:** Thursday: AEO paragraphs for Buda + Westlake. Funnel audit: 3 pages + thank-you + contact.html. Rename temp placeholder blog posts to permanent slugs. Adam: pull GSC export + request indexing for suburb pages.

## Scenarios Agent Status
<!-- Scenarios agent updates these three fields each session. Replace, never append. -->

**Last worked on:** 2026-04-09 AM — Video/Loom embed on share page. ShareVideoEmbed.tsx (new component), videoUrl added to ShareBranding, reads from user_settings.scenario_video_url. Tier 4 COMPLETE. Tier 5 defined (PDF badge, scenario naming, refi pre-fill, comparison table, social proof).

**Active blockers:** None — next item is pure code (PDF "Commonly Chosen" label in generate-pdf route).

**What's next:** PDF "Commonly Chosen" label in `src/app/api/scenarios/generate-pdf/route.ts` — mirror the share page badge in PDF output so the lowest-payment scenario is visually distinguished in print.

## Standup Agent Status
<!-- Standup agent updates these three fields each session. Replace, never append. -->

**Last worked on:** 2026-04-10 — Day 16 standup. Vercel READY. n8n: 26 active healthy, 3 intentionally inactive. CD & Contract Extractor still INACTIVE (GOALS.md #2 unstarted). Seq D org_id bug flagged. 3 CRITICAL + 2 HIGH DB-level audit findings unresolved; 3 medium open per TODO.

**Active blockers:** GOALS.md #2 (email automation) has zero progress — CD & Contract Extractor `HkLjsnnhT5MgrX5H` inactive. Phase 3 gate requires Adam Phase 2 confirmation. PII backfill not run. Adam: selfies upload, Seq C activation, Seq D org_id fix.

**What's next:** Activate CD & Contract Extractor — highest-value unstarted automation per GOALS.md. Fix Seq D org_id bug. Adam: confirm Phase 2 to unblock Renovation Phase 3.

## Rules For AI Sessions

- **UI changes**: Prefer `docs/THEME.md` + text spec. Don't require screenshots.
- Always read this file before starting
- Always update this file when something significant changes (keep it short — details go in CHANGELOG)
- Always update CHANGELOG.md at end of session
- Always update the build tracker (`/public/docs/loanos.html`) at end of session
- At end of session: update CONTEXT.md, commit, push to main
- Never break styer-mortgage-site tools
