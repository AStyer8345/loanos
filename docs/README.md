# LoanOS

> AI-powered mortgage operations platform. Built by Adam Styer to replace manual processes and scale without adding headcount.

**Status:** Foundation live — March 8, 2026
**GitHub:** https://github.com/AStyer8345/loanos
**Deployed:** Netlify
**Operator:** Adam Styer | Mortgage Solutions LP · NMLS #513013 · Austin, TX

---

## What It Is

LoanOS is a private operations platform for Adam Styer's mortgage brokerage. It centralizes contacts, loans, documents, and automations into a single system — replacing the fragmented stack of Arive, Jungo, ShareFile, Zapier, and manual email workflows.

Not a SaaS. Not for public use. Built to eliminate the cost of an admin and free up time for high-value work.

**Who it's for:** One user (Adam). Possibly extended to Janie (processor) and realtors in Phase 3.

---

## Current Status

| Layer | Status |
|-------|--------|
| Next.js 14 app shell | ✅ Live |
| Supabase auth (magic link) | ✅ Live |
| Protected dashboard | ✅ Live |
| Database schema (4 tables) | ✅ Live |
| Supabase Storage bucket | ✅ Live |
| Netlify deployment | ✅ Live |
| GitHub repo | ✅ Live |
| Contacts module | 🔧 In Progress |
| Document intake | 🔧 In Progress |
| Pipeline view | 🔧 In Progress |
| Rate engine | 📋 Planned |
| Doc generator | 📋 Planned |
| Realtor portal | 📋 Planned |

---

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Next.js 14 (App Router) | TypeScript, `src/` directory |
| Styling | Tailwind CSS | |
| Auth | Supabase Auth | Magic link — no passwords |
| Database | Supabase Postgres | Row-level security on all tables |
| Storage | Supabase Storage | `documents` bucket |
| Realtime | Supabase Realtime | Pipeline status updates |
| Automation | n8n (self-hosted) | Replaces Zapier |
| AI | Anthropic Claude API | `claude-sonnet-4-6` |
| Deploy | Netlify | `@netlify/plugin-nextjs` v5 |
| Node | v20 | Set in `netlify.toml` |

---

## Project Structure

```
loanos/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout
│   │   ├── page.tsx                # Magic link login
│   │   ├── auth/
│   │   │   └── callback/route.ts  # Supabase auth callback
│   │   └── dashboard/
│   │       ├── page.tsx            # Protected dashboard
│   │       └── SignOutButton.tsx
│   ├── lib/
│   │   └── supabase/
│   │       ├── client.ts           # Browser client
│   │       ├── server.ts           # Server client (cookies)
│   │       └── middleware.ts       # Session refresh helper
│   └── middleware.ts               # Route protection
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  # Full schema
├── docs/
│   ├── README.md                   # This file
│   ├── loanos.html                 # Interactive build tracker
│   └── loanos-system-map.html      # Architecture diagram
├── public/
│   └── docs/                       # Auto-copied from /docs at build (Netlify)
├── .env.local                      # Local secrets (git-ignored)
├── .env.local.example              # Template (committed)
├── netlify.toml                    # Netlify config
└── next.config.ts
```

---

## Database Schema

Four tables, all with RLS enabled.

### `contacts`
Borrowers, realtors, vendors. Syncs with Salesforce and Outlook.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK → auth.users |
| full_name | text | |
| email | text | |
| phone | text | |
| contact_type | text | `borrower` / `realtor` / `vendor` |
| salesforce_id | text | External sync key |
| notes | text | |
| created_at | timestamptz | |

### `loans`
Active pipeline. One row per loan file.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK → auth.users |
| contact_id | uuid | FK → contacts |
| loan_number | text | Arive loan number |
| status | text | `application` / `processing` / `underwriting` / `approved` / `ctc` / `funded` |
| property_address | text | |
| loan_amount | numeric | |
| rate_lock_expiry | date | |
| close_date | date | Target COE |
| notes | text | |
| created_at | timestamptz | |

### `documents`
Files attached to loans. Stored in Supabase Storage `documents` bucket.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK → auth.users |
| loan_id | uuid | FK → loans |
| filename | text | Original filename |
| storage_path | text | Path in Storage bucket |
| doc_type | text | `income` / `id` / `bank` / `pa_letter` / `cd` / `other` |
| uploaded_by | text | `borrower` / `adam` / `system` |
| created_at | timestamptz | |

### `activity_log`
Immutable audit trail. All actions logged here.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK → auth.users |
| entity_type | text | `loan` / `contact` / `document` |
| entity_id | uuid | Referenced record |
| action | text | What happened |
| payload | jsonb | Full context |
| created_at | timestamptz | |

---

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in all values before running locally. Set the same vars in Netlify → Site settings → Environment variables.

| Variable | Scope | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase project API URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase anon/client key |
| `SUPABASE_SERVICE_ROLE_KEY` | Private | Full database access — server only |
| `SUPABASE_JWT_SECRET` | Private | Token verification |
| `ANTHROPIC_API_KEY` | Private | Claude API (`claude-sonnet-4-6`) |
| `N8N_WEBHOOK_URL` | Private | n8n automation trigger endpoint |
| `N8N_WEBHOOK_SECRET` | Private | HMAC signature verification |
| `MICROSOFT_CLIENT_ID` | Private | Azure AD app registration |
| `MICROSOFT_CLIENT_SECRET` | Private | Graph API OAuth secret |
| `MICROSOFT_TENANT_ID` | Private | M365 tenant ID |
| `SALESFORCE_CLIENT_ID` | Private | Connected app consumer key |
| `SALESFORCE_CLIENT_SECRET` | Private | Connected app OAuth secret |
| `SALESFORCE_USERNAME` | Private | API login |
| `MAILCHIMP_API_KEY` | Private | Mailchimp REST v3 |
| `MAILCHIMP_SERVER_PREFIX` | Private | e.g. `us14` — from API key suffix |
| `SHAREFILE_CLIENT_ID` | Private | ShareFile OAuth app |
| `SHAREFILE_CLIENT_SECRET` | Private | ShareFile OAuth secret |

---

## Existing Automations (styer-mortgage-site)

These are already running in the `styer-mortgage-site` repo before LoanOS existed.

| Feature | What It Does |
|---------|-------------|
| **MCC** | AI-generated mortgage content — blog posts, market updates, social captions |
| **Content Dashboard** | Internal admin for drafting and scheduling content |
| **Newsletter Generator** | Weekly email content → Mailchimp send |
| **Rate Publisher** | Manual rate entry → auto-publishes to website + email + social |
| **Social Poster** | Caption + image generation for Instagram and Facebook |
| **Dispatch Webhook** | Central n8n trigger — site events fire automations |
| **Netlify Functions** | Serverless backend — form logic, API proxies |
| **Netlify Blobs** | Key-value storage — rate history, newsletter archive, content cache |

---

## Migration Plan

| What | From | To | Phase |
|------|------|----|-------|
| Contacts | Jungo/Salesforce | LoanOS Contacts + DB | 1 |
| Documents | ShareFile (manual) | Supabase Storage + portal | 1 |
| Automations | Zapier | n8n + Claude | 1–2 |
| Pipeline | Manual Salesforce | LoanOS Pipeline | 2 |
| Rate publishing | Manual screenshot + email | LoanOS Rate Engine | 2 |
| Realtor comms | Email threads | LoanOS Realtor Portal | 3 |

---

## Phase Roadmap

### Phase 1 — Foundation (Current)
- [x] Next.js 14 app with auth
- [x] Supabase schema + storage
- [x] Netlify deployment
- [ ] Contacts module UI
- [ ] Document intake portal
- [ ] Pipeline list view
- [ ] n8n webhook integration

### Phase 2 — Automation
- [ ] Rate engine (pull from Arive, publish everywhere)
- [ ] Doc generator (PA letters, condition letters)
- [ ] Full pipeline dashboard with TRID alerts
- [ ] Salesforce bidirectional sync
- [ ] Outlook integration via Graph API

### Phase 3 — External
- [ ] Realtor portal (login, loan status, PA pulls)
- [ ] Borrower portal (doc upload, status tracking)
- [ ] Mobile-optimized views (PWA)

### Phase 4 — Scale
- [ ] Compliance engine (TRID timing, audit logs)
- [ ] Multi-user support (Janie / processor access)
- [ ] Native mobile app

---

## Local Development

```bash
# Install
npm install

# Run dev server
npm run dev

# Build
npm run build
```

Requires `.env.local` with at minimum `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to boot.

---

## Deployment

Deploys to Netlify automatically on push to `main`.

```toml
# netlify.toml
[build]
  command   = "cp -r docs public/docs && npm run build"
  publish   = ".next"
```

The build command copies the `/docs` folder into `public/docs` before building, making the HTML docs accessible at `/docs/loanos.html` and `/docs/loanos-system-map.html` on the Netlify URL.

---

## Docs URLs

After pushing to `main`:

| URL | File |
|-----|------|
| `[netlify-url]/docs/loanos.html` | Build tracker |
| `[netlify-url]/docs/loanos-system-map.html` | Architecture diagram |
| `https://astyer8345.github.io/loanos/loanos.html` | GitHub Pages build tracker |
| `https://astyer8345.github.io/loanos/loanos-system-map.html` | GitHub Pages system map |

---

*Adam Styer | Mortgage Solutions LP · NMLS #513013 · Austin, TX · Internal Use Only*
