import { NextRequest, NextResponse } from 'next/server'
import { validateAgentSecret } from '@/lib/auth/validateAgentSecret'
import { createServiceClient } from '@/lib/supabase/service'
import { checkRateLimit } from '@/lib/rateLimit'
import type { Database } from '@/lib/database.types'

/**
 * Best-effort client IP extraction. On Vercel `x-forwarded-for` is the public
 * client address; on local dev it can be missing, in which case we fall back
 * to a constant that still rate-limits across the whole dev instance.
 */
function getClientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return req.headers.get('x-real-ip') || 'unknown'
}

type ContactInsert = Database['public']['Tables']['contacts']['Insert']

/**
 * POST /api/contacts/web-lead
 * Machine-facing route for per-tenant web-form leads (n8n, Zapier, etc.).
 * Auth: Authorization: Bearer LOANOS_AGENT_SECRET
 * Body MUST include `org_slug` — the lead is attached to that org. No
 * ambient LOANOS_SYSTEM_USER_ID fallback: a missing or unknown slug is a 400.
 */
export async function POST(req: NextRequest) {
  // ── 1. Auth ──────────────────────────────────────────────────────────────────
  const authError = validateAgentSecret(req)
  if (authError) return authError

  // ── 1a. Rate limit ───────────────────────────────────────────────────────────
  // The agent secret is shared across all of Adam's (and future tenants') n8n
  // Zaps, so we can't rely on it to throttle abuse — if someone exfiltrates the
  // secret from a Zapier step they can hammer this endpoint at will. Throttle
  // by client IP (legitimate traffic is 1-2 req/min from a known n8n worker).
  const ip = getClientIp(req)
  const { allowed } = checkRateLimit(`web-lead:${ip}`, 30, 60_000)
  if (!allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  // ── 2. Parse body ────────────────────────────────────────────────────────────
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const {
    org_slug,
    first_name,
    last_name,
    email,
    phone,
    stage,
    contact_type,
    lead_source,
    referred_by,
    referral_type,
    notes,
    company_name,
    // Web lead specific
    loan_type,
    credit_score_range,
    purchase_price,
    down_payment,
    current_balance,
    home_value,
    goals,
    situation,
    campaign,
  } = body as {
    org_slug?: string
    first_name?: string
    last_name?: string
    email?: string
    phone?: string
    stage?: string
    contact_type?: string
    lead_source?: string
    referred_by?: string | null
    referral_type?: string
    notes?: string
    company_name?: string | null
    loan_type?: string
    credit_score_range?: string
    purchase_price?: string
    down_payment?: string
    current_balance?: string
    home_value?: string
    goals?: string[]
    situation?: string
    campaign?: string
  }

  if (!org_slug) {
    return NextResponse.json({ error: 'org_slug is required' }, { status: 400 })
  }
  if (!first_name) {
    return NextResponse.json({ error: 'first_name is required' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const now = new Date().toISOString()

  // ── 3. Resolve org + owner user from slug ─────────────────────────────────────
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', org_slug)
    .single()

  if (orgError || !org) {
    console.error('[web-lead] Unknown org_slug:', org_slug, orgError)
    return NextResponse.json({ error: 'Unknown org_slug' }, { status: 404 })
  }
  const organization_id = org.id

  // Use the org owner as the user_id for the insert (any admin also works).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: ownerRow } = await (supabase as any)
    .from('profiles')
    .select('id')
    .eq('organization_id', organization_id)
    .in('role', ['owner', 'admin'])
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (!ownerRow?.id) {
    return NextResponse.json(
      { error: 'Org has no owner profile to attribute the lead to' },
      { status: 500 }
    )
  }
  const systemUserId = ownerRow.id as string

  // ── 4. Dedup check ────────────────────────────────────────────────────────────
  const dupConditions: string[] = []
  if (email) dupConditions.push(`email.ilike.${email}`)
  if (phone) {
    const digits = (phone as string).replace(/\D/g, '')
    if (digits.length >= 7) {
      dupConditions.push(`phone.ilike.%${digits.slice(-7)}%`)
    }
  }

  let duplicate = null
  let emailDuplicate = false
  if (dupConditions.length > 0) {
    const { data: dups } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, email, phone')
      .eq('organization_id', organization_id)
      .or(dupConditions.join(','))
      .limit(1)

    if (dups && dups.length > 0) {
      duplicate = dups[0]
      // Email match = hard duplicate — DB unique constraint prevents re-insert
      emailDuplicate = !!(email && dups[0].email?.toLowerCase() === email.toLowerCase())
    }
  }

  // If email duplicate, return existing contact — don't attempt insert
  if (emailDuplicate && duplicate) {
    const fullName = [first_name, last_name].filter(Boolean).join(' ')
    return NextResponse.json({
      contact:   duplicate,
      duplicate: duplicate,
      message:   `Contact already exists for ${fullName} — returned existing record.`,
    })
  }

  // ── 5. Build structured notes string ─────────────────────────────────────────
  const noteLines: string[] = ['[Web Lead — styermortgage.com]']
  if (loan_type)          noteLines.push(`Loan Type: ${loan_type}`)
  if (credit_score_range) noteLines.push(`Credit Score: ${credit_score_range}`)
  if (purchase_price)     noteLines.push(`Purchase Price: ${purchase_price}`)
  if (down_payment)       noteLines.push(`Down Payment: ${down_payment}`)
  if (current_balance)    noteLines.push(`Current Balance: ${current_balance}`)
  if (home_value)         noteLines.push(`Home Value: ${home_value}`)
  if (goals && Array.isArray(goals) && goals.length > 0) {
    noteLines.push(`Goals: ${goals.join(', ')}`)
  }
  if (situation)  noteLines.push(`Situation: ${situation}`)
  if (campaign)   noteLines.push(`Campaign: ${campaign}`)

  let constructedNotes = noteLines.join('\n')
  if (notes) {
    constructedNotes += `\n\n${notes}`
  }

  // ── 6. Insert contact ─────────────────────────────────────────────────────────
  const insertData: Record<string, unknown> = {
    organization_id,
    user_id: systemUserId,
    first_name,
    last_name:    last_name    || '',
    email:        email        || null,
    phone:        phone        || null,
    stage:        stage        || 'Lead',
    contact_type: contact_type || 'borrower',
    lead_source:   lead_source    || 'Website',
    referred_by:   referred_by   || null,
    referral_type: referral_type || 'web_lead',
    notes:        constructedNotes || null,
    company_name: company_name || null,
    created_at:   now,
    last_touch_at: now,
  }

  // Remove null values — let DB defaults handle them
  const cleanData = Object.fromEntries(
    Object.entries(insertData).filter(([, v]) => v != null)
  ) as unknown as ContactInsert

  const { data: newContact, error: insertError } = await supabase
    .from('contacts')
    .insert(cleanData)
    .select('*')
    .single()

  if (insertError || !newContact) {
    console.error('[web-lead] insert error:', insertError)
    return NextResponse.json(
      { error: 'Failed to create contact', detail: insertError?.message },
      { status: 500 }
    )
  }

  // ── 7. Log activity ───────────────────────────────────────────────────────────
  await supabase
    .from('activity_log')
    .insert({
      organization_id,
      contact_id:   newContact.id,
      record_id:    newContact.id,
      record_type:  'contact',
      action:       'contact_created',
      details:      `Web lead created via styermortgage.com — ${loan_type || 'unknown loan type'}`,
      occurred_at:  now,
    })
    .then(({ error }) => {
      if (error) console.error('[web-lead] activity log error:', error)
    })

  // ── 8. Log to contact_activity (powers Hot Leads notes column) ───────────────
  const activityNoteLines: string[] = []
  if (loan_type)          activityNoteLines.push(`Loan: ${loan_type}`)
  if (credit_score_range) activityNoteLines.push(`Credit: ${credit_score_range}`)
  if (purchase_price)     activityNoteLines.push(`Price: ${purchase_price}`)
  if (down_payment)       activityNoteLines.push(`Down: ${down_payment}`)
  if (current_balance)    activityNoteLines.push(`Balance: ${current_balance}`)
  if (home_value)         activityNoteLines.push(`Home Value: ${home_value}`)
  if (goals && Array.isArray(goals) && goals.length > 0) {
    activityNoteLines.push(`Goals: ${goals.join(', ')}`)
  }
  if (situation)          activityNoteLines.push(`Message: ${situation}`)

  const activityNote = activityNoteLines.join('\n')
  if (activityNote) {
    await supabase
      .from('contact_activity')
      .insert({
        organization_id,
        contact_id:    newContact.id,
        activity_type: 'web_lead',
        notes:         activityNote,
        logged_at:     now,
        created_by:    'system',
      })
      .then(({ error }) => {
        if (error) console.error('[web-lead] contact_activity insert error:', error)
      })
  }

  // ── 9. Return ─────────────────────────────────────────────────────────────────
  const fullName = [first_name, last_name].filter(Boolean).join(' ')
  return NextResponse.json({
    contact:   newContact,
    duplicate: duplicate ?? null,
    message:   `Added ${fullName} to contacts.`,
  })
}
