// SaaS-safe: org-scoped via RLS
// POST /api/notes — create a note + log note_added to activity_log

import { NextRequest, NextResponse } from 'next/server'
import { getOrganization } from '@/lib/getOrganization'
import { createServiceClient } from '@/lib/supabase/service'
import { writeActivityWithPii, type ActivityPublicFields } from '@/lib/activity/pii'

export async function POST(request: NextRequest) {
  let organizationId: string
  let userId: string
  try {
    const ctx = await getOrganization()
    organizationId = ctx.organizationId
    userId = ctx.userId
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { contact_id, loan_id, content } = body

  if (!content?.trim()) {
    return NextResponse.json({ error: 'content is required' }, { status: 400 })
  }

  if (!contact_id && !loan_id) {
    return NextResponse.json(
      { error: 'At least one of contact_id or loan_id is required' },
      { status: 400 },
    )
  }

  const serviceClient = createServiceClient()

  // 1. Insert note
  const { data: note, error: noteError } = await serviceClient
    .from('notes')
    .insert({
      organization_id: organizationId,
      contact_id: contact_id || null,
      loan_id: loan_id || null,
      content: content.trim(),
      created_by: userId,
    })
    .select()
    .single()

  if (noteError) {
    console.error('[api/notes POST] insert error:', noteError.message)
    return NextResponse.json({ error: noteError.message }, { status: 500 })
  }

  // 2. Log note_added to activity_log with PII encryption
  const publicFields: ActivityPublicFields = {
    organization_id: organizationId,
    user_id: userId,
    contact_id: contact_id || null,
    loan_id: loan_id || null,
    action: 'note_added',
    type: 'note_added',
    event_type: 'note_added',
    entity_type: 'note',
    entity_id: note.id,
    occurred_at: new Date().toISOString(),
  }

  await writeActivityWithPii(serviceClient, publicFields, {
    summary: `Note added: ${content.trim().slice(0, 100)}`,
    metadata: { note_id: note.id },
  }).catch(err => {
    console.error('[api/notes POST] activity log write failed:', err)
  })

  // 3. Update contact last_touch_at if contact_id present
  if (contact_id) {
    try {
      await serviceClient
        .from('contacts')
        .update({ last_touch_at: new Date().toISOString() })
        .eq('id', contact_id)
    } catch {
      // non-critical — notes still saved even if last_touch_at update fails
    }
  }

  return NextResponse.json(note)
}

// GET /api/notes — fetch notes for a contact or loan
export async function GET(request: NextRequest) {
  let organizationId: string
  try {
    const ctx = await getOrganization()
    organizationId = ctx.organizationId
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const params = request.nextUrl.searchParams
  const contactId = params.get('contact_id')
  const loanId = params.get('loan_id')

  if (!contactId && !loanId) {
    return NextResponse.json(
      { error: 'contact_id or loan_id is required' },
      { status: 400 },
    )
  }

  const serviceClient = createServiceClient()
  let query = serviceClient
    .from('notes')
    .select('*')
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(100)

  if (contactId) query = query.eq('contact_id', contactId)
  if (loanId) query = query.eq('loan_id', loanId)

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
