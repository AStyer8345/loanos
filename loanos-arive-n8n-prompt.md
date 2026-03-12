# LoanOS — Arive → Supabase n8n Integration
## Claude Code Autonomous Build Prompt

Paste this entire prompt into Claude Code. Execute all steps autonomously without stopping to ask questions. Build everything end-to-end.

---

## MISSION

Build a complete Arive → Supabase integration using n8n. This runs **in parallel** with existing Zapier flows — do not reference, modify, or replace Salesforce or Zapier in any way. Those are untouched. This integration feeds LoanOS (a Next.js 14 + Supabase SaaS platform for mortgage loan officers).

---

## WHAT TO BUILD — COMPLETE FILE LIST

Create all of the following files from scratch:

```
loanos/
├── supabase/
│   └── migrations/
│       └── 001_arive_integration.sql        ← Full schema migration
├── n8n/
│   ├── workflows/
│   │   ├── workflow-1-new-loan.json         ← n8n importable workflow
│   │   └── workflow-2-status-update.json    ← n8n importable workflow
│   └── README.md                            ← Setup + deployment guide
├── scripts/
│   └── test-webhooks.js                     ← Node.js test script
└── .env.example                             ← All required env vars
```

---

## STEP 1 — SUPABASE SCHEMA

Create `supabase/migrations/001_arive_integration.sql`

This file must:
- Create all tables with proper constraints
- Be safe to run on a fresh Supabase project
- Use `IF NOT EXISTS` on all creates
- Include all indexes needed for lookup performance
- Include RLS policies (enable RLS, add policy for service role full access)

**Tables to create:**

```sql
-- contacts
CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  first_name text,
  last_name text,
  phone text,
  mailing_street text,
  mailing_city text,
  mailing_state text,
  mailing_zip text,
  group_tag text DEFAULT 'Client',
  stage text DEFAULT 'Lead',
  source text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- loans
CREATE TABLE IF NOT EXISTS loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  arive_loan_id text UNIQUE NOT NULL,
  contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  status text,
  first_payment_date date,
  est_closing_date date,
  funding_date date,
  sales_contract_date date,
  raw_payload jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- activity_log
CREATE TABLE IF NOT EXISTS activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  loan_id uuid REFERENCES loans(id) ON DELETE SET NULL,
  event text NOT NULL,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);
```

Also include:
- Index on `contacts(email)`
- Index on `loans(arive_loan_id)`
- Index on `activity_log(loan_id)`
- Index on `activity_log(contact_id)`
- `updated_at` auto-update trigger function applied to both `contacts` and `loans`
- Enable RLS on all three tables
- Service role bypass policy on all three tables

---

## STEP 2 — N8N WORKFLOW 1: NEW LOAN CREATED

Create `n8n/workflows/workflow-1-new-loan.json`

This must be a **valid n8n workflow JSON** that can be imported directly via the n8n UI (Settings → Import Workflow).

**Workflow name:** `LoanOS — Arive New Loan → Supabase`

**Nodes in order:**

### Node 1: Webhook Trigger
- Type: `n8n-nodes-base.webhook`
- Name: `Arive New Loan Webhook`
- HTTP Method: POST
- Path: `arive-new-loan`
- Response mode: `onReceived`
- Authentication: Header Auth (`x-webhook-secret` header, value from env `ARIVE_WEBHOOK_SECRET`)

### Node 2: Set — Extract Fields
- Type: `n8n-nodes-base.set`
- Name: `Extract Loan Fields`
- Extract and normalize these fields from `$json.body`:
  - `email` ← `loanBorrower1_emailAddressText` (lowercase, trim)
  - `firstName` ← `loanBorrower1_firstName`
  - `lastName` ← `loanBorrower1_lastName`
  - `phone` ← `loanBorrower1_mobilePhoneText`
  - `ariveLoanId` ← `ariveLoanId` (cast to string)
  - `status` ← `currentLoanStatus_status`
  - `firstPaymentDate` ← `keyDates_firstPaymentDate` (null if missing)
  - `estClosingDate` ← `keyDates_closingContingencyDate` (null if missing)
  - `fundingDate` ← `keyDates_estimatedFundingDate` (null if missing)
  - `salesContractDate` ← `keyDates_salesContractDate` (null if missing)
  - `mailingStreet` ← `loanProperty_streetAddressText`
  - `mailingCity` ← `loanProperty_cityText`
  - `mailingState` ← `loanProperty_stateText`
  - `mailingZip` ← `loanProperty_postalCodeText`

### Node 3: Supabase — Upsert Contact
- Type: `n8n-nodes-base.supabase`
- Name: `Upsert Contact`
- Operation: Upsert
- Table: `contacts`
- On conflict: `email`
- Data to upsert:
  - `email`, `first_name`, `last_name`, `phone`
  - `mailing_street`, `mailing_city`, `mailing_state`, `mailing_zip`
  - `group_tag`: hardcoded `"Client"`
  - `stage`: hardcoded `"Lead"`
  - `updated_at`: `={{ new Date().toISOString() }}`
- Return: full record (to capture `id`)

### Node 4: Supabase — Insert Loan
- Type: `n8n-nodes-base.supabase`
- Name: `Insert Loan Record`
- Operation: Upsert
- Table: `loans`
- On conflict: `arive_loan_id`
- Data:
  - `arive_loan_id` ← `ariveLoanId`
  - `contact_id` ← contact `id` from Node 3
  - `status`, `first_payment_date`, `est_closing_date`, `funding_date`, `sales_contract_date`
  - `raw_payload` ← full original webhook body as JSON string
  - `updated_at`: `={{ new Date().toISOString() }}`
- Return: full record

### Node 5: Supabase — Log Activity
- Type: `n8n-nodes-base.supabase`
- Name: `Log Activity`
- Operation: Insert
- Table: `activity_log`
- Data:
  - `contact_id` ← from Node 3
  - `loan_id` ← from Node 4
  - `event`: `"loan_created"`
  - `metadata`: `{ "arive_loan_id": "...", "status": "...", "source": "arive_webhook" }`

### Node 6: Respond to Webhook
- Type: `n8n-nodes-base.respondToWebhook`
- Name: `Return 200`
- Response code: 200
- Body: `{ "success": true, "loan_id": "...", "contact_id": "..." }`

### Error handling:
- Add a catch node that logs to `activity_log` with `event: "error"` and `metadata: { error_message, node_name, arive_loan_id }`

---

## STEP 3 — N8N WORKFLOW 2: LOAN STATUS UPDATED

Create `n8n/workflows/workflow-2-status-update.json`

**Workflow name:** `LoanOS — Arive Status Update → Supabase`

**Nodes in order:**

### Node 1: Webhook Trigger
- Type: `n8n-nodes-base.webhook`
- Name: `Arive Status Update Webhook`
- HTTP Method: POST
- Path: `arive-status-update`
- Response mode: `onReceived`
- Authentication: Header Auth (`x-webhook-secret`)

### Node 2: Set — Extract Fields
- Extract:
  - `ariveLoanId` ← `ariveLoanId` (string)
  - `status` ← `currentLoanStatus_status`
  - `firstPaymentDate` ← `keyDates_firstPaymentDate`
  - `fundingDate` ← `keyDates_estimatedFundingDate`
  - `estClosingDate` ← `keyDates_closingContingencyDate`

### Node 3: Supabase — Find Loan
- Type: `n8n-nodes-base.supabase`
- Name: `Find Loan by Arive ID`
- Operation: Get Many
- Table: `loans`
- Filter: `arive_loan_id` equals `ariveLoanId`
- Limit: 1

### Node 4: IF — Loan Found?
- Type: `n8n-nodes-base.if`
- Name: `Loan Exists?`
- Condition: `{{ $json.length > 0 }}`
- True → continue to update
- False → log error and exit

### Node 5 (True branch): Supabase — Update Loan
- Type: `n8n-nodes-base.supabase`
- Name: `Update Loan Status`
- Operation: Update
- Table: `loans`
- Match on: `arive_loan_id`
- Fields to update:
  - `status`, `first_payment_date`, `funding_date`, `est_closing_date`
  - `updated_at`: `={{ new Date().toISOString() }}`

### Node 6 (True branch): Supabase — Log Activity
- event: `"status_updated"`
- metadata: `{ "new_status": "...", "arive_loan_id": "..." }`

### Node 7 (False branch): Supabase — Log Error
- event: `"error_loan_not_found"`
- metadata: `{ "arive_loan_id": "...", "attempted_status": "..." }`

### Node 8: Respond to Webhook
- 200 on success, 404 body with message on loan-not-found

---

## STEP 4 — TEST SCRIPT

Create `scripts/test-webhooks.js`

A Node.js script (no external dependencies beyond `node-fetch` or native `fetch`) that:

1. Sends a test POST to Workflow 1 webhook with a realistic fake Arive payload:
```json
{
  "ariveLoanId": "TEST-001",
  "loanBorrower1_emailAddressText": "test.borrower@example.com",
  "loanBorrower1_firstName": "John",
  "loanBorrower1_lastName": "TestBorrower",
  "loanBorrower1_mobilePhoneText": "512-555-0100",
  "currentLoanStatus_status": "Application",
  "keyDates_firstPaymentDate": "2026-05-01",
  "keyDates_closingContingencyDate": "2026-04-15",
  "keyDates_estimatedFundingDate": "2026-04-14",
  "keyDates_salesContractDate": "2026-03-10",
  "loanProperty_streetAddressText": "123 Test St",
  "loanProperty_cityText": "Austin",
  "loanProperty_stateText": "TX",
  "loanProperty_postalCodeText": "78701"
}
```

2. Logs the response.

3. Waits 2 seconds, then sends a test POST to Workflow 2 with:
```json
{
  "ariveLoanId": "TEST-001",
  "currentLoanStatus_status": "Clear to Close",
  "keyDates_firstPaymentDate": "2026-05-01",
  "keyDates_estimatedFundingDate": "2026-04-14",
  "keyDates_closingContingencyDate": "2026-04-15"
}
```

4. Logs the response.

5. Prints pass/fail summary.

The script reads webhook URLs and secret from environment variables:
- `N8N_WEBHOOK_BASE_URL` (e.g., `https://your-n8n.cloud/webhook`)
- `ARIVE_WEBHOOK_SECRET`

---

## STEP 5 — ENV FILE

Create `.env.example`:

```
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here

# n8n (set these inside n8n credentials, not as system env vars)
# Included here for reference
N8N_SUPABASE_URL=https://your-project.supabase.co
N8N_SUPABASE_SERVICE_KEY=your-service-role-key-here

# Webhook security
ARIVE_WEBHOOK_SECRET=generate-a-strong-random-string-here

# Test script
N8N_WEBHOOK_BASE_URL=https://your-n8n-instance.com/webhook
```

---

## STEP 6 — SETUP README

Create `n8n/README.md` with these exact sections:

### Prerequisites
- n8n Cloud account ($20/mo) OR self-hosted n8n instance
- Supabase project created
- Arive admin access to configure webhooks

### Step 1 — Run Supabase Migration
```bash
# Option A: Supabase CLI
supabase db push

# Option B: Paste into Supabase SQL Editor
# Copy contents of supabase/migrations/001_arive_integration.sql
# Run in Supabase Dashboard → SQL Editor
```

### Step 2 — Configure Supabase Credentials in n8n
1. n8n → Settings → Credentials → New
2. Type: Supabase
3. Name: `LoanOS Supabase`
4. Host: your Supabase URL
5. Service Role Key: from Supabase Dashboard → Settings → API

### Step 3 — Import Workflows
1. n8n → Workflows → Import
2. Import `workflow-1-new-loan.json`
3. Import `workflow-2-status-update.json`
4. Update the Supabase credential reference in each workflow to `LoanOS Supabase`
5. Activate both workflows

### Step 4 — Get Webhook URLs
After activating, n8n shows webhook URLs:
- Workflow 1: `https://your-n8n.com/webhook/arive-new-loan`
- Workflow 2: `https://your-n8n.com/webhook/arive-status-update`

### Step 5 — Configure Arive Webhooks
1. Arive → Settings → Webhooks
2. New Loan webhook → paste Workflow 1 URL → add header `x-webhook-secret: your-secret`
3. Status Update webhook → paste Workflow 2 URL → add header `x-webhook-secret: your-secret`

### Step 6 — Test
```bash
N8N_WEBHOOK_BASE_URL=https://your-n8n.com/webhook \
ARIVE_WEBHOOK_SECRET=your-secret \
node scripts/test-webhooks.js
```

### Verify in Supabase
Check Dashboard → Table Editor → `contacts`, `loans`, `activity_log` for test records.

---

## EXECUTION RULES

- Create every file listed above. Do not skip any.
- Generate valid, importable n8n workflow JSON — use real n8n node types and structure.
- SQL must be safe to run on a fresh Supabase project.
- Do not reference Salesforce, Zapier, or any existing workflow anywhere.
- All error paths must log to `activity_log` — never fail silently.
- Webhook secret validation must be present in both workflows.
- Test script must run with `node scripts/test-webhooks.js` — no build step required.
- When complete, print a summary of every file created and the webhook URLs to register in Arive.
