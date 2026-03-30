# Automation Command Center — Design Spec

**Date:** 2026-03-30
**Status:** Draft
**Scope:** Replace `/dashboard/automations` with a unified control panel for all 38 automations across Claude Code scheduled tasks and n8n workflows. Consolidate email generation to use n8n as the single source of truth. Enhance loan/contact record email UX.

---

## 1. Problem

Adam has 38 automations running across two systems (20 Claude Code scheduled tasks, 18 n8n workflows) with no centralized way to:

- See what each automation did on its last run
- Redirect an agent's focus or priorities
- Edit email templates and prompts
- Pause, resume, or adjust schedules
- Understand which automations are healthy vs. erroring

The current `/dashboard/automations` page only lists 8 n8n webhook workflows as static cards with no run history, no editing, and no visibility into Claude Code agents.

Additionally, email generation is split between two disconnected systems — LoanOS API routes (`prompts.ts` / `definitions.ts` / `/api/automations/generate`) and n8n email workflows. These produce different outputs for the same email types and can't be managed from one place.

---

## 2. Solution Overview

### Two layers

| Layer | Location | Purpose |
|-------|----------|---------|
| **Automation Command Center** | `/dashboard/automations` (replace existing) | System-level config — templates, prompts, agent behavior, schedules, run history |
| **Loan/Contact Record** | `/dashboard/loans/[id]` and `/dashboard/contacts/[id]` | Individual email interaction — generate draft via n8n, preview, personalize, send |

### Key architecture change

n8n becomes the single email engine. The current LoanOS email generation system (`src/lib/automations/prompts.ts`, `src/lib/automations/definitions.ts`, `/api/automations/generate`, `/api/automations/refine`, `/api/automations/send`) is replaced. The loan record "Generate" button calls the corresponding n8n workflow, receives the draft, and displays it for editing and sending.

---

## 3. Automation Command Center — Page Design

### 3.1 Page Structure

**Route:** `/dashboard/automations` (replaces existing page)

**Top section:**
- Page title: "AUTOMATION COMMAND CENTER" (monospace, uppercase, gold)
- Global actions: "Pause All" and "Resume All" buttons
- Status summary bar: count of active (green), paused (yellow), errored (red) automations, plus "Last run: [name] — [time ago]"

**Main section:**
- Automations grouped by function, each group collapsible
- Each automation is a compact row that expands into a detail panel on click

### 3.2 Function Groups

| Group | Automations | Source |
|-------|-------------|--------|
| **Loan Pipeline** | Arive New Loan → Supabase, Arive Status Update → Supabase, New Application Received, Contract Received, Generic Outlook Draft | n8n |
| **Email Automations** | Pre-Approval Email, Final CD Email, Referral Intro Email, Refi Intake Email, Review Request Email, Drip Email Scheduler, FTB Guide Welcome Email | n8n |
| **SEO / SEM** | SEO/SEM Agent (AM+PM), Competitive Intel Daily, Competitive Intel Weekly, Styer Site Daily, Styer Content Weekly | Claude Code |
| **Social Media** | Social Media Agent (AM+PM), Weekly GBP + Social Post, Weekly Testimonial Social Post | Claude Code + n8n |
| **Lead Generation** | Lead Gen Agent (AM+PM), Web Lead Automation, Pre-Approval Lead Notify | Claude Code + n8n |
| **LoanOS Core** | LoanOS Daily, LoanOS Aesthetics, LoanOS Knowledge Base, Multi-Tenancy Daily Prep, LoanOS Build Watchdog (disabled) | Claude Code |
| **CRM & Enterprise** | CRM Migration Agent (AM+PM), Enterprise Agent (AM+PM) | Claude Code |
| **Communication Logging** | Inbound Email → Supabase Log, iMessage → Supabase Log | n8n |
| **AI Assistants** | AI System Prompt, Outreach Bot Prompt | Supabase (settings table) |

### 3.3 Automation Row (collapsed)

Each row displays:
- **Status dot** — green (active), yellow (paused), red (errored)
- **Name** — automation name
- **System badge** — "n8n" or "claude" pill
- **Trigger badge** — "webhook", "hourly", "daily", "2x daily", "weekly", "manual"
- **Last run** — relative timestamp ("12m ago", "3d ago", "Mon")
- **Expand arrow** — gold ▸, becomes ▾ when expanded

AM/PM paired Claude Code agents are collapsed into a single row (e.g., "SEO/SEM Agent" instead of separate "seo-sem-am" and "seo-sem-pm" entries).

### 3.4 Detail Panel — Agent Automations (Claude Code)

Tabs: **Controls** | **Run History** | **Prompt**

#### Controls Tab (two columns)

**Left column — Guided Controls:**
- **Status toggle** — Active / Paused buttons
- **Focus Areas** — toggleable chip tags (domain-specific, e.g., "On-page SEO", "Blog content", "Backlinks" for SEO agent). Gold = active, zinc = inactive. Click to toggle.
- **Avoid** — free-text field for things the agent should not work on
- **Priority This Week** — free-text field for the top priority override
- **Schedule** — displays AM/PM times, editable

**Right column — Ask Claude to Adjust:**
- Text area with placeholder: "Tell Claude what you want this agent to do differently"
- "Update Agent" button
- **Preview Changes** section — shows a red/green diff of what will change in the SKILL.md before applying
- "Apply" / "Cancel" buttons on the diff

**Bottom bar:**
- "Run Now" button (secondary)
- "Save Changes" button (primary, gold)

#### Run History Tab

- List of runs sorted newest first
- Each entry: date/time, summary of what the agent did (1-2 sentences), outcome (success/error/no changes)
- Click to expand full run log
- Data source: `tasks/[domain]/session-log.md` and `tasks/run-logs/` files

#### Prompt Tab

- Read-only display of the full SKILL.md content
- Informational only — editing happens through Guided Controls or Ask Claude

### 3.5 Detail Panel — Email Automations (n8n)

Tabs: **Email Preview** | **AI Prompt** | **Send History** | **Controls**

#### Email Preview Tab (two columns)

**Left column — Template/Preview:**
- Shows the email template with `{{variable}}` placeholders highlighted (e.g., `{{borrower_name}}`, `{{closing_date}}`, `{{loan_amount}}`)
- Variables are visually distinct (gold background pill) and protected from accidental deletion
- The template text around variables is directly editable
- "Save Template" updates the n8n workflow's template for all future emails

**Mode toggle** below the preview:
- **AI Generated** — Claude writes each email fresh based on a prompt; template shows the prompt output format
- **Fixed Template** — exact wording used every time with variable substitution only
- **Hybrid** — AI generates but must follow the template structure (most emails will likely use this)

**Right column — Quick Adjustments:**
- **Tone** — chip toggle: Formal / Conversational / Casual
- **Length** — chip toggle: Short / Medium / Long
- **Always Include** — toggleable chips (e.g., "Realtor name", "NMLS signature", "Pre-approval amount") + "Add" button
- **Never Include** — toggleable chips + "Add" button
- **Or Tell Claude What to Change** — free-text area + "Update Prompt" button

**Bottom bar:**
- "Send Test Email" button (secondary) — sends to adam@styermortgage.com
- "Save Changes" button (primary, gold)

#### AI Prompt Tab

- Read-only display of the Claude API prompt used in the n8n code node
- Shows what instructions Claude receives when generating this email

#### Send History Tab

- List of emails sent by this automation, newest first
- Each entry: date, recipient name, recipient email, subject line
- Click to expand and see full email body
- Data source: `activity_log` table entries tagged to this workflow

#### Controls Tab

- Status toggle (Active / Paused)
- Trigger info (webhook URL or schedule)
- n8n workflow ID (reference)

### 3.6 Detail Panel — AI Assistants (Chatbot Prompts)

Tabs: **Controls** | **Prompt**

#### Controls Tab (two columns)

**Left column — Guided Controls:**
- **Tone** — chip toggle: Professional / Friendly / Casual
- **Topics to Focus On** — toggleable chips
- **Topics to Avoid** — toggleable chips
- **Key Instructions** — free-text for specific behaviors (e.g., "Always suggest scheduling a call")

**Right column — Ask Claude to Adjust:**
- Same pattern as agent automations — describe what you want, preview diff, apply

#### Prompt Tab

- Read-only display of the current system prompt from Supabase `org_settings`

---

## 4. Loan/Contact Record Email Enhancement

### 4.1 Current State

The loan record has an `AutomationPanel` component with 14 automation cards. Clicking "Generate" calls `/api/automations/generate` which uses local `prompts.ts` to generate an email via Claude. This is a separate system from the n8n email workflows.

### 4.2 New Behavior

**Generate button calls n8n:**
- When user clicks "Generate" on an email automation in the loan record, the app sends a webhook request to the corresponding n8n workflow
- n8n uses the template/prompt configured in the Automation Command Center
- n8n returns the draft (subject + body) to the LoanOS UI
- The draft appears inline on the loan record

**Draft preview and editing:**
- Full email preview (subject + body) displayed inline
- Direct text editing — click into the draft and type changes
- **Instruction box** — text input where Adam can type (or use voice-to-text) instructions like "Add a line about needing bank statements and include the document upload link"
- Claude processes the instruction and rewrites the draft accordingly
- Edits to an individual draft do NOT update the template — they're one-time personalizations

**Send:**
- "Send" button triggers n8n to send via Outlook
- "Discard" clears the draft
- Sent emails are logged to `activity_log` with the loan/contact ID

### 4.3 Scope of Changes

**Remove:**
- `src/lib/automations/prompts.ts` — replaced by n8n workflow prompts
- `src/lib/automations/definitions.ts` — replaced by automation registry (see §5)
- `/api/automations/generate` — replaced by n8n webhook call
- `/api/automations/refine` — replaced by inline Claude instruction processing
- `/api/automations/send` — replaced by n8n send webhook

**Keep:**
- `AutomationPanel` component structure (but rewired to call n8n)
- `AutomationCard` component (updated to show n8n draft flow)
- Loan record Dashboard tab layout

**Add:**
- Inline draft editor component
- Instruction input with Claude refinement
- n8n webhook integration for generate/send

---

## 5. Data Architecture

### 5.1 Automation Registry

A new `automation_registry` table in Supabase stores the unified list of all automations with their configuration:

```
automation_registry
├── id (uuid, PK)
├── org_id (uuid, FK → organizations)
├── name (text) — display name
├── description (text)
├── group_name (text) — function group for UI grouping
├── source (text) — 'claude_code' | 'n8n' | 'supabase_setting'
├── source_id (text) — SKILL.md directory name, n8n workflow ID, or setting key
├── trigger_type (text) — 'webhook' | 'schedule' | 'manual'
├── schedule (text, nullable) — cron expression or human-readable schedule
├── status (text) — 'active' | 'paused' | 'errored' | 'disabled'
├── config (jsonb) — guided control values (focus_areas, avoid, priority, tone, etc.)
├── email_template (text, nullable) — for email automations, the template with {{variables}}
├── email_mode (text, nullable) — 'ai_generated' | 'fixed_template' | 'hybrid'
├── email_variables (jsonb, nullable) — list of available {{variables}} and their descriptions
├── last_run_at (timestamptz, nullable)
├── last_run_summary (text, nullable)
├── last_run_status (text, nullable) — 'success' | 'error' | 'no_changes'
├── created_at (timestamptz)
├── updated_at (timestamptz)
```

### 5.2 Run History

A new `automation_runs` table logs each run:

```
automation_runs
├── id (uuid, PK)
├── automation_id (uuid, FK → automation_registry)
├── org_id (uuid, FK → organizations)
├── started_at (timestamptz)
├── completed_at (timestamptz, nullable)
├── status (text) — 'success' | 'error' | 'running'
├── summary (text) — 1-2 sentence summary
├── full_log (text, nullable) — complete run output
├── changes_made (jsonb, nullable) — files changed, emails sent, etc.
├── created_at (timestamptz)
```

### 5.3 Email Drafts

A new `email_drafts` table holds drafts generated by n8n before sending:

```
email_drafts
├── id (uuid, PK)
├── org_id (uuid, FK → organizations)
├── automation_id (uuid, FK → automation_registry)
├── loan_id (uuid, nullable, FK → loans)
├── contact_id (uuid, nullable, FK → contacts)
├── to_email (text)
├── to_name (text, nullable)
├── subject (text)
├── body (text) — HTML or plain text
├── status (text) — 'draft' | 'sent' | 'discarded'
├── personalization_notes (text, nullable) — instructions given for this specific draft
├── sent_at (timestamptz, nullable)
├── created_at (timestamptz)
├── updated_at (timestamptz)
```

### 5.4 How Guided Controls Map to Source Files

When the user saves guided control changes on the Command Center:

**Claude Code agents:**
- The API writes a structured config block into the SKILL.md file (or a companion `config.json` adjacent to SKILL.md)
- The SKILL.md already contains a self-improvement protocol that reads context files — the guided controls inject a `## Current Directives` section that the agent reads on every run
- Focus areas, avoid list, and priority override are written as clear instructions at the top of the SKILL.md

**n8n workflows:**
- Email template changes are pushed to the n8n workflow via the n8n API (`PUT /api/v1/workflows/{id}`)
- The template is stored in the code node's parameters or in a Set node that feeds the template to Claude
- Tone, length, always-include, never-include are formatted as prompt instructions and injected into the Claude API call parameters

**Supabase settings (chatbot prompts):**
- Updated directly in the `org_settings` table via Supabase API
- Same as current Settings page behavior, just surfaced in the Command Center

---

## 6. API Routes

### New Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/automations/registry` | GET | List all automations with config and last run info |
| `/api/automations/registry/[id]` | GET | Get single automation detail |
| `/api/automations/registry/[id]` | PATCH | Update automation config (guided controls, template, status) |
| `/api/automations/registry/[id]/runs` | GET | Get run history for an automation |
| `/api/automations/registry/[id]/run-now` | POST | Trigger immediate run |
| `/api/automations/registry/[id]/ask-claude` | POST | Send natural language instruction, get back proposed changes as diff |
| `/api/automations/registry/[id]/apply-changes` | POST | Apply a previewed diff to the source file |
| `/api/automations/email/generate` | POST | Call n8n workflow to generate email draft, store in email_drafts |
| `/api/automations/email/[draft_id]` | PATCH | Update draft (manual edits or Claude refinement) |
| `/api/automations/email/[draft_id]/send` | POST | Send draft via n8n → Outlook |
| `/api/automations/email/[draft_id]/refine` | POST | Send instruction to Claude, get refined draft |
| `/api/automations/bulk-action` | POST | Pause All / Resume All |

### Removed Routes (replaced)

| Route | Replaced By |
|-------|-------------|
| `/api/automations/generate` | `/api/automations/email/generate` (n8n-backed) |
| `/api/automations/refine` | `/api/automations/email/[draft_id]/refine` |
| `/api/automations/send` | `/api/automations/email/[draft_id]/send` |

---

## 7. Component Architecture

### New Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `AutomationCommandCenter` | `src/app/dashboard/automations/page.tsx` | Main page — replaces existing |
| `AutomationGroup` | `src/components/automations/AutomationGroup.tsx` | Collapsible function group with header |
| `AutomationRow` | `src/components/automations/AutomationRow.tsx` | Compact row with status, badges, expand |
| `AgentDetailPanel` | `src/components/automations/AgentDetailPanel.tsx` | Expanded view for Claude Code agents |
| `EmailDetailPanel` | `src/components/automations/EmailDetailPanel.tsx` | Expanded view for email automations |
| `AssistantDetailPanel` | `src/components/automations/AssistantDetailPanel.tsx` | Expanded view for chatbot prompts |
| `GuidedControls` | `src/components/automations/GuidedControls.tsx` | Reusable: focus chips, avoid/priority fields |
| `AskClaudePanel` | `src/components/automations/AskClaudePanel.tsx` | Reusable: instruction input + diff preview |
| `EmailTemplateEditor` | `src/components/automations/EmailTemplateEditor.tsx` | Template with protected {{variables}} |
| `RunHistoryList` | `src/components/automations/RunHistoryList.tsx` | Expandable run log list |
| `SendHistoryList` | `src/components/automations/SendHistoryList.tsx` | Email send history list |
| `StatusBar` | `src/components/automations/StatusBar.tsx` | Top-level active/paused/errored counts |
| `InlineDraftEditor` | `src/components/automations/InlineDraftEditor.tsx` | For loan/contact record — edit draft + instruction input |

### Modified Components

| Component | Changes |
|-----------|---------|
| `AutomationPanel` (loan record) | Rewire Generate to call n8n via new API. Show InlineDraftEditor. |
| `AutomationCard` (loan record) | Update to show draft preview, edit, send flow |

### Removed

| Component/File | Reason |
|----------------|--------|
| `src/lib/automations/prompts.ts` | Replaced by n8n workflow prompts |
| `src/lib/automations/definitions.ts` | Replaced by automation_registry table |
| Current `src/app/dashboard/automations/page.tsx` | Replaced entirely |

---

## 8. How Updates Propagate

When the user makes a change and hits "Save Changes":

```
User edits guided controls or uses Ask Claude
  → POST /api/automations/registry/[id] (PATCH)
    → API reads automation source type
    → If claude_code:
        → Read SKILL.md from disk
        → Inject/update "## Current Directives" section with new config
        → Write SKILL.md back to disk
        → Next scheduled run picks up new directives automatically
    → If n8n:
        → Fetch workflow from n8n API
        → Update relevant node parameters (template text, Claude prompt, etc.)
        → PUT workflow back via n8n API
        → Changes take effect on next trigger
    → If supabase_setting:
        → Update org_settings row directly
        → Changes take effect immediately
    → Update automation_registry row with new config + updated_at
```

---

## 9. Seed Data

On first deploy, a migration seeds `automation_registry` with all 38 automations mapped from:
- Claude Code: reads `~/.claude/scheduled-tasks/` directory names and SKILL.md metadata
- n8n: reads workflow list from n8n API
- Supabase: maps the two existing setting keys (ai_system_prompt, outreach_bot_prompt)

A `/api/automations/sync` endpoint can be called to re-sync if new automations are added to either system.

---

## 10. Design Constraints

- All UI follows THEME.md: matte black background, gold accent, monospace headings, zinc borders, no shadows
- Status dots: green `#4ADE80`, yellow `#fbbf24`, red `#ef4444`
- System badges: zinc pill with "n8n" or "claude" text
- Trigger badges: zinc pill with trigger type
- Gold left border on group headers (existing stat card pattern)
- Mobile: groups stack vertically, detail panel goes full-width, guided controls stack single-column

---

## 11. Out of Scope

- Building new n8n workflows (existing workflows are rewired, not recreated)
- Voice-to-text input (browser native speech API can be added later)
- Real-time run monitoring (WebSocket streaming of agent output)
- Automation creation from the dashboard (new automations are still created in Claude Code or n8n)
- Deduplication audit of existing automations (e.g., competitive-intel-daily vs competitive-intel-weekly) — this is a separate manual review
