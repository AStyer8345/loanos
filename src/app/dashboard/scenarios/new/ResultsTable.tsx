'use client'

import { useMemo } from 'react'
import { Check, Info } from 'lucide-react'
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

interface RowConfig {
  label: string
  key: string
  format: 'currency' | 'percent' | 'number' | 'text'
  getValue: (result: PurchaseCalculatedResult | RefiCalculatedResult, idx: number) => number | string | undefined
  best?: 'lowest' | 'highest'
  highlight?: boolean
  tooltip?: string
  condition?: (results: (PurchaseCalculatedResult | RefiCalculatedResult)[]) => boolean
}

function Tooltip({ text }: { text: string }) {
  return (
    <span className="relative group/tip inline-flex ml-1">
      <Info size={11} style={{ color: 'var(--sc-muted)' }} />
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-[10px] rounded whitespace-nowrap opacity-0 group-hover/tip:opacity-100 pointer-events-none transition-opacity z-10"
        style={{ background: 'var(--sc-card)', border: '1px solid var(--sc-border)', color: 'var(--sc-text)' }}>
        {text}
      </span>
    </span>
  )
}

export default function ResultsTable({ mode, purchaseScenarios, purchaseResults, refiScenarios, refiResults }: {
  mode: ScenarioMode
  purchaseScenarios: PurchaseScenarioInput[]
  purchaseResults: PurchaseCalculatedResult[]
  refiScenarios: RefiScenarioInput[]
  refiResults: RefiCalculatedResult[]
}) {
  if (mode === 'purchase') {
    return <PurchaseTable scenarios={purchaseScenarios} results={purchaseResults} />
  }
  return <RefinanceTable scenarios={refiScenarios} results={refiResults} />
}

function PurchaseTable({ scenarios, results }: { scenarios: PurchaseScenarioInput[]; results: PurchaseCalculatedResult[] }) {
  const rows: RowConfig[] = useMemo(() => [
    { label: 'Monthly P&I', key: 'pi', format: 'currency', getValue: r => (r as PurchaseCalculatedResult).monthlyPI, best: 'lowest' },
    { label: 'Total Monthly Payment', key: 'total', format: 'currency', getValue: r => (r as PurchaseCalculatedResult).totalMonthlyPayment, best: 'lowest', highlight: true },
    { label: 'Monthly Savings vs Option A', key: 'savings', format: 'currency',
      getValue: (r, idx) => idx === 0 ? undefined : (results[0]?.totalMonthlyPayment ?? 0) - (r as PurchaseCalculatedResult).totalMonthlyPayment },
    { label: 'LTV', key: 'ltv', format: 'percent', getValue: r => (r as PurchaseCalculatedResult).ltv, best: 'lowest' },
    { label: 'APR', key: 'apr', format: 'percent', getValue: r => (r as PurchaseCalculatedResult).apr, best: 'lowest' },
    { label: 'Cash to Close', key: 'ctc', format: 'currency', getValue: r => (r as PurchaseCalculatedResult).cashToClose, best: 'lowest' },
    { label: 'Total Interest (Life of Loan)', key: 'interest', format: 'currency', getValue: r => (r as PurchaseCalculatedResult).totalInterest, best: 'lowest' },
    { label: '5-Year Total Cost', key: 'cost5', format: 'currency', getValue: r => (r as PurchaseCalculatedResult).totalCost5Year, best: 'lowest', highlight: true,
      tooltip: 'Primary comparison metric — avg borrower keeps loan ~5 years' },
    { label: '10-Year Total Cost', key: 'cost10', format: 'currency', getValue: r => (r as PurchaseCalculatedResult).totalCost10Year, best: 'lowest' },
    { label: 'Lifetime Total Cost', key: 'costLife', format: 'currency', getValue: r => (r as PurchaseCalculatedResult).totalCostLifetime, best: 'lowest' },
    { label: 'Equity at Year 1', key: 'eq1', format: 'currency', getValue: r => (r as PurchaseCalculatedResult).equityYear1, best: 'highest' },
    { label: 'Equity at Year 5', key: 'eq5', format: 'currency', getValue: r => (r as PurchaseCalculatedResult).equityYear5, best: 'highest' },
    { label: 'Equity at Year 10', key: 'eq10', format: 'currency', getValue: r => (r as PurchaseCalculatedResult).equityYear10, best: 'highest' },
  ], [results])

  // Buydown rows
  const hasBuydown = results.some(r => r.buydownPayments && r.buydownPayments.length > 0)
  const buydownRows: RowConfig[] = hasBuydown ? [
    { label: 'Year 1 Payment', key: 'bd1', format: 'currency', getValue: r => (r as PurchaseCalculatedResult).buydownPayments?.[0]?.monthlyPI },
    { label: 'Year 2 Payment', key: 'bd2', format: 'currency', getValue: r => (r as PurchaseCalculatedResult).buydownPayments?.[1]?.monthlyPI },
    { label: 'Year 3 Payment', key: 'bd3', format: 'currency', getValue: r => (r as PurchaseCalculatedResult).buydownPayments?.[2]?.monthlyPI },
    { label: 'Permanent Payment', key: 'bdp', format: 'currency', getValue: r => (r as PurchaseCalculatedResult).monthlyPI },
  ] : []

  // Extra payment rows
  const hasExtra = results.some(r => r.adjustedPayoffMonths !== undefined)
  const extraRows: RowConfig[] = hasExtra ? [
    { label: 'Years Saved', key: 'ys', format: 'text', getValue: r => {
      const pr = r as PurchaseCalculatedResult
      return pr.yearsSaved !== undefined ? `${pr.yearsSaved} years, ${pr.monthsSaved} months` : undefined
    }},
    { label: 'Interest Saved', key: 'is', format: 'currency', getValue: r => (r as PurchaseCalculatedResult).interestSaved },
  ] : []

  const allRows = [...rows, ...buydownRows, ...extraRows]

  return (
    <ComparisonTable
      title="Purchase Comparison"
      columnLabels={scenarios.map(s => s.label || 'Option')}
      rows={allRows}
      results={results}
    />
  )
}

function RefinanceTable({ scenarios, results }: {
  scenarios: RefiScenarioInput[]; results: RefiCalculatedResult[]
}) {
  const rows: RowConfig[] = useMemo(() => [
    { label: 'Current Monthly Payment', key: 'curPmt', format: 'currency', getValue: r => (r as RefiCalculatedResult).currentMonthlyPayment },
    { label: 'New Monthly Payment', key: 'newPmt', format: 'currency', getValue: r => (r as RefiCalculatedResult).newTotalMonthlyPayment, best: 'lowest' },
    { label: 'Monthly Savings', key: 'mSave', format: 'currency', getValue: r => (r as RefiCalculatedResult).monthlySavings, best: 'highest', highlight: true },
    { label: 'Annual Savings', key: 'aSave', format: 'currency', getValue: r => (r as RefiCalculatedResult).annualSavings, best: 'highest' },
    { label: 'Net Monthly Cash Flow Improvement', key: 'netCF', format: 'currency', getValue: r => (r as RefiCalculatedResult).netMonthlyCashFlowImprovement, best: 'highest',
      tooltip: 'Includes eliminated debt payments for cash-out consolidation' },
    { label: 'Break-Even Month', key: 'be', format: 'number', getValue: r => (r as RefiCalculatedResult).breakEvenMonth, best: 'lowest', highlight: true,
      tooltip: 'Month when cumulative savings exceed closing costs' },
    { label: '3-Year Total Savings', key: 's3', format: 'currency', getValue: r => (r as RefiCalculatedResult).totalSavings3Year, best: 'highest' },
    { label: '5-Year Total Savings', key: 's5', format: 'currency', getValue: r => (r as RefiCalculatedResult).totalSavings5Year, best: 'highest', highlight: true },
    { label: '10-Year Total Savings', key: 's10', format: 'currency', getValue: r => (r as RefiCalculatedResult).totalSavings10Year, best: 'highest' },
    { label: 'Remaining Interest (Current)', key: 'riCur', format: 'currency', getValue: r => (r as RefiCalculatedResult).remainingInterestCurrent },
    { label: 'Total Interest (New)', key: 'tiNew', format: 'currency', getValue: r => (r as RefiCalculatedResult).totalInterestNew, best: 'lowest' },
    { label: 'Lifetime Interest Savings', key: 'liSave', format: 'currency', getValue: r => (r as RefiCalculatedResult).lifetimeInterestSavings, best: 'highest' },
    { label: 'Cash Out Received', key: 'co', format: 'currency', getValue: r => (r as RefiCalculatedResult).cashOutReceived,
      condition: (rs) => rs.some(r => (r as RefiCalculatedResult).cashOutReceived > 0) },
    { label: 'New LTV', key: 'ltv', format: 'percent', getValue: r => (r as RefiCalculatedResult).newLtv, best: 'lowest' },
    { label: 'Equity at Year 1', key: 'eq1', format: 'currency', getValue: r => (r as RefiCalculatedResult).equityYear1, best: 'highest' },
    { label: 'Equity at Year 5', key: 'eq5', format: 'currency', getValue: r => (r as RefiCalculatedResult).equityYear5, best: 'highest' },
    { label: 'Equity at Year 10', key: 'eq10', format: 'currency', getValue: r => (r as RefiCalculatedResult).equityYear10, best: 'highest' },
  ], [])

  return (
    <ComparisonTable
      title="Refinance Comparison"
      columnLabels={scenarios.map(s => s.label || 'Option')}
      rows={rows}
      results={results}
    />
  )
}

function ComparisonTable({ title, columnLabels, rows, results }: {
  title: string
  columnLabels: string[]
  rows: RowConfig[]
  results: (PurchaseCalculatedResult | RefiCalculatedResult)[]
}) {
  return (
    <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--sc-border)' }}>
      <div className="px-4 py-3" style={{ background: 'var(--sc-card)' }}>
        <h3 className="text-sm font-semibold" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>{title}</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--sc-card)' }}>
              <th className="text-left px-4 py-2 font-medium text-xs" style={{ color: 'var(--sc-muted)', fontFamily: "'IBM Plex Sans', sans-serif" }}>Metric</th>
              {columnLabels.map((label, i) => (
                <th key={i} className="text-right px-4 py-2 font-medium text-xs" style={{ color: 'var(--sc-gold)', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => {
              // Check condition
              if (row.condition && !row.condition(results)) return null

              // Get values for all columns
              const values = results.map((r, i) => row.getValue(r, i))

              // Determine "best" value
              const numericValues = values.map(v => typeof v === 'number' ? v : NaN).filter(v => !isNaN(v))
              let bestValue: number | undefined
              if (row.best === 'lowest' && numericValues.length > 0) bestValue = Math.min(...numericValues)
              if (row.best === 'highest' && numericValues.length > 0) bestValue = Math.max(...numericValues)

              const isAlt = rowIdx % 2 === 1

              return (
                <tr key={row.key} style={{ background: row.highlight ? 'var(--sc-gold-dim)' : isAlt ? 'var(--sc-card-alt)' : 'var(--sc-card)' }}>
                  <td className="px-4 py-2.5 text-xs font-medium whitespace-nowrap" style={{ color: 'var(--sc-text)', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                    {row.label}
                    {row.tooltip && <Tooltip text={row.tooltip} />}
                  </td>
                  {values.map((val, i) => {
                    const isBest = bestValue !== undefined && val === bestValue && numericValues.length > 1
                    const isSavings = row.key === 'savings' || row.key === 'mSave' || row.key === 'aSave' || row.key === 'netCF' || row.key.startsWith('s') || row.key === 'liSave'
                    let color = 'var(--sc-text)'
                    if (isSavings && typeof val === 'number') {
                      color = val > 0 ? 'var(--sc-green)' : val < 0 ? 'var(--sc-red)' : 'var(--sc-text)'
                    }

                    let display: string
                    if (val === undefined || val === null) {
                      display = '—'
                    } else if (row.format === 'currency') {
                      display = fmt(val as number)
                    } else if (row.format === 'percent') {
                      display = fmt(val as number, '%')
                    } else if (row.format === 'number') {
                      display = typeof val === 'number' ? val.toLocaleString() : String(val)
                    } else {
                      display = String(val)
                    }

                    return (
                      <td key={i} className="px-4 py-2.5 text-right whitespace-nowrap" style={{ fontFamily: "'IBM Plex Mono', monospace", color, fontSize: '12px' }}>
                        <span className="inline-flex items-center gap-1.5">
                          {isBest && <Check size={12} style={{ color: 'var(--sc-gold)' }} />}
                          {display}
                        </span>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
