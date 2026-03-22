import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getAnthropicClient } from '@/lib/anthropic/client'
import { logSecurityEvent } from '@/lib/audit'

export async function GET(request: NextRequest) {
  // Allow server-to-server calls with agent secret, or browser calls with session auth
  const authHeader = request.headers.get('authorization')
  const agentSecret = process.env.LOANOS_AGENT_SECRET
  const hasValidSecret = agentSecret && authHeader === `Bearer ${agentSecret}`

  let organizationId: string | null = null
  let user: { id: string; email?: string } | null = null

  if (!hasValidSecret) {
    try {
      const sessionClient = createClient()
      const { data: { user: sessionUser } } = await sessionClient.auth.getUser()
      if (!sessionUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      user = sessionUser

      // Resolve organization for session-based callers
      const { data: profile } = await sessionClient
        .from('profiles')
        .select('organization_id')
        .eq('id', sessionUser.id)
        .single()
      organizationId = profile?.organization_id ?? null
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  } else {
    // Agent-secret path: no user session — look up the primary org.
    // Single-tenant: uses the first profile with a non-null org.
    // If org cannot be resolved, fail hard (never run unscoped queries).
    try {
      const svcClient = createServiceClient()
      const { data: sysProfile } = await svcClient
        .from('profiles')
        .select('organization_id, id')
        .not('organization_id', 'is', null)
        .order('created_at', { ascending: true })
        .limit(1)
        .single()
      organizationId = sysProfile?.organization_id ?? null
    } catch {
      // swallow — null check below will return 500
    }
    if (!organizationId) {
      console.error('[daily-briefing] Could not resolve org for agent-secret path — aborting')
      return NextResponse.json({ error: 'Could not resolve organization' }, { status: 500 })
    }
  }

  await logSecurityEvent({
    eventType: 'api_access',
    resource: 'agents',
    resourceId: 'daily-briefing',
    ipAddress: request.headers.get('x-forwarded-for') ?? undefined,
    actorId: user?.id ?? undefined,
    actorEmail: user?.email ?? undefined,
  })

  try {
    const supabase = createServiceClient()
    const now = new Date()
    const threeDaysAgo  = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString()
    const sevenDaysAgo  = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const twentyFourHrsAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()

    // Hard-fail if org not resolved — never run unscoped queries in multi-tenant context
    if (!organizationId) {
      console.error('[daily-briefing] organizationId is null at query time — aborting')
      return NextResponse.json({ error: 'Could not resolve organization' }, { status: 500 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const withOrg = (query: any) => query.eq('organization_id', organizationId)

    // Pre-fetch org loan IDs so loan_milestone_events + milestone_communications
    // (which lack organization_id columns) can be scoped via their loan_id FK.
    const { data: orgLoanRows = [] } = await supabase
      .from('loans')
      .select('id')
      .eq('organization_id', organizationId)
      .limit(500)
    const orgLoanIds = (orgLoanRows ?? []).map((l: { id: string }) => l.id)

    // ── Parallel data fetch ──────────────────────────────────────────────────
    const [
      staleLeadsResult,
      activeLoansResult,
      recentMilestonesResult,
      realtorTouchesResult,
      pendingDraftsResult,
    ] = await Promise.allSettled([

      // Stale leads: contacts tagged as Client, stage = Lead, updated > 3 days ago
      withOrg(supabase
        .from('contacts')
        .select('id, first_name, last_name, email, phone, stage, updated_at')
        .eq('group_tag', 'Client')
        .eq('stage', 'Lead')
        .lt('updated_at', threeDaysAgo)
        .order('updated_at', { ascending: true })
        .limit(20)),

      // Active loans: not funded/closed
      withOrg(supabase
        .from('loans')
        .select('id, loan_name, status, loan_amount, property_address, estimated_closing_date, arive_loan_id')
        .not('status', 'in', '("funded","closed","withdrawn","denied")')
        .order('estimated_closing_date', { ascending: true })
        .limit(20)),

      // Milestone events from last 24 hours — scoped via org loan IDs
      orgLoanIds.length > 0
        ? supabase
            .from('loan_milestone_events')
            .select('id, loan_id, milestone, borrower_name, realtor_name, created_at')
            .in('loan_id', orgLoanIds)
            .gte('created_at', twentyFourHrsAgo)
            .order('created_at', { ascending: false })
            .limit(20)
        : Promise.resolve({ data: [], error: null }),

      // Realtors not touched in 7+ days
      withOrg(supabase
        .from('contacts')
        .select('id, first_name, last_name, email, phone, last_touch')
        .eq('contact_type', 'realtor')
        .or(`last_touch.is.null,last_touch.lt.${sevenDaysAgo}`)
        .order('last_touch', { ascending: true, nullsFirst: true })
        .limit(20)),

      // Unsent milestone communication drafts — scoped via org milestone event IDs
      (async () => {
        if (orgLoanIds.length === 0) return { data: [], error: null }
        const { data: eventRows = [] } = await supabase
          .from('loan_milestone_events')
          .select('id')
          .in('loan_id', orgLoanIds)
          .limit(500)
        const eventIds = (eventRows ?? []).map((e: { id: string }) => e.id)
        if (eventIds.length === 0) return { data: [], error: null }
        return supabase
          .from('milestone_communications')
          .select('id, recipient_type, recipient_email, subject, created_at, milestone_event_id')
          .in('milestone_event_id', eventIds)
          .eq('draft_pushed', false)
          .order('created_at', { ascending: false })
          .limit(20)
      })(),
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

    const anthropic = await getAnthropicClient()
    const claudeMsg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
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
    const msg = err instanceof Error ? err.message : 'Internal server error'
    console.error('[daily-briefing] Unhandled error:', err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
