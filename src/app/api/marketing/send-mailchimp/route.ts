import { NextRequest, NextResponse } from 'next/server'
import { getOrganization } from '@/lib/getOrganization'

export async function POST(req: NextRequest) {
  try {
    await getOrganization()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { api_key, server_prefix, list_id, subject, html_body, from_email } = await req.json()

  if (!api_key || !server_prefix || !list_id || !subject || !html_body) {
    return NextResponse.json(
      { error: 'Missing: api_key, server_prefix, list_id, subject, html_body' },
      { status: 400 },
    )
  }

  const base = `https://${server_prefix}.api.mailchimp.com/3.0`
  const auth = `Basic ${Buffer.from(`anystring:${api_key}`).toString('base64')}`
  const headers = { 'Content-Type': 'application/json', Authorization: auth }

  const replyTo = from_email || 'adam@styermortgage.com'

  try {
    // ── 1. Create campaign ──────────────────────────────────────────
    const createRes = await fetch(`${base}/campaigns`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        type: 'regular',
        recipients: { list_id },
        settings: {
          subject_line: subject,
          from_name:    'Adam Styer | Mortgage Solutions LP',
          reply_to:     replyTo,
          title:        subject,
        },
      }),
    })

    if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({})) as { detail?: string }
      return NextResponse.json({ error: err.detail ?? `Create failed (${createRes.status})` }, { status: 400 })
    }

    const campaign   = await createRes.json() as { id: string }
    const campaignId = campaign.id

    // ── 2. Set content ──────────────────────────────────────────────
    const contentRes = await fetch(`${base}/campaigns/${campaignId}/content`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ html: html_body }),
    })

    if (!contentRes.ok) {
      const err = await contentRes.json().catch(() => ({})) as { detail?: string }
      return NextResponse.json({ error: err.detail ?? `Content failed (${contentRes.status})`, campaignId }, { status: 400 })
    }

    // ── 3. Send ─────────────────────────────────────────────────────
    const sendRes = await fetch(`${base}/campaigns/${campaignId}/actions/send`, {
      method: 'POST',
      headers,
    })

    if (!sendRes.ok) {
      const err = await sendRes.json().catch(() => ({})) as { detail?: string }
      return NextResponse.json({ error: err.detail ?? `Send failed (${sendRes.status})`, campaignId }, { status: 400 })
    }

    return NextResponse.json({ ok: true, campaignId })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
