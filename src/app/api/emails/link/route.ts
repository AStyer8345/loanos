// POST /api/emails/link
// Links or dismisses an unmatched inbox email.
// Uses service role to bypass RLS — activity_log has no UPDATE policy by design.

import { NextRequest, NextResponse } from 'next/server'
import { getOrganization } from '@/lib/getOrganization'
import { createServiceClient } from '@/lib/supabase/service'

type LinkEmailBody = {
  emailId: string
  loanId?: string
  contactId?: string
  dismiss?: boolean
}

const TERMINAL_STATUSES = '("Closed","Cancelled","Denied","Withdrawn","Funded","LOAN_FUNDED")'

export async function POST(request: NextRequest) {
  let organizationId: string
  try {
    const ctx = await getOrganization()
    organizationId = ctx.organizationId
  } catch {
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
    const { data, error } = await svc
      .from('activity_log')
      .update({ dismissed: true })
      .eq('id', emailId)
      .eq('organization_id', organizationId)
      .select('id')
    if (error) {
      console.error('[emails/link] dismiss error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    if (!data || data.length === 0) {
      console.error('[emails/link] dismiss: no rows matched for id:', emailId)
      return NextResponse.json({ error: 'Email not found' }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  }

  // LINK TO LOAN
  if (loanId) {
    // Fetch the loan to get its contact_id so we can set both FK columns
    const { data: loan, error: loanErr } = await svc
      .from('loans')
      .select('id, contact_id')
      .eq('id', loanId)
      .eq('organization_id', organizationId)
      .single()

    if (loanErr || !loan) {
      console.error('[emails/link] loan not found:', loanId, loanErr)
      return NextResponse.json({ error: 'Loan not found' }, { status: 404 })
    }

    const loanContactId = loan.contact_id ?? null

    const { data: updated, error: updateError } = await svc
      .from('activity_log')
      .update({
        loan_id: loanId,
        ...(loanContactId ? { contact_id: loanContactId } : {}),
      })
      .eq('id', emailId)
      .eq('organization_id', organizationId)
      .select('id')

    if (updateError) {
      console.error('[emails/link] link-to-loan error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }
    if (!updated || updated.length === 0) {
      console.error('[emails/link] link-to-loan: no rows matched for id:', emailId)
      return NextResponse.json({ error: 'Email not found' }, { status: 404 })
    }

    // Update loans.updated_at so loan detail reflects recent activity
    await svc
      .from('loans')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', loanId)
      .eq('organization_id', organizationId)

    // Update last_touch_at on the contact if we have one
    if (loanContactId) {
      await svc
        .from('contacts')
        .update({ last_touch_at: new Date().toISOString() })
        .eq('id', loanContactId)
        .eq('organization_id', organizationId)
    }

    return NextResponse.json({ ok: true })
  }

  // LINK TO CONTACT
  if (contactId) {
    // Also try to find the contact's active loan so we can set loan_id too
    const { data: activeLoan } = await svc
      .from('loans')
      .select('id')
      .eq('contact_id', contactId)
      .eq('organization_id', organizationId)
      .not('status', 'in', TERMINAL_STATUSES)
      .order('updated_at', { ascending: false })
      .limit(1)

    const activeLoanId = activeLoan?.[0]?.id ?? null

    const { data: updated, error: updateError } = await svc
      .from('activity_log')
      .update({
        contact_id: contactId,
        ...(activeLoanId ? { loan_id: activeLoanId } : {}),
      })
      .eq('id', emailId)
      .eq('organization_id', organizationId)
      .select('id')

    if (updateError) {
      console.error('[emails/link] link-to-contact error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }
    if (!updated || updated.length === 0) {
      console.error('[emails/link] link-to-contact: no rows matched for id:', emailId)
      return NextResponse.json({ error: 'Email not found' }, { status: 404 })
    }

    await svc
      .from('contacts')
      .update({ last_touch_at: new Date().toISOString() })
      .eq('id', contactId)
      .eq('organization_id', organizationId)

    // Update loan's updated_at if we linked to one
    if (activeLoanId) {
      await svc
        .from('loans')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', activeLoanId)
        .eq('organization_id', organizationId)
    }

    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Must provide loanId, contactId, or dismiss' }, { status: 400 })
}
