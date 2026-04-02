/**
 * src/app/api/arive-webhook/[slug]/route.ts
 *
 * Multi-tenant Arive webhook endpoint.
 * Resolves the organization by URL slug, validates the webhook secret,
 * then delegates to the shared processing logic.
 *
 * URL: POST /api/arive-webhook/:slug
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { processAriveWebhook } from '@/lib/arive/processWebhook'

const ARIVE_WEBHOOK_SECRET = process.env.ARIVE_WEBHOOK_SECRET

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  // Validate webhook secret (same global secret for backward compat)
  const incomingSecret =
    request.headers.get('x-webhook-secret') ?? request.headers.get('X-Webhook-Secret')
  if (!ARIVE_WEBHOOK_SECRET || incomingSecret !== ARIVE_WEBHOOK_SECRET) {
    console.error(`[arive-webhook/${slug}] Unauthorized — bad or missing X-Webhook-Secret`)
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

  const serviceClient = createServiceClient()

  // ── 1. Look up organization by slug ─────────────────────────────────────────
  const { data: org, error: orgError } = await serviceClient
    .from('organizations')
    .select('id')
    .eq('slug', slug)
    .single()

  if (orgError || !org) {
    console.error(`[arive-webhook/${slug}] Organization not found for slug: ${slug}`)
    return NextResponse.json(
      { error: `Organization not found: ${slug}` },
      { status: 404 }
    )
  }

  const organizationId = org.id

  // ── 2. Look up org's webhook secret from org_settings (future) ──────────────
  // For now we use the global ARIVE_WEBHOOK_SECRET (validated above).
  // TODO: add arive_webhook_secret column to org_settings and validate per-org.
  // Placeholder query so the pattern is in place:
  // const { data: orgSettings } = await serviceClient
  //   .from('org_settings')
  //   .select('arive_webhook_url')
  //   .eq('organization_id', organizationId)
  //   .single()

  // ── 3. Find the owner profile for this org to get user_id ───────────────────
  const { data: ownerProfile } = await serviceClient
    .from('profiles')
    .select('id')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  const resolvedUserId = ownerProfile?.id ?? null

  // ── 4. Delegate to shared processing logic ──────────────────────────────────
  const result = await processAriveWebhook(body, organizationId, resolvedUserId)

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
