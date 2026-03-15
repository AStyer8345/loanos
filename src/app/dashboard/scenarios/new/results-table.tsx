'use client'

import { ScenarioData, CalculatedResults, calculateResults } from './types'

interface ResultsTableProps {
  scenarios: ScenarioData[]
}

export function ResultsTable({ scenarios }: ResultsTableProps) {
  const results = scenarios.map((scenario) => ({
    scenario,
    results: calculateResults(scenario, scenarios[0]),
  }))

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  // Find the best (lowest) value for each metric
  const findBestIndex = (getValue: (r: CalculatedResults) => number, lowerIsBetter = true) => {
    const values = results.map((r) => getValue(r.results))
    const best = lowerIsBetter ? Math.min(...values) : Math.max(...values)
    return values.indexOf(best)
  }

  const metrics = [
    { label: 'Monthly P&I', getValue: (r: CalculatedResults) => r.monthlyPI, format: formatCurrency, lowerIsBetter: true },
    { label: 'Total Monthly Payment', getValue: (r: CalculatedResults) => r.totalMonthly, format: formatCurrency, lowerIsBetter: true, highlight: true },
    { label: 'LTV', getValue: (r: CalculatedResults) => r.ltv, format: formatPercent, lowerIsBetter: true },
    { label: 'Total Interest', getValue: (r: CalculatedResults) => r.totalInterest, format: formatCurrency, lowerIsBetter: true },
    { label: 'Total Cost', getValue: (r: CalculatedResults) => r.totalCost, format: formatCurrency, lowerIsBetter: true },
    { label: 'Cash to Close', getValue: (r: CalculatedResults) => r.cashToClose, format: formatCurrency, lowerIsBetter: true },
    { label: '5-Year Cost', getValue: (r: CalculatedResults) => r.fiveYearCost, format: formatCurrency, lowerIsBetter: true },
    { label: '10-Year Cost', getValue: (r: CalculatedResults) => r.tenYearCost, format: formatCurrency, lowerIsBetter: true },
    { 
      label: 'Monthly Savings vs A', 
      getValue: (r: CalculatedResults) => r.monthlySavingsVsA, 
      format: (v: number) => v === 0 ? '-' : `${v > 0 ? '+' : ''}${formatCurrency(v)}`,
      lowerIsBetter: false,
      skipWinner: true
    },
    { 
      label: 'Break-even Month', 
      getValue: (r: CalculatedResults) => r.breakEvenMonth ?? Infinity, 
      format: (v: number) => v === Infinity || v === 0 ? '-' : `Month ${v}`,
      lowerIsBetter: true,
      skipWinner: true
    },
  ]

  return (
    <div className="bg-[var(--surface-1)] border border-[var(--border)] rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="text-left py-3 px-4 text-[var(--muted)] font-medium">Metric</th>
              {results.map(({ scenario }) => (
                <th key={scenario.id} className="text-right py-3 px-4 text-[var(--foreground)] font-medium">
                  {scenario.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metrics.map((metric) => {
              const bestIndex = metric.skipWinner ? -1 : findBestIndex(metric.getValue, metric.lowerIsBetter)
              
              return (
                <tr key={metric.label} className={`border-b border-[var(--border)] last:border-b-0 ${metric.highlight ? 'bg-[var(--gold-dim)]' : ''}`}>
                  <td className={`py-3 px-4 ${metric.highlight ? 'text-[var(--gold)] font-medium' : 'text-[var(--muted)]'}`}>
                    {metric.label}
                  </td>
                  {results.map(({ results: r }, index) => (
                    <td key={index} className={`text-right py-3 px-4 font-mono ${metric.highlight ? 'text-[var(--gold)] font-semibold' : 'text-[var(--foreground)]'}`}>
                      <span className="inline-flex items-center gap-2">
                        {metric.format(metric.getValue(r))}
                        {bestIndex === index && (
                          <span className="w-2 h-2 rounded-full bg-[var(--gold)]" aria-label="Best value" />
                        )}
                      </span>
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
