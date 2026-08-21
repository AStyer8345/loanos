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
      mode, borrowerName, propertyAddress,
      purchaseScenarios, purchaseResults,
      refiScenarios, refiResults,
      reinvestmentResult,
    } = body

    // Extract first name for personal opening (e.g. "John & Jane Smith" → "John")
    const firstName = borrowerName
      ? (borrowerName as string).split(/[\s&,]+/)[0].trim()
      : ''

    // Build context for Claude
    let dataContext = ''
    if (propertyAddress) {
      dataContext += `**Property:** ${propertyAddress}\n\n`
    }
    if (mode === 'purchase') {
      dataContext += purchaseScenarios.map((s: Record<string, unknown>, i: number) => {
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
      dataContext += `**Current Loan:** Monthly payment $${Number(currentPmt).toLocaleString(undefined, { minimumFractionDigits: 2 })}\n`
      dataContext += (refiScenarios || []).map((s: Record<string, unknown>, i: number) => {
        const r = refiResults?.[i]
        return `
**${s.label || `Option ${i + 1}`}** (${String(s.loanType).toUpperCase()})
- New Loan Amount: $${Number(s.newLoanAmount).toLocaleString()} at ${s.interestRate}% for ${s.loanTerm} years
- New Monthly Payment: $${Number(r?.newTotalMonthlyPayment ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
- Monthly Savings: $${Number(r?.monthlySavings ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
- Break-Even: ${Number(r?.breakEvenMonth ?? 0) > 0 ? `Month ${r?.breakEvenMonth}` : 'never — this option does not lower the monthly payment, so closing costs are never recouped'}
- 5-Year Savings (GROSS — monthly savings x 60; does NOT deduct closing costs): $${Number(r?.totalSavings5Year ?? 0).toLocaleString()}
- Lifetime Interest Savings: $${Number(r?.lifetimeInterestSavings ?? 0).toLocaleString()}
${r?.cashOutReceived ? `- Cash Out: $${Number(r.cashOutReceived).toLocaleString()}` : ''}
${r?.debtsEliminated?.length ? `- Debts Eliminated: ${r.debtsEliminated.map((d: { description: string; monthlyPayment: number }) => `${d.description} ($${d.monthlyPayment}/mo)`).join(', ')}` : ''}`
      }).join('\n')
    }

    if (reinvestmentResult) {
      dataContext += `\n\n**Reinvestment:** If the $${Number(reinvestmentResult.monthlySavings).toLocaleString()}/month savings is invested at ${reinvestmentResult.returnRate}% for ${reinvestmentResult.horizonYears} years, it grows to $${Number(reinvestmentResult.futureValue).toLocaleString()}.`
    }

    const nameRef = firstName || borrowerName || 'the borrower'
    const systemPrompt = `You are a senior mortgage advisor writing a personal analysis for ${nameRef}.

Format: Plain paragraphs only — no bullet points, no headers, no bold text. Write in paragraph form.
Length: Exactly 4 paragraphs, maximum 5 sentences each.

Paragraph 1 — Open directly with ${firstName ? `"${firstName},"` : 'the borrower\'s name,'} then name the best option and why. Include the exact dollar difference in monthly payment. Use possessive language: "your payment", "your closing costs".
Paragraph 2 — Break-even timing in plain English using "you" and "your": For refinance, explain when you recoup your closing costs. For purchase, explain when each option becomes more expensive for you than the other.
Paragraph 3 — When each scenario makes sense for you: Short-term hold vs long-term hold, your income stability, your risk tolerance. Use "you" throughout — not "the borrower".
Paragraph 4 — One clear recommendation with reasoning${firstName ? `, addressing ${firstName} directly` : ''}. Include any risks or trade-offs worth flagging. End with: "This analysis is for informational purposes only."

Rules:
- Address the borrower by name — use the first name in the opening and 1–2 more times naturally
- Use "you", "your", "you'll" throughout — never "the borrower" or "one"
- Be specific with exact dollar amounts and months from the scenario data
- Never reference protected classes (race, religion, gender, national origin, familial status, disability, age)
- Never make a lending decision — present trade-offs only
- Never recommend one product over another — present what each option means for the borrower's situation
- Any figure labelled GROSS is before closing costs. Never describe it as money kept, netted, or "after costs", and never subtract costs yourself to invent a net figure. If you cite it, say it is before closing costs and point to the break-even month as the point where those costs are recouped
- If Break-Even is "never", do not describe the refinance as paying for itself over any period`

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
