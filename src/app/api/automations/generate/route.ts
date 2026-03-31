import { NextRequest, NextResponse } from 'next/server'
import { getOrganization } from '@/lib/getOrganization'
import { checkRateLimit } from '@/lib/rateLimit'
import { getAnthropicClient } from '@/lib/anthropic/client'
import { CLAUDE_MODEL } from '@/lib/anthropic/model'
import { createServiceClient } from '@/lib/supabase/service'
import { logEmailDraft } from '@/lib/supabase/logEmailDraft'
import { getAutomationById } from '@/lib/automations/definitions'
import { buildAutomationPrompt } from '@/lib/automations/prompts'
import type { AutomationRecord } from '@/lib/automations/prompts'

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

  const { allowed } = checkRateLimit(`automation-gen:${userId}`, 20, 60_000)
  if (!allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  try {
    const { automationId, recordType, recordId } = await req.json()

    if (!automationId || !recordType || !recordId) {
      return NextResponse.json({ error: 'Missing required fields: automationId, recordType, recordId' }, { status: 400 })
    }

    const def = getAutomationById(automationId)
    if (!def) {
      return NextResponse.json({ error: `Unknown automation: ${automationId}` }, { status: 400 })
    }

    const supabase: any = createServiceClient() // eslint-disable-line @typescript-eslint/no-explicit-any

    // Fetch LO profile + org name
    const [{ data: profile }, { data: org }] = await Promise.all([
      supabase.from('profiles').select('full_name').eq('id', userId).single(),
      supabase.from('organizations').select('name').eq('id', organizationId).single(),
    ])

    const loName = profile?.full_name || 'Your Loan Officer'
    const orgName = org?.name || 'Mortgage Solutions'

    // Build the record data for prompt generation
    const record: AutomationRecord = { orgName, loName }

    if (recordType === 'contact') {
      const { data: contact } = await supabase
        .from('contacts')
        .select('first_name, last_name, email, phone, referred_by')
        .eq('id', recordId)
        .eq('organization_id', organizationId)
        .single()

      if (!contact) {
        return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
      }

      record.contact = {
        first_name: contact.first_name,
        last_name: contact.last_name,
        email: contact.email,
        phone_mobile: contact.phone,
      }

      // Try to find referral contact if referred_by is set
      if (contact.referred_by) {
        const { data: referrer } = await supabase
          .from('contacts')
          .select('first_name, last_name, email')
          .or(`first_name.ilike.%${contact.referred_by.split(' ')[0]}%`)
          .eq('organization_id', organizationId)
          .limit(1)
          .maybeSingle()

        if (referrer) {
          record.referralContact = referrer
        }
      }
    } else if (recordType === 'loan') {
      const { data: loan } = await supabase
        .from('loans')
        .select('loan_amount, interest_rate, closing_date, property_address, property_city, property_state, loan_type, loan_purpose, status, contact_id, borrower_first_name, borrower_last_name, borrower_email, borrower_phone, buyer_agent_contact_id, listing_agent_contact_id, referring_agent_name, referring_agent_email')
        .eq('id', recordId)
        .eq('organization_id', organizationId)
        .single()

      if (!loan) {
        return NextResponse.json({ error: 'Loan not found' }, { status: 404 })
      }

      record.loan = {
        loan_amount: loan.loan_amount,
        interest_rate: loan.interest_rate,
        closing_date: loan.closing_date,
        property_address: loan.property_address,
        property_city: loan.property_city,
        property_state: loan.property_state,
        loan_type: loan.loan_type,
        loan_purpose: loan.loan_purpose,
        status: loan.status,
      }

      // Fetch linked contact
      if (loan.contact_id) {
        const { data: contact } = await supabase
          .from('contacts')
          .select('first_name, last_name, email, phone')
          .eq('id', loan.contact_id)
          .single()

        if (contact) {
          record.contact = {
            first_name: contact.first_name ?? loan.borrower_first_name,
            last_name: contact.last_name ?? loan.borrower_last_name,
            email: contact.email ?? loan.borrower_email,
            phone_mobile: contact.phone ?? loan.borrower_phone,
          }
        }
      }

      if (!record.contact) {
        record.contact = {
          first_name: loan.borrower_first_name,
          last_name: loan.borrower_last_name,
          email: loan.borrower_email,
          phone_mobile: loan.borrower_phone,
        }
      }

      // Fetch buyer agent contact
      if (loan.buyer_agent_contact_id) {
        const { data: agent } = await supabase
          .from('contacts')
          .select('first_name, last_name, email')
          .eq('id', loan.buyer_agent_contact_id)
          .single()

        if (agent) record.agentContact = agent
      }

      // Referral contact from referring agent name
      if (loan.referring_agent_name) {
        record.referralContact = {
          first_name: loan.referring_agent_name.split(' ')[0] || null,
          last_name: loan.referring_agent_name.split(' ').slice(1).join(' ') || null,
          email: loan.referring_agent_email,
        }
      }
    }

    // Build prompt and call Claude
    const { system, userMessage } = buildAutomationPrompt(automationId, record)
    const anthropic = await getAnthropicClient()

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1000,
      system,
      messages: [{ role: 'user', content: userMessage }],
    })

    const text = response.content.find(b => b.type === 'text')?.text ?? ''

    // Parse JSON response — handle potential markdown fences
    let subject = ''
    let body = ''
    try {
      const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
      const parsed = JSON.parse(cleaned)
      subject = parsed.subject || ''
      body = parsed.body || ''
    } catch {
      // If JSON parsing fails, use the raw text as body
      subject = `${def.label}`
      body = text
    }

    // Determine recipient
    const recipientEmail = def.recipient === 'agent'
      ? (record.agentContact?.email || record.referralContact?.email || record.contact?.email || '')
      : (record.contact?.email || '')

    const recipientName = def.recipient === 'agent'
      ? (contactNameStr(record.agentContact) || contactNameStr(record.referralContact) || contactNameStr(record.contact))
      : contactNameStr(record.contact)

    // Save draft
    const loanContactId = recordType === 'loan' ? await getLoanContactId(supabase, recordId) : undefined

    const draft = await logEmailDraft({
      automation_name: automationId,
      recipient_email: recipientEmail,
      recipient_name: recipientName,
      subject,
      body_html: body,
      contact_id: recordType === 'contact' ? recordId : (loanContactId || undefined),
      loan_id: recordType === 'loan' ? recordId : undefined,
      organization_id: organizationId,
    })

    if (!draft) {
      return NextResponse.json({ error: 'Failed to save draft' }, { status: 500 })
    }

    return NextResponse.json({ subject, body, draftId: draft.id })
  } catch (error) {
    console.error('[automations/generate] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function contactNameStr(c?: { first_name: string | null; last_name: string | null } | null): string {
  if (!c) return ''
  return `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim()
}

async function getLoanContactId(supabase: any, loanId: string): Promise<string | undefined> { // eslint-disable-line @typescript-eslint/no-explicit-any
  const { data } = await supabase
    .from('loans')
    .select('contact_id')
    .eq('id', loanId)
    .single()
  return data?.contact_id || undefined
}
