'use client'

import { useState } from 'react'
import type { PurchaseScenarioInput } from '@/lib/scenarios/types'

// ─── Math helpers ────────────────────────────────────────────────────

// Standard monthly P&I: M = P[r(1+r)^n] / [(1+r)^n - 1]
function calcPI(principal: number, annualRate: number, termMonths: number): number {
  if (principal <= 0 || termMonths <= 0) return 0
  if (annualRate <= 0) return principal / termMonths
  const r = annualRate / 100 / 12
  return (principal * (r * Math.pow(1 + r, termMonths))) / (Math.pow(1 + r, termMonths) - 1)
}

// ─── Formatting ──────────────────────────────────────────────────────

const fmt = (v: number) => '$' + Math.round(Math.abs(v)).toLocaleString('en-US')
const fmtK = (v: number) => {
  const abs = Math.abs(v)
  if (abs >= 10000) return (v < 0 ? '-$' : '$') + Math.round(abs / 1000) + 'k'
  return fmt(v)
}
const fmtRate = (v: number) => v.toFixed(3) + '%'

// ─── Component ───────────────────────────────────────────────────────

interface WaitingCostSectionProps {
  purchaseScenarios: PurchaseScenarioInput[]
}

export default function WaitingCostSection({ purchaseScenarios }: WaitingCostSectionProps) {
  const base = purchaseScenarios[0]

  // Inputs with defaults seeded from scenario data when available
  const defaultProjectedRate = base ? (base.interestRate + 0.25).toFixed(3) : ''
  const [projectedRateInput, setProjectedRateInput] = useState(defaultProjectedRate)
  const [appreciationInput, setAppreciationInput] = useState('3.0')

  if (!base) return null

  const purchasePrice = base.purchasePrice
  const downPayment = base.downPaymentAmount
  const loanAmount = base.loanAmount > 0
    ? base.loanAmount
    : purchasePrice - downPayment
  const currentRate = base.interestRate
  const termMonths = base.loanTerm * 12

  if (purchasePrice <= 0 || currentRate <= 0 || loanAmount <= 0 || termMonths <= 0) return null

  // ── Parse user inputs ──
  const projectedRate = parseFloat(projectedRateInput) || currentRate
  const annualAppreciation = parseFloat(appreciationInput) || 3.0

  // ── Scenario: Buy today ──
  const currentPI = calcPI(loanAmount, currentRate, termMonths)

  // ── Scenario: Wait 6 months ──
  // Home price increases by half a year of appreciation
  const sixMonthAppreciation = annualAppreciation / 100 / 2
  const newPrice = purchasePrice * (1 + sixMonthAppreciation)
  const priceIncrease = newPrice - purchasePrice
  // Down payment stays the same in absolute dollars — loan grows by full price increase
  const newLoanAmount = loanAmount + priceIncrease
  const newPI = calcPI(newLoanAmount, projectedRate, termMonths)

  // ── Derived stats ──
  const monthlyDelta = newPI - currentPI  // positive = costs more per month
  // Extra lifetime interest = extra lifetime payment cost minus the extra principal borrowed
  // (extra principal shows up as higher price, extra interest is the true delay penalty)
  const extraLifetimeInterest = monthlyDelta * termMonths - priceIncrease

  // Total cost of waiting = price appreciation + extra interest paid over loan life
  const totalCostOfWaiting = priceIncrease + Math.max(extraLifetimeInterest, 0)

  // ── Hero color logic ──
  const heroColor = monthlyDelta >= 0 ? '#ef4444' : '#4CC98A'
  const heroSign = monthlyDelta >= 0 ? '+' : '−'

  // ── Input style ──
  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 6,
    padding: '5px 10px',
    fontSize: 12,
    fontFamily: "'IBM Plex Mono', monospace",
    color: '#C9A84C',
    width: 90,
    outline: 'none',
  }

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

  return (
    <div className="rounded-[14px] overflow-hidden" style={{ border: '1px solid var(--sc-border)' }}>

      {/* ── Header with inputs ── */}
      <div className="px-5 py-4" style={{ background: 'var(--sc-card)' }}>
        <h3 className="text-sm font-semibold" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
          Cost of Waiting 6 Months
        </h3>
        <p className="text-xs mt-0.5 mb-3" style={{ color: 'var(--sc-muted)', fontFamily: "'IBM Plex Mono', monospace" }}>
          {fmt(purchasePrice)} purchase · {fmtRate(currentRate)} today · Assumes down payment held flat
        </p>

        {/* ── User inputs ── */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: "'IBM Plex Mono', monospace" }}>
              Rate in 6 mo:
            </span>
            <input
              type="number"
              step="0.125"
              min="1"
              max="20"
              value={projectedRateInput}
              onChange={e => setProjectedRateInput(e.target.value)}
              style={inputStyle}
            />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: "'IBM Plex Mono', monospace" }}>%</span>
          </div>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: "'IBM Plex Mono', monospace" }}>
              Annual appreciation:
            </span>
            <input
              type="number"
              step="0.5"
              min="0"
              max="20"
              value={appreciationInput}
              onChange={e => setAppreciationInput(e.target.value)}
              style={inputStyle}
            />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: "'IBM Plex Mono', monospace" }}>%/yr</span>
          </div>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div
        className="grid grid-cols-3 divide-x"
        style={{ background: '#0A1628', borderTop: '1px solid var(--sc-border)', borderBottom: '1px solid var(--sc-border)' }}
      >
        {/* Hero: monthly payment delta */}
        <div className="px-5 py-4 text-center">
          <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: "'IBM Plex Mono', monospace" }}>
            Payment Delta
          </div>
          <div className="text-xl font-bold" style={{ color: heroColor, fontFamily: "'IBM Plex Mono', monospace" }}>
            {heroSign}{fmt(monthlyDelta)}/mo
          </div>
          <div className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: "'IBM Plex Mono', monospace" }}>
            {monthlyDelta >= 0 ? 'more per month if you wait' : 'saved per month by waiting'}
          </div>
        </div>

        {/* Home price increase */}
        <div className="px-5 py-4 text-center">
          <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: "'IBM Plex Mono', monospace" }}>
            Price Increase
          </div>
          <div className="text-xl font-bold" style={{ color: priceIncrease > 0 ? '#f59e0b' : '#4CC98A', fontFamily: "'IBM Plex Mono', monospace" }}>
            +{fmtK(priceIncrease)}
          </div>
          <div className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: "'IBM Plex Mono', monospace" }}>
            in 6 months at {appreciationInput}%/yr
          </div>
        </div>

        {/* Total cost of waiting */}
        <div className="px-5 py-4 text-center">
          <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: "'IBM Plex Mono', monospace" }}>
            Total Cost to Wait
          </div>
          <div className="text-xl font-bold" style={{ color: totalCostOfWaiting > 0 ? '#ef4444' : '#4CC98A', fontFamily: "'IBM Plex Mono', monospace" }}>
            {totalCostOfWaiting > 0 ? '+' : '−'}{fmtK(totalCostOfWaiting)}
          </div>
          <div className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: "'IBM Plex Mono', monospace" }}>
            price + extra lifetime interest
          </div>
        </div>
      </div>

      {/* ── Comparison table: Today vs. In 6 Months ── */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 380 }}>
          <thead>
            <tr style={{ background: '#0A1628' }}>
              {['', 'Buy Today', 'Wait 6 Months', 'Difference'].map((h, i) => (
                <th
                  key={h + i}
                  style={{
                    textAlign: i === 0 ? 'left' : 'right',
                    padding: '10px 16px',
                    fontSize: 10,
                    fontWeight: 500,
                    color: 'rgba(255,255,255,0.5)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    borderBottom: '2px solid rgba(255,255,255,0.15)',
                    fontFamily: "'IBM Plex Mono', monospace",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              {
                label: 'Purchase Price',
                today: fmt(purchasePrice),
                later: fmt(newPrice),
                diff: `+${fmtK(priceIncrease)}`,
                diffColor: '#f59e0b',
                rowBg: 'var(--sc-card)',
              },
              {
                label: 'Loan Amount',
                today: fmt(loanAmount),
                later: fmt(newLoanAmount),
                diff: `+${fmtK(priceIncrease)}`,
                diffColor: '#f59e0b',
                rowBg: 'rgba(201,168,76,0.03)',
              },
              {
                label: 'Interest Rate',
                today: fmtRate(currentRate),
                later: fmtRate(projectedRate),
                diff: projectedRate >= currentRate
                  ? `+${(projectedRate - currentRate).toFixed(3)}%`
                  : `${(projectedRate - currentRate).toFixed(3)}%`,
                diffColor: projectedRate >= currentRate ? '#ef4444' : '#4CC98A',
                rowBg: 'var(--sc-card)',
              },
              {
                label: 'Monthly P&I',
                today: `${fmt(currentPI)}/mo`,
                later: `${fmt(newPI)}/mo`,
                diff: `${monthlyDelta >= 0 ? '+' : '−'}${fmt(monthlyDelta)}/mo`,
                diffColor: monthlyDelta >= 0 ? '#ef4444' : '#4CC98A',
                rowBg: 'rgba(201,168,76,0.03)',
              },
              {
                label: 'Extra Lifetime Interest',
                today: '—',
                later: '—',
                diff: extraLifetimeInterest > 0 ? `+${fmtK(extraLifetimeInterest)}` : fmtK(extraLifetimeInterest),
                diffColor: extraLifetimeInterest > 0 ? '#ef4444' : '#4CC98A',
                rowBg: 'var(--sc-card)',
              },
            ].map((row) => (
              <tr key={row.label} style={{ background: row.rowBg }}>
                <td style={tdLabel}>{row.label}</td>
                <td style={td}>{row.today}</td>
                <td style={td}>{row.later}</td>
                <td style={{ ...td, fontWeight: 700, color: row.diffColor }}>{row.diff}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Context box ── */}
      {monthlyDelta > 0 && (
        <div className="px-5 py-3 flex items-start gap-3" style={{ background: 'rgba(239,68,68,0.05)', borderTop: '1px solid rgba(239,68,68,0.15)' }}>
          <div style={{ fontSize: 14, color: '#f59e0b', flexShrink: 0, marginTop: 1 }}>⏱</div>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.6 }}>
            If rates move to {fmtRate(projectedRate)} and home prices appreciate {appreciationInput}%/yr over 6 months,
            {' '}buying today vs. waiting saves approximately <strong style={{ color: '#ef4444' }}>{fmt(monthlyDelta)}/mo</strong> in payment
            {' '}and <strong style={{ color: '#f59e0b' }}>{fmtK(totalCostOfWaiting)}</strong> in total long-term cost.
            {' '}Rates could also decrease — adjust the inputs above to model different scenarios.
          </p>
        </div>
      )}
      {monthlyDelta <= 0 && (
        <div className="px-5 py-3 flex items-start gap-3" style={{ background: 'rgba(76,201,138,0.05)', borderTop: '1px solid rgba(76,201,138,0.15)' }}>
          <div style={{ fontSize: 14, color: '#4CC98A', flexShrink: 0, marginTop: 1 }}>↓</div>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.6 }}>
            At these projections, waiting 6 months could result in a lower payment ({fmt(Math.abs(monthlyDelta))}/mo savings).
            {' '}Home price appreciation of {fmt(priceIncrease)} still increases the purchase cost regardless of rate movement.
            {' '}Adjust the inputs above to model different scenarios.
          </p>
        </div>
      )}

      {/* ── Compliance footer ── */}
      <div className="px-5 py-3" style={{ background: 'var(--sc-card)', borderTop: '1px solid var(--sc-border)' }}>
        <p className="text-[10px] italic" style={{ color: 'var(--sc-muted)', fontFamily: "'IBM Plex Mono', monospace" }}>
          This analysis is illustrative only. Future interest rates and home prices are unpredictable — rates may decrease and home prices may not appreciate as assumed.
          Down payment assumed held constant. Appreciation applied uniformly at {appreciationInput}%/yr over 6 months.
          This is not a guarantee of future pricing, approval, or loan terms. Market conditions vary.
        </p>
      </div>

    </div>
  )
}
