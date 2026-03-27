# Build Report: WF2 Enhancements
**Date:** 2026-03-27
**Workflow:** LoanOS — Arive Status Update → Supabase (`9JyzzwKac8v3uQ7d`)
**Status after update:** Active

---

## Summary of Changes

### Change 1: Add `closingDate` to Extract Status Fields (arl-w2-002)

Added `closingDate` field alongside the existing `estClosingDate` field, both mapped from `body.keyDates_estimatedFundingDate`. This allows downstream nodes and the loans table to populate both columns simultaneously.

**Node:** `arl-w2-002` — Extract Status Fields
**What changed:** Added one line to the `jsCode` parameter:
```js
closingDate: d(body.keyDates_estimatedFundingDate),
```
Inserted immediately after `estClosingDate: d(body.keyDates_estimatedFundingDate),`

---

### Change 2: Add `closing_date` to Update Loan Status PATCH body (arl-w2-006)

Added `closing_date` to the Supabase PATCH body alongside `est_closing_date`.

**Node:** `arl-w2-006` — Update Loan Status
**What changed:** Added `set('closing_date', f.closingDate);` immediately after `set('est_closing_date', f.estClosingDate);` in the body expression.

---

### Change 3: Contact Rate+Balance Sync on Funded/Closed status (new nodes)

Added two new nodes that trigger when a loan reaches a funded/closed status AND has a linked contact. This writes the final rate and loan balance back to the `contacts` table.

#### New Node: Is Loan Funded? (arl-w2-015)
- **Type:** `n8n-nodes-base.if` (typeVersion 2)
- **Position:** [1820, 192]
- **Condition:** `['loan_funded','funded','closed'].includes(String($json.status || '').toLowerCase()) && !!$json.contactId`
- **True branch:** → Sync Contact Rate+Balance
- **False branch:** → Log Status History (original next node)

#### New Node: Sync Contact Rate+Balance (arl-w2-016)
- **Type:** `n8n-nodes-base.httpRequest` (typeVersion 4.2)
- **Position:** [2060, 96]
- **Method:** PATCH
- **URL:** `https://uuqedsvjlkeszrbwzizl.supabase.co/rest/v1/contacts?id=eq.{{ $json.contactId }}`
- **Auth:** service role key (same as all other Supabase nodes in the workflow)
- **Body fields set:** `current_rate` (from `$json.interestRate`), `current_loan_balance` (from `$json.loanAmount`), `updated_at`
- **Connects to:** Log Status History (fire-and-forget; both branches converge at Log Status History)

#### Connection changes
| From | Branch | To (before) | To (after) |
|------|--------|-------------|------------|
| Update Loan Status | main[0] | Log Status History | Is Loan Funded? |
| Is Loan Funded? | true | — | Sync Contact Rate+Balance |
| Is Loan Funded? | false | — | Log Status History |
| Sync Contact Rate+Balance | main[0] | — | Log Status History |

---

## Verification

- PUT API returned `id: 9JyzzwKac8v3uQ7d`, `active: true`, node count 17 (was 15)
- GET /workflows/9JyzzwKac8v3uQ7d confirmed `active: true`, `updatedAt: 2026-03-27T13:16:19.995Z`
- Response confirmed: `closingDate` in Extract node code, `closing_date` in Update Loan Status body
- New nodes `Is Loan Funded?` and `Sync Contact Rate+Balance` confirmed present in response

---

## Issues Encountered

None. All three changes applied cleanly in a single PUT. No validation errors.

---

## Nodes Affected

| Node ID | Node Name | Change |
|---------|-----------|--------|
| arl-w2-002 | Extract Status Fields | Added `closingDate` field |
| arl-w2-006 | Update Loan Status | Added `set('closing_date', f.closingDate)` |
| arl-w2-015 | Is Loan Funded? | **New node** — IF gate for funded/closed status |
| arl-w2-016 | Sync Contact Rate+Balance | **New node** — PATCH contacts with rate + balance |
