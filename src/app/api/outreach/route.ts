import { NextRequest, NextResponse } from 'next/server'
import { getAnthropicClient } from '@/lib/anthropic/client'
import { getOrganization } from '@/lib/getOrganization'
import { createServiceClient } from '@/lib/supabase/service'
import { DEFAULT_OUTREACH_PROMPT } from '@/lib/defaultOutreachPrompt'

async function buildSystemPrompt(
  organizationId: string,
  contactNames?: string[]
): Promise<string> {
  const supabase = createServiceClient()

  // Load custom prompt from DB, fall back to default
  const { data: promptRow } = await supabase
    .from('system_prompts')
    .select('content')
    .eq('org_id', organizationId)
    .eq('name', 'outreach')
    .maybeSingle()

  const base = promptRow?.content ?? DEFAULT_OUTREACH_PROMPT

  // Fetch pipeline context in parallel
  const [loansRes, contactsRes] = await Promise.all([
    supabase
      .from('loans')
      .select('loan_name, borrower_name, borrower_first_name, borrower_last_name, status, loan_amount, closing_date, estimated_closing_date, property_city, property_state, loan_type')
      .eq('organization_id', organizationId)
      .not('status', 'in', '("Closed","Funded","Cancelled","Withdrawn")')
      .order('closing_date', { ascending: true })
      .limit(20),
    supabase
      .from('contacts')
      .select('contact_type, stage')
      .eq('organization_id', organizationId),
  ])

  const loans = loansRes.data ?? []
  const contacts = contactsRes.data ?? []

  // Summarize contacts by type
  const contactCounts: Record<string, number> = {}
  for (const c of contacts) {
    const t = c.contact_type || 'Unknown'
    contactCounts[t] = (contactCounts[t] ?? 0) + 1
  }
  const contactSummary = Object.entries(contactCounts)
    .map(([type, count]) => `${count} ${type}`)
    .join(', ')

  // Build pipeline section
  let pipelineSection = `\n\n## Pipeline Context\n- Total contacts: ${contacts.length}${contactSummary ? ` (${contactSummary})` : ''}\n- Active loans in process: ${loans.length}`

  if (loans.length > 0) {
    const loanLines = loans.map(l => {
      const name = l.loan_name
        || [l.borrower_first_name, l.borrower_last_name].filter(Boolean).join(' ')
        || l.borrower_name
        || 'Unknown'
      const location = [l.property_city, l.property_state].filter(Boolean).join(', ')
      const close = l.closing_date || l.estimated_closing_date
      const amount = l.loan_amount ? `$${Number(l.loan_amount).toLocaleString()}` : null
      const parts = [l.status, l.loan_type, location, amount, close ? `closes ${close}` : null].filter(Boolean)
      return `  - ${name}${parts.length ? ` — ${parts.join(', ')}` : ''}`
    })
    pipelineSection += '\n' + loanLines.join('\n')
  }

  const fullBase = `${base}${pipelineSection}`

  if (contactNames && contactNames.length > 0) {
    return `${fullBase}\n\nCurrently selected contacts: ${contactNames.join(', ')}\nWhen drafting emails or texts for these contacts, personalize where possible. Keep messages concise.`
  }

  return fullBase
}

export async function POST(req: NextRequest) {
  let organizationId: string
  try {
    const ctx = await getOrganization()
    organizationId = ctx.organizationId
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { messages, selectedContacts, generateType } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array required' }, { status: 400 })
    }

    const contactNames = selectedContacts?.map(
      (c: { first_name?: string; last_name?: string }) =>
        [c.first_name, c.last_name].filter(Boolean).join(' ') || 'Unknown'
    )

    let systemPrompt = await buildSystemPrompt(organizationId, contactNames)

    if (generateType === 'email') {
      systemPrompt += `\n\nGenerate a professional email body. No subject line — just the body text. Keep it under 150 words. Include a signature line: "Adam Styer | Mortgage Solutions LP | NMLS #513013"`
    } else if (generateType === 'text') {
      systemPrompt += `\n\nGenerate a short text message. Keep it under 300 characters. Casual but professional. No signature block needed.`
    }

    const anthropic = await getAnthropicClient()
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    })

    const text =
      response.content[0].type === 'text' ? response.content[0].text : ''

    return NextResponse.json({ message: text })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Internal server error'
    console.error('[outreach] error:', error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
