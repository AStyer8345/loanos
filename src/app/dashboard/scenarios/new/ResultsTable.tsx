'use client'

import { useMemo } from 'react'
import { Check } from 'lucide-react'
import type {
  ScenarioMode, PurchaseScenarioInput, PurchaseCalculatedResult,
  RefiScenarioInput, RefiCalculatedResult,
} from '@/lib/scenarios/types'

const fmt = (v: number | undefined, prefix = '$') => {
  if (v === undefined || v === null) return '—'
  if (prefix === '$') return `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  if (prefix === '%') return `${v.toFixed(1)}%`
  return v.toLocaleString('en-US')
}

interface MetricRow {
  label: string
  getValue: (result: PurchaseCalculatedResult | RefiCalculatedResult, idx: number) => number | string | undefined
  format: 'currency' | 'percent' | 'number' | 'text'
  best?: 'lowest' | 'highest'
  condition?: (results: (PurchaseCalculatedResult | RefiCalculatedResult)[]) => boolean
}

export default function ResultsTable({ mode, purchaseScenarios, purchaseResults, refiScenarios, refiResults }: {
  mode: ScenarioMode
  purchaseScenarios: PurchaseScenarioInput[]
  purchaseResults: PurchaseCalculatedResult[]
  refiScenarios: RefiScenarioInput[]
  refiResults: RefiCalculatedResult[]
}) {
  if (mode === 'purchase') {
    return <PurchaseCards scenarios={purchaseScenarios} results={purchaseResults} />
  }
  return <RefinanceCards scenarios={refiScenarios} results={refiResults} />
}

// ─── Purchase Per-Scenario Cards ──────────────────────────────────

function PurchaseCards({ scenarios, results }: { scenarios: PurchaseScenarioInput[]; results: PurchaseCalculatedResult[] }) {
  const metrics: MetricRow[] = useMemo(() => [
    { label: 'Monthly P&I', format: 'currency', getValue: r => (r as PurchaseCalculatedResult).monthlyPI, best: 'lowest' },
    { label: 'LTV', format: 'percent', getValue: r => (r as PurchaseCalculatedResult).ltv, best: 'lowest' },
    { label: 'APR', format: 'percent', getValue: r => (r as PurchaseCalculatedResult).apr, best: 'lowest' },
    { label: 'Cash to Close', format: 'currency', getValue: r => (r as PurchaseCalculatedResult).cashToClose, best: 'lowest' },
    { label: 'Total Interest (Life)', format: 'currency', getValue: r => (r as PurchaseCalculatedResult).totalInterest, best: 'lowest' },
    { label: '5-Year Total Cost', format: 'currency', getValue: r => (r as PurchaseCalculatedResult).totalCost5Year, best: 'lowest' },
    { label: '10-Year Total Cost', format: 'currency', getValue: r => (r as PurchaseCalculatedResult).totalCost10Year, best: 'lowest' },
    { label: 'Equity at Year 1', format: 'currency', getValue: r => (r as PurchaseCalculatedResult).equityYear1, best: 'highest' },
    { label: 'Equity at Year 5', format: 'currency', getValue: r => (r as PurchaseCalculatedResult).equityYear5, best: 'highest' },
    { label: 'Equity at Year 10', format: 'currency', getValue: r => (r as PurchaseCalculatedResult).equityYear10, best: 'highest' },
  ], [])

  // Buydown rows
  const hasBuydown = results.some(r => r.buydownPayments && r.buydownPayments.length > 0)
  const buydownMetrics: MetricRow[] = hasBuydown ? [
    { label: 'Year 1 Payment', format: 'currency', getValue: r => (r as PurchaseCalculatedResult).buydownPayments?.[0]?.monthlyPI },
    { label: 'Year 2 Payment', format: 'currency', getValue: r => (r as PurchaseCalculatedResult).buydownPayments?.[1]?.monthlyPI },
    { label: 'Year 3 Payment', format: 'currency', getValue: r => (r as PurchaseCalculatedResult).buydownPayments?.[2]?.monthlyPI },
  ] : []

  // Extra payment rows
  const hasExtra = results.some(r => r.adjustedPayoffMonths !== undefined)
  const extraMetrics: MetricRow[] = hasExtra ? [
    { label: 'Years Saved', format: 'text', getValue: r => {
      const pr = r as PurchaseCalculatedResult
      return pr.yearsSaved !== undefined ? `${pr.yearsSaved}y ${pr.monthsSaved}m` : undefined
    }},
    { label: 'Interest Saved', format: 'currency', getValue: r => (r as PurchaseCalculatedResult).interestSaved },
  ] : []

  const allMetrics = [...metrics, ...buydownMetrics, ...extraMetrics]

  return (
    <ScenarioCards
      title="Purchase Comparison"
      heroLabel="Total Monthly Payment"
      heroGetValue={r => (r as PurchaseCalculatedResult).totalMonthlyPayment}
      heroBest="lowest"
      labels={scenarios.map(s => s.label || 'Option')}
      loanTypes={scenarios.map(s => s.loanType)}
      metrics={allMetrics}
      results={results}
    />
  )
}

// ─── Refinance Per-Scenario Cards ─────────────────────────────────

function RefinanceCards({ scenarios, results }: { scenarios: RefiScenarioInput[]; results: RefiCalculatedResult[] }) {
  const metrics: MetricRow[] = useMemo(() => [
    { label: 'Current Payment', format: 'currency', getValue: r => (r as RefiCalculatedResult).currentMonthlyPayment },
    { label: 'New Payment', format: 'currency', getValue: r => (r as RefiCalculatedResult).newTotalMonthlyPayment, best: 'lowest' },
    { label: 'Annual Savings', format: 'currency', getValue: r => (r as RefiCalculatedResult).annualSavings, best: 'highest' },
    { label: 'Break-Even Month', format: 'number', getValue: r => (r as RefiCalculatedResult).breakEvenMonth, best: 'lowest' },
    { label: '3-Year Savings', format: 'currency', getValue: r => (r as RefiCalculatedResult).totalSavings3Year, best: 'highest' },
    { label: '5-Year Savings', format: 'currency', getValue: r => (r as RefiCalculatedResult).totalSavings5Year, best: 'highest' },
    { label: '10-Year Savings', format: 'currency', getValue: r => (r as RefiCalculatedResult).totalSavings10Year, best: 'highest' },
    { label: 'Lifetime Interest Savings', format: 'currency', getValue: r => (r as RefiCalculatedResult).lifetimeInterestSavings, best: 'highest' },
    { label: 'Cash Out', format: 'currency', getValue: r => (r as RefiCalculatedResult).cashOutReceived,
      condition: rs => rs.some(r => (r as RefiCalculatedResult).cashOutReceived > 0) },
    { label: 'New LTV', format: 'percent', getValue: r => (r as RefiCalculatedResult).newLtv, best: 'lowest' },
    { label: 'Equity at Year 5', format: 'currency', getValue: r => (r as RefiCalculatedResult).equityYear5, best: 'highest' },
  ], [])

  return (
    <ScenarioCards
      title="Refinance Comparison"
      heroLabel="Monthly Savings"
      heroGetValue={r => (r as RefiCalculatedResult).monthlySavings}
      heroBest="highest"
      labels={scenarios.map(s => s.label || 'Option')}
      loanTypes={scenarios.map(s => s.loanType)}
      metrics={metrics}
      results={results}
    />
  )
}

// ─── Per-Scenario Card Layout ─────────────────────────────────────

function ScenarioCards({ title, heroLabel, heroGetValue, heroBest, labels, loanTypes, metrics, results }: {
  title: string
  heroLabel: string
  heroGetValue: (r: PurchaseCalculatedResult | RefiCalculatedResult) => number | undefined
  heroBest: 'lowest' | 'highest'
  labels: string[]
  loanTypes: string[]
  metrics: MetricRow[]
  results: (PurchaseCalculatedResult | RefiCalculatedResult)[]
}) {
  // Pre-compute best values for each metric
  const bestMap = useMemo(() => {
    const map: Record<string, number | undefined> = {}
    // Hero
    const heroVals = results.map(r => heroGetValue(r)).filter((v): v is number => typeof v === 'number')
    map['__hero'] = heroBest === 'lowest' ? Math.min(...heroVals) : Math.max(...heroVals)
    // All metrics
    metrics.forEach((m, mi) => {
      if (!m.best) return
      const vals = results.map((r, i) => m.getValue(r, i)).filter((v): v is number => typeof v === 'number')
      if (vals.length > 1) {
        map[mi] = m.best === 'lowest' ? Math.min(...vals) : Math.max(...vals)
      }
    })
    return map
  }, [results, metrics, heroGetValue, heroBest])

  return (
    <div>
      <h3 className="text-sm font-semibold mb-4" style={{ fontFamily: "'Inter', sans-serif" }}>{title}</h3>

      <div className="grid gap-5" style={{ gridTemplateColumns: `repeat(${Math.min(results.length, 4)}, 1fr)` }}>
        {results.map((r, idx) => {
          const heroVal = heroGetValue(r)
          const isHeroBest = heroVal !== undefined && heroVal === bestMap['__hero'] && results.length > 1

          return (
            <div
              key={idx}
              className="rounded-[14px] overflow-hidden"
              style={{
                background: 'var(--sc-card)',
                border: `1px solid ${isHeroBest ? 'var(--sc-accent)' : 'var(--sc-border)'}`,
              }}
            >
              {/* Card Header */}
              <div className="px-5 pt-5 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold" style={{ color: 'var(--sc-text)', fontFamily: "'Inter', sans-serif" }}>
                    {labels[idx]}
                  </span>
                  <span
                    className="text-[9px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-wider"
                    style={{ background: 'var(--sc-accent-dim)', border: '1px solid var(--sc-accent)', color: 'var(--sc-accent)' }}
                  >
                    {loanTypes[idx]}
                  </span>
                </div>
                {isHeroBest && (
                  <span
                    className="text-[9px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider flex items-center gap-1"
                    style={{ background: 'var(--sc-accent)', color: '#ffffff' }}
                  >
                    <Check size={10} /> Best
                  </span>
                )}
              </div>

              {/* Hero Metric */}
              <div className="px-5 pb-5">
                <div className="text-[10px] font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--sc-muted)' }}>
                  {heroLabel}
                </div>
                <div
                  className="text-3xl font-bold tracking-tight"
                  style={{ color: isHeroBest ? 'var(--sc-accent)' : 'var(--sc-text)', fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  {heroVal !== undefined ? fmt(heroVal) : '—'}
                </div>
              </div>

              {/* Metrics List */}
              <div className="border-t" style={{ borderColor: 'var(--sc-border)' }}>
                {metrics.map((m, mi) => {
                  if (m.condition && !m.condition(results)) return null

                  const val = m.getValue(r, idx)
                  if (val === undefined || val === null) return null

                  const isBest = bestMap[mi] !== undefined && val === bestMap[mi]
                  const isSavings = m.label.includes('Savings') || m.label.includes('Saved')

                  let display: string
                  if (m.format === 'currency') display = fmt(val as number)
                  else if (m.format === 'percent') display = fmt(val as number, '%')
                  else if (m.format === 'number') display = typeof val === 'number' ? val.toLocaleString() : String(val)
                  else display = String(val)

                  let valueColor = 'var(--sc-text)'
                  if (isBest) valueColor = 'var(--sc-accent)'
                  else if (isSavings && typeof val === 'number') {
                    valueColor = val > 0 ? 'var(--sc-green)' : val < 0 ? 'var(--sc-red)' : 'var(--sc-text)'
                  }

                  return (
                    <div
                      key={mi}
                      className="flex items-center justify-between px-5 py-2.5"
                      style={{
                        borderBottom: '1px solid var(--sc-border)',
                        background: mi % 2 === 0 ? 'transparent' : 'var(--sc-card-alt)',
                      }}
                    >
                      <span className="text-[11px] font-medium" style={{ color: 'var(--sc-muted)', fontFamily: "'Inter', sans-serif" }}>
                        {m.label}
                      </span>
                      <span
                        className="text-xs font-semibold flex items-center gap-1.5"
                        style={{ color: valueColor, fontFamily: "'IBM Plex Mono', monospace" }}
                      >
                        {isBest && <Check size={11} style={{ color: 'var(--sc-accent)' }} />}
                        {display}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
