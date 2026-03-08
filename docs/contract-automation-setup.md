# Contract Received — Automation Setup Guide

End-to-end setup for the n8n contract extraction pipeline.

**What this does:**
- Supabase fires a webhook to n8n when a document with `doc_type = 'contract'` is inserted
- n8n downloads the PDF, sends it to Claude API, extracts 35 fields from the Texas TREC contract
- Updates the loan record in Supabase, logs to activity_log
- Drafts two Outlook emails (party reply + borrower welcome) to adam@thestyerteam.com for review

---

## Step 1 — Run the Database Migration

In Supabase Dashboard → SQL Editor, run:

```
supabase/migrations/003_contract_fields.sql
```

This does three things:
1. Adds 14 contract-extracted columns to the `loans` table (plus `contract_data JSONB`)
2. Enables `pg_net` extension (requires Supabase Pro — see note below)
3. Creates trigger `on_contract_document_inserted` that fires the n8n webhook on `doc_type = 'contract'` inserts

**If you're on Supabase Free tier:**
Skip the `pg_net` section (steps 2–4 in the SQL file). Instead use:
- Supabase Dashboard → Database → Webhooks
- Table: `documents`, Event: `INSERT`
- The n8n IF node (`Is Contract?`) will filter out non-contract inserts

---

## Step 2 — Get Your n8n Webhook URL

1. Import the workflow first (Step 3 below)
2. Open the **Webhook** node in n8n
3. Copy the **Production URL** — it looks like:
   `https://your-n8n-instance.com/webhook/loanos-contract-received`
4. Go back to Supabase SQL Editor and run:

```sql
CREATE OR REPLACE FUNCTION notify_n8n_contract_received()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.doc_type = 'contract' THEN
    PERFORM pg_net.http_post(
      url     := 'PASTE_YOUR_N8N_URL_HERE',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body    := json_build_object(
        'document_id', NEW.id,
        'loan_id',     NEW.loan_id,
        'file_path',   NEW.file_path,
        'file_name',   NEW.file_name,
        'doc_type',    NEW.doc_type,
        'user_id',     NEW.user_id,
        'created_at',  NEW.created_at
      )::text
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Step 3 — Import the n8n Workflow

1. Open n8n → top-right menu → **Import from File**
2. Select `n8n/contract-received.workflow.json`
3. The workflow imports with all 13 nodes connected

---

## Step 4 — Configure n8n Credentials

You need three credentials in n8n. Create each under **Settings → Credentials**.

### A. Supabase Service Role (HTTP Header Auth)

Used by: Download PDF, Update Loan Record, Log Contract Received, Log Emails Drafted

- Credential type: **Header Auth**
- Name: `Supabase Service Role`
- Name field: `apikey`
- Value field: your Supabase service role key (from Supabase Dashboard → Settings → API)

### B. Anthropic API Key (HTTP Header Auth)

Used by: Call Claude API

- Credential type: **Header Auth**
- Name: `Anthropic API Key`
- Name field: `x-api-key`
- Value field: your Anthropic API key

### C. Microsoft Outlook OAuth2

Used by: Draft Party Reply, Draft Borrower Welcome

- Credential type: **Microsoft OAuth2 API**
- Name: `Microsoft Outlook`
- Follow n8n's built-in OAuth2 setup (requires Azure app registration with `Mail.ReadWrite` scope)
- Sign in as adam@thestyerteam.com

---

## Step 5 — Replace Placeholder Values in the Workflow

After importing, update these values in the workflow nodes:

| Node | Placeholder | Replace With |
|------|-------------|--------------|
| Download PDF | `YOUR_SUPABASE_PROJECT_REF` | Your Supabase project ref (e.g. `abcdefghijklmnop`) |
| Update Loan Record | `YOUR_SUPABASE_PROJECT_REF` | Same project ref |
| Log Contract Received | `YOUR_SUPABASE_PROJECT_REF` | Same project ref |
| Log Emails Drafted | `YOUR_SUPABASE_PROJECT_REF` | Same project ref |
| Download PDF (header) | `YOUR_SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |

**Tip:** Find your project ref in Supabase Dashboard → Settings → General → Reference ID.

Alternatively, set n8n environment variables and reference them with `{{ $env.SUPABASE_URL }}` etc.

---

## Step 6 — Activate and Test

1. Click **Activate** (toggle in top-right of the workflow)
2. Upload a Texas TREC contract PDF via the LoanOS upload form (`/dashboard/upload`)
3. Set `doc_type` = `contract`
4. Watch n8n executions — you should see a successful run
5. Check:
   - Loan record updated with contract fields
   - `activity_log` has two new entries (`contract.received` + `emails.drafted`)
   - Two draft emails appear in adam@thestyerteam.com Drafts folder in Outlook

---

## Email Draft Workflow

Both emails are drafted to **adam@thestyerteam.com** (not the actual recipients). This is intentional — review before sending.

**Party Reply email:**
- Actual recipients are stored in the draft subject line and body header for reference
- TO = Buyer's Agent, CC = Listing Agent + Title Company
- Swap recipients in Outlook, then send

**Borrower Welcome email:**
- TO = all buyer emails extracted from the contract
- Review and send

---

## Troubleshooting

**Webhook not firing**
- Confirm the trigger exists: `SELECT * FROM information_schema.triggers WHERE trigger_name = 'on_contract_document_inserted';`
- Confirm `pg_net` is enabled: `SELECT * FROM pg_extension WHERE extname = 'pg_net';`
- On Free tier: use Supabase Dashboard Webhooks instead

**Claude returning invalid JSON**
- The Parse Contract Fields node strips markdown fences automatically
- If it still fails, check n8n execution → Parse Contract Fields → output for raw Claude response
- Common cause: PDF is image-only (scanned), not text-based — Claude can still parse but may miss fields

**Loan not updating**
- Verify `loan_id` is set on the document (Upload form should set this automatically)
- Check n8n execution → Update Loan Record → response for Supabase error details

**Outlook draft not created**
- Re-authenticate the Microsoft Outlook credential
- Verify `Mail.ReadWrite` scope is granted in Azure

---

## Files Reference

| File | Purpose |
|------|---------|
| `supabase/migrations/003_contract_fields.sql` | DB schema + webhook trigger |
| `n8n/prompts/contract-extraction.txt` | Claude system prompt (reference only — embedded in workflow) |
| `n8n/contract-received.workflow.json` | Importable n8n workflow |
| `docs/contract-automation-setup.md` | This file |
