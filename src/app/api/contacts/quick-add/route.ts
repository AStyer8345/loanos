import { NextRequest, NextResponse } from 'next/server'
import { extractContactInfo, type ExtractedContact } from '@/lib/chat-command-parser'
import { normalizeContactStage } from '@/lib/constants/loan-stages'
import { createServiceClient } from '@/lib/supabase/service'
import { getOrganization } from '@/lib/getOrganization'
import { writeActivityWithPii } from '@/lib/activity/pii'
import type { Database } from '@/lib/database.types'
import { getAnthropicClient } from '@/lib/anthropic/client'
import { CLAUDE_MODEL } from '@/lib/anthropic/model'

type ContactInsert = Database['public']['Tables']['contacts']['Insert']

async function extractContactInfoWithAI(raw: string): Promise<ExtractedContact> {
  const anthropic = await getAnthropicClient()
  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 300,
    temperature: 0,
    messages: [{
      role: 'user',
      content: `Extract contact info from the following natural language input and return ONLY valid JSON with these exact fields (null if not present):
{
  "first_name": string | null,
  "last_name": string | null,
  "email": string | null,
  "phone": string | null,
  "stage": one of exactly ["Lead","Pre-App","Application","Pre-Approved","In Process","Closing","Closed","Other"] | null,
  "contact_type": "borrower" | "realtor" | "referral partner" | "vendor" | null,
  "referred_by": string | null,
  "notes": string | null,
  "source": string | null,
  "company_name": string | null
}

CRITICAL — Name parsing rules:
- first_name and last_name are ONLY the person's actual name (typically 1-2 words each).
- Do NOT include words from the surrounding sentence in the name. "Add John Smith, phone number..." → first_name: "John", last_name: "Smith". Stop at punctuation, commas, or transition words like "phone", "email", "he", "she", "from", etc.
- If only one name is given, put it in first_name and set last_name to null.

Stage inference rules (use exact string from list above):
- "just met", "new lead", "open house", "reached out", no purchase context → "Lead"
- "wants to apply", "ready to start", "filling out app" → "Application"
- "pre-approved", "got approval", "has approval", "we discussed pre-approval" → "Pre-Approved"
- "in process", "submitted to lender" → "In Process"
- "closing soon", "clear to close" → "Closing"
- "funded", "closed" → "Closed"
- If unclear → null

Source rules (lead_source — how the borrower found us):
- "web lead", "website", "online", "found my website" → "Web Lead"
- "realtor referral", "referred by [realtor name]" → "Realtor Referral"
- "Zillow", "LendingTree", "Bankrate" → use platform name
- "open house" → "Open House"
- "called me", "walked in" → "Direct"
- "referral", "friend referred" → "Referral"
- If unclear → null

Notes: capture ALL free-form context not represented by other fields — situation details, conversation notes, action items, timeline, follow-up reminders, how the conversation went, next steps. This is the most important field for context. Include everything the user said that isn't a structured field.

Return ONLY the JSON object, no markdown, no explanation.

Input: ${raw}`,
    }],
  })

  // Validate response content exists and is text
  if (!response.content || response.content.length === 0 || response.content[0].type !== 'text') {
    throw new Error('[quick-add] AI extractor returned no text content')
  }

  const text = response.content[0].text.trim()
  if (!text) {
    throw new Error('[quick-add] AI extractor returned empty response')
  }

  // Guard JSON.parse — malformed JSON should propagate to the fallback
  let parsed: ExtractedContact
  try {
    parsed = JSON.parse(text) as ExtractedContact
  } catch {
    throw new Error(`[quick-add] AI extractor returned non-JSON: ${text.slice(0, 100)}`)
  }

  return parsed
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
    const { organizationId, userId } = await getOrganization()
    const body = await req.json()
    const supabase = createServiceClient()

    let extracted: ExtractedContact

    if (body.confirmed && body.contact) {
      // User confirmed the parsed data — use it directly
      extracted = body.contact
    } else if (body.raw) {
      // Try AI extraction first, fall back to regex on error
      try {
        extracted = await extractContactInfoWithAI(body.raw)
      } catch (err) {
        console.warn('[quick-add] AI extraction failed, using regex fallback:', err)
        extracted = extractContactInfo(body.raw)
      }
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
        .eq('organization_id', organizationId)
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
        .eq('organization_id', organizationId)

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
      stage: normalizeContactStage(extracted.stage),
      contact_type: extracted.contact_type || 'borrower',
      referred_by: referredByResolved,
      lead_source: extracted.source || (referredByResolved ? 'Realtor Referral' : null),
      company_name: extracted.company_name,
      notes: extracted.notes,
      user_id: userId,
      organization_id: organizationId,
    }

    // Remove null values — let DB defaults handle them
    const cleanData = Object.fromEntries(
      Object.entries(insertData).filter(([, v]) => v != null)
    ) as unknown as ContactInsert

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
    await writeActivityWithPii(supabase, {
      action: 'contact_created',
      entity_type: 'contact',
      entity_id: newContact.id,
      organization_id: organizationId,
    }, {
      summary: `Quick-added via AI chat: ${newContact.first_name} ${newContact.last_name || ''}`.trim(),
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
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
