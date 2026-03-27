'use client'

import type { ScenarioDisplayRow } from '@/lib/scenarios/displayData'

const fmtCurrency = (v: number) => '$' + Math.round(v).toLocaleString('en-US')
const fmtRate = (v: number) => v.toFixed(3) + '%'

interface BuydownSectionProps {
  rows: ScenarioDisplayRow[]
}

export default function BuydownSection({ rows }: BuydownSectionProps) {
  // Only show when at least one scenario has a buydown
  const buydownRows = rows.filter(r => r.buydownPayments && r.buydownPayments.length > 0)
  if (buydownRows.length === 0) return null

  // Determine max years across all buydown scenarios (e.g. 2-1 = 2 years, 3-2-1 = 3 years)
  const maxYears = Math.max(...rows.map(r => r.buydownPayments?.length ?? 0))
  if (maxYears === 0) return null

  const yearLabels: string[] = []
  for (let y = 1; y <= maxYears; y++) yearLabels.push(`Year ${y}`)
  yearLabels.push('Year 3+')  // always add the "full rate" row

  const td: React.CSSProperties = {
    padding: '9px 16px',
    textAlign: 'right',
    fontSize: 11,
    fontFamily: "'IBM Plex Mono', monospace",
    borderBottom: '1px solid var(--sc-border)',
    color: 'var(--sc-text)',
  }

  const tdLabel: React.CSSProperties = {
    padding: '9px 16px',
    fontSize: 11,
    fontFamily: "'IBM Plex Mono', monospace",
    borderBottom: '1px solid var(--sc-border)',
    color: 'var(--sc-muted)',
    whiteSpace: 'nowrap',
  }

  const tdSection: React.CSSProperties = {
    padding: '7px 16px 4px 16px',
    fontSize: 9,
    fontWeight: 600,
    color: 'rgba(201,168,76,0.6)',
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
    borderBottom: '1px solid var(--sc-border)',
  }

  return (
    <div className="rounded-[14px] overflow-hidden" style={{ border: '1px solid var(--sc-border)' }}>
      {/* Header */}
      <div className="px-5 py-4" style={{ background: 'var(--sc-card)' }}>
        <h3 className="text-sm font-semibold" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
          Buydown Schedule
        </h3>
        <p className="text-xs mt-0.5" style={{ color: 'var(--sc-muted)', fontFamily: "'IBM Plex Mono', monospace" }}>
          Temporary rate reduction — payments increase after buydown period
        </p>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 400 }}>
          <thead>
            <tr style={{ background: '#0A1628' }}>
              <th style={{
                textAlign: 'left', padding: '10px 16px', fontSize: 10, fontWeight: 500,
                color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em',
                borderBottom: '2px solid rgba(255,255,255,0.15)',
              }}>
                Period
              </th>
              {rows.map((row, i) => (
                <th key={i} style={{
                  textAlign: 'right', padding: '10px 16px', fontSize: 11, fontWeight: 700,
                  color: '#ffffff', borderBottom: '2px solid rgba(255,255,255,0.15)',
                }}>
                  {row.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Year-by-year buydown payments */}
            <tr style={{ background: '#0A1628' }}>
              <td colSpan={rows.length + 1} style={tdSection}>
                Monthly P&amp;I by Year
              </td>
            </tr>

            {/* Buydown years */}
            {Array.from({ length: maxYears }, (_, yi) => (
              <tr key={yi} style={{ background: yi % 2 === 0 ? 'var(--sc-card)' : 'var(--sc-card-alt)' }}>
                <td style={{ ...tdLabel, paddingLeft: 24 }}>
                  Year {yi + 1}
                  {rows.some(r => r.buydownPayments?.[yi]) && (
                    <span className="ml-2 text-[10px]" style={{ color: 'rgba(201,168,76,0.7)' }}>
                      ({rows.find(r => r.buydownPayments?.[yi])?.buydownPayments?.[yi]?.rate != null
                        ? fmtRate(rows.find(r => r.buydownPayments?.[yi])!.buydownPayments![yi].rate)
                        : ''})
                    </span>
                  )}
                </td>
                {rows.map((row, ci) => {
                  const yp = row.buydownPayments?.[yi]
                  return (
                    <td key={ci} style={{
                      ...td,
                      color: yp ? '#C9A84C' : 'var(--sc-muted)',
                    }}>
                      {yp ? (
                        <>
                          <span style={{ fontSize: 11, fontWeight: 600 }}>{fmtCurrency(yp.monthlyPI)}</span>
                          <span style={{ fontSize: 9, color: 'rgba(201,168,76,0.6)', marginLeft: 4 }}>/mo</span>
                        </>
                      ) : (
                        <span style={{ color: 'var(--sc-muted)' }}>—</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}

            {/* Year 3+ — full rate */}
            <tr style={{ background: 'var(--sc-card-alt)' }}>
              <td style={{ ...tdLabel, paddingLeft: 24 }}>
                Year {maxYears + 1}+
                <span className="ml-2 text-[10px]" style={{ color: 'var(--sc-muted)' }}>
                  (full rate)
                </span>
              </td>
              {rows.map((row, ci) => (
                <td key={ci} style={td}>
                  <span style={{ fontSize: 11 }}>{fmtCurrency(row.monthlyPI)}</span>
                  <span style={{ fontSize: 9, color: 'var(--sc-muted)', marginLeft: 4 }}>/mo</span>
                </td>
              ))}
            </tr>

            {/* Buydown cost row */}
            <tr style={{ background: '#0A1628' }}>
              <td colSpan={rows.length + 1} style={tdSection}>
                Buydown Cost &amp; Break-Even
              </td>
            </tr>

            <tr style={{ background: 'var(--sc-card)' }}>
              <td style={{ ...tdLabel, paddingLeft: 24 }}>Buydown Cost</td>
              {rows.map((row, ci) => (
                <td key={ci} style={td}>
                  {row.buydownCost && row.buydownCost > 0
                    ? <span style={{ color: '#ef4444', fontWeight: 600 }}>{fmtCurrency(row.buydownCost)}</span>
                    : <span style={{ color: 'var(--sc-muted)' }}>—</span>
                  }
                </td>
              ))}
            </tr>

            <tr style={{ background: 'var(--sc-card-alt)' }}>
              <td style={{ ...tdLabel, paddingLeft: 24 }}>Break-Even Month</td>
              {rows.map((row, ci) => (
                <td key={ci} style={td}>
                  {row.buydownBreakEvenMonth
                    ? (
                      <span style={{ color: '#4CC98A', fontWeight: 600 }}>
                        Month {row.buydownBreakEvenMonth}
                      </span>
                    )
                    : <span style={{ color: 'var(--sc-muted)' }}>—</span>
                  }
                </td>
              ))}
            </tr>

            {/* Net savings note */}
            <tr style={{ background: 'var(--sc-card)' }}>
              <td style={{ ...tdLabel, paddingLeft: 24 }}>
                2-Yr Payment Savings
                <span className="ml-1 text-[10px]" style={{ color: 'var(--sc-muted)' }}>(vs. full rate)</span>
              </td>
              {rows.map((row, ci) => {
                if (!row.buydownPayments || row.buydownPayments.length === 0) {
                  return <td key={ci} style={td}><span style={{ color: 'var(--sc-muted)' }}>—</span></td>
                }
                const totalSavings = row.buydownPayments.reduce((sum, yp) => {
                  return sum + (row.monthlyPI - yp.monthlyPI) * 12
                }, 0)
                return (
                  <td key={ci} style={td}>
                    <span style={{ color: '#4CC98A', fontWeight: 600 }}>
                      {fmtCurrency(totalSavings)}
                    </span>
                  </td>
                )
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Compliance note */}
      <div className="px-5 py-3" style={{ background: 'var(--sc-card)', borderTop: '1px solid var(--sc-border)' }}>
        <p className="text-[10px] italic" style={{ color: 'var(--sc-muted)', fontFamily: "'IBM Plex Mono', monospace" }}>
          Buydown cost is typically paid by the seller, builder, or lender as a concession. After the buydown period, payments revert to the full rate. Approval and eligibility subject to underwriting.
        </p>
      </div>
    </div>
  )
}
