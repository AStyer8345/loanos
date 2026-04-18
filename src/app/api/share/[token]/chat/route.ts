import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { checkRateLimit } from '@/lib/rateLimit'
import { getAnthropicClient } from '@/lib/anthropic/client'
import { CLAUDE_MODEL } from '@/lib/anthropic/model'

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return req.headers.get('x-real-ip') || 'unknown'
}

const MAX_QUESTION_LENGTH = 500
const MAX_HISTORY_TURNS = 3

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const ip = getClientIp(req)
    const ipCheck = checkRateLimit(`share-chat-ip:${ip}`, 20, 60_000)
    if (!ipCheck.allowed) {
      return NextResponse.json({ error: 'Too many requests — try again in a minute.' }, { status: 429 })
    }
    const tokenCheck = checkRateLimit(`share-chat-token:${params.token}`, 10, 60_000)
    if (!tokenCheck.allowed) {
      return NextResponse.json({ error: 'Too many requests — try again in a minute.' }, { status: 429 })
    }

    const body = await req.json()
    const question: unknown = body.question
    const history: unknown = body.history

    if (!question || typeof question !== 'string' || !question.trim()) {
      return NextResponse.json({ error: 'Missing question' }, { status: 400 })
    }
    if (question.length > MAX_QUESTION_LENGTH) {
      return NextResponse.json({ error: 'Question too long' }, { status: 400 })
    }

    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('scenarios')
      .select('scenario_type, borrower_name, property_address, scenarios_data, results_data, current_loan_data, share_expires_at')
      .eq('share_token', params.token)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Scenario not found' }, { status: 404 })
    }
    if (data.share_expires_at && new Date(data.share_expires_at) < new Date()) {
      return NextResponse.json({ error: 'Share link has expired' }, { status: 410 })
    }

    const firstName = data.borrower_name
      ? (data.borrower_name as string).split(/[\s&,]+/)[0].trim()
      : 'you'

    const mode = data.scenario_type as 'purchase' | 'refinance'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const scenariosData = (data.scenarios_data ?? []) as any[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resultsData = (data.results_data ?? []) as any[]

    let dataSummary: string
    if (mode === 'purchase') {
      dataSummary = scenariosData.map((s, i) => {
        const r = resultsData[i] ?? {}
        return `Option ${s.label || String.fromCharCode(65 + i)}: $${Number(s.loanAmount || 0).toLocaleString()} @ ${s.interestRate}% / ${s.loanTerm}yr — monthly $${Number(r.totalMonthlyPayment || 0).toLocaleString()}, cash to close $${Number(r.cashToClose || 0).toLocaleString()}, total interest $${Number(r.totalInterest || 0).toLocaleString()}`
      }).join('\n')
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const currentLoan = (data.current_loan_data ?? {}) as any
      dataSummary = `Current payment: $${Number(currentLoan.currentMonthlyPI || 0).toLocaleString()}/mo\n`
      dataSummary += scenariosData.map((s, i) => {
        const r = resultsData[i] ?? {}
        return `Option ${s.label || String.fromCharCode(65 + i)}: $${Number(s.newLoanAmount || 0).toLocaleString()} @ ${s.interestRate}% / ${s.loanTerm}yr — new payment $${Number(r.newTotalMonthlyPayment || 0).toLocaleString()}, monthly savings $${Number(r.monthlySavings || 0).toLocaleString()}, break-even month ${r.breakEvenMonth || '?'}`
      }).join('\n')
    }

    const propertyLine = data.property_address ? `Property: ${data.property_address}\n` : ''

    const systemPrompt = `You are a mortgage educator helping ${firstName} understand their loan options.
Answer questions about this specific ${mode} scenario in plain, conversational English.
${propertyLine}
Scenario data:
${dataSummary}

Rules:
- Answer ONLY based on the scenario data above — never invent numbers
- Never recommend a specific option — present trade-offs only
- Never reference protected classes (race, religion, gender, national origin)
- Keep answers under 3 sentences — concise and specific to these numbers
- If asked something unrelated to this mortgage scenario, politely redirect
- Never claim to guarantee rates, approval, or outcomes
- You are an educational tool, not a licensed advisor`

    const safeHistory = Array.isArray(history)
      ? (history as ChatMessage[]).slice(-(MAX_HISTORY_TURNS * 2)).filter(
          m => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string'
        )
      : []

    const messages: { role: 'user' | 'assistant'; content: string }[] = [
      ...safeHistory,
      { role: 'user', content: question.trim() },
    ]

    const anthropic = await getAnthropicClient()
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 256,
      system: systemPrompt,
      messages,
    })

    const answer = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
    return NextResponse.json({ answer })
  } catch (error) {
    console.error('[share/chat] error:', error)
    return NextResponse.json({ error: 'Failed to answer question' }, { status: 500 })
  }
}
