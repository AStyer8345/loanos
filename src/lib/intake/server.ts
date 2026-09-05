import { createServiceClient } from '@/lib/supabase/service'
import type { SupabaseClient } from '@supabase/supabase-js'
export const intakeDb = () => createServiceClient() as SupabaseClient
export async function intakeOrganization(slug: unknown) {
  if (typeof slug !== 'string' || !slug) throw new Error('org_slug is required')
  const db = intakeDb()
  const { data: org, error } = await db.from('organizations').select('id').eq('slug',slug).single()
  if (error || !org) throw new Error('Unknown organization')
  const { data: owners, error: ownerError } = await db.from('profiles').select('id,email,full_name').eq('organization_id',org.id).eq('role','owner')
  if (ownerError || owners?.length !== 1 || !owners[0].email) throw new Error('A verified organization owner is required')
  return { db, organizationId: org.id as string, owner: owners[0] as {id:string;email:string;full_name:string|null} }
}
