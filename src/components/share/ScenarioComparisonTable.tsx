import type { DisplayData } from '@/lib/scenarios/displayData'
import { GOLD, TEXT, MUTED, CARD_BG, BORDER, fmtCurrency, fmtRate } from './constants'

interface Props {
  displayData: DisplayData
}

const thStyle: React.CSSProperties = {
  padding: '9px 16px',
  fontSize: 10,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  borderBottom: `1px solid ${BORDER}`,
  whiteSpace: 'nowrap',
}

const tdLabel: React.CSSProperties = {
  padding: '8px 16px',
  fontSize: 11,
  borderBottom: `1px solid rgba(255,255,255,0.04)`,
  color: MUTED,
  whiteSpace: 'nowrap',
}

const tdValue: React.CSSProperties = {
  padding: '8px 16px',
  fontSize: 12,
  textAlign: 'right',
  fontFamily: "'IBM Plex Mono', monospace",
  borderBottom: `1px solid rgba(255,255,255,0.04)`,
  whiteSpace: 'nowrap',
  color: TEXT,
}

export default function ScenarioComparisonTable({ displayData }: Props) {
  const { rows, mode } = displayData

  // Only render for multi-scenario comparisons
  if (rows.length < 2) return null

  // Mirror OptionCardsGrid: find the lowest-payment scenario index
  const commonlyChosenIndex = rows.reduce((best, row, i) => {
    const bestPmt = rows[best].totalMonthlyPayment
    const rowPmt = row.totalMonthlyPayment
    return rowPmt > 0 && (bestPmt === 0 || rowPmt < bestPmt) ? i : best
  }, 0)

  const chosenBg = `${GOLD}09`
  const boldRowBg = 'rgba(255,255,255,0.025)'
  const chosenBoldBg = `${GOLD}12`

  const hasPropertyTax = rows.some(r => r.propertyTaxes > 0)
  const hasInsurance = rows.some(r => r.homeownersInsurance > 0)
  const hasHOA = rows.some(r => r.hoa > 0)
  const hasPMI = rows.some(r => r.pmi > 0)
  const hasSavings = rows.some(r => (r.monthlySavingsVsCurrent ?? 0) > 0)

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
    >
      {/* Section header */}
      <div className="px-5 pt-5 pb-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div className="flex items-center gap-3 mb-0.5">
          <div style={{ width: 16, height: 1, background: GOLD }} />
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.15em]"
            style={{ color: GOLD }}
          >
            Side-by-Side Comparison
          </p>
        </div>
        <p className="text-xs ml-7" style={{ color: MUTED }}>All numbers in one view</p>
      </div>

      {/* Scrollable table */}
      <div className="overflow-x-auto">
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            minWidth: `${rows.length * 150 + 160}px`,
          }}
        >
          <thead>
            <tr>
              <th style={{ ...thStyle, textAlign: 'left', color: MUTED }}>Metric</th>
              {rows.map((row, i) => {
                const isChosen = i === commonlyChosenIndex
                return (
                  <th
                    key={i}
                    style={{
                      ...thStyle,
                      textAlign: 'right',
                      color: isChosen ? GOLD : MUTED,
                      background: isChosen ? chosenBg : 'transparent',
                    }}
                  >
                    <span className="inline-flex items-center justify-end gap-2">
                      {row.label}
                      {isChosen && (
                        <span
                          style={{
                            fontSize: 8,
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: 10,
                            background: `${GOLD}18`,
                            color: GOLD,
                            border: `1px solid ${GOLD}40`,
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                            lineHeight: '14px',
                          }}
                        >
                          ★
                        </span>
                      )}
                    </span>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {mode === 'purchase' && (
              <tr>
                <td style={tdLabel}>Purchase Price</td>
                {rows.map((r, i) => (
                  <td key={i} style={{ ...tdValue, background: i === commonlyChosenIndex ? chosenBg : 'transparent' }}>
                    {r.purchasePrice ? fmtCurrency(r.purchasePrice) : '—'}
                  </td>
                ))}
              </tr>
            )}
            <tr>
              <td style={tdLabel}>Loan Amount</td>
              {rows.map((r, i) => (
                <td key={i} style={{ ...tdValue, background: i === commonlyChosenIndex ? chosenBg : 'transparent' }}>
                  {fmtCurrency(r.loanAmount)}
                </td>
              ))}
            </tr>
            <tr>
              <td style={tdLabel}>Interest Rate</td>
              {rows.map((r, i) => (
                <td key={i} style={{ ...tdValue, background: i === commonlyChosenIndex ? chosenBg : 'transparent' }}>
                  {fmtRate(r.interestRate)}
                </td>
              ))}
            </tr>
            <tr>
              <td style={tdLabel}>APR</td>
              {rows.map((r, i) => (
                <td key={i} style={{ ...tdValue, background: i === commonlyChosenIndex ? chosenBg : 'transparent' }}>
                  {fmtRate(r.apr)}
                </td>
              ))}
            </tr>
            {/* Monthly Payment — bold, highlighted row */}
            <tr>
              <td style={{ ...tdLabel, fontWeight: 600, color: TEXT, background: boldRowBg }}>
                Monthly Payment
              </td>
              {rows.map((r, i) => {
                const isChosen = i === commonlyChosenIndex
                return (
                  <td
                    key={i}
                    style={{
                      ...tdValue,
                      fontWeight: 700,
                      fontSize: 13,
                      background: isChosen ? chosenBoldBg : boldRowBg,
                      color: isChosen ? GOLD : TEXT,
                    }}
                  >
                    {fmtCurrency(r.totalMonthlyPayment)}
                  </td>
                )
              })}
            </tr>
            <tr>
              <td style={{ ...tdLabel, paddingLeft: 28 }}>P&amp;I</td>
              {rows.map((r, i) => (
                <td key={i} style={{ ...tdValue, background: i === commonlyChosenIndex ? chosenBg : 'transparent' }}>
                  {fmtCurrency(r.monthlyPI)}
                </td>
              ))}
            </tr>
            {hasPropertyTax && (
              <tr>
                <td style={{ ...tdLabel, paddingLeft: 28 }}>Property Tax</td>
                {rows.map((r, i) => (
                  <td key={i} style={{ ...tdValue, background: i === commonlyChosenIndex ? chosenBg : 'transparent' }}>
                    {r.propertyTaxes > 0 ? fmtCurrency(r.propertyTaxes) : '—'}
                  </td>
                ))}
              </tr>
            )}
            {hasInsurance && (
              <tr>
                <td style={{ ...tdLabel, paddingLeft: 28 }}>Insurance</td>
                {rows.map((r, i) => (
                  <td key={i} style={{ ...tdValue, background: i === commonlyChosenIndex ? chosenBg : 'transparent' }}>
                    {r.homeownersInsurance > 0 ? fmtCurrency(r.homeownersInsurance) : '—'}
                  </td>
                ))}
              </tr>
            )}
            {hasHOA && (
              <tr>
                <td style={{ ...tdLabel, paddingLeft: 28 }}>HOA</td>
                {rows.map((r, i) => (
                  <td key={i} style={{ ...tdValue, background: i === commonlyChosenIndex ? chosenBg : 'transparent' }}>
                    {r.hoa > 0 ? fmtCurrency(r.hoa) : '—'}
                  </td>
                ))}
              </tr>
            )}
            {hasPMI && (
              <tr>
                <td style={{ ...tdLabel, paddingLeft: 28 }}>PMI</td>
                {rows.map((r, i) => (
                  <td key={i} style={{ ...tdValue, background: i === commonlyChosenIndex ? chosenBg : 'transparent' }}>
                    {r.pmi > 0 ? fmtCurrency(r.pmi) : '—'}
                  </td>
                ))}
              </tr>
            )}
            {/* Cash to Close — bold, highlighted row */}
            <tr>
              <td style={{ ...tdLabel, fontWeight: 600, color: TEXT, background: boldRowBg }}>
                {mode === 'purchase' ? 'Cash to Close' : 'Closing Costs'}
              </td>
              {rows.map((r, i) => (
                <td
                  key={i}
                  style={{
                    ...tdValue,
                    fontWeight: 700,
                    background: i === commonlyChosenIndex ? chosenBoldBg : boldRowBg,
                  }}
                >
                  {fmtCurrency(r.cashToClose)}
                </td>
              ))}
            </tr>
            <tr>
              <td style={tdLabel}>Total Interest</td>
              {rows.map((r, i) => (
                <td key={i} style={{ ...tdValue, background: i === commonlyChosenIndex ? chosenBg : 'transparent' }}>
                  {fmtCurrency(r.totalInterest)}
                </td>
              ))}
            </tr>
            {hasSavings && (
              <tr>
                <td style={{ ...tdLabel, color: GOLD }}>Monthly Savings</td>
                {rows.map((r, i) => {
                  const savings = r.monthlySavingsVsCurrent ?? 0
                  return (
                    <td
                      key={i}
                      style={{
                        ...tdValue,
                        color: savings > 0 ? GOLD : MUTED,
                        background: i === commonlyChosenIndex ? chosenBg : 'transparent',
                      }}
                    >
                      {savings > 0 ? `+${fmtCurrency(savings)}/mo` : '—'}
                    </td>
                  )
                })}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
