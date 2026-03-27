import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/auth'

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const result = await requireAdmin()
  if (result.error) return result.error
  const { serviceClient } = result

  const orgId = params.id

  // Get org details
  const { data: org, error: orgError } = await serviceClient!
    .from('organizations')
    .select('*')
    .eq('id', orgId)
    .single()

  if (orgError || !org) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
  }

  // Get members
  const { data: members } = await serviceClient!
    .from('profiles')
    .select('id, full_name, email, role, created_at')
    .eq('organization_id', orgId)
    .order('created_at')

  // Get recent activity (last 20)
  const { data: activity } = await serviceClient!
    .from('activity_log')
    .select('id, action, entity_type, entity_id, summary, created_at')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(20)

  // Get loan count
  const { count: loanCount } = await serviceClient!
    .from('loans')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId)

  // Get contact count
  const { count: contactCount } = await serviceClient!
    .from('contacts')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId)

  return NextResponse.json({
    ...org,
    members: members || [],
    recent_activity: activity || [],
    loan_count: loanCount || 0,
    contact_count: contactCount || 0,
  })
}
