'use client'

import { useState, useEffect } from 'react'

interface SharedScenario {
  scenario_type: string
  borrower_name: string | null
  property_address: string | null
  property_value: number | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  scenarios_data: Record<string, any>[]
  narrative: string | null
  reinvestment_data: Record<string, unknown> | null
  created_at: string
}

export default function SharePage({ params }: { params: { token: string } }) {
  const [data, setData] = useState<SharedScenario | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/share/${params.token}`)
      .then(res => {
        if (res.status === 410) throw new Error('This share link has expired.')
        if (res.status === 404) throw new Error('Scenario not found.')
        if (!res.ok) throw new Error('Failed to load scenario.')
        return res.json()
      })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [params.token])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a', color: '#F0EDE880' }}>
        <p className="text-sm">Loading scenario...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a', color: '#C94C4C' }}>
        <p className="text-sm">{error}</p>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a', color: '#F0EDE8', fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-xl font-semibold">
            {data.scenario_type === 'purchase' ? 'Purchase' : 'Refinance'} Analysis
          </h1>
          <div className="flex gap-4 mt-2 text-xs" style={{ color: '#F0EDE880' }}>
            {data.borrower_name && <span>Borrower: <strong style={{ color: '#F0EDE8' }}>{data.borrower_name}</strong></span>}
            {data.property_address && <span>Property: <strong style={{ color: '#F0EDE8' }}>{data.property_address}</strong></span>}
            <span>Created: {new Date(data.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>

        {/* Scenarios Summary */}
        <div className="grid gap-3 mb-8" style={{ gridTemplateColumns: `repeat(${Math.min(data.scenarios_data.length, 4)}, 1fr)` }}>
          {data.scenarios_data.map((s, i) => (
            <div key={i} className="rounded-lg p-4" style={{ background: '#141414', border: '1px solid #262626' }}>
              <h3 className="text-sm font-semibold mb-2" style={{ color: '#C9A84C' }}>
                {(s.label as string) || `Option ${i + 1}`}
              </h3>
              <div className="space-y-1 text-xs" style={{ color: '#F0EDE880' }}>
                {s.loanAmount && <p>Loan: <span style={{ color: '#F0EDE8', fontFamily: "'IBM Plex Mono', monospace" }}>${Number(s.loanAmount).toLocaleString()}</span></p>}
                {s.interestRate && <p>Rate: <span style={{ color: '#F0EDE8', fontFamily: "'IBM Plex Mono', monospace" }}>{s.interestRate}%</span></p>}
                {s.loanTerm && <p>Term: <span style={{ color: '#F0EDE8' }}>{s.loanTerm} years</span></p>}
              </div>
            </div>
          ))}
        </div>

        {/* Narrative */}
        {data.narrative && (
          <div className="rounded-lg p-6 mb-8" style={{ background: '#141414', border: '1px solid #262626' }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: '#C9A84C' }}>Analysis</h3>
            <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#F0EDE8' }}>
              {data.narrative}
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-[10px] leading-relaxed" style={{ color: '#F0EDE840' }}>
          This analysis is for informational purposes only and does not constitute a loan commitment or financial advice.
          Consult with your loan officer for personalized guidance.
        </p>
      </div>
    </div>
  )
}
