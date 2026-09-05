# Shared operational home

The dashboard and the existing Lead Desk use the same organization-scoped operational records. The four views are Today, Leads, Pipeline and Metrics. Existing full contact, loan, settings and campaign screens remain available.

## Access and freshness

`/api/operations` and its child routes accept either the existing LoanOS session cookie or a normal Supabase user access token. The server verifies the user and organization before every read or mutation. Bearer requests do not use page-login redirects. Database reads explicitly disable caching, including reads immediately after a handoff or completion.

The snapshot loads complete paged results and fails closed if any required source is unavailable. All data queries include the organization filter. Inquiry ciphertext remains inaccessible to browser database roles: the server first obtains authorized IDs through RLS, then reads only those encrypted payloads within the same organization and returns minimal identity and attribution fields. Message details are loaded on demand after checking the linked contact or loan. Neither raw financial questionnaires nor document bodies are included in the snapshot.

The Lead Desk requires sign-in and forwards the user's bearer token to the fixed LoanOS origin. It holds no service credential. Its former anonymous D1 read/write endpoints are retired; saved D1 records remain preserved.

## Editing and ownership

Task changes support explicit assignment, next action, waiting reason, due date, completion and escalation. A task assigned to the loan officer does not by itself mean a loan officer decision is needed. Composite foreign keys prevent cross-organization assignees and record links. Record ownership uses the validated `set_operational_owner` function. Saved working status, notes, hidden flags and priority flags remain separate from source loan fields and compensation.

The historical Lead Desk migration preserved every saved edit and retained ambiguous identities for review. It did not convert saved amount notes into loan amounts. Historical inquiry imports create evidence without replaying old tasks or notifications.

## Measurement contract

- Pipeline is the current active loan inventory and ignores acquisition dates.
- Milestone-period reporting uses the first active source-dated event per entity and milestone. Corrected versions remain in history.
- Acquisition cohorts follow the same legitimate inquiries through later milestones. Repeat inquiries remain separate opportunities. Human-reviewed inquiry-to-loan links establish attribution; matching a person alone does not establish the originating inquiry.
- Conversion cards disclose numerator, denominator, unknown attribution and cohort age. Automated confirmations do not establish engagement. Operational application milestones do not redefine legal disclosure triggers.
- Money totals deduplicate loan IDs and use recorded ARIVE/manual gross compensation. Compensation-plan estimates are excluded. Funded gross, paid compensation and net income are distinct. Unsupported spend and probability calculations remain unavailable.
- ARIVE evidence backfill reads explicit event dates, preserves date-only precision and does not mutate loan terms or financial fields. Scheduled closing dates are not closing or funding evidence.

All selected-result totals follow owner, source, stage, search and applicable date filters. Source health distinguishes page load time from successful source synchronization.

## Onboarding boundary

Ordinary profile editing cannot change organization or role. Service-only functions atomically claim a new organization or attach an invited identity, verify the actual auth identity, refuse cross-organization membership changes, and preserve existing roles on invitation retry.

## Validation and recovery

Validation covers synthetic cohort cases, task parsing/routing, inquiry normalization/idempotency, rolled-back two-organization SQL checks, trusted onboarding and invitation retries, and authenticated HTTP reads and controlled internal task mutations. Production delivery proof separately records provider acceptance and matching received message headers.

Keep the preceding deployment available for application rollback. Applied additive migrations preserve records and history. External workflow and schedule recovery snapshots are maintained privately outside the source repository; do not commit credentials, mailbox headers or borrower snapshots.
