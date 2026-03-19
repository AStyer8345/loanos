'use client'

import type { BreakEvenRow } from '@/lib/scenarios/displayData'

const fmtCurrency = (v: number) => '$' + Math.round(v).toLocaleString('en-US')

export default function BreakEvenTable({ rows, mode }: { rows: BreakEvenRow[]; mode: 'purchase' | 'refinance' }) {
  if (!rows.length) return null

  return (
    <div className="rounded-[14px] overflow-hidden" style={{ border: '1px solid var(--sc-border)' }}>
      <div className="px-5 py-4" style={{ background: 'var(--sc-card)' }}>
        <h3 className="text-sm font-semibold" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
          Break-Even Analysis
        </h3>
        <p className="text-[10px] mt-0.5" style={{ color: 'var(--sc-muted)' }}>
          {mode === 'purchase'
            ? 'Months until additional upfront cost is recouped through lower monthly payments'
            : 'Months until closing costs are recouped through monthly savings'}
        </p>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: 'var(--sc-card-alt)' }}>
            {['Scenario', 'Cost to Close', 'Monthly Savings', 'Break-Even (Months)', 'Break-Even (Years)'].map(h => (
              <th key={h} style={{
                textAlign: h === 'Scenario' ? 'left' : 'right',
                padding: '8px 16px', fontSize: 10, fontWeight: 600, color: 'var(--sc-muted)',
                textTransform: 'uppercase', letterSpacing: '0.05em',
                borderBottom: '1px solid var(--sc-border)', fontFamily: "'IBM Plex Mono', monospace",
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? 'var(--sc-card)' : 'var(--sc-card-alt)' }}>
              <td style={{
                padding: '9px 16px', fontSize: 11, fontWeight: 600, color: 'var(--sc-text)',
                borderBottom: '1px solid var(--sc-border)', fontFamily: "'IBM Plex Mono', monospace",
              }}>
                {row.label}
              </td>
              <td style={{
                padding: '9px 16px', textAlign: 'right', fontSize: 11, color: 'var(--sc-muted)',
                borderBottom: '1px solid var(--sc-border)', fontFamily: "'IBM Plex Mono', monospace",
              }}>
                {fmtCurrency(row.additionalCostToClose)}
              </td>
              <td style={{
                padding: '9px 16px', textAlign: 'right', fontSize: 11, color: '#4CC98A',
                borderBottom: '1px solid var(--sc-border)', fontFamily: "'IBM Plex Mono', monospace",
              }}>
                {fmtCurrency(row.monthlySavings)}/mo
              </td>
              <td style={{
                padding: '9px 16px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: '#C9A84C',
                borderBottom: '1px solid var(--sc-border)', fontFamily: "'IBM Plex Mono', monospace",
              }}>
                {row.breakEvenMonths}
              </td>
              <td style={{
                padding: '9px 16px', textAlign: 'right', fontSize: 11, color: 'var(--sc-text)',
                borderBottom: '1px solid var(--sc-border)', fontFamily: "'IBM Plex Mono', monospace",
              }}>
                {row.breakEvenYears.toFixed(1)} yrs
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
