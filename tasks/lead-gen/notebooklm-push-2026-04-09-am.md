# Lead Gen AM Session Note — 2026-04-09

**Session:** 2026-04-09 03:00–03:45 AM CT
**Agent:** Lead Gen AM
**Focus:** Refi Watch Sequences A + D — Build complete

## What Was Built

### Sequence A — Refi Watch Rate Drop Alert
- **n8n Workflow ID:** `iyKFy0ODkyyqQaAS`
- **Status:** INACTIVE (needs Outlook credential + Set Rate webhook called)
- **Trigger:** Daily CRON 7AM CT
- **Rate source:** Reads from `activity_log` WHERE `action='refi_rate_update'` (deposited by Set Rate webhook `3iXImUkjgMitpJKt`)
- **Threshold:** Current rate ≤ 6.00%
- **Segment:** Past clients with `interest_rate ≥ 6.75%` (closed loans, has email)
- **Dedup:** Per-loan 30-day check against `activity_log` (action=rate_drop_alert)
- **Email:** HTML, personalized savings estimate (spread × loan_amount/12 × 0.75), Reg Z disclaimer, CAN-SPAM footer
- **Activity log:** `action='rate_drop_alert'`, `organization_id` required

### Sequence D — Pre-Drop Warm-Up
- **n8n Workflow ID:** `W0K4YDzkZd0Hzv6g`
- **Status:** INACTIVE (manual trigger — requires Adam approval, irreversible)
- **Trigger:** Manual (one-shot)
- **Audience:** All past clients NOT already in refi watch system (cross-referenced against activity_log actions: refi_warmup, anniversary_checkin, rate_drop_alert)
- **Email:** HTML warm-up explaining proactive rate monitoring, personalized with current rate, no hard pitch
- **Activity log:** `action='refi_warmup'`

## Resolved Blockers
- **FRED API key blocker resolved:** Sequence A uses Option A (manual Set Rate webhook) — FRED API only needed for future Option B (fully automated Thursday pulls). No dependency on FRED key for current build.
- **Rate dedup approach:** fullResponse:true on HTTP GET ensures IF node always receives 1 item even on empty Supabase response; checks `$json.body.length === 0`

## All Refi Watch Workflows — Complete Index
| Workflow | ID | Status |
|----------|-----|--------|
| Set Rate webhook | `3iXImUkjgMitpJKt` | INACTIVE |
| Sequence A — Rate Drop Alert | `iyKFy0ODkyyqQaAS` | INACTIVE |
| Sequence B — Anniversary Check-In | `ZUeGy8u8P4o6DPM3` | INACTIVE |
| Sequence D — Pre-Drop Warm-Up | `W0K4YDzkZd0Hzv6g` | INACTIVE |

## Remaining Blockers (Adam Actions)
1. Connect Microsoft Outlook credential in n8n UI (blocks A, B, D)
2. Activate Set Rate webhook + call once with current rate (blocks Seq A from firing)
3. Activate Sequence A after Set Rate is live
4. Review Sequence D email copy → manually trigger when approved (irreversible)
5. FRED API key registration (optional, unlocks Option B future automation)

## Technical Patterns Used
- `$('Node Name').first().json` to share data across code nodes without Merge node
- `fullResponse: true` on HTTP GET → `$json.body.length === 0` for Supabase empty-array dedup
- SplitInBatches loop: output[0] → email+log+wait → loop back; output[1] → notify Adam
- All emails: Outlook credential ID `RkXvebinnei87gz4`, v2 node, HTML body type
