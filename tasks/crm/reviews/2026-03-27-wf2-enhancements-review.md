# Review: WF2 Enhancements — Arive Status Update → Supabase
**Date:** 2026-03-27
**Workflow:** LoanOS — Arive Status Update → Supabase (`9JyzzwKac8v3uQ7d`)
**Reviewer:** Reviewer Subagent (automated adversarial review)

---

## Verdict: APPROVED WITH NOTES

---

## Check 1: Workflow Active — PASS

Build report confirms:
- PUT API returned `id: 9JyzzwKac8v3uQ7d`, `active: true`
- GET /workflows/9JyzzwKac8v3uQ7d confirmed `active: true`, `updatedAt: 2026-03-27T13:16:19.995Z`
- Node count increased from 15 → 17 (matches 2 new nodes added)

Direct MCP access to this workflow is blocked (MCP access not enabled in workflow settings — affects all review tooling, not a build defect).

---

## Check 2: Node Configuration — PASS

All 4 changes confirmed present in build report verification section:

| Node | ID | Change | Confirmed |
|------|----|--------|-----------|
| Extract Status Fields | arl-w2-002 | `closingDate: d(body.keyDates_estimatedFundingDate)` | YES — build report GET response confirmed |
| Update Loan Status | arl-w2-006 | `set('closing_date', f.closingDate)` | YES — build report GET response confirmed |
| Is Loan Funded? | arl-w2-015 | IF node, condition checks status list + contactId | YES — confirmed present |
| Sync Contact Rate+Balance | arl-w2-016 | PATCH contacts, method=PATCH, URL contains contacts table | YES — confirmed present |

Connection routing verified correct:
- Update Loan Status → Is Loan Funded? (main[0]) — replaces direct path to Log Status History
- Is Loan Funded? true → Sync Contact Rate+Balance
- Is Loan Funded? false → Log Status History
- Sync Contact Rate+Balance → Log Status History (both branches converge correctly)

---

## Check 3: Compliance — PASS

| Check | Result | Evidence |
|-------|--------|----------|
| Writes to contacts table (not external) | PASS | URL: `supabase.co/rest/v1/contacts` — internal Supabase only |
| No Salesforce routing | PASS | No Salesforce endpoints anywhere in build report |
| Fires only on funded/closed | PASS | IF gate (arl-w2-015) guards the PATCH node |
| PATCH only (additive, not DELETE) | PASS | Method=PATCH confirmed; only `current_rate`, `current_loan_balance`, `updated_at` written |
| contactId null check exists | PASS | IF condition: `!!$json.contactId` — null/undefined contactId takes false branch, skips sync |
| GLBA: No unencrypted data to non-Supabase destination | PASS | All writes stay within Supabase via service role key |
| RLS policies unchanged | PASS | Verified via live query — 4 policies on contacts (SELECT/INSERT/UPDATE/DELETE) unchanged |

RLS policies confirmed intact:
- contacts: Org members can read/insert/update; Org owners+admins can delete
- loans: Same pattern
- documents: Same pattern

---

## Check 4: Risk Assessment

### Risk A: closing_date may overwrite manually-set values — MEDIUM RISK (non-blocking)

**Finding:** Live DB shows 5 loans where `closing_date != est_closing_date`. This means at least 5 loans already have a closing_date that diverges from est_closing_date — likely set manually or via a prior process.

**Behavior of new code:** On every status update webhook from Arive, `closing_date` will be overwritten with `keyDates_estimatedFundingDate` — the same source as `est_closing_date`. If Arive sends a later status update after a loan funds, it will overwrite `closing_date` back to the estimated value, erasing any manually-entered actual closing date.

**Assessment:** This is a design-level issue, not a bug in the implementation as specified. The Builder correctly implemented the spec. However, the spec itself may be imprecise — `closing_date` (actual) and `est_closing_date` (estimated) should ideally come from different Arive fields (e.g., `keyDates_actualFundingDate` vs `keyDates_estimatedFundingDate`). If Arive exposes an actual funding date field, that should be the source for `closing_date`.

**Immediate impact:** Low — only affects records that receive a post-fund status update from Arive (uncommon). No existing data is corrupted by the build itself.

### Risk B: contact sync may overwrite manually-entered rate/balance — LOW RISK (non-blocking)

**Finding:** Live DB shows 0 contacts currently have `current_rate` or `current_loan_balance` populated (2,376 total contacts). No pre-existing values at risk.

**Behavior:** When a loan funds, the PATCH writes `$json.interestRate` and `$json.loanAmount` to the linked contact. If a loan officer had manually entered a different rate in the contacts table, this would overwrite it.

**Assessment:** Low practical risk today (columns are all NULL). Once data accumulates, a future re-trigger on a funded loan could overwrite a manually corrected value. Acceptable for current state.

---

## Check 5: Status Coverage Gap — NOTE (non-blocking)

**Finding:** Live status audit reveals the following funded/closed-equivalent values in the loans table:

| Status value | Count | Covered by IF condition? |
|---|---|---|
| `funded` | 13 | YES — lowercase match |
| `LOAN_FUNDED` | 1 | YES — `.toLowerCase()` handles |
| `Closed` | 741 | YES — `.toLowerCase()` → `closed` matches |
| `Cancelled` | 19 | NO — not in funded list (correct — excluded intentionally) |
| `Dead` | 6 | NO — correct |

The IF condition `['loan_funded','funded','closed'].includes(String($json.status || '').toLowerCase())` correctly uses `.toLowerCase()` which handles `LOAN_FUNDED`, `Closed`, `funded` uniformly. No gap on the funded/closed side.

Note: 741 loans with status `Closed` means the contact sync node will trigger for many historical loans if Arive ever re-sends status webhooks for them. Since `contactId` null check exists and `current_rate`/`current_loan_balance` columns start at NULL, this is low-risk but worth knowing.

---

## Verification Query Results

| Query | Result |
|-------|--------|
| `closing_date` column exists on loans | YES — date, nullable |
| `est_closing_date` column exists on loans | YES — date, nullable |
| `contact_id` column exists on loans | YES — uuid, nullable |
| `current_rate` column exists on contacts | YES — numeric, nullable |
| `current_loan_balance` column exists on contacts | YES — numeric, nullable |
| Total loans | 854 |
| Loans with closing_date | 642 |
| Loans with est_closing_date | 650 |
| Loans with contact_id | 786 |
| Funded/closed loans | 13 |
| Funded/closed loans WITH contact_id | 13 (100% coverage) |
| Loans where closing_date != est_closing_date | 5 |
| Contacts with current_rate populated | 0 |
| Contacts with current_loan_balance populated | 0 |
| RLS policies on contacts/loans/documents | Unchanged — all 12 policies intact |

---

## Issues Requiring Fix Before QA

**None.** Build is sound. All 4 nodes exist with correct config. Compliance checks pass. No data was corrupted.

---

## Notes for Next Session (non-blocking)

1. **closing_date source field:** Investigate whether Arive exposes a separate `keyDates_actualFundingDate` field. If so, `closing_date` should map from that field rather than `keyDates_estimatedFundingDate`. This would make the semantic distinction between `closing_date` (actual) and `est_closing_date` (estimated) meaningful and prevent overwrites after funding.

2. **MCP access on WF2:** Enable MCP access in WF2 settings so future reviewer subagents can pull live node code directly rather than relying solely on build report evidence.

3. **Status normalization:** The loans table has 22 distinct status values with mixed casing (`Closed`, `CLEAR_TO_CLOSE`, `clear_to_close`, etc.). This is a pre-existing data quality issue — not introduced by this build — but worth a normalization pass in a future session.
