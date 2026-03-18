import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getOrganization } from '@/lib/getOrganization'

const MONTH_YEAR = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
const TODAY      = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
const SLUG_DATE  = new Date().toISOString().slice(0, 10) // 2026-03-14

export async function POST(req: NextRequest) {
  try {
    await getOrganization()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { audience, notes, apiKey } = await req.json()

  if (!audience) {
    return NextResponse.json({ error: 'audience required' }, { status: 400 })
  }

  const key = apiKey || process.env.ANTHROPIC_API_KEY
  if (!key) {
    return NextResponse.json({ error: 'No Anthropic API key. Add one in Settings → Integrations.' }, { status: 400 })
  }

  const anthropic = new Anthropic({ apiKey: key })

  const audienceDesc =
    audience === 'Realtors'  ? 'real estate agents (referral partners)' :
    audience === 'Borrowers' ? 'past clients and active leads (homebuyers / homeowners)' :
                               'both real estate agents AND homebuyers / homeowners (send two versions)'

  const systemPrompt = `You are the marketing content writer for Adam Styer | Mortgage Solutions LP (NMLS #513013), a senior independent mortgage broker in Austin, TX.

Adam's voice: short punchy sentences, conversational, direct. Data-driven insights. Never salesy. Like a trusted advisor who happens to know mortgages cold.

Today: ${TODAY}. You must respond ONLY with valid JSON — no markdown, no code fences, no explanation.`

  const contextClause = notes
    ? `Context / rates Adam provided: ${notes}`
    : `Use realistic ${MONTH_YEAR} Austin mortgage market context (30yr fixed in the 6.5–7% range, purchase market tight, rates starting to move).`

  const userPrompt = `Generate a weekly mortgage newsletter for ${audienceDesc}.
${contextClause}

Return exactly this JSON structure:
{
  "subject": "Email subject line — compelling, under 60 chars, no emojis",
  "teaserHtml": "Teaser email HTML body (150-200 words). Hook on one key insight, then drive to the website to read the full update. End with: <div style='margin-top:16px'><a href='{{PAGE_URL}}' style='background:#C9A84C;color:#0D0D0D;padding:10px 22px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px'>Read Full Update →</a></div><p style='margin-top:20px;font-size:12px;color:#8A8480'>Adam Styer | Mortgage Solutions LP | NMLS #513013</p>",
  "webTitle": "Page headline for the website (H1 style — punchy, 5-10 words)",
  "webHtml": "Complete newsletter HTML for the website (400-600 words). Include 2-3 h2 sections with bold insight, practical data, closing CTA with two links: apply at https://mslp.my1003app.com/513013/register and schedule at https://calendly.com/adamstyer/15minutes. Inline CSS using: background #0D0D0D, text #F0EDE8, accent/h2 #C9A84C, max-width 680px auto.",
  "slug": "newsletter-${SLUG_DATE}"
}`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2500,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const raw = response.content[0].type === 'text' ? response.content[0].text.trim() : ''

    // Strip any accidental code fences
    const cleaned = raw.replace(/^```json?\s*/i, '').replace(/\s*```$/, '')
    const parsed = JSON.parse(cleaned)

    return NextResponse.json(parsed)
  } catch (err) {
    console.error('[generate-newsletter] error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
