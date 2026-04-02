'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  const ready = !loading && !!email && !!password

  return (
    <main
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--bg)', fontFamily: "'IBM Plex Mono', monospace" }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="text-2xl font-bold tracking-tight font-mono mb-1" style={{ color: 'var(--text)' }}>
            Loan<span style={{ color: 'var(--gold)' }}>OS</span>
          </div>
          <p className="text-xs font-mono tracking-widest uppercase" style={{ color: 'var(--muted)' }}>
            Mortgage Operations Platform
          </p>
        </div>

        <form
          onSubmit={handleSignIn}
          className="rounded-lg p-6 space-y-4"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
          }}
        >
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-mono mb-1.5 uppercase tracking-wider"
              style={{ color: 'var(--muted)' }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full rounded px-3 py-2 text-sm font-mono outline-none transition-colors"
              style={{
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
              }}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-mono mb-1.5 uppercase tracking-wider"
              style={{ color: 'var(--muted)' }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full rounded px-3 py-2 text-sm font-mono outline-none transition-colors"
              style={{
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
              }}
            />
          </div>

          {error && (
            <p className="text-xs font-mono" style={{ color: 'var(--red)' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={!ready}
            className="w-full font-mono font-semibold py-2 px-4 rounded text-sm tracking-wider transition-colors"
            style={{
              background: ready ? 'var(--gold)' : 'var(--surface2)',
              color: ready ? 'var(--bg)' : 'var(--muted)',
              border: '1px solid var(--border)',
              cursor: ready ? 'pointer' : 'not-allowed',
              opacity: ready ? 1 : 0.5,
            }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </main>
  )
}
