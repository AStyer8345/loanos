# Automation Command Center — Design Spec

**Date:** 2026-03-30
**Status:** Draft (Rev 2 — post-review fixes)
**Scope:** Replace `/dashboard/automations` with a unified control panel for all automations across Claude Code scheduled tasks (20), n8n workflows (18), and Supabase chatbot prompts (2) — 40 total. Consolidate email generation to use n8n as the single source of truth. Enhance loan/contact record email UX.

**Key constraint:** LoanOS runs on Vercel (read-only filesystem). Claude Code scheduled tasks run on Adam's local Mac. All communication between the two must go through Supabase as the shared data layer — no direct file reads/writes from the Vercel API.

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
- **Hybrid** — AI generates the email but is given the template as a structural guide: "Follow this format, use these sections, include these elements, but write the actual sentences fresh." The template is passed to Claude as a few-shot example in the prompt. This is the default mode for most emails.

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
├── source_node_id (text, nullable) — for n8n: the node name containing the email template/prompt (e.g., "Build Email" or "Claude API")
├── trigger_type (text) — 'webhook' | 'schedule' | 'manual'
├── schedule (text, nullable) — cron expression or human-readable schedule
├── status (text) — 'active' | 'paused' | 'errored' | 'disabled'
├── config (jsonb) — guided control values (focus_areas, avoid, priority, tone, etc.)
├── prompt_snapshot (text, nullable) — for claude_code: last-synced SKILL.md content; for n8n: Claude API prompt text
├── email_template (text, nullable) — for email automations, the template with {{variables}}
├── email_mode (text, nullable) — 'ai_generated' | 'fixed_template' | 'hybrid'
├── email_variables (jsonb, nullable) — list of available {{variables}} and their descriptions
├── email_test_data (jsonb, nullable) — sample variable values for "Send Test Email" (e.g., {"borrower_name": "Jane Doe", "closing_date": "April 15, 2026"})
├── last_run_at (timestamptz, nullable)
├── last_run_summary (text, nullable)
├── last_run_status (text, nullable) — 'success' | 'error' | 'no_changes'
├── created_at (timestamptz)
├── updated_at (timestamptz)
```

**RLS policy:** All three new tables (`automation_registry`, `automation_runs`) use the standard `get_my_organization_id()` policy — users can only read/write rows matching their `org_id`.

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

**Note:** An `email_drafts` table already exists in Supabase (used by the current automation system via `src/lib/supabase/logEmailDraft.ts`). Rather than creating a new table, we **alter the existing table** to add the new columns needed:

```
email_drafts (ALTER — add columns)
├── automation_id (uuid, nullable, FK → automation_registry) — NEW
├── personalization_notes (text, nullable) — NEW, instructions given for this specific draft
```

Existing columns are preserved. The current `email_drafts` API route (`/api/email-drafts/route.ts`) continues to work. New draft creation flows through the updated API routes in §6.

### 5.4 How Guided Controls Map to Source Systems

**Architecture principle:** Supabase is the single source of truth for all automation config. The `automation_registry.config` JSONB column stores guided control values. Each source system reads from Supabase at runtime.

When the user saves guided control changes on the Command Center:

**Claude Code agents:**
- The Vercel API writes config changes to `automation_registry.config` in Supabase
- Each Claude Code scheduled task's SKILL.md is modified to include a **Supabase directive check** at the top of every run: the agent calls the Supabase REST API to read its `automation_registry` row and applies `config.focus_areas`, `config.avoid`, `config.priority`, and `config.status` before doing any work
- If `status = 'paused'`, the agent logs "Paused via Command Center" and exits immediately
- The SKILL.md modification is a one-time migration — add a `## Command Center Directives` section to each SKILL.md that reads from Supabase
- **"Ask Claude to Adjust"** generates a proposed new `config` JSON (not a SKILL.md diff). The preview shows the old vs. new config values. On Apply, the config is written to Supabase. The agent picks it up on next run.
- **Prompt tab** shows the SKILL.md content stored in `automation_registry.prompt_snapshot` (synced periodically by the agents themselves as part of their run — they POST their current SKILL.md content to Supabase at the end of each run)

**n8n workflows:**
- Email template and prompt changes are stored in `automation_registry` (columns: `email_template`, `config`)
- n8n workflows are modified to read their template/prompt from Supabase at execution time (HTTP Request node fetching from `automation_registry` by `source_id`) instead of having templates hardcoded in code nodes
- This means the Command Center edits Supabase, and n8n reads from Supabase — no direct n8n API calls needed for template updates
- For structural workflow changes (adding/removing nodes), n8n API is still used, but that's out of scope for the Command Center

**Supabase settings (chatbot prompts):**
- Updated directly in the `org_settings` table via Supabase API
- Same as current Settings page behavior, just surfaced in the Command Center

### 5.5 Run History Pipeline

**Claude Code agents** write run summaries to Supabase at the end of every session:
- Each SKILL.md is modified (one-time migration) to POST to `automation_runs` via Supabase REST API as the final step
- Payload: `{ automation_id, summary, full_log, status, changes_made }`
- The agent identifies its `automation_id` by looking up `automation_registry` where `source_id` matches its directory name

**n8n workflows** already log to `activity_log`. The Send History tab queries `activity_log` filtered by workflow source_id.

**Fallback:** If an agent fails before posting its run summary, the Command Center shows "Last run: [time] — no report" based on schedule timing.

### 5.6 Pause/Resume Mechanism

**Claude Code agents:** Each agent checks `automation_registry.status` at the start of every run. If `status = 'paused'`, it exits. "Pause All" sets all Claude Code agent rows to `paused`. "Resume All" sets them back to `active`. The scheduled task still fires on schedule — it just exits immediately when paused.

**n8n workflows:** Pause/Resume calls the n8n API to activate/deactivate the workflow (`PATCH /api/v1/workflows/{id}` with `{ "active": false }`). Status is also updated in `automation_registry` for UI consistency.

### 5.7 "Run Now" Mechanism

**Claude Code agents:** "Run Now" is **out of scope** for v1. Claude Code scheduled tasks can only be triggered by their cron schedule or manually from the terminal. The button is hidden for Claude Code agents.

**n8n workflows:** "Run Now" calls the n8n API execute endpoint (`POST /api/v1/workflows/{id}/run`) or hits the webhook URL directly. This works today.

---

## 6. API Routes

### New Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/automations/registry` | GET | List all automations with config and last run info |
| `/api/automations/registry/[id]` | GET | Get single automation detail |
| `/api/automations/registry/[id]` | PATCH | Update automation config (guided controls, template, status) |
| `/api/automations/registry/[id]/runs` | GET | Get run history for an automation |
| `/api/automations/registry/[id]/run-now` | POST | Trigger immediate run (n8n only — calls n8n execute API or webhook) |
| `/api/automations/registry/[id]/ask-claude` | POST | Send natural language instruction + current config, get back proposed config JSON |
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
  → PATCH /api/automations/registry/[id]
    → API reads automation source type
    → If claude_code:
        → Update automation_registry.config in Supabase
        → Next scheduled run reads config from Supabase and applies directives
        → (No file writes from Vercel — agents read from Supabase)
    → If n8n:
        → Update automation_registry (email_template, config) in Supabase
        → n8n reads updated template from Supabase on next execution
        → For pause/resume only: also call n8n API to activate/deactivate workflow
    → If supabase_setting:
        → Update org_settings row directly
        → Changes take effect immediately
    → Update automation_registry.updated_at
```

### Ask Claude Flow (detailed)

```
1. User types instruction → POST /api/automations/registry/[id]/ask-claude
   → Body: { instruction: "Stop focusing on backlinks, write 2 blog posts per week" }
2. API reads current automation_registry.config
3. API calls Claude with: current config + user instruction → "Generate updated config JSON"
4. API returns { current_config, proposed_config } to client
5. Client renders diff preview (red = old values, green = new values)
6. User clicks "Apply" → PATCH /api/automations/registry/[id] with proposed_config
7. Or "Cancel" → discard, no changes
```

No intermediate state stored server-side. The proposed config lives in the client until applied or discarded.

---

## 9. Seed Data

The `automation_registry` is seeded via a **SQL migration with hardcoded INSERT statements** — not by reading the filesystem or calling external APIs at migration time.

The seed data is compiled from the audit performed on 2026-03-30:
- **20 Claude Code agents**: directory names, descriptions, schedules, and group assignments from `~/.claude/scheduled-tasks/` (captured during audit)
- **18 n8n workflows**: workflow IDs, names, descriptions, and trigger types from n8n API (captured during audit)
- **2 Supabase settings**: `ai_system_prompt` and `outreach_bot_prompt` keys

A `/api/automations/sync` endpoint exists for maintenance — it queries the n8n API to check for new/removed workflows and can be triggered manually from the Command Center. Claude Code agents are added manually (they require knowing the directory name and schedule).

### Complete Automation Inventory (40 total)

See Appendix A for the full enumeration of all automations with their source_id, group, trigger_type, and schedule.

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
- "Run Now" for Claude Code agents (requires local trigger mechanism not yet available)
- Creating new n8n workflows for contact-level automations that don't have one yet (referral-thank-you, application-link, nurture-followup) — these will show in the Command Center as "Not configured" and can be built incrementally

---

## Appendix A — Complete Automation Inventory

### Claude Code Scheduled Tasks (20)

| # | Name (UI) | source_id | group_name | trigger_type | schedule |
|---|-----------|-----------|------------|-------------|----------|
| 1 | SEO/SEM Agent | seo-sem-am + seo-sem-pm | SEO / SEM | schedule | 4:40 AM + 11:40 PM |
| 2 | Competitive Intel (Daily) | competitive-intel-daily | SEO / SEM | schedule | weekly (Mon) |
| 3 | Competitive Intel (Weekly) | competitive-intel-weekly | SEO / SEM | schedule | weekly (Mon) |
| 4 | Styer Site Daily | styer-site-daily | SEO / SEM | schedule | 7:00 AM + 11:00 PM |
| 5 | Styer Content Weekly | styer-content-weekly | SEO / SEM | schedule | weekly (Fri) |
| 6 | Social Media Agent | social-media-am + social-media-pm | Social Media | schedule | 2:20 AM + 9:20 PM |
| 7 | Lead Gen Agent | lead-gen-am + lead-gen-pm | Lead Generation | schedule | 3:40 AM + 10:00 PM |
| 8 | LoanOS Daily | loanos-daily | LoanOS Core | schedule | 8:45 AM + 12:45 AM |
| 9 | LoanOS Aesthetics | loanos-aesthetics | LoanOS Core | manual | on demand |
| 10 | LoanOS Knowledge Base | loanos-knowledge-base | LoanOS Core | schedule | weekly (Sun) |
| 11 | Multi-Tenancy Prep | multi-tenancy-daily-prep | LoanOS Core | schedule | daily |
| 12 | Build Watchdog | loanos-build-watchdog | LoanOS Core | disabled | — |
| 13 | CRM Migration Agent | loanos-crm-am + loanos-crm-pm | CRM & Enterprise | schedule | 8:40 AM + 10:40 PM |
| 14 | Enterprise Agent | loanos-enterprise-am + loanos-enterprise-pm | CRM & Enterprise | schedule | 7:00 AM + 6:20 PM |
| 15 | Scenarios Agent | scenarios-am + scenarios-pm | LoanOS Core | schedule | 7:20 AM + 5:00 PM |
| 16 | GBP Optimization | gbp-optimization | Social Media | schedule | weekly |
| 17 | GBP Weekly Optimization | gbp-weekly-optimization | Social Media | schedule | weekly |

*Note: AM/PM pairs count as 1 row in the UI but 2 source_ids. Items 16-17 are likely duplicates — flagged for dedup review.*

### n8n Workflows (18)

| # | Name (UI) | source_id (workflow ID) | group_name | trigger_type |
|---|-----------|------------------------|------------|-------------|
| 1 | Arive New Loan → Supabase | 1tagvoU0UXtdDiMY | Loan Pipeline | webhook |
| 2 | Arive Status Update → Supabase | 9JyzzwKac8v3uQ7d | Loan Pipeline | webhook |
| 3 | New Application Received | cWESnXXy9UOLB13q | Loan Pipeline | webhook |
| 4 | Contract Received | UfNcdpoVKQZqy0fj | Loan Pipeline | webhook |
| 5 | Generic Outlook Draft | eb9UsV5Z6odh7Yex | Loan Pipeline | webhook |
| 6 | Pre-Approval Email | utMvZpkdRwIRZ51u | Email Automations | webhook |
| 7 | Final CD Email | SkzrWeR0bHZs8kWX | Email Automations | webhook |
| 8 | Referral Intro Email | YbgDnTpPdefcazKy | Email Automations | webhook |
| 9 | Refi Intake Email | yCTydQ7RfZK4DyUg | Email Automations | webhook |
| 10 | Review Request Email | AK1fBcaX1cPcdlGx | Email Automations | schedule |
| 11 | Drip Email Scheduler | LqBb3YDLjS2eUrDE | Email Automations | schedule (hourly) |
| 12 | FTB Guide Welcome Email | yTkiV6pf2eZaJw82 | Email Automations | webhook |
| 13 | Web Lead Automation | PiuIsQpBuydtFM4m | Lead Generation | webhook |
| 14 | Pre-Approval Lead Notify | J9Pe24vUi6fpZtdZ | Lead Generation | webhook |
| 15 | Weekly GBP + Social Post | V6RhmJpOb7pOzMte | Social Media | schedule (weekly) |
| 16 | Weekly Testimonial Social Post | eJG4wckrj6SmSpm1 | Social Media | schedule (weekly) |
| 17 | Inbound Email → Supabase Log | qgb99Eh2ziy0INMk | Communication Logging | schedule (5 min) |
| 18 | iMessage → Supabase Log | nccX5ml82mMGyE9T | Communication Logging | webhook |

### Supabase Settings (2)

| # | Name (UI) | source_id (setting key) | group_name |
|---|-----------|------------------------|------------|
| 1 | AI System Prompt | ai_system_prompt | AI Assistants |
| 2 | Outreach Bot Prompt | outreach_bot_prompt | AI Assistants |

### Contact-Level Email Automations (not yet in n8n — future work)

| Name | Status | Notes |
|------|--------|-------|
| Referral Thank You | Not configured | Currently in LoanOS `definitions.ts` only |
| Application Link | Not configured | Currently in LoanOS `definitions.ts` only |
| Nurture Follow-Up | Not configured | Currently in LoanOS `definitions.ts` only |
| Document Request | Not configured | Currently in LoanOS `definitions.ts` only |

These show in the Command Center as "Not configured" with a note that an n8n workflow needs to be created. They can be built incrementally.

---

## Appendix B — Error Handling

### n8n Webhook Failures

| Scenario | Behavior |
|----------|----------|
| n8n unreachable (timeout > 15s) | Show toast: "n8n is not responding. Try again or check n8n status." |
| n8n returns error | Show toast with error message. Log to `automation_runs`. |
| n8n returns empty/malformed response | Show toast: "Email draft could not be generated. Try again." |
| Retry | No automatic retry. User clicks "Generate" again. |

### Run History / Send History

- Default display: last 20 entries
- "Load More" button fetches next 20 (paginated via `offset` + `limit`)
- Full log text is loaded on expand only (not prefetched)
