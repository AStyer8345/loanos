import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, serviceKey)
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function GET() {
  try {
    const supabase = getServiceClient()
    const now = new Date()
    const threeDaysAgo  = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString()
    const sevenDaysAgo  = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const twentyFourHrsAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()

    // ── Parallel data fetch ──────────────────────────────────────────────────
    const [
      staleLeadsResult,
      activeLoansResult,
      recentMilestonesResult,
      realtorTouchesResult,
      pendingDraftsResult,
    ] = await Promise.allSettled([

      // Stale leads: contacts tagged as Client, stage = Lead, updated > 3 days ago
      supabase
        .from('contacts')
        .select('id, first_name, last_name, email, phone, stage, updated_at')
        .eq('group_tag', 'Client')
        .eq('stage', 'Lead')
        .lt('updated_at', threeDaysAgo)
        .order('updated_at', { ascending: true })
        .limit(20),

      // Active loans: not funded/closed
      supabase
        .from('loans')
        .select('id, loan_name, status, loan_amount, property_address, est_closing_date, arive_loan_id')
        .not('status', 'in', '("funded","closed","withdrawn","denied")')
        .order('est_closing_date', { ascending: true })
        .limit(20),

      // Milestone events from last 24 hours
      supabase
        .from('loan_milestone_events')
        .select('id, loan_id, milestone, borrower_name, realtor_name, created_at')
        .gte('created_at', twentyFourHrsAgo)
        .order('created_at', { ascending: false })
        .limit(20),

      // Realtors not touched in 7+ days
      supabase
        .from('contacts')
        .select('id, first_name, last_name, email, phone, last_touch')
        .eq('contact_type', 'realtor')
        .or(`last_touch.is.null,last_touch.lt.${sevenDaysAgo}`)
        .order('last_touch', { ascending: true, nullsFirst: true })
        .limit(20),

      // Unsent milestone communication drafts
      supabase
        .from('milestone_communications')
        .select('id, recipient_type, recipient_email, subject, created_at, milestone_event_id')
        .eq('draft_pushed', false)
        .order('created_at', { ascending: false })
        .limit(20),
    ])

    // ── Unwrap results ───────────────────────────────────────────────────────
    const staleLeads       = staleLeadsResult.status        === 'fulfilled' ? (staleLeadsResult.value.data       ?? []) : []
    const activeLoans      = activeLoansResult.status       === 'fulfilled' ? (activeLoansResult.value.data      ?? []) : []
    const recentMilestones = recentMilestonesResult.status  === 'fulfilled' ? (recentMilestonesResult.value.data  ?? []) : []
    const realtorTouches   = realtorTouchesResult.status    === 'fulfilled' ? (realtorTouchesResult.value.data   ?? []) : []
    const pendingDrafts    = pendingDraftsResult.status      === 'fulfilled' ? (pendingDraftsResult.value.data    ?? []) : []

    // ── Build Claude context ─────────────────────────────────────────────────
    const contextBlock = JSON.stringify({
      date: now.toDateString(),
      staleLeads,
      activeLoans,
      recentMilestones,
      realtorTouches,
      pendingDrafts,
    }, null, 2)

    const systemPrompt = `You are the AI command center for Adam Styer, Senior Loan Officer at Adam Styer | Mortgage Solutions LP in Austin, TX. Every morning you review his pipeline data and produce a prioritized action list.

Adam's priorities in order:
1. Closing-critical items (CTC, docs due, funding imminent)
2. Stale leads that need a follow-up call or text
3. Realtor relationships that need a touch
4. Pending drafts that haven't been sent
5. Everything else

Return ONLY a valid JSON object with this exact structure:
{
  "top7": [
    {
      "rank": 1,
      "contact": "Full name or loan identifier",
      "action": "Specific action Adam should take (call, text, email, review doc, etc.)",
      "reason": "One sentence why this is urgent or important",
      "snippet": "Optional: 1-sentence suggested opening line if this involves outreach"
    }
  ],
  "summary": "2-3 sentence overview of today's pipeline — tone: direct, no fluff"
}

Rules:
- Exactly 7 items in top7 (fewer only if there is genuinely less than 7 things to act on)
- Actions must be specific: "Call John Smith about rate lock expiry" not "Follow up with lead"
- No filler words, no inspiration, no therapy tone
- If pendingDrafts exist, those should typically appear in top7`

    const claudeMsg = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: contextBlock }],
    })

    const rawResponse = (claudeMsg.content[0] as { type: string; text: string }).text.trim()
    let top7: object[]  = []
    let summary         = ''

    try {
      // Strip markdown code fences if Claude wrapped the JSON
      const cleaned = rawResponse.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
      const parsed  = JSON.parse(cleaned)
      top7    = parsed.top7    ?? []
      summary = parsed.summary ?? ''
    } catch {
      console.error('[daily-briefing] Failed to parse Claude JSON:', rawResponse)
      summary = 'Could not parse AI briefing — raw data is included below.'
    }

    return NextResponse.json({
      ok: true,
      generatedAt: now.toISOString(),
      summary,
      top7,
      staleLeads,
      activeLoans,
      recentMilestones,
      realtorTouches,
      pendingDrafts,
    })
  } catch (err) {
    console.error('[daily-briefing] Unhandled error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
