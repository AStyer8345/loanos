import { NextRequest, NextResponse } from 'next/server'
import { getAnthropicClient } from '@/lib/anthropic/client'
import { CLAUDE_MODEL } from '@/lib/anthropic/model'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('pdf') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No PDF provided' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const base64Pdf = Buffer.from(arrayBuffer).toString('base64')

    const prompt = `You are extracting fields from a mortgage Initial Fees Worksheet. Return ONLY valid JSON with these keys:
- borrower_first_name
- borrower_last_name
- loan_amount (number, no commas or dollar signs)
- rate (number, e.g. 6.875)
- pi_payment (number, no commas or dollar signs)
- total_monthly_payment (number, no commas or dollar signs)
- cash_to_close (number, no commas or dollar signs — use the net cash to close figure)
- lock_period (string, e.g. "30 days" or "45 days")
- escrow (exactly "Waived" or "Active")

Return ONLY the JSON object. No explanation, no markdown, no code fences.`

    const anthropic = await getAnthropicClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const claudeData = await (anthropic.messages.create as any)(
      {
        model: CLAUDE_MODEL,
        max_tokens: 512,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'document',
                source: {
                  type: 'base64',
                  media_type: 'application/pdf',
                  data: base64Pdf,
                },
              },
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
      },
      { headers: { 'anthropic-beta': 'pdfs-2024-09-25' } }
    )

    const rawText = (claudeData.content?.[0] as { type: string; text: string })?.text ?? ''

    // Parse JSON — strip markdown fences if Claude wraps anyway
    const match = rawText.match(/\{[\s\S]*\}/)
    if (!match) {
      return NextResponse.json({ error: 'Could not parse JSON from Claude response', raw: rawText }, { status: 422 })
    }

    const fields = JSON.parse(match[0])
    return NextResponse.json({ fields })
  } catch (err) {
    console.error('refi-intake extraction error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
