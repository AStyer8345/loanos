## Mission Brief — 2026-04-23 AM

### Domain
Lead Generation

### Focus Area
Drip Campaign Execution — build missing scheduler so enrolled contacts actually receive emails

### Session Type
[x] Execute / Build (Sequence C)

### Root Cause (Diagnosed This Session)
8 campaigns exist with steps and authored content. 0 enrollments ever processed. Three gaps:
1. No scheduler (archived n8n `LqBb3YDLjS2eUrDE`, WDK not activated, no Vercel cron)
2. Enrollment route sets `next_send_at: null` → no signal for when to fire
3. PA/DPA email content lives in WDK `.ts` files (can't run without WDK); other 6 campaigns have only skeleton briefs

### Objectives
1. Build `src/lib/drip/authored-emails.ts` — authored email registry for 5 relative_days campaigns
2. Build `src/app/api/drip/run/route.ts` — Vercel cron that finds due enrollments, sends via Resend, records drip_sends, advances enrollment
3. Update enrollment POST route to set `next_send_at` from first step's trigger_config.days
4. Create `vercel.json` with hourly cron config

### Definition of Done
- `npm run build` passes
- Vercel READY
- Enrollment in any of the 5 targeted campaigns → `next_send_at` set on enrollment record → cron picks it up → email sends → drip_sends record created → current_step advances

### Campaigns in Scope (relative_days trigger only)
| Campaign | ID | Steps | Schedule |
|---|---|---|---|
| PA Welcome Nurture | 8b540726 | 6 | days 0,3,7,14,30,60 |
| DPA Guide Nurture | 46ea4f7b | 8 | days 0,2,5,10,17,25,38,52 |
| Lead — Ghost Referral | dc370748 | 4 | days 3,7,21,45 |
| Lead — Incomplete App | cd488533 | 3 | days 2,5,14 |
| Lead — Went Quiet | 2c0382a5 | 4 | days 30,60,90,180 |

Deferred (complex triggers): Long-Term Nurture, Past Client Retention, Realtor Relationships

### Resources / Files in Scope
- `src/lib/drip/authored-emails.ts` (NEW)
- `src/app/api/drip/run/route.ts` (NEW)
- `src/app/api/drip/campaigns/[id]/enrollments/route.ts` (MODIFY)
- `vercel.json` (NEW)

### HIGH RISK Items
- CAN-SPAM: every email must include physical address + NMLS #513013 + unsubscribe mechanism
- Fire at most once per step — cron must be idempotent; advance current_step atomically
- CRON_SECRET must be set in Vercel before cron activates — ADAM action item

---

<!-- Previous mission archived below -->

## Mission Brief — 2026-04-20 AM

### Domain
Lead Generation

### Focus Area
Hot Lead Notification Gap Analysis + Realtor Referral System Research

### Session Type
[x] Strategy / Architecture (Sequence B)

### Context
Lead scoring system shipped 2026-04-19. MCP audit this session found:
- `lead_tier` is GENERATED ALWAYS column (Postgres auto-computes from `lead_score`) — correct, no fix needed
- Score distribution: 3 cold (score=3), 2,934 new (score=0) — expected for freshly-launched system
- triggerCount=1 on n8n workflow — web-lead route fires correctly (only 1 new web lead since deploy)
- CRITICAL GAP: `Surface Hot Lead` node sets `hot_lead_dismissed=false` in Supabase only.
  Zero email/SMS notification to Adam. 5-minute response window is broken for hot leads.

### Objectives
1. Document hot lead notification gap with full options analysis
2. Write architect spec for hot lead notification — self-contained enough for next Builder session
3. Research Realtor Referral System (next queue item per domain-queue.md)

### Definition of Done
- Research file: `tasks/lead-gen/research/2026-04-20-hot-lead-notification-gap.md`
- Architect spec: `tasks/lead-gen/specs/2026-04-20-hot-lead-notification-spec.md`
- Research file: `tasks/lead-gen/research/2026-04-20-realtor-referral-system-research.md`
- Session log updated

### Resources / Files in Scope
- n8n workflow `nOCDV73m4M0jyL1B` — read only, no modifications today
- `src/app/api/contacts/web-lead/route.ts` — reviewed, no changes today
- Supabase `contacts` table — read only

### Assumptions
- Notification: email-only to styer.adam@gmail.com (not SMS — no TCPA concern for internal ops)
- Implementation: LoanOS API endpoint approach preferred over hardcoding RESEND_API_KEY in n8n
- No builds today — strategy session only

### HIGH RISK Items
- Do not modify the live Lead Score Updater workflow until spec is reviewed
- Hot lead notification must only route to Adam's address — never to lead's contact info

---

<!-- Previous mission archived below -->

## Mission Brief — 2026-04-19 AM
(archived)

### Domain
Lead Generation

### Focus Area
Lead Scoring System — Full Build (DB migration + n8n workflow + API wiring + UI)

### Session Type
[x] Execute / Build (Sequence C)

### Definition of Done
- Migration applied to prod Supabase (verified via `list_tables` or `execute_sql` check)
- n8n Lead Score Updater: ACTIVE, webhook URL confirmed
- `/api/contacts/web-lead` fires score update webhook after contact create
- Pipeline table shows `Lead Score` column, sortable
- Contact detail page shows `lead_tier` badge (Hot/Warm/Cold/New)
- Backfill complete: all contacts have computed scores
- Build report written
- Session log updated

### Blocker Status (verified 2026-04-15)
| Blocker | Status | Change |
|---------|--------|--------|
| Set Rate webhook | ✅ RESOLVED | 6.37% called 2026-04-14 18:09 UTC |
| Seq A threshold | ⚠️ MONITORING | 6.37% > 6.00% threshold → exits cleanly |
| Seq C `LfLSDgqgb6yCe93C` | ❌ INACTIVE | Outlook cred still not connected |
| Calendly `PBu2Zt0YpiLHeqbL` | ❌ INACTIVE | triggerCount: 0 |
| Mailchimp journeys | ❌ NOT BUILT | Pack ready, Adam needs 45 min |
| Seq D warm-up | ❌ PENDING | Adam copy approval required |
