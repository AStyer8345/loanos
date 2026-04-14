import { redirect } from 'next/navigation'
import { getOrganization } from '@/lib/getOrganization'
import { createClient } from '@/lib/supabase/server'
import TeamClient from './TeamClient'

/**
 * /dashboard/team — Owner-only page for managing teammates and sponsored LOs.
 *
 * Two distinct flows live here:
 *  1. "Invite Teammate" — adds user as member of THIS org (shared pipeline).
 *     For processors, LOAs, admin staff you employ.
 *  2. "Sponsor LO" — creates a brand-new org owned by the invitee.
 *     For licensed LOs you sponsor but who keep their own isolated pipeline.
 *
 * Non-owners are redirected to the dashboard.
 */
export default async function TeamPage() {
  const { organizationId, role } = await getOrganization()

  if (role !== 'owner') {
    redirect('/dashboard')
  }

  const supabase = createClient()

  const { data: members } = await supabase
    .from('profiles')
    .select('id, full_name, email, role')
    .eq('organization_id', organizationId)
    .order('role', { ascending: true })

  return <TeamClient members={members ?? []} />
}
