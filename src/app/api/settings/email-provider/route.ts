/**
 * Returns the current email-provider config for the user's org. Used by
 * the Settings page "Email Sending" card to show whether Microsoft Graph
 * is connected and which mailbox it's linked to.
 */

import { NextResponse } from 'next/server'
import { getOrganization } from '@/lib/getOrganization'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(): Promise<NextResponse> {
  let ctx
  try {
    ctx = await getOrganization()
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unauthorized'
    return NextResponse.json({ error: message }, { status: 401 })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('org_settings')
    .select('email_provider, ms_graph_email, ms_graph_connected_at, from_email, from_name')
    .eq('organization_id', ctx.organizationId)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    provider: data?.email_provider ?? 'resend',
    msEmail: data?.ms_graph_email ?? null,
    msConnectedAt: data?.ms_graph_connected_at ?? null,
    fromEmail: data?.from_email ?? null,
    fromName: data?.from_name ?? null,
  })
}

/**
 * POST { action: 'disconnect' } — clears Microsoft tokens, flips provider
 * back to 'resend'. Useful for testing + giving users a way out without
 * a database script.
 */
export async function POST(req: Request): Promise<NextResponse> {
  let ctx
  try {
    ctx = await getOrganization()
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const body = (await req.json().catch(() => ({}))) as { action?: string }
  if (body.action !== 'disconnect') {
    return NextResponse.json({ error: 'invalid action' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('org_settings')
    .update({
      email_provider: 'resend',
      ms_graph_email: null,
      ms_graph_token_ciphertext: null,
      ms_graph_token_iv: null,
      ms_graph_token_auth_tag: null,
      ms_graph_token_expires_at: null,
      ms_graph_connected_at: null,
    })
    .eq('organization_id', ctx.organizationId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
