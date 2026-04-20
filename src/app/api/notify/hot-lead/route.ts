// src/app/api/notify/hot-lead/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { validateAgentSecret } from '@/lib/auth/validateAgentSecret'
import { createServiceClient } from '@/lib/supabase/service'
import { sendViaResend } from '@/lib/resend/send'

const LOANOS_APP_URL = 'https://loanos-astyer8345s-projects.vercel.app'

export async function POST(req: NextRequest) {
  const authError = validateAgentSecret(req)
  if (authError) return authError

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { contact_id, score } = body as { contact_id?: string; score?: number }

  if (!contact_id) {
    return NextResponse.json({ error: 'contact_id is required' }, { status: 400 })
  }
  if (score === undefined || score === null) {
    return NextResponse.json({ error: 'score is required' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const now = new Date()
  const todayUtc = now.toISOString().slice(0, 10)

  const { data: existingLog } = await supabase
    .from('activity_log')
    .select('created_at')
    .eq('contact_id', contact_id)
    .eq('action', 'hot_lead_notification')
    .gte('created_at', `${todayUtc}T00:00:00.000Z`)
    .lt('created_at', `${todayUtc}T23:59:59.999Z`)
    .limit(1)
    .maybeSingle()

  if (existingLog) {
    return NextResponse.json({
      ok: true,
      message: 'Deduplicated — notification already sent today',
      sent_at: existingLog.created_at,
    })
  }

  const { data: contact, error: contactError } = await supabase
    .from('contacts')
    .select('id, first_name, last_name, email, phone, lead_score, organization_id')
    .eq('id', contact_id)
    .single()

  if (contactError || !contact) {
    console.error('[notify/hot-lead] Contact not found:', contact_id, contactError)
    return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
  }

  const fullName = [contact.first_name, contact.last_name].filter(Boolean).join(' ') || 'Unknown'
  const contactUrl = `${LOANOS_APP_URL}/dashboard/contacts/${contact.id}`
  const adminEmail = process.env.LOANOS_ADMIN_EMAIL ?? 'styer.adam@gmail.com'

  const html = buildHotLeadEmail({
    fullName,
    email: contact.email ?? null,
    phone: contact.phone ?? null,
    score: score as number,
    contactUrl,
    triggeredAt: now.toLocaleString('en-US', { timeZone: 'America/Chicago', dateStyle: 'medium', timeStyle: 'short' }),
  })

  let resendId: string
  try {
    resendId = await sendViaResend({
      to: adminEmail,
      subject: `Hot Lead: ${fullName} — Score ${score}`,
      body: html,
      tags: { template: 'hot_lead_notification', contact_id },
      log: {
        organizationId: contact.organization_id,
        contactId: contact.id,
        template: 'hot_lead_notification',
      },
    })
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error('[notify/hot-lead] Resend failed:', detail)
    return NextResponse.json({ error: 'Failed to send notification', detail }, { status: 500 })
  }

  // Dedup sentinel — checked in step above on subsequent calls today
  await supabase
    .from('activity_log')
    .insert({
      organization_id: contact.organization_id,
      contact_id: contact.id,
      action: 'hot_lead_notification',
      event_type: 'hot_lead_notification',
      type: 'hot_lead_notification',
      summary: `Hot lead email sent — score ${score}`,
      external_id: resendId || null,
    })
    .then(({ error }) => {
      if (error) console.error('[notify/hot-lead] dedup sentinel insert failed (non-fatal):', error)
    })

  return NextResponse.json({ ok: true, message: 'Notification sent', resend_id: resendId })
}

interface HotLeadEmailParams {
  fullName: string
  email: string | null
  phone: string | null
  score: number
  contactUrl: string
  triggeredAt: string
}

function buildHotLeadEmail(p: HotLeadEmailParams): string {
  const scoreColor = p.score >= 50 ? '#dc2626' : p.score >= 30 ? '#d97706' : '#16a34a'

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Hot Lead Alert</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

          <tr>
            <td style="background:#111827;padding:24px 32px;">
              <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.08em;color:#9ca3af;text-transform:uppercase;">LoanOS Alert</p>
              <h1 style="margin:4px 0 0;font-size:22px;font-weight:700;color:#ffffff;">Hot Lead Detected</h1>
            </td>
          </tr>

          <tr>
            <td style="padding:24px 32px 0;">
              <table cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;width:100%;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 4px;font-size:12px;font-weight:500;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;">Lead Score</p>
                    <p style="margin:0;font-size:36px;font-weight:800;color:${scoreColor};">${p.score}<span style="font-size:16px;font-weight:400;color:#9ca3af;">/100</span></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 32px 0;">
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;">
                    <span style="font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;">Name</span>
                  </td>
                  <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;text-align:right;">
                    <span style="font-size:15px;font-weight:600;color:#111827;">${escapeHtml(p.fullName)}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;">
                    <span style="font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;">Email</span>
                  </td>
                  <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;text-align:right;">
                    ${p.email
                      ? `<a href="mailto:${escapeHtml(p.email)}" style="font-size:15px;color:#2563eb;text-decoration:none;">${escapeHtml(p.email)}</a>`
                      : '<span style="font-size:15px;color:#9ca3af;">—</span>'}
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;">
                    <span style="font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;">Phone</span>
                  </td>
                  <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;text-align:right;">
                    ${p.phone
                      ? `<a href="tel:${escapeHtml(p.phone)}" style="font-size:15px;color:#2563eb;text-decoration:none;">${escapeHtml(p.phone)}</a>`
                      : '<span style="font-size:15px;color:#9ca3af;">—</span>'}
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;">
                    <span style="font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;">Triggered</span>
                  </td>
                  <td style="padding:8px 0;text-align:right;">
                    <span style="font-size:14px;color:#374151;">${escapeHtml(p.triggeredAt)} CT</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:24px 32px 32px;">
              <a href="${p.contactUrl}"
                 style="display:inline-block;background:#111827;color:#ffffff;font-size:14px;font-weight:600;padding:12px 24px;border-radius:6px;text-decoration:none;letter-spacing:0.02em;">
                Open in LoanOS &rarr;
              </a>
            </td>
          </tr>

          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 32px;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                Sent by LoanOS automation &middot; Internal ops only &middot; You receive this because you are the account owner.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
