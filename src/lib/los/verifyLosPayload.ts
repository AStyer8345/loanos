/**
 * src/lib/los/verifyLosPayload.ts
 *
 * Layer 3 of LOS webhook verification: confirm the payload's loan-officer
 * identity matches the org's allowlist (los_integrations rows).
 *
 * Threat model this layer addresses:
 *   Layer 1 (slug) + Layer 2 (shared secret) already prevent cross-tenant
 *   leaks in the normal case. Layer 3 catches MISCONFIGURATION:
 *   - LO_A accidentally pastes LO_B's slug into their Zap config
 *   - A Zap is cloned between orgs without updating the slug
 *   - A stale secret is reused across orgs
 *   In all those cases the payload arrives at the wrong org with a valid
 *   secret, but the LO-identifying field in the body won't match the
 *   allowlist — so we catch it.
 *
 * Rollout strategy:
 *   Ship in SHADOW mode (org_settings.los_verification_mode = 'shadow').
 *   The route logs mismatches but processes the webhook anyway. After 14
 *   days of clean logs, flip to 'enforce' so mismatches return 403.
 *
 * ─────────────────────────────────────────────────────────────────────────
 *
 * 🔨 ADAM — your 5-10 line contribution
 *
 * This stub needs one decision from you: WHICH PAYLOAD FIELD identifies the
 * loan officer in your Zapier-enriched webhook body?
 *
 * Options to investigate (open your Zap in Zapier → look at a recent test
 * payload → find the field that contains YOUR email or Arive user ID):
 *
 *   (a) body.loanOfficerEmail                — most likely if Zap uses the
 *                                               standard Arive field name
 *   (b) body.user_id / body.userId            — if Arive sends a user ID
 *   (c) body['LOAN_OFFICER_emailAddressText'] — if Arive uses the same weird
 *                                               uppercase key style it uses
 *                                               for agents (see processWebhook.ts)
 *   (d) body.assignedTo / body.owner / etc.
 *
 * Once you know the field name, fill in the extractors below. The matching
 * logic is already written — you just need to tell it where to look.
 *
 * Matching rules the route will apply:
 *   - If ANY integration row matches on either user_id OR user_email → OK
 *   - If org has zero allowlist rows with identity set → null-allowlist
 *     escape hatch, treated as match (with warning log)
 *   - Otherwise → mismatch (shadow logs, enforce rejects)
 */

import type { ResolvedLosOrg } from './resolveOrgFromSlug'

export type MatchedVia =
  | 'user-id'
  | 'user-email'
  | 'null-allowlist'
  | 'no-match'

export interface VerificationResult {
  matched: boolean
  matchedVia: MatchedVia
  matchedIntegrationId: string | null
  payloadIdentity: {
    user_id: string | null
    user_email: string | null
  }
}

/**
 * Extract the loan officer identity from a Zapier-enriched Arive payload.
 *
 * Confirmed via Adam's 2026-04-04 Zap run (loan 15755447):
 *   Zapier sends Arive's "Loan Officer Email" label as `loanOfficerEmail`.
 *   Example: "adam@thestyerteam.com"
 *
 * Arive does NOT send a stable numeric user_id through Zapier — the closest
 * thing is the email address, which we use exclusively. Also checking
 * `loan_officer_email` and `LOAN_OFFICER_emailAddressText` as defensive
 * fallbacks in case a future Zap is configured with snake_case or raw
 * Arive key formatting.
 */
function extractPayloadIdentity(body: Record<string, unknown>): {
  user_id: string | null
  user_email: string | null
} {
  const rawEmail =
    body.loanOfficerEmail ??
    body.loan_officer_email ??
    body['LOAN_OFFICER_emailAddressText']

  const user_email =
    typeof rawEmail === 'string' && rawEmail.trim() !== ''
      ? rawEmail.toLowerCase().trim()
      : null

  return { user_id: null, user_email }
}

export function verifyLosPayload(
  org: ResolvedLosOrg,
  body: Record<string, unknown>
): VerificationResult {
  const payloadIdentity = extractPayloadIdentity(body)

  // Null-allowlist escape hatch: if no integration row has an identity set,
  // layer 3 is inert. Acceptable during initial rollout before the LO has
  // configured their allowlist.
  const anyAllowlistConfigured = org.integrations.some(
    (i) => i.external_user_id !== null || i.external_user_email !== null
  )
  if (!anyAllowlistConfigured) {
    return {
      matched: true,
      matchedVia: 'null-allowlist',
      matchedIntegrationId: null,
      payloadIdentity,
    }
  }

  // Try to match on user_id first (stronger identifier), then user_email.
  for (const integration of org.integrations) {
    if (
      payloadIdentity.user_id &&
      integration.external_user_id &&
      payloadIdentity.user_id === integration.external_user_id
    ) {
      return {
        matched: true,
        matchedVia: 'user-id',
        matchedIntegrationId: integration.id,
        payloadIdentity,
      }
    }
    if (
      payloadIdentity.user_email &&
      integration.external_user_email &&
      payloadIdentity.user_email === integration.external_user_email.toLowerCase().trim()
    ) {
      return {
        matched: true,
        matchedVia: 'user-email',
        matchedIntegrationId: integration.id,
        payloadIdentity,
      }
    }
  }

  return {
    matched: false,
    matchedVia: 'no-match',
    matchedIntegrationId: null,
    payloadIdentity,
  }
}
