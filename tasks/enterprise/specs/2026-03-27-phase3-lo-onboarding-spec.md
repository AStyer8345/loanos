# Phase 3 — LO Onboarding Flow: Architecture Spec
Date: 2026-03-27
Author: Enterprise PM Session
Status: READY TO BUILD (no external dependencies)

---

## Overview

After an LO signs up and creates their org (current `/onboarding` page), they land on the dashboard with no data, no connections, and no context. This spec defines a **Getting Started wizard** that appears on first login and guides the LO through 4 steps to achieve first value within 10 minutes.

**Problem:** The current flow dumps an LO into an empty dashboard after org creation. There's no guidance, no default data, and no clear next step.

**Goal:** LO sees real value (AI email preview or existing contact data) within 10 minutes of signup.

---

## Architecture Decision: Post-Onboarding Wizard (Not Extend Onboarding Page)

**Decision:** Build a separate `/dashboard/getting-started` page that appears on first login after org creation.

**Why NOT extend the current onboarding page:**
- Current `/onboarding` already captures required fields cleanly. Don't add complexity there.
- Steps like CSV import require dashboard context (authenticated session + org).
- The wizard should be dismissible and resumable from the dashboard.

**Why a separate Getting Started page:**
- Tracked in `org_settings.onboarding_completed` (boolean) — when false, show banner/redirect.
- LO can skip steps and return later from a "Getting Started" card on the dashboard.
- Each step completion is tracked independently in `org_settings`.

---

## Database Changes

### Migration 060 — org_settings onboarding tracking columns

File: `supabase/migrations/060_org_settings_onboarding_tracking.sql`

```sql
-- Add onboarding progress tracking to org_settings
ALTER TABLE org_settings
  ADD COLUMN IF NOT EXISTS onboarding_completed   BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_step        INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS setup_arive_done       BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS setup_import_done      BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS setup_automations_done BOOLEAN NOT NULL DEFAULT false;
```

**No RLS changes needed** — `org_settings` already has org-scoped RLS.

---

## The 4-Step Wizard

### Step 0: Welcome (Always shown, no action required)
- Shows LO's name, org name, and plan
- Displays key features they now have access to
- "Next: Connect Your LOS" button

### Step 1: Connect LOS (Arive Webhook)
**Goal:** Get the LO's Arive webhook URL so n8n WF1/WF2 can receive loan events.

**UI:** Show two pieces of info:
1. "Your Webhook URL" — display the tenant-scoped n8n URL with copy button
2. Step-by-step instructions: "In Arive, go to Settings → Integrations → Webhooks → paste this URL"

**Webhook URL format:**
```
https://styer.app.n8n.cloud/webhook/arive-new-loan
```
(No org_id param needed — n8n WF1 already handles org scoping via authenticated Supabase session)

**On complete:** Set `org_settings.setup_arive_done = true` via API. Show green checkmark.

**Skip behavior:** "I don't use Arive — skip" → marks done, shows info about other LOS options (future).

### Step 2: Import Contacts (CSV)
**Goal:** Get existing borrower/realtor contacts into LoanOS.

**UI:**
- "Upload your contacts CSV" — file picker
- Preview table: shows first 5 rows, maps detected columns
- Import button with progress: "Importing 142 contacts..."
- Result: "127 imported, 15 duplicates skipped"

**Backend:** New API route `/api/contacts/csv-import` that:
1. Parses CSV (use `papaparse` package)
2. Deduplicates on `email` (normalized lowercase)
3. Batch inserts into `contacts` table with `organization_id`
4. Returns `{ imported, duplicates, errors }` count

**CSV field mapping (auto-detect these column names):**
| CSV Header | LoanOS Field |
|------------|-------------|
| first_name, First Name, firstname | first_name |
| last_name, Last Name, lastname | last_name |
| email, Email, email_address | email |
| phone, Phone, mobile | phone |
| type, contact_type, Type | type (borrower/realtor/other) |
| company, Company, brokerage | company |
| nmls, NMLS, nmls_number | nmls_number |

**On complete:** Set `org_settings.setup_import_done = true`. Show count of contacts now in system.

**Skip behavior:** "I'll add contacts manually" → marks done.

### Step 3: Review Automations
**Goal:** LO understands what n8n workflows will run automatically.

**UI:** List of active workflows with toggle (read-only for now — toggles in Phase 4):
- ✅ Pre-Approval Email — sends when Arive status hits "Pre-Approved"
- ✅ Final CD Email — sends when Arive status hits "CD Issued"
- ✅ Referral Intro Email — available from loan detail page
- ✅ Web Lead Automation — fires when new lead submits website form
- ✅ Daily Briefing — sent every morning with pipeline summary

**No backend change** — this is informational only for now. Set `org_settings.setup_automations_done = true` on "Looks good" click.

### Step 4: You're Ready (Completion)
- Show summary: "You have X contacts, Y automations active"
- "Go to Dashboard" button → sets `org_settings.onboarding_completed = true`
- Confetti animation (optional)

---

## Files to Create/Modify

### New Files

**`src/app/dashboard/getting-started/page.tsx`**
- Server Component wrapper
- Reads `org_settings` to determine current step
- Renders `<GettingStartedWizard>` client component

**`src/app/dashboard/getting-started/components/GettingStartedWizard.tsx`**
- `'use client'`
- Step state managed locally (0-4)
- `currentStep` initialized from `org_settings.onboarding_step`
- Calls `/api/onboarding/step` to persist step completion

**`src/app/api/onboarding/step/route.ts`** (POST)
- Body: `{ step: 'arive' | 'import' | 'automations' | 'complete' }`
- Updates `org_settings` via service client
- Returns `{ success: true }`

**`src/app/api/contacts/csv-import/route.ts`** (POST)
- Body: `FormData` with `file` field (CSV)
- Parses with `papaparse`
- Deduplicates on email
- Returns `{ imported, duplicates, errors }`

### Modified Files

**`src/middleware.ts`** (or `proxy.ts`)
- Add redirect: if user has `organization_id` AND `org_settings.onboarding_completed = false` AND path is `/dashboard` (root only, not sub-pages) → redirect to `/dashboard/getting-started`
- This is a ONE-TIME redirect — once dismissed or completed, never shows again
- Implementation: middleware reads `org_settings` from Supabase — use server client

**`src/app/dashboard/page.tsx`** (Dashboard home)
- Add "Getting Started" banner if `onboarding_completed = false`
- Banner: "3 steps left to complete your setup → Resume setup"
- Banner disappears when `onboarding_completed = true`

### Package to Install
```bash
npm install papaparse @types/papaparse
```

---

## Step-by-Step Build Sequence

### Session 1 (60 min): Foundation
1. Apply migration 060 (Supabase MCP)
2. Install papaparse
3. Create `/api/onboarding/step/route.ts`
4. Create `/api/contacts/csv-import/route.ts`

### Session 2 (90 min): Wizard UI
1. Create `GettingStartedWizard.tsx` component (all 4 steps)
2. Create `getting-started/page.tsx` server wrapper
3. Add middleware redirect for first-time users
4. Add dashboard banner

### Session 3 (30 min): QA + Polish
1. Run build — fix any TypeScript errors
2. Test wizard flow end-to-end (manual with Supabase MCP to reset state)
3. Verify CSV import handles edge cases: empty rows, missing email, malformed CSV
4. Verify middleware redirect only fires once

---

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| CSV import with 1000+ contacts causes timeout | MEDIUM | Chunk in batches of 100, return progress |
| Middleware redirect breaks existing dashboard navigation | HIGH | Only trigger on `/dashboard` root, never sub-paths. Check onboarding_completed flag, not step. |
| papaparse adds bundle weight | LOW | Import server-side only in API route, not client bundle |
| Webhook URL changes break existing tenants | MEDIUM | Use env var `ARIVE_WEBHOOK_BASE_URL` so URL is configurable |
| LO skips all steps then wonders why no data appears | LOW | Dashboard banner persists until explicitly dismissed |

---

## Open Questions (for Adam)

1. **Arive webhook URL** — does the current n8n WF1 webhook URL work without an org_id param? Or does each tenant need their own webhook? (Current assumption: single shared webhook, org scoping happens via Supabase auth inside n8n. Verify before building Step 1 UI.)

2. **CSV import scope** — should this import only contacts, or also loans? (Recommendation: contacts only for MVP. Loan import from Arive will flow via webhooks.)

3. **Trial period** — should new Professional plan signups get a 14-day trial before requiring payment? (Recommendation: yes, but deferred to after Stripe is set up.)

---

## Definition of Done

- [ ] Migration 060 applied and verified
- [ ] `/api/onboarding/step` updates org_settings correctly
- [ ] `/api/contacts/csv-import` handles basic CSV, deduplicates on email, batch inserts
- [ ] Getting Started wizard renders all 4 steps with correct step state persistence
- [ ] Middleware redirects first-time users to `/dashboard/getting-started`
- [ ] Dashboard banner shows/hides based on `onboarding_completed`
- [ ] `npm run build` passes with 0 TypeScript errors
- [ ] End-to-end tested: new org creation → wizard appears → steps complete → banner gone

---

## Session Priority

This spec is READY TO BUILD. No external dependencies (unlike Stripe billing which needs Adam's env vars).

**Recommended sequence:** Build this spec BEFORE Stripe billing sessions. It delivers immediate value to new LO signups and can ship independently.
