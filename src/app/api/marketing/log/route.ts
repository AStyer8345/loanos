/**
 * /api/marketing/log
 *
 * Webhook endpoint for adding entries to the Marketing History tab (mcc_state.log).
 * Called by n8n workflows after sending rate updates, newsletters, or social posts.
 *
 * Auth: Authorization: Bearer LOANOS_AGENT_SECRET (same as other agent endpoints)
 *       OR session cookie (browser calls from LoanOS UI)
 *
 * POST body:
 *   { activity: string, channel: string, notes?: string, date?: string, tracker?: string }
 *
 *   activity — human-readable label (e.g. "Rate update sent — Apr 3, 2026")
 *   channel  — log channel: Email, LinkedIn, Facebook, Rate Update, Newsletter, etc.
 *   notes    — optional detail (e.g. first 120 chars of content)
 *   date     — optional ISO date string, defaults to now
 *   tracker  — optional cadence tracker key to update (e.g. "rate-update", "borrower-nl")
 *
 * DELETE body:
 *   { id: string } — removes log entry by UUID
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

async function resolveAuth(request: NextRequest): Promise<{ userId: string } | null> {
  const authHeader = request.headers.get('authorization')
  const webhookSecret = request.headers.get('x-webhook-secret')
  const agentSecret = process.env.LOANOS_AGENT_SECRET

  // Agent-secret path (n8n webhooks) — accepts both Authorization: Bearer and X-Webhook-Secret
  const hasValidSecret = agentSecret && (
    authHeader === `Bearer ${agentSecret}` ||
    webhookSecret === agentSecret
  )

  if (hasValidSecret) {
    try {
      const svc = createServiceClient()
      const { data: profile } = await svc
        .from('profiles')
        .select('id')
        .not('organization_id', 'is', null)
        .order('created_at', { ascending: true })
        .limit(1)
        .single()
      if (profile?.id) return { userId: profile.id }
    } catch { /* fall through */ }
    return null
  }

  // Session-cookie path (browser)
  try {
    const sessionClient = createClient()
    const { data: { user } } = await sessionClient.auth.getUser()
    if (user) return { userId: user.id }
  } catch { /* fall through */ }

  return null
}

export async function POST(request: NextRequest) {
  const auth = await resolveAuth(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { activity, channel, notes, date, tracker } = body as {
      activity?: string
      channel?: string
      notes?: string
      date?: string
      tracker?: string
    }

    if (!activity || !channel) {
      return NextResponse.json(
        { error: 'Missing required fields: activity, channel' },
        { status: 400 },
      )
    }

    const supabase = createServiceClient() as ReturnType<typeof createServiceClient> & { from: (...args: unknown[]) => unknown }

    // Read current mcc_state
    const { data: mccRow } = await (supabase as any) // eslint-disable-line @typescript-eslint/no-explicit-any
      .from('mcc_state')
      .select('value')
      .eq('user_id', auth.userId)
      .eq('key', 'mcc')
      .single()

    const currentState = (mccRow?.value || { log: [], last: {} }) as {
      log: unknown[]
      last: Record<string, string>
      [k: string]: unknown
    }

    // Build new log entry
    const entry = {
      id: crypto.randomUUID(),
      date: date || new Date().toISOString(),
      activity,
      channel,
      notes: notes || '',
    }

    // Update tracker if provided (e.g. "rate-update", "borrower-nl", "social-post")
    const updatedLast = { ...currentState.last }
    if (tracker) {
      updatedLast[tracker] = entry.date
    }

    const updatedState = {
      ...currentState,
      log: [entry, ...(currentState.log || [])],
      last: updatedLast,
    }

    await (supabase as any) // eslint-disable-line @typescript-eslint/no-explicit-any
      .from('mcc_state')
      .upsert(
        {
          user_id: auth.userId,
          key: 'mcc',
          value: updatedState,
          updated_at: new Date().toISOString(),
        } as Record<string, unknown>,
        { onConflict: 'user_id,key' },
      )

    return NextResponse.json({ success: true, entryId: entry.id })
  } catch (error) {
    console.error('[marketing/log] POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await resolveAuth(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await request.json()
    if (!id) {
      return NextResponse.json({ error: 'Missing required field: id' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { data: mccRow } = await (supabase as any) // eslint-disable-line @typescript-eslint/no-explicit-any
      .from('mcc_state')
      .select('value')
      .eq('user_id', auth.userId)
      .eq('key', 'mcc')
      .single()

    if (!mccRow?.value) {
      return NextResponse.json({ error: 'No state found' }, { status: 404 })
    }

    const currentState = mccRow.value as { log: { id: string }[]; [k: string]: unknown }
    const updatedState = {
      ...currentState,
      log: (currentState.log || []).filter((e: { id: string }) => e.id !== id),
    }

    await (supabase as any) // eslint-disable-line @typescript-eslint/no-explicit-any
      .from('mcc_state')
      .upsert(
        {
          user_id: auth.userId,
          key: 'mcc',
          value: updatedState,
          updated_at: new Date().toISOString(),
        } as Record<string, unknown>,
        { onConflict: 'user_id,key' },
      )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[marketing/log] DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
