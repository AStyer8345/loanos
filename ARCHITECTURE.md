# LoanOS — Architecture Reference

> Last updated: 2026-04-07 | Version 8.1.9

---

## 1. Overview

LoanOS is a mortgage intelligence platform — a CRM, automation hub, and AI assistant built specifically for loan officers. It replaces Jungo CRM, Mortgage Coach, and scattered Claude workflows. Built by Adam Styer for personal production use first, with a Phase 4 path to license to other LOs.

```
Arive (LOS) ──→ Zapier ──→ n8n ──→ Supabase DB
                                        │
                              Next.js App (Vercel)
                                        │
                          Anthropic Claude API (AI features)
```

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router, server components + client components) |
| Language | TypeScript |
| Database | Supabase (PostgreSQL + Row Level Security) |
| Auth | Supabase Auth — email/password, session via `@supabase/ssr` |
| Storage | Supabase Storage (bucket: `documents`) |
| Styling | Tailwind CSS 3, IBM Plex Mono font, gold accent `#C9A84C` |
| Charts | Recharts |
| Drag-and-drop | @dnd-kit (contacts table column reorder) + @hello-pangea/dnd (kanban) |
| PDF parsing | CSV: PapaParse | XML: custom MISMO 3.4 regex parser |
| AI | Anthropic SDK (`@anthropic-ai/sdk`) — model `claude-sonnet-4-5` |
| Automation | n8n (instance: styer.app.n8n.cloud) |
| Email | Microsoft Outlook via Graph API (OAuth 2.0) + Mailchimp |
| Hosting | Vercel (auto-deploys on `git push origin main`) |
| Testing | Vitest |

---

## 3. Folder Structure

```
loanos-clone/
├── src/
│   ├── app/
│   │   ├── api/                    # Next.js API routes (server-only)
│   │   │   ├── agents/             # AI agent endpoints (webhook-auth via X-Agent-Secret)
│   │   │   │   ├── cd-extraction/  # Claude extracts CD fields from PDF → updates loans
│   │   │   │   ├── daily-briefing/ # Morning briefing generation
│   │   │   │   ├── milestone/      # n8n calls this after status changes
│   │   │   │   └── pa-extraction/  # Claude extracts pre-approval fields
│   │   │   ├── arive-webhook/      # Inbound webhook from Zapier/Arive → upsert loan
│   │   │   ├── automations/        # Refi intake email trigger
│   │   │   ├── chat/               # AI chat (streaming, Claude)
│   │   │   ├── contacts/           # Bulk actions, quick-add, activity
│   │   │   ├── email-drafts/       # Log email drafts (called by n8n)
│   │   │   ├── import/             # CSV parse + import for loans/contacts
│   │   │   ├── marketing/          # Newsletter generate/publish, social log, Mailchimp
│   │   │   ├── mismo/              # MISMO 3.4 XML parse
│   │   │   ├── outlook-*/          # Microsoft Graph OAuth flow (6 routes)
│   │   │   ├── outreach/           # Outreach actions
│   │   │   ├── pipeline/stats/     # KPI aggregates for dashboard
│   │   │   ├── scenarios/          # Scenario calculator, PDF, narrative, save, share
│   │   │   ├── settings/           # API key connection tests
│   │   │   ├── share/[token]/      # Public shareable scenario links
│   │   │   └── todos/              # CRUD for todo_items
│   │   ├── auth/callback/          # Supabase OAuth callback
│   │   ├── dashboard/
│   │   │   ├── page.tsx            # Main pipeline dashboard (KPIs, stage cards, charts)
│   │   │   ├── layout.tsx          # Shared dashboard shell + TopNav
│   │   │   ├── loans/              # Loan list + detail ([id])
│   │   │   ├── contacts/           # Contact list + detail ([id], by-name/[name])
│   │   │   ├── scenarios/          # Scenario builder + history + detail ([id])
│   │   │   ├── marketing/          # Marketing hub + sub-pages (social, rate-updates, content)
│   │   │   ├── reports/            # Commission + volume reports
│   │   │   ├── automations/        # 8 n8n automation triggers
│   │   │   ├── briefing/           # Daily AI briefing
│   │   │   ├── emails/unmatched/   # Inbound email review + link-to-contact
│   │   │   ├── settings/           # API keys, Outlook OAuth, Mailchimp
│   │   │   ├── performance/        # Performance analytics
│   │   │   ├── referral/[name]/    # Referral partner view
│   │   │   ├── build-tracker/      # iframe → /docs/loanos.html
│   │   │   ├── system-map/         # iframe → /docs/loanos-system-map.html
│   │   │   └── upload/             # Doc upload
│   │   ├── share/[token]/          # Public scenario share page (no auth)
│   │   └── page.tsx                # Root → redirects to /dashboard
│   ├── components/                 # Shared UI components
│   │   ├── TopNav.tsx
│   │   ├── GlobalSearch.tsx        # ⌘K palette, searches contacts + loans
│   │   ├── ActivityFeed.tsx        # Bell icon slide-out panel
│   │   ├── ActivityTimeline.tsx    # Reusable timeline UI
│   │   ├── EmailDraftPreview.tsx
│   │   ├── SmartActionQueue.tsx
│   │   └── dashboard/
│   │       └── DailyScheduleWidget.tsx
│   ├── lib/
│   │   ├── supabase/               # Supabase client factories (browser, server, service, middleware)
│   │   ├── getOrganization.ts      # Server helper — returns {organizationId, role, userId}
│   │   ├── auth/validateAgentSecret.ts  # Validates X-Agent-Secret on agent routes
│   │   ├── constants/loan-stages.ts     # Single source of truth for all stage keys/labels
│   │   ├── stageNormalization.ts        # Maps raw Arive status strings → canonical stages
│   │   ├── scoreLoans.ts               # Loan scoring algorithm
│   │   ├── formatters.ts
│   │   ├── logEmail.ts
│   │   ├── updateLastTouch.ts          # Updates contact.last_touch_at + activity_log
│   │   ├── chat-command-parser.ts
│   │   ├── native-app-links.ts
│   │   └── marketing/schedule.ts       # MCC schedule constants (shared server+client)
│   └── middleware.ts               # Supabase session refresh on every request
├── supabase/
│   └── migrations/                 # 031 migrations — see Section 5
├── n8n/                            # n8n workflow JSON backups
├── n8n-workflows/                  # Additional workflow backups
├── docs/                           # Setup guides
├── tasks/                          # Audit reports + todo tracking
└── automations/                    # Zapier/n8n workflow templates
```

---

## 4. Authentication & Session

- **Provider**: Supabase Auth (email/password)
- **Session management**: `@supabase/ssr` — cookies set/refreshed in `src/middleware.ts` on every request
- **Middleware matcher**: all routes EXCEPT `_next/static`, images, `api/agents/*`, and `api/marketing/log-social-post` (those use `X-Webhook-Secret` or `Authorization: Bearer` header auth)
- **Agent route auth**: `src/lib/auth/validateAgentSecret.ts` checks `Authorization: Bearer <LOANOS_AGENT_SECRET>`
- **Supabase clients**:
  - `createClient()` — browser-side, uses cookies
  - `createClient()` (server) — server components, reads cookies
  - `createServiceClient()` — uses service role key, bypasses RLS (n8n/agent writes only)

---

## 5. Database Schema

**Supabase project**: `uuqedsvjlkeszrbwzizl`

### Core Tables

| Table | Purpose | Key columns |
|-------|---------|-------------|
| `organizations` | Tenant record | `id`, `name`, `slug` |
| `profiles` | 1-to-1 with `auth.users` | `id` (FK auth.users), `organization_id`, `role` (owner/admin/member) |
| `contacts` | Borrowers, realtors, other | `id`, `user_id`, `organization_id`, `contact_type`, `stage`, `last_touch_at` |
| `loans` | Full loan pipeline (200+ columns after migrations) | `id`, `user_id`, `organization_id`, `contact_id`, `status`, `loan_amount`, `arive_loan_id`, all Arive fields, contract fields, key dates |
| `activity_log` | Immutable audit log | `id`, `user_id`, `organization_id`, `loan_id`, `contact_id`, `action`, `type`, `summary`, `metadata JSONB`, `occurred_at` |
| `documents` | File metadata (actual files in Storage) | `id`, `user_id`, `loan_id`, `contact_id`, `file_path`, `mime_type` |
| `email_drafts` | Outbound email drafts generated by n8n | `id`, `user_id`, `loan_id`, `contact_id`, `subject`, `body_html`, `status` (pending/sent/discarded) |
| `todo_items` | In-app task list | `id`, `user_id`, `organization_id`, `title`, `urgent`, `completed` |
| `scenarios` | Mortgage scenario builder saves | `id`, `user_id`, `loan_id`, `mode`, `inputs JSONB`, `results_data JSONB`, `share_token`, `expires_at` |
| `chat_sessions` | AI chat history | `id`, `user_id`, `messages JSONB` |
| `outlook_tokens` | Microsoft Graph OAuth tokens | `id`, `user_id`, `access_token`, `refresh_token`, `expires_at` |
| `user_settings` | Per-user settings (API keys, Mailchimp, etc.) | `id`, `user_id`, `settings JSONB` |
| `mcc_state` | Marketing Command Center state blob | `id`, `user_id`, `state JSONB` |
| `loan_status_history` | Timestamped status changes | `id`, `loan_id`, `old_status`, `new_status`, `changed_at` |

### RLS Model (post-migration 031)

All tables use **org-scoped RLS** via two PostgreSQL helper functions (both `SECURITY DEFINER` to avoid recursion):

```sql
get_my_organization_id()  -- returns profiles.organization_id for auth.uid()
get_my_role()             -- returns profiles.role for auth.uid()
```

**Policy pattern**:
- SELECT/INSERT/UPDATE → any `organization_id = get_my_organization_id()`
- DELETE → `get_my_role() IN ('owner', 'admin')` only
- `activity_log` → SELECT + INSERT only (immutable audit log; no UPDATE/DELETE ever)
- Service role bypasses all RLS (used by n8n and agent routes)

### Triggers

| Trigger | Table | Effect |
|---------|-------|--------|
| `update_updated_at` | contacts, loans, others | Sets `updated_at = NOW()` on every UPDATE |
| `sync_contact_stage_from_loan` | loans | Updates `contacts.stage` when `loans.status` changes |
| `loans_update_contact_last_touch` | loans | Updates `contacts.last_touch_at` on any loan UPDATE |

---

## 6. Data Flow

### Arive → LoanOS (live loans)
```
New loan in Arive
  → Zapier (native Arive OAuth trigger)
  → POST to n8n webhook (WF1: 1tagvoU0UXtdDiMY)
  → n8n upserts contact + loan in Supabase (service role)
  → DB trigger fires → contact.stage + last_touch_at updated
  → LoanOS UI reads via Supabase
```

### Status update
```
Loan status changes in Arive
  → Zapier
  → n8n WF2 (9JyzzwKac8v3uQ7d)
  → UPDATE loans SET status = ... + INSERT loan_status_history
  → n8n WF3 Milestone Agent (1hjOmS7inZcxEJQr)
  → POST /api/agents/milestone (validates Bearer token)
  → Claude API → draft milestone email
  → INSERT email_drafts
```

### User action (UI)
```
User clicks action in LoanOS
  → Next.js Server Component or Client fetch to /api/...
  → Supabase query (user-scoped via RLS or getOrganization())
  → Optional: trigger n8n webhook
  → Optional: call Claude API
  → Response renders in UI
```

### Contract automation
```
Contract PDF received
  → Upload to Supabase Storage
  → pg_net trigger fires → n8n webhook
  → n8n sends PDF to Claude API
  → Claude extracts fields → n8n updates loans table
  → n8n calls Outlook Graph API → creates email drafts
```

---

## 7. n8n Workflow Inventory

| Workflow | ID | Status | Trigger |
|----------|----|---------|----|
| Arive New Loan → Supabase | `1tagvoU0UXtdDiMY` | ✅ Live | Zapier webhook |
| Arive Status Update → Supabase | `9JyzzwKac8v3uQ7d` | ✅ Live | Zapier webhook |
| Milestone Communication Agent | `1hjOmS7inZcxEJQr` | ✅ Live | LoanOS `/api/agents/milestone` |
| Referral Intro Email | `YbgDnTpPdefcazKy` | ✅ Live | LoanOS UI |
| Pre-Approval Email | `utMvZpkdRwIRZ51u` | ✅ Live | LoanOS UI |
| Final CD Email | `SkzrWeR0bHZs8kWX` | Untested | LoanOS UI |
| New Application Received | `cWESnXXy9UOLB13q` | Untested | LoanOS UI |
| Refi Intake Email | `yCTydQ7RfZK4DyUg` | Untested | LoanOS UI |
| Contract Received | `UfNcdpoVKQZqy0fj` | Phase 2 | Supabase pg_net trigger |
| Outlook Email Sync | `JMmstRl2C5ylmuIY` | Needs env vars | Schedule (5 min) |
| Inbound Email → Supabase Log | `qgb99Eh2ziy0INMk` | Deployed inactive | Schedule (5 min) |
| Weekly Social Post | `eJG4wckrj6SmSpm1` | Fixed, inactive | Manual / Schedule |

---

## 8. API Route Map

### Agent routes (Bearer token auth)
| Route | Called by | Purpose |
|-------|-----------|---------|
| `POST /api/agents/milestone` | n8n WF3 | Draft milestone email via Claude |
| `POST /api/agents/cd-extraction` | n8n | Extract CD fields from PDF → update loan |
| `POST /api/agents/pa-extraction` | n8n | Extract PA fields from PDF → update loan |
| `POST /api/agents/daily-briefing` | Schedule | Generate morning briefing |

### Data / CRUD
| Route | Purpose |
|-------|---------|
| `POST /api/arive-webhook` | Inbound Arive sync (Zapier → n8n → here) |
| `GET/POST /api/todos` | Todo CRUD |
| `PATCH/DELETE /api/todos/[id]` | Todo item ops |
| `POST /api/email-drafts` | Log email draft (called by n8n) |
| `GET /api/pipeline/stats` | KPI aggregates |
| `POST /api/contacts/quick-add` | Quick-add contact |
| `POST /api/contacts/bulk-action` | Bulk status update / delete |
| `GET /api/contacts/[id]/activity` | Activity feed for contact |

### Import
| Route | Purpose |
|-------|---------|
| `POST /api/import/parse` | Parse CSV file |
| `POST /api/import/loans` | Import loans from CSV |
| `POST /api/import/contacts` | Import contacts from CSV |
| `POST /api/mismo/parse` | Parse MISMO 3.4 XML |

### Scenarios
| Route | Purpose |
|-------|---------|
| `POST /api/scenarios/calculate` | Run scenario math |
| `POST /api/scenarios/generate-narrative` | Claude AI narrative (SSE streaming) |
| `POST /api/scenarios/generate-pdf` | Render PDF |
| `POST /api/scenarios/save` | Save scenario to DB |
| `GET /api/share/[token]` | Public share page data |
| `POST /api/scenarios/parse-statement` | Claude extracts fields from mortgage statement PDF |

### Marketing
| Route | Purpose |
|-------|---------|
| `POST /api/marketing/generate-newsletter` | Claude drafts newsletter HTML |
| `POST /api/marketing/publish-newsletter` | Push to website |
| `POST /api/marketing/send-mailchimp` | Send via Mailchimp API |
| `POST /api/marketing/log-social-post` | n8n logs social post (webhook-auth) |
| `POST /api/marketing/run-testimonials` | Trigger n8n testimonial workflow |

### Outlook OAuth
| Route | Purpose |
|-------|---------|
| `GET /api/outlook-auth` | Initiate OAuth flow |
| `GET /api/outlook-callback` | OAuth callback, store tokens |
| `GET /api/outlook-status` | Check connection status |
| `POST /api/outlook-sync` | Manually sync emails |
| `POST /api/outlook-refresh` | Refresh access token |
| `POST /api/outlook-disconnect` | Revoke and delete tokens |

---

## 9. External Integrations

| Service | How connected | Auth |
|---------|--------------|------|
| **Arive** | Zapier OAuth trigger → n8n webhook → Supabase | Zapier native OAuth |
| **Microsoft Outlook** | Microsoft Graph API | OAuth 2.0, tokens in `outlook_tokens` table |
| **Anthropic Claude** | Direct API calls from Next.js routes + n8n | `ANTHROPIC_API_KEY` env var |
| **n8n** | HTTP webhooks (inbound) + REST API (outbound management) | `X-Webhook-Secret` / n8n API key |
| **Mailchimp** | REST API from marketing routes | API key stored in `user_settings` |
| **Salesforce/Jungo** | Zapier-mediated (legacy, being replaced) | Zapier credentials |

---

## 10. Environment Variables

| Variable | Used in | Notes |
|----------|---------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | All Supabase clients | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser Supabase client | Public |
| `SUPABASE_SERVICE_ROLE_KEY` | Service client (server-only) | Secret |
| `ANTHROPIC_API_KEY` | All Claude API calls | Secret |
| `LOANOS_AGENT_SECRET` | Agent route auth validation | Secret |
| `NEXT_PUBLIC_N8N_WEBHOOK_BASE` | n8n webhook URLs in UI | Public |
| `AZURE_CLIENT_ID` | Outlook OAuth | Secret |
| `AZURE_CLIENT_SECRET` | Outlook OAuth | Secret |
| `AZURE_TENANT_ID` | Outlook OAuth | Secret |
| `ZAPIER_DISPATCH_WEBHOOK_URL` | Milestone agent → Zapier | Secret |
| `DISPATCH_SECRET` | Milestone agent auth | Secret |

---

## 11. Multi-Tenancy

- `organizations` table with `slug` for subdomain routing
- `profiles` table — 1:1 with `auth.users`, holds `organization_id` + `role`
- `organization_id` on all core tables (loans, contacts, activity_log, documents, email_drafts, scenarios, todo_items, contact_activity, chat_sessions) with NOT NULL constraints (migration 053)
- Org-scoped RLS policies on all tables via `get_my_organization_id()` + `get_my_role()` (SECURITY DEFINER)
- `getOrganization()` server helper in `src/lib/getOrganization.ts`
- Role hierarchy: owner/admin = full CRUD | member = no DELETE
- `system_admins` table + `requireAdmin()` middleware gate on `/api/admin/*`
- Multi-tenant Arive webhook: `/api/webhooks/los/arive/[org_slug]` with 3-layer verification (slug + hashed secret + payload allowlist)
- Remaining gaps tracked in `tasks/security-hardening-critical-gaps.md`

---

## 12. Design System

- **Background palette**: `#060b18` (deepest) → `#0f172a` → `#1e293b` → `#334155`
- **Accent**: Gold `#C9A84C`
- **Font**: IBM Plex Mono (monospace throughout)
- **Icons**: Lucide React
- **UI pattern**: Bloomberg terminal × modern SaaS — dark surfaces, gold highlights, monospace numbers
