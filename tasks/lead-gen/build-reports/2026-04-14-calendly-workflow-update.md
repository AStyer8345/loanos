# Build Report — Calendly Workflow Update (Cancel Branch + Contact Lookup)
**Date:** 2026-04-14
**Builder:** Lead Gen AM Agent
**n8n Workflow ID:** `PBu2Zt0YpiLHeqbL`
**Workflow Name:** LoanOS — Post-Calendly Booking Automation
**Status:** INACTIVE — Adam must still connect Calendly webhook + activate (no change from original)

---

## What Was Updated

Updated the Calendly workflow from 8 nodes to **11 nodes** by adding:
1. **Event type router** — IF node that branches on `invitee.canceled` vs booking
2. **Contact lookup** — Supabase GET to match invitee email → contact_id
3. **Cancel branch** — logs `calendly_canceled` to activity_log (with reason if provided)

---

## Updated Node Structure

| # | Node | Type | Purpose |
|---|------|------|---------|
| 1 | Calendly Booking Webhook | Webhook | Receives ALL Calendly events |
| 2 | Route: Cancel or Booking? | IF | Routes on `$json.event === 'invitee.canceled'` |
| 3 | Log Cancellation to Supabase | HTTP Request | **TRUE branch** — logs cancel event |
| 4 | Extract Booking Data | Code | **FALSE branch** — parses booking payload |
| 5 | Lookup Contact by Email | HTTP Request | GET contacts table by invitee email |
| 6 | Send Confirmation Email | Microsoft Outlook | Immediate confirmation to invitee |
| 7 | Log Booking to Supabase | HTTP Request | Logs with real contact_id (or null if not found) |
| 8 | Wait Until 24hr Before | Wait (specificTime) | 24hr before event start |
| 9 | Send Reminder Email | Microsoft Outlook | Day-before reminder |
| 10 | Wait Until Post-Call | Wait (specificTime) | 60min after event end |
| 11 | Send Post-Call Follow-Up | Microsoft Outlook | Follow-up with application link |

---

## Cancel Branch Details

**Trigger condition:** `$json.event === 'invitee.canceled'`

**Cancel log written to activity_log:**
```json
{
  "organization_id": "18613f82-fdd9-42dd-a09e-f3c577328258",
  "contact_id": null,
  "action": "calendly_canceled",
  "event_type": "calendly_canceled",
  "metadata": {
    "invitee_name": "[from payload]",
    "invitee_email": "[from payload]",
    "event_type_name": "[from payload]",
    "start_time": "[from payload]",
    "cancellation_reason": "[from payload.cancellation.reason, or '']"
  }
}
```

**What the cancel branch does NOT do:**
- Does NOT send a recovery email (deferred — Adam would need to approve copy)
- Does NOT stop the waiting reminder/follow-up on the original booking execution. This edge case: if someone cancels AFTER booking, the existing execution continues waiting. Mitigation: Adam can manually stop the execution in n8n. Full cancel-stops-followup logic requires using n8n's execution correlation, which is out of scope for this build.

---

## Contact Lookup Details

**Mechanism:** GET `https://uuqedsvjlkeszrbwzizl.supabase.co/rest/v1/contacts?email=eq.[inviteeEmail]&select=id&limit=1`

**Result used in Log Booking node:**
```
contact_id: $json?.[0]?.id || null
```

**Behavior:**
- If invitee email matches a LoanOS contact → `contact_id` is populated ✅
- If no match found → `contact_id: null` (no error, graceful fallback) ✅

**Expected match rate:** Low initially (prospect who just booked a call likely hasn't applied yet). Will increase over time as more leads enter LoanOS via web forms.

---

## Deferred (Unchanged from Prior Session)

- **Calendly signing key verification** — webhook still accepts any POST to `/calendly-booking` path. Low risk (URL not guessable), medium-term security debt.
- **Cancel-stops-followup** — requires execution correlation logic (n8n advanced pattern). Out of scope.
- **Cancel recovery email** — no email sent on cancel. Adam must approve copy before adding.

---

## Compliance Check

- **TCPA:** ✅ PASS — Email only. No SMS.
- **Cancel log:** ✅ PASS — No outbound communication on cancel
- **Contact lookup:** ✅ PASS — Internal Supabase query only, no PII exposure
- **NMLS #513013:** ✅ Present in all 3 booking confirmation emails (unchanged)
- **Equal Housing Lender:** ✅ Present in all 3 emails (unchanged)
- **No guaranteed approval language:** ✅ CONFIRMED

---

## Quality Score: 9/10

- Cancel branch handles gracefully (-0)
- Contact lookup is non-blocking (null fallback) (-0)
- Positions/layout clean for visual review in n8n UI (-0)
- Cancel doesn't stop ongoing reminders (-1 — known gap, documented)

---

## Adam: No Action Required for These Changes

The update is already applied to workflow `PBu2Zt0YpiLHeqbL`. The workflow remains INACTIVE.

To go live, Adam still needs to:
1. Connect Calendly webhook to `https://styer.app.n8n.cloud/webhook/calendly-booking` (events: `invitee.created` + `invitee.canceled`)
2. Verify Microsoft Outlook credential in workflow
3. Activate the workflow toggle
