import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServiceClient } from '@/lib/supabase/service'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
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

    const systemPrompt = `You are a mortgage scenario analysis writer. Write a clear, plain-English analysis comparing loan scenarios for ${borrowerName || 'the borrower'}.

Rules:
- Write in plain English any borrower can understand
- Compare scenarios objectively — highlight key trade-offs
- Frame around the borrower's situation: "If you plan to stay less than 7 years..." / "If you want payment certainty..."
${mode === 'refinance' ? '- Emphasize break-even, monthly savings, and whether the refi makes sense given remaining term' : ''}
- Address equity building differences between options
- Mention reinvestment opportunity if data is provided
- Keep under 400 words
- NEVER reference protected classes (race, religion, gender, national origin, familial status, disability, age)
- NEVER make lending decisions or recommendations — present trade-offs objectively
- End with: "This analysis is for informational purposes only."
- Do NOT add any headers or formatting — just write flowing paragraphs`

    // Stream response using SSE
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-5',
            max_tokens: 1024,
            system: systemPrompt,
            messages: [{ role: 'user', content: `Analyze these ${mode} loan scenarios:\n${dataContext}` }],
            stream: true,
          })

          let fullText = ''
          for await (const event of response) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              const text = event.delta.text
              fullText += text
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
            }
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()

          // Log to activity_log
          try {
            const supabase = createServiceClient()
            await supabase.from('activity_log').insert({
              type: 'ai_generation',
              action: 'scenario_narrative',
              summary: `AI narrative generated for ${mode} scenario — ${borrowerName || 'unnamed borrower'}`,
              metadata: { mode, scenarioCount: mode === 'purchase' ? purchaseScenarios?.length : refiScenarios?.length, wordCount: fullText.split(/\s+/).length },
            })
          } catch (logErr) {
            console.error('[narrative] activity log error:', logErr)
          }
        } catch (err) {
          console.error('[narrative] stream error:', err)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Generation failed' })}\n\n`))
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
    console.error('[scenarios/generate-narrative] error:', error)
    return new Response(JSON.stringify({ error: 'Narrative generation failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
