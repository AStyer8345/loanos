'use client'

import { useState, useEffect } from 'react'
import { buildPurchaseDisplayData, buildRefiDisplayData } from '@/lib/scenarios/displayData'
import type { DisplayData } from '@/lib/scenarios/displayData'
import {
  calculatePurchaseScenario,
  calculateCurrentLoan,
  calculateRefiScenario,
} from '@/lib/scenarios/calculations'
import type { PurchaseScenarioInput, RefiScenarioInput, CurrentLoanInput } from '@/lib/scenarios/types'
import ScenarioSummaryTable from '@/app/dashboard/scenarios/new/ScenarioSummaryTable'
import KeyMetricsGrid from '@/app/dashboard/scenarios/new/KeyMetricsGrid'
import BreakEvenTable from '@/app/dashboard/scenarios/new/BreakEvenTable'
import ScenarioCharts from '@/app/dashboard/scenarios/new/ScenarioCharts'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObj = Record<string, any>

interface SharedScenario {
  scenario_type: string
  borrower_name: string | null
  property_address: string | null
  property_value: number | null
  current_loan_data: AnyObj | null
  scenarios_data: AnyObj[]
  narrative: string | null
  created_at: string
}

// CSS variable values for the dark share-page theme
const DARK_THEME = {
  '--sc-bg': '#0a0a0a',
  '--sc-card': '#141414',
  '--sc-card-alt': '#111111',
  '--sc-border': '#262626',
  '--sc-text': '#F0EDE8',
  '--sc-muted': '#888888',
  '--sc-accent': '#C9A84C',
} as React.CSSProperties

function buildDisplayData(data: SharedScenario): DisplayData {
  const propertyValue = data.property_value || 0
  if (data.scenario_type === 'purchase') {
    const inputs = data.scenarios_data as unknown as PurchaseScenarioInput[]
    const results = inputs.map(input => calculatePurchaseScenario(input, propertyValue))
    return buildPurchaseDisplayData(inputs, results)
  } else {
    const currentLoan = data.current_loan_data as unknown as CurrentLoanInput
    const currentCalc = calculateCurrentLoan(currentLoan)
    const inputs = data.scenarios_data as unknown as RefiScenarioInput[]
    const results = inputs.map(input => calculateRefiScenario(input, currentLoan, currentCalc, propertyValue))
    return buildRefiDisplayData(currentLoan, inputs, results)
  }
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

  const displayData = buildDisplayData(data)
  const mode = data.scenario_type === 'purchase' ? 'purchase' : 'refinance'

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a', color: '#F0EDE8', fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-xl font-semibold" style={{ color: '#F0EDE8' }}>
              {data.borrower_name ? `${data.borrower_name} — ` : ''}{mode === 'purchase' ? 'Purchase' : 'Refinance'} Analysis
            </h1>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded" style={{ background: 'rgba(201,168,76,0.15)', color: '#C9A84C', border: '1px solid #C9A84C' }}>
              {mode.toUpperCase()}
            </span>
          </div>
          <div className="flex flex-wrap gap-4 text-xs" style={{ color: '#F0EDE870' }}>
            {data.borrower_name && <span>Borrower: <strong style={{ color: '#F0EDE8' }}>{data.borrower_name}</strong></span>}
            {data.property_address && <span>Property: <strong style={{ color: '#F0EDE8' }}>{data.property_address}</strong></span>}
            <span>Created: {new Date(data.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>
        <div style={{ height: 2, background: '#C9A84C', marginBottom: 28 }} />

        {/* All 6 output sections — themed with dark CSS variables */}
        <div style={DARK_THEME} className="space-y-6">

          {/* Section 1: Scenario Summary Table */}
          {displayData.rows.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#C9A84C' }}>
                Scenario Comparison
              </h2>
              <ScenarioSummaryTable data={displayData} />
            </section>
          )}

          {/* Section 2: Key Metrics */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#C9A84C' }}>
              Key Metrics
            </h2>
            <KeyMetricsGrid metrics={displayData.keyMetrics} mode={displayData.mode} rows={displayData.rows} />
          </section>

          {/* Section 3: Break-Even Analysis */}
          {displayData.breakEvenRows.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#C9A84C' }}>
                Break-Even Analysis
              </h2>
              <BreakEvenTable rows={displayData.breakEvenRows} mode={displayData.mode} />
            </section>
          )}

          {/* Sections 4–6: Charts */}
          {displayData.rows.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#C9A84C' }}>
                Charts
              </h2>
              <ScenarioCharts data={displayData} />
            </section>
          )}

          {/* Section 7: AI Analysis */}
          {data.narrative && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#C9A84C' }}>
                Analysis
              </h2>
              <div className="rounded-[14px] p-6 text-sm leading-relaxed" style={{ background: '#141414', border: '1px solid #262626', color: '#F0EDE8' }}>
                {data.narrative}
              </div>
            </section>
          )}

        </div>

        {/* Footer */}
        <div className="mt-10 pt-6" style={{ borderTop: '1px solid #262626' }}>
          <p className="text-[10px] leading-relaxed" style={{ color: '#F0EDE830' }}>
            This analysis is for informational purposes only and does not constitute a loan commitment or financial advice.
            Consult with your loan officer for personalized guidance. This analysis was generated with AI assistance and reviewed by a licensed loan officer.
            Equal Housing Lender.
          </p>
          <p className="text-[10px] mt-2 font-medium" style={{ color: '#C9A84C40' }}>
            Powered by LoanOS
          </p>
        </div>

      </div>
    </div>
  )
}
