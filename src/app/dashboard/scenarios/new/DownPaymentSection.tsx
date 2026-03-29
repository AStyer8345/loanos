'use client'

import { useState } from 'react'
import type { PurchaseScenarioInput } from '@/lib/scenarios/types'

// ─── Constants ──────────────────────────────────────────────────────

const DOWN_PCTS = [3, 5, 10, 20] as const

// PMI annual rate as % of loan amount — MGIC-based estimates (borrower-paid monthly, 30-yr fixed)
// Rows: credit score buckets (descending). Cols: LTV buckets [>80–85, >85–90, >90–95, >95–97]
const PMI_RATES: Record<string, [number, number, number, number]> = {
  '760': [0.15, 0.21, 0.30, 0.41],
  '740': [0.19, 0.27, 0.38, 0.52],
  '720': [0.25, 0.36, 0.50, 0.67],
  '700': [0.32, 0.45, 0.63, 0.85],
  '680': [0.39, 0.55, 0.76, 1.03],
  '660': [0.46, 0.64, 0.90, 1.21],
  '640': [0.57, 0.79, 1.10, 1.48],
  '620': [0.67, 0.94, 1.31, 1.75],
}

const CREDIT_SCORE_BUCKETS = [
  { label: '760+', key: '760' },
  { label: '740–759', key: '740' },
  { label: '720–739', key: '720' },
  { label: '700–719', key: '700' },
  { label: '680–699', key: '680' },
  { label: '660–679', key: '660' },
  { label: '640–659', key: '640' },
  { label: '620–639', key: '620' },
]

function estimatePMIRate(ltv: number, creditScoreKey: string): number {
  if (ltv <= 80) return 0
  const rates = PMI_RATES[creditScoreKey] ?? PMI_RATES['740']
  if (ltv <= 85) return rates[0]
  if (ltv <= 90) return rates[1]
  if (ltv <= 95) return rates[2]
  return rates[3] // 95–97% LTV
}

// Standard monthly P&I formula: M = P[r(1+r)^n]/[(1+r)^n-1]
function calcPI(principal: number, annualRate: number, termYears: number): number {
  if (principal <= 0 || termYears <= 0) return 0
  if (annualRate <= 0) return principal / (termYears * 12)
  const r = annualRate / 100 / 12
  const n = termYears * 12
  return principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
}

// Month when balance drops to 78% of original purchase price (auto-cancel trigger)
function pmiCancelMonth(
  loanAmount: number,
  purchasePrice: number,
  annualRate: number,
  termYears: number
): number | null {
  if (purchasePrice <= 0 || annualRate <= 0 || loanAmount <= 0) return null
  const threshold = purchasePrice * 0.78
  const r = annualRate / 100 / 12
  const n = termYears * 12
  const payment = calcPI(loanAmount, annualRate, termYears)
  let balance = loanAmount
  for (let m = 1; m <= n; m++) {
    const interest = balance * r
    const principal = payment - interest
    balance = Math.max(balance - principal, 0)
    if (balance <= threshold) return m
  }
  return null
}

// ─── Types ──────────────────────────────────────────────────────────

interface DownPaymentRow {
  dpPct: number
  downAmt: number
  loanAmt: number
  ltv: number
  pi: number
  pmiMonthly: number
  totalMonthly: number
  cashToClose: number
  cancelMonth: number | null
}

// ─── Component ──────────────────────────────────────────────────────

interface DownPaymentSectionProps {
  purchaseScenarios: PurchaseScenarioInput[]
  propertyValue: number
}

export default function DownPaymentSection({ purchaseScenarios, propertyValue }: DownPaymentSectionProps) {
  const [creditScoreKey, setCreditScoreKey] = useState('740')

  const base = purchaseScenarios[0]
  if (!base) return null

  const purchasePrice = base.purchasePrice > 0 ? base.purchasePrice : propertyValue
  if (purchasePrice <= 0 || base.interestRate <= 0 || base.loanTerm <= 0) return null

  // Build one row per down payment tier
  const rows: DownPaymentRow[] = DOWN_PCTS.map(dpPct => {
    const downAmt = Math.round(purchasePrice * dpPct / 100)
    const loanAmt = purchasePrice - downAmt
    const ltv = (loanAmt / purchasePrice) * 100
    const pi = calcPI(loanAmt, base.interestRate, base.loanTerm)
    const pmiRate = estimatePMIRate(ltv, creditScoreKey)
    const pmiMonthly = pmiRate > 0 ? Math.round(loanAmt * pmiRate / 100 / 12) : 0
    const totalMonthly = pi + pmiMonthly + base.propertyTaxes + base.homeownersInsurance + base.hoa
    // Cash to close = down payment + closing costs already on scenario (net seller credits)
    const cashToClose = Math.max(downAmt + base.totalClosingCosts - base.sellerCredits, downAmt)
    const cancelMonth = pmiMonthly > 0
      ? pmiCancelMonth(loanAmt, purchasePrice, base.interestRate, base.loanTerm)
      : null

    return { dpPct, downAmt, loanAmt, ltv, pi, pmiMonthly, totalMonthly, cashToClose, cancelMonth }
  })

  const lowestMonthly = Math.min(...rows.map(r => r.totalMonthly))
  const lowestCash = Math.min(...rows.map(r => r.cashToClose))

  // ─── Styles ─────────────────────────────────────────────────────

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

  const fmtCurrency = (v: number) => '$' + Math.round(v).toLocaleString('en-US')
  const fmtPct = (v: number) => v.toFixed(1) + '%'

  return (
    <div className="rounded-[14px] overflow-hidden" style={{ border: '1px solid var(--sc-border)' }}>
      {/* Header */}
      <div className="px-5 py-4 flex flex-wrap items-start justify-between gap-3" style={{ background: 'var(--sc-card)' }}>
        <div>
          <h3 className="text-sm font-semibold" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            Down Payment Comparison
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--sc-muted)', fontFamily: "'IBM Plex Mono', monospace" }}>
            Same rate &amp; term at 4 down payment tiers — {base.interestRate.toFixed(3)}% · {base.loanTerm}-yr · {fmtCurrency(purchasePrice)}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <label style={{ fontSize: 10, color: 'var(--sc-muted)', fontFamily: "'IBM Plex Mono', monospace", whiteSpace: 'nowrap' }}>
            Credit Score
          </label>
          <select
            value={creditScoreKey}
            onChange={e => setCreditScoreKey(e.target.value)}
            style={{
              background: 'var(--sc-card-alt)',
              border: '1px solid var(--sc-border)',
              borderRadius: 6,
              padding: '3px 8px',
              fontSize: 11,
              color: 'var(--sc-text)',
              fontFamily: "'IBM Plex Mono', monospace",
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {CREDIT_SCORE_BUCKETS.map(b => (
              <option key={b.key} value={b.key}>{b.label}</option>
            ))}
          </select>
        </div>
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
              {rows.map(row => (
                <th key={row.dpPct} style={{
                  textAlign: 'right', padding: '10px 16px', fontSize: 11, fontWeight: 700,
                  color: '#ffffff', borderBottom: '2px solid rgba(255,255,255,0.15)',
                }}>
                  {row.dpPct}% Down
                  <div style={{ fontSize: 9, fontWeight: 400, color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>
                    {fmtCurrency(row.downAmt)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>

            {/* ── Section: Monthly Payment ── */}
            <tr style={{ background: '#0A1628' }}>
              <td colSpan={5} style={tdSection}>Monthly Payment</td>
            </tr>

            {/* Loan Amount */}
            <tr style={{ background: 'var(--sc-card)' }}>
              <td style={tdLabel}>Loan Amount</td>
              {rows.map((row, i) => (
                <td key={i} style={td}>
                  <span style={{ fontSize: 11 }}>{fmtCurrency(row.loanAmt)}</span>
                </td>
              ))}
            </tr>

            {/* LTV */}
            <tr style={{ background: 'var(--sc-card-alt)' }}>
              <td style={tdLabel}>LTV</td>
              {rows.map((row, i) => (
                <td key={i} style={td}>
                  <span style={{ fontSize: 11 }}>{fmtPct(row.ltv)}</span>
                </td>
              ))}
            </tr>

            {/* Monthly P&I */}
            <tr style={{ background: 'var(--sc-card)' }}>
              <td style={{ ...tdLabel, paddingLeft: 24 }}>P&amp;I</td>
              {rows.map((row, i) => (
                <td key={i} style={td}>
                  <span style={{ fontSize: 11 }}>{fmtCurrency(row.pi)}</span>
                  <span style={{ fontSize: 9, color: 'var(--sc-muted)', marginLeft: 3 }}>/mo</span>
                </td>
              ))}
            </tr>

            {/* PMI */}
            <tr style={{ background: 'var(--sc-card-alt)' }}>
              <td style={{ ...tdLabel, paddingLeft: 24 }}>PMI (est.)</td>
              {rows.map((row, i) => (
                <td key={i} style={td}>
                  {row.pmiMonthly > 0 ? (
                    <>
                      <span style={{ fontSize: 11, color: '#ef4444' }}>{fmtCurrency(row.pmiMonthly)}</span>
                      <span style={{ fontSize: 9, color: 'var(--sc-muted)', marginLeft: 3 }}>/mo</span>
                    </>
                  ) : (
                    <span style={{ fontSize: 11, color: '#4CC98A', fontWeight: 600 }}>None</span>
                  )}
                </td>
              ))}
            </tr>

            {/* Total PITI */}
            <tr style={{ background: 'var(--sc-card)' }}>
              <td style={{ ...tdLabel, paddingLeft: 24, fontWeight: 600, color: 'var(--sc-text)' }}>Total Monthly</td>
              {rows.map((row, i) => (
                <td key={i} style={{
                  ...td,
                  background: row.totalMonthly === lowestMonthly ? 'rgba(201,168,76,0.08)' : undefined,
                }}>
                  <span style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: row.totalMonthly === lowestMonthly ? '#C9A84C' : 'var(--sc-text)',
                  }}>
                    {fmtCurrency(row.totalMonthly)}
                  </span>
                  <span style={{ fontSize: 9, color: 'var(--sc-muted)', marginLeft: 3 }}>/mo</span>
                  {row.totalMonthly === lowestMonthly && (
                    <div style={{ fontSize: 9, color: '#C9A84C', marginTop: 1 }}>lowest</div>
                  )}
                </td>
              ))}
            </tr>

            {/* ── Section: Cash to Close ── */}
            <tr style={{ background: '#0A1628' }}>
              <td colSpan={5} style={tdSection}>Cash to Close</td>
            </tr>

            <tr style={{ background: 'var(--sc-card)' }}>
              <td style={{ ...tdLabel, fontWeight: 600, color: 'var(--sc-text)' }}>Cash Required</td>
              {rows.map((row, i) => (
                <td key={i} style={{
                  ...td,
                  background: row.cashToClose === lowestCash ? 'rgba(76,201,138,0.08)' : undefined,
                }}>
                  <span style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: row.cashToClose === lowestCash ? '#4CC98A' : 'var(--sc-text)',
                  }}>
                    {fmtCurrency(row.cashToClose)}
                  </span>
                  {row.cashToClose === lowestCash && (
                    <div style={{ fontSize: 9, color: '#4CC98A', marginTop: 1 }}>lowest</div>
                  )}
                </td>
              ))}
            </tr>

            {/* ── Section: PMI Details ── */}
            <tr style={{ background: '#0A1628' }}>
              <td colSpan={5} style={tdSection}>PMI Auto-Cancel (conventional, est.)</td>
            </tr>

            <tr style={{ background: 'var(--sc-card)' }}>
              <td style={tdLabel}>Drops at Month</td>
              {rows.map((row, i) => (
                <td key={i} style={td}>
                  {row.cancelMonth ? (
                    <span style={{ fontSize: 11 }}>
                      Month {row.cancelMonth}
                      <span style={{ fontSize: 9, color: 'var(--sc-muted)', marginLeft: 3 }}>
                        (Yr {Math.ceil(row.cancelMonth / 12)})
                      </span>
                    </span>
                  ) : (
                    <span style={{ color: row.pmiMonthly === 0 ? '#4CC98A' : 'var(--sc-muted)', fontWeight: row.pmiMonthly === 0 ? 600 : 400 }}>
                      {row.pmiMonthly === 0 ? 'N/A — no PMI' : '—'}
                    </span>
                  )}
                </td>
              ))}
            </tr>

          </tbody>
        </table>
      </div>

      {/* Compliance note */}
      <div className="px-5 py-3" style={{ background: 'var(--sc-card)', borderTop: '1px solid var(--sc-border)' }}>
        <p className="text-[10px] italic" style={{ color: 'var(--sc-muted)', fontFamily: "'IBM Plex Mono', monospace" }}>
          PMI rates are MGIC-based estimates for the selected credit score tier and LTV. Actual rates vary by lender, loan type, and full credit profile. PMI auto-cancels when the loan balance reaches 78% of the original purchase price (conventional only). FHA loans carry MIP for the life of the loan if down payment is &lt; 10%. All figures are illustrative — approval and eligibility subject to underwriting.
        </p>
      </div>
    </div>
  )
}
