import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ── POST /api/agents/cd-extraction ───────────────────────────────────────────
// Called by n8n after extracting Closing Disclosure fields via Claude.
// Payload: loan_id (internal UUID) + any extracted CD fields.
// Updates the loans record and logs to activity_log.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      loan_id,
      closing_date,
      loan_amount,
      interest_rate,
      cash_to_close,
      monthly_payment,
      seller_credits,
      first_payment_date,
      cd_date,
      initial_cd_sent_date,
      most_recent_cd_sent_date,
    } = body

    if (!loan_id) {
      return NextResponse.json({ error: 'loan_id is required' }, { status: 400 })
    }

    const supabase = getServiceClient()

    // Build update payload — only include fields that were provided
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (closing_date)            updates.closing_date             = closing_date
    if (loan_amount != null)     updates.loan_amount              = loan_amount
    if (interest_rate != null)   updates.interest_rate            = interest_rate
    if (cash_to_close != null)   updates.cash_to_close            = cash_to_close
    if (monthly_payment != null) updates.monthly_payment          = monthly_payment
    if (seller_credits != null)  updates.seller_credits           = seller_credits
    if (first_payment_date)      updates.first_payment_date       = first_payment_date
    if (cd_date)                 updates.cd_date                  = cd_date
    if (initial_cd_sent_date)    updates.initial_cd_sent_date     = initial_cd_sent_date
    if (most_recent_cd_sent_date) updates.most_recent_cd_sent_date = most_recent_cd_sent_date

    const updatedFields = Object.keys(updates).filter(k => k !== 'updated_at')

    if (!updatedFields.length) {
      return NextResponse.json({ error: 'No CD fields provided to update' }, { status: 400 })
    }

    const { error: updateError } = await supabase
      .from('loans')
      .update(updates)
      .eq('id', loan_id)

    if (updateError) {
      console.error('[cd-extraction] Loan update failed:', updateError)
      return NextResponse.json({ error: 'Failed to update loan record' }, { status: 500 })
    }

    // Log to activity_log
    await supabase.from('activity_log').insert({
      action: 'loan.cd_received',
      entity_type: 'loan',
      loan_id,
      metadata: { updated_fields: updatedFields, source: 'n8n' },
    })

    return NextResponse.json({ ok: true, loan_id, updated_fields: updatedFields })
  } catch (err) {
    console.error('[cd-extraction] Unhandled error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
