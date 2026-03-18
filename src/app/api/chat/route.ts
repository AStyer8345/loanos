import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getAnthropicClient } from '@/lib/anthropic/client'
import { getOrganization } from '@/lib/getOrganization'

async function buildSystemPrompt(
  recordId: string,
  recordType: 'contact' | 'loan'
): Promise<string> {
  const supabase = createServiceClient()
  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  const base = `You are LoanOS AI — the operations brain for Adam Styer, a producing mortgage loan officer at Adam Styer | Mortgage Solutions LP in Austin, TX (NMLS #513013).

Today's date: ${todayStr}

Your job: help Adam close more loans faster by eliminating non-revenue tasks.

Adam's revenue-generating activities: realtor relationship calls, borrower conversion, pre-approval consults, referral meetings, solving file problems.
Everything else should be automated or delegated. When Adam asks you to do something that falls outside revenue-generating work, execute it efficiently.

You have access to Adam's loan pipeline and contact database. When a contact or loan record is injected below, use every field to give specific, contextual answers — never respond with generic advice.

Capabilities you excel at:
- Draft borrower emails (status updates, doc requests, pre-approval notifications, closing checklists)
- Draft realtor emails and texts (referral follow-up, pipeline updates, market updates, win announcements)
- Analyze loan files and flag issues, next steps, or missing items
- Create prioritized action lists and daily game plans
- Write internal notes, summaries, and condition responses
- Generate scripts for difficult borrower or realtor conversations

Communication rules:
- Always be direct, specific, and actionable
- Short punchy sentences — never bloated corporate language
- Lead with the answer, then explain if needed
- If you're drafting an email, write the full draft — don't outline it
- Use the contact's actual name, loan details, and dates from the injected context`

  if (recordType === 'contact') {
    const { data, error } = await supabase
      .from('contacts')
      .select(`
        first_name, last_name, email, phone,
        contact_type, stage, source,
        notes, closing_date,
        realtor_email, realtor_phone,
        mailing_street, mailing_city, mailing_state, mailing_zip,
        group_tag
      `)
      .eq('id', recordId)
      .maybeSingle()

    if (error) console.error('[chat/route] contact fetch error:', error)
    if (!data) return base

    const { data: loanRows } = await supabase
      .from('loans')
      .select('loan_amount, property_address, property_city, property_state, status, loan_type, loan_program, interest_rate, closing_date, estimated_closing_date, sales_price, buyer_agent_name')
      .eq('contact_id', recordId)
      .limit(1)

    const fullName = [data.first_name, data.last_name].filter(Boolean).join(' ')
    const loan = loanRows?.[0] ?? null
    const mailingParts = [data.mailing_street, data.mailing_city, data.mailing_state, data.mailing_zip].filter(Boolean)
    const mailingAddress = mailingParts.length ? mailingParts.join(', ') : null

    return `${base}

## Current Contact Record
- Name: ${fullName || 'N/A'}
- Email: ${data.email || 'N/A'}
- Phone: ${data.phone || 'N/A'}
- Type: ${data.contact_type || 'N/A'}
- Stage: ${data.stage || 'N/A'}
- Group: ${data.group_tag || 'N/A'}
- Source: ${data.source || 'N/A'}
- Mailing Address: ${mailingAddress || 'N/A'}
- Closing Date: ${data.closing_date || 'N/A'}
- Realtor Email: ${data.realtor_email || 'N/A'}
- Realtor Phone: ${data.realtor_phone || 'N/A'}
- Notes: ${data.notes || 'None'}
${loan ? `
## Associated Loan
- Amount: ${loan.loan_amount ? `$${Number(loan.loan_amount).toLocaleString()}` : 'N/A'}
- Purchase Price: ${loan.sales_price ? `$${Number(loan.sales_price).toLocaleString()}` : 'N/A'}
- Interest Rate: ${loan.interest_rate ? `${loan.interest_rate}%` : 'N/A'}
- Property: ${[loan.property_address, loan.property_city, loan.property_state].filter(Boolean).join(', ') || 'N/A'}
- Type: ${loan.loan_type || 'N/A'}
- Program: ${loan.loan_program || 'N/A'}
- Status: ${loan.status || 'N/A'}
- Close Date: ${loan.closing_date || loan.estimated_closing_date || 'N/A'}
- Buyer's Agent: ${loan.buyer_agent_name || 'N/A'}` : ''}`
  }

  // recordType === 'loan'
  const { data, error: loanError } = await supabase
    .from('loans')
    .select(`
      loan_name, loan_number, loan_amount, loan_type, loan_program,
      property_address, property_city, property_state,
      loan_purpose, occupancy, status, contact_id,
      sales_price, interest_rate, closing_date, estimated_closing_date,
      buyer_agent_name, buyer_agent_email, buyer_agent_brokerage,
      listing_agent_name, listing_agent_email,
      title_company, county, seller_concessions,
      down_payment_pct, estimated_ltv, effective_date,
      borrower_name, borrower_first_name, borrower_last_name
    `)
    .eq('id', recordId)
    .maybeSingle()

  if (loanError) console.error('[chat/route] loan fetch error:', loanError)
  if (!data) return base

  let contact: { first_name: string; last_name: string; email: string; phone: string } | null = null
  if (data.contact_id) {
    const { data: contactRow } = await supabase
      .from('contacts')
      .select('first_name, last_name, email, phone')
      .eq('id', data.contact_id)
      .maybeSingle()
    contact = contactRow ?? null
  }

  const borrowerName = data.borrower_name
    || [data.borrower_first_name, data.borrower_last_name].filter(Boolean).join(' ')
    || (contact ? [contact.first_name, contact.last_name].filter(Boolean).join(' ') : '')
    || 'N/A'
  const propertyFull = [data.property_address, data.property_city, data.property_state]
    .filter(Boolean)
    .join(', ')
  const closeDate = data.closing_date || data.estimated_closing_date

  return `${base}

## Current Loan Record
- Loan Name: ${data.loan_name || 'N/A'}
- Loan Number: ${data.loan_number || 'N/A'}
- Borrower: ${borrowerName}
- Borrower Email: ${contact?.email || 'N/A'}
- Borrower Phone: ${contact?.phone || 'N/A'}
- Loan Amount: ${data.loan_amount ? `$${Number(data.loan_amount).toLocaleString()}` : 'N/A'}
- Purchase Price: ${data.sales_price ? `$${Number(data.sales_price).toLocaleString()}` : 'N/A'}
- Interest Rate: ${data.interest_rate ? `${data.interest_rate}%` : 'N/A'}
- Down Payment: ${data.down_payment_pct ? `${data.down_payment_pct}%` : 'N/A'}
- LTV: ${data.estimated_ltv ? `${data.estimated_ltv}%` : 'N/A'}
- Seller Concessions: ${data.seller_concessions ? `$${Number(data.seller_concessions).toLocaleString()}` : 'N/A'}
- Type: ${data.loan_type || 'N/A'}
- Program: ${data.loan_program || 'N/A'}
- Purpose: ${data.loan_purpose || 'N/A'}
- Occupancy: ${data.occupancy || 'N/A'}
- Property: ${propertyFull || 'N/A'}
- County: ${data.county || 'N/A'}
- Status: ${data.status || 'N/A'}
- Close Date: ${closeDate || 'N/A'}
- Effective Date: ${data.effective_date || 'N/A'}
- Title Company: ${data.title_company || 'N/A'}
- Buyer's Agent: ${data.buyer_agent_name || 'N/A'}${data.buyer_agent_email ? ` (${data.buyer_agent_email})` : ''}${data.buyer_agent_brokerage ? ` — ${data.buyer_agent_brokerage}` : ''}
- Listing Agent: ${data.listing_agent_name || 'N/A'}${data.listing_agent_email ? ` (${data.listing_agent_email})` : ''}`
}

// POST /api/chat — send a message
export async function POST(req: NextRequest) {
  try {
    await getOrganization()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { messages, recordId, recordType, sessionId } = await req.json()

    if (!messages || !recordId || !recordType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const systemPrompt = await buildSystemPrompt(recordId, recordType)

    const anthropic = await getAnthropicClient()
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2048,
      system: systemPrompt,
      messages,
    })

    const assistantMessage = {
      role: 'assistant' as const,
      content: response.content[0].type === 'text' ? response.content[0].text : '',
    }

    const updatedMessages = [...messages, assistantMessage]
    const supabase = createServiceClient()

    let newSessionId = sessionId
    if (sessionId) {
      await supabase
        .from('chat_sessions')
        .update({ messages: updatedMessages })
        .eq('id', sessionId)
    } else {
      const { data } = await supabase
        .from('chat_sessions')
        .insert({ record_id: recordId, record_type: recordType, messages: updatedMessages })
        .select('id')
        .single()
      newSessionId = data?.id
    }

    return NextResponse.json({ message: assistantMessage, sessionId: newSessionId })
  } catch (error) {
    console.error('[chat/route] POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/chat?recordId=&recordType= — load most recent session
export async function GET(req: NextRequest) {
  try {
    await getOrganization()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const recordId = searchParams.get('recordId')
    const recordType = searchParams.get('recordType')

    if (!recordId || !recordType) {
      return NextResponse.json({ error: 'Missing recordId or recordType' }, { status: 400 })
    }

    const supabase = createServiceClient()
    const { data } = await supabase
      .from('chat_sessions')
      .select('id, messages, updated_at')
      .eq('record_id', recordId)
      .eq('record_type', recordType)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!data) {
      return NextResponse.json({ sessionId: null, messages: [], lastActive: null })
    }

    return NextResponse.json({
      sessionId: data.id,
      messages: data.messages,
      lastActive: data.updated_at,
    })
  } catch (error) {
    console.error('[chat/route] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
