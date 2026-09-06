# ARIVE / Lead Desk parity — September 6, 2026

The two deployed Lead Desk clients use the same operations API and the same
`simple-desk.ts` projection. Their former membership rule included saved
preferences and website inquiries only. An ARIVE application could be present
in the loans table and facts snapshot without appearing in Lead Desk.

The production database migration `arive_lead_desk_parity` fixes membership at
the shared database boundary. Accepted ARIVE facts now enroll active
applications by stable ARIVE loan ID, recover missing local loan copies, and
repair a previous no-match only when unique email/surname evidence agrees.
Saved notes, referral details, source attribution, flags, and reviewed identity
or multiple-scenario exceptions are preserved. The recovery does not create
contacts or link uncertain identities. Funded, archived and adverse historical
files are not newly enrolled. Existing tracked files remain visible as their
stages change.

Existing new-loan/status relays now normalize the amount in a database BEFORE
trigger: explicit total first, otherwise base plus explicitly known financed
fees. Unknown fees remain unknown. The AFTER trigger uses the resulting loan
amount for Lead Desk and accepts equal-source-time replays. The stale-event
guard remains in force. No frontend rebuild or workflow cutover is needed for
either deployed Lead Desk client to use this repair.

## Verified production result

- Complete ARIVE list: 78 accessible loans; 73 within the configured owner's
  scope or previously reviewed working IDs. All 73 freshly reconciled.
- 31 active applications added to Lead Desk; seven missing active loan copies
  restored. Existing 35 saved preferences were byte-for-byte preserved.
- All 11 ARIVE preapprovals represented. Six were previously absent.
- Ten preapprovals have usable amounts, totaling $6,187,115.75. Satish's two
  files remain a reviewed exception: $480,000 PREAPPROVED and $320,000
  APPLICATION_INTAKE. Neither was silently selected or added twice.
- Two existing loan copies updated from the fresh snapshot.
- No duplicate counted ARIVE IDs in the live-data projection.
- A separate new preference arrived concurrently; it was preserved.

Validation: rollback rehearsal, exact original-preference/contact preservation,
idempotent replay, numeric amount parity through the real loan/facts triggers,
unknown values, stale-event rejection, anonymous/authenticated denial of the
service function, and 12 passing projection tests. The security-advisor check
reported no new warnings. The regression SQL is
`tests/operations/arive-desk-parity.sql` and always rolls back.

## Remaining transport gap

The existing n8n new-loan and status workflows are active. Their accepted
events now reach the same Lead Desk membership and loan facts. The independent
full-list recovery workflow remains unpublished; its existing Zapier receiver
draft is not verified or enabled. n8n has an ARIVE webhook credential, not
verified direct ARIVE API credentials. A separate native ARIVE Lead event
relay was not found among the available n8n workflows. The one native Lead
currently returned by ARIVE already has an application in the tracked list;
it must not create another person or downgrade the application to NEW.

Browser access to both LoanOS and Zapier was denied because the browser could
not verify its admin-enforced security policy. The block was not bypassed.
Accordingly, authenticated visual verification and Zapier editor changes are
not claimed. Database checks and the live-data projection are verified.
No billing settings, paid-task ceilings, or recovery schedules were changed.
