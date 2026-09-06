# Team access and compensation privacy

Tiffany Garcia uses a restricted LoanOS team workspace at `/team`, with her own 25-bps (0.25%) estimate for each known loan amount. Adam's existing 200-bps plan and compensation records are not changed. All figures in the team workspace, including funded records and exports, are estimates, not a payroll or payment ledger.

## Permission boundary

- Membership, rate, and enabled/disabled state live in `private.staff_access`, with no client table grants. Account email is reserved before invitation; an auth trigger binds the reservation to the immutable user ID at creation. Changing email or user metadata cannot change privileges.
- Restricted users intentionally do **not** receive ordinary organization membership in `public.profiles`. The private access record supplies their shared workspace scope. Do not call `attach_invited_profile` for these accounts. This also denies older deployments the normal organization context.
- Every application request with a user session (cookie or Bearer token) checks the database access record before the legacy route exemptions. Only the reviewed team and sign-in routes are allowed. Lookup failures fail closed. Server and route handlers independently authenticate.
- PostgREST's `db_pre_request` rejects every restricted-user data request except the self-only `staff_access_context` RPC. Additional restrictive policies deny direct table and Storage access. There are currently no Edge Functions or Realtime publications.
- `/api/team` uses authenticated user scope and an explicit output allowlist. Owner compensation is not fetched for team snapshots. Raw records, legacy notes, payloads, communication histories, original documents, owner reports, and the owner AI assistant are not exposed.
- Shared notes are stored separately and deliberately shared with the team. Adam can read and add them from **More → Team workspace**. Existing private notes are preserved.
- Staff can update shared contact email/phone/stage and Lead Desk planning details/referrals/priority, and add shared notes. Verified ARIVE loan amount, product, and status remain controlled by ARIVE. A new unmatched inquiry must be linked to a saved lead before its fields can be edited.
- Rate and membership fields are never accepted by the team edit endpoint. Record IDs are checked against the authenticated organization's complete snapshot; financial payloads and raw exports are not returned.

## Administration

Use service-side administrative access to reserve a verified email, organization, display name, and bps in `private.staff_access`. Never put authority or a rate in user-editable metadata. Create/invite the auth user only after the protections are live and tested. Send the invitation to `/invite/accept`; this page handles both existing sessions and implicit invitation fragments and routes restricted users to `/team` after setting a password.

Disable access with `UPDATE private.staff_access SET active=false WHERE user_id=...`. Keep the row: it continues to deny owner access even with an existing JWT. Do not remove the reservation to revoke access. Revoke sessions as an additional measure.

Any future team feature needs an explicit safe projection and mutation allowlist. Do not allow `/api/operations` or arbitrary existing routes. When adding tables, maintain restrictive policies for restricted staff; never remove the PostgREST pre-request gate. New original documents/history require a reviewed sharing mechanism.

## Validation

- Unit tests: personal-rate projection, unknown amounts, financial/membership edit rejection, ARIVE ownership, exact route boundaries.
- `tests/security/staff-privacy.sql`: transactional rehearsal with rollback; auth-trigger binding, staff SELECT/UPDATE denial, owner loan and 200-bps plan access, immediate revocation.
- Temporary synthetic auth account against the real database: direct REST/RPC/Storage denied; team API reads complete records at 25 bps; finance and arbitrary routes denied; financial field and cross-record requests rejected. Synthetic accounts/notes are removed after verification.
- Production build, desktop/mobile rendering, invitation session handling, and final production request checks required before the real invitation.

Relevant implementation references: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Supabase invitations](https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail).
