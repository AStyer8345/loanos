'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  background: '#1e293b',
  border: '1px solid #334155',
  color: '#e2e8f0',
  padding: '0.5rem 0.75rem',
  borderRadius: '4px',
  fontFamily: 'inherit',
  fontSize: '0.875rem',
  boxSizing: 'border-box',
}

const LABEL_STYLE: React.CSSProperties = {
  color: '#64748b',
  fontSize: '0.75rem',
  display: 'block',
  marginBottom: '0.25rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
]

const PLANS = [
  {
    id: 'starter',
    label: 'Starter',
    price: 'Free',
    features: ['Unlimited loans', 'AI milestone agent', 'Pre-approval & CD emails', 'Daily briefing'],
  },
  {
    id: 'professional',
    label: 'Professional',
    price: '$99/mo',
    features: ['Everything in Starter', 'Team members', 'Custom branding', 'Priority support'],
  },
] as const

export default function OnboardingPage() {
  const [fullName, setFullName] = useState('')
  const [orgName, setOrgName] = useState('')
  const [nmlsIndividual, setNmlsIndividual] = useState('')
  const [phone, setPhone] = useState('')
  const [statesLicensed, setStatesLicensed] = useState<string[]>([])
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'professional'>('starter')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  function toggleState(st: string) {
    setStatesLicensed(prev =>
      prev.includes(st) ? prev.filter(s => s !== st) : [...prev, st]
    )
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/org/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orgName,
        fullName,
        nmlsIndividual: nmlsIndividual.trim() || null,
        phone: phone.trim() || null,
        statesLicensed,
        plan: selectedPlan,
      }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Failed to create organization')
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  const ready = !loading && orgName.trim().length > 0 && fullName.trim().length > 0

  return (
    <main style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#060b18', fontFamily: "'IBM Plex Mono', monospace", padding: '2rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0' }}>
            Loan<span style={{ color: '#C9A84C' }}>OS</span>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            Set up your organization to get started.
          </p>
        </div>

        <form
          onSubmit={handleCreate}
          style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', padding: '1.75rem' }}
        >
          {/* Section: You */}
          <div style={{ borderBottom: '1px solid #1e293b', paddingBottom: '0.25rem', marginBottom: '0.25rem' }}>
            <span style={{ color: '#C9A84C', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              About You
            </span>
          </div>

          <div>
            <label style={LABEL_STYLE}>Full Name *</label>
            <input
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Adam Styer"
              required
              style={INPUT_STYLE}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={LABEL_STYLE}>Individual NMLS #</label>
              <input
                value={nmlsIndividual}
                onChange={e => setNmlsIndividual(e.target.value)}
                placeholder="513013"
                style={INPUT_STYLE}
              />
            </div>
            <div>
              <label style={LABEL_STYLE}>Phone</label>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="(512) 555-0100"
                type="tel"
                style={INPUT_STYLE}
              />
            </div>
          </div>

          <div>
            <label style={LABEL_STYLE}>States Licensed</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginTop: '0.25rem' }}>
              {US_STATES.map(st => (
                <button
                  key={st}
                  type="button"
                  onClick={() => toggleState(st)}
                  style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '3px',
                    border: statesLicensed.includes(st) ? '1px solid #C9A84C' : '1px solid #334155',
                    background: statesLicensed.includes(st) ? '#C9A84C22' : 'transparent',
                    color: statesLicensed.includes(st) ? '#C9A84C' : '#64748b',
                    fontSize: '0.7rem',
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                    transition: 'all 0.1s',
                  }}
                >
                  {st}
                </button>
              ))}
            </div>
            {statesLicensed.length > 0 && (
              <p style={{ color: '#64748b', fontSize: '0.7rem', marginTop: '0.375rem' }}>
                {statesLicensed.length} state{statesLicensed.length !== 1 ? 's' : ''} selected
              </p>
            )}
          </div>

          {/* Section: Organization */}
          <div style={{ borderBottom: '1px solid #1e293b', paddingBottom: '0.25rem', marginBottom: '0.25rem', marginTop: '0.25rem' }}>
            <span style={{ color: '#C9A84C', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Your Organization
            </span>
          </div>

          <div>
            <label style={LABEL_STYLE}>Organization / Team Name *</label>
            <input
              value={orgName}
              onChange={e => setOrgName(e.target.value)}
              placeholder="Styer Mortgage Solutions LP"
              required
              style={INPUT_STYLE}
            />
          </div>

          {/* Section: Plan */}
          <div style={{ borderBottom: '1px solid #1e293b', paddingBottom: '0.25rem', marginBottom: '0.25rem', marginTop: '0.25rem' }}>
            <span style={{ color: '#C9A84C', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Choose a Plan
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {PLANS.map(plan => {
              const active = selectedPlan === plan.id
              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlan(plan.id)}
                  style={{
                    background: active ? '#C9A84C15' : 'transparent',
                    border: active ? '1px solid #C9A84C' : '1px solid #334155',
                    borderRadius: '6px',
                    padding: '0.875rem 0.75rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 0.1s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                    <span style={{ color: active ? '#C9A84C' : '#e2e8f0', fontWeight: 700, fontSize: '0.875rem' }}>{plan.label}</span>
                    <span style={{ color: active ? '#C9A84C' : '#94a3b8', fontSize: '0.75rem', fontWeight: 600 }}>{plan.price}</span>
                  </div>
                  {plan.features.map(f => (
                    <div key={f} style={{ color: '#64748b', fontSize: '0.65rem', marginBottom: '0.2rem', display: 'flex', alignItems: 'flex-start', gap: '0.3rem' }}>
                      <span style={{ color: active ? '#C9A84C' : '#475569', flexShrink: 0 }}>·</span>{f}
                    </div>
                  ))}
                </button>
              )
            })}
          </div>

          {error && (
            <p style={{ color: '#ef4444', fontSize: '0.875rem', margin: 0 }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={!ready}
            style={{
              background: ready ? '#C9A84C' : '#1e293b',
              color: ready ? '#050505' : '#475569',
              padding: '0.625rem',
              borderRadius: '4px',
              border: 'none',
              cursor: ready ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit',
              fontWeight: 600,
              fontSize: '0.875rem',
              transition: 'all 0.15s',
              marginTop: '0.25rem',
            }}
          >
            {loading ? 'Creating\u2026' : 'Create Organization \u2192'}
          </button>
        </form>
      </div>
    </main>
  )
}
