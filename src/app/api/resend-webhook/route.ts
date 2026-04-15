import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { verifyResendSignature } from '@/lib/resend/verify'
import { mapResendEventType } from '@/lib/workflows/drip-helpers'
import { resumeHook } from 'workflow/api'
import type { Json } from '@/lib/database.types'

export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.RESEND_WEBHOOK_SECRET
  if (!secret) {
    console.error('RESEND_WEBHOOK_SECRET not set')
    return NextResponse.json({ error: 'Misconfigured' }, { status: 500 })
  }

  let rawBody: string
  let event: Awaited<ReturnType<typeof verifyResendSignature>>

  try {
    rawBody = await req.text()
    event = await verifyResendSignature(rawBody, Object.fromEntries(req.headers.entries()), secret)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const supabase = createServiceClient()

  // Idempotency — skip if already processed
  const { error: insertErr } = await supabase
    .from('resend_webhook_events')
    .upsert(
      {
        event_id: event.data.email_id,
        event_type: event.type,
        contact_id: event.data.tags?.contact_id ?? null,
        enrollment_id: event.data.tags?.enrollment_id ?? null,
        payload: event as unknown as Json,
      },
      { onConflict: 'event_id', ignoreDuplicates: true }
    )

  // insertErr here means a non-conflict DB error — log but don't 500 (Resend would retry)
  if (insertErr && insertErr.code !== '23505') {
    console.error('resend-webhook: DB insert error', insertErr)
  }

  // Map to canonical activity_log event_type
  const activityEventType = mapResendEventType(event.type)
  if (activityEventType && event.data.tags?.contact_id) {
    await supabase.from('activity_log').insert({
      organization_id: process.env.DEFAULT_ORG_ID ?? '',
      contact_id: event.data.tags.contact_id,
      action: activityEventType,
      event_type: activityEventType,
      summary: `Resend: ${event.type} for email to ${event.data.to?.[0] ?? 'unknown'}`,
    })
  }

  // Resume drip workflow hook if metadata present
  const enrollmentId = event.data.tags?.enrollment_id
  const stepOrderRaw = event.data.tags?.step_order
  if (enrollmentId && stepOrderRaw !== undefined) {
    await resumeHook(`drip-${enrollmentId}-step-${stepOrderRaw}`, event)
  }

  return NextResponse.json({ received: true })
}
