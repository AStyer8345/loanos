import { NextRequest, NextResponse } from 'next/server'
import { getOrganization } from '@/lib/getOrganization'
import { createServiceClient } from '@/lib/supabase/service'
import { getAutomationById } from '@/lib/automations/definitions'

export async function POST(req: NextRequest) {
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
    const { draftId } = await req.json()

    if (!draftId) {
      return NextResponse.json({ error: 'Missing required field: draftId' }, { status: 400 })
    }

    const webhookUrl = process.env.N8N_OUTLOOK_DRAFT_WEBHOOK_URL
    if (!webhookUrl) {
      return NextResponse.json(
        { error: 'Email dispatch not configured — set N8N_OUTLOOK_DRAFT_WEBHOOK_URL' },
        { status: 503 },
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = createServiceClient()

    // Fetch the draft
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
      return NextResponse.json({ error: `Draft status is "${draft.status}", expected "pending"` }, { status: 400 })
    }

    if (!draft.recipient_email) {
      return NextResponse.json({ error: 'No recipient email on this draft' }, { status: 400 })
    }

    // Send to n8n webhook
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
      console.error('[automations/send] n8n webhook failed:', n8nRes.status, await n8nRes.text().catch(() => ''))
      return NextResponse.json({ error: 'Failed to create Outlook draft' }, { status: 502 })
    }

    // Update draft status to sent
    await supabase
      .from('email_drafts')
      .update({ status: 'sent', updated_at: new Date().toISOString() })
      .eq('id', draftId)
      .eq('organization_id', organizationId)

    // Log activity
    const def = getAutomationById(draft.automation_name)
    const automationLabel = def?.label || draft.automation_name

    if (draft.contact_id) {
      await Promise.all([
        supabase
          .from('contacts')
          .update({ last_touch_at: new Date().toISOString() })
          .eq('id', draft.contact_id),
        supabase.from('activity_log').insert({
          contact_id: draft.contact_id,
          loan_id: draft.loan_id || null,
          action: 'email_sent',
          type: 'email_sent',
          summary: `${automationLabel} sent to ${draft.recipient_name || draft.recipient_email}`,
          entity_type: 'contact',
          occurred_at: new Date().toISOString(),
          user_id: userId,
          organization_id: organizationId,
          metadata: { automation_id: draft.automation_name, subject: draft.subject } as never,
        }),
      ])
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[automations/send] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
