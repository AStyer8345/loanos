import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

interface AdminResult {
  error?: NextResponse
  user?: { id: string; email?: string }
  serviceClient?: SupabaseClient<Database>
}

interface OrgAdminResult {
  error?: NextResponse
  user?: { id: string; email?: string; organizationId: string }
}

/**
 * Checks if the current user is a system admin (cross-tenant super-admin).
 * Use this for /api/admin/* routes that operate across tenant boundaries.
 * Returns the user and a service-role Supabase client for cross-tenant queries.
 * Returns an error NextResponse if unauthorized or not a system admin.
 */
export async function requireAdmin(): Promise<AdminResult> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const serviceClient = createServiceClient()
  const { data: admin } = await serviceClient
    .from('system_admins')
    .select('user_id')
    .eq('user_id', user.id)
    .single()

  if (!admin) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  return { user: { id: user.id, email: user.email }, serviceClient }
}

/**
 * Checks if the current user is an org admin (within-tenant admin role).
 * Use this for routes that require org-level management but NOT cross-tenant access.
 * Distinct from requireAdmin() which grants cross-tenant system access.
 * Returns an error NextResponse if unauthorized or the user's role !== 'admin'.
 */
export async function requireOrgAdmin(): Promise<OrgAdminResult> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) {
    return { error: NextResponse.json({ error: 'No organization found' }, { status: 403 }) }
  }

  if (profile.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Forbidden — org admin required' }, { status: 403 }) }
  }

  return { user: { id: user.id, email: user.email, organizationId: profile.organization_id } }
}

/**
 * Checks if a given user ID is a system admin. Non-throwing.
 * Used in layouts/pages for conditional rendering.
 */
export async function isSystemAdmin(): Promise<boolean> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const serviceClient = createServiceClient()
    const { data } = await serviceClient
      .from('system_admins')
      .select('user_id')
      .eq('user_id', user.id)
      .single()

    return !!data
  } catch {
    return false
  }
}
