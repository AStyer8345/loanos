# LoanOS

Mortgage loan pipeline management system for Adam Styer | Mortgage Solutions LP.

**Stack:** Next.js 14 (App Router) · Supabase (auth + DB + storage) · Tailwind CSS · Netlify

---

## Getting Started

```bash
cp .env.local.example .env.local
# Fill in all values in .env.local

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

See `.env.local.example` for all required variables with explanations.

| Variable | Where used |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Next.js app (browser) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Next.js app (browser) |
| `SUPABASE_URL` | Netlify functions |
| `SUPABASE_SERVICE_ROLE_KEY` | Netlify functions (bypasses RLS) |
| `ARIVE_WEBHOOK_SECRET` | Netlify function + n8n + Arive config |
| `LOANOS_SYSTEM_USER_ID` | Netlify functions (system record ownership) |
| `ZAPIER_OUTLOOK_WEBHOOK_URL` | n8n arive-to-supabase workflow |
| `LOANOS_ALERT_EMAIL` | n8n arive-to-supabase workflow |
| `LOANOS_NETLIFY_URL` | n8n arive-to-supabase workflow |

Set all vars in Netlify → Site settings → Environment variables for production.

---

## Arive Webhook Setup

Eliminates the Salesforce middleman. Data flows: **Arive → n8n → Netlify function → Supabase**.

### Architecture

```
Arive (loan event)
  └─► n8n: arive-to-supabase workflow
        └─► POST /.netlify/functions/arive-webhook
              ├─► upsert contacts (on email)
              ├─► upsert loans (on arive_loan_id)
              ├─► insert activity_log
              └─► 200 { success, contact_id, loan_id }
        └─► IF not 200 → Outlook alert via Zapier + respond 500 (Arive retries)
```

### Step 1 — Generate a shared secret

```bash
openssl rand -hex 32
```

Save this as `ARIVE_WEBHOOK_SECRET` in `.env.local`, Netlify env vars, and n8n environment variables.

### Step 2 — Deploy to Netlify

Push to `main`. The `netlify.toml` `[functions]` block routes `/.netlify/functions/arive-webhook` automatically.

Confirm deployment in Netlify dashboard → Functions tab: `arive-webhook` should appear.

### Step 3 — Import n8n workflow

1. Open [n8n](https://styer.app.n8n.cloud)
2. Import `n8n/workflows/arive-to-supabase.json`
3. Set n8n environment variables:
   - `ARIVE_WEBHOOK_SECRET` — shared secret from Step 1
   - `LOANOS_NETLIFY_URL` — your Netlify site URL (no trailing slash)
   - `LOANOS_ALERT_EMAIL` — email address for failure alerts
   - `ZAPIER_OUTLOOK_WEBHOOK_URL` — your Zapier Outlook webhook URL
4. Configure credentials in n8n:
   - **Arive Webhook Secret** — Header Auth credential, header name `X-Webhook-Secret`, value = the secret
5. Activate the workflow
6. Copy the webhook URL (path: `arive-sync`)

### Step 4 — Configure Arive

In Arive → Settings → Webhooks, add the n8n webhook URL from Step 3 with:
- Secret header name: `X-Webhook-Secret`
- Secret value: your shared secret

### Step 5 — Create a system user

The Netlify function writes records as a system user (bypasses RLS via service role key, but still needs a valid `user_id`).

1. In Supabase → Authentication → Users, create a user: `system@loanos.internal`
2. Copy the UUID
3. Set `LOANOS_SYSTEM_USER_ID` to that UUID in `.env.local` and Netlify env vars

### Step 6 — Run integration tests

```bash
# Test Netlify function directly (fastest)
NETLIFY_URL=https://your-site.netlify.app \
ARIVE_WEBHOOK_SECRET=your-secret \
node scripts/test-webhooks.js --netlify

# Test full n8n → Netlify pipeline
N8N_WEBHOOK_BASE_URL=https://styer.app.n8n.cloud/webhook \
ARIVE_WEBHOOK_SECRET=your-secret \
node scripts/test-webhooks.js --n8n
```

Both tests send a new-loan payload then a status-update payload. Confirm records appear in Supabase → `contacts`, `loans`, and `activity_log` tables.

### Migration from Zapier pipeline

1. Run both pipelines in parallel (old Zapier + new Arive → n8n) for 2–3 loan events
2. Compare Supabase records against Salesforce records
3. Once data matches, disable the Zapier Zap

---

## n8n Workflows

| File | Path | Purpose |
|---|---|---|
| `workflow-1-new-loan.json` | `arive-new-loan` | Legacy: direct Supabase upserts via n8n (kept for reference) |
| `workflow-2-status-update.json` | `arive-status-update` | Legacy: status update via n8n |
| `arive-to-supabase.json` | `arive-sync` | **Current:** thin orchestrator → Netlify function |

---

## Netlify Functions

| Function | Path |
|---|---|
| `arive-webhook.js` | `/.netlify/functions/arive-webhook` |

---

## Database Migrations

Migrations live in `supabase/migrations/` and run in order. Key migrations:

| File | Purpose |
|---|---|
| `001_initial_schema.sql` | Core tables |
| `007_arive_integration.sql` | Arive sync columns: `arive_loan_id`, `first_payment_date`, `est_closing_date`, `funding_date`, `sales_contract_date`, `raw_payload`, contact address fields |
