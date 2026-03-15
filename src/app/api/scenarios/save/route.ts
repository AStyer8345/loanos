import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const {
      id, scenario_type, borrower_name, property_address, property_value,
      current_loan_data, scenarios_data, results_data, narrative, narrative_edited,
      reinvestment_data, source,
    } = body

    const record = {
      user_id: user.id,
      scenario_type,
      borrower_name: borrower_name || null,
      property_address: property_address || null,
      property_value: property_value || null,
      current_loan_data: current_loan_data || null,
      scenarios_data,
      results_data: results_data || null,
      narrative: narrative || null,
      narrative_edited: narrative_edited || false,
      reinvestment_data: reinvestment_data || null,
      source: source || 'manual',
      updated_at: new Date().toISOString(),
    }

    if (id) {
      // Update existing
      const { data, error } = await supabase
        .from('scenarios')
        .update(record)
        .eq('id', id)
        .eq('user_id', user.id)
        .select('id, share_token')
        .single()

      if (error) throw error
      return NextResponse.json(data)
    } else {
      // Insert new
      const { data, error } = await supabase
        .from('scenarios')
        .insert(record)
        .select('id, share_token')
        .single()

      if (error) throw error
      return NextResponse.json(data)
    }
  } catch (error) {
    console.error('[scenarios/save] error:', error)
    return NextResponse.json({ error: 'Failed to save scenario' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'Missing scenario id' }, { status: 400 })

    const { error } = await supabase
      .from('scenarios')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[scenarios/delete] error:', error)
    return NextResponse.json({ error: 'Failed to delete scenario' }, { status: 500 })
  }
}
