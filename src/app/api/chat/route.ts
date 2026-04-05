import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getAnthropicClient } from '@/lib/anthropic/client'
import { getOrganization } from '@/lib/getOrganization'
import { checkRateLimit } from '@/lib/rateLimit'
import { DEFAULT_SYSTEM_PROMPT } from '@/lib/defaultSystemPrompt'
import { DEFAULT_OUTREACH_PROMPT } from '@/lib/defaultOutreachPrompt'
import { getLoIdentity } from '@/lib/getLoIdentity'
import { CLAUDE_MODEL } from '@/lib/anthropic/model'
import { listLendersForOrg, searchLendersByName } from '@/lib/chat/lenderQueries'
import type { MessageParam, ContentBlockParam } from '@anthropic-ai/sdk/resources/messages'

type Attachment = {
  type: 'image' | 'pdf'
  mimeType: string
  name: string
  data: string // raw base64, no data URI prefix
}

function buildUserContent(text: string, attachments: Attachment[]): ContentBlockParam[] {
  const blocks: ContentBlockParam[] = []
  for (const att of attachments) {
    if (att.type === 'image') {
      blocks.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: att.mimeType as 'image/jpeg' | 'image/png' | 'image/webp',
          data: att.data,
        },
      })
    } else {
      blocks.push({
        type: 'document',
        source: {
          type: 'base64',
          media_type: 'application/pdf' as const,
          data: att.data,
        },
      })
    }
  }
  blocks.push({ type: 'text', text })
  return blocks
}

// ── NotebookLM tool ──────────────────────────────────────────────────────────
const NOTEBOOKLM_SERVICE_URL = process.env.NOTEBOOKLM_SERVICE_URL || 'http://localhost:8001'

const MORTGAGE_KB_TOOL = {
  name: 'query_mortgage_knowledge_base',
  description: `Search the LoanOS mortgage knowledge base for accurate, detailed information.
Use this tool whenever the user asks about:
- Fannie Mae or Freddie Mac guidelines (DTI limits, LTV, income types, asset requirements)
- Loan programs (Conventional, FHA, VA, USDA, Jumbo, Non-QM)
- Mortgage compliance requirements (TRID, RESPA, ECOA, fair lending)
- Underwriting criteria or overlays
- Marketing strategies for loan officers
- Industry best practices or regulatory questions
- Lender-specific guidelines, overlays, or product details (use this for deep guideline questions)
Do NOT use for general CRM questions, pipeline updates, or contact management.
Do NOT use for looking up lender contacts/AEs — use query_lender_database for that.`,
  input_schema: {
    type: 'object' as const,
    properties: {
      question: {
        type: 'string',
        description: 'The specific mortgage question to look up in the knowledge base.',
      },
    },
    required: ['question'],
  },
}

const LENDER_DB_TOOL = {
  name: 'query_lender_database',
  description: `Look up wholesale/correspondent lender information from the lender database.
Use this tool whenever the user asks about:
- Who is our AE (account executive) for a specific lender
- Lender contact information (name, phone, email)
- Which lenders we work with or are approved with
- Which lenders offer a specific product or specialty (HELOC, Non-QM, DSCR, ITIN, Bank Statement, etc.)
- Lender portal/website URLs
- Broker IDs for specific lenders
- Lender channel type (broker only vs. correspondent)
This is a structured database lookup — use it for contacts, products, and lender info. For deep guideline or overlay questions, use query_mortgage_knowledge_base instead.`,
  input_schema: {
    type: 'object' as const,
    properties: {
      search: {
        type: 'string',
        description: 'The lender name to search for, or a product/specialty to find lenders that offer it (e.g. "PRMG", "HELOC", "Non-QM", "all").',
      },
    },
    required: ['search'],
  },
}

async function queryNotebookLM(question: string): Promise<string> {
  try {
    const res = await fetch(`${NOTEBOOKLM_SERVICE_URL}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
      signal: AbortSignal.timeout(30_000),
    })
    if (!res.ok) return `Knowledge base unavailable (HTTP ${res.status}).`
    const data = await res.json()
    const sources = data.sources?.length
      ? `\n\nSources: ${data.sources.join(', ')}`
      : ''
    return (data.answer || 'No answer returned.') + sources
  } catch {
    // Service not running or unreachable — Claude answers from its own knowledge
    return ''
  }
}

async function queryLenderDatabase(search: string, organizationId: string): Promise<string> {
  // All lender queries go through the tenant-scoped helper in
  // `src/lib/chat/lenderQueries.ts`, which throws on missing orgId and
  // enforces `.eq('organization_id', organizationId)` in one place. See A-9.
  const term = search.trim().toLowerCase()

  if (term === 'all' || term === 'list' || term === 'lenders') {
    const rows = await listLendersForOrg(organizationId)
    if (!rows.length) return 'No lenders found in the database.'
    return JSON.stringify(rows, null, 2)
  }

  const nameMatch = await searchLendersByName(organizationId, term)
  if (nameMatch.length) return JSON.stringify(nameMatch, null, 2)

  const allLenders = await listLendersForOrg(organizationId)
  const productMatch = allLenders.filter((l) =>
    l.specialty_products?.some((p) => p.toLowerCase().includes(term))
    || l.notes?.toLowerCase().includes(term)
  )

  if (productMatch.length) return JSON.stringify(productMatch, null, 2)

  return `No lenders found matching "${search}". Try a lender name (e.g. "PRMG") or product type (e.g. "HELOC", "Non-QM").`
}

type SelectedContact = {
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
}

async function buildSystemPrompt(
  organizationId: string,
  recordId?: string,
  recordType?: 'contact' | 'loan',
  selectedContacts?: SelectedContact[],
  generateType?: 'email' | 'text'
): Promise<string> {
  const supabase = createServiceClient()
  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })

  // Load custom base prompt from DB, fall back to merged default
  const { data: promptRow } = await supabase
    .from('system_prompts')
    .select('content')
    .eq('org_id', organizationId)
    .eq('name', 'base')
    .maybeSingle()

  const basePrompt = promptRow?.content ?? `${DEFAULT_SYSTEM_PROMPT}

${DEFAULT_OUTREACH_PROMPT}`

  let prompt = `${basePrompt}

Today's date: ${todayStr}`

  // Always include pipeline context
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

  const contactCounts: Record<string, number> = {}
  for (const c of contacts) {
    const t = c.contact_type || 'Unknown'
    contactCounts[t] = (contactCounts[t] ?? 0) + 1
  }
  const contactSummary = Object.entries(contactCounts)
    .map(([type, count]) => `${count} ${type}`)
    .join(', ')

  prompt += `\n\n## Pipeline\n- Total contacts: ${contacts.length}${contactSummary ? ` (${contactSummary})` : ''}\n- Active loans: ${loans.length}`

  if (loans.length > 0) {
    const loanLines = loans.map(l => {
      const name = l.loan_name
        || [l.borrower_first_name, l.borrower_last_name].filter(Boolean).join(' ')
        || l.borrower_name || 'Unknown'
      const location = [l.property_city, l.property_state].filter(Boolean).join(', ')
      const close = l.closing_date || l.estimated_closing_date
      const amount = l.loan_amount ? `$${Number(l.loan_amount).toLocaleString()}` : null
      const parts = [l.status, l.loan_type, location, amount, close ? `closes ${close}` : null].filter(Boolean)
      return `  - ${name}${parts.length ? ` — ${parts.join(', ')}` : ''}`
    })
    prompt += '\n' + loanLines.join('\n')
  }

  // Add record-specific context if on a record page
  if (recordId && recordType === 'contact') {
    const { data } = await supabase
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
      .eq('organization_id', organizationId)
      .maybeSingle()

    if (data) {
      const { data: loanRows } = await supabase
        .from('loans')
        .select('loan_amount, property_address, property_city, property_state, status, loan_type, loan_program, interest_rate, closing_date, estimated_closing_date, sales_price, buyer_agent_name')
        .eq('contact_id', recordId)
        .eq('organization_id', organizationId)
        .limit(1)

      const fullName = [data.first_name, data.last_name].filter(Boolean).join(' ')
      const loan = loanRows?.[0] ?? null
      const mailingParts = [data.mailing_street, data.mailing_city, data.mailing_state, data.mailing_zip].filter(Boolean)
      const mailingAddress = mailingParts.length ? mailingParts.join(', ') : null

      prompt += `\n\n## Active Contact Record\n- Name: ${fullName || 'N/A'}\n- Email: ${data.email || 'N/A'}\n- Phone: ${data.phone || 'N/A'}\n- Type: ${data.contact_type || 'N/A'}\n- Stage: ${data.stage || 'N/A'}\n- Group: ${data.group_tag || 'N/A'}\n- Source: ${data.source || 'N/A'}\n- Mailing Address: ${mailingAddress || 'N/A'}\n- Closing Date: ${data.closing_date || 'N/A'}\n- Realtor Email: ${data.realtor_email || 'N/A'}\n- Realtor Phone: ${data.realtor_phone || 'N/A'}\n- Notes: ${data.notes || 'None'}`

      if (loan) {
        prompt += `\n\n## Associated Loan\n- Amount: ${loan.loan_amount ? `$${Number(loan.loan_amount).toLocaleString()}` : 'N/A'}\n- Purchase Price: ${loan.sales_price ? `$${Number(loan.sales_price).toLocaleString()}` : 'N/A'}\n- Interest Rate: ${loan.interest_rate ? `${loan.interest_rate}%` : 'N/A'}\n- Property: ${[loan.property_address, loan.property_city, loan.property_state].filter(Boolean).join(', ') || 'N/A'}\n- Type: ${loan.loan_type || 'N/A'}\n- Program: ${loan.loan_program || 'N/A'}\n- Status: ${loan.status || 'N/A'}\n- Close Date: ${loan.closing_date || loan.estimated_closing_date || 'N/A'}\n- Buyer's Agent: ${loan.buyer_agent_name || 'N/A'}`
      }
    }
  }

  if (recordId && recordType === 'loan') {
    const { data } = await supabase
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
      .eq('organization_id', organizationId)
      .maybeSingle()

    if (data) {
      let contact: { first_name: string; last_name: string; email: string | null; phone: string | null } | null = null
      if (data.contact_id) {
        const { data: contactRow } = await supabase
          .from('contacts')
          .select('first_name, last_name, email, phone')
          .eq('id', data.contact_id)
          .eq('organization_id', organizationId)
          .maybeSingle()
        contact = contactRow ?? null
      }

      const borrowerName = data.borrower_name
        || [data.borrower_first_name, data.borrower_last_name].filter(Boolean).join(' ')
        || (contact ? [contact.first_name, contact.last_name].filter(Boolean).join(' ') : '')
        || 'N/A'
      const propertyFull = [data.property_address, data.property_city, data.property_state].filter(Boolean).join(', ')
      const closeDate = data.closing_date || data.estimated_closing_date

      prompt += `\n\n## Active Loan Record\n- Loan Name: ${data.loan_name || 'N/A'}\n- Loan Number: ${data.loan_number || 'N/A'}\n- Borrower: ${borrowerName}\n- Borrower Email: ${contact?.email || 'N/A'}\n- Borrower Phone: ${contact?.phone || 'N/A'}\n- Loan Amount: ${data.loan_amount ? `$${Number(data.loan_amount).toLocaleString()}` : 'N/A'}\n- Purchase Price: ${data.sales_price ? `$${Number(data.sales_price).toLocaleString()}` : 'N/A'}\n- Interest Rate: ${data.interest_rate ? `${data.interest_rate}%` : 'N/A'}\n- Down Payment: ${data.down_payment_pct ? `${data.down_payment_pct}%` : 'N/A'}\n- LTV: ${data.estimated_ltv ? `${data.estimated_ltv}%` : 'N/A'}\n- Seller Concessions: ${data.seller_concessions ? `$${Number(data.seller_concessions).toLocaleString()}` : 'N/A'}\n- Type: ${data.loan_type || 'N/A'}\n- Program: ${data.loan_program || 'N/A'}\n- Purpose: ${data.loan_purpose || 'N/A'}\n- Occupancy: ${data.occupancy || 'N/A'}\n- Property: ${propertyFull || 'N/A'}\n- County: ${data.county || 'N/A'}\n- Status: ${data.status || 'N/A'}\n- Close Date: ${closeDate || 'N/A'}\n- Effective Date: ${data.effective_date || 'N/A'}\n- Title Company: ${data.title_company || 'N/A'}\n- Buyer's Agent: ${data.buyer_agent_name || 'N/A'}${data.buyer_agent_email ? ` (${data.buyer_agent_email})` : ''}${data.buyer_agent_brokerage ? ` — ${data.buyer_agent_brokerage}` : ''}\n- Listing Agent: ${data.listing_agent_name || 'N/A'}${data.listing_agent_email ? ` (${data.listing_agent_email})` : ''}`
    }
  }

  // Add selected contacts context for bulk outreach
  if (selectedContacts && selectedContacts.length > 0) {
    const names = selectedContacts
      .map((c) => [c.first_name, c.last_name].filter(Boolean).join(' ') || 'Unknown')
      .join(', ')
    prompt += `\n\nCurrently selected contacts: ${names}\nWhen drafting messages for these contacts, personalize where possible. Keep messages concise.`
  }

  // Add generate type modifier
  if (generateType === 'email') {
    const identity = await getLoIdentity(organizationId)
    prompt += `\n\nGenerate a professional email body. No subject line — just the body text. Keep it under 150 words. Include a signature line: "${identity.loName} | ${identity.companyName}${identity.nmlsIndividual ? ` | NMLS #${identity.nmlsIndividual}` : ''}"`
  } else if (generateType === 'text') {
    prompt += `\n\nGenerate a short text message. Keep it under 300 characters. Casual but professional. No signature block needed.`
  }

  // Routing hints for tool usage
  prompt += `\n\nWhen the user's message begins with "Sales question:" or "Underwriting question:", call the query_mortgage_knowledge_base tool before answering.`
  prompt += `\nWhen the user asks about a lender's AE, contact info, which lenders offer a product, or anything about your approved lender list, call the query_lender_database tool.`

  return prompt
}

// POST /api/chat
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

  const { allowed } = checkRateLimit(`chat:${userId}`, 30, 60_000)
  if (!allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  try {
    const { messages, recordId, recordType, sessionId, selectedContacts, generateType, attachments } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array required' }, { status: 400 })
    }

    const systemPrompt = await buildSystemPrompt(
      organizationId,
      recordId,
      recordType,
      selectedContacts,
      generateType
    )

    const anthropic = await getAnthropicClient()

    // Normalize messages for the Anthropic API
    const apiMessages: MessageParam[] = messages.map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    // Replace last user message content with multimodal blocks when files are attached
    if (attachments?.length) {
      const lastMsg = apiMessages[apiMessages.length - 1]
      if (lastMsg?.role === 'user' && typeof lastMsg.content === 'string') {
        lastMsg.content = buildUserContent(lastMsg.content, attachments)
      }
    }

    const tools = [MORTGAGE_KB_TOOL, LENDER_DB_TOOL]

    // First call — Claude may invoke a tool
    let response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2048,
      system: systemPrompt,
      tools,
      messages: apiMessages,
    })

    // Tool-use loop — keep executing tool calls until Claude gives a final text answer
    let loopMessages: MessageParam[] = [...apiMessages]
    let toolRounds = 0
    const MAX_TOOL_ROUNDS = 4

    while (response.stop_reason === 'tool_use' && toolRounds < MAX_TOOL_ROUNDS) {
      toolRounds++

      // Process ALL tool_use blocks in this response (Claude may call multiple tools at once)
      const toolUseBlocks = response.content.filter((b) => b.type === 'tool_use')
      if (toolUseBlocks.length === 0) break

      const toolResults: { type: 'tool_result'; tool_use_id: string; content: string }[] = []

      for (const block of toolUseBlocks) {
        if (block.type !== 'tool_use') continue
        let toolResultContent: string

        if (block.name === 'query_lender_database') {
          const search = (block.input as { search: string }).search
          toolResultContent = await queryLenderDatabase(search, organizationId)
        } else {
          // query_mortgage_knowledge_base
          const question = (block.input as { question: string }).question
          const kbAnswer = await queryNotebookLM(question)
          toolResultContent = kbAnswer
            ? kbAnswer
            : 'The mortgage knowledge base is not available right now. Please answer from your own knowledge.'
        }

        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: toolResultContent,
        })
      }

      // Build up conversation with assistant tool calls + user tool results
      loopMessages = [
        ...loopMessages,
        { role: 'assistant', content: response.content },
        { role: 'user', content: toolResults },
      ]

      response = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 2048,
        system: systemPrompt,
        tools,
        messages: loopMessages,
      })
    }

    const text = response.content.find((b) => b.type === 'text')?.text ?? ''
    const assistantMessage = { role: 'assistant' as const, content: text }
    const updatedMessages = [...messages, assistantMessage]
    const supabase = createServiceClient()

    // Only persist sessions when on a specific record
    let newSessionId = sessionId
    if (recordId) {
      if (sessionId) {
        await supabase
          .from('chat_sessions')
          .update({ messages: updatedMessages })
          .eq('id', sessionId)
          .eq('organization_id', organizationId)
      } else {
        const { data } = await supabase
          .from('chat_sessions')
          .insert({
            record_id: recordId,
            record_type: recordType,
            messages: updatedMessages,
            user_id: userId,
            organization_id: organizationId,
          })
          .select('id')
          .single()
        newSessionId = data?.id
      }
    }

    return NextResponse.json({ message: assistantMessage, sessionId: newSessionId })
  } catch (error) {
    console.error('[chat/route] POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/chat?recordId=&recordType= — load most recent session for a record
export async function GET(req: NextRequest) {
  let organizationId: string
  try {
    const ctx = await getOrganization()
    organizationId = ctx.organizationId
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
      .eq('organization_id', organizationId)
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
