---
name: send-rate-update
description: "Paste mortgage rates into chat and send a rate update — publishes a rate page to the website and sends teaser emails via Mailchimp."
---

You are sending a weekly rate update for Adam Styer's mortgage website. The user pastes rates into chat and you run the full pipeline: normalize rates, preview AI-generated content, confirm, then publish and send emails.

## Step 1: Parse Rates

Normalize whatever format the user pastes into:
```
Product Name: Rate | APR: AprValue
```

Example:
```
30-Year Fixed: 6.875% | APR: 6.95%
15-Year Fixed: 6.25% | APR: 6.35%
FHA 30-Year: 6.5% | APR: 7.15%
VA 30-Year: 6.25% | APR: 6.45%
```

If APR is not provided, omit the `| APR:` portion.

---

## Step 2: Extract Optional Context

- **direction**: `down`, `up`, `flat`, `volatile` — infer from user's message
- **blurb**: any market commentary or talking points the user mentions
- **notes**: any additional instructions
- **audiences**: default `["borrower", "realtor"]` — narrow if user says "just borrowers" or "realtors only"

---

## Step 3: Confirm Before Sending

Show the user:
```
Here's what I'll send:

Rates:
[formatted rates]

Direction: [value or "not specified"]
Audiences: [Borrower, Realtor]
Talking points: [blurb or "none"]
Notes: [notes or "none"]

Running preview first — ready?
```

Wait for confirmation.

---

## Step 4: Preview Call

Use bash tool:

```bash
curl -s -X POST https://styermortgage.com/.netlify/functions/generate-rate-update \
  -H "Content-Type: application/json" \
  -d '{
    "rates": "<rates string>",
    "direction": "<direction>",
    "blurb": "<blurb>",
    "notes": "<notes>",
    "audiences": ["borrower", "realtor"],
    "mode": "preview"
  }'
```

---

## Step 5: Show Preview Results

From JSON response, display:
- `preview.pageTitle` — page title
- `preview.webContent` — summarize HTML as readable text
- `preview.borrowerSubject` — borrower email subject line
- `preview.realtorSubject` — realtor email subject line
- `pageUrl` — where it will publish

Ask: "Ready to go live? This publishes the rate page and sends emails."

---

## Step 6: Live Call

Same payload, `"mode": "live"`:

```bash
curl -s -X POST https://styermortgage.com/.netlify/functions/generate-rate-update \
  -H "Content-Type: application/json" \
  -d '{
    "rates": "<same rates>",
    "direction": "<same direction>",
    "blurb": "<same blurb>",
    "notes": "<same notes>",
    "audiences": ["borrower", "realtor"],
    "mode": "live"
  }'
```

---

## Step 7: Confirm Results

Report:
- Page published at `pageUrl`
- Each campaign from `campaigns` array — audience + status
- Flag any errors

---

## Error Handling

- API error → show message, offer retry
- Empty/unparseable rates → ask user to re-paste
- Network failure → suggest checking if Netlify deployment is complete

---

## Notes

- **Always preview before live — never skip.**
- Rate page URL pattern: `https://styermortgage.com/rates/YYYY-MM-DD.html`
- No auth required — keys are Netlify environment variables server-side
- Emails sent via Mailchimp to borrower and/or realtor lists
