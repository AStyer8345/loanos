import { createClient } from '@/lib/supabase/server'

interface OrganizationContext {
  organizationId: string
  role: 'owner' | 'admin' | 'member'
  userId: string
}

/**
 * Server-only helper — reads the current user's session and returns their
 * organization context. Use this in Server Components and API routes to
 * pre-filter Supabase queries by organization.
 *
 * Throws if:
 * - No active session (user not logged in)
 * - No profile row found (user hasn't been assigned to an org yet)
 *
 * Example usage in a Server Component:
 *
 *   const { organizationId } = await getOrganization()
 *   const { data } = await supabase.from('loans').select('*').eq('organization_id', organizationId)
 */
export async function getOrganization(): Promise<OrganizationContext> {
  const supabase = createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('No active session. User must be logged in.')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    throw new Error(`No profile found for user ${user.id}. Ensure a profile row exists in the profiles table.`)
  }

  if (!profile.organization_id) {
    throw new Error(`User ${user.id} has a profile but is not assigned to an organization.`)
  }

  return {
    organizationId: profile.organization_id,
    role: profile.role as 'owner' | 'admin' | 'member',
    userId: user.id,
  }
}
