'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function OnboardingPage() {
  const [orgName, setOrgName] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/org/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orgName, fullName }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Failed to create organization')
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  const ready = !loading && orgName.trim().length > 0

  return (
    <main style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#060b18', fontFamily: "'IBM Plex Mono', monospace" }}>
      <div style={{ width: '100%', maxWidth: '400px', padding: '1rem' }}>
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0' }}>
            Loan<span style={{ color: '#C9A84C' }}>OS</span>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.5rem' }}>Set up your organization to get started.</p>
        </div>

        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', padding: '1.5rem' }}>
          <div>
            <label style={{ color: '#64748b', fontSize: '0.75rem', display: 'block', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Name</label>
            <input
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Adam Styer"
              style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0', padding: '0.5rem 0.75rem', borderRadius: '4px', fontFamily: 'inherit', fontSize: '0.875rem', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ color: '#64748b', fontSize: '0.75rem', display: 'block', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Organization Name</label>
            <input
              value={orgName}
              onChange={e => setOrgName(e.target.value)}
              placeholder="Styer Mortgage Solutions LP"
              required
              style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0', padding: '0.5rem 0.75rem', borderRadius: '4px', fontFamily: 'inherit', fontSize: '0.875rem', boxSizing: 'border-box' }}
            />
          </div>

          {error && <p style={{ color: '#ef4444', fontSize: '0.875rem', margin: 0 }}>{error}</p>}

          <button
            type="submit"
            disabled={!ready}
            style={{ background: ready ? '#C9A84C' : '#1e293b', color: ready ? '#050505' : '#475569', padding: '0.625rem', borderRadius: '4px', border: 'none', cursor: ready ? 'pointer' : 'not-allowed', fontFamily: 'inherit', fontWeight: 600, fontSize: '0.875rem', transition: 'all 0.15s' }}
          >
            {loading ? 'Creating\u2026' : 'Create Organization \u2192'}
          </button>
        </form>
      </div>
    </main>
  )
}
