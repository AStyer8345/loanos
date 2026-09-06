import type { SupabaseClient } from '@supabase/supabase-js'

export type StaffAccess = {
  restricted: true
  active: boolean
  organization_id: string
  display_name: string
  comp_bps: number
}

/** The database is authoritative; never trust editable user_metadata or URL input. */
export async function readStaffAccess(db: SupabaseClient): Promise<StaffAccess | null> {
  const { data, error } = await db.rpc('staff_access_context')
  if (error) throw new Error('Access settings unavailable')
  if (data === null) return null
  if (data?.restricted !== true || typeof data.active !== 'boolean' ||
      typeof data.organization_id !== 'string' || typeof data.display_name !== 'string' ||
      !Number.isFinite(Number(data.comp_bps))) throw new Error('Invalid access settings')
  return { restricted: true, active: data.active, organization_id: data.organization_id,
    display_name: data.display_name, comp_bps: Number(data.comp_bps) }
}

export function staffPathAllowed(pathname: string): boolean {
  return pathname === '/team' || pathname === '/api/team' ||
    pathname === '/invite/accept' || pathname === '/auth/callback' ||
    pathname === '/auth/confirm' || pathname === '/auth/signout' || pathname === '/'
}
