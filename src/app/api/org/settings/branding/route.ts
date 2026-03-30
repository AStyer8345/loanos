import { NextResponse } from 'next/server'
import { getOrganization } from '@/lib/getOrganization'
import { createClient } from '@/lib/supabase/server'

const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/

export async function GET() {
  try {
    const { organizationId } = await getOrganization()
    const supabase = createClient()

    const { data: org, error } = await supabase
      .from('organizations')
      .select('brand_color, logo_url, slug, name, plan')
      .eq('id', organizationId)
      .single()

    if (error) throw error

    return NextResponse.json({
      brandColor: org.brand_color,
      logoUrl: org.logo_url,
      slug: org.slug,
      orgName: org.name,
      plan: org.plan,
    })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function PATCH(req: Request) {
  try {
    const { organizationId, role } = await getOrganization()
    if (!['owner', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Only owners and admins can update branding' }, { status: 403 })
    }

    const body = await req.json()
    const updates: Record<string, string | null> = {}

    // Validate and set brand_color
    if ('brandColor' in body) {
      if (body.brandColor === null || body.brandColor === '') {
        updates.brand_color = null
      } else if (HEX_COLOR_REGEX.test(body.brandColor)) {
        updates.brand_color = body.brandColor
      } else {
        return NextResponse.json(
          { error: 'Invalid color. Must be a hex color like #C9A84C' },
          { status: 400 }
        )
      }
    }

    // Validate and set logo_url (URL string only — file upload handled separately)
    if ('logoUrl' in body) {
      if (body.logoUrl === null || body.logoUrl === '') {
        updates.logo_url = null
      } else if (typeof body.logoUrl === 'string' && body.logoUrl.startsWith('http')) {
        updates.logo_url = body.logoUrl
      } else {
        return NextResponse.json(
          { error: 'Invalid logo URL' },
          { status: 400 }
        )
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const supabase = createClient()
    const { data, error } = await supabase
      .from('organizations')
      .update(updates)
      .eq('id', organizationId)
      .select('brand_color, logo_url, slug, name, plan')
      .single()

    if (error) throw error

    return NextResponse.json({
      brandColor: data.brand_color,
      logoUrl: data.logo_url,
      slug: data.slug,
      orgName: data.name,
      plan: data.plan,
    })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
