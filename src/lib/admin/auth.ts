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

/**
 * Checks if the current user is a system admin (super-admin).
 * Returns the user and a service-role Supabase client for cross-tenant queries.
 * Returns an error NextResponse if unauthorized or not an admin.
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
