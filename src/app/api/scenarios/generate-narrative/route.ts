import { NextRequest } from 'next/server'
import { getAnthropicClient } from '@/lib/anthropic/client'
import { checkRateLimit } from '@/lib/rateLimit'
import { CLAUDE_MODEL } from '@/lib/anthropic/model'

export async function POST(req: NextRequest) {
  // 20 requests per minute per IP (no auth on this route)
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  const { allowed } = checkRateLimit(`scenarios:${ip}`, 20, 60_000)
  if (!allowed) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const body = await req.json()
    const {
      mode, borrowerName,
      purchaseScenarios, purchaseResults,
      refiScenarios, refiResults,
      reinvestmentResult,
    } = body

    // Build context for Claude
    let dataContext = ''
    if (mode === 'purchase') {
      dataContext = purchaseScenarios.map((s: Record<string, unknown>, i: number) => {
        const r = purchaseResults[i]
        return `
**${s.label || `Option ${i + 1}`}** (${String(s.loanType).toUpperCase()})
- Loan Amount: $${Number(s.loanAmount).toLocaleString()} at ${s.interestRate}% for ${s.loanTerm} years
- Monthly Payment: $${Number(r?.totalMonthlyPayment ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
- Cash to Close: $${Number(r?.cashToClose ?? 0).toLocaleString()}
- 5-Year Total Cost: $${Number(r?.totalCost5Year ?? 0).toLocaleString()}
- Total Interest: $${Number(r?.totalInterest ?? 0).toLocaleString()}
- LTV: ${r?.ltv ?? 0}%
- Equity at Year 5: $${Number(r?.equityYear5 ?? 0).toLocaleString()}
${r?.yearsSaved ? `- Extra Payment Saves: ${r.yearsSaved} years, ${r.monthsSaved} months — $${Number(r.interestSaved).toLocaleString()} in interest` : ''}`
      }).join('\n')
    } else {
      const currentPmt = refiResults?.[0]?.currentMonthlyPayment ?? 0
      dataContext = `**Current Loan:** Monthly payment $${Number(currentPmt).toLocaleString(undefined, { minimumFractionDigits: 2 })}\n`
      dataContext += (refiScenarios || []).map((s: Record<string, unknown>, i: number) => {
        const r = refiResults?.[i]
        return `
**${s.label || `Option ${i + 1}`}** (${String(s.loanType).toUpperCase()})
- New Loan Amount: $${Number(s.newLoanAmount).toLocaleString()} at ${s.interestRate}% for ${s.loanTerm} years
- New Monthly Payment: $${Number(r?.newTotalMonthlyPayment ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
- Monthly Savings: $${Number(r?.monthlySavings ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
- Break-Even: Month ${r?.breakEvenMonth ?? 0}
- 5-Year Savings: $${Number(r?.totalSavings5Year ?? 0).toLocaleString()}
- Lifetime Interest Savings: $${Number(r?.lifetimeInterestSavings ?? 0).toLocaleString()}
${r?.cashOutReceived ? `- Cash Out: $${Number(r.cashOutReceived).toLocaleString()}` : ''}
${r?.debtsEliminated?.length ? `- Debts Eliminated: ${r.debtsEliminated.map((d: { description: string; monthlyPayment: number }) => `${d.description} ($${d.monthlyPayment}/mo)`).join(', ')}` : ''}`
      }).join('\n')
    }

    if (reinvestmentResult) {
      dataContext += `\n\n**Reinvestment:** If the $${Number(reinvestmentResult.monthlySavings).toLocaleString()}/month savings is invested at ${reinvestmentResult.returnRate}% for ${reinvestmentResult.horizonYears} years, it grows to $${Number(reinvestmentResult.futureValue).toLocaleString()}.`
    }

    const systemPrompt = `You are a senior mortgage advisor. Write a clear analysis of these loan scenarios for ${borrowerName || 'the borrower'}.

Format: Plain paragraphs only — no bullet points, no headers, no bold text. Write in paragraph form.
Length: Exactly 4 paragraphs, maximum 5 sentences each.

Paragraph 1 — Which scenario wins and why: Name the best option specifically. Include the exact dollar difference in monthly payment and total interest.
Paragraph 2 — Break-even timing in plain English: For refinance, explain when the borrower recoups closing costs. For purchase, compare when each option becomes more expensive than the other.
Paragraph 3 — When each scenario makes sense: Short-term hold vs long-term hold, income stability, risk tolerance.
Paragraph 4 — One clear recommendation with reasoning, plus any risks or trade-offs worth flagging.

Rules:
- Write in plain English — no jargon
- Be specific with dollar amounts and months
- Never reference protected classes (race, religion, gender, national origin, familial status, disability, age)
- Never make a lending decision — present trade-offs only
- End last paragraph with: "This analysis is for informational purposes only."`

    // Stream response using SSE
    const anthropic = await getAnthropicClient()
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await anthropic.messages.create({
            model: CLAUDE_MODEL,
            max_tokens: 1024,
            system: systemPrompt,
            messages: [{ role: 'user', content: `Analyze these ${mode} loan scenarios:\n${dataContext}` }],
            stream: true,
          })

          for await (const event of response) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              const text = event.delta.text
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
            }
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()

          // Note: activity_log insert omitted — this route has no auth context,
          // so organization_id cannot be determined. Logging unscoped rows would
          // pollute activity_log and break multi-tenant isolation.
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Generation failed'
          const msgLc = msg.toLowerCase()
          const isAuthError = msgLc.includes('api key') || msgLc.includes('401') || msgLc.includes('unauthorized')
          const isBillingError = msgLc.includes('credit') || msgLc.includes('billing') || msgLc.includes('quota') || msgLc.includes('402') || msgLc.includes('insufficient')
          console.error('[narrative] stream error:', {
            message: msg,
            isAuthError,
            isBillingError,
            hasApiKey: !!process.env.ANTHROPIC_API_KEY,
          })
          const clientMsg = isAuthError
            ? 'AI generation is not configured. Contact your administrator.'
            : isBillingError
              ? 'AI generation is unavailable — API account needs credits. Contact your administrator.'
              : 'AI generation failed. Please try again.'
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: clientMsg })}\n\n`))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Narrative generation failed'
    console.error('[scenarios/generate-narrative] error:', error)
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
