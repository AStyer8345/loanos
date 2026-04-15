import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAnthropicClient } from '@/lib/anthropic/client'
import { getOrganization } from '@/lib/getOrganization'
import { CLAUDE_MODEL } from '@/lib/anthropic/model'
import type { Json } from '@/lib/database.types'

export interface BorrowerQAPair {
  q: string
  a: string
}

export async function POST(req: NextRequest) {
  try {
    const { organizationId } = await getOrganization()
    const supabase = createClient()

    const { scenarioId } = await req.json()
    if (!scenarioId) {
      return NextResponse.json({ error: 'Missing scenarioId' }, { status: 400 })
    }

    // Fetch scenario through RLS — confirms org ownership
    const { data: scenario, error: fetchErr } = await supabase
      .from('scenarios')
      .select('id, scenario_type, borrower_name, scenarios_data, results_data, current_loan_data')
      .eq('id', scenarioId)
      .eq('organization_id', organizationId)
      .single()

    if (fetchErr || !scenario) {
      return NextResponse.json({ error: 'Scenario not found' }, { status: 404 })
    }

    // Skip if Q&A already exists — idempotent
    const { data: existing } = await supabase
      .from('scenarios')
      .select('borrower_qa')
      .eq('id', scenarioId)
      .single()
    if (existing?.borrower_qa) {
      return NextResponse.json({ ok: true, cached: true })
    }

    const firstName = scenario.borrower_name
      ? (scenario.borrower_name as string).split(/[\s&,]+/)[0].trim()
      : 'You'

    const mode = scenario.scenario_type as 'purchase' | 'refinance'

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const scenariosData = (scenario.scenarios_data ?? []) as any[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resultsData = (scenario.results_data ?? []) as any[]

    // Build a concise data summary for Claude
    let dataSummary = ''
    if (mode === 'purchase') {
      dataSummary = scenariosData.map((s, i) => {
        const r = resultsData[i] ?? {}
        return `Option ${s.label || String.fromCharCode(65 + i)}: $${Number(s.loanAmount || 0).toLocaleString()} @ ${s.interestRate}% / ${s.loanTerm}yr — monthly $${Number(r.totalMonthlyPayment || 0).toLocaleString()}, cash to close $${Number(r.cashToClose || 0).toLocaleString()}, total interest $${Number(r.totalInterest || 0).toLocaleString()}`
      }).join('\n')
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const currentLoan = (scenario.current_loan_data ?? {}) as any
      dataSummary = `Current payment: $${Number(currentLoan.currentMonthlyPI || 0).toLocaleString()}/mo\n`
      dataSummary += scenariosData.map((s, i) => {
        const r = resultsData[i] ?? {}
        return `Option ${s.label || String.fromCharCode(65 + i)}: $${Number(s.newLoanAmount || 0).toLocaleString()} @ ${s.interestRate}% / ${s.loanTerm}yr — new payment $${Number(r.newTotalMonthlyPayment || 0).toLocaleString()}, monthly savings $${Number(r.monthlySavings || 0).toLocaleString()}, break-even month ${r.breakEvenMonth || '?'}`
      }).join('\n')
    }

    const systemPrompt = `You are a mortgage educator helping ${firstName} understand their loan options.
Generate exactly 5 question-and-answer pairs that a real borrower would ask after receiving this scenario presentation.

Rules:
- Questions must be genuine, specific to this scenario's actual numbers
- Answers must use exact dollar amounts and months from the data — no generic statements
- Never recommend a specific option — present trade-offs only
- Never reference protected classes (race, religion, gender, national origin)
- Keep each answer under 3 sentences
- Use plain, conversational English — no jargon

Format your response as a JSON array only — no preamble, no trailing text:
[
  {"q": "...", "a": "..."},
  {"q": "...", "a": "..."},
  {"q": "...", "a": "..."},
  {"q": "...", "a": "..."},
  {"q": "...", "a": "..."}
]

Good questions for purchase: monthly payment breakdown, cash to close explanation, which saves more long-term, PMI drop-off timing, what happens if you sell in 5 years.
Good questions for refi: what break-even means in plain English, true monthly savings after all costs, whether shorter term makes sense, cash-out implications, rate lock timing.`

    const anthropic = await getAnthropicClient()
    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: `${mode === 'purchase' ? 'Purchase' : 'Refinance'} scenario data:\n${dataSummary}`,
      }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text.trim() : ''

    // Parse and validate — if malformed, store null rather than crash
    let pairs: BorrowerQAPair[] = []
    try {
      const jsonStart = raw.indexOf('[')
      const jsonEnd = raw.lastIndexOf(']')
      if (jsonStart !== -1 && jsonEnd !== -1) {
        pairs = JSON.parse(raw.slice(jsonStart, jsonEnd + 1)) as BorrowerQAPair[]
      }
    } catch {
      console.error('[generate-qa] JSON parse failed:', raw.slice(0, 200))
      return NextResponse.json({ ok: false, error: 'Parse error' }, { status: 200 })
    }

    if (!Array.isArray(pairs) || pairs.length === 0) {
      return NextResponse.json({ ok: false, error: 'Empty Q&A array' }, { status: 200 })
    }

    // Persist to DB — cast required: BorrowerQAPair[] → Json (JSONB column)
    await supabase
      .from('scenarios')
      .update({ borrower_qa: pairs as unknown as Json })
      .eq('id', scenarioId)
      .eq('organization_id', organizationId)

    return NextResponse.json({ ok: true, count: pairs.length })
  } catch (error) {
    console.error('[scenarios/generate-qa] error:', error)
    // Return 200 — caller is fire-and-forget, shouldn't surface UI errors
    return NextResponse.json({ ok: false, error: 'Generation failed' }, { status: 200 })
  }
}
