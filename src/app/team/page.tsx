import TeamDesk from './TeamDesk'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { readStaffAccess } from '@/lib/staff-access'
export const dynamic = 'force-dynamic'
export default async function TeamPage() {
  const db = createClient({noStore:true})
  const {data:{user}} = await db.auth.getUser()
  if (!user) redirect('/')
  const access = await readStaffAccess(db)
  if (access && !access.active) return <p>Your team access is not active.</p>
  if (!access) {
    const {data:profile} = await db.from('profiles').select('role').eq('id',user.id).single()
    if (profile?.role !== 'owner') redirect('/dashboard')
  }
  return <TeamDesk/>
}
