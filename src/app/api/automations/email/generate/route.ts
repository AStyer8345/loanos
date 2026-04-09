import { NextRequest, NextResponse } from 'next/server'
import { getOrganization } from '@/lib/getOrganization'
import { checkRateLimit } from '@/lib/rateLimit'
import { createServiceClient } from '@/lib/supabase/service'
import { logEmailDraft } from '@/lib/supabase/logEmailDraft'

// No hardcoded fallback — if N8N_WEBHOOK_BASE is missing in env, the request
// must fail closed rather than silently routing every tenant's automations
// through Adam's personal n8n instance. Each deployment owns its own base URL.
const N8N_BASE = process.env.N8N_WEBHOOK_BASE ?? ''

export async function POST(req: NextRequest) {
  let userId: string
  let organizationId: string
  try {
    const ctx = await getOrganization()
    userId = ctx.userId
    organizationId = ctx.organizationId
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { allowed } = checkRateLimit(`automation-email-gen:${userId}`, 20, 60_000)
  if (!allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  try {
    const { automationRegistryId, recordType, recordId, webhookPath } = await req.json()

    if (!automationRegistryId || !recordType || !recordId) {
      return NextResponse.json(
        { error: 'Missing required fields: automationRegistryId, recordType, recordId' },
        { status: 400 }
      )
    }

    const supabase: any = createServiceClient() // eslint-disable-line @typescript-eslint/no-explicit-any

    // Look up automation in registry
    const { data: automation, error: regError } = await supabase
      .from('automation_registry')
      .select('*')
      .eq('id', automationRegistryId)
      .eq('org_id', organizationId)
      .single()

    if (regError || !automation) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 })
    }

    // Fetch record data
    let recordData: Record<string, unknown> = {}
    let contactId: string | undefined

    if (recordType === 'contact') {
      const { data: contact } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', recordId)
        .eq('organization_id', organizationId)
        .single()

      if (!contact) {
        return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
      }

      recordData = contact
      contactId = recordId
    } else if (recordType === 'loan') {
      const { data: loan } = await supabase
        .from('loans')
        .select('*')
        .eq('id', recordId)
        .eq('organization_id', organizationId)
        .single()

      if (!loan) {
        return NextResponse.json({ error: 'Loan not found' }, { status: 404 })
      }

      recordData = loan
      contactId = loan.contact_id || undefined

      // Fetch linked contact if available
      if (loan.contact_id) {
        const { data: contact } = await supabase
          .from('contacts')
          .select('first_name, last_name, email, phone')
          .eq('id', loan.contact_id)
          .eq('organization_id', organizationId)
          .single()

        if (contact) {
          recordData = { ...recordData, contact }
        }
      }
    } else {
      return NextResponse.json({ error: `Unknown recordType: ${recordType}` }, { status: 400 })
    }

    // Determine webhook path — use provided, fall back to automation config, then automation name
    const resolvedWebhookPath =
      webhookPath ||
      (automation.config as Record<string, unknown> | null)?.webhook_path ||
      automation.name

    if (!N8N_BASE) {
      return NextResponse.json(
        { error: 'N8N_WEBHOOK_BASE env var not configured on the server' },
        { status: 500 }
      )
    }
    const webhookUrl = `${N8N_BASE}/${resolvedWebhookPath}`

    // Call n8n webhook
    const n8nRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        record: recordData,
        recordType,
        recordId,
        config: automation.config,
        template: automation.template,
        automationName: automation.name,
      }),
    })

    if (!n8nRes.ok) {
      const errText = await n8nRes.text().catch(() => '')
      console.error('[automations/email/generate] n8n webhook failed:', n8nRes.status, errText)
      return NextResponse.json({ error: 'n8n webhook call failed' }, { status: 502 })
    }

    const n8nData: any = await n8nRes.json() // eslint-disable-line @typescript-eslint/no-explicit-any

    const subject: string = n8nData.subject || ''
    const body: string = n8nData.body || n8nData.body_html || ''
    const recipientEmail: string = n8nData.recipient_email || (recordData as Record<string, unknown>).email as string || ''
    const recipientName: string =
      n8nData.recipient_name ||
      `${(recordData as Record<string, unknown>).first_name ?? ''} ${(recordData as Record<string, unknown>).last_name ?? ''}`.trim()

    // Save draft
    const draft = await logEmailDraft({
      automation_name: automation.name,
      recipient_email: recipientEmail,
      recipient_name: recipientName,
      subject,
      body_html: body,
      contact_id: contactId,
      loan_id: recordType === 'loan' ? recordId : undefined,
      organization_id: organizationId,
    })

    if (!draft) {
      return NextResponse.json({ error: 'Failed to save draft' }, { status: 500 })
    }

    return NextResponse.json({ subject, body, draftId: draft.id })
  } catch (error) {
    console.error('[automations/email/generate] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
