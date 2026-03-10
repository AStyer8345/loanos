# LoanOS — n8n Automations

Two production workflows for automating post-close review requests and weekly social testimonials.

---

## Files

| File | Purpose |
|------|---------|
| `workflow-1-closed-loan-review-request.json` | Polls for closed loans, sends review request email 2 days after close |
| `workflow-2-weekly-testimonial-post.json` | Monday 9am: picks a testimonial, generates image with Gemini, posts to Instagram/LinkedIn/Facebook |
| `testimonials-sheet-template.md` | Google Sheets column structure + sample rows |
| `gemini-caption-prompt.md` | Caption + image prompts — reference and tuning guide |

---

## Automation 1 — Review Request Email

### How it works
- Runs every 30 minutes
- Queries Supabase `loans` table for records where `status = Closed` and `close_date <= 2 days ago`
- Cross-checks `automation_logs` to skip loans already emailed
- Fetches borrower contact from `contacts` table via `contact_id`
- Sends a personalized HTML email via SMTP
- Logs the send to `automation_logs` (type: `review_request`)

### Required env vars (set in n8n → Settings → Variables)

| Var | Example |
|-----|---------|
| `SUPABASE_URL` | `https://xyzxyz.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJh...` (service role, not anon key) |
| `SMTP_FROM_EMAIL` | `adam@styermortgage.com` |
| `GOOGLE_REVIEW_URL` | `https://g.page/r/your-review-link` |
| `ZILLOW_REVIEW_URL` | `https://www.zillow.com/lender/...` |

### Required n8n credential
- **SMTP credential** — create in n8n → Credentials → SMTP. Replace `REPLACE_WITH_SMTP_CRED_ID` in the
  workflow JSON with the actual credential ID, OR re-link it after import via the n8n UI.

> **Outlook alternative:** Replace the Send Email node with an HTTP Request to the
> Microsoft Graph API: `POST https://graph.microsoft.com/v1.0/me/sendMail`
> Requires a Microsoft OAuth2 credential in n8n.

### Required Supabase schema

```sql
-- automation_logs table
create table automation_logs (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid references loans(id),
  type text not null,
  sent_at timestamptz,
  posted_at timestamptz,
  platform text,
  testimonial_id text
);

-- Assumed existing tables:
-- loans: id, contact_id, status, close_date
-- contacts: id, first_name, last_name, email
```

---

## Automation 2 — Weekly Testimonial Post

### How it works
1. Fires Monday 9am CT
2. Reads all rows from Google Sheet where `used ≠ TRUE`
3. Randomly picks one testimonial
4. Calls Gemini 1.5 Flash to write an Instagram caption
5. Calls Imagen 3 to generate a branded quote card image
6. Uploads the image to Supabase Storage (public bucket) to get a URL
7. Posts to Instagram, LinkedIn, and Facebook via a single Publer API call
9. Marks the row as `used = TRUE` in Google Sheets
10. Logs to Supabase `automation_logs`

### Required env vars

| Var | Notes |
|-----|-------|
| `GEMINI_API_KEY` | Google AI Studio → API Keys |
| `TESTIMONIALS_SHEET_ID` | ID from the Google Sheet URL |
| `SUPABASE_URL` | Same as Workflow 1 |
| `SUPABASE_SERVICE_ROLE_KEY` | Same as Workflow 1 |
| `SUPABASE_STORAGE_BUCKET` | Bucket name, default: `social-assets` (must be set to public) |
| `PUBLER_API_KEY` | Publer dashboard → Settings → API |
| `PUBLER_ACCOUNT_IDS` | Comma-separated account IDs from Publer, e.g. `acc_111,acc_222,acc_333` |
| `TESTIMONIALS_SHEET_ID` | `1W9NRB2H8u0cjctCueXh7VYgL27m5vLLFJfONepNWixk` |

### Required n8n credential
- **Google Sheets OAuth2** — create in n8n → Credentials → Google Sheets OAuth2 API.
  Replace `REPLACE_WITH_GOOGLE_SHEETS_CRED_ID` in the workflow JSON (appears twice) after import.

### Supabase Storage setup
1. Go to Supabase → Storage → Create bucket named `social-assets`
2. Set bucket to **Public**
3. No additional RLS policies needed for public read

---

## Publer Setup (~10 minutes, $12/mo)

Publer is a social media scheduling API. Connect your platforms once — they handle the OAuth —
then post to all of them with a single API call from n8n.

### Step 1 — Create account
Sign up at [publer.io](https://publer.io). The **Professional plan (~$12/mo)** includes API access
and supports Instagram, LinkedIn, and Facebook.

### Step 2 — Connect your social platforms
In the Publer dashboard → **Accounts** → connect Instagram Business, LinkedIn, and Facebook Page.
Each one is an OAuth flow in-browser. Takes about 5 minutes total.

### Step 3 — Get your API key
Dashboard → **Settings → API** → copy your API key → add as `PUBLER_API_KEY` env var in n8n.

### Step 4 — Get your account IDs
Dashboard → **Accounts** → click each connected account — the ID is in the URL or the account details panel.
Add all three as a comma-separated string: `PUBLER_ACCOUNT_IDS = acc_111,acc_222,acc_333`

### Step 5 — Verify with a test post
Use Publer's built-in **Create Post** UI to test a caption + image URL to one platform first.
If it works there, it'll work in n8n.

---

## How to import into n8n

1. In n8n, go to **Workflows → Import from File**
2. Select the JSON file
3. After import, re-link credentials:
   - Open the workflow → click each node that has a credential warning
   - Select your existing credential from the dropdown
4. Set all env vars in **n8n → Settings → Variables**
5. Activate the workflow (toggle in top right)

---

## How to test end-to-end

### Workflow 1
1. Insert a test loan into Supabase with `status = 'Closed'` and `close_date = [today - 3 days]`
2. Ensure a matching row in `contacts` with a real email address
3. In n8n, open the workflow → click **Test Workflow** (runs once manually)
4. Check your inbox and verify a log entry in `automation_logs`
5. Delete test records after confirming

### Workflow 2
1. Add 1 row to the Google Sheet with `used = FALSE`
2. In n8n, open the workflow → click **Test Workflow**
3. Check Instagram for the post
4. Verify the row in Google Sheets is now `used = TRUE`
5. Verify a log entry in Supabase `automation_logs`

---

## Seeding the Google Sheet

Copy the structure from `testimonials-sheet-template.md`. Manually enter testimonials
from Google and Zillow. Aim for at least 10 rows before activating the workflow so you
have a backlog. Add new ones as they come in.
