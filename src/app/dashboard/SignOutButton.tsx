'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignOutButton() {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <button
      onClick={handleSignOut}
      className="w-full text-sm text-muted-foreground hover:text-foreground border border-input hover:border-input px-3 py-1.5 rounded-md transition-colors"
    >
      Sign out
    </button>
  )
}
