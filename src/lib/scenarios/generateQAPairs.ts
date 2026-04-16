import { getAnthropicClient } from '@/lib/anthropic/client'
import { CLAUDE_MODEL } from '@/lib/anthropic/model'
import type { Json } from '@/lib/database.types'

export interface BorrowerQAPair {
  q: string
  a: string
}

interface ScenarioForQA {
  scenario_type: string
  borrower_name: string | null
  scenarios_data: Json
  results_data: Json | null
  current_loan_data: Json | null
}

/**
 * Calls Claude to produce 5 borrower Q&A pairs for a scenario.
 * Returns [] on parse failure rather than throwing.
 */
export async function generateQAPairs(scenario: ScenarioForQA): Promise<BorrowerQAPair[]> {
  const firstName = scenario.borrower_name
    ? (scenario.borrower_name as string).split(/[\s&,]+/)[0].trim()
    : 'You'

  const mode = scenario.scenario_type as 'purchase' | 'refinance'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scenariosData = (scenario.scenarios_data ?? []) as any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resultsData = (scenario.results_data ?? []) as any[]

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

  try {
    const jsonStart = raw.indexOf('[')
    const jsonEnd = raw.lastIndexOf(']')
    if (jsonStart !== -1 && jsonEnd !== -1) {
      const pairs = JSON.parse(raw.slice(jsonStart, jsonEnd + 1)) as BorrowerQAPair[]
      if (Array.isArray(pairs) && pairs.length > 0) return pairs
    }
  } catch {
    console.error('[generateQAPairs] JSON parse failed:', raw.slice(0, 200))
  }

  return []
}
