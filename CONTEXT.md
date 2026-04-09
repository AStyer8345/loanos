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

**Last worked on:** 2026-04-09 AM — Week 15 QA complete (Posts 87-91 scheduled June 17-23; PM session had created posts but crashed before scheduling). Week 16 built (Posts 92-96, June 24-30). Rolling 30/30/30/10 pillar mix ACHIEVED across Wks 11-16. DB note: "promo" violates pillar_check — use "authority" for promo posts.

**Active blockers:** BLOCKER-LOANOS-001 (selfies not uploaded — LoanOS content stream blocked). Posts 29+30 (Liberation Day) pending decision — auto-archive April 28 if no response.

**What's next:** April 10 AM — CPI releases 8:30 AM ET → Refresh fills Post 39 TIMELY template AFTER data release. Week 17 build (Posts 97-101, July 1-7 window).


## Lead Gen Agent Status
<!-- Lead gen agent updates these three fields each session. Replace, never append. -->

**Last worked on:** 2026-04-09 AM — Sequences A + D built. n8n workflow IDs: Sequence A (Rate Drop Alert) `iyKFy0ODkyyqQaAS`, Sequence D (Pre-Drop Warm-Up) `W0K4YDzkZd0Hzv6g`. Both INACTIVE. Sequence A: daily 7AM CT, reads rate from activity_log (Set Rate webhook), fires when rate ≤ 6.00% + borrower rate ≥ 6.75%, 30-day per-loan dedup. Sequence D: manual one-shot, filters already-touched clients, warm-up HTML email, logs refi_warmup.

**Active blockers:** Outlook credential not verified in n8n UI — blocks all Refi Watch sequences (A, B, D). Set Rate webhook must be called once before Sequence A can fire. Sequence D requires Adam approval before manual trigger (irreversible — all 644 contacts). FRED API key still unregistered (blocks future automated Option B — current Option A works). LO Waitlist not deployed to Netlify.

**What's next:** Adam actions: (1) connect Outlook credential in n8n, (2) activate + call Set Rate webhook with current rate, (3) activate Sequence A, (4) review + manually trigger Sequence D when ready. Next PM: reduce notebook below 50 sources (remove Mar 25-28 PM research). No new AM build work until blockers cleared.

## SEO/SEM Agent Status
<!-- SEO/SEM agent updates these three fields each session. Replace, never append. -->

**Last worked on:** 2026-04-08 PM — NotebookLM PUSH+CURATE. AM session: glossary nav added to 64 pages, city enrichment Bee Cave/Manor/Smithville (commit e4ee80b). Notebook: 3 removed (content-strategy Mar 27, stale CONTEXT.md, redundant GSC URL inspection), 3 added (refreshed CONTEXT.md, SEL meta/CTR guide, audit file). 50/50 maintained. Digest UNSENT (no webhook).

**Active blockers:** GSC 90-day export overdue — all keyword prioritization inference-based. Suburb pages not indexed — 24 pages need manual "Request Indexing" in GSC (Round Rock, Georgetown, Cedar Park first). ZAPIER_DISPATCH_WEBHOOK_URL not set (digests saving locally).

**What's next:** AEO answer-first paragraphs on Tier 1 suburbs (San Marcos, Georgetown, Round Rock, Leander, Pflugerville). City enrichment remaining queue (check session-log for remaining cities). Adam: (1) pull GSC export, (2) manually request indexing via GSC URL Inspection tool.

## Scenarios Agent Status
<!-- Scenarios agent updates these three fields each session. Replace, never append. -->

**Last worked on:** 2026-04-09 AM — Video/Loom embed on share page. ShareVideoEmbed.tsx (new component), videoUrl added to ShareBranding, reads from user_settings.scenario_video_url. Tier 4 COMPLETE. Tier 5 defined (PDF badge, scenario naming, refi pre-fill, comparison table, social proof).

**Active blockers:** None — next item is pure code (PDF "Commonly Chosen" label in generate-pdf route).

**What's next:** PDF "Commonly Chosen" label in `src/app/api/scenarios/generate-pdf/route.ts` — mirror the share page badge in PDF output so the lowest-payment scenario is visually distinguished in print.

## Rules For AI Sessions

- **UI changes**: Prefer `docs/THEME.md` + text spec. Don't require screenshots.
- Always read this file before starting
- Always update this file when something significant changes (keep it short — details go in CHANGELOG)
- Always update CHANGELOG.md at end of session
- Always update the build tracker (`/public/docs/loanos.html`) at end of session
- At end of session: update CONTEXT.md, commit, push to main
- Never break styer-mortgage-site tools
