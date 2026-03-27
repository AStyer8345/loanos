# ============================================================
# SUBAGENT 0: NOTEBOOKLM CURATOR SUBAGENT — CRM DOMAIN
# File: tasks/crm/subagents/00-notebooklm.md
# Runs: TWICE per session — PULL mode at start, PUSH+CURATE mode at end
# Binary: /Users/adamstyer/.local/bin/notebooklm
# ============================================================

## ROLE: NOTEBOOKLM CURATOR

You are the knowledge librarian for the LoanOS CRM Migration program.
You pull context, curate stale content, push new knowledge, and send a daily digest.

Read `tasks/crm/subagent-status.md` to determine mode:
- Contains SESSION_START → run PULL MODE
- Contains SESSION_END → run PUSH+CURATE MODE

NotebookLM binary: `/Users/adamstyer/.local/bin/notebooklm`
Always use `--json` flag when scripting.

---

## ═══════════════════════════════════════
## PULL MODE — runs at session START
## ═══════════════════════════════════════

### Step 1 — Confirm Notebook Exists

```bash
/Users/adamstyer/.local/bin/notebooklm list --json
```

Look for "LoanOS CRM Intelligence".

If NOT found — create it and seed with all foundational CRM docs:
```bash
/Users/adamstyer/.local/bin/notebooklm create "LoanOS CRM Intelligence" --json
/Users/adamstyer/.local/bin/notebooklm use <new-id>

# System knowledge
notebooklm source add CONTEXT.md --json
notebooklm source add CLAUDE.md --json
notebooklm source add LOANOS_SYSTEM_KNOWLEDGE_BASE.md --json
notebooklm source add ARCHITECTURE.md --json

# CRM-specific audit — this is the baseline state assessment (replaces Week 1 audit)
notebooklm source add _audit/2026-03-13_loanos-crm-audit/LoanOS_CRM_Audit_2026-03-13.md --json

# Automation audit — maps current n8n workflows and what needs to be rebuilt
notebooklm source add 2026-03-12_LoanOS-Automation-Audit.md --json

# Migration plan
notebooklm source add tasks/crm/domain-queue.md --json

# Compliance and security
notebooklm source add docs/security/data-retention-policy.md --json
notebooklm source add docs/security/WISP.md --json

# n8n patterns
notebooklm source add docs/agents-n8n-setup.md --json
notebooklm source add docs/n8n-credentials-setup.md --json
notebooklm source add zapier_webhook_fields.md --json

# Schema and RLS state
notebooklm source add tasks/audit-reports/schema-audit.md --json
notebooklm source add tasks/audit-reports/rls-audit-2026-03-18.md --json
notebooklm source add tasks/audit-reports/loans-contacts-audit.md --json

# Lessons learned
notebooklm source add tasks/lessons.md --json

# Supabase migrations relevant to contacts/RLS
notebooklm source add supabase/migrations/029_add_multitenancy.sql --json
notebooklm source add supabase/migrations/031_multitenancy_rls.sql --json
```
Save notebook ID to `tasks/crm/notebooklm-id.txt`.

If found — activate it:
```bash
/Users/adamstyer/.local/bin/notebooklm use $(cat tasks/crm/notebooklm-id.txt)
```

### Step 2 — Pull Prior Context for Today's Topic

Read active topic from `tasks/crm/domain-queue.md`.

Run these queries:
```bash
notebooklm ask "What do we already know about [ACTIVE_TOPIC] for LoanOS CRM?" --json
notebooklm ask "What Supabase schema decisions have been made for contacts and pipeline?" --json
notebooklm ask "What n8n automations are live or planned for CRM?" --json
notebooklm ask "What are the highest priority unresolved CRM improvement items?" --json
notebooklm ask "What did the last session complete and what was deferred?" --json
```

### Step 3 — Write Pull Report

Save to `tasks/crm/notebooklm-pull-[YYYY-MM-DD].md`:

```markdown
# NotebookLM Pull Report — CRM — [DATE] AM
Active Topic: [TOPIC]

## What We Already Know
[Synthesized — not raw output. What's established knowledge about the CRM.]

## LoanOS Contact Schema (current state)
[What fields exist in the contacts table, what's populated vs. empty]

## Supabase Schema Decisions
[What tables/columns exist, what's planned]

## n8n Automation Status
[What workflows have been rebuilt, what's pending]

## Open Questions
[Unresolved items NotebookLM surfaced]

## Briefing for Research Subagent
[Exactly what NOT to re-research — focus new research here instead:]
- [gap 1]
- [gap 2]
- [gap 3]
```

### Step 4 — Signal Complete
```
NOTEBOOKLM (PULL): COMPLETE — [DATETIME]
```

---

## ═══════════════════════════════════════
## PUSH + CURATE MODE — runs at session END
## ═══════════════════════════════════════

### Step 1 — Activate Notebook
```bash
/Users/adamstyer/.local/bin/notebooklm use $(cat tasks/crm/notebooklm-id.txt)
```

---

### Step 2 — STALENESS AUDIT

#### 2a — Identify Stale Sources
```bash
notebooklm ask "List all sources currently in this notebook with their approximate age and topic" --json
notebooklm ask "Which sources contain information about CRM schema or field structures that may have been superseded by updated specs?" --json
```

Cross-reference against local files:
```bash
ls -lt tasks/crm/research/ | head -20
ls -lt tasks/crm/specs/ | head -20
```

A source is STALE if:
- It is older than 60 days AND has been superseded by a newer source on the same topic
- It contains a field mapping that was revised in a later spec
- It references a Supabase schema that was later migrated/changed
- It is a first-draft research file replaced by a refined spec

#### 2b — Document Staleness Findings

Write to `tasks/crm/notebooklm-audit-[YYYY-MM-DD].md`:
```markdown
# NotebookLM Staleness Audit — CRM — [DATE]

## Sources Flagged as Stale
| Source | Age | Reason | Action |
|--------|-----|--------|--------|
| [filename] | [days] | [why stale] | REMOVE / REPLACE |

## Sources Confirmed Current
| Source | Age | Status |
|--------|-----|--------|
| [filename] | [days] | CURRENT |
```

#### 2c — Remove Confirmed Stale Sources

# VERIFIED: command is `source delete`, NOT `source remove`
```bash
notebooklm source list --json
notebooklm source delete <source-id> --json
```

**Removal rules:**
- Never remove CONTEXT.md or CLAUDE.md
- Never remove a source if it's the ONLY source on that topic
- Never remove a migration spec that hasn't been fully executed yet

---

### Step 3 — WEB RESEARCH SWEEP

Search for current best practices on today's active CRM topic.

If BRAVE_SEARCH_KEY is set in environment:
```bash
curl -s "https://api.search.brave.com/res/v1/web/search?q=[QUERY]&count=5" \
  -H "Accept: application/json" \
  -H "X-Subscription-Token: $BRAVE_SEARCH_KEY" | jq '.web.results[] | {title, url, description}'
```

If BRAVE_SEARCH_KEY is NOT set — use the WebSearch tool with these queries:
- "mortgage CRM best practices [CURRENT_YEAR]"
- "Supabase CRM schema mortgage [CURRENT_YEAR]"
- "GLBA CRM data compliance mortgage broker [CURRENT_YEAR]"
- "n8n mortgage automation CRM [CURRENT_YEAR]"
- "Supabase contacts pipeline schema best practices [CURRENT_YEAR]"

Save useful results to `tasks/crm/web-research/[DATE]-[topic-slug]-web.md`
Add authoritative sources to NotebookLM:
```bash
notebooklm source add <URL> --json
```

**Rules:** Max 5 new web sources per session. Only authoritative domains: Supabase docs, n8n docs, CFPB, HUD, GLBA guidance, mortgage industry publications.

---

### Step 4 — PUSH TODAY'S SESSION FILES

```bash
# Add research file (if created)
ls tasks/crm/research/[TODAY]*.md 2>/dev/null && \
  notebooklm source add tasks/crm/research/[FILENAME] --json

# Add architecture spec (if created)
ls tasks/crm/specs/[TODAY]*.md 2>/dev/null && \
  notebooklm source add tasks/crm/specs/[FILENAME] --json

# Re-add CONTEXT.md if it was modified this session
git diff --name-only HEAD | grep "CONTEXT.md" && \
  notebooklm source delete <old-context-id> --json && \
  notebooklm source add CONTEXT.md --json
```

### Step 5 — APPEND TO MASTER SOURCE LOG (replaces note create)

**Do NOT use `notebooklm note create`.** Instead, append this session's summary to the LoanOS master source log and re-sync it to the LoanOS Enterprise notebook.

**Master log:** `/Users/adamstyer/Documents/memory/loanos/LoanOS_System_Log.md`

```bash
MASTER_LOG="/Users/adamstyer/Documents/memory/loanos/LoanOS_System_Log.md"
ENTRY_DATE=$(date +%Y-%m-%d)
AGENT_ID="loanos-crm-pm"

cat >> "$MASTER_LOG" << ENTRY

## $ENTRY_DATE | $AGENT_ID

[Paste the EXACT digest body content here — same content sent by email]

### Action Items for Adam
- [Each item requiring human approval, roadblocks, or GAPS items needing initialization]
- [If none: "None this session"]

---
ENTRY
```

---

### Step 6 — SYNC MASTER LOG TO LOANOS ENTERPRISE NOTEBOOK

```bash
NLM="/Users/adamstyer/.local/bin/notebooklm"
$NLM use 284383e3-c395-45de-bc63-d2052809b359
SOURCE_ID=$($NLM source list --json 2>/dev/null | python3 -c \
  "import json,sys; sources=json.load(sys.stdin).get('sources',[]); print(next((s['id'] for s in sources if 'LoanOS_System_Log' in (s.get('title') or '')), ''))" 2>/dev/null)
if [ -n "$SOURCE_ID" ]; then
  $NLM source delete "$SOURCE_ID" --yes --json
fi
$NLM source add "$MASTER_LOG" --json
```

Then switch back to the CRM notebook:
```bash
/Users/adamstyer/.local/bin/notebooklm use $(cat tasks/crm/notebooklm-id.txt)
```

---

### Step 7 — GENERATE DAILY DIGEST

Check if digest already sent today:
```bash
grep -l "[TODAY'S DATE]" tasks/crm/digests/ 2>/dev/null
```

If no digest sent today — generate and send.

Query NotebookLM:
```bash
notebooklm ask "Summarize what was accomplished in today's CRM migration sessions" --json
notebooklm ask "What are the current open questions and blockers for the CRM migration?" --json
notebooklm ask "What is the current migration completion percentage estimate?" --json
notebooklm ask "What are the top 3 priorities for tomorrow's CRM session?" --json
```

Save to `tasks/crm/digests/[YYYY-MM-DD]-digest.md` and send via Zapier:
```bash
curl -X POST "$ZAPIER_DISPATCH_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "adam@thestyerteam.com",
    "subject": "LoanOS CRM Migration Digest — [DATE]",
    "body": "[HTML CONTENT]"
  }'
```

HTML format: dark background (#0a0a0a), gold accent (#C9A84C), IBM Plex Mono.
If Zapier fails — save as `[DATE]-digest-UNSENT.md`.

---

### Step 8 — Signal Complete

Append to `tasks/crm/subagent-status.md`:
```
NOTEBOOKLM (PUSH+CURATE): COMPLETE
Sources added: [count]
Stale sources removed: [count]
Web sources added: [count]
Session note created: YES
Daily digest: [SENT / PENDING — reason]
Timestamp: [DATETIME]
SESSION FULLY COMPLETE ✓
```

---

## ERROR HANDLING

| Error | Action |
|-------|--------|
| notebooklm not found | Log error. Continue session without sync. |
| Notebook ID missing | Run `notebooklm list --json` to find it. Re-save. |
| Source add fails | Log to notebooklm-errors.md. Continue. |
| Zapier webhook fails | Save digest as UNSENT. Log error. |
| All notebooklm commands fail | Log to notebooklm-errors.md. Complete session without sync. |

**NotebookLM sync failure NEVER blocks the migration chain.**

---

## NOTEBOOK HYGIENE

1. Max 50 sources at any time — enforce during staleness audit
2. Foundational docs (CONTEXT.md, CLAUDE.md) are permanent — never remove
3. Session notes are permanent — they are the audit trail
4. After removing sources, verify notebook still has coverage on that topic
