# Build Report — Refi Watch Seq D Bug Fix + System Verification
Date: 2026-04-11 AM
Session Type: Maintenance + Verification

---

## What Changed

### Seq D org_id Bug Fix
- **Workflow:** LoanOS — Refi Watch Pre-Drop Warm-Up (`W0K4YDzkZd0Hzv6g`)
- **Method:** n8n REST API PUT (SDK tools still broken — `regenerateNodeIds` error)
- **Bug:** Placeholder org_id `45a5b7e8-7c4d-4e2a-9f11-123456789abc` was in 3 nodes
  - "Get All Past Clients" → `org_id` query param
  - "Get Already Touched" → `organization_id` query param
  - "Log Warm-Up Send" → `organization_id` in POST body
- **Fix:** All 3 replaced with `18613f82-fdd9-42dd-a09e-f3c577328258` (Adam's org)
- **Verification:** Re-fetched workflow from n8n API — 0 wrong occurrences, 3 correct occurrences
- **Updated at:** 2026-04-11T08:52:25.293Z

---

## Verification Findings

### Workflow Status (all 5 Refi Watch)
| Sequence | ID | Active | triggerCount |
|----------|-----|--------|-------------|
| Set Rate | `3iXImUkjgMitpJKt` | ✅ | 1 |
| Seq A — Rate Drop Alert | `iyKFy0ODkyyqQaAS` | ✅ | 1 |
| Seq B — Anniversary Check-In | `ZUeGy8u8P4o6DPM3` | ✅ | 1 |
| Seq C — Quarterly Rate Review | `LfLSDgqgb6yCe93C` | ❌ | 0 |
| Seq D — Pre-Drop Warm-Up | `W0K4YDzkZd0Hzv6g` | ❌ | 0 |

### Supabase activity_log Verification
| Action | Count | Interpretation |
|--------|-------|----------------|
| refi_rate_update | **0** | Set Rate webhook never called with valid rate |
| rate_drop_alert | 0 | Seq A idle — no rate to check against |
| anniversary_checkin | 0 | Expected — Seq B first run May 1 |
| refi_warmup | 0 | Seq D not yet triggered (correct — Adam's decision) |

### Critical Gap
Set Rate webhook is ACTIVE (triggerCount:1) but NO `refi_rate_update` entries exist in activity_log. The single trigger count is likely from a test invocation during activation, not a valid rate POST.

**Impact:** Seq A runs at 7am CT daily but immediately exits — there's no rate to check against. Zero alerts have been sent. The entire rate-monitoring system is dormant.

**Fix required:** Adam must POST current market rate:
```bash
curl -X POST https://styer.app.n8n.cloud/webhook/refi-watch-set-rate \
  -H "Content-Type: application/json" \
  -d '{"rate": 6.39}'
```
Then weekly on Mondays to keep rate current.

### contact_id nullability
Confirmed: `contact_id` is nullable in activity_log. The Set Rate workflow's Store Rate node does NOT pass `contact_id` — this is intentional and works fine.

---

## ADAM-TODO Items Added
1. 🚨 Set Rate webhook never called — POST current rate immediately
2. ✅ Trigger Seq D — bug fixed, safe to run (IRREVERSIBLE — Adam review first)
