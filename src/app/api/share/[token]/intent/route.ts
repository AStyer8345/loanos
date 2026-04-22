import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { checkRateLimit } from '@/lib/rateLimit'
import { sendViaResend } from '@/lib/resend/send'

const LOANOS_APP_URL = 'https://loanos-astyer8345s-projects.vercel.app'

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return req.headers.get('x-real-ip') || 'unknown'
}

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    // Rate limit per IP — one intent submission per token per borrower session is typical.
    const ip = getClientIp(req)
    const ipCheck = checkRateLimit(`intent-ip:${ip}`, 10, 60_000)
    if (!ipCheck.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }
    const tokenCheck = checkRateLimit(`intent-token:${params.token}`, 5, 60_000)
    if (!tokenCheck.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    const body = await req.json() as { option_index?: number; option_label?: string }
    const { option_index, option_label } = body

    if (option_index === undefined || option_index === null) {
      return NextResponse.json({ error: 'option_index required' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Fetch scenario by token — read-only, then update
    const { data: scenario, error: fetchError } = await supabase
      .from('scenarios')
      .select('id, organization_id, user_id, borrower_name, property_address, borrower_intent')
      .eq('share_token', params.token)
      .single()

    if (fetchError || !scenario) {
      return NextResponse.json({ error: 'Scenario not found' }, { status: 404 })
    }

    // Idempotent: if intent already set, return success without overwriting
    if (scenario.borrower_intent) {
      return NextResponse.json({ ok: true, message: 'Already recorded' })
    }

    const intent = {
      option_index,
      option_label: option_label || `Option ${String.fromCharCode(65 + option_index)}`,
      selected_at: new Date().toISOString(),
    }

    const { error: updateError } = await supabase
      .from('scenarios')
      .update({ borrower_intent: intent })
      .eq('id', scenario.id)

    if (updateError) {
      console.error('[share/intent] DB update failed:', updateError)
      return NextResponse.json({ error: 'Failed to record intent' }, { status: 500 })
    }

    // Best-effort notification — never fail the borrower response
    notifyLO(scenario, intent).catch(err =>
      console.error('[share/intent] notification failed (non-fatal):', err)
    )

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[share/intent] error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

async function notifyLO(
  scenario: { id: string; organization_id: string; user_id: string | null; borrower_name: string | null; property_address: string | null },
  intent: { option_label: string; selected_at: string }
) {
  const adminEmail = process.env.LOANOS_ADMIN_EMAIL ?? 'styer.adam@gmail.com'
  const borrowerName = scenario.borrower_name || 'Your borrower'
  const scenarioUrl = `${LOANOS_APP_URL}/dashboard/scenarios/${scenario.id}`
  const triggeredAt = new Date(intent.selected_at).toLocaleString('en-US', {
    timeZone: 'America/Chicago',
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><title>Borrower Intent Alert</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <tr><td style="background:#111827;padding:24px 32px;">
          <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.08em;color:#9ca3af;text-transform:uppercase;">LoanOS Alert</p>
          <h1 style="margin:4px 0 0;font-size:22px;font-weight:700;color:#ffffff;">Borrower Picked an Option</h1>
        </td></tr>
        <tr><td style="padding:24px 32px 0;">
          <table cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;width:100%;">
            <tr><td style="padding:16px 20px;">
              <p style="margin:0 0 4px;font-size:12px;font-weight:500;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;">They're interested in</p>
              <p style="margin:0;font-size:28px;font-weight:800;color:#C9A84C;">${escapeHtml(intent.option_label)}</p>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:20px 32px 0;">
          <table cellpadding="0" cellspacing="0" width="100%">
            <tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;">
              <span style="font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;">Borrower</span>
            </td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;text-align:right;">
              <span style="font-size:15px;font-weight:600;color:#111827;">${escapeHtml(borrowerName)}</span>
            </td></tr>
            ${scenario.property_address ? `<tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;">
              <span style="font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;">Property</span>
            </td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;text-align:right;">
              <span style="font-size:14px;color:#374151;">${escapeHtml(scenario.property_address)}</span>
            </td></tr>` : ''}
            <tr><td style="padding:8px 0;">
              <span style="font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;">Time</span>
            </td><td style="padding:8px 0;text-align:right;">
              <span style="font-size:14px;color:#374151;">${escapeHtml(triggeredAt)} CT</span>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:24px 32px 32px;">
          <a href="${scenarioUrl}" style="display:inline-block;background:#111827;color:#ffffff;font-size:14px;font-weight:600;padding:12px 24px;border-radius:6px;text-decoration:none;letter-spacing:0.02em;">
            Open Scenario in LoanOS &rarr;
          </a>
        </td></tr>
        <tr><td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 32px;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">
            Sent by LoanOS &middot; Internal ops only &middot; You receive this because you are the account owner.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  await sendViaResend({
    to: adminEmail,
    subject: `${borrowerName} is interested in ${intent.option_label}`,
    body: html,
    tags: { template: 'borrower_intent_notification', scenario_id: scenario.id },
    log: {
      organizationId: scenario.organization_id,
      contactId: null,
      template: 'borrower_intent_notification',
    },
  })
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
