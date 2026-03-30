# Automation Command Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `/dashboard/automations` with a unified Automation Command Center that controls all 40 automations (20 Claude Code agents, 18 n8n workflows, 2 chatbot prompts) from one page, consolidates email generation to n8n, and enhances loan/contact record email UX.

**Architecture:** Supabase `automation_registry` table is the single source of truth for all automation config. Claude Code agents read config at runtime via REST API. n8n workflows read email templates from Supabase. The Command Center UI reads/writes `automation_registry` via Next.js API routes. Email generation on loan/contact records is rewired to call n8n webhooks instead of local `prompts.ts`.

**Tech Stack:** Next.js 14 (App Router), Supabase (Postgres + RLS), Tailwind CSS, n8n API, Anthropic Claude API

**Spec:** `docs/superpowers/specs/2026-03-30-automation-command-center-design.md`

---

## File Structure

### New Files

| File | Responsibility |
|------|---------------|
| `supabase/migrations/064_automation_registry.sql` | Create `automation_registry` + `automation_runs` tables, alter `email_drafts`, seed data |
| `supabase/migrations/065_automation_registry_rls.sql` | RLS policies for new tables |
| `src/lib/automations/types.ts` | TypeScript types for registry, runs, config |
| `src/lib/automations/groups.ts` | Function group definitions + display order |
| `src/app/api/automations/registry/route.ts` | GET all automations |
| `src/app/api/automations/registry/[id]/route.ts` | GET/PATCH single automation |
| `src/app/api/automations/registry/[id]/runs/route.ts` | GET run history |
| `src/app/api/automations/registry/[id]/run-now/route.ts` | POST trigger n8n execution |
| `src/app/api/automations/registry/[id]/ask-claude/route.ts` | POST natural language → config JSON |
| `src/app/api/automations/email/generate/route.ts` | POST generate email via n8n webhook |
| `src/app/api/automations/email/[draftId]/route.ts` | PATCH update draft |
| `src/app/api/automations/email/[draftId]/send/route.ts` | POST send via n8n |
| `src/app/api/automations/email/[draftId]/refine/route.ts` | POST Claude refinement |
| `src/app/api/automations/bulk-action/route.ts` | POST pause/resume all |
| `src/components/automations/AutomationGroup.tsx` | Collapsible function group |
| `src/components/automations/AutomationRow.tsx` | Compact row with status/badges |
| `src/components/automations/AgentDetailPanel.tsx` | Expanded view for Claude Code agents |
| `src/components/automations/EmailDetailPanel.tsx` | Expanded view for email automations |
| `src/components/automations/AssistantDetailPanel.tsx` | Expanded view for chatbot prompts |
| `src/components/automations/GuidedControls.tsx` | Focus chips, avoid/priority fields |
| `src/components/automations/AskClaudePanel.tsx` | Instruction input + diff preview |
| `src/components/automations/EmailTemplateEditor.tsx` | Template with protected {{variables}} |
| `src/components/automations/RunHistoryList.tsx` | Expandable run log list |
| `src/components/automations/SendHistoryList.tsx` | Email send history list |
| `src/components/automations/StatusBar.tsx` | Top-level active/paused/errored counts |
| `src/components/automations/InlineDraftEditor.tsx` | Loan/contact record draft editor |

### Modified Files

| File | Changes |
|------|---------|
| `src/app/dashboard/automations/page.tsx` | Replace entirely with Command Center |
| `src/components/automations/AutomationPanel.tsx` | Rewire to fetch automations from registry, call n8n |
| `src/components/automations/AutomationCard.tsx` | Update API endpoints to new email routes |
| `src/lib/database.types.ts` | Regenerate after migration |

### Removed Files

| File | Reason |
|------|--------|
| `src/lib/automations/prompts.ts` | Replaced by n8n workflow prompts read from registry |
| `src/lib/automations/definitions.ts` | Replaced by `automation_registry` table |
| `src/app/api/automations/generate/route.ts` | Replaced by `/api/automations/email/generate` |
| `src/app/api/automations/refine/route.ts` | Replaced by `/api/automations/email/[draftId]/refine` |
| `src/app/api/automations/send/route.ts` | Replaced by `/api/automations/email/[draftId]/send` |

---

## Task 1: Database Schema — automation_registry + automation_runs

**Files:**
- Create: `supabase/migrations/064_automation_registry.sql`

- [ ] **Step 1: Write the migration SQL**

```sql
-- ============================================================
-- Migration 064: Automation Registry + Runs tables
-- Creates the central registry for all 40 automations and
-- a run history table. Also alters email_drafts for new columns.
-- ============================================================

-- automation_registry
CREATE TABLE IF NOT EXISTS automation_registry (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  group_name text NOT NULL,
  source text NOT NULL CHECK (source IN ('claude_code', 'n8n', 'supabase_setting')),
  source_id text NOT NULL,
  source_node_id text,
  trigger_type text NOT NULL CHECK (trigger_type IN ('webhook', 'schedule', 'manual', 'disabled')),
  schedule text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'errored', 'disabled')),
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  prompt_snapshot text,
  email_template text,
  email_mode text CHECK (email_mode IN ('ai_generated', 'fixed_template', 'hybrid')),
  email_variables jsonb,
  email_test_data jsonb,
  last_run_at timestamptz,
  last_run_summary text,
  last_run_status text CHECK (last_run_status IN ('success', 'error', 'no_changes')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Unique constraint: one registry entry per source_id per org
CREATE UNIQUE INDEX IF NOT EXISTS automation_registry_org_source_idx
  ON automation_registry(org_id, source_id);

-- automation_runs
CREATE TABLE IF NOT EXISTS automation_runs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  automation_id uuid NOT NULL REFERENCES automation_registry(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('success', 'error', 'running')),
  summary text,
  full_log text,
  changes_made jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS automation_runs_automation_idx
  ON automation_runs(automation_id, started_at DESC);

-- Alter email_drafts — add automation_id and personalization_notes
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_drafts' AND column_name = 'automation_id'
  ) THEN
    ALTER TABLE email_drafts ADD COLUMN automation_id uuid REFERENCES automation_registry(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_drafts' AND column_name = 'personalization_notes'
  ) THEN
    ALTER TABLE email_drafts ADD COLUMN personalization_notes text;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE automation_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_runs ENABLE ROW LEVEL SECURITY;
```

- [ ] **Step 2: Apply migration to Supabase**

Run: `mcp__e3151559-...__apply_migration` with name `automation_registry` and the SQL above.

Expected: Migration applied successfully.

- [ ] **Step 3: Verify tables exist**

Run: `mcp__e3151559-...__execute_sql` with:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name IN ('automation_registry', 'automation_runs')
ORDER BY table_name;
```

Expected: Both tables listed.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/064_automation_registry.sql
git commit -m "feat: add automation_registry and automation_runs tables (migration 064)"
```

---

## Task 2: RLS Policies for New Tables

**Files:**
- Create: `supabase/migrations/065_automation_registry_rls.sql`

- [ ] **Step 1: Write the RLS migration**

Follow the exact pattern from `033_org_rls_documents_drafts_scenarios.sql` — use `DO $$ BEGIN IF NOT EXISTS ... END $$;` blocks, `get_my_organization_id()` for org scoping, and `get_my_role()` for delete restrictions.

```sql
-- ============================================================
-- Migration 065: RLS for automation_registry and automation_runs
-- Depends on: 029 (get_my_organization_id, get_my_role), 064
-- ============================================================

-- AUTOMATION_REGISTRY
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'automation_registry' AND policyname = 'Org members can read automation registry') THEN
    CREATE POLICY "Org members can read automation registry"
      ON automation_registry FOR SELECT
      USING (org_id = get_my_organization_id());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'automation_registry' AND policyname = 'Org members can insert automation registry') THEN
    CREATE POLICY "Org members can insert automation registry"
      ON automation_registry FOR INSERT
      WITH CHECK (org_id = get_my_organization_id());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'automation_registry' AND policyname = 'Org members can update automation registry') THEN
    CREATE POLICY "Org members can update automation registry"
      ON automation_registry FOR UPDATE
      USING (org_id = get_my_organization_id())
      WITH CHECK (org_id = get_my_organization_id());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'automation_registry' AND policyname = 'Org admins can delete automation registry') THEN
    CREATE POLICY "Org admins can delete automation registry"
      ON automation_registry FOR DELETE
      USING (org_id = get_my_organization_id() AND get_my_role() IN ('owner', 'admin'));
  END IF;
END $$;

-- AUTOMATION_RUNS
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'automation_runs' AND policyname = 'Org members can read automation runs') THEN
    CREATE POLICY "Org members can read automation runs"
      ON automation_runs FOR SELECT
      USING (org_id = get_my_organization_id());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'automation_runs' AND policyname = 'Org members can insert automation runs') THEN
    CREATE POLICY "Org members can insert automation runs"
      ON automation_runs FOR INSERT
      WITH CHECK (org_id = get_my_organization_id());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'automation_runs' AND policyname = 'Org members can update automation runs') THEN
    CREATE POLICY "Org members can update automation runs"
      ON automation_runs FOR UPDATE
      USING (org_id = get_my_organization_id())
      WITH CHECK (org_id = get_my_organization_id());
  END IF;
END $$;
```

- [ ] **Step 2: Apply migration**

Run: `mcp__e3151559-...__apply_migration` with name `automation_registry_rls`.

- [ ] **Step 3: Verify RLS is working**

Run SQL to confirm policies exist:
```sql
SELECT policyname, cmd FROM pg_policies
WHERE tablename IN ('automation_registry', 'automation_runs')
ORDER BY tablename, policyname;
```

Expected: 7 policies (4 for registry, 3 for runs).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/065_automation_registry_rls.sql
git commit -m "feat: add RLS policies for automation_registry and automation_runs (migration 065)"
```

---

## Task 3: Seed Data — Populate automation_registry

**Files:**
- Create: `supabase/migrations/066_seed_automation_registry.sql`

- [ ] **Step 1: Write the seed migration**

This inserts all 40 automations. The org_id is looked up dynamically from the first organization (Adam's single org). Source IDs, groups, schedules, and n8n workflow IDs come from the inventory in the spec (Appendix A).

```sql
-- ============================================================
-- Migration 066: Seed automation_registry with all 40 automations
-- Data source: Audit performed 2026-03-30 (see spec Appendix A)
-- ============================================================

DO $$
DECLARE
  v_org_id uuid;
BEGIN
  -- Get Adam's org (single-tenant for now)
  SELECT id INTO v_org_id FROM organizations LIMIT 1;
  IF v_org_id IS NULL THEN
    RAISE NOTICE 'No organization found — skipping seed';
    RETURN;
  END IF;

  -- ── Claude Code Agents (17 UI rows = 20 source dirs) ──────────

  INSERT INTO automation_registry (org_id, name, description, group_name, source, source_id, trigger_type, schedule, status, config) VALUES
  (v_org_id, 'SEO/SEM Agent', 'On-page SEO, blog content, backlinks, SEM campaigns', 'SEO / SEM', 'claude_code', 'seo-sem-am,seo-sem-pm', 'schedule', '4:40 AM + 11:40 PM', 'active', '{"focus_areas": ["on-page-seo", "blog-content", "backlinks", "sem-campaigns"], "avoid": "", "priority": ""}'::jsonb),
  (v_org_id, 'Competitive Intel (Daily)', 'Daily competitor monitoring and market intelligence', 'SEO / SEM', 'claude_code', 'competitive-intel-daily', 'schedule', 'weekly (Mon)', 'active', '{}'::jsonb),
  (v_org_id, 'Competitive Intel (Weekly)', 'Weekly deep-dive competitive analysis', 'SEO / SEM', 'claude_code', 'competitive-intel-weekly', 'schedule', 'weekly (Mon)', 'active', '{}'::jsonb),
  (v_org_id, 'Styer Site Daily', 'Daily styermortgage.com maintenance and updates', 'SEO / SEM', 'claude_code', 'styer-site-daily', 'schedule', '7:00 AM + 11:00 PM', 'active', '{}'::jsonb),
  (v_org_id, 'Styer Content Weekly', 'Weekly content creation for styermortgage.com', 'SEO / SEM', 'claude_code', 'styer-content-weekly', 'schedule', 'weekly (Fri)', 'active', '{}'::jsonb),
  (v_org_id, 'Social Media Agent', 'Social media content creation and scheduling', 'Social Media', 'claude_code', 'social-media-am,social-media-pm', 'schedule', '2:20 AM + 9:20 PM', 'active', '{"focus_areas": ["content-creation", "engagement", "scheduling"], "avoid": "", "priority": ""}'::jsonb),
  (v_org_id, 'Lead Gen Agent', 'Lead generation strategy and execution', 'Lead Generation', 'claude_code', 'lead-gen-am,lead-gen-pm', 'schedule', '3:40 AM + 10:00 PM', 'active', '{"focus_areas": ["lead-magnets", "landing-pages", "drip-campaigns"], "avoid": "", "priority": ""}'::jsonb),
  (v_org_id, 'LoanOS Daily', 'Daily LoanOS maintenance, bug fixes, and improvements', 'LoanOS Core', 'claude_code', 'loanos-daily', 'schedule', '8:45 AM + 12:45 AM', 'active', '{}'::jsonb),
  (v_org_id, 'LoanOS Aesthetics', 'UI/UX polish and design consistency', 'LoanOS Core', 'claude_code', 'loanos-aesthetics', 'manual', NULL, 'active', '{}'::jsonb),
  (v_org_id, 'LoanOS Knowledge Base', 'Documentation and knowledge base updates', 'LoanOS Core', 'claude_code', 'loanos-knowledge-base', 'schedule', 'weekly (Sun)', 'active', '{}'::jsonb),
  (v_org_id, 'Multi-Tenancy Prep', 'Daily multi-tenancy migration work', 'LoanOS Core', 'claude_code', 'multi-tenancy-daily-prep', 'schedule', 'daily', 'active', '{}'::jsonb),
  (v_org_id, 'Build Watchdog', 'Monitors build health (currently disabled)', 'LoanOS Core', 'claude_code', 'loanos-build-watchdog', 'disabled', NULL, 'disabled', '{}'::jsonb),
  (v_org_id, 'CRM Migration Agent', 'Salesforce/Jungo to LoanOS CRM migration', 'CRM & Enterprise', 'claude_code', 'loanos-crm-am,loanos-crm-pm', 'schedule', '8:40 AM + 10:40 PM', 'active', '{}'::jsonb),
  (v_org_id, 'Enterprise Agent', 'Enterprise feature development', 'CRM & Enterprise', 'claude_code', 'loanos-enterprise-am,loanos-enterprise-pm', 'schedule', '7:00 AM + 6:20 PM', 'active', '{}'::jsonb),
  (v_org_id, 'Scenarios Agent', 'Loan scenario calculator improvements', 'LoanOS Core', 'claude_code', 'scenarios-am,scenarios-pm', 'schedule', '7:20 AM + 5:00 PM', 'active', '{}'::jsonb),
  (v_org_id, 'GBP Optimization', 'Google Business Profile optimization', 'Social Media', 'claude_code', 'gbp-optimization', 'schedule', 'weekly', 'active', '{}'::jsonb),
  (v_org_id, 'GBP Weekly Optimization', 'Weekly GBP deep optimization', 'Social Media', 'claude_code', 'gbp-weekly-optimization', 'schedule', 'weekly', 'active', '{}'::jsonb)
  ON CONFLICT (org_id, source_id) DO NOTHING;

  -- ── n8n Workflows (18) ─────────────────────────────────────────

  INSERT INTO automation_registry (org_id, name, description, group_name, source, source_id, trigger_type, schedule, status, email_mode, config) VALUES
  (v_org_id, 'Arive New Loan → Supabase', 'Syncs new loans from Arive to Supabase', 'Loan Pipeline', 'n8n', '1tagvoU0UXtdDiMY', 'webhook', NULL, 'active', NULL, '{}'::jsonb),
  (v_org_id, 'Arive Status Update → Supabase', 'Syncs loan status changes from Arive', 'Loan Pipeline', 'n8n', '9JyzzwKac8v3uQ7d', 'webhook', NULL, 'active', NULL, '{}'::jsonb),
  (v_org_id, 'New Application Received', 'Extracts 1003 data, creates contacts, drafts welcome email', 'Loan Pipeline', 'n8n', 'cWESnXXy9UOLB13q', 'webhook', NULL, 'active', 'hybrid', '{"tone": "conversational", "length": "medium"}'::jsonb),
  (v_org_id, 'Contract Received', 'Extracts contract fields, drafts reply-all to parties', 'Loan Pipeline', 'n8n', 'UfNcdpoVKQZqy0fj', 'webhook', NULL, 'active', 'hybrid', '{"tone": "conversational", "length": "medium"}'::jsonb),
  (v_org_id, 'Generic Outlook Draft', 'Creates generic Outlook email draft via webhook', 'Loan Pipeline', 'n8n', 'eb9UsV5Z6odh7Yex', 'webhook', NULL, 'active', NULL, '{}'::jsonb),
  (v_org_id, 'Pre-Approval Email', 'Extracts PA letter fields, drafts congratulations email', 'Email Automations', 'n8n', 'utMvZpkdRwIRZ51u', 'webhook', NULL, 'active', 'hybrid', '{"tone": "conversational", "length": "medium", "always_include": ["pre-approval-amount", "nmls-signature"], "never_include": ["interest-rates"]}'::jsonb),
  (v_org_id, 'Final CD Email', 'Extracts CD fields, drafts closing disclosure walkthrough email', 'Email Automations', 'n8n', 'SkzrWeR0bHZs8kWX', 'webhook', NULL, 'active', 'hybrid', '{"tone": "conversational", "length": "medium", "always_include": ["closing-date", "nmls-signature"]}'::jsonb),
  (v_org_id, 'Referral Intro Email', 'Drafts personalized intro email to referred borrower', 'Email Automations', 'n8n', 'YbgDnTpPdefcazKy', 'webhook', NULL, 'active', 'ai_generated', '{"tone": "conversational", "length": "short"}'::jsonb),
  (v_org_id, 'Refi Intake Email', 'Extracts IFW data, drafts refi kickoff email', 'Email Automations', 'n8n', 'yCTydQ7RfZK4DyUg', 'webhook', NULL, 'active', 'hybrid', '{"tone": "conversational", "length": "medium"}'::jsonb),
  (v_org_id, 'Review Request Email', 'Sends review request to recently closed borrowers', 'Email Automations', 'n8n', 'AK1fBcaX1cPcdlGx', 'schedule', 'daily', 'active', 'ai_generated', '{"tone": "casual", "length": "short"}'::jsonb),
  (v_org_id, 'Drip Email Scheduler', 'Schedules and sends drip campaign emails', 'Email Automations', 'n8n', 'LqBb3YDLjS2eUrDE', 'schedule', 'hourly', 'active', NULL, '{}'::jsonb),
  (v_org_id, 'FTB Guide Welcome Email', 'Sends welcome email with FTB guide download', 'Email Automations', 'n8n', 'yTkiV6pf2eZaJw82', 'webhook', NULL, 'active', 'fixed_template', '{}'::jsonb),
  (v_org_id, 'Web Lead Automation', 'Processes website leads — creates contact, drafts follow-up', 'Lead Generation', 'n8n', 'PiuIsQpBuydtFM4m', 'webhook', NULL, 'active', NULL, '{}'::jsonb),
  (v_org_id, 'Pre-Approval Lead Notify', 'Notifies when pre-approval lead comes in', 'Lead Generation', 'n8n', 'J9Pe24vUi6fpZtdZ', 'webhook', NULL, 'active', NULL, '{}'::jsonb),
  (v_org_id, 'Weekly GBP + Social Post', 'Generates and posts weekly GBP and social content', 'Social Media', 'n8n', 'V6RhmJpOb7pOzMte', 'schedule', 'weekly', 'active', NULL, '{}'::jsonb),
  (v_org_id, 'Weekly Testimonial Social Post', 'Generates and posts weekly testimonial content', 'Social Media', 'n8n', 'eJG4wckrj6SmSpm1', 'schedule', 'weekly', 'active', NULL, '{}'::jsonb),
  (v_org_id, 'Inbound Email → Supabase Log', 'Syncs inbound Outlook emails to Supabase', 'Communication Logging', 'n8n', 'qgb99Eh2ziy0INMk', 'schedule', 'every 5 min', 'active', NULL, '{}'::jsonb),
  (v_org_id, 'iMessage → Supabase Log', 'Syncs iMessages to Supabase via webhook', 'Communication Logging', 'n8n', 'nccX5ml82mMGyE9T', 'webhook', NULL, 'active', NULL, '{}'::jsonb)
  ON CONFLICT (org_id, source_id) DO NOTHING;

  -- ── Supabase Settings (2) ──────────────────────────────────────

  INSERT INTO automation_registry (org_id, name, description, group_name, source, source_id, trigger_type, status, config) VALUES
  (v_org_id, 'AI System Prompt', 'Base system prompt for the AI chat assistant', 'AI Assistants', 'supabase_setting', 'ai_system_prompt', 'manual', 'active', '{"tone": "professional", "topics_focus": [], "topics_avoid": [], "key_instructions": ""}'::jsonb),
  (v_org_id, 'Outreach Bot Prompt', 'System prompt for the outreach/marketing bot', 'AI Assistants', 'supabase_setting', 'outreach_bot_prompt', 'manual', 'active', '{"tone": "friendly", "topics_focus": [], "topics_avoid": [], "key_instructions": ""}'::jsonb)
  ON CONFLICT (org_id, source_id) DO NOTHING;

END $$;
```

- [ ] **Step 2: Apply seed migration**

Run: `mcp__e3151559-...__apply_migration` with name `seed_automation_registry`.

- [ ] **Step 3: Verify seed data**

```sql
SELECT group_name, count(*) FROM automation_registry GROUP BY group_name ORDER BY group_name;
```

Expected: 9 groups totaling 37 rows (17 Claude Code + 18 n8n + 2 Supabase settings).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/066_seed_automation_registry.sql
git commit -m "feat: seed automation_registry with all 40 automations (migration 066)"
```

---

## Task 4: TypeScript Types + Group Definitions

**Files:**
- Create: `src/lib/automations/types.ts`
- Create: `src/lib/automations/groups.ts`

- [ ] **Step 1: Write types.ts**

```typescript
// src/lib/automations/types.ts
// TypeScript types for the automation registry system

export type AutomationSource = 'claude_code' | 'n8n' | 'supabase_setting'
export type AutomationStatus = 'active' | 'paused' | 'errored' | 'disabled'
export type TriggerType = 'webhook' | 'schedule' | 'manual' | 'disabled'
export type EmailMode = 'ai_generated' | 'fixed_template' | 'hybrid'
export type RunStatus = 'success' | 'error' | 'running' | 'no_changes'

export interface AgentConfig {
  focus_areas?: string[]
  avoid?: string
  priority?: string
}

export interface EmailConfig {
  tone?: 'formal' | 'conversational' | 'casual'
  length?: 'short' | 'medium' | 'long'
  always_include?: string[]
  never_include?: string[]
}

export interface AssistantConfig {
  tone?: 'professional' | 'friendly' | 'casual'
  topics_focus?: string[]
  topics_avoid?: string[]
  key_instructions?: string
}

export type AutomationConfig = AgentConfig | EmailConfig | AssistantConfig

export interface AutomationRegistryRow {
  id: string
  org_id: string
  name: string
  description: string
  group_name: string
  source: AutomationSource
  source_id: string
  source_node_id: string | null
  trigger_type: TriggerType
  schedule: string | null
  status: AutomationStatus
  config: AutomationConfig
  prompt_snapshot: string | null
  email_template: string | null
  email_mode: EmailMode | null
  email_variables: Record<string, string>[] | null
  email_test_data: Record<string, string> | null
  last_run_at: string | null
  last_run_summary: string | null
  last_run_status: RunStatus | null
  created_at: string
  updated_at: string
}

export interface AutomationRunRow {
  id: string
  automation_id: string
  org_id: string
  started_at: string
  completed_at: string | null
  status: 'success' | 'error' | 'running'
  summary: string | null
  full_log: string | null
  changes_made: Record<string, unknown> | null
  created_at: string
}
```

- [ ] **Step 2: Write groups.ts**

```typescript
// src/lib/automations/groups.ts
// Function group definitions and display order for Command Center

export interface GroupDef {
  key: string
  label: string
  order: number
}

export const AUTOMATION_GROUPS: GroupDef[] = [
  { key: 'Loan Pipeline', label: 'LOAN PIPELINE', order: 1 },
  { key: 'Email Automations', label: 'EMAIL AUTOMATIONS', order: 2 },
  { key: 'SEO / SEM', label: 'SEO / SEM', order: 3 },
  { key: 'Social Media', label: 'SOCIAL MEDIA', order: 4 },
  { key: 'Lead Generation', label: 'LEAD GENERATION', order: 5 },
  { key: 'LoanOS Core', label: 'LOANOS CORE', order: 6 },
  { key: 'CRM & Enterprise', label: 'CRM & ENTERPRISE', order: 7 },
  { key: 'Communication Logging', label: 'COMMUNICATION LOGGING', order: 8 },
  { key: 'AI Assistants', label: 'AI ASSISTANTS', order: 9 },
]

export function getGroupOrder(groupName: string): number {
  return AUTOMATION_GROUPS.find(g => g.key === groupName)?.order ?? 99
}

export function getGroupLabel(groupName: string): string {
  return AUTOMATION_GROUPS.find(g => g.key === groupName)?.label ?? groupName.toUpperCase()
}
```

- [ ] **Step 3: Verify build compiles**

Run: `npx tsc --noEmit` from `/Users/adamstyer/Documents/loanos-clone`

Expected: No new type errors from the added files.

- [ ] **Step 4: Commit**

```bash
git add src/lib/automations/types.ts src/lib/automations/groups.ts
git commit -m "feat: add TypeScript types and group definitions for automation registry"
```

---

## Important Notes

**Column naming:** `automation_registry` and `automation_runs` use `org_id`. The existing `email_drafts` table uses `organization_id`. When writing queries, use the correct column name for each table.

**Environment variables needed:** The n8n pause/resume and run-now features require `N8N_API_KEY` to be set in Vercel environment variables. The API key is in `memory/tools/n8n.md`. This must be added before Task 5 routes will work for n8n operations. The email send feature requires `N8N_OUTLOOK_DRAFT_WEBHOOK_URL` (already exists).

---

## Task 5: Registry API Routes

**Files:**
- Create: `src/app/api/automations/registry/route.ts`
- Create: `src/app/api/automations/registry/[id]/route.ts`
- Create: `src/app/api/automations/registry/[id]/runs/route.ts`
- Create: `src/app/api/automations/registry/[id]/run-now/route.ts`
- Create: `src/app/api/automations/registry/[id]/ask-claude/route.ts`
- Create: `src/app/api/automations/bulk-action/route.ts`

- [ ] **Step 1: Write GET /api/automations/registry**

```typescript
// src/app/api/automations/registry/route.ts
import { NextResponse } from 'next/server'
import { getOrganization } from '@/lib/getOrganization'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET() {
  try {
    const { organizationId } = await getOrganization()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = createServiceClient()

    const { data, error } = await supabase
      .from('automation_registry')
      .select('*')
      .eq('org_id', organizationId)
      .order('group_name')
      .order('name')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ automations: data ?? [] })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
```

- [ ] **Step 2: Write GET/PATCH /api/automations/registry/[id]**

GET returns single automation with full details. PATCH updates config, status, email_template, email_mode. For n8n pause/resume, also calls n8n API to activate/deactivate the workflow.

```typescript
// src/app/api/automations/registry/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getOrganization } from '@/lib/getOrganization'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { organizationId } = await getOrganization()
    const { id } = params
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = createServiceClient()

    const { data, error } = await supabase
      .from('automation_registry')
      .select('*')
      .eq('id', id)
      .eq('org_id', organizationId)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { organizationId } = await getOrganization()
    const { id } = params
    const body = await req.json()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = createServiceClient()

    // Whitelist allowed fields
    const allowed = ['config', 'status', 'email_template', 'email_mode', 'email_variables', 'email_test_data', 'prompt_snapshot']
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key]
    }

    // Fetch current row to check source for n8n pause/resume
    const { data: current } = await supabase
      .from('automation_registry')
      .select('source, source_id, status')
      .eq('id', id)
      .eq('org_id', organizationId)
      .single()

    if (!current) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // If status is changing and source is n8n, call n8n API
    if (body.status && body.status !== current.status && current.source === 'n8n') {
      const n8nActive = body.status === 'active'
      try {
        const n8nApiKey = process.env.N8N_API_KEY
        if (n8nApiKey) {
          await fetch(`https://styer.app.n8n.cloud/api/v1/workflows/${current.source_id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'X-N8N-API-KEY': n8nApiKey,
            },
            body: JSON.stringify({ active: n8nActive }),
          })
        }
      } catch (err) {
        console.error('[registry PATCH] n8n API error:', err)
        // Continue — Supabase update still happens
      }
    }

    const { data, error } = await supabase
      .from('automation_registry')
      .update(updates)
      .eq('id', id)
      .eq('org_id', organizationId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
```

- [ ] **Step 3: Write GET /api/automations/registry/[id]/runs**

```typescript
// src/app/api/automations/registry/[id]/runs/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getOrganization } from '@/lib/getOrganization'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { organizationId } = await getOrganization()
    const { id } = params
    const url = new URL(req.url)
    const limit = parseInt(url.searchParams.get('limit') ?? '20')
    const offset = parseInt(url.searchParams.get('offset') ?? '0')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = createServiceClient()

    const { data, error } = await supabase
      .from('automation_runs')
      .select('*')
      .eq('automation_id', id)
      .eq('org_id', organizationId)
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ runs: data ?? [] })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
```

- [ ] **Step 4: Write POST /api/automations/registry/[id]/run-now (n8n only)**

```typescript
// src/app/api/automations/registry/[id]/run-now/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getOrganization } from '@/lib/getOrganization'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { organizationId } = await getOrganization()
    const { id } = params
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = createServiceClient()

    const { data: automation } = await supabase
      .from('automation_registry')
      .select('source, source_id')
      .eq('id', id)
      .eq('org_id', organizationId)
      .single()

    if (!automation) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    if (automation.source !== 'n8n') {
      return NextResponse.json({ error: 'Run Now is only supported for n8n workflows' }, { status: 400 })
    }

    const n8nApiKey = process.env.N8N_API_KEY
    if (!n8nApiKey) {
      return NextResponse.json({ error: 'n8n API key not configured' }, { status: 503 })
    }

    const res = await fetch(`https://styer.app.n8n.cloud/api/v1/workflows/${automation.source_id}/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': n8nApiKey,
      },
      body: JSON.stringify({}),
    })

    if (!res.ok) {
      return NextResponse.json({ error: `n8n returned ${res.status}` }, { status: 502 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
```

- [ ] **Step 5: Write POST /api/automations/registry/[id]/ask-claude**

```typescript
// src/app/api/automations/registry/[id]/ask-claude/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getOrganization } from '@/lib/getOrganization'
import { checkRateLimit } from '@/lib/rateLimit'
import { getAnthropicClient } from '@/lib/anthropic/client'
import { CLAUDE_MODEL } from '@/lib/anthropic/model'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  let userId: string
  let organizationId: string
  try {
    const ctx = await getOrganization()
    userId = ctx.userId
    organizationId = ctx.organizationId
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { allowed } = checkRateLimit(`ask-claude:${userId}`, 10, 60_000)
  if (!allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  try {
    const { id } = params
    const { instruction } = await req.json()

    if (!instruction?.trim()) {
      return NextResponse.json({ error: 'Instruction is required' }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = createServiceClient()

    const { data: automation } = await supabase
      .from('automation_registry')
      .select('config, source, name, description')
      .eq('id', id)
      .eq('org_id', organizationId)
      .single()

    if (!automation) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const anthropic = await getAnthropicClient()

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1000,
      system: `You are updating automation config for "${automation.name}" (${automation.description}).
The current config is a JSON object with fields like focus_areas (array of strings), avoid (string), priority (string), tone, length, always_include, never_include, topics_focus, topics_avoid, key_instructions.
Given the user's instruction, return ONLY valid JSON with the updated config. Keep all existing fields — only modify what the instruction asks for. Add new fields if the instruction implies them.`,
      messages: [{
        role: 'user',
        content: `Current config:\n${JSON.stringify(automation.config, null, 2)}\n\nInstruction: ${instruction}`,
      }],
    })

    const text = response.content.find(b => b.type === 'text')?.text ?? '{}'
    let proposedConfig = automation.config
    try {
      const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
      proposedConfig = JSON.parse(cleaned)
    } catch {
      return NextResponse.json({ error: 'Claude returned invalid JSON — try rephrasing' }, { status: 422 })
    }

    return NextResponse.json({
      current_config: automation.config,
      proposed_config: proposedConfig,
    })
  } catch (error) {
    console.error('[ask-claude] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 6: Write POST /api/automations/bulk-action**

```typescript
// src/app/api/automations/bulk-action/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getOrganization } from '@/lib/getOrganization'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(req: NextRequest) {
  try {
    const { organizationId } = await getOrganization()
    const { action } = await req.json()

    if (!['pause_all', 'resume_all'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const newStatus = action === 'pause_all' ? 'paused' : 'active'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = createServiceClient()

    // Update all non-disabled automations
    await supabase
      .from('automation_registry')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('org_id', organizationId)
      .neq('status', 'disabled')

    return NextResponse.json({ success: true, status: newStatus })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
```

- [ ] **Step 7: Verify build compiles**

Run: `npm run build` from `/Users/adamstyer/Documents/loanos-clone`

Expected: Build passes with no errors from new API routes.

- [ ] **Step 8: Commit**

```bash
git add src/app/api/automations/registry/ src/app/api/automations/bulk-action/
git commit -m "feat: add registry, run-now, ask-claude, and bulk-action API routes"
```

---

## Task 6: Email API Routes (n8n-backed)

**Files:**
- Create: `src/app/api/automations/email/generate/route.ts`
- Create: `src/app/api/automations/email/[draftId]/route.ts`
- Create: `src/app/api/automations/email/[draftId]/send/route.ts`
- Create: `src/app/api/automations/email/[draftId]/refine/route.ts`

- [ ] **Step 1: Write POST /api/automations/email/generate**

This route looks up the automation in the registry, calls the corresponding n8n webhook to generate the email, and stores the draft in `email_drafts`.

```typescript
// src/app/api/automations/email/generate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getOrganization } from '@/lib/getOrganization'
import { checkRateLimit } from '@/lib/rateLimit'
import { createServiceClient } from '@/lib/supabase/service'
import { logEmailDraft } from '@/lib/supabase/logEmailDraft'

const N8N_BASE = process.env.N8N_WEBHOOK_BASE ?? 'https://styer.app.n8n.cloud/webhook'

export async function POST(req: NextRequest) {
  let userId: string
  let organizationId: string
  try {
    const ctx = await getOrganization()
    userId = ctx.userId
    organizationId = ctx.organizationId
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { allowed } = checkRateLimit(`email-gen:${userId}`, 20, 60_000)
  if (!allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  try {
    const { automationRegistryId, recordType, recordId, webhookPath } = await req.json()

    if (!automationRegistryId || !recordType || !recordId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = createServiceClient()

    // Fetch the automation to get its webhook path / source_id
    const { data: automation } = await supabase
      .from('automation_registry')
      .select('id, name, source_id, config, email_template, email_mode')
      .eq('id', automationRegistryId)
      .eq('org_id', organizationId)
      .single()

    if (!automation) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 })
    }

    // Fetch record data to send to n8n
    let recordData: Record<string, unknown> = {}
    if (recordType === 'contact') {
      const { data: contact } = await supabase
        .from('contacts')
        .select('first_name, last_name, email, phone, referred_by')
        .eq('id', recordId)
        .eq('organization_id', organizationId)
        .single()
      recordData = contact ?? {}
    } else if (recordType === 'loan') {
      const { data: loan } = await supabase
        .from('loans')
        .select('loan_amount, interest_rate, closing_date, property_address, property_city, property_state, loan_type, loan_purpose, status, contact_id, borrower_first_name, borrower_last_name, borrower_email, borrower_phone, buyer_agent_contact_id, referring_agent_name, referring_agent_email')
        .eq('id', recordId)
        .eq('organization_id', organizationId)
        .single()
      recordData = loan ?? {}
    }

    // Call n8n webhook
    const path = webhookPath || `loanos-${automation.source_id}`
    const n8nUrl = `${N8N_BASE}/${path}`

    const n8nRes = await fetch(n8nUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'loanos-command-center',
        record_type: recordType,
        record_id: recordId,
        record_data: recordData,
        config: automation.config,
        email_template: automation.email_template,
        email_mode: automation.email_mode,
      }),
    })

    if (!n8nRes.ok) {
      const errText = await n8nRes.text().catch(() => '')
      console.error('[email/generate] n8n error:', n8nRes.status, errText)
      return NextResponse.json({ error: 'n8n is not responding. Try again or check n8n status.' }, { status: 502 })
    }

    const n8nData = await n8nRes.json()
    const subject = n8nData.subject || ''
    const body = n8nData.body || n8nData.body_html || ''
    const recipientEmail = n8nData.recipient_email || (recordData as Record<string, string>).email || ''
    const recipientName = n8nData.recipient_name || `${(recordData as Record<string, string>).first_name ?? ''} ${(recordData as Record<string, string>).last_name ?? ''}`.trim()

    // Save draft
    const draft = await logEmailDraft({
      automation_name: automation.name,
      recipient_email: recipientEmail,
      recipient_name: recipientName,
      subject,
      body_html: body,
      contact_id: recordType === 'contact' ? recordId : ((recordData as Record<string, string>).contact_id || undefined),
      loan_id: recordType === 'loan' ? recordId : undefined,
      organization_id: organizationId,
    })

    if (!draft) {
      return NextResponse.json({ error: 'Failed to save draft' }, { status: 500 })
    }

    return NextResponse.json({ subject, body, draftId: draft.id })
  } catch (error) {
    console.error('[email/generate] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Write PATCH /api/automations/email/[draftId]**

```typescript
// src/app/api/automations/email/[draftId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getOrganization } from '@/lib/getOrganization'
import { createServiceClient } from '@/lib/supabase/service'

export async function PATCH(req: NextRequest, { params }: { params: { draftId: string } }) {
  try {
    const { organizationId } = await getOrganization()
    const { draftId } = params
    const { subject, body_html } = await req.json()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = createServiceClient()

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (subject !== undefined) updates.subject = subject
    if (body_html !== undefined) {
      updates.body_html = body_html
      updates.body_preview = body_html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 200)
    }

    const { data, error } = await supabase
      .from('email_drafts')
      .update(updates)
      .eq('id', draftId)
      .eq('organization_id', organizationId)
      .select()
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
```

- [ ] **Step 3: Write POST /api/automations/email/[draftId]/send**

Port the send logic from the existing `/api/automations/send/route.ts`, but use the registry lookup instead of `getAutomationById`.

```typescript
// src/app/api/automations/email/[draftId]/send/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getOrganization } from '@/lib/getOrganization'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(req: NextRequest, { params }: { params: { draftId: string } }) {
  let organizationId: string
  let userId: string
  try {
    const ctx = await getOrganization()
    organizationId = ctx.organizationId
    userId = ctx.userId
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { draftId } = params
    const webhookUrl = process.env.N8N_OUTLOOK_DRAFT_WEBHOOK_URL
    if (!webhookUrl) {
      return NextResponse.json({ error: 'Email dispatch not configured' }, { status: 503 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = createServiceClient()

    const { data: draft, error: fetchError } = await supabase
      .from('email_drafts')
      .select('*')
      .eq('id', draftId)
      .eq('organization_id', organizationId)
      .single()

    if (fetchError || !draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
    }

    if (draft.status !== 'pending') {
      return NextResponse.json({ error: `Draft status is "${draft.status}", expected "pending"` }, { status: 400 })
    }

    if (!draft.recipient_email) {
      return NextResponse.json({ error: 'No recipient email on this draft' }, { status: 400 })
    }

    const n8nRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: draft.recipient_email,
        subject: draft.subject,
        body: draft.body_html,
        recipientName: draft.recipient_name || '',
      }),
    })

    if (!n8nRes.ok) {
      console.error('[email/send] n8n webhook failed:', n8nRes.status)
      return NextResponse.json({ error: 'Failed to create Outlook draft' }, { status: 502 })
    }

    await supabase
      .from('email_drafts')
      .update({ status: 'sent', updated_at: new Date().toISOString() })
      .eq('id', draftId)
      .eq('organization_id', organizationId)

    if (draft.contact_id) {
      await Promise.all([
        supabase
          .from('contacts')
          .update({ last_touch_at: new Date().toISOString() })
          .eq('id', draft.contact_id),
        supabase.from('activity_log').insert({
          contact_id: draft.contact_id,
          loan_id: draft.loan_id || null,
          action: 'email_sent',
          type: 'email_sent',
          summary: `${draft.automation_name} sent to ${draft.recipient_name || draft.recipient_email}`,
          entity_type: 'contact',
          occurred_at: new Date().toISOString(),
          user_id: userId,
          organization_id: organizationId,
          metadata: { automation_name: draft.automation_name, subject: draft.subject } as never,
        }),
      ])
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[email/send] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Write POST /api/automations/email/[draftId]/refine**

Port from existing `/api/automations/refine/route.ts`.

```typescript
// src/app/api/automations/email/[draftId]/refine/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getOrganization } from '@/lib/getOrganization'
import { checkRateLimit } from '@/lib/rateLimit'
import { getAnthropicClient } from '@/lib/anthropic/client'
import { CLAUDE_MODEL } from '@/lib/anthropic/model'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(req: NextRequest, { params }: { params: { draftId: string } }) {
  let userId: string
  let organizationId: string
  try {
    const ctx = await getOrganization()
    userId = ctx.userId
    organizationId = ctx.organizationId
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { allowed } = checkRateLimit(`email-refine:${userId}`, 30, 60_000)
  if (!allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  try {
    const { draftId } = params
    const { instruction, currentSubject, currentBody } = await req.json()

    if (!instruction) {
      return NextResponse.json({ error: 'Instruction is required' }, { status: 400 })
    }

    const anthropic = await getAnthropicClient()

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1000,
      system: `You are refining an email draft based on the user's instruction.
Keep the same voice and tone — trusted advisor, conversational, direct.
Plain text only — no HTML, no markdown formatting.
Return ONLY valid JSON: { "subject": "...", "body": "..." }`,
      messages: [{
        role: 'user',
        content: `Current email draft:\nSubject: ${currentSubject || '(no subject)'}\nBody: ${currentBody || '(empty)'}\n\nInstruction: ${instruction}\n\nRefine the email and return the updated version as JSON.`,
      }],
    })

    const text = response.content.find(b => b.type === 'text')?.text ?? ''

    let subject = currentSubject || ''
    let body = currentBody || ''
    try {
      const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
      const parsed = JSON.parse(cleaned)
      subject = parsed.subject || subject
      body = parsed.body || body
    } catch {
      body = text
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = createServiceClient()
    const bodyPreview = body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 200)

    await supabase
      .from('email_drafts')
      .update({
        subject,
        body_html: body,
        body_preview: bodyPreview,
        personalization_notes: instruction,
        updated_at: new Date().toISOString(),
      })
      .eq('id', draftId)
      .eq('organization_id', organizationId)

    return NextResponse.json({ subject, body })
  } catch (error) {
    console.error('[email/refine] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 5: Verify build**

Run: `npm run build`

Expected: Build passes.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/automations/email/
git commit -m "feat: add n8n-backed email generate, refine, send, and update API routes"
```

---

## Task 7: StatusBar + AutomationRow + AutomationGroup Components

**Files:**
- Create: `src/components/automations/StatusBar.tsx`
- Create: `src/components/automations/AutomationRow.tsx`
- Create: `src/components/automations/AutomationGroup.tsx`

- [ ] **Step 1: Write StatusBar component**

Shows counts of active/paused/errored automations and "Pause All" / "Resume All" buttons. Gold monospace header. Props: `automations: AutomationRegistryRow[]`, `onBulkAction: (action: string) => void`.

Key styling: matte black background, gold `#C9A84C` accent, status dots — green `#4ADE80`, yellow `#fbbf24`, red `#ef4444`. Font: `'IBM Plex Mono', 'Courier New', monospace`.

- [ ] **Step 2: Write AutomationRow component**

Compact row: status dot, name, system badge ("n8n"/"claude"), trigger badge, last run timestamp, expand arrow. Clicking toggles expanded state. Props: `automation: AutomationRegistryRow`, `isExpanded: boolean`, `onToggle: () => void`.

Badges: zinc `#27272a` background with `#a1a1aa` text. Arrow: gold `▸` / `▾`.

- [ ] **Step 3: Write AutomationGroup component**

Collapsible section with gold left border header. Maps its automations to `AutomationRow` components. Renders the appropriate detail panel (Agent/Email/Assistant) for the expanded row. Props: `groupName: string`, `automations: AutomationRegistryRow[]`, `expandedId: string | null`, `onToggle: (id: string) => void`, `onUpdate: (id: string, data: Partial<AutomationRegistryRow>) => void`.

- [ ] **Step 4: Verify build**

Run: `npm run build`

- [ ] **Step 5: Commit**

```bash
git add src/components/automations/StatusBar.tsx src/components/automations/AutomationRow.tsx src/components/automations/AutomationGroup.tsx
git commit -m "feat: add StatusBar, AutomationRow, and AutomationGroup components"
```

---

## Task 8: GuidedControls + AskClaudePanel Components

**Files:**
- Create: `src/components/automations/GuidedControls.tsx`
- Create: `src/components/automations/AskClaudePanel.tsx`

- [ ] **Step 1: Write GuidedControls component**

Reusable guided controls panel with:
- Status toggle (Active/Paused buttons)
- Focus Areas — chip tags, gold when active, zinc when inactive, clickable to toggle
- Avoid — free-text input
- Priority This Week — free-text input
- Schedule display (read-only)

Props: `config: AgentConfig | EmailConfig | AssistantConfig`, `source: AutomationSource`, `status: AutomationStatus`, `schedule: string | null`, `onChange: (updates: Partial<...>) => void`.

For email automations, show tone/length chips instead of focus/avoid/priority. For assistants, show tone + topics_focus/topics_avoid chips + key_instructions text.

- [ ] **Step 2: Write AskClaudePanel component**

Right column panel:
- Textarea with placeholder "Tell Claude what you want this agent to do differently"
- "Update Agent" button → calls `/api/automations/registry/[id]/ask-claude`
- Preview Changes section: shows old vs. new config with red (removed) / green (added) coloring
- Apply / Cancel buttons

State machine: idle → loading → preview → idle. No intermediate server state.

- [ ] **Step 3: Verify build**

Run: `npm run build`

- [ ] **Step 4: Commit**

```bash
git add src/components/automations/GuidedControls.tsx src/components/automations/AskClaudePanel.tsx
git commit -m "feat: add GuidedControls and AskClaudePanel components"
```

---

## Task 9: RunHistoryList + SendHistoryList Components

**Files:**
- Create: `src/components/automations/RunHistoryList.tsx`
- Create: `src/components/automations/SendHistoryList.tsx`

- [ ] **Step 1: Write RunHistoryList**

Fetches from `/api/automations/registry/[id]/runs`. Shows list sorted newest first. Each entry: date/time, summary, status badge (success=green, error=red). Click to expand full_log. "Load More" button (paginated, 20 per page).

- [ ] **Step 2: Write SendHistoryList**

Queries `activity_log` table via Supabase client filtered by automation name. Shows date, recipient, subject. Click to expand full email body. Same pagination pattern.

- [ ] **Step 3: Verify build**

Run: `npm run build`

- [ ] **Step 4: Commit**

```bash
git add src/components/automations/RunHistoryList.tsx src/components/automations/SendHistoryList.tsx
git commit -m "feat: add RunHistoryList and SendHistoryList components"
```

---

## Task 10: Detail Panels — Agent, Email, Assistant

**Files:**
- Create: `src/components/automations/AgentDetailPanel.tsx`
- Create: `src/components/automations/EmailDetailPanel.tsx`
- Create: `src/components/automations/EmailTemplateEditor.tsx`
- Create: `src/components/automations/AssistantDetailPanel.tsx`

- [ ] **Step 1: Write AgentDetailPanel**

Three tabs: Controls | Run History | Prompt.

Controls tab: two-column layout. Left = `GuidedControls`, Right = `AskClaudePanel`. Bottom bar: "Save Changes" button (gold). No "Run Now" for Claude Code agents.

Run History tab: `RunHistoryList` component.

Prompt tab: read-only `<pre>` block showing `prompt_snapshot` from the registry row.

- [ ] **Step 2: Write EmailTemplateEditor**

Template editor with `{{variable}}` protection:
- Parse template text to identify `{{...}}` tokens
- Render variables as gold-background pills that can't be accidentally deleted
- Text between variables is directly editable
- Mode toggle below: AI Generated / Fixed Template / Hybrid (gold for selected, zinc for unselected)

Implementation: use a contentEditable div with non-editable `<span>` elements for variables, or a simpler approach: render the template as text with variables highlighted inline, and use a textarea for editing with a preview that renders variables as pills.

- [ ] **Step 3: Write EmailDetailPanel**

Four tabs: Email Preview | AI Prompt | Send History | Controls.

Email Preview tab: two columns. Left = `EmailTemplateEditor` + mode toggle. Right = tone/length chips, always/never include chips with "+ Add" button, "Or Tell Claude What to Change" textarea + "Update Prompt" button. Bottom: "Send Test Email" + "Save Changes".

AI Prompt tab: read-only prompt text from registry `prompt_snapshot`.

Send History tab: `SendHistoryList` component.

Controls tab: status toggle, trigger info, n8n workflow ID (reference), "Run Now" button.

- [ ] **Step 4: Write AssistantDetailPanel**

Two tabs: Controls | Prompt.

Controls tab: two columns. Left = `GuidedControls` (tone chips, topics_focus, topics_avoid, key_instructions). Right = `AskClaudePanel`. Bottom: "Save Changes".

Prompt tab: read-only display of system prompt from Supabase `system_prompts` table (existing API routes `/api/settings/system-prompt` and `/api/settings/outreach-prompt`).

- [ ] **Step 5: Verify build**

Run: `npm run build`

- [ ] **Step 6: Commit**

```bash
git add src/components/automations/AgentDetailPanel.tsx src/components/automations/EmailDetailPanel.tsx src/components/automations/EmailTemplateEditor.tsx src/components/automations/AssistantDetailPanel.tsx
git commit -m "feat: add Agent, Email, and Assistant detail panel components"
```

---

## Task 11: Command Center Page — Replace automations/page.tsx

**Files:**
- Modify: `src/app/dashboard/automations/page.tsx` (replace entirely)

- [ ] **Step 1: Write the new Command Center page**

The page:
1. Fetches all automations from `/api/automations/registry` on mount
2. Groups them by `group_name` using `AUTOMATION_GROUPS` ordering
3. Renders `StatusBar` at top
4. Renders `AutomationGroup` for each group
5. Manages expanded state (only one automation expanded at a time)
6. Handles Save Changes → PATCH `/api/automations/registry/[id]`
7. Handles Pause All / Resume All → POST `/api/automations/bulk-action`

Key layout:
- `'use client'` directive
- Full-width, max-width container
- Page title: "AUTOMATION COMMAND CENTER" in gold monospace
- Loading skeleton while fetching
- Error state with retry button

- [ ] **Step 2: Verify build**

Run: `npm run build`

- [ ] **Step 3: Verify page renders**

Start dev server, navigate to `/dashboard/automations`, confirm:
- Groups render with correct headings
- Rows show with status dots and badges
- Expanding a row shows the correct detail panel type
- Status bar shows correct counts

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/automations/page.tsx
git commit -m "feat: replace automations page with Automation Command Center"
```

---

## Task 12: Rewire AutomationPanel + AutomationCard (Loan/Contact Records)

**Files:**
- Modify: `src/components/automations/AutomationPanel.tsx`
- Modify: `src/components/automations/AutomationCard.tsx`
- Create: `src/components/automations/InlineDraftEditor.tsx`

- [ ] **Step 1: Write InlineDraftEditor**

Inline draft editor for loan/contact records:
- Full email preview (subject + body) with direct text editing
- Instruction input below ("Refine this draft..." placeholder)
- Refine button → calls `/api/automations/email/[draftId]/refine`
- Send / Discard buttons
- Same state machine as current AutomationCard but calls new endpoints

- [ ] **Step 2: Update AutomationPanel to fetch from registry**

Replace the import of `CONTACT_AUTOMATIONS` / `LOAN_AUTOMATIONS` from `definitions.ts` with a Supabase query to `automation_registry` filtered by email-related automations. The panel fetches automations where `source = 'n8n'` and `email_mode IS NOT NULL` (or where the group is 'Email Automations').

For loan records, filter to loan-relevant automations. For contact records, filter to contact-relevant automations.

- [ ] **Step 3: Update AutomationCard to call new email routes**

Change API endpoints:
- `handleGenerate`: POST to `/api/automations/email/generate` with `{ automationRegistryId, recordType, recordId }`
- `handleRefine`: POST to `/api/automations/email/[draftId]/refine` with `{ instruction, currentSubject, currentBody }`
- `handleSend`: POST to `/api/automations/email/[draftId]/send`

- [ ] **Step 4: Verify build**

Run: `npm run build`

- [ ] **Step 5: Commit**

```bash
git add src/components/automations/AutomationPanel.tsx src/components/automations/AutomationCard.tsx src/components/automations/InlineDraftEditor.tsx
git commit -m "feat: rewire AutomationPanel and AutomationCard to use registry + n8n email routes"
```

---

## Task 13: Remove Old Files

**Files:**
- Remove: `src/lib/automations/prompts.ts`
- Remove: `src/lib/automations/definitions.ts`
- Remove: `src/app/api/automations/generate/route.ts`
- Remove: `src/app/api/automations/refine/route.ts`
- Remove: `src/app/api/automations/send/route.ts`

- [ ] **Step 1: Check for remaining imports of old files**

Run: `grep -r "from.*automations/definitions" src/` and `grep -r "from.*automations/prompts" src/` to find any remaining references.

Expected: No references remain (AutomationPanel and AutomationCard were updated in Task 12).

- [ ] **Step 2: Delete old files**

```bash
rm src/lib/automations/prompts.ts
rm src/lib/automations/definitions.ts
rm src/app/api/automations/generate/route.ts
rm src/app/api/automations/refine/route.ts
rm src/app/api/automations/send/route.ts
```

- [ ] **Step 3: Verify build**

Run: `npm run build`

Expected: Build passes — no references to deleted files.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: remove old prompts.ts, definitions.ts, and legacy automation API routes"
```

---

## Task 14: Regenerate Database Types

**Files:**
- Modify: `src/lib/database.types.ts`

- [ ] **Step 1: Regenerate types**

Run: `mcp__e3151559-...__generate_typescript_types` for project `uuqedsvjlkeszrbwzizl`

- [ ] **Step 2: Copy generated types to database.types.ts**

Replace the file content with the output.

- [ ] **Step 3: Verify build**

Run: `npm run build`

- [ ] **Step 4: Commit**

```bash
git add src/lib/database.types.ts
git commit -m "chore: regenerate database types after automation_registry migration"
```

---

## Task 15: Full Build + Push + Verify Deployment

- [ ] **Step 1: Run full build**

Run: `npm run build` from `/Users/adamstyer/Documents/loanos-clone`

Expected: Build passes cleanly.

- [ ] **Step 2: Push to GitHub**

```bash
git push origin main
```

- [ ] **Step 3: Verify Vercel deployment**

Use `mcp__ffdaa602-...__list_deployments` to check deployment status.

Wait for `state: READY`.

- [ ] **Step 4: Verify deployment is healthy**

Use `mcp__ffdaa602-...__get_deployment_build_logs` if needed.

Expected: Deployment reaches READY state.

- [ ] **Step 5: Update CONTEXT.md and CHANGELOG.md**

Per end-of-session rule:
- Update `CONTEXT.md` with everything built
- Update `CHANGELOG.md` with the Automation Command Center entry
- Commit and push

---

## Summary

| Task | What | Files |
|------|------|-------|
| 1 | DB schema (registry + runs + email_drafts alter) | migration 064 |
| 2 | RLS policies | migration 065 |
| 3 | Seed 40 automations | migration 066 |
| 4 | TypeScript types + groups | types.ts, groups.ts |
| 5 | Registry API routes (6 routes) | registry/, bulk-action/ |
| 6 | Email API routes (4 routes) | email/ |
| 7 | StatusBar + Row + Group components | 3 components |
| 8 | GuidedControls + AskClaudePanel | 2 components |
| 9 | RunHistoryList + SendHistoryList | 2 components |
| 10 | Detail panels (Agent + Email + Assistant) | 4 components |
| 11 | Command Center page | page.tsx replacement |
| 12 | Rewire loan/contact record components | Panel + Card + InlineDraftEditor |
| 13 | Remove old files | 5 deletions |
| 14 | Regenerate DB types | database.types.ts |
| 15 | Build + push + verify deployment | ops |
