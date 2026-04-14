# Build Report — Refi Watch Sequence C: Quarterly Rate Review
Date: 2026-04-10 AM
Agent: Lead Gen Builder
Status: COMPLETE — workflow created, INACTIVE pending Outlook credential verify

---

## What Was Built

**n8n Workflow:** LoanOS — Refi Watch Quarterly Rate Review
**Workflow ID:** `LfLSDgqgb6yCe93C`
**n8n URL:** https://styer.app.n8n.cloud/workflow/LfLSDgqgb6yCe93C
**Status:** INACTIVE — Adam must activate after verifying Outlook credential on "Send Quarterly Review" node

---

## Workflow Architecture (12 nodes)

| Node | Type | Purpose |
|------|------|---------|
| Quarterly Trigger (8AM CT) | scheduleTrigger | CRON `0 13 1 1,4,7,10 *` — Jan/Apr/Jul/Oct 1st at 8am CT |
| Get All Past Clients | httpRequest | Supabase loans — all with closing_date + contact join |
| Filter Eligible Clients | code | Exclude: no email, email_opt_out=true, test emails |
| Any Eligible? | if | Stop if 0 eligible clients found |
| Process Each Client | splitInBatches | 1 at a time (Outlook rate limit safety) |
| Check 90-Day Silence | httpRequest | Query activity_log: any refi touch in last 90d? |
| Not Recently Touched? | if | body.length === 0 → YES send, → NO skip to next |
| Build Quarterly Review Email | code | Personalized HTML email with market snapshot |
| Send Quarterly Review | microsoftOutlook | From adam@thestyerteam.com → borrower_email |
| Log Quarterly Review | httpRequest | POST to activity_log (action=quarterly_rate_review) |
| Wait 2s | wait | Pace sends — Outlook rate limit protection |
| Notify Adam — Quarterly Run Done | microsoftOutlook | Summary notification to Adam when run completes |

---

## Trigger Logic

**CRON:** `0 13 1 1,4,7,10 *` = 1st of January, April, July, October at 13:00 UTC (8:00 AM CT)

**Audience:** Past clients meeting ALL:
- `closing_date IS NOT NULL` (confirmed past loan)
- `contact.email IS NOT NULL`
- `contact.email_opt_out != true`
- Email does not contain "test"
- No entry in `activity_log` with action in `(rate_drop_alert, anniversary_checkin, refi_warmup, quarterly_rate_review)` in the last 90 days

**90-day dedup rationale:** Prevents overlap with Sequence A (rate drop — can fire anytime), Sequence B (anniversary — monthly), and Sequence D (warm-up — one-time). A client who received Sequence A in the last 90 days doesn't need Sequence C too.

---

## Email Design

**Subject:** `[FIRST_NAME] — quick rate snapshot from Adam`

**Tone:** Soft quarterly check-in. No urgency. No savings calculation (rates not below Seq A threshold). Relationship maintenance for the ~400-600 clients who aren't currently in rate-drop territory.

**Key content:**
- Current Austin rate snapshot (30yr/15yr/home values — hardcoded as approximate, with Reg Z disclaimer)
- 3 light CTAs: situation changed?, rate monitoring, equity options
- Closing: "no action needed — just keeping you in the loop"

**Compliance:**
- NMLS #513013 in signature ✅
- Physical address: 5900 Balcones Drive, Suite 100, Austin TX 78731 ✅
- Equal Housing Lender ✅
- Reg Z: "This is not an offer to lend. Rate information is approximate." ✅
- Reply STOP opt-out ✅
- No guaranteed approval language ✅
- No protected class targeting ✅

---

## Activity Log Pattern

```json
{
  "action": "quarterly_rate_review",
  "organization_id": "18613f82-fdd9-42dd-a09e-f3c577328258",
  "loan_id": "<loan_id>",
  "contact_id": "<contact_id>",
  "to_address": "<borrower_email>",
  "summary": "Quarterly rate review sent. Borrower rate: 7.25%."
}
```

---

## Creation Method Note

n8n MCP `validate_workflow` and `create_workflow_from_code` tools are currently broken (server error: `builder.regenerateNodeIds is not a function`). Workflow was created directly via n8n REST API:
`POST https://styer.app.n8n.cloud/api/v1/workflows`

---

## Known Issues / Follow-up

1. **Outlook credential:** Must be connected on "Send Quarterly Review" node before activation. Same credential as Seq A/B.
2. **Rate values hardcoded:** Email copy has "~6.8%" and "~6.2%" hardcoded. These should be updated at activation time or via a future dynamic rate pull.
3. **Sequence D org_id bug (NOT this workflow):** Sequence D (`W0K4YDzkZd0Hzv6g`) uses `org_id=45a5b7e8-...` instead of the correct `18613f82-...`. This will cause it to find 0 past clients when triggered. Flagged for separate fix session.

---

## Refi Watch Complete Status

| Workflow | ID | Status |
|----------|----|--------|
| Set Rate Webhook | `3iXImUkjgMitpJKt` | ✅ ACTIVE |
| Sequence A — Rate Drop Alert | `iyKFy0ODkyyqQaAS` | ✅ ACTIVE (daily 7am CT) |
| Sequence B — Anniversary Check-In | `ZUeGy8u8P4o6DPM3` | ✅ ACTIVE (monthly, 1st) |
| Sequence C — Quarterly Rate Review | `LfLSDgqgb6yCe93C` | ⏳ INACTIVE — verify Outlook |
| Sequence D — Pre-Drop Warm-Up | `W0K4YDzkZd0Hzv6g` | ⏳ INACTIVE — Adam manual trigger (has org_id bug) |
