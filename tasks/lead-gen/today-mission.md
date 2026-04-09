## Mission Brief — 2026-04-08 AM

### Domain
Lead Generation

### Focus Area
Refi Watch Builder — Sequence B (Anniversary Check-In) + Set Rate webhook

### Session Type
[ ] Research + Planning (Sequence A)
[ ] Strategy / Architecture (Sequence B)
[x] Execute / Build (Sequence C — partial)
[ ] Full Cycle (Sequence D)

### Why Partial Sequence C (not full)
Top blockers remain with Adam:
1. Refi Watch Sequences A and D: FRED API key not registered, email copy not approved
2. LO Waitlist: copy not reviewed, not deployed, n8n workflow inactive

However, **Sequence B (Anniversary Check-In)** is fully unblocked:
- No rate source dependency (email is conversational, not rate-specific)
- Email copy is finalized in spec
- No irreversible action (workflow built but NOT activated)
- First run would be May 1, 2026 — building today is timely
- `Set Rate` webhook workflow is also unblocked (no Adam input needed to build)

### Objectives
1. Confirm Supabase `activity_log` schema supports Refi Watch logging fields
2. Build n8n workflow: `LoanOS — Refi Watch Anniversary Check-In` (INACTIVE — needs Adam approval before first run)
3. Build n8n workflow: `LoanOS — Refi Watch Set Rate` (webhook to store current 30-yr rate; Adam uses to set rate before Sequence A activates)

### Definition of Done
- Supabase schema confirmed: `activity_log` has `loan_id`, `activity_type`, `notes`, `created_at`
- Anniversary Check-In workflow created in n8n, INACTIVE, with warning note
- Set Rate webhook workflow created in n8n, INACTIVE
- ADAM-TODO updated with new action items
- Session log updated

### Resources / Files in Scope
- `tasks/lead-gen/specs/2026-04-05-refi-watch-funnel-spec.md` — Refi Watch spec (Sequences A/B/D)
- Supabase project: uuqedsvjlkeszrbwzizl (MCP)
- n8n instance: styer.app.n8n.cloud (MCP)

### HIGH RISK Items
- Do NOT activate either workflow — both must remain INACTIVE until Adam approves
- Do NOT build Sequence D (Pre-Drop Warm-Up) — requires Adam email copy approval (irreversible blast to 644 clients)
- Do NOT build Sequence A (Rate Drop Alert) — requires FRED API key in n8n env
