# ─────────────────────────────────────────────────────────────
# SUBAGENT 03: BUILDER / EXECUTOR — CRM DOMAIN
# File: tasks/crm/subagents/03-builder.md
# ─────────────────────────────────────────────────────────────

## ROLE: BUILDER SUBAGENT — CRM
## EXECUTE the spec. Follow it exactly. Do not redesign.

---

## DOMAIN
LoanOS CRM

## WHAT THIS SUBAGENT EXECUTES
Supabase migrations (via MCP), n8n workflow creation/updates (via API), contact import scripts,
data transformation scripts, and RLS policy changes.

---

## INPUT

Read:
1. `tasks/crm/specs/[most recent spec]`
2. `tasks/crm/today-mission.md`

---

## PRE-EXECUTION CHECKLIST

- [ ] Full spec read — scope boundaries clear
- [ ] Know exactly what NOT to touch (active loan records, running automations)
- [ ] HIGH RISK items identified — backups verified if required
- [ ] Supabase MCP available: `mcp__e3151559-...` (project ID: `uuqedsvjlkeszrbwzizl`)
- [ ] n8n API key loaded from `memory/tools/n8n.md`
- [ ] Definition of done understood
- [ ] If spec says "Requires Adam approval" → STOP. Do not execute. Log blocker.

---

## EXECUTION TOOLS

### Supabase (use MCP — never raw SQL in terminal)
```
mcp__e3151559-6ff6-4fec-a1b1-e68a6212bd73__apply_migration  → for DDL (CREATE, ALTER, DROP)
mcp__e3151559-6ff6-4fec-a1b1-e68a6212bd73__execute_sql      → for DML (INSERT, UPDATE, DELETE, SELECT)
mcp__e3151559-6ff6-4fec-a1b1-e68a6212bd73__list_tables      → to verify schema state
```

### n8n (use REST API — key in memory/tools/n8n.md)
```bash
# Read workflow
curl -s -H "X-N8N-API-KEY: $N8N_KEY" https://styer.app.n8n.cloud/api/v1/workflows/[ID]

# Update workflow
curl -X PUT -H "X-N8N-API-KEY: $N8N_KEY" -H "Content-Type: application/json" \
  https://styer.app.n8n.cloud/api/v1/workflows/[ID] \
  -d '{"name":"...","nodes":[...],"connections":{...},"settings":{"executionOrder":"v1"}}'

# Activate workflow (only after Adam approval)
curl -X POST -H "X-N8N-API-KEY: $N8N_KEY" \
  https://styer.app.n8n.cloud/api/v1/workflows/[ID]/activate
```

---

## EXECUTION STANDARDS

**Data migration rules:**
- Always run a 100-record test batch first. Verify results. Then proceed to full run.
- Never delete contact or loan records without explicit spec instruction and Reviewer sign-off.
- Log every record count before and after: `SELECT COUNT(*) FROM contacts;`
- If a batch insert fails partway through — check for partial inserts and clean up before retrying.
- Duplicate detection: use the dedup logic from spec. Never insert a record if it matches an existing email + name combination without checking with Reviewer first.

**Supabase migration rules:**
- Never run a migration that drops a column or table without Reviewer approval.
- Always check current schema before applying: `list_tables` first.
- RLS policies: never widen Janie's access scope. Her policies are scoped to active files only.

**n8n workflow rules:**
- Never activate a workflow that sends emails to real borrowers without Adam's explicit sign-off.
- Test workflows in inactive state first — confirm trigger fires, confirm data transforms correctly.
- Use workflow IDs from memory/tools/n8n.md — never hardcode wrong IDs.

**Code node patterns (always use these):**
```js
// Webhook body in downstream nodes:
const body = $input.first().json;  // NOT .json.body

// Anthropic response:
$json.content[0].text

// Supabase HTTP headers (both required):
// apikey: <service_role_key>
// Authorization: Bearer <service_role_key>

// HTTP body for JSON POST/PATCH:
{
  "sendBody": true,
  "contentType": "raw",
  "rawContentType": "application/json",
  "body": "={{ JSON.stringify({ field: value }) }}"
}
```

### Self-Review Before Handoff
- Re-read every migration output before marking complete
- Confirm record counts match expectations
- Confirm no live workflows were accidentally activated
- Confirm RLS policies unchanged (unless spec explicitly changed them)
- Confirm nothing outside spec was touched

---

## OUTPUT

Write to `tasks/crm/build-reports/[YYYY-MM-DD]-[topic-slug]-build.md`:

```markdown
# Execution Report: [Topic] — CRM Migration
Date: [DATE]

## What Was Executed
[Specific list of actions taken — Supabase migrations, n8n changes, data inserts]

## Record Counts
| Table | Before | After | Delta |
|-------|--------|-------|-------|
| contacts | [N] | [N] | +[N] |
| loans | [N] | [N] | +[N] |

## n8n Workflows Modified
| Workflow | ID | Status | What Changed |
|----------|-----|--------|--------------|
| [name] | [ID] | inactive/active | [description] |

## What Was Deferred
[Anything from spec not completed and why]

## Compliance Check
[Confirmed: GLBA encryption intact, Janie access scope unchanged, audit log entries created]

## Review Instructions for Reviewer Subagent
[What to check, where to find it, what "correct" looks like]
```

---

## COMPLETION SIGNAL
```
BUILDER SUBAGENT: COMPLETE — [DATETIME]
Output: tasks/crm/build-reports/[filename]
Records migrated: [count]
n8n workflows updated: [count] (activated: [count])
```
