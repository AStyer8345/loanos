## Mission Brief — 2026-04-19 AM

### Domain
Lead Generation

### Focus Area
Lead Scoring System — Full Build (DB migration + n8n workflow + API wiring + UI)

### Session Type
[x] Execute / Build (Sequence C)

### Context
Last substantive session: 2026-04-15 AM (lead scoring spec completed).
No Adam decisions received since then (3 items still [ ] in ADAM-TODO).
Per session-log 2026-04-15 instruction: proceed with Option A + 6.00% threshold assumption.

### Objectives
1. Apply Supabase migration: `lead_score INTEGER DEFAULT 0` + `lead_tier TEXT GENERATED ALWAYS AS (...) STORED` columns on `contacts`
2. Build n8n "LoanOS — Lead Score Updater" webhook workflow (7 nodes)
3. Wire webhook call into `/api/contacts/web-lead/route.ts` (fire-and-forget after contact created)
4. Add Lead Score column to pipeline table + score badge to contact detail header
5. Backfill all existing contacts from activity_log

### Definition of Done
- Migration applied to prod Supabase (verified via `list_tables` or `execute_sql` check)
- n8n Lead Score Updater: ACTIVE, webhook URL confirmed
- `/api/contacts/web-lead` fires score update webhook after contact create
- Pipeline table shows `Lead Score` column, sortable
- Contact detail page shows `lead_tier` badge (Hot/Warm/Cold/New)
- Backfill complete: all contacts have computed scores
- Build report written
- Session log updated

### Resources / Files in Scope
- Supabase project `uuqedsvjlkeszrbwzizl` — `contacts` table
- n8n instance: `styer.app.n8n.cloud`
- `src/app/api/contacts/web-lead/route.ts`
- `src/app/dashboard/pipeline/page.tsx` (or similar pipeline component)
- `src/app/dashboard/contacts/[id]/page.tsx` (or similar contact detail)
- Spec: `tasks/lead-gen/specs/2026-04-15-lead-scoring-spec.md`

### Assumptions (no Adam input received)
- Data model: Option A (persisted column, updated by n8n webhook)
- Seq A threshold: unchanged at 6.00%
- Hot lead notification: email to Adam via Resend (not SMS)
- Score update: webhook fired after web-lead contact creation only (other triggers added later)

### HIGH RISK Items
- Supabase migration is IRREVERSIBLE — migration must be additive only (no column drops)
- GENERATED ALWAYS column syntax for Supabase (Postgres 15) — verify before applying
- n8n workflow fires no outbound emails to leads — score computation only
- No TCPA/CAN-SPAM risk (no customer-facing communications)

---

<!-- Previous mission archived below -->

## Mission Brief — 2026-04-15 AM

### Domain
Lead Generation

### Focus Area
Blocker Verification + Homepage Form End-to-End Test + Lead Scoring System Design

### Session Type
[x] Execute / Build (Sequence C — spec + verification)

### Objectives
1. Verify all Adam-owned blockers via live MCP — surface any changes since last session
2. Verify homepage form wiring (commit 1bb1ef1) is live and correctly wired end-to-end
3. Build lead scoring system spec — data model, n8n implementation plan, score tiers

### Definition of Done
- Blocker status confirmed for all 6 ADAM blockers (live MCP, not from memory)
- Homepage form code verified via grep + subscribe-lead.js review + Supabase activity_log check
- Lead scoring spec written: signals, tiers, data model options, n8n build plan, Adam decisions needed

### Blocker Status (verified 2026-04-15 03:00 AM via MCP)
| Blocker | Status | Change |
|---------|--------|--------|
| Set Rate webhook | ✅ RESOLVED | 6.37% called 2026-04-14 18:09 UTC — FIRST EVER |
| Seq A threshold | ⚠️ MONITORING | 6.37% > 6.00% threshold → exits cleanly, no alerts yet |
| Seq C `LfLSDgqgb6yCe93C` | ❌ INACTIVE | Outlook cred still not connected |
| Calendly `PBu2Zt0YpiLHeqbL` | ❌ INACTIVE | triggerCount: 0 |
| Mailchimp journeys | ❌ NOT BUILT | Pack ready, Adam needs 45 min |
| Seq D warm-up | ❌ PENDING | Adam copy approval required |
