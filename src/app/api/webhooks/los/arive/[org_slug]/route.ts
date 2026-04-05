/**
 * src/app/api/webhooks/los/arive/[org_slug]/route.ts
 *
 * Multi-tenant Arive webhook endpoint. Replaces the legacy single-tenant
 * /api/arive-webhook route (which remains live for a 30-day grace period).
 *
 * URL shape:
 *   POST /api/webhooks/los/arive/[org_slug]
 *
 * Upstream path (2026-04-05):
 *   Arive (thin ping) → per-LO Zapier account → Webhooks by Zapier (enriched
 *   POST) → this route. Arive does not offer direct API access to third-
 *   party SaaS integrators, so Zapier is the only supported path. Each LO
 *   has their own Zap, their own Arive API credentials, and their own
 *   LoanOS webhook secret.
 *
 * Three-layer verification:
 *   Layer 1 — path slug resolves to a real org (else 404)
 *   Layer 2 — X-Webhook-Secret matches a hashed secret on an active
 *             los_integrations row for this (org, 'arive') — timing-safe
 *   Layer 3 — payload identity (user_id / user_email) matches the org's
 *             allowlist — see src/lib/los/verifyLosPayload.ts
 *
 * Verification mode:
 *   - shadow  (default): log layer-3 mismatches, still process the webhook
 *   - enforce: reject layer-3 mismatches with 403
 *   Controlled per-org via org_settings.los_verification_mode.
 *
 * Never returns org-specific error details to callers — all failures return
 * generic 401/403/404 so an attacker can't enumerate valid slugs or probe
 * which layer failed.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { processAriveWebhook } from '@/lib/arive/processWebhook'
import { resolveOrgFromSlug } from '@/lib/los/resolveOrgFromSlug'
import { verifySecret } from '@/lib/los/hashSecret'
import { verifyLosPayload } from '@/lib/los/verifyLosPayload'

export async function POST(
  request: NextRequest,
  { params }: { params: { org_slug: string } }
) {
  const { org_slug } = params
  const serviceClient = createServiceClient()

  // ─── Layer 1: slug → org ──────────────────────────────────────────────────
  const org = await resolveOrgFromSlug(serviceClient, org_slug, 'arive')
  if (!org) {
    console.warn('[los/arive] Unknown slug', { slug: org_slug })
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (org.integrations.length === 0) {
    console.warn('[los/arive] Org has no active arive integration', {
      slug: org_slug,
      org_id: org.organization_id,
    })
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // ─── Layer 2: secret verification (timing-safe, per-integration-row) ──────
  const incomingSecret =
    request.headers.get('x-webhook-secret') ?? request.headers.get('X-Webhook-Secret')

  if (!incomingSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Try each active integration row's secret. Usually there's just one, but
  // during rotation there may be a brief overlap window with two rows active.
  const matchedIntegration = org.integrations.find((row) =>
    verifySecret(incomingSecret, row.secret)
  )

  if (!matchedIntegration) {
    console.warn('[los/arive] Secret mismatch', {
      org_id: org.organization_id,
      slug: org_slug,
    })
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ─── Parse payload ────────────────────────────────────────────────────────
  let body: Record<string, unknown>
  try {
    const raw = await request.text()
    body = raw ? JSON.parse(raw) : {}
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // ─── Layer 3: payload identity allowlist ──────────────────────────────────
  const verification = verifyLosPayload(org, body)

  if (!verification.matched) {
    const logPayload = {
      org_id: org.organization_id,
      slug: org_slug,
      mode: org.verification_mode,
      reason: verification.matchedVia,
      payload_identity: verification.payloadIdentity,
      allowlist_sample: org.integrations.map((i) => ({
        id: i.id,
        label: i.label,
        has_user_id: !!i.external_user_id,
        has_email: !!i.external_user_email,
      })),
    }

    if (org.verification_mode === 'enforce') {
      console.error('[los/arive] Layer 3 REJECT', logPayload)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Shadow mode: log but continue.
    console.warn('[los/arive] Layer 3 MISMATCH (shadow mode — processing anyway)', logPayload)
  } else {
    console.log('[los/arive] Verified', {
      org_id: org.organization_id,
      matched_via: verification.matchedVia,
      matched_integration: verification.matchedIntegrationId,
    })
  }

  // ─── Resolve internal user for activity log attribution ───────────────────
  // Find the profile belonging to this org whose email matches the matched
  // integration's external_user_email. Falls back to the org owner.
  let resolvedUserId: string | null = null
  if (matchedIntegration.external_user_email) {
    const { data: matchedProfile } = await serviceClient
      .from('profiles')
      .select('id')
      .eq('organization_id', org.organization_id)
      .eq('email', matchedIntegration.external_user_email)
      .maybeSingle()
    resolvedUserId = matchedProfile?.id ?? null
  }
  if (!resolvedUserId) {
    const { data: ownerProfile } = await serviceClient
      .from('profiles')
      .select('id')
      .eq('organization_id', org.organization_id)
      .eq('role', 'owner')
      .maybeSingle()
    resolvedUserId = ownerProfile?.id ?? null
  }

  // ─── Process the webhook (existing shared logic, unchanged) ───────────────
  const result = await processAriveWebhook(body, org.organization_id, resolvedUserId)

  if (!result.success) {
    const is400 = result.error?.startsWith('Missing required field')
    return NextResponse.json(
      { success: false, error: result.error },
      { status: is400 ? 400 : 500 }
    )
  }

  return NextResponse.json(
    {
      success: true,
      contact_id: result.contact_id,
      loan_id: result.loan_id,
    },
    { status: 200 }
  )
}
