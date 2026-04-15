import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { checkRateLimit } from '@/lib/rateLimit'

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return req.headers.get('x-real-ip') || 'unknown'
}

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
  videoUrl: string | null
}

export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    // Rate limit — public endpoint, no auth. Throttle both by IP (stop enumeration
    // attacks crawling random tokens) and by token (cap view-count inflation by a
    // single attacker holding a valid link). Legit borrower traffic is a handful
    // of loads per link.
    const ip = getClientIp(req)
    const ipCheck = checkRateLimit(`share-ip:${ip}`, 60, 60_000)
    if (!ipCheck.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }
    const tokenCheck = checkRateLimit(`share-token:${params.token}`, 30, 60_000)
    if (!tokenCheck.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    const supabase = createServiceClient()

    // Explicit column whitelist — do NOT use .select('*'). Any new column added
    // to `scenarios` later (internal notes, commission, LO pricing, etc.) would
    // otherwise leak out through this public borrower-facing endpoint.
    const { data, error } = await supabase
      .from('scenarios')
      .select('id, organization_id, user_id, share_token, share_expires_at, view_count, scenario_type, borrower_name, property_address, property_value, current_loan_data, scenarios_data, results_data, narrative, reinvestment_data, borrower_qa, created_at')
      .eq('share_token', params.token)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Scenario not found' }, { status: 404 })
    }

    // Check expiration
    if (data.share_expires_at && new Date(data.share_expires_at) < new Date()) {
      return NextResponse.json({ error: 'Share link has expired' }, { status: 410 })
    }

    // Atomic view_count increment via RPC (migration 077). Read-then-write
    // loses updates under concurrent viewers — a single SQL UPDATE is atomic.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).rpc('increment_scenario_view_count', {
      p_share_token: params.token,
    })

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
      videoUrl: settings.scenario_video_url || null,
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
      borrower_qa: data.borrower_qa ?? null,
      created_at: data.created_at,
      branding,
    })
  } catch (error) {
    console.error('[share] error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
