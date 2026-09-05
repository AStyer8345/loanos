# Jungo history reconciliation — September 5, 2026

The user requested a Loan Records layout resembling the restored Lead Desk and the full contact/loan history from the recent Jungo workbook. The cream/green page-specific styling is an explicit user-requested exception to the older black/gold THEME.md. Other routes keep their existing theme.

## Source and outcome

Primary source: `Master Mortgage Database - Jungo Contact and Loan Reconciliation.xlsx`, checked against `Jungo Loan Completion Package - 2026-09-02.xlsx` and the contact import audit. The original workbooks were read-only. Financial statement/document extraction was not involved.

| Source type | Existing match | Added | Needs review | Source entry only | Total |
| --- | ---: | ---: | ---: | ---: | ---: |
| Contact | 1,014 | 240 | 297 | 0 | 1,551 |
| Loan | 659 | 149 | 111 | 164 | 1,083 |

Existing blank fields were filled on 631 contacts and 585 loans. Adam's canonical inventory increased from 2,502 to 2,742 contacts and from 904 to 1,053 loans. These are inventory totals, not current lead or funded-period metrics. All new records belong to Adam's organization and are assigned to Adam.

A reviewed source match does not imply every conflicting spreadsheet field replaced the current record. Nonempty values were preserved. Source notes and other original fields remain in the encrypted archive. Current ARIVE rows were excluded from historical loan blank fills.

## Matching and exceptions

Contact matching required verified Jungo identity plus name, unique email/phone plus name, matching name/address, or a verified loan's primary contact. Household emails, nickname/maiden-name differences, duplicate existing contacts and insufficient identifiers remain unresolved. Multiple new contacts sharing a name were not automatically created.

Loan matching used reliable loan identifiers plus borrower identity, or borrower/property/amount with available source dates. Suggested Jungo matches on SAFE CREATE rows were not treated as verified IDs. Scientific-notation loan numbers were not used as exact identifiers. A separate transaction at the same address required separate loan/amount evidence. Source test, duplicate-create and lead-only rows remain source entries rather than canonical loans.

The 408 review entries are **not fully merged into canonical records**. They are available in `/dashboard/loans/history`, with the reason and original notes. Resolving them requires additional identity/transaction evidence, not blind deduplication.

## Storage and preservation

`historical_import_records` stores one row per organization/source/entity/external ID, the source workbook name and hash, destination IDs, disposition/reason and AES-256-GCM encrypted source payload. Original source rows, match candidates, completion audit and relevant before values are retained. Browser roles can read only organization-scoped metadata; ciphertext is server-only. The history API first establishes authorized IDs with the caller's RLS client, then decrypts only those rows for a limited display projection. It never returns the encrypted payload or unrelated source fields.

The one-time importer was service-only, bounded to Adam's organization, and removed after completion. A transaction held table locks while named business-side-effect triggers were temporarily disabled and restored to their original states. Foreign keys and RLS were not disabled. The import did not send communications, change drip/compensation state, fabricate contact activity, or overwrite existing nonempty fields. Preservation assertions passed, as did a rolled-back rehearsal and a subsequent zero-change replay. All business triggers were restored.

The 149 new historical loans have `imported_history=true`. Original stages remain visible in All Loans, Closed and Imported history; active-stage Loan Records views exclude those imports. The working Lead Desk still comes from its existing inquiry/preference evidence and does not activate historical inventory.

## UI and validation

Full-data reads are stably ordered and checked for incomplete pages, changing counts and duplicate IDs. Search and totals cover every matching record; table pagination only limits rendering to 100 rows. Bulk selection is limited to the current visible page. Unknown amounts remain unknown. The 2% card is an estimate, with recorded commissions still available through Columns.

The source history API returned 2,634 entries (about 853 KB), an authenticated owner received HTTP 200, and an anonymous request received HTTP 401. Focused pagination, field-projection and Lead Desk tests passed. Browser verification and release IDs are retained in the task handoff.

The earlier 15-minute ARIVE recovery schedule remains a separate pending task and was not activated by this import.
