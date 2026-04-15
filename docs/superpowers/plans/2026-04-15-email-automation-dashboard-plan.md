# Email Automation Dashboard + Workflow DevKit Migration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a `/admin/email-automation` dashboard in LoanOS and replace 4 n8n email workflows with durable Vercel Workflow DevKit workflows, with a hard kill date 61 days post-cutover.

**Architecture:** Vercel Workflow DevKit handles all lead-intake and drip orchestration (durable `sleep()`, exit-rule checks, Resend sends). n8n continues as webhook ingress and Outlook polling — it is not removed, only the 4 email logic workflows are replaced. The dashboard is an RSC-only admin page gated by `requireAdmin()` and the `system_admins` table.

**Tech Stack:** Next.js 14 App Router, Supabase (RLS + PII companion), Vercel Workflow DevKit (`workflow`, `@workflow/ai`, `@workflow/next`), Resend + Svix, Microsoft Graph API, Tailwind + shadcn/ui, Vitest + `@workflow/vitest`

---

## File Map

### New files — LoanOS

| File | Responsibility |
|------|---------------|
| `supabase/migrations/086_email_automation.sql` | Add UTM/origin columns to contacts, normalize event_type, create resend_webhook_events table |
| `src/lib/resend/verify.ts` | Svix signature verification helper |
| `src/lib/outlook/graph.ts` | Microsoft Graph API client (send email, refresh token) |
| `src/lib/workflows/types.ts` | Shared TypeScript types for workflow payloads and step results |
| `src/lib/workflows/drip-helpers.ts` | Shared `enroll()`, `checkExitRules()`, `composeEmail()`, `writeActivity()` used by all drip workflows |
| `src/workflows/web-lead-intake.ts` | Web lead intake workflow — upsert contact, Outlook alerts, DurableAgent classification, enroll in drip |
| `src/workflows/pa-welcome-nurture.ts` | PA Welcome drip (6 emails / 60 days) |
| `src/workflows/dpa-guide-nurture.ts` | DPA Guide drip (8 emails / 52 days) |
| `src/workflows/pre-approval-email.ts` | Pre-approval single-send workflow (manual trigger) |
| `src/app/api/resend-webhook/route.ts` | POST receiver — Svix verify, dedup, activity_log write, resumeHook |
| `src/app/api/workflows/pre-approval-email/start/route.ts` | Manual trigger endpoint for pre-approval workflow |
| `src/app/admin/email-automation/layout.tsx` | requireAdmin gate for the dashboard section |
| `src/app/admin/email-automation/page.tsx` | RSC page — loads all 6 panels |
| `src/components/email-automation/WorkflowStatusPanel.tsx` | Panel 1 — n8n + Workflow DevKit run status |
| `src/components/email-automation/EmailSendLog.tsx` | Panel 2 — email activity log (decrypted via /api/activity) |
| `src/components/email-automation/ActiveDripsTable.tsx` | Panel 3 — active drip enrollments |
| `src/components/email-automation/LeadOriginTable.tsx` | Panel 5 — contacts with source_page / UTM |
| `src/components/email-automation/DripDetailDrawer.tsx` | Panel 6 — click-to-expand enrollment timeline |
| `tests/lib/resend/verify.test.ts` | Unit tests for Svix verification |
| `tests/lib/outlook/graph.test.ts` | Unit tests for Graph client |
| `tests/lib/workflows/drip-helpers.test.ts` | Unit tests for drip helpers |
| `tests/workflows/web-lead-intake.integration.test.ts` | Integration test with @workflow/vitest |
| `tests/workflows/pa-welcome-nurture.integration.test.ts` | Integration test — sleep, hook, exit-rule |
| `tests/workflows/dpa-guide-nurture.integration.test.ts` | Integration test |
| `tests/workflows/pre-approval-email.integration.test.ts` | Integration test |
| `tests/workflows/smoke-checklist.md` | Manual smoke test for each workflow |

### Modified files — LoanOS

| File | Change |
|------|--------|
| `package.json` | Add `workflow`, `@workflow/ai`, `@workflow/next`, `@microsoft/microsoft-graph-client`, `svix` |
| `src/app/api/contacts/web-lead/route.ts` | Persist UTM + source cols; call `start(webLeadIntakeWorkflow, [payload])` |
| `src/middleware.ts` | Ensure `/admin/email-automation` passes through existing admin middleware |

### New files — styermortgage.com

| File | Responsibility |
|------|---------------|
| `netlify/functions/lead-intake.js` | Unified lead ingress (replaces subscribe-lead.js) |

### Modified files — styermortgage.com

| File | Change |
|------|--------|
| `netlify/functions/subscribe-lead.js` | Deprecated — delete at Stage 3 cutover |
| `assets/utm.js` | Extend to cover all pages |
| `index.html` (hero form), `contact.html`, suburb page HTMLs | Add 5 hidden UTM/referrer fields |

---

## Phase A — Foundation (migration + types + packages)

### Task 1: Apply migration 086

**Files:**
- Create: `supabase/migrations/086_email_automation.sql`

- [ ] **Step 1: Write the migration file**

```sql
-- 086_email_automation.sql
-- Lead origin tracking, event taxonomy normalization, Resend webhook idempotency

-- Lead origin columns on contacts
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS source_page TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS form_name TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS utm_params JSONB;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS referrer TEXT;

CREATE INDEX IF NOT EXISTS idx_contacts_source_page
  ON contacts(source_page) WHERE source_page IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_utm_source
  ON contacts((utm_params->>'source')) WHERE utm_params IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_created_at
  ON contacts(created_at DESC);

-- Normalize existing email event_type to dotted form
UPDATE activity_log
SET event_type = 'email.sent'
WHERE event_type = 'email_sent';

-- Resend webhook idempotency table
CREATE TABLE resend_webhook_events (
  event_id   TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  contact_id  UUID REFERENCES contacts(id) ON DELETE SET NULL,
  enrollment_id UUID REFERENCES drip_enrollments(id) ON DELETE SET NULL,
  payload     JSONB NOT NULL
);

CREATE INDEX idx_resend_webhook_events_contact
  ON resend_webhook_events(contact_id);
CREATE INDEX idx_resend_webhook_events_received
  ON resend_webhook_events(received_at DESC);

-- RLS: admin-only via service client (no row-level policy needed — accessed server-side only)
ALTER TABLE resend_webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_only" ON resend_webhook_events
  USING (false) WITH CHECK (false);
```

- [ ] **Step 2: Apply via Supabase MCP**

Use `mcp__e3151559-6ff6-4fec-a1b1-e68a6212bd73__apply_migration` with the SQL above and migration name `086_email_automation`.

Expected: migration applies cleanly, no errors. Verify by running `SELECT column_name FROM information_schema.columns WHERE table_name='contacts' AND column_name='source_page'` — should return one row.

- [ ] **Step 3: Regenerate TypeScript types**

Use `mcp__e3151559-6ff6-4fec-a1b1-e68a6212bd73__generate_typescript_types` for project `uuqedsvjlkeszrbwzizl`.

Copy output into `src/lib/database.types.ts`, replacing the existing file.

- [ ] **Step 4: Run build to confirm types are clean**

```bash
cd /Users/adamstyer/Documents/loanos-clone && npm run build
```

Expected: exits 0. If TypeScript errors appear, fix them in the affected files before continuing.

- [ ] **Step 5: Commit**

```bash
cd /Users/adamstyer/Documents/loanos-clone
git add supabase/migrations/086_email_automation.sql src/lib/database.types.ts
git commit -m "feat(db): migration 086 — lead origin cols, email taxonomy, resend webhook events table"
```

---

### Task 2: Install packages

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install Workflow DevKit and dependencies**

```bash
cd /Users/adamstyer/Documents/loanos-clone
npm install workflow @workflow/ai @workflow/next @microsoft/microsoft-graph-client svix
```

- [ ] **Step 2: Verify installs**

```bash
node -e "require('svix'); console.log('svix ok')"
node -e "require('@microsoft/microsoft-graph-client'); console.log('graph ok')"
```

Expected: both print their ok messages.

- [ ] **Step 3: Run build to confirm no new type errors**

```bash
npm run build
```

Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add workflow devkit, microsoft graph client, svix packages"
```

---

### Task 3: Shared types

**Files:**
- Create: `src/lib/workflows/types.ts`
- Test: `tests/lib/workflows/types.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/workflows/types.test.ts
import { describe, it, expect } from 'vitest'
import type { WebLeadPayload, DrипEnrollmentResult } from '@/lib/workflows/types'

describe('WebLeadPayload shape', () => {
  it('accepts required fields', () => {
    const payload: WebLeadPayload = {
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane@example.com',
      phone: null,
      loan_goal: 'purchase',
      source_page: '/get-preapproved',
      form_name: 'pre-approval-form',
      utm_params: { source: 'google', medium: 'cpc', campaign: 'spring2026' },
      referrer: 'https://google.com',
      org_id: 'org-uuid-here',
    }
    expect(payload.first_name).toBe('Jane')
  })
})
```

- [ ] **Step 2: Run to confirm it fails**

```bash
npx vitest run tests/lib/workflows/types.test.ts
```

Expected: FAIL with "Cannot find module '@/lib/workflows/types'"

- [ ] **Step 3: Create the types file**

```ts
// src/lib/workflows/types.ts

export interface WebLeadPayload {
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  loan_goal: string | null        // e.g. 'purchase', 'refinance', 'dpa'
  purchase_price?: number | null
  credit_score?: string | null
  situation?: string | null       // free-text from form
  source_page: string | null      // page URL path, e.g. '/get-preapproved'
  form_name: string | null        // netlify form-name value
  utm_params: Record<string, string> | null
  referrer: string | null
  org_id: string                  // must be set by /api/contacts/web-lead from env
  contact_id?: string             // set after upsert, passed to child workflows
}

export type LeadClassification = 'pa' | 'dpa' | 'generic'

export interface DripEnrollmentResult {
  enrollment_id: string
  campaign_id: string
  campaign_name: string
  contact_id: string
  enrolled_at: string
}

export interface ResendWebhookEvent {
  type: string   // e.g. 'email.delivered', 'email.bounced'
  data: {
    email_id: string
    to: string[]
    from: string
    subject: string
    tags?: Record<string, string>
    // Resend includes metadata sent at send time here:
    metadata?: {
      enrollment_id?: string
      step_order?: number
      contact_id?: string
    }
  }
}
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
npx vitest run tests/lib/workflows/types.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/workflows/types.ts tests/lib/workflows/types.test.ts
git commit -m "feat(workflows): shared payload + event types"
```

---

## Phase B — Infrastructure helpers (Svix + Graph)

### Task 4: Resend/Svix signature verification

**Files:**
- Create: `src/lib/resend/verify.ts`
- Test: `tests/lib/resend/verify.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// tests/lib/resend/verify.test.ts
import { describe, it, expect, vi } from 'vitest'
import { verifyResendSignature } from '@/lib/resend/verify'

describe('verifyResendSignature', () => {
  it('returns verified payload on valid signature', async () => {
    // We mock Webhook class from svix to control test behavior
    vi.mock('svix', () => ({
      Webhook: vi.fn().mockImplementation(() => ({
        verify: vi.fn().mockReturnValue({ type: 'email.delivered', data: {} }),
      })),
    }))

    const result = await verifyResendSignature(
      'raw-body-string',
      {
        'svix-id': 'msg_abc',
        'svix-timestamp': '1234567890',
        'svix-signature': 'v1,abc',
      },
      'whsec_test'
    )
    expect(result.type).toBe('email.delivered')
  })

  it('throws on invalid signature', async () => {
    vi.mock('svix', () => ({
      Webhook: vi.fn().mockImplementation(() => ({
        verify: vi.fn().mockImplementation(() => { throw new Error('invalid signature') }),
      })),
    }))

    await expect(
      verifyResendSignature('bad-body', {}, 'whsec_test')
    ).rejects.toThrow('invalid signature')
  })
})
```

- [ ] **Step 2: Run to verify failures**

```bash
npx vitest run tests/lib/resend/verify.test.ts
```

Expected: FAIL (module not found)

- [ ] **Step 3: Implement the helper**

```ts
// src/lib/resend/verify.ts
import { Webhook } from 'svix'
import type { ResendWebhookEvent } from '@/lib/workflows/types'

export async function verifyResendSignature(
  rawBody: string,
  headers: Record<string, string | string[] | undefined>,
  secret: string
): Promise<ResendWebhookEvent> {
  const wh = new Webhook(secret)
  const payload = wh.verify(rawBody, {
    'svix-id': headers['svix-id'] as string,
    'svix-timestamp': headers['svix-timestamp'] as string,
    'svix-signature': headers['svix-signature'] as string,
  })
  return payload as ResendWebhookEvent
}
```

- [ ] **Step 4: Run tests to confirm both pass**

```bash
npx vitest run tests/lib/resend/verify.test.ts
```

Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/resend/verify.ts tests/lib/resend/verify.test.ts
git commit -m "feat(resend): Svix signature verification helper"
```

---

### Task 5: Microsoft Graph email client

**Files:**
- Create: `src/lib/outlook/graph.ts`
- Test: `tests/lib/outlook/graph.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// tests/lib/outlook/graph.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sendOutlookEmail, OutlookEmailParams } from '@/lib/outlook/graph'

vi.mock('@microsoft/microsoft-graph-client', () => ({
  Client: {
    initWithMiddleware: vi.fn().mockReturnValue({
      api: vi.fn().mockReturnValue({
        post: vi.fn().mockResolvedValue({ id: 'message-id-123' }),
      }),
    }),
  },
  ClientSecretCredential: vi.fn(),
}))

describe('sendOutlookEmail', () => {
  const params: OutlookEmailParams = {
    to: 'borrower@example.com',
    subject: 'Your Pre-Approval is Ready',
    body: '<p>Congratulations!</p>',
    fromUserId: 'adam@styermortgage.com',
  }

  it('calls Microsoft Graph send mail endpoint', async () => {
    const result = await sendOutlookEmail(params)
    expect(result.messageId).toBeDefined()
  })

  it('throws if required env vars are missing', async () => {
    const origClient = process.env.OUTLOOK_GRAPH_CLIENT_ID
    delete process.env.OUTLOOK_GRAPH_CLIENT_ID
    await expect(sendOutlookEmail(params)).rejects.toThrow('OUTLOOK_GRAPH_CLIENT_ID')
    process.env.OUTLOOK_GRAPH_CLIENT_ID = origClient
  })
})
```

- [ ] **Step 2: Run to verify failures**

```bash
npx vitest run tests/lib/outlook/graph.test.ts
```

Expected: FAIL (module not found)

- [ ] **Step 3: Implement the Graph client**

```ts
// src/lib/outlook/graph.ts
import { Client } from '@microsoft/microsoft-graph-client'
import { ClientSecretCredential } from '@azure/identity'

export interface OutlookEmailParams {
  to: string
  subject: string
  body: string                  // HTML
  fromUserId: string            // UPN or object ID of the sending mailbox
  cc?: string[]
}

export interface OutlookSendResult {
  messageId: string
}

function getGraphClient(): Client {
  const clientId = process.env.OUTLOOK_GRAPH_CLIENT_ID
  const clientSecret = process.env.OUTLOOK_GRAPH_CLIENT_SECRET
  const tenantId = process.env.OUTLOOK_GRAPH_TENANT_ID

  if (!clientId) throw new Error('OUTLOOK_GRAPH_CLIENT_ID is not set')
  if (!clientSecret) throw new Error('OUTLOOK_GRAPH_CLIENT_SECRET is not set')
  if (!tenantId) throw new Error('OUTLOOK_GRAPH_TENANT_ID is not set')

  const credential = new ClientSecretCredential(tenantId, clientId, clientSecret)

  return Client.initWithMiddleware({
    authProvider: {
      getAccessToken: async () => {
        const token = await credential.getToken('https://graph.microsoft.com/.default')
        return token.token
      },
    },
  })
}

export async function sendOutlookEmail(
  params: OutlookEmailParams
): Promise<OutlookSendResult> {
  const client = getGraphClient()

  const message = {
    subject: params.subject,
    body: { contentType: 'HTML', content: params.body },
    toRecipients: [{ emailAddress: { address: params.to } }],
    ...(params.cc?.length
      ? { ccRecipients: params.cc.map((addr) => ({ emailAddress: { address: addr } })) }
      : {}),
  }

  const result = await client
    .api(`/users/${params.fromUserId}/sendMail`)
    .post({ message, saveToSentItems: true })

  return { messageId: result?.id ?? 'sent' }
}
```

- [ ] **Step 4: Install `@azure/identity` (needed for ClientSecretCredential)**

```bash
npm install @azure/identity
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
npx vitest run tests/lib/outlook/graph.test.ts
```

Expected: PASS (2 tests)

- [ ] **Step 6: Commit**

```bash
git add src/lib/outlook/graph.ts tests/lib/outlook/graph.test.ts package.json package-lock.json
git commit -m "feat(outlook): Microsoft Graph email client with env-var guard"
```

---

### Task 6: Drip workflow helpers

**Files:**
- Create: `src/lib/workflows/drip-helpers.ts`
- Test: `tests/lib/workflows/drip-helpers.test.ts`

`★ Insight ─────────────────────────────────────`
These helpers are extracted from the workflow files so they can be unit-tested without the Workflow DevKit compiler. The `"use step"` directive is a no-op at unit-test time — actual durable execution only happens when the compiler processes the workflow files.
`─────────────────────────────────────────────────`

- [ ] **Step 1: Write the failing tests**

```ts
// tests/lib/workflows/drip-helpers.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  shouldExitDrip,
  mapResendEventType,
  buildDripScheduleDays,
} from '@/lib/workflows/drip-helpers'

describe('shouldExitDrip', () => {
  it('exits when email_opt_out is true', () => {
    expect(shouldExitDrip({ email_opt_out: true, status: 'active', recentBounce: false, recentComplaint: false })).toBe(true)
  })

  it('exits on hard bounce', () => {
    expect(shouldExitDrip({ email_opt_out: false, status: 'active', recentBounce: true, recentComplaint: false })).toBe(true)
  })

  it('exits on complaint', () => {
    expect(shouldExitDrip({ email_opt_out: false, status: 'active', recentBounce: false, recentComplaint: true })).toBe(true)
  })

  it('exits when enrollment is not active', () => {
    expect(shouldExitDrip({ email_opt_out: false, status: 'paused', recentBounce: false, recentComplaint: false })).toBe(true)
  })

  it('does NOT exit when all conditions are clean', () => {
    expect(shouldExitDrip({ email_opt_out: false, status: 'active', recentBounce: false, recentComplaint: false })).toBe(false)
  })
})

describe('mapResendEventType', () => {
  it('maps Resend event names to activity_log event_type values', () => {
    expect(mapResendEventType('email.sent')).toBe('email.sent')
    expect(mapResendEventType('email.delivered')).toBe('email.delivered')
    expect(mapResendEventType('email.bounced')).toBe('email.bounced')
    expect(mapResendEventType('email.complained')).toBe('email.complained')
    expect(mapResendEventType('email.opened')).toBe('email.opened')
    expect(mapResendEventType('email.clicked')).toBe('email.clicked')
    expect(mapResendEventType('email.delivery_delayed')).toBe('email.delivery_delayed')
  })

  it('returns null for unknown event types', () => {
    expect(mapResendEventType('contact.created')).toBeNull()
  })
})

describe('buildDripScheduleDays', () => {
  it('returns PA Welcome schedule', () => {
    expect(buildDripScheduleDays('pa-welcome')).toEqual([0, 3, 7, 14, 30, 60])
  })

  it('returns DPA Guide schedule', () => {
    expect(buildDripScheduleDays('dpa-guide')).toEqual([0, 2, 5, 10, 17, 25, 38, 52])
  })
})
```

- [ ] **Step 2: Run to verify failures**

```bash
npx vitest run tests/lib/workflows/drip-helpers.test.ts
```

Expected: FAIL (module not found)

- [ ] **Step 3: Implement the helpers**

```ts
// src/lib/workflows/drip-helpers.ts

const ALLOWED_EMAIL_EVENT_TYPES = new Set([
  'email.sent',
  'email.delivered',
  'email.bounced',
  'email.complained',
  'email.opened',
  'email.clicked',
  'email.delivery_delayed',
])

export interface ExitRuleInputs {
  email_opt_out: boolean
  status: string                 // drip_enrollment_status value
  recentBounce: boolean          // hard bounce in last step
  recentComplaint: boolean       // complaint in last step
}

/**
 * Returns true if the drip should stop sending.
 * Rules match §7.2 of the spec — checked before every send.
 */
export function shouldExitDrip(inputs: ExitRuleInputs): boolean {
  return (
    inputs.email_opt_out ||
    inputs.recentBounce ||
    inputs.recentComplaint ||
    inputs.status !== 'active'
  )
}

/**
 * Maps a Resend webhook event type to the canonical activity_log event_type.
 * Returns null for event types that should not be written to activity_log.
 */
export function mapResendEventType(resendType: string): string | null {
  return ALLOWED_EMAIL_EVENT_TYPES.has(resendType) ? resendType : null
}

/**
 * Returns the day-offset schedule for a named drip campaign.
 * Day 0 = send immediately on enrollment.
 */
export function buildDripScheduleDays(campaign: 'pa-welcome' | 'dpa-guide'): number[] {
  if (campaign === 'pa-welcome') return [0, 3, 7, 14, 30, 60]
  if (campaign === 'dpa-guide') return [0, 2, 5, 10, 17, 25, 38, 52]
  throw new Error(`Unknown drip campaign: ${campaign}`)
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run tests/lib/workflows/drip-helpers.test.ts
```

Expected: PASS (all tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/workflows/drip-helpers.ts tests/lib/workflows/drip-helpers.test.ts
git commit -m "feat(workflows): drip exit-rule logic and schedule helpers"
```

---

## Phase C — Workflow DevKit workflows

### Task 7: Pre-approval email workflow (simplest — single-send, no sleep)

**Files:**
- Create: `src/workflows/pre-approval-email.ts`
- Create: `tests/workflows/pre-approval-email.integration.test.ts`

Start with this workflow because it has no sleep or hooks — fastest to validate the Workflow DevKit setup.

- [ ] **Step 1: Check Workflow DevKit docs for `"use workflow"` syntax**

```bash
ls node_modules/workflow/docs/ 2>/dev/null || echo "no local docs"
```

If no local docs: read https://useworkflow.dev for the `"use workflow"` + `"use step"` directive syntax before writing code.

- [ ] **Step 2: Write the integration test**

```ts
// tests/workflows/pre-approval-email.integration.test.ts
import { describe, it, expect, vi } from 'vitest'
import { preApprovalEmailWorkflow } from '@/workflows/pre-approval-email'

// Mock Outlook send so tests don't hit Microsoft Graph
vi.mock('@/lib/outlook/graph', () => ({
  sendOutlookEmail: vi.fn().mockResolvedValue({ messageId: 'mock-msg-1' }),
}))

// Mock Supabase so tests don't need a live DB
vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'contact-123', first_name: 'Jane', email: 'jane@example.com' },
            error: null,
          }),
        }),
      }),
    }),
  }),
}))

describe('preApprovalEmailWorkflow', () => {
  it('sends one Outlook email and writes email.sent to activity_log', async () => {
    const { sendOutlookEmail } = await import('@/lib/outlook/graph')
    const { createServiceClient } = await import('@/lib/supabase/server')

    await preApprovalEmailWorkflow({ contact_id: 'contact-123', loan_id: 'loan-456', org_id: 'org-789' })

    expect(sendOutlookEmail).toHaveBeenCalledOnce()
    expect(sendOutlookEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'jane@example.com', subject: expect.stringContaining('Pre-Approval') })
    )

    const client = createServiceClient()
    // activity_log insert should have been called with event_type 'email.sent'
    expect(client.from).toHaveBeenCalledWith('activity_log')
  })
})
```

- [ ] **Step 3: Run to verify failure**

```bash
npx vitest run tests/workflows/pre-approval-email.integration.test.ts
```

Expected: FAIL (module not found)

- [ ] **Step 4: Implement the workflow**

```ts
// src/workflows/pre-approval-email.ts
"use workflow"

import { createServiceClient } from '@/lib/supabase/server'
import { sendOutlookEmail } from '@/lib/outlook/graph'

interface PreApprovalPayload {
  contact_id: string
  loan_id: string
  org_id: string
}

export async function preApprovalEmailWorkflow(payload: PreApprovalPayload): Promise<void> {
  "use step"
  const supabase = createServiceClient()

  // Fetch contact (email address + name) — needed for send
  const { data: contact, error } = await supabase
    .from('contacts')
    .select('id, first_name, last_name, email')
    .eq('id', payload.contact_id)
    .single()

  if (error || !contact?.email) {
    throw new Error(`preApprovalEmailWorkflow: contact ${payload.contact_id} not found or has no email`)
  }

  "use step"
  await sendOutlookEmail({
    to: contact.email,
    subject: `🎉 Your Pre-Approval is Ready, ${contact.first_name}`,
    body: `
      <p>Hi ${contact.first_name},</p>
      <p>Great news — your pre-approval is ready. I've reviewed your file and you're in strong shape.</p>
      <p>Reply to this email or call me directly and we'll walk through next steps together.</p>
      <p>— Adam<br>NMLS #513013</p>
    `,
    fromUserId: process.env.OUTLOOK_SENDER_UPN ?? 'adam@styermortgage.com',
  })

  "use step"
  await supabase.from('activity_log').insert({
    org_id: payload.org_id,
    contact_id: contact.id,
    loan_id: payload.loan_id,
    action: 'email.sent',
    event_type: 'email.sent',
    body: `Pre-approval email sent to ${contact.email}`,
  })
}
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
npx vitest run tests/workflows/pre-approval-email.integration.test.ts
```

Expected: PASS

- [ ] **Step 6: Run full build**

```bash
npm run build
```

Expected: exits 0.

- [ ] **Step 7: Commit**

```bash
git add src/workflows/pre-approval-email.ts tests/workflows/pre-approval-email.integration.test.ts
git commit -m "feat(workflows): pre-approval email — single-send Workflow DevKit workflow"
```

---

### Task 8: PA Welcome nurture (6 emails / 60 days)

**Files:**
- Create: `src/workflows/pa-welcome-nurture.ts`
- Create: `tests/workflows/pa-welcome-nurture.integration.test.ts`

- [ ] **Step 1: Write the integration test**

```ts
// tests/workflows/pa-welcome-nurture.integration.test.ts
import { describe, it, expect, vi } from 'vitest'
import { shouldExitDrip } from '@/lib/workflows/drip-helpers'

// Test the exit-rule integration without running the full workflow
// (full sleep-based tests require @workflow/vitest harness — see smoke-checklist.md)
describe('PA Welcome nurture exit rules', () => {
  it('exits immediately when email_opt_out is set', () => {
    const result = shouldExitDrip({
      email_opt_out: true,
      status: 'active',
      recentBounce: false,
      recentComplaint: false,
    })
    expect(result).toBe(true)
  })

  it('continues when contact is clean at step 0', () => {
    const result = shouldExitDrip({
      email_opt_out: false,
      status: 'active',
      recentBounce: false,
      recentComplaint: false,
    })
    expect(result).toBe(false)
  })

  it('schedule has 6 entries', () => {
    const { buildDripScheduleDays } = require('@/lib/workflows/drip-helpers')
    expect(buildDripScheduleDays('pa-welcome')).toHaveLength(6)
  })
})
```

- [ ] **Step 2: Run to verify tests pass (they reference helpers already written)**

```bash
npx vitest run tests/workflows/pa-welcome-nurture.integration.test.ts
```

Expected: PASS (helper tests — workflow file not needed for these)

- [ ] **Step 3: Implement the workflow**

```ts
// src/workflows/pa-welcome-nurture.ts
"use workflow"

import { createHook, sleep, start } from 'workflow'
import { createServiceClient } from '@/lib/supabase/server'
import { sendViaResend } from '@/lib/resend/send'
import { shouldExitDrip, buildDripScheduleDays } from '@/lib/workflows/drip-helpers'

export async function paWelcomeNurture(contactId: string): Promise<void> {
  const schedule = buildDripScheduleDays('pa-welcome')
  // 6 email subjects — one per step, plain tone per spec
  const subjects = [
    'Welcome — your next steps toward pre-approval',
    'A quick tip that saves most buyers $2,000+',
    'What your credit score actually means for your rate',
    'Avoiding the biggest mistake buyers make in a competitive market',
    'Checking in — any questions since we last talked?',
    'Ready when you are — your pre-approval path',
  ]

  "use step"
  const supabase = createServiceClient()

  // Fetch contact
  const { data: contact, error: contactErr } = await supabase
    .from('contacts')
    .select('id, first_name, email, email_opt_out, org_id')
    .eq('id', contactId)
    .single()

  if (contactErr || !contact?.email) return

  // Find active enrollment
  const { data: enrollment } = await supabase
    .from('drip_enrollments')
    .select('id, status, org_id, campaign_id')
    .eq('contact_id', contactId)
    .eq('status', 'active')
    .order('enrolled_at', { ascending: false })
    .limit(1)
    .single()

  if (!enrollment) return

  for (let i = 0; i < schedule.length; i++) {
    if (i > 0) {
      const delayDays = schedule[i] - schedule[i - 1]
      await sleep(`${delayDays}d`)
    }

    "use step"
    // Re-fetch exit-rule signals after each sleep
    const { data: fresh } = await supabase
      .from('contacts')
      .select('email_opt_out')
      .eq('id', contactId)
      .single()

    const { data: freshEnrollment } = await supabase
      .from('drip_enrollments')
      .select('status')
      .eq('id', enrollment.id)
      .single()

    // Check for recent hard bounce or complaint in activity_log
    const { count: bounceCount } = await supabase
      .from('activity_log')
      .select('*', { count: 'exact', head: true })
      .eq('contact_id', contactId)
      .in('event_type', ['email.bounced', 'email.complained'])

    const shouldExit = shouldExitDrip({
      email_opt_out: fresh?.email_opt_out ?? false,
      status: freshEnrollment?.status ?? 'removed',
      recentBounce: (bounceCount ?? 0) > 0,
      recentComplaint: false, // complaint covered by event_type check above
    })

    if (shouldExit) {
      await supabase
        .from('drip_enrollments')
        .update({ status: 'completed', removed_reason: 'exit-rule' })
        .eq('id', enrollment.id)
      return
    }

    "use step"
    const sendId = await sendViaResend({
      to: contact.email,
      subject: subjects[i],
      body: `<p>Hi ${contact.first_name},</p><p>${subjects[i]}</p><p>— Adam, NMLS #513013</p>`,
      tags: { enrollment_id: enrollment.id, step_order: String(i) },
    })

    await supabase.from('activity_log').insert({
      org_id: contact.org_id,
      contact_id: contact.id,
      action: 'email.sent',
      event_type: 'email.sent',
      body: `PA Welcome step ${i + 1}/${schedule.length}: ${subjects[i]}`,
    })

    // Wait for delivery confirmation (up to 24h); proceed anyway if hook not received
    const hook = createHook({ token: `drip-${enrollment.id}-step-${i}` })
    await Promise.race([hook, sleep('24h')])
  }

  "use step"
  await supabase
    .from('drip_enrollments')
    .update({ status: 'completed' })
    .eq('id', enrollment.id)
}
```

- [ ] **Step 4: Create the Resend send helper** (referenced above)

```ts
// src/lib/resend/send.ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface ResendSendParams {
  to: string
  subject: string
  body: string          // HTML
  tags?: Record<string, string>
}

export async function sendViaResend(params: ResendSendParams): Promise<string> {
  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM_ADDRESS ?? 'adam@styermortgage.com',
    to: params.to,
    subject: params.subject,
    html: params.body,
    tags: params.tags
      ? Object.entries(params.tags).map(([name, value]) => ({ name, value }))
      : undefined,
  })

  if (error) throw new Error(`Resend send failed: ${error.message}`)
  return data?.id ?? ''
}
```

- [ ] **Step 5: Install `resend` package**

```bash
npm install resend
```

- [ ] **Step 6: Run build**

```bash
npm run build
```

Expected: exits 0.

- [ ] **Step 7: Commit**

```bash
git add src/workflows/pa-welcome-nurture.ts src/lib/resend/send.ts \
  tests/workflows/pa-welcome-nurture.integration.test.ts package.json package-lock.json
git commit -m "feat(workflows): PA Welcome nurture — 6-email 60-day durable drip"
```

---

### Task 9: DPA Guide nurture (8 emails / 52 days)

**Files:**
- Create: `src/workflows/dpa-guide-nurture.ts`

Same pattern as Task 8. Different schedule, different subjects.

- [ ] **Step 1: Implement the workflow**

```ts
// src/workflows/dpa-guide-nurture.ts
"use workflow"

import { createHook, sleep } from 'workflow'
import { createServiceClient } from '@/lib/supabase/server'
import { sendViaResend } from '@/lib/resend/send'
import { shouldExitDrip, buildDripScheduleDays } from '@/lib/workflows/drip-helpers'

export async function dpaGuideNurture(contactId: string): Promise<void> {
  const schedule = buildDripScheduleDays('dpa-guide')
  const subjects = [
    'Your DPA guide is here — what Texas buyers need to know',
    'The #1 reason DPA programs get denied (and how to avoid it)',
    'TSAHC vs. TDHCA — which program fits your situation?',
    'Income limits, credit minimums, and what "first-time" actually means',
    'How combining DPA with a seller concession works',
    'A real example: $0 down, $3,200 in closing help (2025 deal)',
    'Is your income too high for DPA? (It might be lower than you think)',
    'Ready to apply? Here\'s the exact next step.',
  ]

  "use step"
  const supabase = createServiceClient()

  const { data: contact, error: contactErr } = await supabase
    .from('contacts')
    .select('id, first_name, email, email_opt_out, org_id')
    .eq('id', contactId)
    .single()

  if (contactErr || !contact?.email) return

  const { data: enrollment } = await supabase
    .from('drip_enrollments')
    .select('id, status, org_id')
    .eq('contact_id', contactId)
    .eq('status', 'active')
    .order('enrolled_at', { ascending: false })
    .limit(1)
    .single()

  if (!enrollment) return

  for (let i = 0; i < schedule.length; i++) {
    if (i > 0) {
      const delayDays = schedule[i] - schedule[i - 1]
      await sleep(`${delayDays}d`)
    }

    "use step"
    const { data: fresh } = await supabase
      .from('contacts')
      .select('email_opt_out')
      .eq('id', contactId)
      .single()

    const { data: freshEnrollment } = await supabase
      .from('drip_enrollments')
      .select('status')
      .eq('id', enrollment.id)
      .single()

    const { count: bounceCount } = await supabase
      .from('activity_log')
      .select('*', { count: 'exact', head: true })
      .eq('contact_id', contactId)
      .in('event_type', ['email.bounced', 'email.complained'])

    if (shouldExitDrip({
      email_opt_out: fresh?.email_opt_out ?? false,
      status: freshEnrollment?.status ?? 'removed',
      recentBounce: (bounceCount ?? 0) > 0,
      recentComplaint: false,
    })) {
      await supabase
        .from('drip_enrollments')
        .update({ status: 'completed', removed_reason: 'exit-rule' })
        .eq('id', enrollment.id)
      return
    }

    "use step"
    await sendViaResend({
      to: contact.email,
      subject: subjects[i],
      body: `<p>Hi ${contact.first_name},</p><p>${subjects[i]}</p><p>— Adam, NMLS #513013</p>`,
      tags: { enrollment_id: enrollment.id, step_order: String(i) },
    })

    await supabase.from('activity_log').insert({
      org_id: contact.org_id,
      contact_id: contact.id,
      action: 'email.sent',
      event_type: 'email.sent',
      body: `DPA Guide step ${i + 1}/${schedule.length}: ${subjects[i]}`,
    })

    const hook = createHook({ token: `drip-${enrollment.id}-step-${i}` })
    await Promise.race([hook, sleep('24h')])
  }

  "use step"
  await supabase
    .from('drip_enrollments')
    .update({ status: 'completed' })
    .eq('id', enrollment.id)
}
```

- [ ] **Step 2: Run build**

```bash
npm run build
```

Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add src/workflows/dpa-guide-nurture.ts
git commit -m "feat(workflows): DPA Guide nurture — 8-email 52-day durable drip"
```

---

### Task 10: Web lead intake workflow (orchestrator)

**Files:**
- Create: `src/workflows/web-lead-intake.ts`
- Create: `tests/workflows/web-lead-intake.integration.test.ts`

- [ ] **Step 1: Write the integration test**

```ts
// tests/workflows/web-lead-intake.integration.test.ts
import { describe, it, expect, vi } from 'vitest'
import type { WebLeadPayload } from '@/lib/workflows/types'

vi.mock('@/lib/outlook/graph', () => ({
  sendOutlookEmail: vi.fn().mockResolvedValue({ messageId: 'mock-1' }),
}))

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      upsert: vi.fn().mockResolvedValue({ data: [{ id: 'contact-123' }], error: null }),
      insert: vi.fn().mockResolvedValue({ error: null }),
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'contact-123', first_name: 'Jane', email: 'jane@example.com', org_id: 'org-1' },
            error: null,
          }),
        }),
      }),
      update: vi.fn().mockResolvedValue({ error: null }),
    }),
  }),
}))

vi.mock('workflow', () => ({
  start: vi.fn().mockResolvedValue(undefined),
}))

describe('webLeadIntakeWorkflow — classification', () => {
  it('classifies loan_goal=dpa as dpa', async () => {
    // classifyLead is synchronous fallback (no AI in unit test)
    const { classifyLeadFallback } = await import('@/lib/workflows/drip-helpers')
    // Need to export this from drip-helpers — see Task 10 Step 3 note
    expect(classifyLeadFallback({ loan_goal: 'dpa', situation: '' })).toBe('dpa')
  })

  it('classifies loan_goal=purchase as pa', async () => {
    const { classifyLeadFallback } = await import('@/lib/workflows/drip-helpers')
    expect(classifyLeadFallback({ loan_goal: 'purchase', situation: '' })).toBe('pa')
  })

  it('classifies unknown goal as generic', async () => {
    const { classifyLeadFallback } = await import('@/lib/workflows/drip-helpers')
    expect(classifyLeadFallback({ loan_goal: null, situation: '' })).toBe('generic')
  })
})
```

- [ ] **Step 2: Add `classifyLeadFallback` to drip-helpers**

```ts
// Append to src/lib/workflows/drip-helpers.ts

export interface LeadClassificationInput {
  loan_goal: string | null
  situation: string | null
}

/**
 * Fallback classification without AI — uses explicit loan_goal mapping.
 * Mirror of n8n Parse Form Data campaignMap logic.
 */
export function classifyLeadFallback(input: LeadClassificationInput): 'pa' | 'dpa' | 'generic' {
  const goal = (input.loan_goal ?? '').toLowerCase()
  if (['purchase', 'buy', 'first-time buyer', 'ftb'].includes(goal)) return 'pa'
  if (['dpa', 'down payment assistance', 'tsahc', 'tdhca'].includes(goal)) return 'dpa'
  return 'generic'
}
```

- [ ] **Step 3: Run tests**

```bash
npx vitest run tests/workflows/web-lead-intake.integration.test.ts
```

Expected: PASS

- [ ] **Step 4: Implement the workflow**

```ts
// src/workflows/web-lead-intake.ts
"use workflow"

import { start } from 'workflow'
import { createServiceClient } from '@/lib/supabase/server'
import { sendOutlookEmail } from '@/lib/outlook/graph'
import { classifyLeadFallback } from '@/lib/workflows/drip-helpers'
import { paWelcomeNurture } from './pa-welcome-nurture'
import { dpaGuideNurture } from './dpa-guide-nurture'
import type { WebLeadPayload } from '@/lib/workflows/types'

export async function webLeadIntakeWorkflow(payload: WebLeadPayload): Promise<void> {
  "use step"
  const supabase = createServiceClient()

  // Upsert contact — dedup on email
  const { data: contacts, error: upsertErr } = await supabase
    .from('contacts')
    .upsert(
      {
        org_id: payload.org_id,
        first_name: payload.first_name,
        last_name: payload.last_name,
        email: payload.email,
        phone: payload.phone,
        source_page: payload.source_page,
        form_name: payload.form_name,
        utm_params: payload.utm_params ?? undefined,
        referrer: payload.referrer,
      },
      { onConflict: 'org_id,email', ignoreDuplicates: false }
    )
    .select('id, first_name, email, org_id')

  const contact = contacts?.[0]
  if (upsertErr || !contact) {
    throw new Error(`webLeadIntakeWorkflow: upsert failed — ${upsertErr?.message}`)
  }

  "use step"
  // Write activity
  await supabase.from('activity_log').insert({
    org_id: payload.org_id,
    contact_id: contact.id,
    action: 'contact_created',
    event_type: 'contact_created',
    body: `Web lead via ${payload.form_name ?? 'unknown form'} on ${payload.source_page ?? 'unknown page'}`,
  })

  "use step"
  // Alert Adam via Outlook
  await sendOutlookEmail({
    to: process.env.OUTLOOK_SENDER_UPN ?? 'adam@styermortgage.com',
    subject: `New lead: ${contact.first_name} — ${payload.loan_goal ?? 'unknown goal'}`,
    body: `
      <p><strong>New web lead received</strong></p>
      <ul>
        <li>Name: ${contact.first_name}</li>
        <li>Email: ${contact.email}</li>
        <li>Goal: ${payload.loan_goal}</li>
        <li>Source: ${payload.source_page}</li>
        <li>UTM: ${JSON.stringify(payload.utm_params)}</li>
      </ul>
    `,
    fromUserId: process.env.OUTLOOK_SENDER_UPN ?? 'adam@styermortgage.com',
  })

  "use step"
  // Send confirmation to lead (if email present)
  if (contact.email) {
    await sendOutlookEmail({
      to: contact.email,
      subject: `Got your message, ${contact.first_name} — here's what happens next`,
      body: `
        <p>Hi ${contact.first_name},</p>
        <p>I got your message and will be in touch within one business day.</p>
        <p>In the meantime, you can schedule a quick call here: https://calendly.com/adamstyer/15minutes</p>
        <p>— Adam Styer | NMLS #513013</p>
      `,
      fromUserId: process.env.OUTLOOK_SENDER_UPN ?? 'adam@styermortgage.com',
    })
  }

  "use step"
  // Classify lead (fallback — no AI dependency for reliability)
  const classification = classifyLeadFallback({
    loan_goal: payload.loan_goal ?? null,
    situation: payload.situation ?? null,
  })

  // Enroll in drip
  if (classification === 'pa') {
    await supabase.from('drip_enrollments').insert({
      org_id: payload.org_id,
      contact_id: contact.id,
      campaign_id: process.env.PA_WELCOME_CAMPAIGN_ID ?? '',
      status: 'active',
      enrolled_by: 'auto',
      current_step: 0,
    })
    await start(paWelcomeNurture, [contact.id])
  } else if (classification === 'dpa') {
    await supabase.from('drip_enrollments').insert({
      org_id: payload.org_id,
      contact_id: contact.id,
      campaign_id: process.env.DPA_GUIDE_CAMPAIGN_ID ?? '',
      status: 'active',
      enrolled_by: 'auto',
      current_step: 0,
    })
    await start(dpaGuideNurture, [contact.id])
  }
  // generic → no drip enrollment
}
```

- [ ] **Step 5: Run build**

```bash
npm run build
```

Expected: exits 0. Fix any TypeScript errors before continuing.

- [ ] **Step 6: Commit**

```bash
git add src/workflows/web-lead-intake.ts src/lib/workflows/drip-helpers.ts \
  tests/workflows/web-lead-intake.integration.test.ts
git commit -m "feat(workflows): web lead intake — upsert, Outlook alerts, lead classification, drip enroll"
```

---

## Phase D — API routes

### Task 11: Resend webhook receiver

**Files:**
- Create: `src/app/api/resend-webhook/route.ts`

- [ ] **Step 1: Write the route**

```ts
// src/app/api/resend-webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { verifyResendSignature } from '@/lib/resend/verify'
import { mapResendEventType } from '@/lib/workflows/drip-helpers'
import { resumeHook } from 'workflow'

export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.RESEND_WEBHOOK_SECRET
  if (!secret) {
    console.error('RESEND_WEBHOOK_SECRET not set')
    return NextResponse.json({ error: 'Misconfigured' }, { status: 500 })
  }

  let rawBody: string
  let event: Awaited<ReturnType<typeof verifyResendSignature>>

  try {
    rawBody = await req.text()
    event = await verifyResendSignature(rawBody, Object.fromEntries(req.headers.entries()), secret)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const supabase = createServiceClient()

  // Idempotency — skip if already processed
  const { error: insertErr } = await supabase
    .from('resend_webhook_events')
    .insert({
      event_id: event.data.email_id,
      event_type: event.type,
      contact_id: event.data.tags?.contact_id ?? null,
      enrollment_id: event.data.tags?.enrollment_id ?? null,
      payload: event as unknown as Record<string, unknown>,
    })
    .onConflict('event_id')
    .ignoreDuplicates()

  // insertErr here means a non-conflict DB error — log but don't 500 (Resend would retry)
  if (insertErr && insertErr.code !== '23505') {
    console.error('resend-webhook: DB insert error', insertErr)
  }

  // Map to canonical activity_log event_type
  const activityEventType = mapResendEventType(event.type)
  if (activityEventType && event.data.tags?.contact_id) {
    await supabase.from('activity_log').insert({
      org_id: process.env.DEFAULT_ORG_ID ?? '',   // webhook has no org context — use default
      contact_id: event.data.tags.contact_id,
      action: activityEventType,
      event_type: activityEventType,
      body: `Resend: ${event.type} for email to ${event.data.to?.[0] ?? 'unknown'}`,
    })
  }

  // Resume drip workflow hook if metadata present
  const enrollmentId = event.data.tags?.enrollment_id
  const stepOrder = event.data.tags?.step_order
  if (enrollmentId && stepOrder !== undefined) {
    await resumeHook(`drip-${enrollmentId}-step-${stepOrder}`, event)
  }

  return NextResponse.json({ received: true })
}

// Disable body parsing — we need rawBody for Svix verification
export const config = { api: { bodyParser: false } }
```

- [ ] **Step 2: Run build to confirm no errors**

```bash
npm run build
```

Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/resend-webhook/route.ts
git commit -m "feat(api): Resend webhook receiver — Svix verify, dedup, activity_log, resumeHook"
```

---

### Task 12: Pre-approval manual trigger endpoint

**Files:**
- Create: `src/app/api/workflows/pre-approval-email/start/route.ts`

- [ ] **Step 1: Implement the route**

```ts
// src/app/api/workflows/pre-approval-email/start/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { start } from 'workflow'
import { preApprovalEmailWorkflow } from '@/workflows/pre-approval-email'

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Authenticated LO — must be logged in
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { contact_id, loan_id, org_id } = await req.json() as {
    contact_id: string
    loan_id: string
    org_id: string
  }

  if (!contact_id || !loan_id || !org_id) {
    return NextResponse.json({ error: 'Missing required fields: contact_id, loan_id, org_id' }, { status: 400 })
  }

  await start(preApprovalEmailWorkflow, [{ contact_id, loan_id, org_id }])
  return NextResponse.json({ started: true })
}
```

- [ ] **Step 2: Run build**

```bash
npm run build
```

Expected: exits 0.

- [ ] **Step 3: Wire up middleware to ensure `/admin/*` is protected**

Open `src/middleware.ts` and confirm `/admin/email-automation` is within the `matcher` pattern. The existing matcher likely covers `/dashboard/*` — look for it:

```bash
grep -n "matcher\|admin" /Users/adamstyer/Documents/loanos-clone/src/middleware.ts | head -30
```

If `/admin` is not in the matcher, add `'/admin/:path*'` to the matcher array.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/workflows/pre-approval-email/start/route.ts src/middleware.ts
git commit -m "feat(api): pre-approval workflow manual trigger + middleware admin route coverage"
```

---

### Task 13: Wire web-lead route to start workflow

**Files:**
- Modify: `src/app/api/contacts/web-lead/route.ts`

- [ ] **Step 1: Read the current route**

```bash
cat /Users/adamstyer/Documents/loanos-clone/src/app/api/contacts/web-lead/route.ts
```

Note the current field list being persisted and the upsert logic. Do not remove any existing fields — only add the new ones and the `start()` call.

- [ ] **Step 2: Add the new fields + workflow start**

Locate the section where `contacts` is upserted. Add these fields to the upsert object:

```ts
source_page: body.source_page ?? body.page_url ?? null,
form_name: body.form_name ?? body['form-name'] ?? null,
utm_params: body.utm_source
  ? { source: body.utm_source, medium: body.utm_medium, campaign: body.utm_campaign }
  : null,
referrer: body.referrer ?? null,
```

After the upsert succeeds, add (gated by feature flag for shadow mode):

```ts
import { start } from 'workflow'
import { webLeadIntakeWorkflow } from '@/workflows/web-lead-intake'
import type { WebLeadPayload } from '@/lib/workflows/types'

// Feature flag: 'off' | 'shadow' | 'live'
const WORKFLOW_DEVKIT_LEAD_INTAKE = process.env.WORKFLOW_DEVKIT_LEAD_INTAKE ?? 'off'

if (WORKFLOW_DEVKIT_LEAD_INTAKE === 'live') {
  const wfPayload: WebLeadPayload = {
    first_name: body.first_name ?? body['first-name'] ?? '',
    last_name: body.last_name ?? body['last-name'] ?? '',
    email: body.email ?? null,
    phone: body.phone ?? null,
    loan_goal: body.loan_goal ?? body.loan_type ?? null,
    purchase_price: body.purchase_price ? Number(body.purchase_price) : null,
    credit_score: body.credit_score ?? null,
    situation: body.situation ?? null,
    source_page: body.source_page ?? body.page_url ?? null,
    form_name: body.form_name ?? body['form-name'] ?? null,
    utm_params: body.utm_source
      ? { source: body.utm_source, medium: body.utm_medium ?? '', campaign: body.utm_campaign ?? '' }
      : null,
    referrer: body.referrer ?? null,
    org_id: process.env.DEFAULT_ORG_ID ?? '',
  }
  await start(webLeadIntakeWorkflow, [wfPayload])
} else if (WORKFLOW_DEVKIT_LEAD_INTAKE === 'shadow') {
  // Shadow mode: log what WOULD have happened, do not actually send
  console.log('[shadow] webLeadIntakeWorkflow would have started with', JSON.stringify({ contact_id: contact?.id }))
  // TODO Phase G: write to shadow_log table for parity comparison
}
// 'off': n8n continues to handle — no action here
```

- [ ] **Step 3: Run build**

```bash
npm run build
```

Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/contacts/web-lead/route.ts
git commit -m "feat(api): web-lead route — persist UTM/origin fields, feature-flagged Workflow DevKit start"
```

---

## Phase E — Dashboard UI

### Task 14: Admin layout + page scaffold

**Files:**
- Create: `src/app/admin/email-automation/layout.tsx`
- Create: `src/app/admin/email-automation/page.tsx`

- [ ] **Step 1: Create the layout (requireAdmin gate)**

```tsx
// src/app/admin/email-automation/layout.tsx
import { requireAdmin } from '@/lib/admin/auth'

export default async function EmailAutomationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { error } = await requireAdmin()
  if (error) return error
  return <>{children}</>
}
```

- [ ] **Step 2: Create the page shell (panels wired in later tasks)**

```tsx
// src/app/admin/email-automation/page.tsx
import { Suspense } from 'react'
import WorkflowStatusPanel from '@/components/email-automation/WorkflowStatusPanel'
import EmailSendLog from '@/components/email-automation/EmailSendLog'
import ActiveDripsTable from '@/components/email-automation/ActiveDripsTable'
import LeadOriginTable from '@/components/email-automation/LeadOriginTable'

export default function EmailAutomationPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Email Automation</h1>
      <div className="grid grid-cols-1 gap-6">
        <Suspense fallback={<div className="h-32 animate-pulse bg-muted rounded-lg" />}>
          <WorkflowStatusPanel />
        </Suspense>
        <Suspense fallback={<div className="h-32 animate-pulse bg-muted rounded-lg" />}>
          <EmailSendLog />
        </Suspense>
        <Suspense fallback={<div className="h-32 animate-pulse bg-muted rounded-lg" />}>
          <ActiveDripsTable />
        </Suspense>
        <Suspense fallback={<div className="h-32 animate-pulse bg-muted rounded-lg" />}>
          <LeadOriginTable />
        </Suspense>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create stub components so the build passes**

Each of the four panel components must exist as a stub before the build can pass. Create them now:

```tsx
// src/components/email-automation/WorkflowStatusPanel.tsx
export default function WorkflowStatusPanel() {
  return <div data-testid="workflow-status-panel">Loading...</div>
}
```

Repeat the same stub pattern for:
- `src/components/email-automation/EmailSendLog.tsx`
- `src/components/email-automation/ActiveDripsTable.tsx`
- `src/components/email-automation/LeadOriginTable.tsx`
- `src/components/email-automation/DripDetailDrawer.tsx`

- [ ] **Step 4: Run build**

```bash
npm run build
```

Expected: exits 0.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/email-automation/ src/components/email-automation/
git commit -m "feat(dashboard): email automation page scaffold — layout gate + panel stubs"
```

---

### Task 15: Panel 1 — Workflow Status

**Files:**
- Modify: `src/components/email-automation/WorkflowStatusPanel.tsx`

- [ ] **Step 1: Implement the component**

```tsx
// src/components/email-automation/WorkflowStatusPanel.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface WorkflowStatus {
  id: string
  name: string
  source: 'n8n' | 'workflow-devkit'
  active: boolean
  lastRunAt: string | null
  lastRunStatus: 'success' | 'error' | 'running' | null
}

async function fetchWorkflowStatuses(): Promise<WorkflowStatus[]> {
  // n8n: query active workflows via n8n REST API
  // Workflow DevKit: query run history via Vercel Workflow API
  // For Phase 1, return the 4 migrated workflows' status from n8n
  // (Workflow DevKit status API endpoint TBD — check @workflow/next docs)
  const n8nRes = await fetch(`${process.env.N8N_BASE_URL}/api/v1/workflows?active=true`, {
    headers: { 'X-N8N-API-KEY': process.env.N8N_API_KEY ?? '' },
    next: { revalidate: 60 }, // cache 60s
  })

  if (!n8nRes.ok) return []

  const { data: workflows } = await n8nRes.json() as { data: Array<{ id: string; name: string; active: boolean }> }

  return workflows.map((wf) => ({
    id: wf.id,
    name: wf.name,
    source: 'n8n' as const,
    active: wf.active,
    lastRunAt: null,
    lastRunStatus: null,
  }))
}

export default async function WorkflowStatusPanel() {
  const statuses = await fetchWorkflowStatuses()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workflow Status</CardTitle>
      </CardHeader>
      <CardContent>
        {statuses.length === 0 ? (
          <p className="text-sm text-muted-foreground">No workflow data available.</p>
        ) : (
          <div className="space-y-2">
            {statuses.map((wf) => (
              <div key={wf.id} className="flex items-center justify-between py-1 border-b last:border-0">
                <span className="text-sm font-medium">{wf.name}</span>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs">{wf.source}</Badge>
                  <Badge variant={wf.active ? 'default' : 'secondary'}>
                    {wf.active ? 'active' : 'inactive'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Add `N8N_BASE_URL` and `N8N_API_KEY` to Vercel env vars**

These should already exist if n8n MCP is configured. Verify:
```bash
grep -r "N8N_API_KEY\|N8N_BASE_URL" /Users/adamstyer/Documents/loanos-clone/src/ | head -5
```

If present in other routes, reuse the same env var names.

- [ ] **Step 3: Run build**

```bash
npm run build
```

Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add src/components/email-automation/WorkflowStatusPanel.tsx
git commit -m "feat(dashboard): Panel 1 — workflow status from n8n API"
```

---

### Task 16: Panel 2 — Email Send Log

**Files:**
- Modify: `src/components/email-automation/EmailSendLog.tsx`

- [ ] **Step 1: Implement the component**

```tsx
// src/components/email-automation/EmailSendLog.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createServiceClient } from '@/lib/supabase/server'

interface EmailLogEntry {
  id: string
  contact_id: string
  event_type: string
  body: string | null
  created_at: string
}

async function fetchEmailLog(): Promise<EmailLogEntry[]> {
  // IMPORTANT: Use createServiceClient (server-side) — NOT raw Supabase client from RSC.
  // PII decryption happens via /api/activity. For the log table display (non-PII body field),
  // we can query activity_log directly here since email body field is not PII.
  const supabase = createServiceClient()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data } = await supabase
    .from('activity_log')
    .select('id, contact_id, event_type, body, created_at')
    .like('event_type', 'email.%')
    .gte('created_at', thirtyDaysAgo)
    .order('created_at', { ascending: false })
    .limit(50)

  return (data ?? []) as EmailLogEntry[]
}

export default async function EmailSendLog() {
  const entries = await fetchEmailLog()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Send Log <span className="text-sm font-normal text-muted-foreground">(last 30 days)</span></CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No email events in the last 30 days.</p>
        ) : (
          <div className="space-y-1">
            {entries.map((e) => (
              <div key={e.id} className="flex items-start gap-3 py-1 border-b last:border-0 text-sm">
                <span className="text-muted-foreground whitespace-nowrap">
                  {new Date(e.created_at).toLocaleDateString()}
                </span>
                <span className="font-mono text-xs bg-muted px-1 rounded">{e.event_type}</span>
                <span className="truncate text-muted-foreground">{e.body ?? '—'}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Run build**

```bash
npm run build
```

Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/email-automation/EmailSendLog.tsx
git commit -m "feat(dashboard): Panel 2 — email send log from activity_log"
```

---

### Task 17: Panel 3 — Active Drips + Panel 6 Drawer

**Files:**
- Modify: `src/components/email-automation/ActiveDripsTable.tsx`
- Modify: `src/components/email-automation/DripDetailDrawer.tsx`

- [ ] **Step 1: Implement the drips table**

```tsx
// src/components/email-automation/ActiveDripsTable.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createServiceClient } from '@/lib/supabase/server'
import DripDetailDrawer from './DripDetailDrawer'

interface DrипRow {
  id: string
  contact_name: string
  campaign_name: string
  status: string
  enrolled_at: string
  current_step: number
  total_steps: number
}

async function fetchActiveDrips(): Promise<DrипRow[]> {
  const supabase = createServiceClient()

  const { data } = await supabase
    .from('drip_enrollments')
    .select(`
      id,
      status,
      enrolled_at,
      current_step,
      contacts!inner(first_name, last_name),
      drip_campaigns!inner(name),
      drip_steps(id)
    `)
    .eq('status', 'active')
    .order('enrolled_at', { ascending: false })
    .limit(50)

  return (data ?? []).map((row: Record<string, unknown>) => {
    const contact = row.contacts as { first_name: string; last_name: string }
    const campaign = row.drip_campaigns as { name: string }
    const steps = row.drip_steps as unknown[]
    return {
      id: row.id as string,
      contact_name: `${contact.first_name} ${contact.last_name}`.trim(),
      campaign_name: campaign.name,
      status: row.status as string,
      enrolled_at: row.enrolled_at as string,
      current_step: row.current_step as number,
      total_steps: steps.length,
    }
  })
}

export default async function ActiveDripsTable() {
  const drips = await fetchActiveDrips()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Drip Sequences</CardTitle>
      </CardHeader>
      <CardContent>
        {drips.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active drip enrollments.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 font-medium">Contact</th>
                <th className="py-2 font-medium">Campaign</th>
                <th className="py-2 font-medium">Step</th>
                <th className="py-2 font-medium">Enrolled</th>
                <th className="py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {drips.map((d) => (
                <DripDetailDrawer key={d.id} enrollment={d}>
                  <tr className="border-b hover:bg-muted/40 cursor-pointer transition-colors">
                    <td className="py-2">{d.contact_name}</td>
                    <td className="py-2 text-muted-foreground">{d.campaign_name}</td>
                    <td className="py-2">{d.current_step + 1}/{d.total_steps}</td>
                    <td className="py-2 text-muted-foreground">{new Date(d.enrolled_at).toLocaleDateString()}</td>
                    <td className="py-2"><Badge variant="default">{d.status}</Badge></td>
                  </tr>
                </DripDetailDrawer>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Implement DripDetailDrawer**

```tsx
// src/components/email-automation/DripDetailDrawer.tsx
'use client'

import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

interface DrипRow {
  id: string
  contact_name: string
  campaign_name: string
  status: string
  enrolled_at: string
  current_step: number
  total_steps: number
}

interface DripDetailDrawerProps {
  enrollment: DrипRow
  children: React.ReactNode
}

export default function DripDetailDrawer({ enrollment, children }: DripDetailDrawerProps) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{enrollment.contact_name}</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-3 text-sm">
          <p><span className="font-medium">Campaign:</span> {enrollment.campaign_name}</p>
          <p><span className="font-medium">Status:</span> {enrollment.status}</p>
          <p><span className="font-medium">Step:</span> {enrollment.current_step + 1} of {enrollment.total_steps}</p>
          <p><span className="font-medium">Enrolled:</span> {new Date(enrollment.enrolled_at).toLocaleDateString()}</p>
          <p className="text-muted-foreground text-xs">Full send timeline — connect drip_sends table in Phase 2.</p>
        </div>
      </SheetContent>
    </Sheet>
  )
}
```

- [ ] **Step 3: Run build**

```bash
npm run build
```

Expected: exits 0. Fix any TypeScript errors (the `DrипRow` interface is defined in two files — extract to `types.ts` if TypeScript complains about duplication).

- [ ] **Step 4: Commit**

```bash
git add src/components/email-automation/ActiveDripsTable.tsx src/components/email-automation/DripDetailDrawer.tsx
git commit -m "feat(dashboard): Panel 3 + Panel 6 — active drips table with detail drawer"
```

---

### Task 18: Panel 5 — Lead Origin Table

**Files:**
- Modify: `src/components/email-automation/LeadOriginTable.tsx`

- [ ] **Step 1: Implement the component**

```tsx
// src/components/email-automation/LeadOriginTable.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createServiceClient } from '@/lib/supabase/server'

interface LeadOriginRow {
  id: string
  name: string
  source_page: string | null
  form_name: string | null
  utm_source: string | null
  referrer: string | null
  created_at: string
}

async function fetchLeadOrigins(): Promise<LeadOriginRow[]> {
  const supabase = createServiceClient()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data } = await supabase
    .from('contacts')
    .select('id, first_name, last_name, source_page, form_name, utm_params, referrer, created_at')
    .gte('created_at', thirtyDaysAgo)
    .order('created_at', { ascending: false })
    .limit(50)

  return (data ?? []).map((row) => ({
    id: row.id as string,
    name: `${row.first_name} ${row.last_name}`.trim(),
    source_page: row.source_page as string | null,
    form_name: row.form_name as string | null,
    utm_source: (row.utm_params as Record<string, string> | null)?.source ?? null,
    referrer: row.referrer as string | null,
    created_at: row.created_at as string,
  }))
}

export default async function LeadOriginTable() {
  const leads = await fetchLeadOrigins()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lead Origin <span className="text-sm font-normal text-muted-foreground">(last 30 days)</span></CardTitle>
      </CardHeader>
      <CardContent>
        {leads.length === 0 ? (
          <p className="text-sm text-muted-foreground">No leads with origin data in the last 30 days.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 font-medium">Contact</th>
                <th className="py-2 font-medium">Page</th>
                <th className="py-2 font-medium">Form</th>
                <th className="py-2 font-medium">UTM Source</th>
                <th className="py-2 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-b">
                  <td className="py-2">{lead.name}</td>
                  <td className="py-2 text-muted-foreground text-xs">{lead.source_page ?? '—'}</td>
                  <td className="py-2 text-muted-foreground text-xs">{lead.form_name ?? '—'}</td>
                  <td className="py-2 text-muted-foreground">{lead.utm_source ?? '—'}</td>
                  <td className="py-2 text-muted-foreground">{new Date(lead.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Confirm LeadSourceChart is reusable for Panel 4**

```bash
grep -rn "LeadSourceChart" /Users/adamstyer/Documents/loanos-clone/src/ | head -10
```

If found, import it into `page.tsx` and add it between EmailSendLog and ActiveDripsTable. If not found in that exact name, locate the lead source chart component from the dashboard v6.1 and import it directly.

- [ ] **Step 3: Run build**

```bash
npm run build
```

Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add src/components/email-automation/LeadOriginTable.tsx src/app/admin/email-automation/page.tsx
git commit -m "feat(dashboard): Panel 5 — lead origin table with UTM + source page"
```

---

### Task 19: Push dashboard to Vercel + verify deployment

- [ ] **Step 1: Run final pre-push build**

```bash
cd /Users/adamstyer/Documents/loanos-clone && npm run build
```

Expected: exits 0.

- [ ] **Step 2: Push to main**

```bash
git push origin main
```

- [ ] **Step 3: Watch deployment via Vercel MCP**

Use `mcp__ffdaa602-c6ad-4c4e-a44d-006990b1dafe__list_deployments` with `projectId: "loanos"` and `teamId: "team_aJNpxKvLlNTUiDdWTdhX0Vgf"`.

Wait for deployment with the current commit to reach `state: READY`. If `state: ERROR`, run `get_deployment_build_logs` and fix before proceeding.

- [ ] **Step 4: Verify page loads**

Navigate to `https://loanos.vercel.app/admin/email-automation` (or production domain). Confirm:
- Page loads without 500
- requireAdmin redirects non-admin users
- All 4 panel stubs/components render

- [ ] **Step 5: Commit status update to CONTEXT.md and CHANGELOG.md**

Update `CONTEXT.md` with:
- Dashboard shipped to `/admin/email-automation`
- Migration 086 applied
- Four Workflow DevKit workflows created
- Feature flag `WORKFLOW_DEVKIT_LEAD_INTAKE=off` (not yet active)

Append to `CHANGELOG.md`.

---

## Phase F — styermortgage.com ingress unification

Work in `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site`

### Task 20: Unified Netlify function

**Files:**
- Create: `netlify/functions/lead-intake.js`

- [ ] **Step 1: Read the current subscribe-lead.js to understand the full logic**

```bash
cat /Users/adamstyer/Documents/Claude/styerteam-mortgage-site/netlify/functions/subscribe-lead.js
```

Note all branches, env vars used, and Mailchimp tag logic.

- [ ] **Step 2: Create the unified function**

```js
// netlify/functions/lead-intake.js
// Unified lead ingress — replaces subscribe-lead.js
// Preserves all behavior from both paths:
//   - subscribe-lead.js: Mailchimp add + PA/DPA journey tags
//   - n8n web-lead: was handled externally; now LoanOS owns all logic

const fetch = require('node-fetch')

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  let body
  try {
    body = event.headers['content-type']?.includes('application/json')
      ? JSON.parse(event.body)
      : Object.fromEntries(new URLSearchParams(event.body))
  } catch {
    return { statusCode: 400, body: 'Bad Request' }
  }

  // Honeypot check (bot field from n8n Parse Form Data logic)
  if (body['bot-field'] || body.honeypot) {
    return { statusCode: 200, body: 'ok' }
  }

  // Field normalization (first_name / first-name variants)
  const firstName = body.first_name ?? body['first-name'] ?? ''
  const lastName = body.last_name ?? body['last-name'] ?? ''
  const email = body.email ?? ''
  const phone = body.phone ?? ''
  const loanGoal = body.loan_goal ?? body.loan_type ?? body.goal ?? ''
  const formName = body['form-name'] ?? body.form_name ?? 'unknown'

  if (!email) return { statusCode: 400, body: 'email required' }

  // 1. Mailchimp: add to general list + tag (no journey — Workflow DevKit owns drip)
  if (process.env.MAILCHIMP_API_KEY && process.env.MAILCHIMP_LIST_ID) {
    await addToMailchimp({ email, firstName, lastName, loanGoal })
      .catch((err) => console.error('Mailchimp error (non-fatal):', err.message))
  }

  // 2. POST to LoanOS — this starts the Workflow DevKit pipeline
  await fetch(`${process.env.LOANOS_API_URL}/api/contacts/web-lead`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.LOANOS_AGENT_SECRET}`,
    },
    body: JSON.stringify({
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      loan_goal: loanGoal,
      purchase_price: body.purchase_price ?? null,
      credit_score: body.credit_score ?? null,
      situation: body.situation ?? null,
      source_page: body.page_url ?? null,
      'form-name': formName,
      utm_source: body.utm_source ?? null,
      utm_medium: body.utm_medium ?? null,
      utm_campaign: body.utm_campaign ?? null,
      referrer: body.referrer ?? null,
    }),
  }).catch((err) => console.error('LoanOS POST error (non-fatal):', err.message))

  return { statusCode: 200, body: JSON.stringify({ success: true }) }
}

async function addToMailchimp({ email, firstName, lastName, loanGoal }) {
  const md5 = require('crypto').createHash('md5').update(email.toLowerCase()).digest('hex')
  const url = `https://us1.api.mailchimp.com/3.0/lists/${process.env.MAILCHIMP_LIST_ID}/members/${md5}`

  await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`anystring:${process.env.MAILCHIMP_API_KEY}`).toString('base64')}`,
    },
    body: JSON.stringify({
      email_address: email,
      status_if_new: 'subscribed',
      merge_fields: { FNAME: firstName, LNAME: lastName },
      tags: [loanGoal ? `goal-${loanGoal}` : 'web-lead'],
    }),
  })
}
```

- [ ] **Step 3: Wire HTML forms to the new function**

Find all `<form>` tags that currently post to Netlify native forms or subscribe-lead:

```bash
grep -rn 'netlify\|subscribe-lead\|action=' /Users/adamstyer/Documents/Claude/styerteam-mortgage-site/*.html | grep -v ".git"
```

For each form lacking the 5 hidden fields, add:

```html
<input type="hidden" name="utm_source">
<input type="hidden" name="utm_medium">
<input type="hidden" name="utm_campaign">
<input type="hidden" name="page_url">
<input type="hidden" name="referrer">
```

And change `action` / `data-netlify-function` to point to `/.netlify/functions/lead-intake`.

- [ ] **Step 4: Extend `assets/utm.js` to auto-populate the hidden fields**

```js
// Append to assets/utm.js (or create if it doesn't exist)
(function () {
  function getParam(name) {
    return new URLSearchParams(window.location.search).get(name) ?? ''
  }
  function fill(name, value) {
    document.querySelectorAll(`input[name="${name}"]`).forEach((el) => {
      if (el.value === '') el.value = value
    })
  }
  document.addEventListener('DOMContentLoaded', function () {
    fill('utm_source', getParam('utm_source'))
    fill('utm_medium', getParam('utm_medium'))
    fill('utm_campaign', getParam('utm_campaign'))
    fill('page_url', window.location.href)
    fill('referrer', document.referrer)
  })
})()
```

- [ ] **Step 5: Verify all forms have `form-name` attribute set**

Netlify functions receive form-name in the POST body when the form has `name` attribute. Confirm each form has `name="[descriptive-name]"`.

- [ ] **Step 6: Commit to styermortgage.com repo**

```bash
cd /Users/adamstyer/Documents/Claude/styerteam-mortgage-site
git add netlify/functions/lead-intake.js assets/utm.js *.html
git commit -m "feat(lead-intake): unified lead ingress function + UTM hidden fields on all forms"
git push origin main
```

- [ ] **Step 7: Confirm Netlify deploys green**

Check Netlify deployment status. Verify the new function appears in Netlify Functions dashboard.

---

## Phase G — Shadow mode rollout + cutover checklist

### Task 21: Add shadow log table and enable shadow mode

**Files:**
- Create: `supabase/migrations/087_shadow_log.sql`

- [ ] **Step 1: Create shadow log migration**

```sql
-- 087_shadow_log.sql
-- Shadow mode log for Workflow DevKit parity comparison

CREATE TABLE workflow_shadow_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  trigger_source TEXT NOT NULL,                  -- 'web-lead', 'pa-welcome', etc.
  classification TEXT,                           -- 'pa' | 'dpa' | 'generic'
  would_enroll BOOLEAN NOT NULL DEFAULT false,
  campaign_key TEXT,                             -- 'pa-welcome' | 'dpa-guide' | null
  exit_rule_triggered BOOLEAN NOT NULL DEFAULT false,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_shadow_log_logged_at ON workflow_shadow_log(logged_at DESC);
CREATE INDEX idx_shadow_log_contact ON workflow_shadow_log(contact_id);
```

- [ ] **Step 2: Apply the migration**

Use `mcp__e3151559-6ff6-4fec-a1b1-e68a6212bd73__apply_migration` with name `087_shadow_log`.

- [ ] **Step 3: Update web-lead route shadow mode block to write to table**

Find the `'shadow'` branch in `src/app/api/contacts/web-lead/route.ts` (added in Task 13) and replace the `console.log` with a real DB write:

```ts
} else if (WORKFLOW_DEVKIT_LEAD_INTAKE === 'shadow') {
  const classification = classifyLeadFallback({
    loan_goal: body.loan_goal ?? null,
    situation: body.situation ?? null,
  })
  const serviceClient = createServiceClient()
  await serviceClient.from('workflow_shadow_log').insert({
    contact_id: contact?.id ?? null,
    trigger_source: 'web-lead',
    classification,
    would_enroll: classification !== 'generic',
    campaign_key: classification === 'pa' ? 'pa-welcome' : classification === 'dpa' ? 'dpa-guide' : null,
    payload: body as unknown as Record<string, unknown>,
  })
}
```

- [ ] **Step 4: Set env var to shadow mode in Vercel**

Add `WORKFLOW_DEVKIT_LEAD_INTAKE=shadow` to Vercel environment variables. **Do not flip to `live` until parity review passes.**

- [ ] **Step 5: Commit + push**

```bash
npm run build && git add -A && git commit -m "feat(shadow): shadow log table + shadow mode enabled for web-lead intake"
git push origin main
```

Watch deployment reach `state: READY` via Vercel MCP before ending the session.

---

### Task 22: Smoke checklist

**Files:**
- Create: `tests/workflows/smoke-checklist.md`

- [ ] **Step 1: Write the checklist**

```markdown
# Workflow DevKit — Manual Smoke Checklist

Run this checklist before flipping WORKFLOW_DEVKIT_LEAD_INTAKE to 'live'.

## Pre-Approval Email (single-send)

- [ ] POST to /api/workflows/pre-approval-email/start with valid contact_id + loan_id + org_id
- [ ] Confirm email appears in Resend dashboard within 60 seconds
- [ ] Confirm activity_log row with event_type='email.sent' was created
- [ ] Confirm workflow run appears in Vercel dashboard

## Web Lead Intake (purchase lead)

- [ ] Submit test lead via /get-preapproved with loan_goal=purchase
- [ ] Confirm contact upserted in Supabase with source_page populated
- [ ] Confirm activity_log row event_type='contact_created'
- [ ] Confirm alert email received at adam@styermortgage.com via Outlook
- [ ] Confirm confirmation email sent to test address via Outlook
- [ ] Confirm drip_enrollments row created for pa-welcome campaign
- [ ] If WORKFLOW_DEVKIT_LEAD_INTAKE=live: confirm paWelcomeNurture workflow started in Vercel

## PA Welcome Nurture (drip)

- [ ] Enroll test contact manually in pa-welcome campaign
- [ ] Trigger workflow with contact_id
- [ ] Confirm step 0 (day-0) email sent via Resend
- [ ] Confirm Resend webhook delivers email.delivered event within 5 min
- [ ] Confirm activity_log row event_type='email.delivered'
- [ ] Confirm workflow is sleeping (visible in Vercel Workflow dashboard)
- [ ] Set email_opt_out=true on test contact
- [ ] Advance clock via Vercel devtools (or wait for next natural wake) — confirm exit-rule fires and enrollment.status='completed'

## DPA Guide Nurture (drip)

- [ ] Same as PA Welcome steps above with dpa-guide campaign

## Resend Webhook (all events)

- [ ] Send test email via Resend
- [ ] Confirm webhook fires and appears in resend_webhook_events table
- [ ] Confirm idempotency: send same event_id twice — second insert is silently ignored
- [ ] Confirm invalid Svix signature returns 401

## Parity comparison (shadow mode, 7-day minimum)

- [ ] Pull n8n execution log for same 7-day window
- [ ] Pull workflow_shadow_log for same window
- [ ] Verify classification match ≥ 100% (no misclassified leads)
- [ ] Verify enrollment decision match ≥ 100% (same campaign chosen)
- [ ] Verify zero exit-rule discrepancies
- [ ] Confirm zero emails sent during shadow mode (n8n still owns sends)
- [ ] Sign off: Adam approves cutover
```

- [ ] **Step 2: Commit**

```bash
git add tests/workflows/smoke-checklist.md
git commit -m "docs(workflows): smoke checklist for Workflow DevKit cutover"
```

---

### Task 23: Cutover and kill-date tracking

This task is performed **after** the smoke checklist passes and Adam approves the parity review.

- [ ] **Step 1: Flip feature flag to live**

In Vercel dashboard: change `WORKFLOW_DEVKIT_LEAD_INTAKE` from `shadow` to `live`. Trigger a redeployment.

- [ ] **Step 2: Disable Mailchimp PA/DPA journeys**

In Mailchimp: pause or archive the PA Welcome and DPA Guide journeys. The general list add stays active. Resend/Workflow DevKit now owns drip content.

- [ ] **Step 3: Update styermortgage.com to stop calling n8n PA/DPA webhooks**

In `netlify/functions/subscribe-lead.js` (deprecated) and `lead-intake.js`: remove any remaining n8n webhook calls. Confirm LoanOS is the only downstream call.

- [ ] **Step 4: Record the kill date**

Calculate `kill_date = cutover_date + 61 days`.

Add to `DECISIONS.md`:

```
## n8n Phase 1 Kill Date

**Cutover date:** [DATE]
**Kill date:** [DATE + 61 days]

Workflows to archive on kill date:
- PiuIsQpBuydtFM4m — Web Lead Automation
- rwi3qEYgJKGGHkHc — PA Welcome Nurture
- 0M8Vnf6MhB1xtaIg — DPA Guide Nurture
- utMvZpkdRwIRZ51u — Pre-Approval Email

Archive via n8n MCP: mcp__n8n-mcp__archive_workflow for each ID.
```

- [ ] **Step 5: Set a calendar reminder for the kill date**

Use `mcp__Control_your_Mac__osascript` to create a calendar event on the kill date titled "Archive 4 n8n Phase 1 workflows" with the 4 workflow IDs in the notes.

- [ ] **Step 6: Final CONTEXT.md and CHANGELOG.md update + push**

Update `CONTEXT.md` with:
- Email automation dashboard live at `/admin/email-automation`
- `WORKFLOW_DEVKIT_LEAD_INTAKE=live`
- Kill date recorded
- n8n drain period active

```bash
npm run build
git add -A
git commit -m "feat(cutover): Workflow DevKit live — Phase 1 cutover complete, kill date set"
git push origin main
```

Watch deployment to `state: READY` via Vercel MCP.

---

## New Env Vars Required

Set these in Vercel dashboard before Phase C tests will pass in production:

| Var | Where to get |
|-----|-------------|
| `RESEND_WEBHOOK_SECRET` | Resend dashboard → Webhooks → Signing secret |
| `OUTLOOK_GRAPH_CLIENT_ID` | Azure AD app registration |
| `OUTLOOK_GRAPH_CLIENT_SECRET` | Azure AD app registration |
| `OUTLOOK_GRAPH_TENANT_ID` | Azure AD tenant settings |
| `OUTLOOK_SENDER_UPN` | adam@styermortgage.com (or actual Outlook UPN) |
| `WORKFLOW_DEVKIT_LEAD_INTAKE` | Start with `off`, then `shadow`, then `live` |
| `PA_WELCOME_CAMPAIGN_ID` | Supabase: `SELECT id FROM drip_campaigns WHERE name='PA Welcome Nurture'` |
| `DPA_GUIDE_CAMPAIGN_ID` | Supabase: `SELECT id FROM drip_campaigns WHERE name='DPA Guide Nurture'` |
| `RESEND_FROM_ADDRESS` | adam@styermortgage.com or verified Resend domain sender |

---

## Success Criteria Checklist

- [ ] All four n8n workflows archived by kill date with zero live traffic
- [ ] `/admin/email-automation` loads in under 2 seconds with 30 days of data
- [ ] Zero duplicate emails sent during cutover (Resend send log verified)
- [ ] Every new lead has `source_page`, `utm_params`, `referrer`, `form_name` populated
- [ ] Every email send produces `email.sent` activity_log entry
- [ ] Every Resend delivery/bounce produces `email.delivered`/`email.bounced` entry
- [ ] Shadow mode produces 100% parity for ≥ 7 consecutive days before flip
