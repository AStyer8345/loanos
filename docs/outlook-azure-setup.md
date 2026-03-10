# LoanOS — Outlook Integration: Azure App Setup

> Complete this ONE TIME. You need a Microsoft 365 account with admin access.
> This takes ~15 minutes. Every step is numbered — do them in order.

---

## Prerequisites

- Access to **portal.azure.com** with your Microsoft 365 admin account
- Your Netlify site URL (e.g. `https://loanos-xyz.netlify.app`)

---

## Step 1: Create the App Registration

1. Go to **https://portal.azure.com** and sign in
2. In the top search bar, type **"App registrations"** and click the result
3. Click **"+ New registration"**
4. Fill in:
   - **Name:** `LoanOS Outlook Integration`
   - **Supported account types:** Select **"Accounts in this organizational directory only (Single tenant)"**
   - **Redirect URI:**
     - Platform: **Web**
     - URL: `https://YOUR-NETLIFY-SITE.netlify.app/.netlify/functions/outlook-callback`
     - *(Replace `YOUR-NETLIFY-SITE` with your actual Netlify subdomain)*
5. Click **Register**

You'll land on the app overview page. **Stay here for Step 2.**

---

## Step 2: Copy Your IDs (do this NOW before navigating away)

On the app overview page, copy these two values:

| Value | Where to find it | Netlify env var name |
|-------|-----------------|---------------------|
| **Application (client) ID** | Shown as "Application (client) ID" | `MICROSOFT_CLIENT_ID` |
| **Directory (tenant) ID** | Shown as "Directory (tenant) ID" | `MICROSOFT_TENANT_ID` |

Paste them somewhere safe. You'll add them to Netlify in Step 5.

---

## Step 3: Create a Client Secret

1. In the left sidebar, click **"Certificates & secrets"**
2. Click **"+ New client secret"**
3. Fill in:
   - **Description:** `loanos-production`
   - **Expires:** `24 months` (or maximum allowed)
4. Click **Add**
5. **IMMEDIATELY copy the "Value" column** — it disappears after you navigate away

> ⚠️ Do NOT copy the "Secret ID" — you want the **Value** column.

This value goes in `MICROSOFT_CLIENT_SECRET` in Netlify.

---

## Step 4: Add API Permissions

1. In the left sidebar, click **"API permissions"**
2. Click **"+ Add a permission"**
3. Click **"Microsoft Graph"**
4. Click **"Delegated permissions"**
5. In the search box, add each of these (search, check the box, then add):
   - `Mail.Read`
   - `Mail.ReadWrite`
   - `offline_access`
   - `User.Read`
6. After adding all four, click **"Grant admin consent for [your organization]"**
7. Click **Yes** to confirm
8. All four permissions should now show a green ✅ under "Status"

---

## Step 5: Set Environment Variables in Netlify

Go to your Netlify dashboard:
1. Open your site → **Site configuration** → **Environment variables**
2. Click **"Add a variable"** for each:

| Variable Name | Value | Where you got it |
|---------------|-------|-----------------|
| `MICROSOFT_CLIENT_ID` | Paste from Step 2 | Azure → App registrations → your app → Overview |
| `MICROSOFT_CLIENT_SECRET` | Paste from Step 3 | Azure → Certificates & secrets → Value |
| `MICROSOFT_TENANT_ID` | Paste from Step 2 | Azure → App registrations → your app → Overview |
| `MICROSOFT_REDIRECT_URI` | `https://YOUR-NETLIFY-SITE.netlify.app/.netlify/functions/outlook-callback` | Your Netlify URL |
| `OUTLOOK_EMAIL` | `adam@thestyerteam.com` | Your Outlook email address |

3. Click **Save** after each variable
4. **Redeploy your site** so the variables take effect:
   - Netlify → Deploys → **Trigger deploy** → Deploy site

---

## Step 6: Connect Outlook in LoanOS

1. Go to your LoanOS dashboard → **Settings** → **Integrations**
2. Click **"Connect Outlook"**
3. Sign in with your Microsoft account
4. Grant the requested permissions
5. You'll be redirected back to `/settings?outlook=connected`

The status indicator will turn green and show your email address.

---

## Step 7: Configure n8n for Automatic Sync

The n8n workflow in `/n8n/outlook-sync.json` runs every 15 minutes.

1. Go to **https://styer.app.n8n.cloud**
2. Import the workflow file
3. Activate it

Or trigger sync manually anytime from Settings → Integrations → **Sync Now**.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "AADSTS50011: The redirect URI doesn't match" | Check that the redirect URI in Azure exactly matches `MICROSOFT_REDIRECT_URI` in Netlify |
| "invalid_client" error | Double-check that you copied the secret **Value** not the **Secret ID** |
| "insufficient_claims" error | Make sure admin consent was granted (Step 4) |
| Token not refreshing | Check that `offline_access` permission is granted |
| Emails not matching contacts | Contacts must have matching email in `contacts.email` or `contacts.realtor_email` |

---

## What Gets Synced

- **Inbox:** Last 50 emails → logged as `email_inbound`
- **Sent Items:** Last 50 sent → logged as `email_outbound`
- **Deduplication:** Each email synced once via `internetMessageId`
- **Contact matching:** Email from/to must match a contact in Supabase
- **Unmatched emails:** Silently skipped — no phantom contacts created
