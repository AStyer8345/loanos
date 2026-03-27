# Prompt Improvements — crm
Reporter Subagent appends suggested improvements here each session.

---
## 2026-03-25 AM — Prompt Improvement Notes

### 1. NotebookLM Pull Report: Stale Counts
**Problem:** Pull report stated "2,441 contacts" — live DB had 2,377. The discrepancy caused the Research agent to start with wrong baseline.
**Fix:** Add to `00-notebooklm.md` PULL mode: after generating pull report, immediately query `SELECT COUNT(*) FROM contacts` via Supabase MCP and update the count in the report. Do NOT rely on NotebookLM memory for counts.

### 2. Research Subagent: Query Live Schema First
**Problem:** The phone column split was listed as an "open question" but was already resolved in the DB (migration 014 had been applied). The Research subagent didn't know to check.
**Fix:** Add to `01-research.md` protocol: "Step 0 — Query live Supabase schema before researching. Run: `SELECT column_name FROM information_schema.columns WHERE table_name = 'contacts'` to confirm current state before studying the audit/spec files."

### 3. Architect Subagent: Always Include Org UUID + User ID Constants
**Problem:** Architect had to look up Adam's org UUID via Supabase query.
**Fix:** Add to `02-architect.md` under "INPUT": "Fetch Adam's org UUID and user_id from Supabase: `SELECT p.id, p.organization_id FROM profiles p WHERE p.role = 'admin' AND p.organization_id != 'eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee' LIMIT 1`. Include as constants in every spec."

---
## 2026-03-27 AM — Prompt Improvement Notes

### 5. Pull Step: Check Live Schema Before Listing Column Additions as Priority
**Problem:** Three consecutive sessions listed "add lock_expiry_date column (migration 061)" as Priority 1 for the next session. The column already existed as `rate_lock_expiration` and was already synced by WF2. One schema query would have resolved this immediately.
**Fix:** Add to `00-notebooklm.md` PULL mode and to `01-research.md` Step 0: "Before listing any schema addition as a next-session priority, run: `SELECT column_name FROM information_schema.columns WHERE table_name = 'loans' AND column_name ILIKE '%lock%'` (or relevant keyword). If the column already exists, remove it from the priority list and note it as already resolved."

---

### 4. Master Agent: Pre-Resolution Blocker for CSV Dependency
**Problem:** Session completed Strategy work but cannot advance to Execute because the source CSV location is unknown. This should have been raised in Research, not discovered mid-Architect.
**Fix:** Add to `01-research.md` Step 0: "For any migration session — confirm source data file exists and log its path. If source file cannot be located: write to BLOCKERS.md and set session type to Research Only."
