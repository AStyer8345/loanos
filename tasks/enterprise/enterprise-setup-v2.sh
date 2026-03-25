#!/bin/bash
# LoanOS Enterprise Agent System — Full Setup (v2 with NotebookLM)
# Run once: bash tasks/enterprise/setup.sh

set -e

REPO="$HOME/Documents/loanos-clone"
ENT="$REPO/tasks/enterprise"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  LoanOS Enterprise Agent System Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ── Directory structure ──────────────────────
echo "Creating directory structure..."
mkdir -p "$ENT/subagents"
mkdir -p "$ENT/research"
mkdir -p "$ENT/specs"
mkdir -p "$ENT/build-reports"
mkdir -p "$ENT/reviews"
mkdir -p "$ENT/qa-reports"
mkdir -p "$ENT/digests"
mkdir -p "$ENT/web-research"
echo "✓ Directories created"

# ── Verify notebooklm CLI ────────────────────
echo ""
echo "Checking NotebookLM CLI..."
NLM="/Users/adamstyer/.local/bin/notebooklm"
if [ -f "$NLM" ]; then
  echo "✓ notebooklm found at $NLM"
  $NLM --version 2>/dev/null || echo "  (version flag not supported — that's fine)"
else
  echo "⚠ notebooklm not found at $NLM"
  echo "  Install: pip install notebooklm"
  echo "  System will continue but NotebookLM sync will fail until installed"
fi

# ── Initialize NotebookLM notebook ──────────
echo ""
echo "Initializing LoanOS Enterprise notebook..."
if [ -f "$NLM" ]; then
  EXISTING=$($NLM list --json 2>/dev/null | python3 -c "
import sys, json
data = json.load(sys.stdin)
notebooks = data if isinstance(data, list) else data.get('notebooks', [])
for n in notebooks:
  if 'LoanOS Enterprise' in str(n.get('title','')) or 'LoanOS Enterprise' in str(n.get('name','')):
    print(n.get('id','') or n.get('notebook_id',''))
    break
" 2>/dev/null)

  if [ -n "$EXISTING" ]; then
    echo "$EXISTING" > "$ENT/notebooklm-id.txt"
    echo "✓ Found existing notebook: $EXISTING"
  else
    echo "Creating new LoanOS Enterprise notebook..."
    NEW_ID=$($NLM create "LoanOS Enterprise" --json 2>/dev/null | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(data.get('id','') or data.get('notebook_id',''))
" 2>/dev/null)
    if [ -n "$NEW_ID" ]; then
      echo "$NEW_ID" > "$ENT/notebooklm-id.txt"
      echo "✓ Created notebook: $NEW_ID"
      
      # Seed with foundational docs
      echo "Seeding foundational docs..."
      $NLM use "$NEW_ID" --json 2>/dev/null
      $NLM source add "$REPO/CONTEXT.md" --json 2>/dev/null && echo "  ✓ CONTEXT.md added"
      $NLM source add "$REPO/LOANOS_SYSTEM_KNOWLEDGE_BASE.md" --json 2>/dev/null && echo "  ✓ LOANOS_SYSTEM_KNOWLEDGE_BASE.md added"
      $NLM source add "$REPO/CLAUDE.md" --json 2>/dev/null && echo "  ✓ CLAUDE.md added"
    else
      echo "⚠ Could not create notebook — will retry on first session run"
    fi
  fi
else
  echo "⚠ Skipping notebook init — CLI not found"
  touch "$ENT/notebooklm-id.txt"
fi

# ── Session log ──────────────────────────────
echo ""
echo "Creating session log..."
cat > "$ENT/session-log.md" << 'SESSIONLOG'
# LoanOS Enterprise Session Log
# Append-only. Never delete entries.
# Master Orchestrator reads the most recent entry before every session.

---
## Session Log Entry
Date: INIT
Time: SETUP
Focus: System Initialization

### Completed
- Enterprise agent system v2 initialized (NotebookLM integrated)
- Directory structure created
- NotebookLM notebook seeded with foundational docs (if CLI available)

### Next Session Instructions
Priority 1: Run PULL mode — confirm notebook has context
Priority 2: Begin Week 1 research — Multi-Tenant RLS Architecture
Priority 3: Do NOT build anything until research + architecture spec are complete

Active topic: Week 1 — Multi-Tenant RLS Architecture + Tenant Isolation
Advance queue: NO

Files to read first:
- tasks/enterprise/notebooklm-pull-[TODAY].md (after pull runs)
- CONTEXT.md
---
SESSIONLOG
echo "✓ Session log created"

# ── Queue file ───────────────────────────────
cat > "$ENT/enterprise-queue.md" << 'QUEUE'
# LoanOS Enterprise Build Queue

ACTIVE: Week 1 — Multi-Tenant RLS Architecture + Tenant Isolation

QUEUE:
- Week 2: Onboarding Flow — setup wizard, account connections, data collection per tenant
- Week 3: Security Hardening — GLBA, SOC 2, encryption at rest, audit logs, PII handling
- Week 4: Contact Import — CSV mapping, LOS portability, dedup logic, bulk import UX
- Week 5: Billing + Retention — Stripe webhooks, subscription management, churn signals
- Week 6: White-Label — custom domains, theming engine, per-tenant CNAME + logo config
- Week 7: Training + Docs — in-app guides, onboarding video scripts, help center structure
- Week 8: Admin Dashboard — tenant management, feature flags, usage reports, support tools

COMPLETED:
[Nothing yet]

QUEUE RULES:
- Do not advance until current topic has: research file + architecture spec + at least one build session
- Some topics span 3-4 sessions — that is expected
- Master Orchestrator checks this file every session to determine focus
QUEUE
echo "✓ Queue file created"

# ── Support files ────────────────────────────
echo "" > "$ENT/BLOCKERS.md"
echo "# Active Blockers" >> "$ENT/BLOCKERS.md"
echo "[No active blockers]" >> "$ENT/BLOCKERS.md"

echo "" > "$ENT/subagent-status.md"
echo "# Subagent Status" >> "$ENT/subagent-status.md"
echo "[Clean — ready for first session]" >> "$ENT/subagent-status.md"

echo "" > "$ENT/notebooklm-errors.md"
echo "# NotebookLM Error Log" >> "$ENT/notebooklm-errors.md"

echo "" > "$ENT/prompt-improvements.md"
echo "# Prompt Improvement Log" >> "$ENT/prompt-improvements.md"
echo "Reporter Subagent appends suggested prompt improvements here each session." >> "$ENT/prompt-improvements.md"

echo "✓ Support files created"

# ── Subagent file placement guide ────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  NEXT STEPS — Manual File Placement"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Copy downloaded files to these exact paths:"
echo ""
echo "  $ENT/master-agent.md"
echo "  $ENT/digest-template.html"
echo "  $ENT/subagents/00-notebooklm.md"
echo "  $ENT/subagents/01-research.md"
echo "  $ENT/subagents/02-architect.md"
echo "  $ENT/subagents/03-builder.md"
echo "  $ENT/subagents/04-reviewer.md"
echo "  $ENT/subagents/05-qa.md"
echo "  $ENT/subagents/06-reporter.md"
echo ""

# ── launchd plist generation ─────────────────
echo "Generating launchd schedule files..."

# AM — 6:00 AM
cat > "$HOME/Library/LaunchAgents/com.loanos.enterprise-am.plist" << PLIST_AM
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.loanos.enterprise-am</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>-c</string>
        <string>cd $REPO && cat tasks/enterprise/master-agent.md | /usr/local/bin/claude --dangerously-skip-permissions >> tasks/enterprise/cron-output.log 2>&1</string>
    </array>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>6</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>
    <key>RunAtLoad</key>
    <false/>
    <key>StandardOutPath</key>
    <string>/tmp/loanos-am.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/loanos-am-error.log</string>
</dict>
</plist>
PLIST_AM

# PM — 6:00 PM
cat > "$HOME/Library/LaunchAgents/com.loanos.enterprise-pm.plist" << PLIST_PM
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.loanos.enterprise-pm</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>-c</string>
        <string>cd $REPO && cat tasks/enterprise/master-agent.md | /usr/local/bin/claude --dangerously-skip-permissions >> tasks/enterprise/cron-output.log 2>&1</string>
    </array>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>18</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>
    <key>RunAtLoad</key>
    <false/>
    <key>StandardOutPath</key>
    <string>/tmp/loanos-pm.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/loanos-pm-error.log</string>
</dict>
</plist>
PLIST_PM

echo "✓ launchd plists written"
echo ""
echo "Load the schedule:"
echo "  launchctl load ~/Library/LaunchAgents/com.loanos.enterprise-am.plist"
echo "  launchctl load ~/Library/LaunchAgents/com.loanos.enterprise-pm.plist"
echo ""
echo "Test manually:"
echo "  cd $REPO && cat tasks/enterprise/master-agent.md | claude --dangerously-skip-permissions"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Setup complete."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
