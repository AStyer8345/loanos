# LoanOS Automation Audit — 2026-03-12

> **Goal:** Get every automation from "built but broken" to "live and running."  
> Fix in priority order — each item unblocks something downstream.

---

## PRIORITY FIX ORDER

| # | Fix | Unblocks |
|---|-----|----------|
| 1 | Add `ANTHROPIC_API_KEY` | AI Chat, Daily Briefing, Milestone emails |
| 2 | Add `DISPATCH_SECRET` + `ZAPIER_DISPATCH_WEBHOOK_URL` | Milestone emails push to Outlook |
| 3 | Verify Supabase migrations 008–013 | Prevents 500 errors on all routes |
| 4 | Register Azure AD app + set Microsoft OAuth vars | Outlook email sync |
| 5 | Activate n8n workflows | Live Arive webhook delivery |

---

## SECTION 1: ENV VAR AUDIT

### ✅ Confirmed Working

| Variable | Notes |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Set — real value |
| `SUPABASE_URL` | Set — real value |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Set — real value |
| `SUPABASE_SERVICE_ROLE_KEY` | Set — real value |
| `SUPABASE_SERVICE_KEY` | Set — real value (duplicate of above, used in some routes) |
| `N8N_WEBHOOK_BASE_URL` | Set |
| `ARIVE_WEBHOOK_SECRET` | Set — arive-webhook route is fully functional |
| `LOANOS_SYSTEM_USER_ID` | Set — UUID confirmed |
| `MICROSOFT_TENANT_ID` | Set to `common` (correct for multi-tenant) |
| `OUTLOOK_SYNC_WINDOW_MINUTES` | Set to `20` |

---

### ❌ Missing Entirely — Add These Now

#### 1. `ANTHROPIC_API_KEY` ← **DO THIS FIRST**

**Why it's critical:** The `Anthropic` client is instantiated at module load time in both `agents/milestone/route.ts` and `agents/daily-briefing/route.ts`. Without this key, the entire module crashes on import — the route returns 500 before any request logic runs. Also required for `/api/chat`.

**How to get it:**
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. API Keys → Create Key
3. Copy the `sk-ant-...` string

**How to add it (Vercel):**
1. Vercel Dashboard → loanos project → Settings → Environment Variables
2. Add: `ANTHROPIC_API_KEY` = `sk-ant-your-key-here`
3. Select: Production + Preview + Development
4. Save → Redeploy

---

#### 2. `DISPATCH_SECRET`

**Why it's critical:** Used in `agents/milestone/route.ts` as the `Authorization: Bearer` token when pushing email drafts to Zapier. Without it, the Zapier push is silently skipped (emails are generated but never reach Outlook).

**How to set it:** Generate any random string (32+ chars). Example:
```
openssl rand -hex 32
```

**How to add it (Vercel):**
Same flow as above. Add: `DISPATCH_SECRET` = your generated secret.

**Important:** This same value must be set as the expected Bearer token on your Zapier webhook Zap (in the Zap's Catch Hook → Filter/Auth step).

---

#### 3. `ZAPIER_DISPATCH_WEBHOOK_URL`

**Why it's critical:** The URL that `milestone/route.ts` POSTs to when pushing Outlook draft emails. Without it, email drafts are written to Supabase but never sent to Outlook.

**How to get it:**
1. Go to [zapier.com](https://zapier.com) → Create a new Zap
2. Trigger: **Webhooks by Zapier** → Catch Hook
3. Copy the webhook URL (format: `https://hooks.zapier.com/hooks/catch/XXXXX/YYYYY/`)
4. Action: **Microsoft Outlook** → Create Draft (or Send Email)
5. Map fields: `to` → recipient, `subject` → subject, `body` → body

**How to add it (Vercel):**
Add: `ZAPIER_DISPATCH_WEBHOOK_URL` = `https://hooks.zapier.com/hooks/catch/...`

---

### ⚠️ Placeholder Values — Must Replace

These are set but contain fake/template strings. Routes using them will fail at runtime.

#### 4. `MICROSOFT_CLIENT_ID`
- Current value: `"your-azure-app-client-id"`
- Requires: Azure AD app registration (see Section 4)

#### 5. `MICROSOFT_CLIENT_SECRET`
- Current value: `"your-azure-app-client-secret"`
- Requires: Azure AD app registration (see Section 4)

#### 6. `MICROSOFT_REDIRECT_URI`
- Current value: `"https://your-netlify-site.netlify.app/..."`
- Must be updated to your actual Vercel deployment URL
- Format: `https://loanos.vercel.app/api/auth/callback/microsoft` (adjust to your actual domain)

#### 7. `OUTLOOK_EMAIL`
- Current value: `"adam@yourdomain.com"`
- Set to: `adam@thestyerteam.com` (or whatever your actual Outlook address is)

#### 8. `OUTLOOK_SYNC_SECRET`
- Current value: `"change-me-to-a-random-secret"`
- This is the `x-sync-secret` header n8n must send when triggering `/api/outlook-sync`
- Generate: `openssl rand -hex 32`
- Must match the value configured in n8n's HTTP Request node for outlook-sync

---

## SECTION 2: SUPABASE MIGRATION VERIFICATION

Paste each query into **Supabase Dashboard → SQL Editor** to confirm the table exists.  
If a query returns rows, the migration is applied. If it errors or returns nothing, run the migration SQL.

### Migration 008 — Outlook OAuth tables

```sql
-- Check outlook_tokens table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'outlook_tokens'
ORDER BY ordinal_position;

-- Check oauth_state table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'oauth_state'
ORDER BY ordinal_position;

-- Check activity_log has new columns from 008
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'activity_log' 
  AND column_name IN ('type', 'summary', 'raw_payload', 'external_id');
```

---

### Migration 009 — AI Chat sessions

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'chat_sessions'
ORDER BY ordinal_position;
```

---

### Migration 010 — Milestone events + communications

```sql
-- Milestone events table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'loan_milestone_events'
ORDER BY ordinal_position;

-- Milestone communications table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'milestone_communications'
ORDER BY ordinal_position;

-- Check contacts has last_touch and contact_type columns
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'contacts' 
  AND column_name IN ('last_touch', 'contact_type');
```

---

### Migration 011 — Expanded loans columns

```sql
-- Check for a sample of the ~60 new Arive fields
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'loans' 
  AND column_name IN (
    'arive_loan_id', 'loan_program', 'loan_term', 'interest_rate', 
    'apr', 'points', 'down_payment', 'ltv', 'cltv',
    'property_county', 'occupancy_type', 'appraised_value',
    'front_end_dti', 'back_end_dti', 'monthly_debts',
    'referring_agent_name', 'referring_agent_email',
    'rate_lock_expiration', 'estimated_closing_date',
    'raw_payload', 'synced_at'
  );
-- Expect 20 rows if migration 011 is applied
```

---

### Migration 012 — Contacts additional fields

```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'contacts' 
  AND column_name IN ('address', 'mobile', 'notes', 'address_city', 'address_state', 'address_zip');
```

---

### Migration 013 — Email drafts table ← **CRITICAL**

```sql
-- logEmailDraft.ts writes to this table
-- If this table doesn't exist, milestone + pre-approval routes throw 500
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'email_drafts'
ORDER BY ordinal_position;
```

**Expected columns:** `id`, `automation_name`, `recipient_name`, `recipient_email`, `subject`, `body_html`, `body_preview`, `status`, `contact_id`, `loan_id`, `outlook_draft_id`, `created_at`

---

### Quick All-Tables Check

```sql
-- See all custom tables at once
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

Expected tables (at minimum): `activity_log`, `chat_sessions`, `contacts`, `email_drafts`, `loan_milestone_events`, `loans`, `milestone_communications`, `oauth_state`, `outlook_tokens`

---

## SECTION 3: N8N WORKFLOW CHECKLIST

URL: **styer.app.n8n.cloud**

Two workflows need to be verified: `arive-new-loan` and `arive-status-update`

### Step 1 — Confirm Workflows Exist

1. Log into n8n cloud
2. Left sidebar → Workflows
3. Look for both `arive-new-loan` and `arive-status-update`
4. If they don't exist, they need to be created (see workflow structure below)

### Step 2 — Confirm Activation

Each workflow has an **Active** toggle in the top-right corner of the editor.

- Grey toggle = **Inactive** — webhooks are NOT being received
- Blue/green toggle = **Active** — webhooks ARE live

**Action:** Click the toggle to activate each workflow if not already active.

### Step 3 — Verify Webhook URLs Match

In each workflow, click the **Webhook** trigger node and copy the **Production URL**.

It should look like:  
`https://styer.app.n8n.cloud/webhook/arive-new-loan`

This URL must be registered in Arive's webhook settings. Confirm:
1. Arive → Settings → Webhooks (or Integrations)
2. The webhook URL points to the n8n Production URL
3. The `X-Webhook-Secret` header is set to match `ARIVE_WEBHOOK_SECRET` in your `.env.local`

### Step 4 — Verify n8n → LoanOS Credentials

Each workflow's HTTP Request node (the one that POSTs to `/api/arive-webhook`) needs:

- **URL:** `https://your-loanos-domain.vercel.app/api/arive-webhook`
- **Header:** `X-Webhook-Secret: [value of ARIVE_WEBHOOK_SECRET from .env.local]`
- **Method:** POST
- **Body:** Pass-through of Arive webhook payload as JSON

### Step 5 — Test End-to-End

n8n has a built-in test runner. In the Webhook node:

1. Click **Listen for test event**
2. Manually trigger a test from Arive (or use the "Test" button if Arive supports it)
3. Watch the n8n execution log — each node should show green
4. Check Supabase: `SELECT * FROM loans ORDER BY created_at DESC LIMIT 5;` — new loan should appear

---

## SECTION 4: AUTOMATION STATUS SUMMARY

| Route | Status | Blocking Issue | Fix |
|-------|--------|----------------|-----|
| `/api/arive-webhook` | ✅ **Working** | None | None needed |
| `/api/agents/daily-briefing` | ❌ **Broken** | `ANTHROPIC_API_KEY` missing | Add key to Vercel |
| `/api/agents/milestone` | ❌ **Broken** | `ANTHROPIC_API_KEY` missing + Zapier vars missing | Add 3 env vars |
| `/api/chat` | ❌ **Broken** | `ANTHROPIC_API_KEY` missing | Add key to Vercel |
| `/api/outlook-sync` | ❌ **Broken** | Microsoft OAuth not configured | Full Azure AD setup |
| `/api/auth/microsoft` | ❌ **Broken** | Microsoft OAuth not configured | Full Azure AD setup |
| n8n → Arive webhooks | ⚠️ **Unknown** | May not be activated | Check n8n cloud UI |
| Zapier Outlook push | ⚠️ **Not set up** | No Zap created + vars missing | Create Zap + add vars |

---

## SECTION 5: MICROSOFT OUTLOOK OAUTH SETUP (Full Steps)

Skip this section until everything else is working. Do this last.

### Step 1 — Register Azure AD App

1. Go to [portal.azure.com](https://portal.azure.com)
2. Search: **App registrations** → New registration
3. Name: `LoanOS Outlook Sync`
4. Supported account types: **Accounts in any organizational directory and personal Microsoft accounts**
5. Redirect URI: `https://your-loanos-domain.vercel.app/api/auth/callback/microsoft`
6. Click Register

### Step 2 — Get Client ID

On the app overview page, copy the **Application (client) ID** → this is your `MICROSOFT_CLIENT_ID`

### Step 3 — Create Client Secret

1. Left menu → Certificates & secrets → New client secret
2. Description: `loanos-production`
3. Expiry: 24 months
4. Copy the **Value** immediately (it only shows once) → this is your `MICROSOFT_CLIENT_SECRET`

### Step 4 — Set API Permissions

1. Left menu → API permissions → Add a permission → Microsoft Graph → Delegated permissions
2. Add: `Mail.Read`, `Mail.ReadWrite`, `Mail.Send`, `offline_access`
3. Click **Grant admin consent**

### Step 5 — Update Env Vars in Vercel

```
MICROSOFT_CLIENT_ID     = [Application ID from Step 2]
MICROSOFT_CLIENT_SECRET = [Secret value from Step 3]
MICROSOFT_REDIRECT_URI  = https://your-loanos-domain.vercel.app/api/auth/callback/microsoft
OUTLOOK_EMAIL           = adam@thestyerteam.com
```

### Step 6 — Complete OAuth Flow

After deploying with the new vars:
1. Navigate to `/api/auth/microsoft` in your browser
2. Microsoft login dialog will appear
3. Log in as adam@thestyerteam.com
4. Grant permissions
5. Tokens are stored in Supabase `outlook_tokens` table
6. Verify: `SELECT * FROM outlook_tokens;` in Supabase SQL Editor

---

## QUICK WINS CHECKLIST

Do these in order. Check each off as done.

- [ ] Add `ANTHROPIC_API_KEY` to Vercel → redeploy → test `/api/agents/daily-briefing`
- [ ] Verify Supabase `email_drafts` table exists (Migration 013 query above)
- [ ] Verify all 9 expected tables exist (quick all-tables query above)
- [ ] Generate `DISPATCH_SECRET` → add to Vercel + configure matching Zapier Zap
- [ ] Add `ZAPIER_DISPATCH_WEBHOOK_URL` to Vercel
- [ ] Log into n8n → confirm both Arive workflows are Active
- [ ] Confirm Arive webhook URLs point to n8n Production URLs
- [ ] Generate real `OUTLOOK_SYNC_SECRET` → replace placeholder in Vercel + update n8n HTTP node
- [ ] Complete Microsoft OAuth registration (Section 5)
- [ ] Complete Outlook OAuth flow in browser

---

*Audit completed: 2026-03-12 | Source: LoanOS codebase review + .env.local inspection*
