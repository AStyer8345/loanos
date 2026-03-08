import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function BuildTrackerPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  return (
    <iframe
      src="/docs/loanos.html"
      title="LoanOS Build Tracker"
      className="w-full h-full border-0"
    />
  )
}
