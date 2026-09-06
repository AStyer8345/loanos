'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { readStaffAccess } from '@/lib/staff-access'
import { Loader2, Lock, CheckCircle, AlertCircle } from 'lucide-react'

/**
 * /invite/accept — post-invite landing page.
 *
 * Flow: Supabase invite email → /auth/callback (code exchange sets session)
 * → here, with an authenticated session but NO password set on the user.
 * User sets a password, then we redirect to /dashboard/getting-started where
 * the onboarding wizard picks up.
 *
 * If the user somehow lands here without a session (expired/bad link), we
 * bounce them to /login.
 */
export default function InviteAcceptPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [email, setEmail] = useState<string | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function initialize() {
      // Admin invitations can return an implicit token fragment without a PKCE code.
      const fragment = new URLSearchParams(window.location.hash.slice(1))
      const access_token = fragment.get('access_token'), refresh_token = fragment.get('refresh_token')
      if (access_token && refresh_token) {
        const { error } = await supabase.auth.setSession({ access_token, refresh_token })
        window.history.replaceState(null, '', window.location.pathname)
        if (error) throw error
      }
      const { data } = await supabase.auth.getUser()
      if (cancelled) return
      if (!data.user) { router.replace('/?error=invite_expired'); return }
      setEmail(data.user.email ?? null)
      setCheckingSession(false)
    }
    void initialize().catch(() => { if (!cancelled) { setError('This invitation could not be verified. Please request a new link.'); setCheckingSession(false) } })
    return () => { cancelled = true }
  }, [router, supabase])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }

    setSubmitting(true)
    try {
      const { error: updErr } = await supabase.auth.updateUser({ password })
      if (updErr) throw updErr
      setDone(true)
      // Short pause so user sees the success state, then wizard
      setTimeout(() => {
        void readStaffAccess(supabase).then(access => { router.push(access ? '/team' : '/dashboard/getting-started'); router.refresh() }).catch(() => router.push('/team'))
        router.refresh()
      }, 800)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set password')
      setSubmitting(false)
    }
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center py-12 px-4">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center">
            <Lock className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Welcome to LoanOS</h1>
            <p className="text-sm text-gray-400">Set a password to finish signing in</p>
          </div>
        </div>

        {email && (
          <p className="text-sm text-gray-400 mb-6">
            Signed in as <span className="text-white font-medium">{email}</span>
          </p>
        )}

        {done ? (
          <div className="flex items-center gap-2 text-sm text-green-400 bg-green-900/20 border border-green-800/40 rounded-lg px-4 py-3">
            <CheckCircle className="w-5 h-5 shrink-0" />
            Password set — opening your workspace...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                placeholder="At least 8 characters"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Confirm password</label>
              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-xs text-red-400 bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              Set password & continue
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
