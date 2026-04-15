# Email Automation Dashboard + Workflow DevKit Migration — Design Spec

**Date:** 2026-04-15
**Status:** Approved design, ready for implementation plan
**Owner:** Adam Styer
**Companion doc:** [2026-04-15-n8n-migration-inventory.md](./2026-04-15-n8n-migration-inventory.md)

---

## 1. Purpose

Two outcomes in one project:

1. **Visibility.** A single dashboard in LoanOS that surfaces every lead-capture and email-automation signal across `styermortgage.com`, n8n, Resend, and Outlook — so Adam can see the whole funnel at a glance.
2. **Simplification.** Migrate four n8n workflows to Vercel Workflow DevKit + DurableAgent. Decision logic moves from visual n8n nodes into versioned TypeScript, durably executed on Vercel.

The dashboard consumes the migrated workflows. The migrated workflows are the first step of a broader n8n consolidation (Phase 2 — separate spec).

## 2. Scope

### In scope

- New page at `/admin/email-automation` (6 panels)
- New API route `/api/resend-webhook` (receives delivery/bounce/complaint events from Resend, signature-verified)
- Supabase migration `086_email_automation.sql`:
  - Add `source_page`, `form_name`, `utm_params`, `referrer` to `contacts`
  - Normalize `activity_log.event_type` to dotted form for email events (`email.sent`, `email.delivered`, `email.bounced`, `email.complained`, `email.opened`, `email.clicked`)
  - Create `resend_webhook_events` table for idempotency
- Four Workflow DevKit workflows replacing four n8n workflows (list in §7)
- Hidden-field instrumentation on `styermortgage.com` forms that lack UTM/referrer/page_url
- Unified ingress path: all web lead forms route through one code path with identical downstream behavior

### Out of scope

- Salesforce removal (separate project, chip spawned 2026-04-15)
- Phase 2 n8n migration — the other ~25 workflows (see [migration inventory](./2026-04-15-n8n-migration-inventory.md))
- New UI libraries (use existing shadcn/ui + Tailwind)
- Multi-tenant variant of this dashboard (Phase 3 after LO #2 onboarding)
- Changes to Arive, iMessage, Outlook polling, or social-posting workflows

## 3. Architecture

### Current state

```
styermortgage.com
  ├── /get-preapproved, /refinance-quote
  │     └── Netlify Function subscribe-lead.js
  │           ├── Mailchimp (tag + journey)
  │           ├── n8n PA Welcome Nurture webhook (Resend drip)
  │           ├── n8n DPA Guide Nurture webhook (Resend drip)
  │           └── LoanOS /api/contacts/web-lead
  │
  └── /, /contact, suburb pages
        └── Netlify native forms
              └── n8n Web Lead Automation (Outlook alert + confirmation + LoanOS push)
```

Two ingress paths, different behavior per lead source. Drip logic scattered across n8n visual nodes. No durable state — an n8n restart mid-drip is recoverable only via n8n's own retry settings.

### Target state

```
styermortgage.com (all forms unified)
  └── Netlify Function /.netlify/functions/lead-intake
        ├── [preserved] Mailchimp general list add (no journey)
        └── LoanOS /api/contacts/web-lead
              └── start(webLeadIntakeWorkflow)  ← Vercel Workflow DevKit
                    ├── step: enrichContact (persist source_page, utm_params, referrer)
                    ├── step: alertAdam via Outlook
                    ├── step: sendConfirmation via Outlook
                    ├── DurableAgent: classify → pa-welcome | dpa-guide | generic
                    ├── step: enrollInDripCampaign (insert drip_enrollments row)
                    └── start(paWelcomeNurture | dpaGuideNurture) as child workflow

paWelcomeNurture (60 days, 6 Resend sends)
dpaGuideNurture (52 days, 8 Resend sends)
preApprovalEmail (manual trigger from loan page)

Resend
  └── POST /api/resend-webhook (signature-verified)
        ├── dedup via resend_webhook_events.event_id
        ├── write activity_log (event_type='email.*')
        └── resumeHook(token, event) → wakes drip workflow for delivery confirmation
```

**Key separation preserved:** Outlook for personal/transactional (Adam alerts, immediate lead confirmation), Resend for marketing nurture. Deliverability and recipient perception are different; the split is intentional.

## 4. Data model

### Migration 086: `086_email_automation.sql`

```sql
-- Lead origin tracking — columns on contacts, not new table
ALTER TABLE contacts ADD COLUMN source_page TEXT;
ALTER TABLE contacts ADD COLUMN form_name TEXT;
ALTER TABLE contacts ADD COLUMN utm_params JSONB;
ALTER TABLE contacts ADD COLUMN referrer TEXT;
CREATE INDEX idx_contacts_source_page ON contacts(source_page) WHERE source_page IS NOT NULL;
CREATE INDEX idx_contacts_utm_source ON contacts((utm_params->>'source')) WHERE utm_params IS NOT NULL;
CREATE INDEX idx_contacts_created_at ON contacts(created_at DESC);

-- Event taxonomy normalization — forward-only, preserves history
-- Existing 'email_sent' rows migrated; all new email events dotted
UPDATE activity_log SET event_type = 'email.sent' WHERE event_type = 'email_sent';

-- Resend webhook idempotency
CREATE TABLE resend_webhook_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  enrollment_id UUID REFERENCES drip_enrollments(id) ON DELETE SET NULL,
  payload JSONB NOT NULL
);
CREATE INDEX idx_resend_webhook_events_contact ON resend_webhook_events(contact_id);
CREATE INDEX idx_resend_webhook_events_received ON resend_webhook_events(received_at DESC);
```

### Tables NOT created

| Spec's original ask | Why not |
|---|---|
| `drip_enrollments` (new table) | Exists already (migration 071). Has richer schema than proposed. |
| `leads` (new table) | Web leads land in `contacts` with `activity_log.action='contact_created'`. |
| `step_log` JSONB on enrollments | `drip_sends` table (migration 071) already provides per-step timeline as queryable joined rows. Bounded row growth, indexable. Adding JSONB would re-implement worse. |
| `sequence_name` column on enrollments | Join `drip_campaigns.name`. |

### Canonical event_type taxonomy (email)

Going forward, all email-related `activity_log` entries use these values:

| Value | Emitted by |
|---|---|
| `email.sent` | Workflow DevKit steps after Resend/Outlook accepts the send |
| `email.delivered` | Resend webhook (delivered event) |
| `email.bounced` | Resend webhook (bounced event) |
| `email.complained` | Resend webhook (complained event) |
| `email.opened` | Resend webhook (opened event — requires open tracking enabled per send) |
| `email.clicked` | Resend webhook (clicked event — requires click tracking enabled per send) |
| `email.received` | Existing — Outlook polling (no change) |

Dashboard filters use `event_type IN (...)` or `event_type LIKE 'email.%'` — both work.

## 5. The dashboard — `/admin/email-automation`

### Access control

```ts
// src/app/admin/email-automation/layout.tsx
import { requireAdmin } from '@/lib/admin/auth'

export default async function Layout({ children }: { children: React.ReactNode }) {
  const { error } = await requireAdmin()
  if (error) return error
  return <>{children}</>
}
```

Uses the established `system_admins` table gate. Not a session-claim check. Matches the `/admin/*` pattern used by waitlist, tenants, backfill routes.

### Panels

| # | Panel | Source | Component path |
|---|---|---|---|
| 1 | Workflow Status | n8n API (GET /workflows?active=true) + Workflow DevKit runs API | `components/email-automation/WorkflowStatusPanel.tsx` |
| 2 | Email Send Log | `activity_log` via `/api/activity` (PII decrypts server-side) | `components/email-automation/EmailSendLog.tsx` |
| 3 | Active Drips | `drip_enrollments` JOIN `contacts` JOIN `drip_campaigns` JOIN `drip_steps` | `components/email-automation/ActiveDripsTable.tsx` |
| 4 | Lead Source Breakdown | **Reuse existing `LeadSourceChart` from dashboard v6.1** — no new component | (reuse) |
| 5 | Lead Origin Table | `contacts` with new columns, 30-day default | `components/email-automation/LeadOriginTable.tsx` |
| 6 | Drip Detail Drawer | Click-to-expand on Panel 3 row; shows `drip_steps` + `drip_sends` timeline | `components/email-automation/DripDetailDrawer.tsx` |

**Panel 1 drill-down:** Clicking a workflow opens a side drawer with last 5 runs. For n8n: last 5 executions via n8n API. For Workflow DevKit: last 5 runs with status + step-level timeline + failure detail. **No CLI required.**

**Panel 3 summary row:** Total Enrolled | Active | Completed This Month | Failed — one aggregate query.

**Panel 4 reuse note:** Confirm `LeadSourceChart`'s data source covers the "last 30 days, all lead sources including web form" shape during implementation. If scope differs, extend the component rather than forking.

### PII boundary

Email addresses in Panel 2 come through `GET /api/activity` which decrypts from `activity_log_pii` (migration 083, AES-256-GCM). **Never hit `activity_log` with raw Supabase queries from this page.** Pattern match: existing activity timeline on loan/contact detail pages.

### Data loading

All panels load via React Server Components. No client-side `useEffect` fetching. Date-range filters use URL search params + server-side parse. Matches existing LoanOS pattern.

## 6. Resend webhook receiver

### Route: `/api/resend-webhook` (POST)

```ts
// Signature verification via RESEND_WEBHOOK_SECRET + Svix header
// See https://resend.com/docs/dashboard/webhooks/introduction
// Idempotency via resend_webhook_events.event_id

// Handle event types:
// - email.sent, email.delivered, email.bounced, email.complained,
//   email.opened, email.clicked, email.delivery_delayed
//
// On each event:
// 1. Verify signature (Svix)
// 2. Insert into resend_webhook_events (ON CONFLICT DO NOTHING)
// 3. Write activity_log with event_type mapped to dotted form
// 4. If webhook contains { enrollment_id, step_order } in metadata →
//    resumeHook(`drip-${enrollment_id}-step-${step_order}`, event)
```

### Env vars

- `RESEND_API_KEY` — already required for sends
- `RESEND_WEBHOOK_SECRET` — **new**. Set in Resend dashboard, pasted into Vercel env
- `OUTLOOK_GRAPH_CLIENT_ID` / `OUTLOOK_GRAPH_CLIENT_SECRET` / `OUTLOOK_GRAPH_TENANT_ID` — **new**. Microsoft Graph API creds for Outlook sends from Workflow DevKit (replaces n8n Outlook node credential)

### Rate limiting

Reuse existing rate-limit middleware (pattern from `/api/contacts/web-lead` — 30/min). Adjust to 300/min for webhook bursts during Resend provider incidents.

## 7. Workflow DevKit migration — the four workflows

All four use `"use workflow"` orchestration + `"use step"` for I/O. `DurableAgent` used only where Claude decision-making adds value (lead classification, skip-if-condition checks).

### 7.1 `workflows/web-lead-intake.ts`

**Replaces:** n8n `PiuIsQpBuydtFM4m` Web Lead Automation
**Ingress:** POST from Netlify `lead-intake.js` (unified function) → `/api/contacts/web-lead` → `start(webLeadIntakeWorkflow, [payload])`

```ts
"use workflow"
export async function webLeadIntakeWorkflow(payload: WebLeadPayload) {
  const contact = await upsertContact(payload)           // "use step"
  await writeActivity(contact.id, 'contact_created')     // "use step"
  await alertAdamViaOutlook(contact, payload)            // "use step"
  if (contact.email) {
    await sendConfirmationViaOutlook(contact)            // "use step"
  }
  const classification = await classifyLead(payload)     // DurableAgent → 'pa' | 'dpa' | 'generic'
  if (classification === 'pa')  await start(paWelcomeNurture, [contact.id])
  if (classification === 'dpa') await start(dpaGuideNurture, [contact.id])
}
```

**DurableAgent prompt** reads `loan_goal`, `purchase_price`, `credit_score`, `situation` and returns `'pa' | 'dpa' | 'generic'`. Fallback: explicit `campaignMap` (preserved from n8n Parse Form Data code node) if agent is unavailable.

### 7.2 `workflows/pa-welcome-nurture.ts`

**Replaces:** n8n `rwi3qEYgJKGGHkHc` PA Welcome Nurture (6 emails / 60 days)
**Ingress:** Called from `webLeadIntakeWorkflow` as child

```ts
"use workflow"
export async function paWelcomeNurture(contactId: string) {
  const enrollment = await enroll(contactId, 'pa-welcome')  // "use step"
  const schedule = [0, 3, 7, 14, 30, 60]  // days
  for (let i = 0; i < schedule.length; i++) {
    if (i > 0) await sleep(`${schedule[i] - schedule[i-1]}d`)
    const shouldExit = await checkExitRules(enrollment.id)  // "use step"
    if (shouldExit) return updateEnrollment(enrollment.id, 'completed_early')
    const { subject, body } = await composeEmail(enrollment, i)  // DurableAgent
    const sendId = await sendViaResend({ to: enrollment.email, subject, body, metadata: { enrollment_id: enrollment.id, step_order: i } })
    await writeActivity(enrollment.id, 'email.sent')
    const hook = createHook({ token: `drip-${enrollment.id}-step-${i}` })
    await Promise.race([hook, sleep('24h')])  // proceed even if Resend webhook lost
  }
}
```

**Exit rules** (enumerated):
1. `contacts.email_opt_out = true`
2. Prior step bounced hard (`email.bounced` with category=permanent)
3. Complaint received (`email.complained`)
4. Contact stage changed to `Application` or later (they've moved on)
5. Enrollment manually paused/removed (`drip_enrollments.status != 'active'`)

### 7.3 `workflows/dpa-guide-nurture.ts`

**Replaces:** n8n `0M8Vnf6MhB1xtaIg` DPA Guide Nurture (8 emails / 52 days)

Same pattern as 7.2, different schedule: `[0, 2, 5, 10, 17, 25, 38, 52]`, different content templates, same exit rules.

### 7.4 `workflows/pre-approval-email.ts`

**Replaces:** n8n `utMvZpkdRwIRZ51u` Pre-Approval Email
**Ingress:** Manual trigger from LoanOS loan detail page → `/api/workflows/pre-approval-email/start`

Single-shot workflow, no sleep, no child workflows. Porting primarily to unify the email-send path — all Workflow DevKit workflows emit the same `email.sent` activity_log entries, which Panel 2 consumes uniformly.

### Testing

Each workflow gets:
- Unit tests on individual `"use step"` functions (Vitest, no plugin — `"use step"` is a no-op without compiler)
- Integration test with `@workflow/vitest` for sleep/hook/retry paths
- Smoke test checklist in `tests/workflows/smoke-checklist.md`

## 8. Ingress unification — `styermortgage.com`

### Today (split)

- `/get-preapproved` + `/refinance-quote` → `subscribe-lead.js` Netlify Function (Mailchimp + n8n PA/DPA + LoanOS)
- `/`, `/contact`, suburb pages → Netlify native forms → n8n `web-lead` webhook (Outlook + LoanOS)

### Target (unified)

One Netlify Function: `netlify/functions/lead-intake.js`. All forms POST to it. It does:

1. Honeypot check (preserve bot-field logic from current n8n Parse Form Data node)
2. Field normalization (preserve first_name/first-name fallbacks, loan_goal → loan_type remap)
3. Mailchimp general list add + tag (keep general list, **kill PA/DPA journey** — Workflow DevKit owns drip content)
4. POST to LoanOS `/api/contacts/web-lead` with UTM + page_url + referrer + form_name
5. Return 200 (response mode: onReceived — same as n8n today)

LoanOS `/api/contacts/web-lead` becomes the single ingress. It:

1. Bearer-token auth (existing `LOANOS_AGENT_SECRET`)
2. Upsert contact (existing dedup logic)
3. Persist UTM/page_url/form_name/referrer (new)
4. `start(webLeadIntakeWorkflow, [payload])` — Workflow DevKit takes over

### Hidden field instrumentation

Forms on `styermortgage.com` that currently lack UTM/page_url/referrer get these five hidden inputs added:

```html
<input type="hidden" name="utm_source">
<input type="hidden" name="utm_medium">
<input type="hidden" name="utm_campaign">
<input type="hidden" name="page_url">
<input type="hidden" name="referrer">
```

Forms already instrumented (`/get-preapproved`, `/refinance-quote`): no change.

Forms needing instrumentation: `/` hero-quick-form, `/` quick-contact, `/contact` form-contact, suburb pages. Inventory completed during implementation plan.

**Note on `form_id`:** Original spec asked for a new `form_id` hidden field. Netlify already provides `form-name` (already in every form). Adding `form_id` is duplicate. LoanOS maps `form_name` → internal form identifier.

### Shared JS: `assets/utm.js`

Auto-populates UTM + page_url + referrer on page load. Single file, included site-wide. Already exists in partial form — extend to cover all pages.

## 9. Cutover plan (lock-in)

| Stage | Duration | Gate |
|---|---|---|
| 0. Build | ~2 weeks | All 4 workflows + dashboard + migration shipped to prod, feature-flag `WORKFLOW_DEVKIT_LEAD_INTAKE=off` |
| 1. Shadow mode | **Min 14 days** | Flag toggled to `shadow`. Workflow DevKit runs on every web lead, but **does not send emails or enroll in drips**. It writes to a shadow log table. n8n continues to handle live sends. |
| 2. Parity review | As needed | Compare shadow log against n8n executions over a 7-day window. **Parity definition:** for every n8n execution, a corresponding Workflow DevKit run exists with identical (a) lead classification (`pa` / `dpa` / `generic`), (b) enrollment decision (enrolled vs skipped + which campaign), (c) count of emails that *would* have been sent, (d) exit-rule outcomes (if any step bailed early, Workflow DevKit bails at the same step for the same reason). Any discrepancy fixed before proceeding. |
| 3. Cutover | 1 day | Flag flipped to `live`. New enrollments route to Workflow DevKit. `subscribe-lead.js` and `lead-intake.js` updated to stop calling n8n PA/DPA nurture webhooks. Mailchimp PA/DPA journey disabled. |
| 4. Drain | 60 days (longest PA Welcome sequence) | In-flight n8n enrollments continue and finish on n8n. No new enrollments to n8n. |
| 5. **Kill date** | Day 61 post-cutover | **Four n8n workflows archived:** Web Lead Automation, PA Welcome Nurture, DPA Guide Nurture, Pre-Approval Email. Archived workflows remain readable for audit but no triggers fire. |

**Kill date is hard.** No indefinite parallel running. If Stage 2 parity review fails, fix + re-extend shadow — don't let n8n linger out of caution.

## 10. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Double-sends during cutover | Shadow mode (Stage 1) is send-disabled by design. Live flip (Stage 3) is atomic flag toggle with opt-in ramp if needed. |
| In-flight n8n enrollments stranded | Finish on n8n. Drain stage (60 days). Documented abandonment — Adam approved. |
| Resend webhook spoofing | Svix signature verification. Idempotency via `event_id`. |
| Outlook Graph token expiry | Refresh token flow in Workflow DevKit step. Fall back to Microsoft Graph daemon credential if user-delegated fails. |
| Workflow DevKit store cost | Vercel-managed store for Phase 1. Ballpark estimate: ~1800 active durable runs/quarter × storage cost ≈ low $10s/mo. Revisit at LO #2 onboarding. |
| Deliverability degradation (Resend sender reputation) | Same account, same domain. Shadow mode = zero send volume change. |
| `LeadSourceChart` reuse doesn't fit | Extend, don't fork. Existing component is small. |
| Admin-only today but LO #2 needs visibility | Scope to `system_admins` for Phase 1. Add tenant-admin variant in Phase 3. Documented in §11. |

## 11. Open decisions deferred to implementation

1. **Workflow DevKit store — Vercel-managed vs self-hosted on Supabase Postgres.** Recommendation: Vercel-managed for speed. Revisit at scale. No blocker for spec.
2. **n8n → LoanOS handoff auth.** Use existing `LOANOS_AGENT_SECRET` or new scoped `WORKFLOW_TRIGGER_SECRET`. Recommendation: new scoped token (least privilege). No blocker for spec.
3. **Open/click tracking default.** Resend requires explicit enable per send. Recommendation: enable for all nurture emails, disable for transactional (alert, confirmation) — same as industry default.
4. **Tenant-admin variant.** Phase 3, post-LO #2. Out of scope here.

## 12. Deliverables

### Files created

- `supabase/migrations/086_email_automation.sql`
- `src/app/admin/email-automation/layout.tsx`
- `src/app/admin/email-automation/page.tsx`
- `src/app/api/resend-webhook/route.ts`
- `src/app/api/workflows/pre-approval-email/start/route.ts`
- `src/components/email-automation/WorkflowStatusPanel.tsx`
- `src/components/email-automation/EmailSendLog.tsx`
- `src/components/email-automation/ActiveDripsTable.tsx`
- `src/components/email-automation/LeadOriginTable.tsx`
- `src/components/email-automation/DripDetailDrawer.tsx`
- `src/workflows/web-lead-intake.ts`
- `src/workflows/pa-welcome-nurture.ts`
- `src/workflows/dpa-guide-nurture.ts`
- `src/workflows/pre-approval-email.ts`
- `src/lib/resend/verify.ts` (Svix signature verification)
- `src/lib/outlook/graph.ts` (Microsoft Graph client)
- `tests/workflows/*.integration.test.ts` (one per workflow)
- `tests/workflows/smoke-checklist.md`

### Files modified

- `src/app/api/contacts/web-lead/route.ts` — persist UTM + page_url + form_name + referrer; call `start(webLeadIntakeWorkflow)`
- `src/middleware.ts` — ensure `/admin/email-automation` is covered by existing admin gate
- `package.json` — add `workflow`, `@workflow/ai`, `@workflow/next`, `@microsoft/microsoft-graph-client`

### styermortgage.com (separate repo)

- `netlify/functions/lead-intake.js` — new unified ingress
- `netlify/functions/subscribe-lead.js` — deprecated, delete after Stage 3
- Hidden field additions on `/`, `/contact`, suburb pages
- `assets/utm.js` — extend to cover all pages

### Env vars (Vercel)

- `RESEND_WEBHOOK_SECRET` (new)
- `OUTLOOK_GRAPH_CLIENT_ID` (new)
- `OUTLOOK_GRAPH_CLIENT_SECRET` (new)
- `OUTLOOK_GRAPH_TENANT_ID` (new)
- `WORKFLOW_TRIGGER_SECRET` (new, optional — see §11)

### Docs

- `CONTEXT.md` — update with shipped feature summary
- `CHANGELOG.md` — append implementation entries
- `DECISIONS.md` — add three entries: Workflow DevKit over Agent SDK/Managed Agents; Outlook-for-transactional/Resend-for-marketing split; in-flight drain over re-enrollment
- [2026-04-15-n8n-migration-inventory.md](./2026-04-15-n8n-migration-inventory.md) — Phase 2 roadmap

## 13. Success criteria

- All four n8n workflows archived by kill date with zero live traffic
- `/admin/email-automation` loads in under 2 seconds with 30 days of data
- Zero duplicate emails sent during cutover (verified via Resend send log dedup check)
- Every new lead has `source_page`, `utm_params`, `referrer`, `form_name` populated
- Every email send produces `email.sent` activity, every delivery/bounce produces corresponding `email.delivered` / `email.bounced`
- Shadow mode produces 100% parity with n8n for ≥7 consecutive days before flip

## 14. References

- Workflow DevKit docs: `node_modules/workflow/docs/`, https://useworkflow.dev
- Resend webhooks: https://resend.com/docs/dashboard/webhooks/introduction
- Svix signature verification: https://docs.svix.com/receiving/verifying-payloads/how
- Existing drip schema: `supabase/migrations/071_drip_campaigns_tables.sql`
- Existing admin gate: `src/lib/admin/auth.ts`
- PII encryption boundary: `src/app/api/activity/route.ts` (decrypt path)
- Current n8n Web Lead Automation body: workflow `PiuIsQpBuydtFM4m`
- Dashboard v6.1 LeadSourceChart (reuse target): to be located during implementation — grep `LeadSourceChart`
