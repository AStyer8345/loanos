# NotebookLM Pull Report — 2026-04-19 AM
Active Topic: Lead Scoring System Build
Source: session-log.md + live MCP verification (CLI unavailable — 8th+ consecutive session)

---

## What We Already Know

**Database:** 2,441 contacts, 854 loans. 644 past-client records = primary Refi Watch audience.

**Funnels live (confirmed deployed):**
- Pre-Approval (`/get-preapproved.html`) ✅
- Rate Alert (`/rate-alert.html`) ✅
- FTB Guide + DPA Guide ✅
- LO Waitlist (`/loanos-waitlist.html`) — deployed, not yet live-tested
- Homepage forms (Quick Quote + Quick Contact) — wired to subscribe-lead.js (commit `1bb1ef1`) ✅

**n8n automations (last verified live 2026-04-15 03:00 AM):**
- Seq A `iyKFy0ODkyyqQaAS`: ACTIVE. Runs daily 7 AM CT. Rate = 6.37%. Threshold = 6.00%. Exits cleanly when rate > threshold.
- Seq B (anniversary check-in): ACTIVE. Idle.
- Seq C `LfLSDgqgb6yCe93C` (quarterly rate review): INACTIVE — Outlook cred not connected (8+ sessions).
- Seq D `W0K4YDzkZd0Hzv6g` (warm-up 644 contacts): INACTIVE — Adam copy approval required.
- Calendly `PBu2Zt0YpiLHeqbL`: INACTIVE — Calendly webhook not wired in UI.
- Set Rate `3iXImUkjgMitpJKt`: ACTIVE. Rate = 6.37% (last set 2026-04-14).

**Outstanding Adam-owned blockers (unchanged 8+ sessions):**
- Mailchimp 3 journeys: NOT BUILT — execution pack ready since 2026-04-12. ~45 min in UI.
- Seq C Outlook cred: not connected.
- Seq D copy approval: not received.
- DPA Guide PDF: not hosted.
- Calendly webhook: not wired.
- Lead scoring decisions: 3 items pending (threshold, SMS, data model).

## Today's Build Target

**Lead Scoring System** — Spec complete 2026-04-15, no Adam decisions required to proceed.

Default assumptions (per session-log 2026-04-15 instructions):
- **Data model: Option A** (persisted `lead_score INTEGER` column in `contacts`)
- **Seq A threshold: 6.00%** (no change)
- **Hot lead routing: email-only** (no SMS to Adam — safe default, TCPA N/A for LO-to-himself but conservative)

Build sequence:
1. Supabase migration: `lead_score INTEGER DEFAULT 0` + `lead_tier TEXT GENERATED ALWAYS AS (...) STORED`
2. n8n workflow: "LoanOS — Lead Score Updater" (webhook trigger + score logic + hot-lead notify)
3. Wire webhook call into `/api/contacts/web-lead/route.ts`
4. Pipeline table: add Lead Score column (sortable, color-coded)
5. Contact detail: add score badge to header
6. Backfill script: compute score from existing activity_log rows

## Prior Decisions in Effect

- Set Rate = manual (FRED API killed 2026-04-11)
- Seq A threshold = 6.00%
- SMS = email-only for all automations
- DB model = Option A (proceeding without explicit Adam confirmation per session-log instruction)
- No build before Reviewer + QA sign-off on live funnels (lead scoring is not a live funnel modification)

## Briefing for Build Session

Build the lead scoring system as spec'd in `tasks/lead-gen/specs/2026-04-15-lead-scoring-spec.md`.
Priority: n8n workflow first (lowest risk, no LoanOS code changes), then DB migration, then API wiring, then UI.
No emails sent to any leads this session. Score computation only.
