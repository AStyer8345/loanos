'use client'

import { useState, useEffect } from 'react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObj = Record<string, any>

interface SharedScenario {
  scenario_type: string
  borrower_name: string | null
  property_address: string | null
  property_value: number | null
  current_loan_data: AnyObj | null
  scenarios_data: AnyObj[]
  results_data: AnyObj[] | null
  narrative: string | null
  reinvestment_data: AnyObj | null
  created_at: string
}

function fmtCurrency(v: number | undefined | null): string {
  if (v == null || isNaN(v)) return '—'
  return '$' + Math.round(v).toLocaleString('en-US')
}

function fmtPct(v: number | undefined | null, decimals = 3): string {
  if (v == null || isNaN(v)) return '—'
  return v.toFixed(decimals) + '%'
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

  const isPurchase = data.scenario_type === 'purchase'
  const scenarios = data.scenarios_data
  const results = data.results_data || []

  // Build comparison metrics
  const purchaseMetrics: { label: string; key: string; format: 'currency' | 'percent' | 'text' }[] = [
    { label: 'Loan Amount', key: 'loanAmount', format: 'currency' },
    { label: 'Interest Rate', key: 'interestRate', format: 'percent' },
    { label: 'Loan Term', key: 'loanTerm', format: 'text' },
    { label: 'Down Payment', key: 'downPaymentAmount', format: 'currency' },
    { label: 'Monthly P&I', key: 'monthlyPI', format: 'currency' },
    { label: 'Total Monthly Payment', key: 'totalMonthlyPayment', format: 'currency' },
    { label: 'APR', key: 'apr', format: 'percent' },
    { label: 'Cash to Close', key: 'cashToClose', format: 'currency' },
    { label: 'LTV', key: 'ltv', format: 'percent' },
    { label: 'Total Interest', key: 'totalInterest', format: 'currency' },
    { label: 'Total Cost (5yr)', key: 'totalCost5Year', format: 'currency' },
    { label: 'Total Cost (10yr)', key: 'totalCost10Year', format: 'currency' },
    { label: 'Equity Year 5', key: 'equityYear5', format: 'currency' },
    { label: 'Equity Year 10', key: 'equityYear10', format: 'currency' },
  ]

  const refiMetrics: { label: string; key: string; format: 'currency' | 'percent' | 'text' }[] = [
    { label: 'New Loan Amount', key: 'newLoanAmount', format: 'currency' },
    { label: 'Interest Rate', key: 'interestRate', format: 'percent' },
    { label: 'New Monthly P&I', key: 'newMonthlyPI', format: 'currency' },
    { label: 'New Total Payment', key: 'newTotalMonthlyPayment', format: 'currency' },
    { label: 'Monthly Savings', key: 'monthlySavings', format: 'currency' },
    { label: 'Annual Savings', key: 'annualSavings', format: 'currency' },
    { label: 'Break-Even', key: 'breakEvenMonth', format: 'text' },
    { label: 'APR', key: 'apr', format: 'percent' },
    { label: 'Savings (3yr)', key: 'totalSavings3Year', format: 'currency' },
    { label: 'Savings (5yr)', key: 'totalSavings5Year', format: 'currency' },
    { label: 'Savings (10yr)', key: 'totalSavings10Year', format: 'currency' },
    { label: 'Lifetime Interest Savings', key: 'lifetimeInterestSavings', format: 'currency' },
  ]

  const metrics = isPurchase ? purchaseMetrics : refiMetrics

  // For each metric, we need to find the value — it could be in the scenario input OR the result
  const getValue = (scenarioIdx: number, key: string): string => {
    const input = scenarios[scenarioIdx]
    const result = results[scenarioIdx]

    // Check result first (calculated values), then input
    const val = result?.[key] ?? input?.[key]
    if (val == null) return '—'

    // Determine format from metrics
    const metric = metrics.find(m => m.key === key)
    if (!metric) return String(val)

    if (metric.format === 'currency') return fmtCurrency(Number(val))
    if (metric.format === 'percent') return fmtPct(Number(val), key === 'ltv' || key === 'newLtv' ? 1 : 3)
    if (key === 'breakEvenMonth') return `${val} months`
    if (key === 'loanTerm') return `${val} years`
    return String(val)
  }

  // Find "best" values for highlighting
  const getBestIdx = (key: string, lower = true): number => {
    const vals = scenarios.map((_, i) => {
      const result = results[i]
      const input = scenarios[i]
      return Number(result?.[key] ?? input?.[key] ?? NaN)
    })
    if (vals.every(v => isNaN(v))) return -1
    const validVals = vals.filter(v => !isNaN(v))
    const best = lower ? Math.min(...validVals) : Math.max(...validVals)
    return vals.indexOf(best)
  }

  // Keys where higher is better
  const higherBetterKeys = new Set(['equityYear1', 'equityYear5', 'equityYear10', 'monthlySavings', 'annualSavings', 'totalSavings3Year', 'totalSavings5Year', 'totalSavings10Year', 'lifetimeInterestSavings'])

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a', color: '#F0EDE8', fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-xl font-semibold">
              {isPurchase ? 'Purchase' : 'Refinance'} Analysis
            </h1>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded" style={{ background: 'rgba(201,168,76,0.15)', color: '#C9A84C', border: '1px solid #C9A84C' }}>
              {isPurchase ? 'PURCHASE' : 'REFINANCE'}
            </span>
          </div>
          <div className="flex flex-wrap gap-4 mt-2 text-xs" style={{ color: '#F0EDE880' }}>
            {data.borrower_name && <span>Borrower: <strong style={{ color: '#F0EDE8' }}>{data.borrower_name}</strong></span>}
            {data.property_address && <span>Property: <strong style={{ color: '#F0EDE8' }}>{data.property_address}</strong></span>}
            {data.property_value && <span>Value: <strong style={{ color: '#F0EDE8' }}>{fmtCurrency(data.property_value)}</strong></span>}
            <span>Created: {new Date(data.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>

        {/* Comparison Table */}
        {scenarios.length > 0 && (
          <div className="rounded-lg overflow-hidden mb-8" style={{ border: '1px solid #262626' }}>
            <table className="w-full" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#141414' }}>
                  <th className="text-left text-[10px] font-medium uppercase tracking-wider px-4 py-3" style={{ color: '#F0EDE850', borderBottom: '2px solid #C9A84C' }}>
                    Metric
                  </th>
                  {scenarios.map((s, i) => (
                    <th key={i} className="text-right text-xs font-semibold px-4 py-3" style={{ color: '#C9A84C', borderBottom: '2px solid #C9A84C' }}>
                      {(s.label as string) || `Option ${i + 1}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metrics.map((metric, rowIdx) => {
                  const bestIdx = scenarios.length > 1 ? getBestIdx(metric.key, !higherBetterKeys.has(metric.key)) : -1
                  return (
                    <tr key={metric.key} style={{ background: rowIdx % 2 === 0 ? '#0a0a0a' : '#111111' }}>
                      <td className="px-4 py-2.5 text-xs font-medium" style={{ color: '#F0EDE880', borderBottom: '1px solid #1a1a1a' }}>
                        {metric.label}
                      </td>
                      {scenarios.map((_, colIdx) => {
                        const isBest = bestIdx === colIdx && scenarios.length > 1
                        return (
                          <td
                            key={colIdx}
                            className="px-4 py-2.5 text-right text-xs"
                            style={{
                              fontFamily: "'IBM Plex Mono', monospace",
                              color: isBest ? '#C9A84C' : '#F0EDE8',
                              fontWeight: isBest ? 600 : 400,
                              borderBottom: '1px solid #1a1a1a',
                            }}
                          >
                            {isBest && <span style={{ color: '#C9A84C', marginRight: 4 }}>✦</span>}
                            {getValue(colIdx, metric.key)}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Scenario Summary Cards (for quick visual) */}
        <div className="grid gap-3 mb-8" style={{ gridTemplateColumns: `repeat(${Math.min(scenarios.length, 4)}, 1fr)` }}>
          {scenarios.map((s, i) => {
            const result = results[i]
            const monthlyPmt = result?.totalMonthlyPayment ?? result?.newTotalMonthlyPayment
            return (
              <div key={i} className="rounded-lg p-4" style={{ background: '#141414', border: '1px solid #262626' }}>
                <h3 className="text-sm font-semibold mb-3" style={{ color: '#C9A84C' }}>
                  {(s.label as string) || `Option ${i + 1}`}
                </h3>
                <div className="space-y-2">
                  <div className="text-center">
                    <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#F0EDE850' }}>Monthly Payment</p>
                    <p className="text-lg font-semibold" style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#F0EDE8' }}>
                      {monthlyPmt ? fmtCurrency(monthlyPmt) : '—'}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider" style={{ color: '#F0EDE850' }}>Rate</p>
                      <p className="text-sm font-medium" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{s.interestRate ? fmtPct(s.interestRate as number) : '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider" style={{ color: '#F0EDE850' }}>Term</p>
                      <p className="text-sm font-medium">{s.loanTerm ? `${s.loanTerm} yr` : '—'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Reinvestment Data */}
        {data.reinvestment_data?.result && (
          <div className="rounded-lg p-6 mb-8" style={{ background: '#141414', border: '1px solid #262626' }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: '#C9A84C' }}>Reinvestment Analysis</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: '#F0EDE850' }}>Monthly Invested</p>
                <p className="text-base font-semibold" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{fmtCurrency(data.reinvestment_data.result.monthlySavings)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: '#F0EDE850' }}>Future Value ({data.reinvestment_data.horizonYears}yr)</p>
                <p className="text-base font-semibold" style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#4CC98A' }}>{fmtCurrency(data.reinvestment_data.result.futureValue)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: '#F0EDE850' }}>Growth</p>
                <p className="text-base font-semibold" style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#4CC98A' }}>{fmtCurrency(data.reinvestment_data.result.totalGrowth)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Narrative */}
        {data.narrative && (
          <div className="rounded-lg p-6 mb-8" style={{ background: '#141414', border: '1px solid #262626' }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: '#C9A84C' }}>Analysis</h3>
            <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#F0EDE8' }}>
              {data.narrative}
            </div>
          </div>
        )}

        {/* Disclaimer + Branding */}
        <div className="mt-8 pt-4" style={{ borderTop: '1px solid #262626' }}>
          <p className="text-[10px] leading-relaxed" style={{ color: '#F0EDE830' }}>
            This analysis is for informational purposes only and does not constitute a loan commitment or financial advice.
            Consult with your loan officer for personalized guidance.
            This analysis was generated with AI assistance and reviewed by a licensed loan officer.
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
