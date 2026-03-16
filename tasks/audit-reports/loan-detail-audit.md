# Loan Detail Page Audit — 2026-03-16

## 1. Header Fields Mapping

**File**: `src/app/dashboard/loans/[id]/page.tsx` lines 450-515

| Header Field | Supabase Column | Exists? | Notes |
|---|---|---|---|
| Loan Amount | `loan_amount` | YES (numeric) | Conditional render — hidden if null |
| Product | `loan_program` / `loan_type` + `loan_term` | YES | Composite label |
| Rate | `interest_rate` | YES (numeric) | Shows % format |
| Close Date | `closing_date` / `estimated_closing_date` | YES (date) | Falls back to estimated |
| Loan Officer | Hardcoded "Adam Styer" | N/A | No DB column |
| Commission | `commission_amount` | YES (numeric) | Editable inline (added in prior sprint) |
| Realtor | `referring_agent_name` | YES | Conditional render |

### Missing from header (requested):
| Field | Column Needed | Exists in DB? |
|---|---|---|
| Est. Close Date | `estimated_closing_date` | YES (date, nullable) |
| Rate Lock Date | `rate_lock_date` | **NO — needs ADD COLUMN** |
| Lock Expiry | `rate_lock_expiration` | YES (date, nullable) |
| Days Locked | `rate_lock_days` | **NO — needs ADD COLUMN** |

---

## 2. Activity Tab — Full Trace

**File**: `src/app/dashboard/loans/[id]/page.tsx` lines 1556-1702

### Form (Log Call / Log Email / Log Text)
- Lines 1594-1603: Three buttons open inline modal (`logModal` state)
- Lines 1607-1636: Modal with notes textarea + Save/Cancel
- **Requires notes to be non-empty** (`!logNotes.trim()` guard on line 1564)

### On Submit (handleLogActivity, lines 1563-1578):
```typescript
await supabase.from('activity_log').insert({
  loan_id: loanId,
  action: `Logged ${logModal}`,
  type: logModal,
  summary: logNotes.trim(),
  entity_type: 'loan',
  metadata: { activity_type: logModal },
})
```

### Failure Points Found:
1. **Missing `user_id` on insert** — RLS is enabled on `activity_log`. If the RLS policy requires `user_id = auth.uid()` for INSERT, the insert silently fails. Even if it succeeds, rows won't have user attribution.
2. **ActivityRow interface is incomplete** (line 134-140):
   ```typescript
   interface ActivityRow {
     id: string
     created_at: string
     action: string
     entity_type: string | null
     metadata: Record<string, unknown> | null
   }
   ```
   Missing: `type`, `summary` — so logged call/email/text notes are NEVER displayed in the feed.
3. **fetchAll select is incomplete** (line 319):
   ```
   .select('id, created_at, action, entity_type, metadata')
   ```
   Missing: `type`, `summary` — even though they're written on insert.
4. **No optimistic update** — calls `onRefresh()` which re-fetches all data (lines 1576-1577). Feed updates only after server round-trip.
5. **Feed display shows `item.action` only** (line 1681) — never shows notes/summary.

### Table: `activity_log` (EXISTS)
Columns: `id, created_at, action, contact_id, entity_id, entity_type, external_id, loan_id, metadata, raw_payload, summary, type, user_id`

### Table: `loan_activity` — DOES NOT EXIST
The task spec requests creating this table. However, the entire codebase uses `activity_log`. **Decision: fix `activity_log` flow rather than create a parallel table.**

---

## 3. Activity Feed Display Issues

After saving:
- Calls `onRefresh()` → re-fetches from `activity_log` (works, but not optimistic)
- The re-fetched data only includes `id, created_at, action, entity_type, metadata`
- **Notes (summary) are lost on read** even though they were written
- **Type (call/email/text) is lost on read** — no icon differentiation possible
- Each activity shows: action text + relative timestamp + metadata JSON dump
- No type-specific icons (phone/envelope/message)

---

## 4. Loans Table Column Check

| Column | Exists? | Type | Notes |
|---|---|---|---|
| `estimated_closing_date` | YES | date | Already in Loan interface (line 67) |
| `rate_lock_expiration` | YES | date | Already in Loan interface (line 66) |
| `rate_lock_date` | **NO** | — | Needs ALTER TABLE ADD COLUMN |
| `rate_lock_days` | **NO** | — | Needs ALTER TABLE ADD COLUMN |
| `interest_rate` | YES | numeric | Working correctly |
| `commission_amount` | YES | numeric | Working, but bad test data |

---

## 5. Commission Bug

**Root cause: Bad test data, not code bug.**

The display code (`fmtCurrency`) is correct. The issue is corrupt commission values:

| Borrower | loan_amount | commission_amount | Expected (1%) |
|---|---|---|---|
| Priya Nair | $398,000 | **$1,000,000** | $3,980 |
| Derek Cho | $615,000 | **$10,000** | $6,150 |
| Maria Gutierrez | $362,000 | **$100,000** | $3,620 |

All other test loans have correct 1% commission values.

---

## 6. Key Loan Details Section

**File**: lines 631-689 (KeyDetailsCard)

Currently shows: Purchase Price, Down Payment, Loan Amount, Rate/APR, Monthly P&I, Term, LTV, CLTV, DTI, Loan Type, AUS Result, MI Required.

**Missing**: Estimated Close Date, Rate Lock Expiry — need to be added.

---

## 7. Milestones

**File**: lines 772-851 (MilestoneTimeline)

Uses local `PIPELINE_STAGES` (line 272) and `getStageIndex()` (line 274) — NOT importing from `loan-stages.ts`. Needs alignment to canonical stages.

Current milestone labels: Application Received, Disclosures Sent (LE), Submitted to Processing, Submitted to Underwriting, CTC Issued, Closing Docs Drawn, Funded.

Missing from spec: "Approved w/ Conditions" milestone.

---

## Summary of Required Changes

1. **Schema**: Add `rate_lock_date` (DATE) and `rate_lock_days` (INTEGER) to loans table
2. **Activity fix**: Add `user_id`, `type`, `summary` to ActivityRow + select; optimistic update; display notes + type icons
3. **Header row 2**: Est. Close Date, Rate Lock Date, Lock Expiry, Days Locked
4. **Rate lock badges**: Warning within 5 days, expired badge
5. **Commission data fix**: Correct 3 bad test values
6. **Key Details**: Add close date + lock expiry rows
7. **Milestones**: Import canonical stages, add Approved w/ Conditions
8. **Test data**: Populate estimated_closing_date + rate lock fields for in-process loans
