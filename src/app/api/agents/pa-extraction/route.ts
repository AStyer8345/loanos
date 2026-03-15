import { NextRequest, NextResponse } from 'next/server'
import { validateAgentSecret } from '@/lib/auth/validateAgentSecret'
import { createServiceClient } from '@/lib/supabase/service'

// ── POST /api/agents/pa-extraction ───────────────────────────────────────────
// Called by n8n after extracting Pre-Approval letter fields via Claude.
// Payload: loan_id (internal UUID) + extracted PA fields.
// Updates the loans record, sets status to Pre-Approved, logs to activity_log.
export async function POST(req: NextRequest) {
  const authError = validateAgentSecret(req)
  if (authError) return authError

  try {
    const body = await req.json()
    const {
      loan_id,
      loan_amount,
      interest_rate,
      loan_program,
      down_payment_pct,
      pre_approval_expiry_date,
      property_address,
      set_status_pre_approved,
    } = body

    if (!loan_id) {
      return NextResponse.json({ error: 'loan_id is required' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Build update payload
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (loan_amount != null)          updates.loan_amount             = loan_amount
    if (interest_rate != null)        updates.interest_rate           = interest_rate
    if (loan_program)                 updates.loan_program            = loan_program
    if (down_payment_pct != null)     updates.down_payment_pct        = down_payment_pct
    if (pre_approval_expiry_date)     updates.pre_approval_expiry_date = pre_approval_expiry_date
    if (property_address)             updates.property_address        = property_address
    if (set_status_pre_approved)      updates.status                  = 'Pre-Approved'

    const updatedFields = Object.keys(updates).filter(k => k !== 'updated_at')

    if (!updatedFields.length) {
      return NextResponse.json({ error: 'No PA fields provided to update' }, { status: 400 })
    }

    const { error: updateError } = await supabase
      .from('loans')
      .update(updates)
      .eq('id', loan_id)

    if (updateError) {
      console.error('[pa-extraction] Loan update failed:', updateError)
      return NextResponse.json({ error: 'Failed to update loan record' }, { status: 500 })
    }

    // Log to activity_log
    await supabase.from('activity_log').insert({
      action: 'loan.pa_received',
      entity_type: 'loan',
      loan_id,
      metadata: { updated_fields: updatedFields, source: 'n8n' },
    })

    return NextResponse.json({ ok: true, loan_id, updated_fields: updatedFields })
  } catch (err) {
    console.error('[pa-extraction] Unhandled error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
