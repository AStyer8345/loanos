import { NextRequest, NextResponse } from 'next/server'
import { getAnthropicClient } from '@/lib/anthropic/client'

function buildSystemPrompt(contactNames?: string[]): string {
  const base = `You are Adam Styer's outreach assistant for his mortgage business (Adam Styer | Mortgage Solutions LP, NMLS #513013). You help draft emails, text messages, and manage contacts.

Style: Professional but warm. Short sentences. Conversational tone. Never salesy or pushy.

Adam's details:
- Senior Loan Officer, Austin TX
- Calendly: https://calendly.com/adamstyer/15minutes
- Application link: https://mslp.my1003app.com/513013/register
- NMLS: 513013`

  if (contactNames && contactNames.length > 0) {
    return `${base}

Currently selected contacts: ${contactNames.join(', ')}
When drafting emails or texts for these contacts, personalize where possible. Keep messages concise.`
  }

  return base
}

export async function POST(req: NextRequest) {
  try {
    const { messages, selectedContacts, generateType } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array required' }, { status: 400 })
    }

    const contactNames = selectedContacts?.map(
      (c: { first_name?: string; last_name?: string }) =>
        [c.first_name, c.last_name].filter(Boolean).join(' ') || 'Unknown'
    )

    // For content generation, add specific instructions
    let systemPrompt = buildSystemPrompt(contactNames)
    if (generateType === 'email') {
      systemPrompt += `\n\nGenerate a professional email body. No subject line — just the body text. Keep it under 150 words. Include a signature line: "Adam Styer | Mortgage Solutions LP | NMLS #513013"`
    } else if (generateType === 'text') {
      systemPrompt += `\n\nGenerate a short text message. Keep it under 300 characters. Casual but professional. No signature block needed.`
    }

    const anthropic = await getAnthropicClient()
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    })

    const text =
      response.content[0].type === 'text' ? response.content[0].text : ''

    return NextResponse.json({ message: text })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Internal server error'
    console.error('[outreach] error:', error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
