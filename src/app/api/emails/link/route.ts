// POST /api/emails/link
// Links or dismisses an unmatched inbox email.
// Uses service role to bypass RLS — activity_log has no UPDATE policy by design.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

type LinkEmailBody = {
  emailId: string
  loanId?: string
  contactId?: string
  dismiss?: boolean
}

export async function POST(request: NextRequest) {
  // Require authenticated session
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: LinkEmailBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { emailId, loanId, contactId, dismiss } = body
  if (!emailId) {
    return NextResponse.json({ error: 'emailId is required' }, { status: 400 })
  }

  const svc = createServiceClient()

  // DISMISS
  if (dismiss) {
    const { error } = await svc
      .from('activity_log')
      .update({ dismissed: true })
      .eq('id', emailId)
    if (error) {
      console.error('[emails/link] dismiss error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  }

  // LINK TO LOAN
  if (loanId) {
    // Fetch the loan to get its contact_id so we can set both FK columns
    const { data: loan } = await svc
      .from('loans')
      .select('id, contact_id')
      .eq('id', loanId)
      .single()

    const loanContactId = loan?.contact_id ?? null

    const { error: updateError } = await svc
      .from('activity_log')
      .update({
        loan_id: loanId,
        ...(loanContactId ? { contact_id: loanContactId } : {}),
      })
      .eq('id', emailId)

    if (updateError) {
      console.error('[emails/link] link-to-loan error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Update last_touch_at on the contact if we have one
    if (loanContactId) {
      await svc
        .from('contacts')
        .update({ last_touch_at: new Date().toISOString() })
        .eq('id', loanContactId)
    }

    return NextResponse.json({ ok: true })
  }

  // LINK TO CONTACT
  if (contactId) {
    const { error: updateError } = await svc
      .from('activity_log')
      .update({ contact_id: contactId })
      .eq('id', emailId)

    if (updateError) {
      console.error('[emails/link] link-to-contact error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    await svc
      .from('contacts')
      .update({ last_touch_at: new Date().toISOString() })
      .eq('id', contactId)

    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Must provide loanId, contactId, or dismiss' }, { status: 400 })
}
