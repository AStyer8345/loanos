# NotebookLM Pull Report — CRM — 2026-03-26 AM
Active Topic: email_opt_out Enforcement + X-of-Y Contacts Count + Loan Pipeline Organization Research

## What We Already Know
- Data migration complete: 2,331 contacts, 817+ loans in LoanOS
- Contact stage regression (normalizeContactStage) fixed in PM session 2026-03-26 — 0 data corruption confirmed
- Pagination is NOT a technical cap — "Load More" works; all 2,331 contacts reachable
- Contact Data Architecture Research complete (2026-03-25) — 8 open questions pending Adam's input
- email_opt_out: 321 contacts (13.5%) have opted out — COMPLIANCE GAP: n8n milestone workflows do NOT check this flag before sending

## LoanOS Contact Schema (current state)
- phone: canonical primary phone, 1,659 records populated
- email_opt_out: boolean, 321 = true — HIGH compliance priority
- stage: canonical values ('Lead','Pre-Approved','Active','Closed','Past Client','Other')
- Pagination: confirmed working — all records reachable via Load More

## n8n Automation Status
- WF1 (Arive New Loan → Supabase): 1tagvoU0UXtdDiMY — Active but NOT pushed to n8n cloud
- WF2 (Arive Status Update → Supabase): 9JyzzwKac8v3uQ7d — Active but NOT pushed
- Milestone Communication Agent (1hjOmS7inZcxEJQr): Active — but does not check email_opt_out
- Other active: Pre-Approval, Final CD, Refi Intake, New Application, Contract Received, Referral Intro

## Open Questions
- Adam's 8 contact schema questions (gates architecture spec) — still unresolved
- Missing nurture automations: birthday/anniversary, past-client rate watch, post-close check-in

## Briefing for Today's Session
Do NOT re-research:
- Dedup strategy (complete)
- Stage normalization (fixed)
- Pagination cap (confirmed not a cap)
- Decommission audit (complete)

Focus NEW work on:
1. email_opt_out enforcement — check this flag in n8n before any milestone email fires
2. "X of Y contacts" count indicator — small UX win, no Adam input needed
3. Loan Pipeline Organization research — next queue item
