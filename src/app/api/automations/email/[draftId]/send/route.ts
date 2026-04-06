import { NextRequest, NextResponse } from 'next/server'
import { getOrganization } from '@/lib/getOrganization'
import { createServiceClient } from '@/lib/supabase/service'
import { writeActivityWithPii } from '@/lib/activity/pii'

export async function POST(
  _req: NextRequest,
  { params }: { params: { draftId: string } }
) {
  let organizationId: string
  let userId: string
  try {
    const ctx = await getOrganization()
    organizationId = ctx.organizationId
    userId = ctx.userId
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { draftId } = params

    const webhookUrl = process.env.N8N_OUTLOOK_DRAFT_WEBHOOK_URL
    if (!webhookUrl) {
      return NextResponse.json(
        { error: 'Email dispatch not configured — set N8N_OUTLOOK_DRAFT_WEBHOOK_URL' },
        { status: 503 }
      )
    }

    const supabase: any = createServiceClient() // eslint-disable-line @typescript-eslint/no-explicit-any

    // Fetch draft
    const { data: draft, error: fetchError } = await supabase
      .from('email_drafts')
      .select('*')
      .eq('id', draftId)
      .eq('organization_id', organizationId)
      .single()

    if (fetchError || !draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
    }

    if (draft.status !== 'pending') {
      return NextResponse.json(
        { error: `Draft status is "${draft.status}", expected "pending"` },
        { status: 400 }
      )
    }

    if (!draft.recipient_email) {
      return NextResponse.json({ error: 'No recipient email on this draft' }, { status: 400 })
    }

    // Send to n8n → Outlook
    const n8nRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: draft.recipient_email,
        subject: draft.subject,
        body: draft.body_html,
        recipientName: draft.recipient_name || '',
      }),
    })

    if (!n8nRes.ok) {
      console.error(
        '[automations/email/send] n8n webhook failed:',
        n8nRes.status,
        await n8nRes.text().catch(() => '')
      )
      return NextResponse.json({ error: 'Failed to send via Outlook' }, { status: 502 })
    }

    // Update draft status to sent
    await supabase
      .from('email_drafts')
      .update({ status: 'sent', updated_at: new Date().toISOString() })
      .eq('id', draftId)
      .eq('organization_id', organizationId)

    // Log activity + update last_touch_at if contact linked
    const summary = `Email sent to ${draft.recipient_name || draft.recipient_email}`

    const activityPublic = {
      contact_id: draft.contact_id || null,
      loan_id: draft.loan_id || null,
      action: 'email_sent',
      type: 'email_sent',
      entity_type: 'contact',
      occurred_at: new Date().toISOString(),
      user_id: userId,
      organization_id: organizationId,
    }
    const activityPii = {
      summary,
      metadata: {
        automation_name: draft.automation_name,
        subject: draft.subject,
        draft_id: draftId,
      },
    }

    if (draft.contact_id) {
      await Promise.all([
        supabase
          .from('contacts')
          .update({ last_touch_at: new Date().toISOString() })
          .eq('id', draft.contact_id),
        writeActivityWithPii(supabase, activityPublic, activityPii),
      ])
    } else {
      await writeActivityWithPii(supabase, activityPublic, activityPii)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[automations/email/send] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
