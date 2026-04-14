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
  - Critical #3 PII encryption — DONE. Companion table + AES-256-GCM + server read path + backfill (1402/1402) + migration 083 column drop. All 6 plaintext columns dropped 2026-04-12.
  - Critical #4 Admin route audit — done (middleware + per-route gates)
  - Medium: CORS/CSP done, idempotency done, secret rotation runbook done, 3 items remaining (#5 field-level encryption, #9 admin action log, #10 sys vs org admin)

## Blockers for LO #2 Onboarding

1. ~~`extractPayloadIdentity()` in `src/lib/los/verifyLosPayload.ts`~~ — DONE. Function implemented with `loanOfficerEmail` field (confirmed from 2026-04-04 Zapier run on loan 15755447). Verified by daily briefing agent 2026-04-09.
2. ~~Apply migration 075 (`los_integrations`) to Supabase~~ — done 2026-04-08
3. ~~Run PII backfill script (`scripts/backfill-activity-pii.ts`) → then drop plaintext columns~~ — DONE 2026-04-12
4. Security findings #5, #9, #10 from `tasks/security-hardening-critical-gaps.md`

## Recent Fixes (2026-04-12)

- **Trigger crash fix** (2026-04-12 PM): Migration 085 — `enrich_activity_log_contact()` referenced dropped columns (`from_address`, `to_address`), breaking ALL `/api/activity` POSTs since migration 083. Replaced with no-op `RETURN NEW`. Also fixed NULL logic bug in guard clause.
- **iMessage pipeline silent failure** (2026-04-12 PM): n8n workflow `nccX5ml82mMGyE9T` had 2 silent failure modes — "Find Active Loan" HTTP Request returning 0 items (killing downstream), and Code node not checking HTTP status on POST. Both fixed. 2 lost iMessages replayed.
- **Notes + Activity separation** (2026-04-12): Migration 084 — dedicated `notes` table, `event_type` column on `activity_log`, 19 notes migrated, 1404 event_types backfilled. Loan + contact detail pages now have separate Notes and Activity tabs. Notes: create/edit/soft-delete. Activity: read-only timeline with event-type icons (10 categories). iMessage events render with match_method badges. Unmatched page extended to include iMessages.
- **iMessage integration** (GOALS.md #4): n8n workflow `nccX5ml82mMGyE9T` captures both inbound AND outbound iMessages. Outbound: `imessage.sent` action, `imessage_sent` event_type, cyan icon in UI. `imessage-sync.py` runs every 5 min via launchd, deployed at `~/.local/bin/`. 137+ entries captured.
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
- **PII:** `activity_log_pii` companion (AES-256-GCM). Read path decrypts server-side via `GET /api/activity`. Plaintext columns dropped (migration 083).
- **Notes:** Dedicated `notes` table with RLS. API: `/api/notes` (POST/GET), `/api/notes/[id]` (PATCH/DELETE soft-delete). Components: `NoteInput`, `NoteCard`.
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

**Last worked on:** 2026-04-14 AM — Week 26 built (Posts 142-146, Sep 2-8): 2 LI + 1 IG + 2 FB. 1 authority (TIMELY Jobs) / 2 personal / 1 real-talk / 1 education. Avg 8.0/10 (scored posts). All APPROVED. QA 5/5 PASS. Post 145 TIMELY Jobs Report template: 7 placeholders, NMLS #513013 present, Refresh fills Sep 4 AM. Post 143 Reel: Adam films before Sep 3.

**Active blockers:** BLOCKER-LOANOS-001 (selfies not uploaded — LoanOS stream paused). Post 39: deadline April 15 — TODAY (URGENT). Post 145 TIMELY Jobs: Adam approve after Refresh fills ~Sep 4. Post 140 TIMELY PCE: Adam approve ~Aug 29. Post 136 TIMELY Jackson Hole: Adam approve ~Aug 24. Posts 29+30 Liberation Day: decision due April 28 (14 days).

**What's next:** Week 27 build (Posts 147-151, Sep 9-15). Slight personal over-index in Wk 26 — prioritize education/real-talk. BLOCKER-LOANOS-001 gate check each AM session. Post 39 hard deadline TODAY.


## Lead Gen Agent Status
<!-- Lead gen agent updates these three fields each session. Replace, never append. -->

**Last worked on:** 2026-04-14 AM — Homepage Quick Quote + Quick Contact forms wired to subscribe-lead.js (commit `1bb1ef1`, deployed to styermortgage.com). Calendly workflow `PBu2Zt0YpiLHeqbL` updated from 8→11 nodes: cancel branch (log invitee.canceled) + contact lookup (email→contact_id). Notebook: 6 removed (old pull, audit, web research ×2, session-log, CONTEXT), 5 added (new pull, 2 build reports, session-log, CONTEXT). 50/50. Digest: NOT SENT (AM — PM handles).

**Active blockers:** (1) Set Rate webhook never called — 6th session, Seq A idle. (2) Seq C INACTIVE — Outlook cred. (3) Mailchimp journeys not built (18-email pack ready, 45 min). (4) DPA Guide PDF not hosted. (5) Calendly webhook not configured — activate `PBu2Zt0YpiLHeqbL`.

**What's next:** Verify Adam blocker progress. If Set Rate still unresolved, build Seq A manual test prep (single-contact test). Calendly signing key HMAC verification (medium-term security debt). TCPA SMS language gap on homepage forms (Bug-003, low risk).

## SEO/SEM Agent Status
<!-- SEO/SEM agent updates these three fields each session. Replace, never append. -->

**Last worked on:** 2026-04-13 PM — NotebookLM PUSH+CURATE. MAJOR: styermortgage.com achieved first top-10 ranking — #3 for "hutto tx mortgage lender" (Competitive Intel Week 6, commit 36a6b28). MortgageAustin.com identified as new rising competitor at #3 for "mortgage broker austin tx" with decision-stage blog content. Notebook: 3 removed (old audit, old CONTEXT.md, superseded SEJ E-E-A-T), 2 added (fresh CONTEXT.md post-competitive-intel, audit-2026-04-13.md). 50/50. Digest SENT (Zapier success).

**Active blockers:** GSC sitemap submission for 15 rate-check pages (Adam-owned — needs GSC login). Hutto page needs AEO strengthening + schema update (AggregateRating 91+ reviews). Liberty Hill + Elgin still need enrichment (2 remaining suburb pages).

**What's next:** Strengthen Hutto page with AEO Atomic Paragraph + AggregateRating schema update (91+ reviews). Audit + strengthen /mortgage-broker-vs-bank.html to compete with MortgageAustin.com. Adam: submit GSC sitemap for 15 rate-check pages.

## Scenarios Agent Status
<!-- Scenarios agent updates these three fields each session. Replace, never append. -->

**Last worked on:** 2026-04-13 AM — Refi builder pre-fill fix (Tier 5 item 4). Fixed semantic bug: current loan section was pre-filled with new loan's rate/payment (wrong). Now: currentPayoffBalance = loan_amount, rate/amount/startDate blank for LO to enter. Refi scenario pre-fills newLoanAmount + interestRate + loanTerm from Arive. Gold info banner in builder when opened from loan record. Commit 08b4378 | Vercel dpl_BUbTcnjj4gLDxeHeA8Kgjk6xCNXi BUILDING.

**Active blockers:** None.

**What's next:** Social proof block (Tier 5 item 5) — "X borrowers in Austin chose a 30yr fixed this month" — illustrative, compliance-safe, share page only.

## Standup Agent Status
<!-- Standup agent updates these three fields each session. Replace, never append. -->

**Last worked on:** 2026-04-13 — Day 19 standup. Vercel READY (dpl_HawZvbuLAefvw84Gtvy9cu9iCozY). n8n: 31 total, 26 active. 2 new workflows since Day 18 (Rate Check Form active; Post-Calendly Booking inactive). Review request polling workflow deactivated (was wasting 1,440 exec/month). No audit findings.

**Active blockers:** GOALS.md #2 (email automation) — CD & Contract Extractor `HkLjsnnhT5MgrX5H` inactive, 3+ weeks zero progress. Post 39 approval URGENT — deadline April 15 (2 days). Marketing demo data zero progress — blocks May 1 launch page. 4 Adam-owned blockers unresolved (Set Rate, Mailchimp journeys, DPA Guide PDF, Calendly webhook). Phase 2 confirmation still outstanding.

**What's next:** CD & Contract Extractor activation (blocked on Outlook cred). Renovation Phase 3 once Phase 2 confirmed. Marketing demo data cleanup.

## Rules For AI Sessions

- **UI changes**: Prefer `docs/THEME.md` + text spec. Don't require screenshots.
- Always read this file before starting
- Always update this file when something significant changes (keep it short — details go in CHANGELOG)
- Always update CHANGELOG.md at end of session
- Always update the build tracker (`/public/docs/loanos.html`) at end of session
- At end of session: update CONTEXT.md, commit, push to main
- Never break styer-mortgage-site tools
