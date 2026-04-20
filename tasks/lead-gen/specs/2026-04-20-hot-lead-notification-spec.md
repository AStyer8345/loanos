# Spec: Hot Lead Notification — LoanOS API Endpoint + n8n Wiring
Date: 2026-04-20
Status: READY TO BUILD
Estimated effort: 45 min

---

## Summary

The n8n "LoanOS — Lead Score Updater" workflow (ID: `nOCDV73m4M0jyL1B`) sets `hot_lead_dismissed=false` when a contact hits score ≥20, but never tells Adam. This spec closes that gap with:

1. A new Next.js API route `POST /api/notify/hot-lead` — validates the agent secret, deduplicates within a 24-hour window using Supabase, then sends an email via Resend.
2. Two new n8n nodes wired after "Surface Hot Lead" — one fetches the contact record, one POSTs to the new route.

No new env vars required. No new dependencies. Follows the exact same auth and email patterns already in the codebase.

---

## New File: `src/app/api/notify/hot-lead/route.ts`

### Request contract

```
POST /api/notify/hot-lead
Authorization: Bearer <LOANOS_AGENT_SECRET>
Content-Type: application/json

{
  "contact_id": "uuid",   // required — UUID of the contact
  "score": 25             // required — integer, the current lead score
}
```

### Response contract

| Status | Body | When |
|--------|------|------|
| 200 | `{ "ok": true, "message": "Notification sent", "resend_id": "..." }` | Email sent successfully |
| 200 | `{ "ok": true, "message": "Deduplicated — notification already sent today", "sent_at": "ISO timestamp" }` | Already notified today for this contact |
| 400 | `{ "error": "contact_id is required" }` | Missing field |
| 400 | `{ "error": "score is required" }` | Missing field |
| 401 | `{ "error": "Unauthorized" }` | Bad or missing agent secret |
| 404 | `{ "error": "Contact not found" }` | contact_id not in DB |
| 500 | `{ "error": "...", "detail": "..." }` | Resend failure or DB error |

### Full implementation

```typescript
// src/app/api/notify/hot-lead/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { validateAgentSecret } from '@/lib/auth/validateAgentSecret'
import { createServiceClient } from '@/lib/supabase/service'
import { sendViaResend } from '@/lib/resend/send'

const LOANOS_APP_URL = 'https://loanos-astyer8345s-projects.vercel.app'

/**
 * POST /api/notify/hot-lead
 * Machine-facing route — called by n8n when a contact crosses the hot-lead threshold.
 * Auth: Authorization: Bearer LOANOS_AGENT_SECRET
 * Deduplicates: one email per contact per calendar day (UTC).
 */
export async function POST(req: NextRequest) {
  // ── 1. Auth ──────────────────────────────────────────────────────────────────
  const authError = validateAgentSecret(req)
  if (authError) return authError

  // ── 2. Parse body ────────────────────────────────────────────────────────────
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { contact_id, score } = body as { contact_id?: string; score?: number }

  if (!contact_id) {
    return NextResponse.json({ error: 'contact_id is required' }, { status: 400 })
  }
  if (score === undefined || score === null) {
    return NextResponse.json({ error: 'score is required' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const now = new Date()
  const todayUtc = now.toISOString().slice(0, 10) // "YYYY-MM-DD"

  // ── 3. Deduplication check ───────────────────────────────────────────────────
  // Check activity_log for a hot_lead_notification event for this contact today.
  const { data: existingLog } = await supabase
    .from('activity_log')
    .select('created_at')
    .eq('contact_id', contact_id)
    .eq('action', 'hot_lead_notification')
    .gte('created_at', `${todayUtc}T00:00:00.000Z`)
    .lt('created_at', `${todayUtc}T23:59:59.999Z`)
    .limit(1)
    .maybeSingle()

  if (existingLog) {
    return NextResponse.json({
      ok: true,
      message: 'Deduplicated — notification already sent today',
      sent_at: existingLog.created_at,
    })
  }

  // ── 4. Fetch contact details ─────────────────────────────────────────────────
  const { data: contact, error: contactError } = await supabase
    .from('contacts')
    .select('id, first_name, last_name, email, phone, lead_score, organization_id')
    .eq('id', contact_id)
    .single()

  if (contactError || !contact) {
    console.error('[notify/hot-lead] Contact not found:', contact_id, contactError)
    return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
  }

  // ── 5. Build email ────────────────────────────────────────────────────────────
  const fullName = [contact.first_name, contact.last_name].filter(Boolean).join(' ') || 'Unknown'
  const contactUrl = `${LOANOS_APP_URL}/dashboard/contacts/${contact.id}`
  const adminEmail = process.env.LOANOS_ADMIN_EMAIL ?? 'styer.adam@gmail.com'

  const html = buildHotLeadEmail({
    fullName,
    email: contact.email ?? null,
    phone: contact.phone ?? null,
    score: score as number,
    contactUrl,
    triggeredAt: now.toLocaleString('en-US', { timeZone: 'America/Chicago', dateStyle: 'medium', timeStyle: 'short' }),
  })

  // ── 6. Send via Resend ────────────────────────────────────────────────────────
  let resendId: string
  try {
    resendId = await sendViaResend({
      to: adminEmail,
      subject: `Hot Lead: ${fullName} — Score ${score}`,
      body: html,
      tags: { template: 'hot_lead_notification', contact_id },
      log: {
        organizationId: contact.organization_id,
        contactId: contact.id,
        template: 'hot_lead_notification',
      },
    })
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error('[notify/hot-lead] Resend failed:', detail)
    return NextResponse.json({ error: 'Failed to send notification', detail }, { status: 500 })
  }

  // ── 7. Log dedup sentinel to activity_log ────────────────────────────────────
  // This is the record checked in step 3 to prevent repeat emails today.
  await supabase
    .from('activity_log')
    .insert({
      organization_id: contact.organization_id,
      contact_id: contact.id,
      action: 'hot_lead_notification',
      event_type: 'hot_lead_notification',
      type: 'hot_lead_notification',
      summary: `Hot lead email sent — score ${score}`,
      external_id: resendId || null,
    })
    .then(({ error }) => {
      if (error) console.error('[notify/hot-lead] activity_log insert failed (non-fatal):', error)
    })

  return NextResponse.json({ ok: true, message: 'Notification sent', resend_id: resendId })
}

// ── Email template ────────────────────────────────────────────────────────────

interface HotLeadEmailParams {
  fullName: string
  email: string | null
  phone: string | null
  score: number
  contactUrl: string
  triggeredAt: string
}

function buildHotLeadEmail(p: HotLeadEmailParams): string {
  const scoreColor = p.score >= 50 ? '#dc2626' : p.score >= 30 ? '#d97706' : '#16a34a'

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Hot Lead Alert</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background:#111827;padding:24px 32px;">
              <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.08em;color:#9ca3af;text-transform:uppercase;">LoanOS Alert</p>
              <h1 style="margin:4px 0 0;font-size:22px;font-weight:700;color:#ffffff;">Hot Lead Detected</h1>
            </td>
          </tr>

          <!-- Score callout -->
          <tr>
            <td style="padding:24px 32px 0;">
              <table cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;width:100%;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 4px;font-size:12px;font-weight:500;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;">Lead Score</p>
                    <p style="margin:0;font-size:36px;font-weight:800;color:${scoreColor};">${p.score}<span style="font-size:16px;font-weight:400;color:#9ca3af;">/100</span></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Contact details -->
          <tr>
            <td style="padding:20px 32px 0;">
              <table cellpadding="0" cellspacing="0" width="100%">

                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;">
                    <span style="font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;">Name</span>
                  </td>
                  <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;text-align:right;">
                    <span style="font-size:15px;font-weight:600;color:#111827;">${escapeHtml(p.fullName)}</span>
                  </td>
                </tr>

                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;">
                    <span style="font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;">Email</span>
                  </td>
                  <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;text-align:right;">
                    ${p.email
                      ? `<a href="mailto:${escapeHtml(p.email)}" style="font-size:15px;color:#2563eb;text-decoration:none;">${escapeHtml(p.email)}</a>`
                      : '<span style="font-size:15px;color:#9ca3af;">—</span>'}
                  </td>
                </tr>

                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;">
                    <span style="font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;">Phone</span>
                  </td>
                  <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;text-align:right;">
                    ${p.phone
                      ? `<a href="tel:${escapeHtml(p.phone)}" style="font-size:15px;color:#2563eb;text-decoration:none;">${escapeHtml(p.phone)}</a>`
                      : '<span style="font-size:15px;color:#9ca3af;">—</span>'}
                  </td>
                </tr>

                <tr>
                  <td style="padding:8px 0;">
                    <span style="font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;">Triggered</span>
                  </td>
                  <td style="padding:8px 0;text-align:right;">
                    <span style="font-size:14px;color:#374151;">${escapeHtml(p.triggeredAt)} CT</span>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:24px 32px 32px;">
              <a href="${p.contactUrl}"
                 style="display:inline-block;background:#111827;color:#ffffff;font-size:14px;font-weight:600;padding:12px 24px;border-radius:6px;text-decoration:none;letter-spacing:0.02em;">
                Open in LoanOS &rarr;
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 32px;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                Sent by LoanOS automation &middot; Internal ops only &middot; You receive this because you are the account owner.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
```

---

## n8n Workflow Update (`nOCDV73m4M0jyL1B`)

The live workflow ends at "Surface Hot Lead" (position `[1420, 200]`). Add two nodes after it.

### Node to add: Get Contact Details

Fetches the contact row so the Notify Adam node has name/email/phone without needing Supabase credentials in the LoanOS API route.

**Why fetch here rather than in the route:** The route already fetches from Supabase internally — this node is optional context passing. The route does its own DB lookup; you can skip this node and just pass `contact_id` + `score`. The node is included to keep the n8n execution log readable.

**Decision: pass only `contact_id` + `score` to the API route.** The route fetches its own contact record with the service client. No Supabase credentials needed in the Notify Adam node beyond what's already in the workflow. The "Get Contact Details" node is therefore NOT needed — skip it.

> Only add "Notify Adam" — one node, not two.

### Node to add: Notify Adam

```json
{
  "id": "notify-adam-hot-lead",
  "name": "Notify Adam",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.4,
  "position": [1640, 200],
  "parameters": {
    "method": "POST",
    "url": "https://loanos-astyer8345s-projects.vercel.app/api/notify/hot-lead",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        {
          "name": "Authorization",
          "value": "={{ 'Bearer ' + $env.LOANOS_AGENT_SECRET }}"
        },
        {
          "name": "Content-Type",
          "value": "application/json"
        }
      ]
    },
    "sendBody": true,
    "contentType": "raw",
    "rawContentType": "application/json",
    "body": "={{ JSON.stringify({ contact_id: $('Compute Score').first().json.contact_id, score: $('Compute Score').first().json.score }) }}",
    "options": {
      "response": {
        "response": {
          "neverError": true
        }
      }
    }
  }
}
```

**Note on `$env.LOANOS_AGENT_SECRET`:** n8n supports `$env.VAR_NAME` in expressions to read instance environment variables. Add `LOANOS_AGENT_SECRET` to the n8n instance environment variables (Settings → Environment Variables, or `.env` on self-hosted). Alternatively, store it as a custom n8n Credential of type "Generic Credential" (HTTP Header Auth) and reference it via the `credentials` field — either approach works.

**`neverError: true`** prevents the workflow from failing if the LoanOS endpoint returns a non-2xx. The notification is fire-and-forget relative to the score-update path; a failed email should not roll back the `hot_lead_dismissed` patch.

### Connection update

Add one new connection to the existing `connections` object:

```json
"Surface Hot Lead": {
  "main": [
    [
      { "node": "Notify Adam", "type": "main", "index": 0 }
    ]
  ]
}
```

The existing `Is Hot Lead?` connection already routes to `Surface Hot Lead` on the true branch. `Notify Adam` chains from `Surface Hot Lead`, so the execution order is:

```
Is Hot Lead? → [true] → Surface Hot Lead → Notify Adam
                       [false] → (end)
```

---

## Email Template

The template is embedded in the route implementation above (`buildHotLeadEmail`). Summary of the 5 data points rendered:

| Field | Source |
|-------|--------|
| Lead Score (large, color-coded) | `score` from request body |
| Name | `contacts.first_name + last_name` |
| Email (mailto: link) | `contacts.email` |
| Phone (tel: link) | `contacts.phone` |
| Triggered timestamp | Server `new Date()` formatted as Central Time |

Color coding for score: green ≥20 (threshold), amber ≥30, red ≥50. CTA button deep-links to `/dashboard/contacts/:id` in LoanOS.

---

## Deduplication Strategy

**Mechanism:** Before sending, the route queries `activity_log` for a row with:
- `contact_id` = the incoming contact
- `action` = `'hot_lead_notification'`
- `created_at` between `YYYY-MM-DDT00:00:00Z` and `YYYY-MM-DDT23:59:59Z` (today UTC)

If a row exists, respond `200` with `"Deduplicated"` and skip Resend.

After a successful send, insert a sentinel row with `action: 'hot_lead_notification'` into `activity_log`.

**Why `activity_log` not a dedicated table:** The table already has `contact_id`, `action`, and `created_at` indexes. No migration needed. The `action` value is namespaced enough to not collide.

**24-hour window logic:** UTC calendar day (midnight-to-midnight). If a lead triggers at 11:58 PM CT and again at 12:02 AM CT (next UTC day), a second email fires — acceptable. Using UTC avoids timezone-dependent behavior in a server-side route.

**What this prevents:** The n8n workflow fires every time `POST /webhook/lead-score-update` is called (e.g. on every web-lead or Calendly event). A hot lead can trigger the workflow 3-5 times in one session. Without dedup, Adam gets 3-5 emails in minutes.

**What this does NOT prevent:** If a contact's score drops below 20 and climbs back above 20 on a different calendar day, a new notification fires. This is correct behavior — it's a new event.

---

## Verification Steps

### 1. Unit test the route locally (without Vercel)
Not possible without `.env.local` — skip for local dev per known project gotcha.

### 2. Deploy and smoke test

```bash
# In loanos-clone:
npm run build    # must pass before push
git push         # Vercel deploys automatically
# Watch deployment via Vercel MCP: list_deployments → get_deployment_build_logs
```

### 3. Test the endpoint directly (after deploy goes READY)

```bash
# Replace TOKEN with the actual LOANOS_AGENT_SECRET value from Vercel env vars.
# Replace CONTACT_UUID with any real contact ID from Supabase.

curl -s -X POST \
  https://loanos-astyer8345s-projects.vercel.app/api/notify/hot-lead \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"contact_id":"CONTACT_UUID","score":25}' | jq .

# Expected: {"ok":true,"message":"Notification sent","resend_id":"..."}
# Check styer.adam@gmail.com inbox — email should arrive within 30s.
```

### 4. Test deduplication

```bash
# Call the same endpoint again immediately with the same contact_id.
# Expected: {"ok":true,"message":"Deduplicated — notification already sent today","sent_at":"..."}
# No second email in inbox.
```

### 5. Test auth rejection

```bash
curl -s -X POST \
  https://loanos-astyer8345s-projects.vercel.app/api/notify/hot-lead \
  -H "Authorization: Bearer wrongsecret" \
  -H "Content-Type: application/json" \
  -d '{"contact_id":"CONTACT_UUID","score":25}' | jq .

# Expected: {"error":"Unauthorized"} with 401 status
```

### 6. Wire n8n and run end-to-end

1. Open workflow `nOCDV73m4M0jyL1B` in the n8n editor.
2. Add the "Notify Adam" node (JSON above) and connect it after "Surface Hot Lead".
3. Add `LOANOS_AGENT_SECRET` to n8n environment variables (or use a credential).
4. Activate the workflow.
5. Trigger it: `POST https://styer.app.n8n.cloud/webhook/lead-score-update` with a contact that has a `calendly_booking` event in `activity_log` (score will be 20 — exactly at threshold).

```bash
curl -s -X POST \
  https://styer.app.n8n.cloud/webhook/lead-score-update \
  -H "Content-Type: application/json" \
  -d '{"contact_id":"CONTACT_WITH_CALENDLY_BOOKING_UUID"}'
```

6. Check n8n execution log — "Notify Adam" node should show `200 ok`.
7. Check inbox — email should arrive.

### 7. Verify `activity_log` sentinel

```sql
-- Run in Supabase SQL editor (project uuqedsvjlkeszrbwzizl)
SELECT contact_id, action, summary, external_id, created_at
FROM activity_log
WHERE action = 'hot_lead_notification'
ORDER BY created_at DESC
LIMIT 5;
```

---

## Rollback

**If the route is broken after deploy:**
- The n8n workflow will hit a non-2xx from the new node.
- Because `neverError: true` is set, the workflow continues — the `hot_lead_dismissed=false` patch still lands. Only the email is lost.
- To disable notifications without reverting code: in n8n, disconnect the "Notify Adam" node from "Surface Hot Lead" (delete the connection). The workflow continues to function without the new node.

**To fully revert the code change:**
```bash
git revert HEAD   # creates a revert commit
git push          # redeploys without the new route
```

No Supabase migration was added, so no migration rollback is needed. The `activity_log` rows written by this route use an existing table and existing columns — they can be left in place or deleted:

```sql
DELETE FROM activity_log WHERE action = 'hot_lead_notification';
```
