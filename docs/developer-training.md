# LoanOS — Developer Onboarding & Technical Training Guide
**Version 1.0 | March 2026 | Confidential**

---

## Section 1 — What Is LoanOS?

LoanOS is an AI-powered mortgage intelligence platform built by Adam Styer (Senior Loan Officer, NMLS #513013, Adam Styer | Mortgage Solutions LP, Austin TX). It's a private-label SaaS tool built first for personal production use, with Phase 4 plans to license it to other loan officers nationwide.

**LoanOS replaces three paid tools:**
- **Jungo CRM** (Salesforce overlay for mortgage) — replaced by LoanOS Contacts + Loans modules
- **Mortgage Coach** — replaced by LoanOS Calculator Suite (Phase 3)
- **Scattered Claude/Zapier workflows** — replaced by LoanOS Automations + n8n

**Current state:** Phase 1 complete, Phase 2 ~95% complete. The app is live in production on Vercel with 2,441 contacts and 816+ loans imported from Salesforce/Arive.

---

## Section 2 — Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router, TypeScript) |
| Styling | Tailwind CSS + custom CSS variables |
| Hosting | Vercel (auto-deploys on git push to main) |
| Database | Supabase (PostgreSQL with Row-Level Security) |
| Auth | Supabase email/password auth + SSR cookies |
| File Storage | Supabase Storage (buckets: `documents` [private], `social-assets` [public]) |
| Automation | n8n (styer.app.n8n.cloud) — replaces Zapier |
| AI | Claude API via `@anthropic-ai/sdk` (model: `claude-sonnet-4-5`) |
| Email | Microsoft Outlook via n8n + Microsoft Graph API |
| Marketing Email | Mailchimp |
| LOS Integration | Arive (webhook integration via n8n) |
| Version Control | GitHub (AStyer8345/loanos), branch: main |

> **CRITICAL — Claude model string:** Always `claude-sonnet-4-5`. No date suffix. Never `claude-sonnet-4-5-20251022` or `claude-sonnet-4-6`. Enforced across all n8n workflows and API routes.

---

## Section 3 — Local Development Setup

**Prerequisites:**
- Node.js 18+
- npm
- Git with SSH key configured (HTTPS clone will fail — no credential store)

**Clone & install:**
```bash
git clone git@github.com:AStyer8345/loanos.git loanos-clone
cd loanos-clone
npm install --include=dev
```

> Note: `NODE_ENV=production` in the shell skips devDependencies. Always use `--include=dev`.

**Environment variables:**
Copy `.env.local.example` to `.env.local` and fill in all values (see Section 8). Without real Supabase env vars, the dev server will compile but Supabase middleware will throw `Invalid supabaseUrl` — this is expected. The app requires real credentials to function.

**Start dev server:**
```bash
npm run dev
# runs on port 3000
```

**Branch strategy:** All work goes to `main`. No long-lived feature branches. Deploy on every push via Vercel.

---

## Section 4 — Project Structure

```
/src
  /app
    /dashboard              — All authenticated pages (App Router)
      /contacts             — CRM contacts list + record view
      /loans                — Loan pipeline list + loan detail
      /automations          — Automation trigger dashboard
      /briefing             — AI Daily Command Center
      /reports              — Volume + commission reports
      /marketing            — Marketing Command Center (8-tab)
      /calculator           — Scenario comparator + refi analyzer
      /emails               — Inbound email management
      /settings             — Outlook OAuth + app settings
    /api
      /arive-webhook        — Handles Arive LOS webhook events
      /agents               — AI agent endpoints (daily-briefing, milestone, cd-extraction, pa-extraction)
      /chat                 — LoanOS AI Chat (per-record Claude context)
      /contacts             — Contact CRUD + quick-add + bulk actions
      /outreach             — Claude-powered outreach email/text generation
      /email-drafts         — Log and retrieve Outlook draft records
      /outlook-status       — Outlook OAuth status check
      /outlook-disconnect   — Revoke Outlook OAuth tokens
  /components
    /crm                    — LoanOSChat, ContactRecordView, ActivityTimeline
    /outreach               — OutreachChat floating widget, OutreachChatContext
    /ui                     — Shared components (modals, badges, buttons)
  /lib
    /supabase               — client.ts (browser), server.ts (server), middleware.ts
    /constants              — loan-stages.ts (single source of truth for all stage logic)

/supabase/migrations        — Sequential SQL migrations (001–025)
/n8n                        — Exported n8n workflow JSON files
/docs                       — Setup guides (Azure OAuth, n8n agents, contract automation)
/scripts                    — Test scripts, backfill scripts
/automations                — Prompt files and README for automation workflows
```

---

## Section 5 — Database Schema (Key Tables)

All migrations live in `/supabase/migrations/` and run in order (001–025).

### contacts
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK → auth.users (RLS) |
| first_name, last_name | text | |
| email, phone | text | |
| stage | text | Lead \| Pre-Approved \| In Process \| Closed \| ... |
| type | text | borrower \| realtor \| other |
| realtor_name, realtor_email, realtor_phone | text | |
| last_touch_at | timestamptz | Updated on every activity |
| notes | text | Displayed as MM/DD/YYYY if ISO date string |

### loans
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| contact_id | uuid | FK → contacts |
| status | text | Raw Arive status strings |
| arive_loan_id | text | Unique per loan in Arive LOS |
| interest_rate, down_payment_pct, ltv | numeric | |
| estimated_closing_date, closing_date | date | |
| rate_lock_date | date | |
| rate_lock_days | integer | Lock expiry = rate_lock_date + rate_lock_days |
| commission | numeric | 1% of loan amount (editable) |
| raw_payload | jsonb | Full Arive webhook payload |

### activity_log
| Column | Type | Notes |
|--------|------|-------|
| type | text | note \| email \| phone \| text \| milestone \| system |
| summary | text | One-line description |
| external_id | text | Email dedup (internetMessageId) |
| needs_review | boolean | Unmatched inbound email flag |

### Other tables
- `email_drafts` — Outlook draft records logged by automations
- `chat_sessions` — Per-record Claude conversation history
- `loan_milestone_events` + `milestone_communications` — Arive milestone tracking
- `automation_logs` — Outcome log for all n8n runs
- `outlook_tokens` + `oauth_state` — Microsoft OAuth tokens

**Row-Level Security:** All tables enforce `user_id` isolation. Server-side routes use the Supabase service role client to bypass RLS when needed (e.g., system writes from n8n webhooks).

---

## Section 6 — Critical Code Patterns

These patterns must be followed exactly. Deviating causes hard-to-debug silent failures.

### 6.1 — Supabase Client Usage
```typescript
// Browser components:
import { createClient } from '@/lib/supabase/client'

// Server components / API routes:
import { createClient } from '@/lib/supabase/server'

// NEVER use bare createClient from '@supabase/supabase-js'
// It ignores auth cookies → RLS blocks all rows
```

### 6.2 — Supabase HTTP Requests (from n8n or external)
Both headers are required on every request:
```
apikey: <service_role_key>
Authorization: Bearer <service_role_key>
```
Using only `apikey` returns 400. This is the most common gotcha.

### 6.3 — Supabase Storage URLs
```
https://<project>.supabase.co/storage/v1/object/authenticated/documents/{{ file_path }}
```
- `documents.file_path` stores paths WITHOUT the bucket prefix
- Missing `/authenticated/` → 400 error
- Missing `/documents/` → "Bucket not found" error

### 6.4 — n8n Webhook Body Access
```javascript
// In Webhook node: body is at $json.body
// In ALL downstream code nodes, reference WITHOUT .body:

const webhook = $('Webhook').first().json;     // NOT .json.body
const body = $input.first().json;               // NOT .json.body
```

### 6.5 — n8n HTTP Request Body Format (JSON POST/PATCH)
```json
{
  "sendBody": true,
  "contentType": "raw",
  "rawContentType": "application/json",
  "body": "={{ JSON.stringify({ field: value, updated_at: new Date().toISOString() }) }}"
}
```
> NEVER use `specifyBody: "string"` — it sends JSON as a URL-encoded form key, which breaks Supabase silently.

### 6.6 — Claude API Calls in n8n
```
Credential: SlNsEedAOCoo6NwH (Header Auth account 2) — sends x-api-key automatically
Model: claude-sonnet-4-5 — NO date suffix ever
Response extraction: $json.content[0].text
```

### 6.7 — Binary PDF Extraction in n8n Code Nodes
```javascript
const binaryKey = Object.keys($input.item.binary)[0];
const pdfBuffer = await this.helpers.getBinaryDataBuffer(0, binaryKey);
const base64Pdf = pdfBuffer.toString('base64');
```

### 6.8 — Loan Stage Constants
Single source of truth: `src/lib/constants/loan-stages.ts`

Never hardcode stage strings anywhere else. Key exports:
- `STAGE_ORDER` (ordered array)
- `normalizeToStageKey()` — maps raw Arive status → canonical key
- `hasReachedStage()` — checks position in pipeline
- `STAGE_LABELS` — display names

### 6.9 — Git & SSH
```bash
# Always SSH, never HTTPS:
git clone git@github.com:AStyer8345/loanos.git

# Deploy:
git push origin main  # Vercel auto-deploys
```

---

## Section 7 — n8n Workflow Architecture

LoanOS uses n8n (styer.app.n8n.cloud) as its automation backbone. All workflows are exported as JSON in `/n8n/workflows/`.

### Active Workflows

| Workflow | ID | Trigger |
|----------|----|----|
| Arive → Supabase (New Loan) | `1tagvoU0UXtdDiMY` | Arive new loan event |
| Arive Status Update → Supabase | `9JyzzwKac8v3uQ7d` | Arive status change |
| Loan Milestone Communication | `1hjOmS7inZcxEJQr` | `/api/agents/milestone` POST |
| Referral Intro Email | `YbgDnTpPdefcazKy` | Manual trigger |
| Pre-Approval Email | `utMvZpkdRwIRZ51u` | Upload PA letter PDF |
| Final CD Email | `SkzrWeR0bHZs8kWX` | Upload CD PDF |
| Refi Intake Email | `yCTydQ7RfZK4DyUg` | Upload IFW PDF |
| New Application Received | `cWESnXXy9UOLB13q` | 1003 PDF upload |
| Inbound Email Sync | `qgb99Eh2ziy0INMk` | Polls Outlook every 5 min |

### Inactive (needs credentials)

| Workflow | ID | Blocker |
|----------|----|----|
| Review Request Email | `AK1fBcaX1cPcdlGx` | Needs Outlook credential |
| Weekly Social Post | `eJG4wckrj6SmSpm1` | Needs Gemini API key + Google Sheets OAuth |

### Data Flow Pattern
```
External event (Arive/Outlook)
  → n8n webhook
    → Code nodes (transform/extract)
      → Claude API (if AI needed)
        → Supabase HTTP (upsert/log)
          → Outlook draft (via Zapier webhook or Microsoft Graph)
```

---

## Section 8 — Environment Variables

Set in Vercel dashboard (Project ID: `prj_AmhlkvLIUzzlqpOtCrUy9PCyPiSx`):

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (public) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (public) |
| `SUPABASE_URL` | Supabase URL (server-side) |
| `SUPABASE_SERVICE_ROLE_KEY` | Bypasses RLS — server-only, never expose to browser |
| `ARIVE_WEBHOOK_SECRET` | Shared secret for Arive webhook validation |
| `ANTHROPIC_API_KEY` | Claude API key |
| `LOANOS_AGENT_SECRET` | Shared secret for n8n → `/api/agents/*` calls |
| `MILESTONE_WEBHOOK_SECRET` | Validates n8n → `/api/agents/milestone` calls |
| `ZAPIER_DISPATCH_WEBHOOK_URL` | Zapier → Outlook draft creation |
| `MICROSOFT_CLIENT_ID` | Azure app registration |
| `MICROSOFT_CLIENT_SECRET` | Azure app registration |
| `MICROSOFT_TENANT_ID` | Azure app registration |
| `MICROSOFT_REDIRECT_URI` | Vercel prod URL + `/api/outlook-callback` |
| `OUTLOOK_EMAIL` | adam@thestyerteam.com |
| `OUTLOOK_SYNC_SECRET` | Shared secret for n8n → `/api/outlook-sync` |
| `LOANOS_SYSTEM_USER_ID` | UUID of `system@loanos.internal` auth user |

**Supabase Project ID:** `uuqedsvjlkeszrbwzizl`

---

## Section 9 — Deployment Process

1. Make changes locally. Test with `npm run dev`.
2. Commit: `git add <specific files> && git commit -m "description"`
3. Push: `git push origin main`
4. Vercel auto-deploys in ~90 seconds.
5. Verify at Vercel dashboard or via MCP.

**Database migrations:**
Run new migrations in Supabase SQL Editor (Project: `uuqedsvjlkeszrbwzizl`). Migrations are numbered 001–025. Add new ones sequentially. Always test DDL in the SQL Editor before committing the `.sql` file.

**End-of-session rule — required every session:**
1. Update `CONTEXT.md` with everything changed
2. Update `CHANGELOG.md`
3. `git add`, `git commit`, `git push origin main`

---

## Section 10 — Phase Roadmap

### Phase 1 — Foundation ✅ Complete
Core schema, auth, PDF upload, dashboard, dark monochromatic UI theme

### Phase 2 — Automation (~95% complete)
Built & live: Contacts module, Loans module (816 imported), Arive webhook, 9 active n8n automations, Marketing Command Center (8-tab), AI Chat, Daily Briefing agent, Inbound Email sync, Outreach Chat widget, Loan Milestone Communication agent

**Still needs go-live steps:**
- Outlook OAuth activation (Azure app registration)
- `ANTHROPIC_API_KEY` in Vercel
- Migration 010 in Supabase SQL Editor

### Phase 3 — Calculator Suite (replaces Mortgage Coach) — in progress
- Built: Loan Scenario Comparator, Refi Analyzer
- Remaining: Rent vs. Buy, Total Cost of Homeownership, Max Purchase Price, Buy Now vs. Wait
- Key differentiator: Claude API generates plain-English narrative per scenario, output as branded PDF

### Phase 4 — SaaS (multi-tenant) — not started
Multi-tenant RLS, Stripe billing, white-label theming, onboarding flow, admin dashboard

---

## Section 11 — UI Design System

**Theme:** Dark monochromatic with gold accent

| Token | Value |
|-------|-------|
| Primary background | `#060b18` |
| Card background | `#0f172a` |
| Gold accent | `#C9A84C` (CSS var: `--gold`) |
| Text primary | white / slate-200 |
| Text secondary | zinc-400 / zinc-500 |

**Typography:**
- `IBM Plex Mono` — all data values, numbers, loan amounts, dates
- `Inter` — UI labels, navigation, body text

**Key UI patterns:**
- Inline editing: click a value to edit in place, Enter to save, Esc to cancel
- Sticky columns in tables (Name column always pinned at `left: 36px`)
- Gold scrollbars on overflow tables (6px, `#C9A84C44` track, gold thumb on hover)
- Rate lock expiry: yellow badge ≤5 days, red badge when expired
- All stage changes write to `activity_log` automatically

---

## Section 12 — First Tasks for a New Developer

### Day 1
- [ ] Clone repo, install dependencies, set up `.env.local`
- [ ] Read `CONTEXT.md` in full — updated every session, authoritative state of the codebase
- [ ] Read `CHANGELOG.md` — version history of every build
- [ ] Browse the live app (ask Adam for credentials)
- [ ] Run the dev server and verify it compiles

### Week 1
- [ ] Review `/supabase/migrations/` to understand the full schema evolution
- [ ] Trace one automation end-to-end: n8n webhook → Supabase → UI display
- [ ] Read `src/lib/constants/loan-stages.ts` — all stage logic lives here
- [ ] Review the active n8n workflows at styer.app.n8n.cloud
- [ ] Read the Section 6 code patterns until they're second nature

### Key contacts
- **Adam Styer** — product owner, subject matter expert (NMLS #513013)
- **Janie** — processor; coordinate before changing any automation email templates

---

*LoanOS is a living codebase. When in doubt, read CONTEXT.md — it's updated at the end of every dev session.*
