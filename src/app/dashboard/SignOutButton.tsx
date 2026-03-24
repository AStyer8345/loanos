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
      className="w-full text-sm text-zinc-500 hover:text-zinc-200 border border-zinc-700 hover:border-zinc-600 px-3 py-1.5 rounded-md transition-colors"
    >
      Sign out
    </button>
  )
}
