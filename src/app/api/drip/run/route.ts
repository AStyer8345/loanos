import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { renderDripHtml } from '@/lib/workflows/drip-render'
import { shouldExitDrip } from '@/lib/workflows/drip-helpers'
import { sendViaResend } from '@/lib/resend/send'
import { hasAuthoredEmail, getAuthoredEmail, DRIP_CAMPAIGN_IDS } from '@/lib/drip/authored-emails'
import type { TriggerConfig } from '@/lib/drip/types'

const PHYSICAL_ADDRESS = '5900 Balcones Drive, Suite 100, Austin TX 78731'
const NMLS = '513013'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://loanos.app'

function buildEmailHtml(body: string, contactId: string): string {
  return `${body}
<hr style="margin-top:32px;border:none;border-top:1px solid #e5e7eb;">
<p style="font-size:12px;color:#6b7280;line-height:1.8;margin-top:16px;">
  Adam Styer | Mortgage Solutions LP &nbsp;&middot;&nbsp; NMLS #${NMLS}<br>
  ${PHYSICAL_ADDRESS}<br>
  Equal Housing Lender<br>
  <a href="${APP_URL}/unsubscribe?c=${contactId}" style="color:#6b7280;">Unsubscribe</a>
</p>`
}

export async function GET(request: Request): Promise<NextResponse> {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const now = new Date().toISOString()
  const stats = { processed: 0, sent: 0, skipped: 0, errors: 0 }

  // Per-org From: + Reply-To cache (one fetch per org per cron tick)
  const orgFromCache = new Map<string, { from?: string; replyTo?: string }>()
  async function getOrgFrom(orgId: string): Promise<{ from?: string; replyTo?: string }> {
    const cached = orgFromCache.get(orgId)
    if (cached) return cached
    const { data } = await supabase
      .from('org_settings')
      .select('from_email, from_name, custom_email_reply_to')
      .eq('organization_id', orgId)
      .maybeSingle()
    const from = data?.from_email
      ? (data.from_name ? `${data.from_name} <${data.from_email}>` : data.from_email)
      : undefined
    const result = { from, replyTo: data?.custom_email_reply_to ?? undefined }
    orgFromCache.set(orgId, result)
    return result
  }

  // RPC returns active enrollments with next_send_at <= NOW(), joined to their next step
  const { data: rows, error: rpcErr } = await supabase.rpc('get_due_drip_enrollments')

  if (rpcErr) {
    return NextResponse.json({ error: rpcErr.message }, { status: 500 })
  }

  for (const row of (rows ?? [])) {
    stats.processed++
    try {
      if (!row.contact_email) {
        stats.skipped++
        continue
      }

      const [{ data: contactData }, { data: recentEvents }] = await Promise.all([
        supabase
          .from('contacts')
          .select('email_opt_out, referred_by')
          .eq('id', row.contact_id)
          .single(),
        supabase
          .from('activity_log')
          .select('event_type')
          .eq('contact_id', row.contact_id)
          .in('event_type', ['email.bounced', 'email.complained'])
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
          .limit(1),
      ])

      const recentBounce = (recentEvents ?? []).some(
        (e: { event_type: string | null }) => e.event_type === 'email.bounced'
      )
      const recentComplaint = (recentEvents ?? []).some(
        (e: { event_type: string | null }) => e.event_type === 'email.complained'
      )

      if (shouldExitDrip({
        email_opt_out: contactData?.email_opt_out ?? false,
        status: row.enrollment_status,
        recentBounce,
        recentComplaint,
      })) {
        await supabase
          .from('drip_enrollments')
          .update({ status: 'removed', removed_reason: 'exit_rule', next_send_at: null, updated_at: now })
          .eq('id', row.enrollment_id)
        stats.skipped++
        continue
      }

      if (!hasAuthoredEmail(row.campaign_id, row.step_order)) {
        // No authored content for this step → terminate the enrollment.
        // Without this update, next_send_at stays in the past and the RPC
        // returns the same row on every cron tick (infinite loop).
        await supabase
          .from('drip_enrollments')
          .update({ status: 'removed', removed_reason: 'no_authored_content', next_send_at: null, updated_at: now })
          .eq('id', row.enrollment_id)
        stats.skipped++
        continue
      }

      const referredBy = (contactData?.referred_by ?? '').trim()

      // Ghost Referral copy hard-codes "{{referred_by}} passed your name along".
      // If the referrer is missing, the email reads broken — skip the send but
      // still advance the enrollment so the contact moves through the sequence.
      const isGhostReferral = row.campaign_id === DRIP_CAMPAIGN_IDS.GHOST_REFERRAL
      const skipForMissingReferrer = isGhostReferral && !referredBy

      const authored = getAuthoredEmail(row.campaign_id, row.step_order)!
      const vars: Record<string, string> = {
        first_name: row.contact_first_name ?? '',
        referred_by: referredBy,
      }
      const htmlBody = buildEmailHtml(renderDripHtml(authored.plain, vars), row.contact_id)

      // Compute next_send_at from the step after the one we're about to fire
      const { data: nextStepRow } = await supabase
        .from('drip_steps')
        .select('trigger_config')
        .eq('campaign_id', row.campaign_id)
        .eq('step_order', row.step_order + 1)
        .maybeSingle()

      const nextTrigger = (nextStepRow?.trigger_config as unknown as TriggerConfig | null)
      const nextSendAt = typeof nextTrigger?.days === 'number'
        ? new Date(new Date(row.enrolled_at).getTime() + nextTrigger.days * 86400000).toISOString()
        : null

      // Advance enrollment BEFORE sending — idempotency guard if cron invocations overlap
      await supabase
        .from('drip_enrollments')
        .update({
          current_step: row.step_order,
          next_send_at: nextSendAt,
          status: nextSendAt ? 'active' : 'completed',
          updated_at: now,
        })
        .eq('id', row.enrollment_id)

      if (skipForMissingReferrer) {
        await supabase.from('drip_sends').insert({
          org_id: row.org_id,
          enrollment_id: row.enrollment_id,
          step_id: row.step_id,
          contact_id: row.contact_id,
          channel: 'email',
          status: 'skipped',
          generated_subject: authored.subject,
          generated_body: 'skipped: ghost_referral missing referred_by',
          sent_at: now,
        })
        stats.skipped++
        continue
      }

      const orgFrom = await getOrgFrom(row.org_id)
      await sendViaResend({
        to: row.contact_email,
        subject: authored.subject,
        body: htmlBody,
        from: orgFrom.from,
        replyTo: orgFrom.replyTo,
        tags: {
          campaign_id: row.campaign_id,
          enrollment_id: row.enrollment_id,
          step_order: String(row.step_order),
        },
        log: {
          organizationId: row.org_id,
          contactId: row.contact_id,
          template: `drip_step_${row.step_order}`,
        },
      })

      await supabase.from('drip_sends').insert({
        org_id: row.org_id,
        enrollment_id: row.enrollment_id,
        step_id: row.step_id,
        contact_id: row.contact_id,
        channel: 'email',
        status: 'sent',
        generated_subject: authored.subject,
        generated_body: htmlBody,
        sent_at: now,
      })

      stats.sent++
    } catch (err) {
      console.error(`[drip/run] enrollment ${row.enrollment_id}:`, err)
      stats.errors++
    }
  }

  return NextResponse.json({ ok: true, ...stats, at: now })
}
