import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOrganization } from '@/lib/getOrganization'
import { getLoIdentity } from '@/lib/getLoIdentity'

export async function POST(req: NextRequest) {
  let organizationId: string
  try {
    const ctx = await getOrganization()
    organizationId = ctx.organizationId
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { scenarioId, borrowerEmail } = await req.json()

    if (!scenarioId || !borrowerEmail) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const webhookUrl = process.env.N8N_OUTLOOK_DRAFT_WEBHOOK_URL
    if (!webhookUrl) {
      return NextResponse.json(
        { error: 'Email dispatch not configured — set N8N_OUTLOOK_DRAFT_WEBHOOK_URL' },
        { status: 503 },
      )
    }

    const supabase = createClient()

    const { data: scenario, error: fetchError } = await supabase
      .from('scenarios')
      .select('id, share_token, borrower_name, property_address, scenario_type')
      .eq('id', scenarioId)
      .eq('organization_id', organizationId)
      .single()

    if (fetchError || !scenario) {
      return NextResponse.json({ error: 'Scenario not found' }, { status: 404 })
    }

    if (!scenario.share_token) {
      return NextResponse.json({ error: 'Scenario has no share token' }, { status: 400 })
    }

    const identity = await getLoIdentity(organizationId)

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://loanos.vercel.app'
    const shareUrl = `${baseUrl}/share/${scenario.share_token}`
    const borrowerFirst = scenario.borrower_name
      ? scenario.borrower_name.split(/[\s,&]+/)[0]
      : 'there'
    const propLine = scenario.property_address ? ` for ${scenario.property_address}` : ''
    const subject = `Your Loan Options${propLine} — from ${identity.loName}`

    const body = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'IBM Plex Mono',monospace,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
        <!-- Header -->
        <tr><td style="padding-bottom:32px;">
          <p style="margin:0;font-size:11px;color:${identity.brandColor};letter-spacing:0.08em;text-transform:uppercase;">${identity.companyName}</p>
          <p style="margin:4px 0 0;font-size:10px;color:#555;">NMLS #${identity.nmlsIndividual}</p>
        </td></tr>
        <!-- Greeting -->
        <tr><td style="padding-bottom:24px;">
          <h1 style="margin:0;font-size:22px;color:#f5f5f5;font-weight:600;line-height:1.3;">Hi ${borrowerFirst},</h1>
          <p style="margin:12px 0 0;font-size:14px;color:#aaa;line-height:1.6;">Your loan scenario analysis${propLine} is ready. I put together a personalized breakdown so you can compare your options side by side.</p>
        </td></tr>
        <!-- CTA -->
        <tr><td style="padding-bottom:32px;">
          <a href="${shareUrl}" style="display:inline-block;padding:14px 28px;background:${identity.brandColor};color:#0a0a0a;text-decoration:none;font-size:14px;font-weight:700;border-radius:10px;letter-spacing:0.02em;">View Your Loan Options →</a>
        </td></tr>
        <!-- Link fallback -->
        <tr><td style="padding-bottom:32px;">
          <p style="margin:0;font-size:11px;color:#555;">Or copy this link: <a href="${shareUrl}" style="color:${identity.brandColor};">${shareUrl}</a></p>
        </td></tr>
        <!-- Divider -->
        <tr><td style="border-top:1px solid #222;padding-top:24px;">
          <p style="margin:0;font-size:11px;color:#555;line-height:1.6;">Questions? Reply to this email or call/text me directly.<br>${identity.loName}${identity.loPhone ? ` | ${identity.loPhone}` : ''}${identity.loEmail ? ` | ${identity.loEmail}` : ''}</p>
          <p style="margin:12px 0 0;font-size:10px;color:#333;">This analysis is for informational purposes only and does not constitute a loan commitment or approval. Rates and fees are subject to change. Equal Housing Lender.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

    const n8nRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: borrowerEmail,
        subject,
        body,
        recipientName: scenario.borrower_name || '',
      }),
    })

    if (!n8nRes.ok) {
      console.error('[scenarios/send-email] n8n webhook failed:', n8nRes.status)
      return NextResponse.json({ error: 'Failed to create email draft' }, { status: 502 })
    }

    return NextResponse.json({ success: true, shareUrl })
  } catch (error) {
    console.error('[scenarios/send-email] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
