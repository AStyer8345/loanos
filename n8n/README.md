# LoanOS — Arive → Supabase n8n Integration

Webhook pipeline that receives Arive events and writes them to Supabase.
Runs completely independently of Zapier and Salesforce — those are untouched.

## What This Does

| Arive Event | Workflow | Supabase Tables Written |
|---|---|---|
| New Loan Created | workflow-1-new-loan | contacts (upsert), loans (upsert), activity_log |
| Loan Status Updated | workflow-2-status-update | loans (patch), activity_log |

---

## Prerequisites

- n8n Cloud ($20/mo) or self-hosted n8n
- Supabase project (existing LoanOS project works)
- Arive admin access to configure webhooks

---

## Step 1 — Run Supabase Migration

Run `supabase/migrations/007_arive_integration.sql` in Supabase SQL Editor.

```sql
-- Option A: Paste file contents into Supabase Dashboard → SQL Editor → Run

-- Option B: Supabase CLI
supabase db push
```

**Before running:** Check for duplicate emails (required for upsert-on-conflict):
```sql
SELECT email, COUNT(*) FROM contacts
WHERE email IS NOT NULL
GROUP BY email HAVING COUNT(*) > 1;
```
If duplicates exist, merge them before running the migration. The migration will warn (not fail) if the unique constraint can't be added, but upserts will not work without it.

**After running:** Verify new columns exist:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name IN ('contacts', 'loans')
  AND column_name IN ('mailing_street', 'arive_loan_id', 'raw_payload', 'est_closing_date');
```

---

## Step 2 — Get Adam's System User ID

The n8n workflows write to Supabase tables that require a `user_id`. Use Adam's auth UUID.

```sql
SELECT id FROM auth.users WHERE email = 'adam@thestyerteam.com';
```

Copy this UUID — you'll need it in Step 4.

---

## Step 3 — Configure Credentials in n8n

### Credential 1: Arive Webhook Secret
1. n8n → Settings → Credentials → New
2. Type: **Header Auth**
3. Name: `Arive Webhook Secret`
4. Header Name: `x-webhook-secret`
5. Header Value: your secret (generate with `openssl rand -hex 32`)

### Credential 2: LoanOS Supabase Service Key
1. n8n → Settings → Credentials → New
2. Type: **Header Auth**
3. Name: `LoanOS Supabase Service Key`
4. Header Name: `apikey`
5. Header Value: Supabase service role key (Dashboard → Settings → API → service_role)

---

## Step 4 — Set n8n Environment Variable

In n8n, go to Settings → Environment Variables → Add:

| Variable | Value |
|---|---|
| `LOANOS_SYSTEM_USER_ID` | Adam's UUID from Step 2 |

This satisfies the `user_id NOT NULL` constraint on Supabase tables.

---

## Step 5 — Import Workflows

1. n8n → Workflows → **Import from File**
2. Import `n8n/workflows/workflow-1-new-loan.json`
3. Import `n8n/workflows/workflow-2-status-update.json`
4. In each workflow, update the credential references:
   - Webhook nodes → select `Arive Webhook Secret`
   - All HTTP Request nodes → select `LoanOS Supabase Service Key`
5. **Activate** both workflows

---

## Step 6 — Configure Error Workflow (Optional but Recommended)

To enable the Error Trigger node (logs failures to activity_log):

For **each workflow**:
1. Open workflow → Settings (gear icon)
2. Error Workflow → select this same workflow
3. Save

This causes the Error Trigger node to fire when any execution fails, logging the error to Supabase.

---

## Step 7 — Get Webhook URLs

After activating, n8n shows the live URLs in the Webhook node panel:

- **New Loan:** `https://styer.app.n8n.cloud/webhook/arive-new-loan`
- **Status Update:** `https://styer.app.n8n.cloud/webhook/arive-status-update`

---

## Step 8 — Configure Arive Webhooks

1. Arive → Settings → Webhooks (or API Integrations)
2. **New Loan webhook:**
   - URL: `https://styer.app.n8n.cloud/webhook/arive-new-loan`
   - Method: POST
   - Header: `x-webhook-secret: <your-secret>`
   - Events: New Loan Created
3. **Status Update webhook:**
   - URL: `https://styer.app.n8n.cloud/webhook/arive-status-update`
   - Method: POST
   - Header: `x-webhook-secret: <your-secret>`
   - Events: Loan Status Changed

---

## Step 9 — Test

```bash
N8N_WEBHOOK_BASE_URL=https://styer.app.n8n.cloud/webhook \
ARIVE_WEBHOOK_SECRET=your-secret-here \
node scripts/test-webhooks.js
```

### Verify in Supabase

```sql
-- Check test contact was created
SELECT id, email, first_name, mailing_city, source FROM contacts
WHERE source = 'arive_webhook' ORDER BY created_at DESC LIMIT 5;

-- Check test loan was created
SELECT id, arive_loan_id, status, contact_id FROM loans
WHERE arive_loan_id LIKE 'TEST-%' ORDER BY created_at DESC LIMIT 5;

-- Check activity log
SELECT action, entity_type, metadata FROM activity_log
ORDER BY created_at DESC LIMIT 10;
```

---

## Arive Field Mapping

| Arive Field | Supabase Column | Table |
|---|---|---|
| `loanBorrower1_emailAddressText` | `email` | contacts |
| `loanBorrower1_firstName` | `first_name` | contacts |
| `loanBorrower1_lastName` | `last_name` | contacts |
| `loanBorrower1_mobilePhoneText` | `phone` | contacts |
| `loanProperty_streetAddressText` | `mailing_street` | contacts |
| `loanProperty_cityText` | `mailing_city` | contacts |
| `loanProperty_stateText` | `mailing_state` | contacts |
| `loanProperty_postalCodeText` | `mailing_zip` | contacts |
| `ariveLoanId` | `arive_loan_id` | loans |
| `currentLoanStatus_status` | `status` | loans |
| `keyDates_firstPaymentDate` | `first_payment_date` | loans |
| `keyDates_closingContingencyDate` | `est_closing_date` | loans |
| `keyDates_estimatedFundingDate` | `funding_date` | loans |
| `keyDates_salesContractDate` | `sales_contract_date` | loans |
| (full body) | `raw_payload` | loans |

---

## Troubleshooting

**Upsert fails with "no unique constraint" error**
→ The `contacts_email_unique` constraint was not added. Check for duplicate emails and re-run migration 007.

**403 on Supabase calls**
→ Confirm the `LoanOS Supabase Service Key` credential uses the `service_role` key, not the `anon` key.

**"LOANOS_SYSTEM_USER_ID not set" error**
→ Set the env variable in n8n Settings → Environment Variables with Adam's auth UUID.

**Webhook returns 401**
→ The `x-webhook-secret` header from Arive doesn't match the `Arive Webhook Secret` credential value.

**Error Trigger never fires**
→ Set Error Workflow in each workflow's Settings to point to itself (see Step 6).
