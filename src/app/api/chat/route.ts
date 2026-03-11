import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

// Service role client — bypasses RLS, server-only, never expose to browser
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, serviceKey)
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function buildSystemPrompt(
  recordId: string,
  recordType: 'contact' | 'loan'
): Promise<string> {
  const supabase = getServiceClient()
  const base =
    "You are LoanOS Assistant — an AI built into the LoanOS CRM for loan officer Adam Styer (NMLS #513013, Adam Styer | Mortgage Solutions LP, Austin TX). Be direct, specific, and use the contact data. Never be generic."

  if (recordType === 'contact') {
    const { data, error } = await supabase
      .from('contacts')
      .select(`
        first_name, last_name, email, phone, mobile_phone,
        contact_type, stage, lead_source, referred_by,
        company_name, notes, last_touch, closing_date,
        top_realtor, target_realtor
      `)
      .eq('id', recordId)
      .maybeSingle()

    if (error) console.error('[chat/route] contact fetch error:', error)
    if (!data) return base

    const { data: loanRows } = await supabase
      .from('loans')
      .select('loan_amount, property_address, status, loan_type, loan_program')
      .eq('contact_id', recordId)
      .limit(1)

    const fullName = [data.first_name, data.last_name].filter(Boolean).join(' ')
    const loan = loanRows?.[0] ?? null

    return `${base}

## Current Contact Record
- Name: ${fullName || 'N/A'}
- Email: ${data.email || 'N/A'}
- Phone: ${data.phone || data.mobile_phone || 'N/A'}
- Type: ${data.contact_type || 'N/A'}
- Stage: ${data.stage || 'N/A'}
- Lead Source: ${data.lead_source || 'N/A'}
- Referred By: ${data.referred_by || 'N/A'}
- Company: ${data.company_name || 'N/A'}
- Last Touch: ${data.last_touch || 'N/A'}
- Closing Date: ${data.closing_date || 'N/A'}
- Top Realtor: ${data.top_realtor ? 'Yes' : 'No'}
- Target Realtor: ${data.target_realtor ? 'Yes' : 'No'}
- Notes: ${data.notes || 'None'}
${loan ? `
## Associated Loan
- Amount: ${loan.loan_amount ? `$${Number(loan.loan_amount).toLocaleString()}` : 'N/A'}
- Property: ${loan.property_address || 'N/A'}
- Type: ${loan.loan_type || 'N/A'}
- Program: ${loan.loan_program || 'N/A'}
- Status: ${loan.status || 'N/A'}` : ''}`
  }

  // recordType === 'loan'
  const { data, error: loanError } = await supabase
    .from('loans')
    .select(`
      loan_name, loan_number, loan_amount, loan_type, loan_program,
      property_address, property_city, property_state,
      loan_purpose, occupancy, status, contact_id
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

  const borrowerName = contact
    ? [contact.first_name, contact.last_name].filter(Boolean).join(' ')
    : 'N/A'
  const propertyFull = [data.property_address, data.property_city, data.property_state]
    .filter(Boolean)
    .join(', ')

  return `${base}

## Current Loan Record
- Loan Name: ${data.loan_name || 'N/A'}
- Loan Number: ${data.loan_number || 'N/A'}
- Borrower: ${borrowerName}
- Borrower Email: ${contact?.email || 'N/A'}
- Borrower Phone: ${contact?.phone || 'N/A'}
- Amount: ${data.loan_amount ? `$${Number(data.loan_amount).toLocaleString()}` : 'N/A'}
- Type: ${data.loan_type || 'N/A'}
- Program: ${data.loan_program || 'N/A'}
- Purpose: ${data.loan_purpose || 'N/A'}
- Occupancy: ${data.occupancy || 'N/A'}
- Property: ${propertyFull || 'N/A'}
- Status: ${data.status || 'N/A'}`
}

// POST /api/chat — send a message
export async function POST(req: NextRequest) {
  try {
    const { messages, recordId, recordType, sessionId } = await req.json()

    if (!messages || !recordId || !recordType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const systemPrompt = await buildSystemPrompt(recordId, recordType)

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    })

    const assistantMessage = {
      role: 'assistant' as const,
      content: response.content[0].type === 'text' ? response.content[0].text : '',
    }

    const updatedMessages = [...messages, assistantMessage]
    const supabase = getServiceClient()

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
    const { searchParams } = new URL(req.url)
    const recordId = searchParams.get('recordId')
    const recordType = searchParams.get('recordType')

    if (!recordId || !recordType) {
      return NextResponse.json({ error: 'Missing recordId or recordType' }, { status: 400 })
    }

    const supabase = getServiceClient()
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
