import { createClient as cookieClient } from '@/lib/supabase/server'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createServiceClient } from '@/lib/supabase/service'
import { readStaffAccess } from '@/lib/staff-access'

export async function teamContext(req: Request) {
  const token = req.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1]
  const db: SupabaseClient = token ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: {headers:{Authorization:`Bearer ${token}`}}, auth:{persistSession:false,autoRefreshToken:false},
  }) : cookieClient({noStore:true}) as unknown as SupabaseClient
  const {data:{user},error} = await db.auth.getUser(token)
  if (error || !user) throw new Error('Sign in required')
  const access = await readStaffAccess(db)
  // Only construct privileged access after a verified identity and immutable access lookup.
  const service = createServiceClient({noStore:true}) as unknown as SupabaseClient
  if (access) {
    if (!access.active) throw new Error('Team access is not active')
    return {db:service,userId:user.id,organizationId:access.organization_id,displayName:access.display_name,compBps:access.comp_bps,owner:false}
  }
  const {data:profile,error:profileError} = await db.from('profiles').select('organization_id,role,full_name').eq('id',user.id).single()
  if (profileError || !profile?.organization_id || profile.role !== 'owner') throw new Error('Team access required')
  const {data:plan,error:planError} = await service.from('comp_plans').select('comp_bps').eq('organization_id',profile.organization_id).eq('is_active',true).maybeSingle()
  if (planError || !plan || !Number.isFinite(Number(plan.comp_bps))) throw new Error('Compensation plan unavailable')
  return {db:service,userId:user.id,organizationId:profile.organization_id as string,displayName:profile.full_name || 'Owner',compBps:Number(plan.comp_bps),owner:true}
}
