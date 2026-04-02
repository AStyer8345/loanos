/**
 * src/app/api/arive-webhook/route.ts
 *
 * Receives Arive webhook → upserts contact + loan in Supabase → logs activity.
 *
 * Auth: validates X-Webhook-Secret header against ARIVE_WEBHOOK_SECRET env var.
 *
 * Required env vars (set in Netlify/Vercel or .env.local):
 *   SUPABASE_URL              https://...
 *   SUPABASE_SERVICE_ROLE_KEY sb-service-role-...
 *   ARIVE_WEBHOOK_SECRET      your-shared-secret-string
 *
 * Org resolution: reads user_id from the webhook payload body. If the Arive
 * payload does not include a user_id field, falls back to a single-tenant
 * lookup (first profile with a non-null organization_id).
 * TODO: implement proper multi-tenant routing once Arive sends a user_id field.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { processAriveWebhook } from '@/lib/arive/processWebhook'

const ARIVE_WEBHOOK_SECRET = process.env.ARIVE_WEBHOOK_SECRET

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Normalize: treat empty string / undefined / null as null
function n(val: unknown): string | number | null {
  return val === null || val === undefined || val === '' ? null : (val as string | number)
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // Validate webhook secret
  const incomingSecret =
    request.headers.get('x-webhook-secret') ?? request.headers.get('X-Webhook-Secret')
  if (!ARIVE_WEBHOOK_SECRET || incomingSecret !== ARIVE_WEBHOOK_SECRET) {
    console.error('[arive-webhook] Unauthorized — bad or missing X-Webhook-Secret')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Parse payload
  let body: Record<string, unknown>
  try {
    const raw = await request.text()
    body = raw ? JSON.parse(raw) : {}
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Resolve organization_id and system user from the webhook payload or fallback lookup
  const serviceClient = createServiceClient()

  // Prefer user_id from the payload body (for future multi-tenant Arive routing)
  const bodyUserId = n(body.user_id) ? String(body.user_id) : null

  let organizationId: string | null = null
  let resolvedUserId: string | null = bodyUserId

  if (bodyUserId) {
    // Payload includes a user_id — look up that user's org
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('organization_id')
      .eq('id', bodyUserId)
      .single()
    organizationId = profile?.organization_id ?? null
    if (!organizationId) {
      console.error('[arive-webhook] No org for payload user_id', bodyUserId)
    }
  }

  if (!organizationId) {
    // Fallback: single-tenant — find the first profile with an org assigned.
    // TODO: replace with proper multi-tenant routing once Arive sends user_id.
    const { data: fallbackProfile } = await serviceClient
      .from('profiles')
      .select('organization_id, id')
      .not('organization_id', 'is', null)
      .order('created_at', { ascending: true })
      .limit(1)
      .single()
    organizationId = fallbackProfile?.organization_id ?? null
    if (!resolvedUserId) resolvedUserId = fallbackProfile?.id ?? null
    if (!organizationId) {
      console.error('[arive-webhook] Could not resolve organization_id — no profiles with org found')
      return NextResponse.json(
        { error: 'Server misconfiguration: no organization found' },
        { status: 500 }
      )
    }
  }

  // Delegate to shared processing logic
  const result = await processAriveWebhook(body, organizationId, resolvedUserId)

  if (!result.success) {
    // Determine appropriate status code
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
