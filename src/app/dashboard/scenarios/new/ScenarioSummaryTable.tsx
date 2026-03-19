'use client'

import type { DisplayData } from '@/lib/scenarios/displayData'

const fmtCurrency = (v: number | undefined) =>
  v == null ? '—' : '$' + Math.round(v).toLocaleString('en-US')
const fmtRate = (v: number | undefined) =>
  v == null ? '—' : v.toFixed(3) + '%'

export default function ScenarioSummaryTable({ data }: { data: DisplayData }) {
  if (!data.rows.length) return null

  const metricRows: { label: string; getValue: (r: typeof data.rows[0]) => string }[] = [
    ...(data.mode === 'purchase' ? [{ label: 'Purchase Price', getValue: (r: typeof data.rows[0]) => fmtCurrency(r.purchasePrice) }] : []),
    { label: 'Loan Amount', getValue: r => fmtCurrency(r.loanAmount) },
    { label: 'Interest Rate', getValue: r => fmtRate(r.interestRate) },
    { label: 'APR', getValue: r => fmtRate(r.apr) },
    { label: 'Monthly P&I', getValue: r => fmtCurrency(r.monthlyPI) },
    { label: 'Total Monthly Payment', getValue: r => fmtCurrency(r.totalMonthlyPayment) },
    { label: 'Cash to Close', getValue: r => fmtCurrency(r.cashToClose) },
    {
      label: data.mode === 'purchase' ? 'Monthly Savings vs. Baseline' : 'Monthly Savings vs. Current',
      getValue: r => r.monthlySavingsVsCurrent != null && r.monthlySavingsVsCurrent !== 0
        ? fmtCurrency(r.monthlySavingsVsCurrent) + '/mo'
        : '—',
    },
    { label: 'Total Interest (Life)', getValue: r => fmtCurrency(r.totalInterest) },
  ]

  return (
    <div className="rounded-[14px] overflow-hidden" style={{ border: '1px solid var(--sc-border)' }}>
      <div className="px-5 py-4" style={{ background: 'var(--sc-card)' }}>
        <h3 className="text-sm font-semibold" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
          Scenario Comparison
        </h3>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
          <thead>
            <tr style={{ background: '#0A1628' }}>
              <th style={{
                textAlign: 'left', padding: '10px 16px', fontSize: 10, fontWeight: 500,
                color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em',
                borderBottom: '2px solid #C9A84C',
              }}>
                Metric
              </th>
              {data.rows.map((row, i) => (
                <th key={i} style={{
                  textAlign: 'right',
                  padding: '10px 16px',
                  fontSize: 11,
                  fontWeight: 700,
                  color: row.isRecommended ? '#C9A84C' : '#ffffff',
                  borderBottom: `2px solid ${row.isRecommended ? '#C9A84C' : 'rgba(255,255,255,0.2)'}`,
                  background: row.isRecommended ? 'rgba(201,168,76,0.08)' : 'transparent',
                }}>
                  {row.label}
                  {row.isRecommended && (
                    <span style={{
                      display: 'block', fontSize: 8, fontWeight: 600,
                      color: '#C9A84C', letterSpacing: '0.08em', textTransform: 'uppercase',
                    }}>
                      ★ Recommended
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metricRows.map((rowDef, ri) => (
              <tr key={ri} style={{ background: ri % 2 === 0 ? 'var(--sc-card)' : 'var(--sc-card-alt)' }}>
                <td style={{
                  padding: '9px 16px', fontSize: 11, fontWeight: 500, color: 'var(--sc-muted)',
                  borderBottom: '1px solid var(--sc-border)', fontFamily: "'IBM Plex Mono', monospace",
                }}>
                  {rowDef.label}
                </td>
                {data.rows.map((row, ci) => (
                  <td key={ci} style={{
                    padding: '9px 16px',
                    textAlign: 'right',
                    fontSize: 11,
                    fontWeight: row.isRecommended ? 600 : 400,
                    color: row.isRecommended ? '#C9A84C' : 'var(--sc-text)',
                    borderBottom: '1px solid var(--sc-border)',
                    fontFamily: "'IBM Plex Mono', monospace",
                    background: row.isRecommended ? 'rgba(201,168,76,0.04)' : 'transparent',
                  }}>
                    {rowDef.getValue(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
