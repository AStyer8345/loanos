'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { DisplayData, ScenarioDisplayRow } from '@/lib/scenarios/displayData'

const fmtCurrency = (v: number | undefined) =>
  v == null ? '—' : '$' + Math.round(v).toLocaleString('en-US')
const fmtRate = (v: number | undefined) =>
  v == null ? '—' : v.toFixed(3) + '%'

// ─── Cash-to-close worksheet ────────────────────────────────────────

function computeCtcWorksheet(row: ScenarioDisplayRow) {
  const cc = row.closingCostBreakdown
  const loanAmount = row.loanAmount
  const interestRate = row.interestRate
  const pointsDollar = Math.round(loanAmount * (row.pointsPercent / 100))
  const creditsDollar = Math.round(loanAmount * (row.creditsPercent / 100))

  const lenderFees: [string, number][] = cc ? (([
    ['Origination Fee', cc.originationFee],
    ['Underwriting Fee', cc.underwritingFee],
    ['Processing Fee', cc.processingFee],
    cc.applicationFee > 0 ? ['Application Fee', cc.applicationFee] : null,
    cc.adminFee > 0 ? ['Admin Fee', cc.adminFee] : null,
  ].filter(Boolean)) as [string, number][]).filter(([, v]) => v > 0) : []

  const thirdPartyFees: [string, number][] = cc ? (([
    ['Appraisal', cc.appraisal],
    ['Credit Report', cc.creditReport],
    ['Doc Preparation', cc.docPrepFee],
    ['Flood Certification', cc.floodCert],
    cc.attorneyFee > 0 ? ['TX Attorney Fee', cc.attorneyFee] : null,
    ['Settlement Fee', cc.settlementFee],
    ['Title Search', cc.titleSearch],
    ['Title Endorsements', cc.titleEndorsements],
    ['Recording Fee', cc.recordingFee],
    ["Lender's Title Policy", cc.lendersTitlePolicy],
  ].filter(Boolean)) as [string, number][]).filter(([, v]) => v > 0) : []

  const dailyRate = loanAmount > 0 && interestRate > 0 ? (loanAmount * (interestRate / 100)) / 365 : 0
  const prepaidInterestAmt = cc ? Math.round(dailyRate * cc.prepaidInterestDays) : 0
  const taxEscrowAmt = cc ? Math.round(row.propertyTaxes * cc.taxEscrowMonths) : 0
  const insuranceEscrowAmt = cc ? Math.round(row.homeownersInsurance * cc.insuranceEscrowMonths) : 0

  const prepaids: [string, number][] = cc ? [
    ...(prepaidInterestAmt > 0 ? [[`Prepaid Interest (${cc.prepaidInterestDays} days)`, prepaidInterestAmt]] as [string, number][] : []),
    ...(cc.annualHazardInsurance > 0 ? [['Homeowners Insurance (1 yr)', cc.annualHazardInsurance]] as [string, number][] : []),
    ...(taxEscrowAmt > 0 ? [[`Property Tax Escrow (${cc.taxEscrowMonths} mo)`, taxEscrowAmt]] as [string, number][] : []),
    ...(insuranceEscrowAmt > 0 ? [[`Insurance Escrow (${cc.insuranceEscrowMonths} mo)`, insuranceEscrowAmt]] as [string, number][] : []),
  ] : []

  const lenderFeesTotal = lenderFees.reduce((s, [, v]) => s + v, 0)
  const thirdPartyTotal = thirdPartyFees.reduce((s, [, v]) => s + v, 0)
  const prepaidsTotal = prepaids.reduce((s, [, v]) => s + v, 0)
  const closingCostsSubtotal = lenderFeesTotal + thirdPartyTotal + pointsDollar - creditsDollar
  const downPayment = row.downPaymentAmount ?? 0
  const sellerCredits = row.sellerCredits ?? 0
  const totalCashToClose = closingCostsSubtotal + prepaidsTotal + downPayment - sellerCredits

  return {
    lenderFees, thirdPartyFees, prepaids,
    lenderFeesTotal, thirdPartyTotal, prepaidsTotal,
    closingCostsSubtotal, pointsDollar, creditsDollar,
    downPayment, sellerCredits, totalCashToClose,
    hasData: !!cc,
  }
}

// ─── Shared cell styles ─────────────────────────────────────────────

const SUB_BG = '#0d1520'

const tdLabel = (indent = 32): React.CSSProperties => ({
  padding: `5px 16px 5px ${indent}px`,
  fontSize: 10,
  color: 'var(--sc-muted)',
  fontFamily: "'IBM Plex Mono', monospace",
  borderBottom: '1px solid var(--sc-border)',
  whiteSpace: 'nowrap',
})
const tdValue: React.CSSProperties = {
  padding: '5px 16px',
  textAlign: 'right',
  fontSize: 10,
  color: 'var(--sc-muted)',
  fontFamily: "'IBM Plex Mono', monospace",
  borderBottom: '1px solid var(--sc-border)',
}
const tdSection: React.CSSProperties = {
  padding: '7px 16px 4px 24px',
  fontSize: 9,
  fontWeight: 600,
  color: 'rgba(201,168,76,0.6)',
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  borderBottom: '1px solid var(--sc-border)',
}
const tdSubtotalLabel: React.CSSProperties = {
  padding: '7px 16px 7px 24px',
  fontSize: 10,
  fontWeight: 600,
  color: 'var(--sc-text)',
  fontFamily: "'IBM Plex Mono', monospace",
  borderBottom: '1px solid var(--sc-border)',
  borderTop: '1px solid rgba(255,255,255,0.08)',
}
const tdSubtotalValue: React.CSSProperties = {
  padding: '7px 16px',
  textAlign: 'right',
  fontSize: 10,
  fontWeight: 600,
  color: 'var(--sc-text)',
  fontFamily: "'IBM Plex Mono', monospace",
  borderBottom: '1px solid var(--sc-border)',
  borderTop: '1px solid rgba(255,255,255,0.08)',
}
const tdTotalLabel: React.CSSProperties = {
  padding: '9px 16px 9px 24px',
  fontSize: 11,
  fontWeight: 700,
  color: '#C9A84C',
  fontFamily: "'IBM Plex Mono', monospace",
  borderBottom: '1px solid var(--sc-border)',
}
const tdTotalValue: React.CSSProperties = {
  padding: '9px 16px',
  textAlign: 'right',
  fontSize: 11,
  fontWeight: 700,
  color: '#C9A84C',
  fontFamily: "'IBM Plex Mono', monospace",
  borderBottom: '1px solid var(--sc-border)',
}

// ─── Component ─────────────────────────────────────────────────────

export default function ScenarioSummaryTable({ data }: { data: DisplayData }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  if (!data.rows.length) return null

  const toggle = (key: string) => setExpanded(prev => {
    const next = new Set(prev)
    if (next.has(key)) { next.delete(key) } else { next.add(key) }
    return next
  })

  const isMonthlyOpen = expanded.has('monthly')
  const isCTCOpen = expanded.has('ctc')

  // Collect all unique fee labels across scenarios for consistent rows
  const allLenderFeeLabels = Array.from(new Set(
    data.rows.flatMap(r => computeCtcWorksheet(r).lenderFees.map(([l]) => l))
  ))
  const allThirdPartyLabels = Array.from(new Set(
    data.rows.flatMap(r => computeCtcWorksheet(r).thirdPartyFees.map(([l]) => l))
  ))
  const allPrepaidLabels = Array.from(new Set(
    data.rows.flatMap(r => computeCtcWorksheet(r).prepaids.map(([l]) => l))
  ))
  const hasAnyPrepaids = data.rows.some(r => computeCtcWorksheet(r).prepaids.length > 0)
  const hasAnyPoints = data.rows.some(r => computeCtcWorksheet(r).pointsDollar > 0)
  const hasAnyCredits = data.rows.some(r => computeCtcWorksheet(r).creditsDollar > 0)
  const hasAnySellerCredits = data.rows.some(r => (r.sellerCredits ?? 0) > 0)
  const hasHOA = data.rows.some(r => r.hoa > 0)
  const hasPMI = data.rows.some(r => r.pmi > 0)

  // Static rows (before expandable sections)
  const topRows: { label: string; getValue: (r: ScenarioDisplayRow) => string }[] = [
    ...(data.mode === 'purchase' ? [{ label: 'Purchase Price', getValue: (r: ScenarioDisplayRow) => fmtCurrency(r.purchasePrice) }] : []),
    { label: 'Loan Amount', getValue: r => fmtCurrency(r.loanAmount) },
    { label: 'Interest Rate', getValue: r => fmtRate(r.interestRate) },
    { label: 'APR', getValue: r => fmtRate(r.apr) },
  ]

  const bottomRows: { label: string; getValue: (r: ScenarioDisplayRow) => string; highlight?: boolean }[] = [
    {
      label: data.mode === 'purchase' ? 'Monthly Savings vs. Baseline' : 'Monthly Savings vs. Current',
      getValue: r => r.monthlySavingsVsCurrent != null && r.monthlySavingsVsCurrent !== 0
        ? fmtCurrency(r.monthlySavingsVsCurrent) + '/mo'
        : '—',
      highlight: true,
    },
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
                borderBottom: '2px solid rgba(255,255,255,0.15)',
              }}>
                Metric
              </th>
              {data.rows.map((row, i) => (
                <th key={i} style={{
                  textAlign: 'right',
                  padding: '10px 16px',
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#ffffff',
                  borderBottom: '2px solid rgba(255,255,255,0.15)',
                }}>
                  {row.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Static top rows */}
            {topRows.map((rowDef, ri) => (
              <tr key={ri} style={{ background: ri % 2 === 0 ? 'var(--sc-card)' : 'var(--sc-card-alt)' }}>
                <td style={{
                  padding: '9px 16px', fontSize: 11, fontWeight: 500, color: 'var(--sc-muted)',
                  borderBottom: '1px solid var(--sc-border)', fontFamily: "'IBM Plex Mono', monospace",
                }}>
                  {rowDef.label}
                </td>
                {data.rows.map((row, ci) => (
                  <td key={ci} style={{
                    padding: '9px 16px', textAlign: 'right', fontSize: 11, fontWeight: 400,
                    color: 'var(--sc-text)', borderBottom: '1px solid var(--sc-border)',
                    fontFamily: "'IBM Plex Mono', monospace",
                  }}>
                    {rowDef.getValue(row)}
                  </td>
                ))}
              </tr>
            ))}

            {/* ── Monthly Payment (expandable) ── */}
            <tr
              style={{ background: 'var(--sc-card-alt)', cursor: 'pointer', userSelect: 'none' }}
              onClick={() => toggle('monthly')}
            >
              <td style={{
                padding: '9px 16px', fontSize: 11, fontWeight: 600, color: 'var(--sc-text)',
                borderBottom: isMonthlyOpen ? '1px solid rgba(201,168,76,0.2)' : '1px solid var(--sc-border)',
                fontFamily: "'IBM Plex Mono', monospace",
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {isMonthlyOpen
                    ? <ChevronDown size={12} style={{ color: '#C9A84C' }} />
                    : <ChevronRight size={12} style={{ color: 'var(--sc-muted)' }} />}
                  Monthly Payment
                </span>
              </td>
              {data.rows.map((row, ci) => (
                <td key={ci} style={{
                  padding: '9px 16px', textAlign: 'right', fontSize: 11, fontWeight: 600,
                  color: 'var(--sc-text)',
                  borderBottom: isMonthlyOpen ? '1px solid rgba(201,168,76,0.2)' : '1px solid var(--sc-border)',
                  fontFamily: "'IBM Plex Mono', monospace",
                }}>
                  {fmtCurrency(row.totalMonthlyPayment)}
                </td>
              ))}
            </tr>

            {isMonthlyOpen && <>
              <tr style={{ background: SUB_BG }}>
                <td style={tdLabel()}>Principal &amp; Interest</td>
                {data.rows.map((row, ci) => <td key={ci} style={tdValue}>{fmtCurrency(row.monthlyPI)}</td>)}
              </tr>
              <tr style={{ background: SUB_BG }}>
                <td style={tdLabel()}>Property Tax (est.)</td>
                {data.rows.map((row, ci) => (
                  <td key={ci} style={tdValue}>{row.propertyTaxes > 0 ? fmtCurrency(row.propertyTaxes) : '—'}</td>
                ))}
              </tr>
              <tr style={{ background: SUB_BG }}>
                <td style={tdLabel()}>Homeowners Insurance (est.)</td>
                {data.rows.map((row, ci) => (
                  <td key={ci} style={tdValue}>{row.homeownersInsurance > 0 ? fmtCurrency(row.homeownersInsurance) : '—'}</td>
                ))}
              </tr>
              {hasHOA && (
                <tr style={{ background: SUB_BG }}>
                  <td style={tdLabel()}>HOA</td>
                  {data.rows.map((row, ci) => (
                    <td key={ci} style={tdValue}>{row.hoa > 0 ? fmtCurrency(row.hoa) : '—'}</td>
                  ))}
                </tr>
              )}
              {hasPMI && (
                <tr style={{ background: SUB_BG }}>
                  <td style={tdLabel()}>MI / PMI</td>
                  {data.rows.map((row, ci) => (
                    <td key={ci} style={tdValue}>{row.pmi > 0 ? fmtCurrency(row.pmi) : '—'}</td>
                  ))}
                </tr>
              )}
              <tr style={{ background: SUB_BG }}>
                <td style={{ ...tdSubtotalLabel, borderTop: '1px solid rgba(201,168,76,0.25)' }}>
                  Total Monthly Payment
                </td>
                {data.rows.map((row, ci) => (
                  <td key={ci} style={{ ...tdSubtotalValue, borderTop: '1px solid rgba(201,168,76,0.25)', color: '#C9A84C' }}>
                    {fmtCurrency(row.totalMonthlyPayment)}
                  </td>
                ))}
              </tr>
            </>}

            {/* ── Cash to Close (expandable) ── */}
            <tr
              style={{ background: 'var(--sc-card)', cursor: 'pointer', userSelect: 'none' }}
              onClick={() => toggle('ctc')}
            >
              <td style={{
                padding: '9px 16px', fontSize: 11, fontWeight: 600, color: 'var(--sc-text)',
                borderBottom: isCTCOpen ? '1px solid rgba(201,168,76,0.2)' : '1px solid var(--sc-border)',
                fontFamily: "'IBM Plex Mono', monospace",
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {isCTCOpen
                    ? <ChevronDown size={12} style={{ color: '#C9A84C' }} />
                    : <ChevronRight size={12} style={{ color: 'var(--sc-muted)' }} />}
                  Cash to Close
                </span>
              </td>
              {data.rows.map((row, ci) => (
                <td key={ci} style={{
                  padding: '9px 16px', textAlign: 'right', fontSize: 11, fontWeight: 600,
                  color: 'var(--sc-text)',
                  borderBottom: isCTCOpen ? '1px solid rgba(201,168,76,0.2)' : '1px solid var(--sc-border)',
                  fontFamily: "'IBM Plex Mono', monospace",
                }}>
                  {fmtCurrency(row.cashToClose)}
                </td>
              ))}
            </tr>

            {isCTCOpen && <>
              {/* Lender Fees */}
              {allLenderFeeLabels.length > 0 && <>
                <tr style={{ background: SUB_BG }}>
                  <td colSpan={data.rows.length + 1} style={tdSection}>Lender Fees</td>
                </tr>
                {allLenderFeeLabels.map(label => (
                  <tr key={label} style={{ background: SUB_BG }}>
                    <td style={tdLabel()}>{label}</td>
                    {data.rows.map((row, ci) => {
                      const fee = computeCtcWorksheet(row).lenderFees.find(([l]) => l === label)
                      return <td key={ci} style={tdValue}>{fee ? fmtCurrency(fee[1]) : '—'}</td>
                    })}
                  </tr>
                ))}
              </>}

              {/* Third Party Fees */}
              {allThirdPartyLabels.length > 0 && <>
                <tr style={{ background: SUB_BG }}>
                  <td colSpan={data.rows.length + 1} style={tdSection}>Third Party Fees</td>
                </tr>
                {allThirdPartyLabels.map(label => (
                  <tr key={label} style={{ background: SUB_BG }}>
                    <td style={tdLabel()}>{label}</td>
                    {data.rows.map((row, ci) => {
                      const fee = computeCtcWorksheet(row).thirdPartyFees.find(([l]) => l === label)
                      return <td key={ci} style={tdValue}>{fee ? fmtCurrency(fee[1]) : '—'}</td>
                    })}
                  </tr>
                ))}
              </>}

              {/* Points / Credits */}
              {hasAnyPoints && (
                <tr style={{ background: SUB_BG }}>
                  <td style={tdLabel()}>Discount Points</td>
                  {data.rows.map((row, ci) => {
                    const ws = computeCtcWorksheet(row)
                    return <td key={ci} style={tdValue}>{ws.pointsDollar > 0 ? fmtCurrency(ws.pointsDollar) : '—'}</td>
                  })}
                </tr>
              )}
              {hasAnyCredits && (
                <tr style={{ background: SUB_BG }}>
                  <td style={tdLabel()}>Lender Credits</td>
                  {data.rows.map((row, ci) => {
                    const ws = computeCtcWorksheet(row)
                    return (
                      <td key={ci} style={{ ...tdValue, color: '#4CC98A' }}>
                        {ws.creditsDollar > 0 ? `−${fmtCurrency(ws.creditsDollar)}` : '—'}
                      </td>
                    )
                  })}
                </tr>
              )}

              {/* Subtotal: Closing Costs */}
              <tr style={{ background: SUB_BG }}>
                <td style={tdSubtotalLabel}>Subtotal: Closing Costs</td>
                {data.rows.map((row, ci) => (
                  <td key={ci} style={tdSubtotalValue}>{fmtCurrency(computeCtcWorksheet(row).closingCostsSubtotal)}</td>
                ))}
              </tr>

              {/* Prepaids */}
              {hasAnyPrepaids && <>
                <tr style={{ background: SUB_BG }}>
                  <td colSpan={data.rows.length + 1} style={tdSection}>Prepaids</td>
                </tr>
                {allPrepaidLabels.map(label => (
                  <tr key={label} style={{ background: SUB_BG }}>
                    <td style={tdLabel()}>{label}</td>
                    {data.rows.map((row, ci) => {
                      const fee = computeCtcWorksheet(row).prepaids.find(([l]) => l === label)
                      return <td key={ci} style={tdValue}>{fee ? fmtCurrency(fee[1]) : '—'}</td>
                    })}
                  </tr>
                ))}
                <tr style={{ background: SUB_BG }}>
                  <td style={tdSubtotalLabel}>Subtotal: Prepaids</td>
                  {data.rows.map((row, ci) => (
                    <td key={ci} style={tdSubtotalValue}>{fmtCurrency(computeCtcWorksheet(row).prepaidsTotal)}</td>
                  ))}
                </tr>
              </>}

              {/* Down Payment (purchase only) */}
              {data.mode === 'purchase' && (
                <tr style={{ background: SUB_BG }}>
                  <td style={tdLabel()}>+ Down Payment</td>
                  {data.rows.map((row, ci) => (
                    <td key={ci} style={tdValue}>{fmtCurrency(row.downPaymentAmount ?? 0)}</td>
                  ))}
                </tr>
              )}

              {/* Seller Concessions */}
              {hasAnySellerCredits && (
                <tr style={{ background: SUB_BG }}>
                  <td style={tdLabel()}>− Seller Concessions</td>
                  {data.rows.map((row, ci) => (
                    <td key={ci} style={{ ...tdValue, color: '#4CC98A' }}>
                      {(row.sellerCredits ?? 0) > 0 ? `−${fmtCurrency(row.sellerCredits)}` : '—'}
                    </td>
                  ))}
                </tr>
              )}

              {/* Total Cash to Close */}
              <tr style={{ background: SUB_BG }}>
                <td style={tdTotalLabel}>= Total Cash to Close</td>
                {data.rows.map((row, ci) => {
                  const ws = computeCtcWorksheet(row)
                  const total = ws.hasData ? ws.totalCashToClose : row.cashToClose
                  return <td key={ci} style={tdTotalValue}>{fmtCurrency(total)}</td>
                })}
              </tr>
            </>}

            {/* Static bottom rows */}
            {bottomRows.map((rowDef, ri) => (
              <tr key={ri} style={{ background: ri % 2 === 0 ? 'var(--sc-card-alt)' : 'var(--sc-card)' }}>
                <td style={{
                  padding: '9px 16px', fontSize: 11, fontWeight: 500, color: 'var(--sc-muted)',
                  borderBottom: '1px solid var(--sc-border)', fontFamily: "'IBM Plex Mono', monospace",
                }}>
                  {rowDef.label}
                </td>
                {data.rows.map((row, ci) => (
                  <td key={ci} style={{
                    padding: '9px 16px', textAlign: 'right', fontSize: 11,
                    fontWeight: rowDef.highlight ? 600 : 400,
                    color: rowDef.highlight && (row.monthlySavingsVsCurrent ?? 0) > 0 ? '#4CC98A' : 'var(--sc-text)',
                    borderBottom: '1px solid var(--sc-border)',
                    fontFamily: "'IBM Plex Mono', monospace",
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
