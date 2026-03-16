# Loans + Contacts Audit — 2026-03-16

## 1. Loan Row Click Routing

**File**: `src/app/dashboard/loans/page.tsx` lines 942-968

**Bug**: The `<tr>` element has NO onClick handler or cursor-pointer. Only the borrower name cell has links:
- Borrower name links to `/dashboard/contacts?id=${loan.contact_id}` (contacts page, not loan record)
- A sub-link for `loan_name` goes to `/dashboard/loans/${loan.id}` but only renders if BOTH borrower_name AND loan_name exist

**Root cause**: No row-level click handler. Borrower name routes to contacts, not the loan. There is no direct path from clicking a loan row → loan detail page unless you happen to see the tiny loan_name sub-link.

**Fix**: Add `onClick={() => router.push('/dashboard/loans/' + loan.id)}` to the `<tr>` + `cursor-pointer`. Keep borrower name linking to contact record (Fix 10).

---

## 2. Contacts Stage/Status Field

**Table**: `contacts` — already has `stage` column (TEXT, nullable)
**Current values**: `Active`, `Application`, `Closed`, `In Process`, `Lead`, `Other`, `Pre-Approved`, NULL

**No sync logic exists** between `loans.status` and `contacts.stage`. The only existing trigger on loans is `loans_updated_at` which updates `updated_at`.

**Fix**: Use existing `stage` column (not add a new `status` column). Create a trigger on `loans` that syncs `contacts.stage` when `loans.status` changes.

---

## 3. Loans Table — commission_amount

**EXISTS**: `commission_amount` (numeric, nullable) — already in the schema.
**Already referenced** in: loans/page.tsx (select query), loans/[id]/page.tsx (Loan interface), DashboardClient.tsx (commission display), dashboard/page.tsx (commission calculations).

**Fix needed**: Editable commission field on loan detail page, commission totals on loans list header.

---

## 4. Daily Briefing / Dashboard

**File**: `src/app/dashboard/page.tsx` line 42

**Already fixed**: The dashboard page DOES filter by user_id:
```ts
.eq('user_id', user.id)
```
Activity log also filtered: `.eq('user_id', user.id)` (line 128)

**No separate daily briefing page found.** The dashboard IS the daily briefing.

---

## 5. Hot List Pre-Approved

**No separate "Hot List Pre-Approved" component exists.** The "Pre-Approval" view is the `preapproval` smart list in `src/app/dashboard/loans/page.tsx` lines 61-64.

**Bug**: The loans list page queries do NOT filter by `user_id` at all (lines 332-358). This means ALL users' loans show up in every view, including pre-approval.

**Root cause**: Missing `.eq('user_id', session.user.id)` on all loans list queries.

---

## 6. Stage/Status Filter Definitions — All Locations

Hardcoded stage strings found in:

| File | Location | What |
|------|----------|------|
| `src/app/dashboard/loans/page.tsx` | Lines 41-66 | `SMART_LISTS` — 5 lists with status arrays |
| `src/app/dashboard/loans/page.tsx` | Lines 78-83 | `LOAN_STATUS_OPTIONS` — inline edit dropdown |
| `src/app/dashboard/loans/page.tsx` | Lines 87-124 | `PIPELINE_STAGES` — 6 in-process sub-stages |
| `src/app/dashboard/loans/page.tsx` | Lines 241-252 | `STAGE_TO_LIST` — dashboard param mapping |
| `src/app/dashboard/loans/page.tsx` | Lines 488-498 | `STAGE_STATUSES` — URL filter matching |
| `src/app/dashboard/page.tsx` | Lines 8-26 | `STAGE_MAP` — status → pipeline stage |
| `src/app/dashboard/page.tsx` | Lines 28-30 | `INACTIVE` set |
| `src/app/dashboard/page.tsx` | Line 32 | `ACTIVE_STAGES` array |
| `src/lib/stageNormalization.ts` | Lines 1-24 | `CANONICAL_STAGES` + `STAGE_MAP` |
| `src/components/dashboard/DashboardClient.tsx` | Lines 58-63 | `STAGE_COLORS` |
| `src/app/dashboard/contacts/page.tsx` | Lines 54-63 | `STAGE_TO_LIST` |

**Problem**: 6+ different definitions of what stages exist and how they group, scattered across files. No single source of truth.

---

## 7. DB Status Values vs. Code Expectations

**Actual `loans.status` values in DB:**
```
application_intake, APPLICATION_INTAKE, Cancelled, clear_to_close,
Closed, Dead, DISCLOSURE_SENT, funded, In Process, lead,
Loan in Process, On Hold, pre_approved, Pre-Approved, processing,
QUALIFICATION, RE_SUBMITTAL, Started, Suspended, underwriting,
UNDERWRITING_SUBMITTED
```

**Key mismatch**: Code expects `Loan Setup`, `Disclosed`, `Submitted to UW`, `Approved with Conditions`, `Resubmitted`, `Clear to Close` as canonical statuses, but the DB has Arive raw values like `DISCLOSURE_SENT`, `UNDERWRITING_SUBMITTED`, `RE_SUBMITTAL`, `clear_to_close`, `processing`, `underwriting`, etc.

The smart lists try to handle both canonical AND raw variants, leading to massive arrays of string variants.

---

## Summary of Required Fixes

1. **Loan row click**: Add row-level onClick → `/dashboard/loans/${loan.id}`
2. **Stage constants**: Single source of truth in `lib/constants/loan-stages.ts`
3. **user_id filter**: Add to ALL loans list queries (counts + data fetch)
4. **Contact sync trigger**: On loans.status change → update contacts.stage
5. **Commission UI**: Editable on loan detail, totals on loans list header
6. **Filterable lists**: URL params, filter chips, presets
7. **Borrower name → contact link**: Already partially done, needs refinement
