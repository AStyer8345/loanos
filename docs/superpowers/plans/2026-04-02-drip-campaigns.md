# Drip Campaigns Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a drip campaign system that auto-sends personalized emails and handwritten cards to past clients, cold leads, and realtors — managed entirely from the LoanOS dashboard.

**Architecture:** 4 new Supabase tables define campaigns, steps, enrollments, and send history. A daily n8n scheduler queries due enrollments, generates emails via Claude from skeleton prompts + real borrower data, and either auto-sends via Outlook or queues for approval. The LoanOS dashboard provides full visibility and manual control.

**Tech Stack:** Next.js 14 (App Router), Supabase (Postgres + RLS), n8n (scheduler + webhooks), Claude API (email generation), Tailwind CSS, TypeScript strict mode.

**Spec:** `docs/superpowers/specs/2026-04-02-drip-campaigns-design.md`

---

## File Structure

### New Files

```
supabase/migrations/
  071_drip_campaigns_tables.sql          -- 4 new tables + enums + indexes
  072_drip_campaigns_rls.sql             -- RLS policies for all 4 tables
  073_seed_drip_campaigns.sql            -- Seed campaign definitions + steps

src/lib/drip/
  types.ts                               -- TypeScript types for drip system
  queries.ts                             -- Supabase query helpers (CRUD for campaigns, enrollments, sends)

src/app/api/drip/
  campaigns/route.ts                     -- GET all campaigns, POST new campaign
  campaigns/[id]/route.ts                -- GET detail, PATCH update campaign
  campaigns/[id]/steps/route.ts          -- GET steps, POST new step, PATCH update step
  campaigns/[id]/enrollments/route.ts    -- GET enrollments, POST enroll contact, PATCH update
  campaigns/[id]/enrollments/[enrollmentId]/route.ts -- PATCH (pause/resume/remove), DELETE
  approval-queue/route.ts                -- GET pending sends, PATCH approve/skip/cancel
  approval-queue/[sendId]/route.ts       -- PATCH single send (approve, edit+approve, skip)

src/app/dashboard/drip-campaigns/
  page.tsx                               -- Campaign overview (Level 1)
  [id]/page.tsx                          -- Campaign detail with tabs (Level 2)
  approval/page.tsx                      -- Approval queue (Level 3)

src/components/drip/
  CampaignCard.tsx                       -- Campaign row in overview list
  StepCard.tsx                           -- Step row in campaign detail
  EnrollmentTable.tsx                    -- Enrolled contacts table
  SendHistoryTable.tsx                   -- Send history table
  ExitRulesPanel.tsx                     -- Exit rules display/edit
  ApprovalCard.tsx                       -- Single pending email in approval queue
  StepEditor.tsx                         -- Inline editor for step skeleton/config
```

### Modified Files

```
src/lib/database.types.ts                -- Regenerated after migration (auto)
src/components/TopNav.tsx                -- Add "Drip Campaigns" nav link
```

---

## Phase 1: Database & Types (Tasks 1-3)

### Task 1: Create Drip Campaign Tables

**Files:**
- Create: `supabase/migrations/071_drip_campaigns_tables.sql`

- [ ] **Step 1: Write the migration SQL**

```sql
-- 071_drip_campaigns_tables.sql
-- Drip campaign system: campaigns, steps, enrollments, sends

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE drip_audience AS ENUM ('past_client', 'lead', 'realtor');
CREATE TYPE drip_campaign_status AS ENUM ('active', 'paused', 'archived');
CREATE TYPE drip_trigger_type AS ENUM ('relative_days', 'annual_date', 'condition');
CREATE TYPE drip_channel AS ENUM ('email', 'handwritten_card', 'both');
CREATE TYPE drip_tone AS ENUM ('straight_shooter', 'knowledgeable_friend', 'quiet_confidence');
CREATE TYPE drip_enrollment_status AS ENUM ('active', 'paused', 'completed', 'removed');
CREATE TYPE drip_enrolled_by AS ENUM ('auto', 'manual');
CREATE TYPE drip_send_status AS ENUM ('queued', 'approved', 'sent', 'skipped', 'cancelled');

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE drip_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  audience drip_audience NOT NULL,
  status drip_campaign_status NOT NULL DEFAULT 'active',
  description TEXT,
  exit_rules JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, name)
);

CREATE TABLE drip_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES drip_campaigns(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  name TEXT NOT NULL,
  trigger_type drip_trigger_type NOT NULL,
  trigger_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  skeleton TEXT NOT NULL,
  channel drip_channel NOT NULL DEFAULT 'email',
  requires_approval BOOLEAN NOT NULL DEFAULT false,
  tone drip_tone NOT NULL DEFAULT 'knowledgeable_friend',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, step_order)
);

CREATE TABLE drip_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES drip_campaigns(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  loan_id UUID REFERENCES loans(id) ON DELETE SET NULL,
  status drip_enrollment_status NOT NULL DEFAULT 'active',
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  enrolled_by drip_enrolled_by NOT NULL DEFAULT 'manual',
  removed_at TIMESTAMPTZ,
  removed_reason TEXT,
  current_step INTEGER NOT NULL DEFAULT 0,
  next_send_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, contact_id)
);

CREATE TABLE drip_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES drip_enrollments(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES drip_steps(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  channel drip_channel NOT NULL DEFAULT 'email',
  status drip_send_status NOT NULL DEFAULT 'queued',
  email_draft_id UUID REFERENCES email_drafts(id) ON DELETE SET NULL,
  generated_subject TEXT,
  generated_body TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_drip_campaigns_org ON drip_campaigns(org_id);
CREATE INDEX idx_drip_steps_campaign ON drip_steps(campaign_id);
CREATE INDEX idx_drip_enrollments_campaign ON drip_enrollments(campaign_id);
CREATE INDEX idx_drip_enrollments_contact ON drip_enrollments(contact_id);
CREATE INDEX idx_drip_enrollments_next_send ON drip_enrollments(next_send_at) WHERE status = 'active';
CREATE INDEX idx_drip_sends_enrollment ON drip_sends(enrollment_id);
CREATE INDEX idx_drip_sends_status ON drip_sends(status) WHERE status = 'queued';

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================

CREATE TRIGGER set_drip_campaigns_updated_at
  BEFORE UPDATE ON drip_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_drip_steps_updated_at
  BEFORE UPDATE ON drip_steps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_drip_enrollments_updated_at
  BEFORE UPDATE ON drip_enrollments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

- [ ] **Step 2: Apply the migration**

Run via Supabase MCP: `apply_migration` with name `drip_campaigns_tables` and the SQL above. Project ID: `uuqedsvjlkeszrbwzizl`.

- [ ] **Step 3: Verify tables exist**

Run via Supabase MCP: `execute_sql` with:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'drip_%'
ORDER BY table_name;
```

Expected: `drip_campaigns`, `drip_enrollments`, `drip_sends`, `drip_steps`

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/071_drip_campaigns_tables.sql
git commit -m "feat: add drip campaign tables (campaigns, steps, enrollments, sends)"
```

---

### Task 2: Add RLS Policies

**Files:**
- Create: `supabase/migrations/072_drip_campaigns_rls.sql`

- [ ] **Step 1: Write the RLS migration**

```sql
-- 072_drip_campaigns_rls.sql
-- Row-level security for drip campaign tables

-- ============================================================
-- ENABLE RLS
-- ============================================================

ALTER TABLE drip_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE drip_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE drip_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE drip_sends ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- drip_campaigns
-- ============================================================

CREATE POLICY "drip_campaigns_select" ON drip_campaigns
  FOR SELECT USING (org_id = get_my_organization_id());

CREATE POLICY "drip_campaigns_insert" ON drip_campaigns
  FOR INSERT WITH CHECK (org_id = get_my_organization_id());

CREATE POLICY "drip_campaigns_update" ON drip_campaigns
  FOR UPDATE USING (org_id = get_my_organization_id());

CREATE POLICY "drip_campaigns_delete" ON drip_campaigns
  FOR DELETE USING (org_id = get_my_organization_id() AND get_my_role() = 'admin');

-- ============================================================
-- drip_steps
-- ============================================================

CREATE POLICY "drip_steps_select" ON drip_steps
  FOR SELECT USING (org_id = get_my_organization_id());

CREATE POLICY "drip_steps_insert" ON drip_steps
  FOR INSERT WITH CHECK (org_id = get_my_organization_id());

CREATE POLICY "drip_steps_update" ON drip_steps
  FOR UPDATE USING (org_id = get_my_organization_id());

CREATE POLICY "drip_steps_delete" ON drip_steps
  FOR DELETE USING (org_id = get_my_organization_id() AND get_my_role() = 'admin');

-- ============================================================
-- drip_enrollments
-- ============================================================

CREATE POLICY "drip_enrollments_select" ON drip_enrollments
  FOR SELECT USING (org_id = get_my_organization_id());

CREATE POLICY "drip_enrollments_insert" ON drip_enrollments
  FOR INSERT WITH CHECK (org_id = get_my_organization_id());

CREATE POLICY "drip_enrollments_update" ON drip_enrollments
  FOR UPDATE USING (org_id = get_my_organization_id());

CREATE POLICY "drip_enrollments_delete" ON drip_enrollments
  FOR DELETE USING (org_id = get_my_organization_id() AND get_my_role() = 'admin');

-- ============================================================
-- drip_sends
-- ============================================================

CREATE POLICY "drip_sends_select" ON drip_sends
  FOR SELECT USING (org_id = get_my_organization_id());

CREATE POLICY "drip_sends_insert" ON drip_sends
  FOR INSERT WITH CHECK (org_id = get_my_organization_id());

CREATE POLICY "drip_sends_update" ON drip_sends
  FOR UPDATE USING (org_id = get_my_organization_id());
```

- [ ] **Step 2: Apply the migration**

Run via Supabase MCP: `apply_migration` with name `drip_campaigns_rls`.

- [ ] **Step 3: Verify RLS is enabled**

Run via Supabase MCP: `execute_sql` with:
```sql
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public' AND tablename LIKE 'drip_%';
```

Expected: all 4 tables show `rowsecurity = true`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/072_drip_campaigns_rls.sql
git commit -m "feat: add RLS policies for drip campaign tables"
```

---

### Task 3: Create TypeScript Types

**Files:**
- Create: `src/lib/drip/types.ts`

- [ ] **Step 1: Write the types file**

```typescript
// src/lib/drip/types.ts
// TypeScript types for the drip campaign system

export type DripAudience = 'past_client' | 'lead' | 'realtor'
export type DripCampaignStatus = 'active' | 'paused' | 'archived'
export type DripTriggerType = 'relative_days' | 'annual_date' | 'condition'
export type DripChannel = 'email' | 'handwritten_card' | 'both'
export type DripTone = 'straight_shooter' | 'knowledgeable_friend' | 'quiet_confidence'
export type DripEnrollmentStatus = 'active' | 'paused' | 'completed' | 'removed'
export type DripEnrolledBy = 'auto' | 'manual'
export type DripSendStatus = 'queued' | 'approved' | 'sent' | 'skipped' | 'cancelled'

export interface ExitRule {
  type: 'status_change' | 'bounce_limit' | 'unsubscribe' | 'inactive'
  config: {
    statuses?: string[]       // e.g. ["under_contract", "active_loan"]
    max_bounces?: number      // e.g. 2
  }
}

export interface TriggerConfig {
  days?: number               // for relative_days
  date_field?: string         // for annual_date, e.g. "birthday", "closing_date"
  rate_drop_threshold?: number // for condition, e.g. 0.75
}

export interface DripCampaignRow {
  id: string
  org_id: string
  name: string
  audience: DripAudience
  status: DripCampaignStatus
  description: string | null
  exit_rules: ExitRule[]
  created_at: string
  updated_at: string
}

export interface DripStepRow {
  id: string
  org_id: string
  campaign_id: string
  step_order: number
  name: string
  trigger_type: DripTriggerType
  trigger_config: TriggerConfig
  skeleton: string
  channel: DripChannel
  requires_approval: boolean
  tone: DripTone
  created_at: string
  updated_at: string
}

export interface DripEnrollmentRow {
  id: string
  org_id: string
  campaign_id: string
  contact_id: string
  loan_id: string | null
  status: DripEnrollmentStatus
  enrolled_at: string
  enrolled_by: DripEnrolledBy
  removed_at: string | null
  removed_reason: string | null
  current_step: number
  next_send_at: string | null
  created_at: string
  updated_at: string
}

export interface DripSendRow {
  id: string
  org_id: string
  enrollment_id: string
  step_id: string
  contact_id: string
  channel: DripChannel
  status: DripSendStatus
  email_draft_id: string | null
  generated_subject: string | null
  generated_body: string | null
  sent_at: string | null
  created_at: string
}

// Joined types for UI display
export interface DripCampaignWithStats extends DripCampaignRow {
  step_count: number
  enrollment_count: number
  last_send_at: string | null
}

export interface DripEnrollmentWithContact extends DripEnrollmentRow {
  contact_name: string
  contact_email: string
  property_address: string | null
  next_step_name: string | null
}

export interface DripSendWithDetails extends DripSendRow {
  contact_name: string
  contact_email: string
  step_name: string
  campaign_name: string
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd /Users/adamstyer/Documents/loanos-clone && npx tsc --noEmit src/lib/drip/types.ts`

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/drip/types.ts
git commit -m "feat: add TypeScript types for drip campaign system"
```

---

## Phase 2: API Routes (Tasks 4-8)

### Task 4: Query Helpers

**Files:**
- Create: `src/lib/drip/queries.ts`

- [ ] **Step 1: Write the query helpers**

```typescript
// src/lib/drip/queries.ts
// Supabase query helpers for drip campaigns

import { createServiceClient } from '@/lib/supabase/service'
import type {
  DripCampaignRow,
  DripCampaignWithStats,
  DripStepRow,
  DripEnrollmentRow,
  DripEnrollmentWithContact,
  DripSendRow,
  DripSendWithDetails,
  DripCampaignStatus,
  DripEnrollmentStatus,
  DripSendStatus,
} from './types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function supabase(): any {
  return createServiceClient()
}

// ── Campaigns ──────────────────────────────────────────────

export async function getCampaignsWithStats(orgId: string): Promise<DripCampaignWithStats[]> {
  const { data, error } = await supabase()
    .from('drip_campaigns')
    .select('*')
    .eq('org_id', orgId)
    .order('name')

  if (error) throw error
  const campaigns = (data ?? []) as DripCampaignRow[]

  // Get stats for each campaign in parallel
  const stats = await Promise.all(
    campaigns.map(async (c) => {
      const [stepRes, enrollRes, sendRes] = await Promise.all([
        supabase().from('drip_steps').select('id', { count: 'exact', head: true }).eq('campaign_id', c.id),
        supabase().from('drip_enrollments').select('id', { count: 'exact', head: true }).eq('campaign_id', c.id).eq('status', 'active'),
        supabase().from('drip_sends').select('sent_at').eq('org_id', orgId).not('sent_at', 'is', null).order('sent_at', { ascending: false }).limit(1),
      ])
      return {
        ...c,
        exit_rules: (c.exit_rules as unknown as DripCampaignWithStats['exit_rules']) ?? [],
        step_count: stepRes.count ?? 0,
        enrollment_count: enrollRes.count ?? 0,
        last_send_at: sendRes.data?.[0]?.sent_at ?? null,
      }
    })
  )

  return stats
}

export async function getCampaignById(orgId: string, id: string): Promise<DripCampaignRow | null> {
  const { data, error } = await supabase()
    .from('drip_campaigns')
    .select('*')
    .eq('id', id)
    .eq('org_id', orgId)
    .single()

  if (error) return null
  return data as DripCampaignRow
}

export async function updateCampaign(
  orgId: string,
  id: string,
  updates: Partial<Pick<DripCampaignRow, 'name' | 'description' | 'status' | 'exit_rules'>>
): Promise<DripCampaignRow> {
  const { data, error } = await supabase()
    .from('drip_campaigns')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('org_id', orgId)
    .select()
    .single()

  if (error) throw error
  return data as DripCampaignRow
}

// ── Steps ──────────────────────────────────────────────────

export async function getSteps(campaignId: string): Promise<DripStepRow[]> {
  const { data, error } = await supabase()
    .from('drip_steps')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('step_order')

  if (error) throw error
  return (data ?? []) as DripStepRow[]
}

export async function updateStep(
  orgId: string,
  stepId: string,
  updates: Partial<Pick<DripStepRow, 'name' | 'skeleton' | 'trigger_config' | 'channel' | 'requires_approval' | 'tone' | 'step_order'>>
): Promise<DripStepRow> {
  const { data, error } = await supabase()
    .from('drip_steps')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', stepId)
    .eq('org_id', orgId)
    .select()
    .single()

  if (error) throw error
  return data as DripStepRow
}

// ── Enrollments ────────────────────────────────────────────

export async function getEnrollments(
  orgId: string,
  campaignId: string,
  page = 1,
  limit = 50,
  search?: string
): Promise<{ data: DripEnrollmentWithContact[]; total: number }> {
  let query = supabase()
    .from('drip_enrollments')
    .select(`
      *,
      contacts!inner(first_name, last_name, email, property_address),
      drip_steps(name)
    `, { count: 'exact' })
    .eq('campaign_id', campaignId)
    .eq('org_id', orgId)
    .order('enrolled_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (search) {
    query = query.or(`contacts.first_name.ilike.%${search}%,contacts.last_name.ilike.%${search}%,contacts.email.ilike.%${search}%`)
  }

  const { data, error, count } = await query

  if (error) throw error

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data ?? []).map((row: any) => ({
    ...row,
    contact_name: `${row.contacts?.first_name ?? ''} ${row.contacts?.last_name ?? ''}`.trim(),
    contact_email: row.contacts?.email ?? '',
    property_address: row.contacts?.property_address ?? null,
    next_step_name: row.drip_steps?.name ?? null,
    contacts: undefined,
    drip_steps: undefined,
  })) as DripEnrollmentWithContact[]

  return { data: rows, total: count ?? 0 }
}

export async function enrollContact(
  orgId: string,
  campaignId: string,
  contactId: string,
  loanId: string | null,
  enrolledBy: 'auto' | 'manual',
  nextSendAt: string | null
): Promise<DripEnrollmentRow> {
  const { data, error } = await supabase()
    .from('drip_enrollments')
    .insert({
      org_id: orgId,
      campaign_id: campaignId,
      contact_id: contactId,
      loan_id: loanId,
      enrolled_by: enrolledBy,
      next_send_at: nextSendAt,
      current_step: 0,
      status: 'active',
    })
    .select()
    .single()

  if (error) throw error
  return data as DripEnrollmentRow
}

export async function updateEnrollment(
  orgId: string,
  enrollmentId: string,
  updates: Partial<Pick<DripEnrollmentRow, 'status' | 'removed_at' | 'removed_reason' | 'current_step' | 'next_send_at'>>
): Promise<DripEnrollmentRow> {
  const { data, error } = await supabase()
    .from('drip_enrollments')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', enrollmentId)
    .eq('org_id', orgId)
    .select()
    .single()

  if (error) throw error
  return data as DripEnrollmentRow
}

// ── Sends / Approval Queue ────────────────────────────────

export async function getApprovalQueue(orgId: string): Promise<DripSendWithDetails[]> {
  const { data, error } = await supabase()
    .from('drip_sends')
    .select(`
      *,
      contacts!inner(first_name, last_name, email),
      drip_steps!inner(name),
      drip_enrollments!inner(campaign_id, drip_campaigns!inner(name))
    `)
    .eq('org_id', orgId)
    .eq('status', 'queued')
    .order('created_at', { ascending: true })

  if (error) throw error

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any) => ({
    ...row,
    contact_name: `${row.contacts?.first_name ?? ''} ${row.contacts?.last_name ?? ''}`.trim(),
    contact_email: row.contacts?.email ?? '',
    step_name: row.drip_steps?.name ?? '',
    campaign_name: row.drip_enrollments?.drip_campaigns?.name ?? '',
    contacts: undefined,
    drip_steps: undefined,
    drip_enrollments: undefined,
  })) as DripSendWithDetails[]
}

export async function updateSendStatus(
  orgId: string,
  sendId: string,
  status: DripSendStatus,
  updates?: { generated_subject?: string; generated_body?: string }
): Promise<DripSendRow> {
  const payload: Record<string, unknown> = { status }
  if (status === 'sent') payload.sent_at = new Date().toISOString()
  if (updates?.generated_subject) payload.generated_subject = updates.generated_subject
  if (updates?.generated_body) payload.generated_body = updates.generated_body

  const { data, error } = await supabase()
    .from('drip_sends')
    .update(payload)
    .eq('id', sendId)
    .eq('org_id', orgId)
    .select()
    .single()

  if (error) throw error
  return data as DripSendRow
}

export async function getSendHistory(
  orgId: string,
  campaignId: string,
  page = 1,
  limit = 50
): Promise<{ data: DripSendWithDetails[]; total: number }> {
  const { data, error, count } = await supabase()
    .from('drip_sends')
    .select(`
      *,
      contacts!inner(first_name, last_name, email),
      drip_steps!inner(name, campaign_id),
      drip_enrollments!inner(campaign_id)
    `, { count: 'exact' })
    .eq('org_id', orgId)
    .eq('drip_enrollments.campaign_id', campaignId)
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (error) throw error

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data ?? []).map((row: any) => ({
    ...row,
    contact_name: `${row.contacts?.first_name ?? ''} ${row.contacts?.last_name ?? ''}`.trim(),
    contact_email: row.contacts?.email ?? '',
    step_name: row.drip_steps?.name ?? '',
    campaign_name: '',
    contacts: undefined,
    drip_steps: undefined,
    drip_enrollments: undefined,
  })) as DripSendWithDetails[]

  return { data: rows, total: count ?? 0 }
}

export async function getApprovalQueueCount(orgId: string): Promise<number> {
  const { count, error } = await supabase()
    .from('drip_sends')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .eq('status', 'queued')

  if (error) return 0
  return count ?? 0
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd /Users/adamstyer/Documents/loanos-clone && npx tsc --noEmit src/lib/drip/queries.ts`

Expected: no errors (may need to ignore service client type — use `any` cast per project pattern).

- [ ] **Step 3: Commit**

```bash
git add src/lib/drip/queries.ts
git commit -m "feat: add Supabase query helpers for drip campaigns"
```

---

### Task 5: Campaigns API Routes

**Files:**
- Create: `src/app/api/drip/campaigns/route.ts`
- Create: `src/app/api/drip/campaigns/[id]/route.ts`

- [ ] **Step 1: Write the campaigns list/create route**

```typescript
// src/app/api/drip/campaigns/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getOrganization } from '@/lib/getOrganization'
import { getCampaignsWithStats } from '@/lib/drip/queries'
import { createServiceClient } from '@/lib/supabase/service'
import type { DripAudience, DripCampaignStatus, ExitRule } from '@/lib/drip/types'

export async function GET() {
  try {
    const { organizationId } = await getOrganization()
    const campaigns = await getCampaignsWithStats(organizationId)
    return NextResponse.json({ campaigns })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { organizationId } = await getOrganization()
    const body = await req.json() as {
      name: string
      audience: DripAudience
      description?: string
      status?: DripCampaignStatus
      exit_rules?: ExitRule[]
    }

    if (!body.name || !body.audience) {
      return NextResponse.json({ error: 'name and audience are required' }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = createServiceClient()
    const { data, error } = await supabase
      .from('drip_campaigns')
      .insert({
        org_id: organizationId,
        name: body.name,
        audience: body.audience,
        description: body.description ?? null,
        status: body.status ?? 'active',
        exit_rules: body.exit_rules ?? [],
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A campaign with that name already exists' }, { status: 409 })
      }
      throw error
    }

    return NextResponse.json(data, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
```

- [ ] **Step 2: Write the campaign detail/update route**

```typescript
// src/app/api/drip/campaigns/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getOrganization } from '@/lib/getOrganization'
import { getCampaignById, updateCampaign } from '@/lib/drip/queries'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { organizationId } = await getOrganization()
    const campaign = await getCampaignById(organizationId, params.id)

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    return NextResponse.json(campaign)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { organizationId } = await getOrganization()
    const body = await req.json()

    const ALLOWED = ['name', 'description', 'status', 'exit_rules'] as const
    const updates: Record<string, unknown> = {}
    for (const field of ALLOWED) {
      if (field in body) updates[field] = body[field]
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const campaign = await updateCampaign(organizationId, params.id, updates)
    return NextResponse.json(campaign)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/drip/campaigns/
git commit -m "feat: add API routes for drip campaigns CRUD"
```

---

### Task 6: Steps API Route

**Files:**
- Create: `src/app/api/drip/campaigns/[id]/steps/route.ts`

- [ ] **Step 1: Write the steps route**

```typescript
// src/app/api/drip/campaigns/[id]/steps/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getOrganization } from '@/lib/getOrganization'
import { getSteps, updateStep, getCampaignById } from '@/lib/drip/queries'
import { createServiceClient } from '@/lib/supabase/service'
import type { DripTriggerType, DripChannel, DripTone, TriggerConfig } from '@/lib/drip/types'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { organizationId } = await getOrganization()
    const campaign = await getCampaignById(organizationId, params.id)
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const steps = await getSteps(params.id)
    return NextResponse.json({ steps })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { organizationId } = await getOrganization()
    const campaign = await getCampaignById(organizationId, params.id)
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const body = await req.json() as {
      name: string
      step_order: number
      trigger_type: DripTriggerType
      trigger_config: TriggerConfig
      skeleton: string
      channel?: DripChannel
      requires_approval?: boolean
      tone?: DripTone
    }

    if (!body.name || !body.trigger_type || !body.skeleton) {
      return NextResponse.json({ error: 'name, trigger_type, and skeleton are required' }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = createServiceClient()
    const { data, error } = await supabase
      .from('drip_steps')
      .insert({
        org_id: organizationId,
        campaign_id: params.id,
        step_order: body.step_order,
        name: body.name,
        trigger_type: body.trigger_type,
        trigger_config: body.trigger_config ?? {},
        skeleton: body.skeleton,
        channel: body.channel ?? 'email',
        requires_approval: body.requires_approval ?? false,
        tone: body.tone ?? 'knowledgeable_friend',
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { organizationId } = await getOrganization()
    const body = await req.json() as { stepId: string; updates: Record<string, unknown> }

    if (!body.stepId) {
      return NextResponse.json({ error: 'stepId is required' }, { status: 400 })
    }

    const ALLOWED = ['name', 'skeleton', 'trigger_config', 'channel', 'requires_approval', 'tone', 'step_order'] as const
    const updates: Record<string, unknown> = {}
    for (const field of ALLOWED) {
      if (field in body.updates) updates[field] = body.updates[field]
    }

    const step = await updateStep(organizationId, body.stepId, updates)
    return NextResponse.json(step)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/drip/campaigns/[id]/steps/
git commit -m "feat: add API route for drip campaign steps CRUD"
```

---

### Task 7: Enrollments API Route

**Files:**
- Create: `src/app/api/drip/campaigns/[id]/enrollments/route.ts`
- Create: `src/app/api/drip/campaigns/[id]/enrollments/[enrollmentId]/route.ts`

- [ ] **Step 1: Write the enrollments list/create route**

```typescript
// src/app/api/drip/campaigns/[id]/enrollments/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getOrganization } from '@/lib/getOrganization'
import { getEnrollments, enrollContact, getCampaignById } from '@/lib/drip/queries'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { organizationId } = await getOrganization()
    const campaign = await getCampaignById(organizationId, params.id)
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get('page') ?? '1', 10)
    const limit = parseInt(url.searchParams.get('limit') ?? '50', 10)
    const search = url.searchParams.get('search') ?? undefined

    const result = await getEnrollments(organizationId, params.id, page, limit, search)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { organizationId } = await getOrganization()
    const body = await req.json() as {
      contact_id: string
      loan_id?: string
      next_send_at?: string
    }

    if (!body.contact_id) {
      return NextResponse.json({ error: 'contact_id is required' }, { status: 400 })
    }

    const enrollment = await enrollContact(
      organizationId,
      params.id,
      body.contact_id,
      body.loan_id ?? null,
      'manual',
      body.next_send_at ?? null
    )

    return NextResponse.json(enrollment, { status: 201 })
  } catch (err) {
    if (err instanceof Error && err.message.includes('23505')) {
      return NextResponse.json({ error: 'Contact is already enrolled in this campaign' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
```

- [ ] **Step 2: Write the single enrollment route**

```typescript
// src/app/api/drip/campaigns/[id]/enrollments/[enrollmentId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getOrganization } from '@/lib/getOrganization'
import { updateEnrollment } from '@/lib/drip/queries'
import type { DripEnrollmentStatus } from '@/lib/drip/types'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; enrollmentId: string } }
) {
  try {
    const { organizationId } = await getOrganization()
    const body = await req.json() as {
      status?: DripEnrollmentStatus
      removed_reason?: string
      current_step?: number
      next_send_at?: string | null
    }

    const updates: Record<string, unknown> = {}

    if (body.status) {
      updates.status = body.status
      if (body.status === 'removed') {
        updates.removed_at = new Date().toISOString()
        updates.removed_reason = body.removed_reason ?? 'manual'
      }
    }
    if (body.current_step !== undefined) updates.current_step = body.current_step
    if (body.next_send_at !== undefined) updates.next_send_at = body.next_send_at

    const enrollment = await updateEnrollment(organizationId, params.enrollmentId, updates)
    return NextResponse.json(enrollment)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/drip/campaigns/[id]/enrollments/
git commit -m "feat: add API routes for drip enrollment management"
```

---

### Task 8: Approval Queue API Route

**Files:**
- Create: `src/app/api/drip/approval-queue/route.ts`
- Create: `src/app/api/drip/approval-queue/[sendId]/route.ts`

- [ ] **Step 1: Write the approval queue list route**

```typescript
// src/app/api/drip/approval-queue/route.ts
import { NextResponse } from 'next/server'
import { getOrganization } from '@/lib/getOrganization'
import { getApprovalQueue } from '@/lib/drip/queries'

export async function GET() {
  try {
    const { organizationId } = await getOrganization()
    const queue = await getApprovalQueue(organizationId)
    return NextResponse.json({ queue })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
```

- [ ] **Step 2: Write the single send action route**

```typescript
// src/app/api/drip/approval-queue/[sendId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getOrganization } from '@/lib/getOrganization'
import { updateSendStatus } from '@/lib/drip/queries'
import type { DripSendStatus } from '@/lib/drip/types'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { sendId: string } }
) {
  try {
    const { organizationId } = await getOrganization()
    const body = await req.json() as {
      action: 'approve' | 'skip' | 'cancel'
      edited_subject?: string
      edited_body?: string
    }

    const statusMap: Record<string, DripSendStatus> = {
      approve: 'approved',
      skip: 'skipped',
      cancel: 'cancelled',
    }

    const newStatus = statusMap[body.action]
    if (!newStatus) {
      return NextResponse.json({ error: 'Invalid action. Use: approve, skip, cancel' }, { status: 400 })
    }

    const updates = body.action === 'approve' && (body.edited_subject || body.edited_body)
      ? { generated_subject: body.edited_subject, generated_body: body.edited_body }
      : undefined

    const send = await updateSendStatus(organizationId, params.sendId, newStatus, updates)

    // TODO: If approved, trigger actual email send via Outlook n8n webhook
    // This will be wired up in Phase 4 (n8n integration)

    return NextResponse.json(send)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/drip/approval-queue/
git commit -m "feat: add API routes for drip approval queue"
```

---

## Phase 3: Dashboard UI (Tasks 9-13)

### Task 9: Campaign Overview Page (Level 1)

**Files:**
- Create: `src/app/dashboard/drip-campaigns/page.tsx`
- Create: `src/components/drip/CampaignCard.tsx`

- [ ] **Step 1: Write the CampaignCard component**

```typescript
// src/components/drip/CampaignCard.tsx
'use client'

import type { DripCampaignWithStats } from '@/lib/drip/types'

interface CampaignCardProps {
  campaign: DripCampaignWithStats
  onClick: () => void
}

export default function CampaignCard({ campaign, onClick }: CampaignCardProps) {
  const statusColor = campaign.status === 'active' ? 'text-loangreen' : 'text-loanmuted'
  const statusLabel = campaign.status === 'active' ? '\u25CF Active' : campaign.status === 'paused' ? '\u25CB Paused' : '\u25CB Archived'

  const lastSend = campaign.last_send_at
    ? `Last send: ${new Date(campaign.last_send_at).toLocaleDateString()}`
    : 'No sends yet'

  return (
    <div
      onClick={onClick}
      className="bg-surface border border-loanborder rounded-lg px-5 py-4 cursor-pointer transition-shadow hover:shadow-[0_2px_12px_rgba(0,0,0,0.08),0_0_0_1px_rgba(164,133,30,0.2),0_0_16px_rgba(164,133,30,0.06)]"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[13px] font-semibold tracking-wide">
            {campaign.name.toUpperCase()}
          </span>
          <span className={`text-[10px] ${statusColor}`}>{statusLabel}</span>
        </div>
        <div className="flex gap-6 font-mono text-[11px] text-loanmuted">
          <span>{campaign.step_count} steps</span>
          <span>{campaign.enrollment_count} enrolled</span>
          <span>{lastSend}</span>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Write the campaign overview page**

```typescript
// src/app/dashboard/drip-campaigns/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { DripCampaignWithStats } from '@/lib/drip/types'
import CampaignCard from '@/components/drip/CampaignCard'

export default function DripCampaignsPage() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<DripCampaignWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [approvalCount, setApprovalCount] = useState(0)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/drip/campaigns')
      const data = await res.json() as { campaigns: DripCampaignWithStats[] }
      setCampaigns(data.campaigns ?? [])

      const queueRes = await fetch('/api/drip/approval-queue')
      const queueData = await queueRes.json() as { queue: unknown[] }
      setApprovalCount(queueData.queue?.length ?? 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load campaigns')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void fetchData() }, [fetchData])

  const totalEnrolled = campaigns.reduce((sum, c) => sum + c.enrollment_count, 0)
  const activeCampaigns = campaigns.filter(c => c.status === 'active')

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-[28px] tracking-wide">DRIP CAMPAIGNS</h1>
        <div className="flex gap-3">
          <button className="font-mono text-xs px-4 py-2 border border-loanborder bg-surface rounded-lg hover:bg-surface2 transition-colors">
            + New Campaign
          </button>
          <button
            onClick={() => router.push('/dashboard/drip-campaigns/approval')}
            className="font-mono text-xs px-4 py-2 border border-loanborder bg-surface rounded-lg hover:bg-surface2 transition-colors"
          >
            Approval Queue
            {approvalCount > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-gold text-white text-[10px] font-semibold rounded-full">
                {approvalCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-7">
        <div className="bg-surface border border-loanborder rounded-lg p-5 border-l-[3px] border-l-gold">
          <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-foreground mb-1">Active Enrollments</div>
          <div className="font-display text-[32px] text-gold">{totalEnrolled}</div>
        </div>
        <div className="bg-surface border border-loanborder rounded-lg p-5 border-l-[3px] border-l-loangreen">
          <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-foreground mb-1">Active Campaigns</div>
          <div className="font-display text-[32px] text-loangreen">{activeCampaigns.length}</div>
        </div>
        <div className="bg-surface border border-loanborder rounded-lg p-5 border-l-[3px] border-l-[#e67e22]">
          <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-foreground mb-1">Awaiting Approval</div>
          <div className="font-display text-[32px] text-[#e67e22]">{approvalCount}</div>
        </div>
      </div>

      {/* Campaign List */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-surface border border-loanborder rounded-lg px-5 py-4 animate-pulse">
              <div className="h-4 w-48 bg-surface2 rounded" />
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="text-center py-12 text-loanred font-mono text-sm">{error}</div>
      )}

      {!loading && !error && campaigns.length === 0 && (
        <div className="text-center py-12 text-loanmuted font-mono text-sm">
          No drip campaigns yet. Create your first one to get started.
        </div>
      )}

      {!loading && !error && campaigns.length > 0 && (
        <div className="space-y-3">
          {campaigns.map(campaign => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              onClick={() => router.push(`/dashboard/drip-campaigns/${campaign.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Verify it compiles**

Run: `cd /Users/adamstyer/Documents/loanos-clone && npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/drip-campaigns/page.tsx src/components/drip/CampaignCard.tsx
git commit -m "feat: add drip campaigns overview page (Level 1)"
```

---

### Task 10: Campaign Detail Page (Level 2) — Steps & Skeletons Tab

**Files:**
- Create: `src/app/dashboard/drip-campaigns/[id]/page.tsx`
- Create: `src/components/drip/StepCard.tsx`
- Create: `src/components/drip/StepEditor.tsx`

- [ ] **Step 1: Write the StepCard component**

```typescript
// src/components/drip/StepCard.tsx
'use client'

import type { DripStepRow } from '@/lib/drip/types'

interface StepCardProps {
  step: DripStepRow
  onEdit: () => void
}

export default function StepCard({ step, onEdit }: StepCardProps) {
  const approvalTag = step.requires_approval
    ? { label: 'needs approval', className: 'text-[#e67e22] bg-[rgba(230,126,34,0.1)]' }
    : { label: 'auto-send', className: 'text-loangreen bg-[rgba(22,163,74,0.1)]' }

  const channelLabel = step.channel === 'both' ? 'email + card' : step.channel.replace('_', ' ')

  const triggerLabel = step.trigger_type === 'relative_days'
    ? `Trigger: ${step.trigger_config.days} days after enrollment`
    : step.trigger_type === 'annual_date'
    ? `Trigger: yearly on ${step.trigger_config.date_field}`
    : `Trigger: condition-based`

  return (
    <div className="bg-surface border border-loanborder rounded-lg px-5 py-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] font-semibold bg-surface2 text-gold px-2.5 py-0.5 rounded">
              {step.step_order}
            </span>
            <span className="text-[13px] font-semibold">{step.name}</span>
            <span className={`font-mono text-[10px] font-medium px-2 py-0.5 rounded ${approvalTag.className}`}>
              {approvalTag.label}
            </span>
            <span className="font-mono text-[10px] text-loanmuted bg-surface2 px-2 py-0.5 rounded">
              {channelLabel}
            </span>
          </div>
          <div className="font-mono text-[11px] text-loanmuted mt-1.5 ml-[42px]">
            {triggerLabel}
          </div>
          <div className="text-[12px] text-loanmuted/60 italic mt-1 ml-[42px] leading-relaxed">
            &ldquo;{step.skeleton}&rdquo;
          </div>
        </div>
        <button
          onClick={onEdit}
          className="font-mono text-[11px] text-gold hover:text-gold/80 transition-colors"
        >
          Edit
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Write the StepEditor component**

```typescript
// src/components/drip/StepEditor.tsx
'use client'

import { useState } from 'react'
import type { DripStepRow } from '@/lib/drip/types'

interface StepEditorProps {
  step: DripStepRow
  campaignId: string
  onSave: (updated: DripStepRow) => void
  onCancel: () => void
}

export default function StepEditor({ step, campaignId, onSave, onCancel }: StepEditorProps) {
  const [skeleton, setSkeleton] = useState(step.skeleton)
  const [requiresApproval, setRequiresApproval] = useState(step.requires_approval)
  const [tone, setTone] = useState(step.tone)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/drip/campaigns/${campaignId}/steps`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepId: step.id,
          updates: { skeleton, requires_approval: requiresApproval, tone },
        }),
      })
      const updated = await res.json() as DripStepRow
      onSave(updated)
    } catch (err) {
      console.error('Failed to save step:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-surface border-2 border-gold/30 rounded-lg px-5 py-4 space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <span className="font-mono text-[10px] font-semibold bg-surface2 text-gold px-2.5 py-0.5 rounded">
          {step.step_order}
        </span>
        <span className="text-[13px] font-semibold">{step.name}</span>
      </div>

      <div>
        <label className="font-mono text-[11px] font-semibold uppercase tracking-wider block mb-1">Skeleton Prompt</label>
        <textarea
          value={skeleton}
          onChange={(e) => setSkeleton(e.target.value)}
          className="w-full bg-surface2 border border-loanborder rounded-lg px-3 py-2 text-sm font-sans resize-y min-h-[80px]"
        />
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 font-mono text-xs">
          <input
            type="checkbox"
            checked={requiresApproval}
            onChange={(e) => setRequiresApproval(e.target.checked)}
            className="accent-gold"
          />
          Requires approval
        </label>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] font-semibold uppercase">Tone:</span>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value as DripStepRow['tone'])}
            className="bg-surface2 border border-loanborder rounded px-2 py-1 font-mono text-xs"
          >
            <option value="knowledgeable_friend">Knowledgeable Friend</option>
            <option value="straight_shooter">Straight Shooter</option>
            <option value="quiet_confidence">Quiet Confidence</option>
          </select>
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="font-mono text-xs px-4 py-2 border border-loanborder bg-surface rounded-lg hover:bg-surface2">
          Cancel
        </button>
        <button onClick={handleSave} disabled={saving} className="font-mono text-xs px-4 py-2 bg-gold text-white rounded-lg hover:bg-gold/90 disabled:opacity-50">
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Write the campaign detail page**

```typescript
// src/app/dashboard/drip-campaigns/[id]/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import type { DripCampaignRow, DripStepRow, DripEnrollmentWithContact, DripSendWithDetails } from '@/lib/drip/types'
import StepCard from '@/components/drip/StepCard'
import StepEditor from '@/components/drip/StepEditor'
import EnrollmentTable from '@/components/drip/EnrollmentTable'
import SendHistoryTable from '@/components/drip/SendHistoryTable'
import ExitRulesPanel from '@/components/drip/ExitRulesPanel'

type Tab = 'steps' | 'enrolled' | 'history' | 'rules'

export default function CampaignDetailPage() {
  const params = useParams()
  const router = useRouter()
  const campaignId = params.id as string

  const [campaign, setCampaign] = useState<DripCampaignRow | null>(null)
  const [steps, setSteps] = useState<DripStepRow[]>([])
  const [activeTab, setActiveTab] = useState<Tab>('steps')
  const [editingStepId, setEditingStepId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchCampaign = useCallback(async () => {
    setLoading(true)
    try {
      const [campRes, stepsRes] = await Promise.all([
        fetch(`/api/drip/campaigns/${campaignId}`),
        fetch(`/api/drip/campaigns/${campaignId}/steps`),
      ])
      const campData = await campRes.json() as DripCampaignRow
      const stepsData = await stepsRes.json() as { steps: DripStepRow[] }
      setCampaign(campData)
      setSteps(stepsData.steps ?? [])
    } catch (err) {
      console.error('Failed to load campaign:', err)
    } finally {
      setLoading(false)
    }
  }, [campaignId])

  useEffect(() => { void fetchCampaign() }, [fetchCampaign])

  function handleStepSaved(updated: DripStepRow) {
    setSteps(prev => prev.map(s => s.id === updated.id ? updated : s))
    setEditingStepId(null)
  }

  async function handleStatusToggle() {
    if (!campaign) return
    const newStatus = campaign.status === 'active' ? 'paused' : 'active'
    const res = await fetch(`/api/drip/campaigns/${campaignId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    const updated = await res.json() as DripCampaignRow
    setCampaign(updated)
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-surface2 rounded" />
          <div className="h-4 w-96 bg-surface2 rounded" />
        </div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8 text-center text-loanmuted font-mono">
        Campaign not found.
      </div>
    )
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'steps', label: 'Steps & Skeletons' },
    { key: 'enrolled', label: `Enrolled Contacts` },
    { key: 'history', label: 'Send History' },
    { key: 'rules', label: 'Exit Rules' },
  ]

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <button onClick={() => router.push('/dashboard/drip-campaigns')} className="font-mono text-[11px] text-gold hover:text-gold/80 mb-2 block">
            &larr; All Campaigns
          </button>
          <h1 className="font-display text-[24px] tracking-wide">{campaign.name.toUpperCase()}</h1>
          <p className="font-mono text-[11px] text-loanmuted mt-1">
            {campaign.description} &middot; {steps.length} steps &middot; {campaign.status}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleStatusToggle} className="font-mono text-xs px-4 py-2 border border-loanborder bg-surface rounded-lg hover:bg-surface2">
            {campaign.status === 'active' ? 'Pause' : 'Resume'}
          </button>
          <button className="font-mono text-xs px-4 py-2 bg-gold text-white rounded-lg hover:bg-gold/90">
            + Add Contact
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-loanborder mb-5">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2.5 font-mono text-xs font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'text-gold border-gold'
                : 'text-loanmuted border-transparent hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'steps' && (
        <div className="space-y-2">
          {steps.map(step =>
            editingStepId === step.id ? (
              <StepEditor
                key={step.id}
                step={step}
                campaignId={campaignId}
                onSave={handleStepSaved}
                onCancel={() => setEditingStepId(null)}
              />
            ) : (
              <StepCard
                key={step.id}
                step={step}
                onEdit={() => setEditingStepId(step.id)}
              />
            )
          )}
        </div>
      )}

      {activeTab === 'enrolled' && (
        <EnrollmentTable campaignId={campaignId} />
      )}

      {activeTab === 'history' && (
        <SendHistoryTable campaignId={campaignId} />
      )}

      {activeTab === 'rules' && campaign && (
        <ExitRulesPanel campaign={campaign} onUpdate={setCampaign} />
      )}
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/drip-campaigns/[id]/page.tsx src/components/drip/StepCard.tsx src/components/drip/StepEditor.tsx
git commit -m "feat: add campaign detail page with steps & skeletons tab"
```

---

### Task 11: Enrolled Contacts Table Component

**Files:**
- Create: `src/components/drip/EnrollmentTable.tsx`

- [ ] **Step 1: Write the EnrollmentTable component**

```typescript
// src/components/drip/EnrollmentTable.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import type { DripEnrollmentWithContact } from '@/lib/drip/types'

interface EnrollmentTableProps {
  campaignId: string
}

export default function EnrollmentTable({ campaignId }: EnrollmentTableProps) {
  const [enrollments, setEnrollments] = useState<DripEnrollmentWithContact[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const limit = 50

  const fetchEnrollments = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (search) params.set('search', search)
      const res = await fetch(`/api/drip/campaigns/${campaignId}/enrollments?${params}`)
      const data = await res.json() as { data: DripEnrollmentWithContact[]; total: number }
      setEnrollments(data.data ?? [])
      setTotal(data.total ?? 0)
    } catch (err) {
      console.error('Failed to load enrollments:', err)
    } finally {
      setLoading(false)
    }
  }, [campaignId, page, search])

  useEffect(() => { void fetchEnrollments() }, [fetchEnrollments])

  async function handleAction(enrollmentId: string, action: 'pause' | 'resume' | 'remove') {
    const statusMap = { pause: 'paused', resume: 'active', remove: 'removed' } as const
    await fetch(`/api/drip/campaigns/${campaignId}/enrollments/${enrollmentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: statusMap[action], removed_reason: action === 'remove' ? 'manual' : undefined }),
    })
    void fetchEnrollments()
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div>
      {/* Search */}
      <div className="flex gap-3 mb-4">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          placeholder="Search contacts..."
          className="flex-1 bg-surface2 border border-loanborder rounded-lg px-3 py-2 font-mono text-xs"
        />
      </div>

      {/* Table */}
      <div className="border border-loanborder rounded-lg overflow-hidden">
        <div className="grid grid-cols-[2fr_1.8fr_1fr_1fr_1.5fr_0.4fr] px-5 py-3 bg-surface2 font-mono text-[11px] font-semibold uppercase tracking-wider">
          <span>Contact</span>
          <span>Property</span>
          <span>Enrolled</span>
          <span>Next Send</span>
          <span>Next Step</span>
          <span></span>
        </div>

        {loading && (
          <div className="px-5 py-8 text-center font-mono text-xs text-loanmuted animate-pulse">
            Loading...
          </div>
        )}

        {!loading && enrollments.length === 0 && (
          <div className="px-5 py-8 text-center font-mono text-xs text-loanmuted">
            No contacts enrolled.
          </div>
        )}

        {!loading && enrollments.map(e => (
          <div
            key={e.id}
            className={`grid grid-cols-[2fr_1.8fr_1fr_1fr_1.5fr_0.4fr] px-5 py-3.5 border-t border-loanborder font-mono text-xs items-center hover:bg-[rgba(164,133,30,0.04)] ${
              e.status !== 'active' ? 'opacity-50' : ''
            }`}
          >
            <span className="font-medium">{e.contact_name}</span>
            <span className="text-loanmuted">{e.property_address ?? '—'}</span>
            <span className="text-loanmuted">{new Date(e.enrolled_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
            <span className={e.status === 'active' ? 'text-loangreen' : 'text-loanmuted'}>
              {e.next_send_at ? new Date(e.next_send_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
            </span>
            <span className="text-loanmuted">{e.status !== 'active' ? `${e.status}` : e.next_step_name ?? '—'}</span>
            <div className="relative group">
              <button className="text-loanmuted hover:text-foreground">&#8943;</button>
              <div className="hidden group-hover:block absolute right-0 top-full bg-surface border border-loanborder rounded-lg shadow-lg py-1 z-10 w-36">
                {e.status === 'active' && (
                  <button onClick={() => handleAction(e.id, 'pause')} className="block w-full text-left px-3 py-1.5 text-xs hover:bg-surface2">Pause</button>
                )}
                {e.status === 'paused' && (
                  <button onClick={() => handleAction(e.id, 'resume')} className="block w-full text-left px-3 py-1.5 text-xs hover:bg-surface2">Resume</button>
                )}
                <button onClick={() => handleAction(e.id, 'remove')} className="block w-full text-left px-3 py-1.5 text-xs text-loanred hover:bg-surface2">Remove</button>
              </div>
            </div>
          </div>
        ))}

        {/* Pagination */}
        {total > limit && (
          <div className="px-5 py-3 border-t border-loanborder flex items-center justify-between font-mono text-[11px] text-loanmuted">
            <span>Showing {enrollments.length} of {total}</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-2 py-1 border border-loanborder rounded hover:bg-surface2 disabled:opacity-30">Prev</button>
              <span>Page {page} of {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-2 py-1 border border-loanborder rounded hover:bg-surface2 disabled:opacity-30">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/drip/EnrollmentTable.tsx
git commit -m "feat: add enrolled contacts table component"
```

---

### Task 12: Send History & Exit Rules Components

**Files:**
- Create: `src/components/drip/SendHistoryTable.tsx`
- Create: `src/components/drip/ExitRulesPanel.tsx`

- [ ] **Step 1: Write the SendHistoryTable component**

```typescript
// src/components/drip/SendHistoryTable.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import type { DripSendWithDetails } from '@/lib/drip/types'

interface SendHistoryTableProps {
  campaignId: string
}

const STATUS_COLORS: Record<string, string> = {
  sent: 'text-loangreen',
  queued: 'text-[#e67e22]',
  approved: 'text-gold',
  skipped: 'text-loanmuted',
  cancelled: 'text-loanred',
}

export default function SendHistoryTable({ campaignId }: SendHistoryTableProps) {
  const [sends, setSends] = useState<DripSendWithDetails[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const limit = 50

  const fetchSends = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/drip/campaigns/${campaignId}/enrollments?history=true&page=${page}&limit=${limit}`)
      const data = await res.json() as { data: DripSendWithDetails[]; total: number }
      setSends(data.data ?? [])
      setTotal(data.total ?? 0)
    } catch (err) {
      console.error('Failed to load send history:', err)
    } finally {
      setLoading(false)
    }
  }, [campaignId, page])

  useEffect(() => { void fetchSends() }, [fetchSends])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="border border-loanborder rounded-lg overflow-hidden">
      <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr] px-5 py-3 bg-surface2 font-mono text-[11px] font-semibold uppercase tracking-wider">
        <span>Contact</span>
        <span>Step</span>
        <span>Channel</span>
        <span>Status</span>
        <span>Date</span>
      </div>

      {loading && (
        <div className="px-5 py-8 text-center font-mono text-xs text-loanmuted animate-pulse">Loading...</div>
      )}

      {!loading && sends.length === 0 && (
        <div className="px-5 py-8 text-center font-mono text-xs text-loanmuted">No sends yet.</div>
      )}

      {!loading && sends.map(s => (
        <div key={s.id} className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr] px-5 py-3.5 border-t border-loanborder font-mono text-xs items-center hover:bg-[rgba(164,133,30,0.04)]">
          <span className="font-medium">{s.contact_name}</span>
          <span className="text-loanmuted">{s.step_name}</span>
          <span className="text-loanmuted">{s.channel.replace('_', ' ')}</span>
          <span className={STATUS_COLORS[s.status] ?? 'text-loanmuted'}>{s.status}</span>
          <span className="text-loanmuted">{s.sent_at ? new Date(s.sent_at).toLocaleDateString() : s.created_at ? new Date(s.created_at).toLocaleDateString() : '—'}</span>
        </div>
      ))}

      {total > limit && (
        <div className="px-5 py-3 border-t border-loanborder flex items-center justify-between font-mono text-[11px] text-loanmuted">
          <span>Showing {sends.length} of {total}</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-2 py-1 border border-loanborder rounded hover:bg-surface2 disabled:opacity-30">Prev</button>
            <span>Page {page} of {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-2 py-1 border border-loanborder rounded hover:bg-surface2 disabled:opacity-30">Next</button>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Write the ExitRulesPanel component**

```typescript
// src/components/drip/ExitRulesPanel.tsx
'use client'

import type { DripCampaignRow, ExitRule } from '@/lib/drip/types'

interface ExitRulesPanelProps {
  campaign: DripCampaignRow
  onUpdate: (updated: DripCampaignRow) => void
}

const RULE_DESCRIPTIONS: Record<string, string> = {
  status_change: 'Remove when contact status changes to any of these pipeline stages',
  bounce_limit: 'Remove after this many email bounces',
  unsubscribe: 'Remove when contact unsubscribes',
  inactive: 'Remove when contact is marked inactive',
}

export default function ExitRulesPanel({ campaign, onUpdate }: ExitRulesPanelProps) {
  const rules = (campaign.exit_rules ?? []) as ExitRule[]

  return (
    <div className="space-y-3">
      <p className="font-mono text-[11px] text-loanmuted mb-4">
        Exit rules automatically remove contacts from this campaign when conditions are met.
        The daily scheduler checks these rules before generating any email.
      </p>

      {rules.length === 0 && (
        <div className="bg-surface border border-loanborder rounded-lg px-5 py-8 text-center font-mono text-xs text-loanmuted">
          No exit rules configured. Contacts will only be removed manually or when they complete all steps.
        </div>
      )}

      {rules.map((rule, i) => (
        <div key={i} className="bg-surface border border-loanborder rounded-lg px-5 py-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="font-mono text-[10px] font-semibold bg-surface2 text-gold px-2.5 py-0.5 rounded uppercase">
              {rule.type.replace('_', ' ')}
            </span>
          </div>
          <p className="text-xs text-loanmuted mb-2">
            {RULE_DESCRIPTIONS[rule.type] ?? rule.type}
          </p>
          {rule.config.statuses && (
            <div className="flex gap-2 flex-wrap">
              {rule.config.statuses.map(s => (
                <span key={s} className="font-mono text-[10px] bg-surface2 px-2 py-0.5 rounded">{s}</span>
              ))}
            </div>
          )}
          {rule.config.max_bounces && (
            <span className="font-mono text-xs">Max bounces: {rule.config.max_bounces}</span>
          )}
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/drip/SendHistoryTable.tsx src/components/drip/ExitRulesPanel.tsx
git commit -m "feat: add send history table and exit rules panel components"
```

---

### Task 13: Approval Queue Page (Level 3)

**Files:**
- Create: `src/app/dashboard/drip-campaigns/approval/page.tsx`
- Create: `src/components/drip/ApprovalCard.tsx`

- [ ] **Step 1: Write the ApprovalCard component**

```typescript
// src/components/drip/ApprovalCard.tsx
'use client'

import { useState } from 'react'
import type { DripSendWithDetails } from '@/lib/drip/types'

interface ApprovalCardProps {
  send: DripSendWithDetails
  onAction: (sendId: string, action: 'approve' | 'skip' | 'cancel', edits?: { subject?: string; body?: string }) => void
}

export default function ApprovalCard({ send, onAction }: ApprovalCardProps) {
  const [editing, setEditing] = useState(false)
  const [subject, setSubject] = useState(send.generated_subject ?? '')
  const [body, setBody] = useState(send.generated_body ?? '')

  return (
    <div className="bg-surface border border-loanborder rounded-lg px-5 py-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="font-medium text-sm">{send.contact_name}</span>
          <span className="font-mono text-[11px] text-loanmuted ml-3">{send.contact_email}</span>
        </div>
        <div className="font-mono text-[10px] text-loanmuted">
          <span className="text-gold">{send.campaign_name}</span>
          <span className="mx-2">&middot;</span>
          <span>{send.step_name}</span>
        </div>
      </div>

      {/* Email Preview */}
      <div className="bg-surface2 rounded-lg px-4 py-3 mb-4">
        {editing ? (
          <>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-background border border-loanborder rounded px-3 py-1.5 text-sm font-semibold mb-2"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full bg-background border border-loanborder rounded px-3 py-2 text-sm min-h-[120px] resize-y"
            />
          </>
        ) : (
          <>
            <div className="text-sm font-semibold mb-2">{send.generated_subject}</div>
            <div className="text-sm text-loanmuted whitespace-pre-wrap leading-relaxed">{send.generated_body}</div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end">
        <button
          onClick={() => onAction(send.id, 'cancel')}
          className="font-mono text-xs px-4 py-2 border border-loanborder bg-surface rounded-lg hover:bg-surface2 text-loanred"
        >
          Cancel
        </button>
        <button
          onClick={() => onAction(send.id, 'skip')}
          className="font-mono text-xs px-4 py-2 border border-loanborder bg-surface rounded-lg hover:bg-surface2"
        >
          Skip
        </button>
        {editing ? (
          <button
            onClick={() => { onAction(send.id, 'approve', { subject, body }); setEditing(false) }}
            className="font-mono text-xs px-4 py-2 bg-gold text-white rounded-lg hover:bg-gold/90"
          >
            Save & Approve
          </button>
        ) : (
          <>
            <button
              onClick={() => setEditing(true)}
              className="font-mono text-xs px-4 py-2 border border-gold text-gold rounded-lg hover:bg-gold/10"
            >
              Edit
            </button>
            <button
              onClick={() => onAction(send.id, 'approve')}
              className="font-mono text-xs px-4 py-2 bg-gold text-white rounded-lg hover:bg-gold/90"
            >
              Approve & Send
            </button>
          </>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Write the approval queue page**

```typescript
// src/app/dashboard/drip-campaigns/approval/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { DripSendWithDetails } from '@/lib/drip/types'
import ApprovalCard from '@/components/drip/ApprovalCard'

export default function ApprovalQueuePage() {
  const router = useRouter()
  const [queue, setQueue] = useState<DripSendWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  const fetchQueue = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/drip/approval-queue')
      const data = await res.json() as { queue: DripSendWithDetails[] }
      setQueue(data.queue ?? [])
    } catch (err) {
      console.error('Failed to load approval queue:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void fetchQueue() }, [fetchQueue])

  async function handleAction(sendId: string, action: 'approve' | 'skip' | 'cancel', edits?: { subject?: string; body?: string }) {
    await fetch(`/api/drip/approval-queue/${sendId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        edited_subject: edits?.subject,
        edited_body: edits?.body,
      }),
    })
    setQueue(prev => prev.filter(s => s.id !== sendId))
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <button onClick={() => router.push('/dashboard/drip-campaigns')} className="font-mono text-[11px] text-gold hover:text-gold/80 mb-2 block">
            &larr; All Campaigns
          </button>
          <h1 className="font-display text-[24px] tracking-wide">APPROVAL QUEUE</h1>
          <p className="font-mono text-[11px] text-loanmuted mt-1">
            {queue.length} email{queue.length !== 1 ? 's' : ''} awaiting your review
          </p>
        </div>
      </div>

      {loading && (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="bg-surface border border-loanborder rounded-lg px-5 py-8 animate-pulse">
              <div className="h-4 w-48 bg-surface2 rounded" />
            </div>
          ))}
        </div>
      )}

      {!loading && queue.length === 0 && (
        <div className="bg-surface border border-loanborder rounded-lg px-5 py-12 text-center font-mono text-xs text-loanmuted">
          All clear — no emails waiting for approval.
        </div>
      )}

      {!loading && queue.length > 0 && (
        <div className="space-y-4">
          {queue.map(send => (
            <ApprovalCard key={send.id} send={send} onAction={handleAction} />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/drip-campaigns/approval/ src/components/drip/ApprovalCard.tsx
git commit -m "feat: add approval queue page and approval card component"
```

---

### Task 14: Add Navigation Link

**Files:**
- Modify: `src/components/TopNav.tsx`

- [ ] **Step 1: Read the current TopNav to find the nav links section**

Read `src/components/TopNav.tsx` and find where navigation links are defined (look for an array of `{ href, label }` objects or a series of `<Link>` components).

- [ ] **Step 2: Add the drip campaigns link**

Add a "Drip Campaigns" link to the navigation. Place it near "Automations" since they're related. The exact edit depends on the current nav structure — find the automations link and add the drip campaigns link after it:

```typescript
{ href: '/dashboard/drip-campaigns', label: 'Drip Campaigns' },
```

- [ ] **Step 3: Verify build**

Run: `cd /Users/adamstyer/Documents/loanos-clone && npm run build`

Expected: build passes with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/TopNav.tsx
git commit -m "feat: add Drip Campaigns link to navigation"
```

---

## Phase 4: Seed Data (Task 15)

### Task 15: Seed Campaign Definitions & Steps

**Files:**
- Create: `supabase/migrations/073_seed_drip_campaigns.sql`

- [ ] **Step 1: Write the seed migration**

```sql
-- 073_seed_drip_campaigns.sql
-- Seed drip campaign definitions and steps for Adam Styer | Mortgage Solutions LP

-- ============================================================
-- CAMPAIGNS
-- ============================================================

-- Past Client Retention
INSERT INTO drip_campaigns (org_id, name, audience, status, description, exit_rules)
VALUES (
  (SELECT id FROM organizations LIMIT 1),
  'Past Client Retention',
  'past_client',
  'active',
  '4-6 emails/year + handwritten cards for closed borrowers. Stay top-of-mind for refis, referrals, and repeat business.',
  '[
    {"type": "unsubscribe", "config": {}},
    {"type": "bounce_limit", "config": {"max_bounces": 2}},
    {"type": "inactive", "config": {}}
  ]'::jsonb
)
ON CONFLICT (org_id, name) DO NOTHING;

-- Ghost Referral
INSERT INTO drip_campaigns (org_id, name, audience, status, description, exit_rules)
VALUES (
  (SELECT id FROM organizations LIMIT 1),
  'Lead — Ghost Referral',
  'lead',
  'active',
  'Realtor sent a referral, borrower went quiet. 4-step sequence over 45 days, then moves to long-term nurture.',
  '[
    {"type": "status_change", "config": {"statuses": ["application_received", "in_process", "submitted", "under_contract", "active_loan", "closed"]}},
    {"type": "unsubscribe", "config": {}},
    {"type": "bounce_limit", "config": {"max_bounces": 2}},
    {"type": "inactive", "config": {}}
  ]'::jsonb
)
ON CONFLICT (org_id, name) DO NOTHING;

-- Incomplete Application
INSERT INTO drip_campaigns (org_id, name, audience, status, description, exit_rules)
VALUES (
  (SELECT id FROM organizations LIMIT 1),
  'Lead — Incomplete App',
  'lead',
  'active',
  'Started application but never finished. 3-step sequence over 14 days.',
  '[
    {"type": "status_change", "config": {"statuses": ["application_received", "in_process", "submitted", "under_contract", "active_loan", "closed"]}},
    {"type": "unsubscribe", "config": {}},
    {"type": "bounce_limit", "config": {"max_bounces": 2}},
    {"type": "inactive", "config": {}}
  ]'::jsonb
)
ON CONFLICT (org_id, name) DO NOTHING;

-- Went Quiet
INSERT INTO drip_campaigns (org_id, name, audience, status, description, exit_rules)
VALUES (
  (SELECT id FROM organizations LIMIT 1),
  'Lead — Went Quiet',
  'lead',
  'active',
  'Had real contact but timing was not right. Quarterly touches for up to 1 year, then long-term nurture.',
  '[
    {"type": "status_change", "config": {"statuses": ["application_received", "in_process", "submitted", "under_contract", "active_loan", "closed"]}},
    {"type": "unsubscribe", "config": {}},
    {"type": "bounce_limit", "config": {"max_bounces": 2}},
    {"type": "inactive", "config": {}}
  ]'::jsonb
)
ON CONFLICT (org_id, name) DO NOTHING;

-- Realtor Relationships
INSERT INTO drip_campaigns (org_id, name, audience, status, description, exit_rules)
VALUES (
  (SELECT id FROM organizations LIMIT 1),
  'Realtor Relationships',
  'realtor',
  'active',
  '3-4 touchpoints/year for referral partners. Co-marketing offers, deal milestones, holidays.',
  '[
    {"type": "unsubscribe", "config": {}},
    {"type": "bounce_limit", "config": {"max_bounces": 2}},
    {"type": "inactive", "config": {}}
  ]'::jsonb
)
ON CONFLICT (org_id, name) DO NOTHING;

-- Long-Term Nurture
INSERT INTO drip_campaigns (org_id, name, audience, status, description, exit_rules)
VALUES (
  (SELECT id FROM organizations LIMIT 1),
  'Long-Term Nurture',
  'lead',
  'active',
  'Cold leads that completed their sequence. Newsletter + 1-2 seasonal emails/year. Minimal touch.',
  '[
    {"type": "status_change", "config": {"statuses": ["application_received", "in_process", "submitted", "under_contract", "active_loan", "closed"]}},
    {"type": "unsubscribe", "config": {}},
    {"type": "inactive", "config": {}}
  ]'::jsonb
)
ON CONFLICT (org_id, name) DO NOTHING;

-- ============================================================
-- STEPS — Past Client Retention
-- ============================================================

INSERT INTO drip_steps (org_id, campaign_id, step_order, name, trigger_type, trigger_config, skeleton, channel, requires_approval, tone)
VALUES
  ((SELECT id FROM organizations LIMIT 1), (SELECT id FROM drip_campaigns WHERE name = 'Past Client Retention' LIMIT 1),
   1, 'Closing Anniversary', 'annual_date', '{"date_field": "closing_date"}'::jsonb,
   'Congrats on [X] year(s) in [address]. Mention equity change since purchase. Mention current rate environment if relevant to their rate. Light tone — no hard sell. Sign off warm.',
   'both', false, 'knowledgeable_friend'),

  ((SELECT id FROM organizations LIMIT 1), (SELECT id FROM drip_campaigns WHERE name = 'Past Client Retention' LIMIT 1),
   2, 'Birthday', 'annual_date', '{"date_field": "birthday"}'::jsonb,
   'Happy birthday. Keep it warm and genuinely personal. No business talk whatsoever. Short — 2-3 sentences max.',
   'both', false, 'knowledgeable_friend'),

  ((SELECT id FROM organizations LIMIT 1), (SELECT id FROM drip_campaigns WHERE name = 'Past Client Retention' LIMIT 1),
   3, 'Rate Drop Alert', 'condition', '{"rate_drop_threshold": 0.75}'::jsonb,
   'Their locked rate: [X]. Current market rate: [Y]. Show monthly payment savings and 5-year total savings. Direct CTA — call or text to discuss. Keep it factual and specific to their numbers.',
   'email', true, 'knowledgeable_friend'),

  ((SELECT id FROM organizations LIMIT 1), (SELECT id FROM drip_campaigns WHERE name = 'Past Client Retention' LIMIT 1),
   4, 'Equity Check-In', 'relative_days', '{"days": 180}'::jsonb,
   'Estimated current home value vs their purchase price. Dollar amount of equity gained. If equity is substantial (>20%), mention HELOC or cash-out refi as options. Educational tone — explain what equity means practically. Not salesy.',
   'email', false, 'knowledgeable_friend'),

  ((SELECT id FROM organizations LIMIT 1), (SELECT id FROM drip_campaigns WHERE name = 'Past Client Retention' LIMIT 1),
   5, 'Seasonal Value Touch', 'annual_date', '{"date_field": "seasonal_march"}'::jsonb,
   'Spring: homestead exemption filing deadline reminder for Texas. Fall: year-end tax tip related to mortgage interest deduction or property tax timing. Always timely, useful, and locally relevant to Austin/Central TX.',
   'email', false, 'knowledgeable_friend'),

  ((SELECT id FROM organizations LIMIT 1), (SELECT id FROM drip_campaigns WHERE name = 'Past Client Retention' LIMIT 1),
   6, 'Holiday', 'annual_date', '{"date_field": "holiday_thanksgiving"}'::jsonb,
   'Warm and personal. Reference their home specifically. Express genuine gratitude — not marketing gratitude. No CTA, no business talk. Just a good human moment.',
   'email', false, 'knowledgeable_friend');

-- ============================================================
-- STEPS — Ghost Referral
-- ============================================================

INSERT INTO drip_steps (org_id, campaign_id, step_order, name, trigger_type, trigger_config, skeleton, channel, requires_approval, tone)
VALUES
  ((SELECT id FROM organizations LIMIT 1), (SELECT id FROM drip_campaigns WHERE name = 'Lead — Ghost Referral' LIMIT 1),
   1, 'Warm Intro Follow-up', 'relative_days', '{"days": 3}'::jsonb,
   'Follow up on the intro from [realtor name]. Keep it brief and low-pressure. Mention you are available when they are ready. Include one useful thing — a quick market snapshot or what to expect in the process.',
   'email', false, 'straight_shooter'),

  ((SELECT id FROM organizations LIMIT 1), (SELECT id FROM drip_campaigns WHERE name = 'Lead — Ghost Referral' LIMIT 1),
   2, 'Value Add', 'relative_days', '{"days": 7}'::jsonb,
   'Share something genuinely useful — Austin market snapshot, current affordability numbers for their price range, or a quick explainer on a common buyer question. No ask. Just value.',
   'email', false, 'straight_shooter'),

  ((SELECT id FROM organizations LIMIT 1), (SELECT id FROM drip_campaigns WHERE name = 'Lead — Ghost Referral' LIMIT 1),
   3, 'Soft Check-In', 'relative_days', '{"days": 21}'::jsonb,
   'Quick check-in. Acknowledge they may not be ready yet and that is fine. Mention one relevant market update. Keep it to 3-4 sentences.',
   'email', false, 'straight_shooter'),

  ((SELECT id FROM organizations LIMIT 1), (SELECT id FROM drip_campaigns WHERE name = 'Lead — Ghost Referral' LIMIT 1),
   4, 'Final Touch', 'relative_days', '{"days": 45}'::jsonb,
   'Last email in the sequence. Door is always open. No pressure. Mention you will still be sending market updates occasionally. Warm and genuine close.',
   'email', false, 'straight_shooter');

-- ============================================================
-- STEPS — Incomplete Application
-- ============================================================

INSERT INTO drip_steps (org_id, campaign_id, step_order, name, trigger_type, trigger_config, skeleton, channel, requires_approval, tone)
VALUES
  ((SELECT id FROM organizations LIMIT 1), (SELECT id FROM drip_campaigns WHERE name = 'Lead — Incomplete App' LIMIT 1),
   1, 'Helpful Nudge', 'relative_days', '{"days": 2}'::jsonb,
   'Noticed they started the application. Walk them through what to expect — timeline, documents needed, next steps. Make it feel easy, not overwhelming. Offer to help if they got stuck.',
   'email', false, 'straight_shooter'),

  ((SELECT id FROM organizations LIMIT 1), (SELECT id FROM drip_campaigns WHERE name = 'Lead — Incomplete App' LIMIT 1),
   2, 'Common Questions', 'relative_days', '{"days": 5}'::jsonb,
   'Address the top 3 hesitations people have when applying: credit score worries, how much documentation is needed, and whether they will be locked into anything. Reassure with facts, not fluff.',
   'email', false, 'straight_shooter'),

  ((SELECT id FROM organizations LIMIT 1), (SELECT id FROM drip_campaigns WHERE name = 'Lead — Incomplete App' LIMIT 1),
   3, 'Personal Offer to Help', 'relative_days', '{"days": 14}'::jsonb,
   'Direct and personal — offer a quick 10-minute call to answer any questions and walk them through the rest. Include Calendly link. Last email in sequence — not pushy, just available.',
   'email', false, 'straight_shooter');

-- ============================================================
-- STEPS — Went Quiet
-- ============================================================

INSERT INTO drip_steps (org_id, campaign_id, step_order, name, trigger_type, trigger_config, skeleton, channel, requires_approval, tone)
VALUES
  ((SELECT id FROM organizations LIMIT 1), (SELECT id FROM drip_campaigns WHERE name = 'Lead — Went Quiet' LIMIT 1),
   1, 'Market Update', 'relative_days', '{"days": 30}'::jsonb,
   'Relevant market update for their situation — if they were looking at a specific area or price range, reference that. Current rates, inventory levels, what buyers are seeing right now in Austin.',
   'email', false, 'straight_shooter'),

  ((SELECT id FROM organizations LIMIT 1), (SELECT id FROM drip_campaigns WHERE name = 'Lead — Went Quiet' LIMIT 1),
   2, 'Rate/Affordability Change', 'relative_days', '{"days": 60}'::jsonb,
   'If rates have moved since you last talked, show what that means for monthly payment at their target price. Concrete numbers. If rates have not moved much, share an affordability tip instead.',
   'email', false, 'straight_shooter'),

  ((SELECT id FROM organizations LIMIT 1), (SELECT id FROM drip_campaigns WHERE name = 'Lead — Went Quiet' LIMIT 1),
   3, 'Check-In', 'relative_days', '{"days": 90}'::jsonb,
   'Casual check-in. Reference your last conversation if possible. Ask if anything has changed in their timeline. 3-4 sentences max.',
   'email', false, 'straight_shooter'),

  ((SELECT id FROM organizations LIMIT 1), (SELECT id FROM drip_campaigns WHERE name = 'Lead — Went Quiet' LIMIT 1),
   4, 'Quarterly Touch', 'relative_days', '{"days": 180}'::jsonb,
   'Ongoing quarterly touch — rotate between market updates, rate changes, and seasonal tips. Keep it fresh each time. After 1 year, they move to long-term nurture.',
   'email', false, 'straight_shooter');

-- ============================================================
-- STEPS — Realtor Relationships
-- ============================================================

INSERT INTO drip_steps (org_id, campaign_id, step_order, name, trigger_type, trigger_config, skeleton, channel, requires_approval, tone)
VALUES
  ((SELECT id FROM organizations LIMIT 1), (SELECT id FROM drip_campaigns WHERE name = 'Realtor Relationships' LIMIT 1),
   1, 'Deal Anniversary', 'annual_date', '{"date_field": "first_deal_date"}'::jsonb,
   'One year since our first closed deal together. Reference the specific transaction. Express genuine appreciation for the partnership. Keep it professional and peer-level.',
   'email', false, 'quiet_confidence'),

  ((SELECT id FROM organizations LIMIT 1), (SELECT id FROM drip_campaigns WHERE name = 'Realtor Relationships' LIMIT 1),
   2, 'Milestone Celebration', 'condition', '{"deals_milestone": 5}'::jsonb,
   'We just hit [X] closed loans together. Celebrate the milestone. Reference the partnership growth. This is a big deal — make it feel like one.',
   'email', true, 'quiet_confidence'),

  ((SELECT id FROM organizations LIMIT 1), (SELECT id FROM drip_campaigns WHERE name = 'Realtor Relationships' LIMIT 1),
   3, 'Co-Marketing Offer', 'relative_days', '{"days": 180}'::jsonb,
   'Offer to create something useful for them — open house flyer with both our info, social media content for their listings, or a buyer guide they can share. Make it about making THEM look good.',
   'email', true, 'quiet_confidence'),

  ((SELECT id FROM organizations LIMIT 1), (SELECT id FROM drip_campaigns WHERE name = 'Realtor Relationships' LIMIT 1),
   4, 'Holiday', 'annual_date', '{"date_field": "holiday_thanksgiving"}'::jsonb,
   'Warm holiday message. Reference the working relationship. Express gratitude for their trust and partnership. No business ask.',
   'email', false, 'quiet_confidence');

-- ============================================================
-- STEPS — Long-Term Nurture
-- ============================================================

INSERT INTO drip_steps (org_id, campaign_id, step_order, name, trigger_type, trigger_config, skeleton, channel, requires_approval, tone)
VALUES
  ((SELECT id FROM organizations LIMIT 1), (SELECT id FROM drip_campaigns WHERE name = 'Long-Term Nurture' LIMIT 1),
   1, 'Spring Seasonal', 'annual_date', '{"date_field": "seasonal_march"}'::jsonb,
   'Spring market update or homeownership tip. Light touch — they are on the back burner but still in the ecosystem. One useful thing, no pressure.',
   'email', false, 'knowledgeable_friend'),

  ((SELECT id FROM organizations LIMIT 1), (SELECT id FROM drip_campaigns WHERE name = 'Long-Term Nurture' LIMIT 1),
   2, 'Fall Seasonal', 'annual_date', '{"date_field": "seasonal_october"}'::jsonb,
   'Fall/year-end market update or tax-related tip. Same light touch as spring. Keep them aware you exist without being annoying.',
   'email', false, 'knowledgeable_friend');
```

- [ ] **Step 2: Apply the migration**

Run via Supabase MCP: `apply_migration` with name `seed_drip_campaigns`.

- [ ] **Step 3: Verify seed data**

Run via Supabase MCP: `execute_sql` with:
```sql
SELECT c.name, c.audience, c.status, COUNT(s.id) as step_count
FROM drip_campaigns c
LEFT JOIN drip_steps s ON s.campaign_id = c.id
GROUP BY c.id, c.name, c.audience, c.status
ORDER BY c.name;
```

Expected: 6 campaigns with correct step counts (Past Client: 6, Ghost Referral: 4, Incomplete App: 3, Went Quiet: 4, Realtor: 4, Long-Term: 2).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/073_seed_drip_campaigns.sql
git commit -m "feat: seed drip campaign definitions and steps"
```

---

## Phase 5: Build & Deploy (Task 16)

### Task 16: Build, Push, Verify Deployment

- [ ] **Step 1: Run full TypeScript check**

Run: `cd /Users/adamstyer/Documents/loanos-clone && npx tsc --noEmit`

Fix any type errors before proceeding.

- [ ] **Step 2: Run build**

Run: `cd /Users/adamstyer/Documents/loanos-clone && npm run build`

Expected: build passes. If there are errors, fix them and rebuild.

- [ ] **Step 3: Push to GitHub**

Run: `git push origin main`

- [ ] **Step 4: Verify Vercel deployment**

Use Vercel MCP: `list_deployments` for project `prj_AmhlkvLIUzzlqpOtCrUy9PCyPiSx`, team `team_aJNpxKvLlNTUiDdWTdhX0Vgf`.

Wait for `state: READY`. If `state: ERROR`, read build logs, fix, and push again.

- [ ] **Step 5: Update CONTEXT.md and CHANGELOG.md**

Per end-of-session rule, update both files with everything that was built this session.

- [ ] **Step 6: Final commit and push**

```bash
git add CONTEXT.md CHANGELOG.md
git commit -m "docs: update context and changelog for drip campaigns feature"
git push origin main
```

---

## Future Work (Not in this plan)

These are called out in the spec as post-v1:

1. **n8n scheduler upgrade** — Wire the daily scheduler to query `drip_enrollments`, generate emails via Claude, and send/queue. This requires n8n workflow editing which is a separate task.
2. **Handwritten card integration** — Research handwritten.com API, build the card ordering flow.
3. **Auto-enrollment triggers** — Add enrollment logic to existing Arive Status Update and Web Lead Automation n8n workflows.
4. **Email open/click tracking** — Add tracking pixel or Outlook read receipt integration.
5. **Unsubscribe management** — Build proper unsubscribe link + management page.
6. **Send history API route** — The `SendHistoryTable` component currently fetches from the enrollments endpoint with a `history=true` param. A dedicated `/api/drip/campaigns/[id]/sends` route would be cleaner.
