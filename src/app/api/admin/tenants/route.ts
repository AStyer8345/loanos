import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/auth'

export async function GET() {
  const result = await requireAdmin()
  if (result.error) return result.error
  const { serviceClient } = result

  const { data: tenants, error } = await serviceClient!
    .from('organizations')
    .select('id, name, slug, plan, nmls, logo_url, brand_color, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Get member counts per org
  const orgIds = tenants.map((t: { id: string }) => t.id)
  const { data: profiles } = await serviceClient!
    .from('profiles')
    .select('organization_id')
    .in('organization_id', orgIds)

  const memberCounts: Record<string, number> = {}
  profiles?.forEach((p: { organization_id: string | null }) => {
    if (p.organization_id) {
      memberCounts[p.organization_id] = (memberCounts[p.organization_id] || 0) + 1
    }
  })

  // Get last activity per org
  const { data: activities } = await serviceClient!
    .from('activity_log')
    .select('organization_id, created_at')
    .in('organization_id', orgIds)
    .order('created_at', { ascending: false })

  const lastActive: Record<string, string> = {}
  activities?.forEach((a: { organization_id: string | null; created_at: string }) => {
    if (a.organization_id && !lastActive[a.organization_id]) {
      lastActive[a.organization_id] = a.created_at
    }
  })

  const enrichedTenants = tenants.map((t: { id: string; name: string; slug: string | null; plan: string; nmls: string | null; logo_url: string | null; brand_color: string | null; created_at: string }) => ({
    ...t,
    member_count: memberCounts[t.id] || 0,
    last_active: lastActive[t.id] || null,
  }))

  return NextResponse.json(enrichedTenants)
}
