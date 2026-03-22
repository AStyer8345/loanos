import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAnthropicClient } from '@/lib/anthropic/client'
import { checkRateLimit } from '@/lib/rateLimit'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // 20 requests per minute per user
    const { allowed } = checkRateLimit(`scenarios:${user.id}`, 20, 60_000)
    if (!allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    const { pdfBase64 } = await req.json()
    if (!pdfBase64) return NextResponse.json({ error: 'Missing PDF data' }, { status: 400 })

    const client = await getAnthropicClient()
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: pdfBase64,
              },
            },
            {
              type: 'text',
              text: `Extract the following fields from this mortgage statement. Return ONLY a JSON object with these fields (use null for any field not found):

{
  "originalLoanAmount": number (original loan principal),
  "currentBalance": number (current unpaid principal balance / payoff amount),
  "interestRate": number (current interest rate as percent, e.g. 6.5),
  "loanTerm": number (original loan term in years, e.g. 30),
  "loanStartDate": string (origination date as YYYY-MM, e.g. "2023-01"),
  "monthlyPI": number (monthly principal & interest payment),
  "escrowPayment": number (monthly escrow/impound payment if shown),
  "propertyTaxes": number (monthly property tax portion if broken out),
  "insurance": number (monthly insurance portion if broken out),
  "pmi": number (monthly PMI/MIP if shown),
  "propertyAddress": string (property address if shown),
  "borrowerName": string (borrower name if shown),
  "loanNumber": string (loan/account number if shown),
  "loanType": string (e.g. "Conventional", "FHA", "VA" if shown)
}

Return ONLY the JSON object, no other text.`,
            },
          ],
        },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''

    // Parse the JSON from Claude's response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Could not extract data from statement' }, { status: 422 })
    }

    const extracted = JSON.parse(jsonMatch[0])
    return NextResponse.json(extracted)
  } catch (error) {
    console.error('[scenarios/parse-statement] error:', error)
    return NextResponse.json({ error: 'Failed to parse statement' }, { status: 500 })
  }
}
