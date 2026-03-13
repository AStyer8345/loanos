import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { extractContactInfo, type ExtractedContact } from '@/lib/chat-command-parser'

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, serviceKey)
}

/**
 * POST /api/contacts/quick-add
 * Body: { raw: string } — natural language contact description
 * OR:   { contact: ExtractedContact, confirmed: true } — pre-parsed + confirmed
 *
 * Returns: { contact, extracted, duplicate?, message }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const supabase = getServiceClient()

    let extracted: ExtractedContact

    if (body.confirmed && body.contact) {
      // User confirmed the parsed data — use it directly
      extracted = body.contact
    } else if (body.raw) {
      // Parse natural language input
      extracted = extractContactInfo(body.raw)
    } else {
      return NextResponse.json({ error: 'Missing raw text or confirmed contact' }, { status: 400 })
    }

    // Validate: need at least a first name
    if (!extracted.first_name) {
      return NextResponse.json({
        error: 'Could not extract a name from the input. Try: "Add John Doe, phone 512-555-1234"',
        extracted,
      }, { status: 400 })
    }

    // ── Dedup Check ──────────────────────────────────────────────────────────
    const dupConditions: string[] = []
    if (extracted.email) {
      dupConditions.push(`email.ilike.${extracted.email}`)
    }
    if (extracted.phone) {
      const digits = extracted.phone.replace(/\D/g, '')
      // Check phone field containing these digits
      dupConditions.push(`phone.ilike.%${digits.slice(-7)}%`)
    }

    let duplicate = null
    if (dupConditions.length > 0) {
      const { data: dups } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, email, phone')
        .or(dupConditions.join(','))
        .limit(1)

      if (dups && dups.length > 0) {
        duplicate = dups[0]
      }
    }

    // Always return for user review if not confirmed
    if (!body.confirmed) {
      return NextResponse.json({
        extracted,
        duplicate,
        message: duplicate
          ? `Possible duplicate: ${duplicate.first_name} ${duplicate.last_name} (${duplicate.email || duplicate.phone}). Confirm to add anyway.`
          : `Review and confirm to add ${extracted.first_name || 'contact'}${extracted.last_name ? ' ' + extracted.last_name : ''}.`,
        needsConfirmation: true,
      })
    }

    // ── Resolve referred_by to a contact name ────────────────────────────────
    let referredByResolved = extracted.referred_by
    if (extracted.referred_by) {
      const parts = extracted.referred_by.trim().split(/\s+/)
      let query = supabase
        .from('contacts')
        .select('id, first_name, last_name')

      if (parts.length >= 2) {
        query = query
          .ilike('first_name', parts[0])
          .ilike('last_name', parts.slice(1).join(' '))
      } else {
        query = query.or(
          `first_name.ilike.%${parts[0]}%,last_name.ilike.%${parts[0]}%`
        )
      }

      const { data: refMatches } = await query.limit(1)
      if (refMatches && refMatches.length > 0) {
        referredByResolved = `${refMatches[0].first_name} ${refMatches[0].last_name}`.trim()
      }
    }

    // ── Insert Contact ───────────────────────────────────────────────────────
    const insertData: Record<string, unknown> = {
      first_name: extracted.first_name,
      last_name: extracted.last_name,
      email: extracted.email,
      phone: extracted.phone,
      stage: extracted.stage || 'Lead',
      contact_type: extracted.contact_type || 'borrower',
      referred_by: referredByResolved,
      lead_source: extracted.source || (referredByResolved ? 'Realtor Referral' : null),
      company_name: extracted.company_name,
      notes: extracted.notes,
    }

    // Remove null values — let DB defaults handle them
    const cleanData = Object.fromEntries(
      Object.entries(insertData).filter(([, v]) => v != null)
    )

    const { data: newContact, error: insertError } = await supabase
      .from('contacts')
      .insert(cleanData)
      .select('id, first_name, last_name, email, phone, stage, contact_type, referred_by')
      .single()

    if (insertError) {
      console.error('[quick-add] insert error:', insertError)
      return NextResponse.json({ error: 'Failed to create contact', detail: insertError.message }, { status: 500 })
    }

    // ── Log Activity ─────────────────────────────────────────────────────────
    await supabase.from('activity_log').insert({
      record_id: newContact.id,
      record_type: 'contact',
      action: 'contact_created',
      details: `Quick-added via AI chat: ${newContact.first_name} ${newContact.last_name || ''}`.trim(),
    }).then(({ error }) => {
      if (error) console.error('[quick-add] activity log error:', error)
    })

    return NextResponse.json({
      contact: newContact,
      extracted,
      message: `Added ${newContact.first_name} ${newContact.last_name || ''} to contacts.`.trim(),
    })

  } catch (error) {
    console.error('[quick-add] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
