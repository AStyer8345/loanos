import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function SystemMapPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  return (
    <iframe
      src="/docs/loanos-system-map.html"
      title="LoanOS System Map"
      className="w-full h-full border-0"
    />
  )
}
