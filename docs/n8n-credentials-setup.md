# n8n Credentials Setup Guide

## Review Request Workflow (ID: AK1fBcaX1cPcdlGx)

### What it does
Runs every 30 min. Fetches loans closed 2+ days ago that haven't had a review email sent. Sends a branded HTML email with Google + Zillow review links. Logs to `automation_logs`.

### Setup Steps

1. **Supabase Service Role Key**
   - In n8n: **Settings → Credentials → New Credential → Header Auth**
   - Name: `Supabase Service Role`
   - Header name: `apikey`
   - Header value: your Supabase service role key (from Supabase → Project Settings → API)
   - Add a second header: `Authorization` = `Bearer <same service role key>`

2. **SMTP Credential** (for sending the review email)
   - In n8n: **Settings → Credentials → New Credential → SMTP**
   - For Gmail: Host `smtp.gmail.com`, Port `587`, TLS: `STARTTLS`
   - Use an App Password (Gmail → Account → Security → App passwords)
   - For Outlook: Host `smtp.office365.com`, Port `587`, TLS: `STARTTLS`

3. **Review URLs** — add as workflow variables inside the workflow:
   - `GOOGLE_REVIEW_URL`: your Google Business Profile review link
     - Get it: Google Search your business name → click reviews → copy the "Write a review" URL
   - `ZILLOW_REVIEW_URL`: your Zillow profile review link
     - Format: `https://www.zillow.com/profile/{your-zillow-slug}/reviews/`

4. **Activate the workflow** — toggle from Inactive → Active

---

## Weekly Testimonial Social Post (ID: eJG4wckrj6SmSpm1)

### What it does
Runs Mondays at 9am CT. Reads a random unused testimonial from Google Sheets. Gemini generates a caption + Imagen generates a quote card image. Publer posts to Instagram + LinkedIn + Facebook. Marks the row as used. Logs to `automation_logs`.

### Setup Steps

1. **Gemini API Key**
   - Go to [aistudio.google.com](https://aistudio.google.com) → Get API Key → Create API key
   - In n8n: **Settings → Credentials → New Credential → Google AI (Gemini)**
   - Paste the API key

2. **Google Sheets OAuth2**
   - In n8n: **Settings → Credentials → New Credential → Google Sheets OAuth2**
   - Follow the OAuth flow — sign in with the Google account that owns the testimonials sheet
   - Sheet ID: `1W9NRB2H8u0cjctCueXh7VYgL27m5vLLFJfONepNWixk`
   - Tab: `Sheet1`
   - Columns expected: `testimonial` (text), `author` (name), `used` (blank = not used)

3. **Supabase Service Role Key** — same credential as Review Request workflow above

4. **Publer API** (for social posting)
   - In Publer: **Settings → Integrations → API** → generate token
   - In n8n: **Settings → Credentials → New Credential → HTTP Header Auth**
   - Header name: `Authorization`, value: `Bearer <publer-token>`

5. **Activate the workflow** — toggle from Inactive → Active

---

## CD/PA Extraction Webhooks (new routes)

Two new Next.js API routes are now live. Wire them in n8n after Claude extracts fields from the PDF:

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/agents/cd-extraction` | POST | Update loan with Closing Disclosure fields |
| `/api/agents/pa-extraction` | POST | Update loan with Pre-Approval letter fields |

**Required header:** none (service role key is used server-side via env var)

**CD extraction payload:**
```json
{
  "loan_id": "<internal-uuid>",
  "closing_date": "2026-04-15",
  "loan_amount": 485000,
  "interest_rate": 6.875,
  "cash_to_close": 12400,
  "monthly_payment": 3187,
  "seller_credits": 5000,
  "cd_date": "2026-04-10"
}
```

**PA extraction payload:**
```json
{
  "loan_id": "<internal-uuid>",
  "loan_amount": 550000,
  "interest_rate": 7.125,
  "loan_program": "Conventional",
  "down_payment_pct": 20,
  "pre_approval_expiry_date": "2026-05-14",
  "set_status_pre_approved": true
}
```

To get the internal `loan_id`: after n8n upserts the loan via WF1, the response includes the Supabase `id`. Store it and pass it to these endpoints.
