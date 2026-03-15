import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('scenarios')
      .select('*')
      .eq('share_token', params.token)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Scenario not found' }, { status: 404 })
    }

    // Check expiration
    if (data.share_expires_at && new Date(data.share_expires_at) < new Date()) {
      return NextResponse.json({ error: 'Share link has expired' }, { status: 410 })
    }

    // Increment view count
    await supabase
      .from('scenarios')
      .update({ view_count: (data.view_count || 0) + 1 })
      .eq('id', data.id)

    // Return only borrower-facing data (no internal fields)
    return NextResponse.json({
      scenario_type: data.scenario_type,
      borrower_name: data.borrower_name,
      property_address: data.property_address,
      property_value: data.property_value,
      current_loan_data: data.current_loan_data,
      scenarios_data: data.scenarios_data,
      narrative: data.narrative,
      reinvestment_data: data.reinvestment_data,
      created_at: data.created_at,
    })
  } catch (error) {
    console.error('[share] error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
