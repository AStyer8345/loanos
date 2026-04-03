import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export interface ShareBranding {
  loName: string
  company: string
  nmls: string
  phone: string
  email: string
  logoUrl: string | null
  brandColor: string
  calendlyUrl: string | null
  applicationUrl: string | null
}

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

    // Fetch LO branding: org + user_settings
    const [orgResult, settingsResult] = await Promise.all([
      supabase
        .from('organizations')
        .select('name, nmls, logo_url, brand_color')
        .eq('id', data.organization_id)
        .single(),
      supabase
        .from('user_settings')
        .select('key, value')
        .eq('user_id', data.user_id!),
    ])

    const org = orgResult.data
    const settings: Record<string, string> = {}
    if (settingsResult.data) {
      for (const row of settingsResult.data) {
        settings[row.key] = String(row.value ?? '')
      }
    }

    const branding: ShareBranding = {
      loName: settings.lo_name || 'Your Loan Officer',
      company: settings.company || org?.name || '',
      nmls: settings.nmls || org?.nmls || '',
      phone: settings.phone || '',
      email: settings.email || '',
      logoUrl: org?.logo_url || null,
      brandColor: org?.brand_color || '#C9A84C',
      calendlyUrl: settings.calendly_url || null,
      applicationUrl: settings.application_url || null,
    }

    // Return borrower-facing data + LO branding
    return NextResponse.json({
      scenario_type: data.scenario_type,
      borrower_name: data.borrower_name,
      property_address: data.property_address,
      property_value: data.property_value,
      current_loan_data: data.current_loan_data,
      scenarios_data: data.scenarios_data,
      results_data: data.results_data,
      narrative: data.narrative,
      reinvestment_data: data.reinvestment_data,
      created_at: data.created_at,
      branding,
    })
  } catch (error) {
    console.error('[share] error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
