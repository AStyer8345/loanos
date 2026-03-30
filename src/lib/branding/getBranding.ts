import { createClient } from '@/lib/supabase/server'

export interface OrgBranding {
  logoUrl: string | null
  brandColor: string | null
  orgName: string
  slug: string | null
}

export const DEFAULT_BRANDING: OrgBranding = {
  logoUrl: null,
  brandColor: '#C9A84C',
  orgName: 'LoanOS',
  slug: null,
}

export async function getBranding(): Promise<OrgBranding> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return DEFAULT_BRANDING

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profile?.organization_id) return DEFAULT_BRANDING

    const { data: org } = await supabase
      .from('organizations')
      .select('name, brand_color, logo_url, slug')
      .eq('id', profile.organization_id)
      .single()

    if (!org) return DEFAULT_BRANDING

    return {
      logoUrl: org.logo_url ?? null,
      brandColor: org.brand_color ?? DEFAULT_BRANDING.brandColor,
      orgName: org.name,
      slug: org.slug ?? null,
    }
  } catch {
    return DEFAULT_BRANDING
  }
}
