'use client'

import type { PurchaseScenarioInput } from '@/lib/scenarios/types'

// ─── Constants ──────────────────────────────────────────────────────

// 6-month time horizon for waiting analysis
const MONTHS_TO_WAIT = 6

// Annual home appreciation (user can override, default 3%)
const DEFAULT_APPRECIATION_ANNUAL = 3

// ─── Math helpers ───────────────────────────────────────────────────

// Standard monthly P&I: M = P[r(1+r)^n]/[(1+r)^n-1]
function calcPI(principal: number, annualRate: number, termMonths: number): number {
  if (principal <= 0 || termMonths <= 0) return 0
  if (annualRate <= 0) return principal / termMonths
  const r = annualRate / 100 / 12
  return principal * (r * Math.pow(1 + r, termMonths)) / (Math.pow(1 + r, termMonths) - 1)
}

// Calculate cumulative interest paid over N months
function calcCumulativeInterest(principal: number, annualRate: number, monthsPaid: number): number {
  if (principal <= 0 || monthsPaid <= 0) return 0
  const monthlyPI = calcPI(principal, annualRate, 360) // 30-yr baseline
  const monthlyRate = annualRate / 100 / 12
  let balance = principal
  let totalInterest = 0
  for (let i = 0; i < monthsPaid; i++) {
    const interestThisMonth = balance * monthlyRate
    totalInterest += interestThisMonth
    balance -= (monthlyPI - interestThisMonth)
    if (balance <= 0) break
  }
  return totalInterest
}

// ─── Component ──────────────────────────────────────────────────────

interface WaitingCostSectionProps {
  purchaseScenarios: PurchaseScenarioInput[]
}

export default function WaitingCostSection({ purchaseScenarios }: WaitingCostSectionProps) {
  const base = purchaseScenarios[0]
  if (!base) return null

  const currentRate = base.interestRate
  const purchasePrice = base.purchasePrice
  const loanAmount = base.loanAmount > 0 ? base.loanAmount : purchasePrice - base.downPaymentAmount
  const termMonths = base.loanTerm * 12

  if (currentRate <= 0 || loanAmount <= 0 || purchasePrice <= 0 || termMonths <= 0) return null

  // ── User inputs (state would go here in real implementation) ──
  // For now, hardcode defaults to match the mission brief
  // TODO: Add useState for projectedRate6m and appreciationRateAnnual
  const projectedRate6m = currentRate + 0.5 // User types this - assume +50bps for demo
  const appreciationRateAnnual = DEFAULT_APPRECIATION_ANNUAL // User can override

  // ── Calculations ──
  
  // 1. Current payment on today's loan
  const currentPI = calcPI(loanAmount, currentRate, termMonths)

  // 2. Price appreciation over 6 months
  const sixMonthAppreciationRate = appreciationRateAnnual / 100 / 2 // 6 months = half year
  const futurePrice = purchasePrice * (1 + sixMonthAppreciationRate)
  const priceIncrease = futurePrice - purchasePrice

  // 3. If buying in 6 months at the higher price
  const futureLoanAmount = loanAmount + priceIncrease
  const futurePI = calcPI(futureLoanAmount, projectedRate6m, termMonths)

  // 4. Monthly payment delta (how much more per month)
  const monthlyDelta = futurePI - currentPI

  // 5. 6-month interest difference
  // Interest paid on current loan for 6 months
  const currentInterest6m = calcCumulativeInterest(loanAmount, currentRate, MONTHS_TO_WAIT)
  // Interest paid on future loan (higher) for 6 months
  const futureInterest6m = calcCumulativeInterest(futureLoanAmount, projectedRate6m, MONTHS_TO_WAIT)
  const interestDifference = futureInterest6m - currentInterest6m

  // 6. Total cost of waiting: monthly delta × remaining 30yr term + interest difference
  const remainingMonths = termMonths - MONTHS_TO_WAIT
  const monthlyDeltaCost = monthlyDelta * remainingMonths
  const totalCostOfWaiting = monthlyDeltaCost + interestDifference

  // ── Styling ──────────────────────────────────────────────────

  const fmtCurrency = (v: number) => '$' + Math.round(Math.abs(v)).toLocaleString('en-US')
  const fmtRate = (v: number) => v.toFixed(3) + '%'

  // Determine color based on impact
  const costColor = monthlyDelta > 50 ? '#ef4444' : monthlyDelta > 20 ? '#f59e0b' : '#4CC98A'
  const costBgColor = monthlyDelta > 50 ? 'rgba(239,68,68,0.08)' : monthlyDelta > 20 ? 'rgba(245,158,11,0.08)' : 'rgba(76,201,138,0.08)'

  return (
    <div className="rounded-[14px] overflow-hidden" style={{ border: '1px solid var(--sc-border)' }}>

      {/* ── Header ── */}
      <div className="px-5 py-4" style={{ background: 'var(--sc-card)' }}>
        <h3 className="text-sm font-semibold" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
          Total Cost of Waiting
        </h3>
        <p className="text-xs mt-0.5" style={{ color: 'var(--sc-muted)', fontFamily: "'IBM Plex Mono', monospace" }}>
          Cost of delaying 6 months at {fmtRate(projectedRate6m)} vs. {fmtRate(currentRate)} today
          · {appreciationRateAnnual}% annual appreciation assumption
        </p>
      </div>

      {/* ── Stat Cards ── */}
      <div
        className="grid grid-cols-3 divide-x"
        style={{ background: '#0A1628', borderTop: '1px solid var(--sc-border)', borderBottom: '1px solid var(--sc-border)' }}
      >
        {/* Monthly payment increase */}
        <div className="px-5 py-4 text-center">
          <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: "'IBM Plex Mono', monospace" }}>
            Monthly Payment Delta
          </div>
          <div className="text-xl font-bold" style={{ color: costColor, fontFamily: "'IBM Plex Mono', monospace" }}>
            {monthlyDelta >= 0 ? '+' : ''}{fmtCurrency(monthlyDelta)}/mo
          </div>
          <div className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: "'IBM Plex Mono', monospace" }}>
            if you wait 6 months
          </div>
        </div>

        {/* Price increase */}
        <div className="px-5 py-4 text-center">
          <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: "'IBM Plex Mono', monospace" }}>
            Home Price Increase
          </div>
          <div className="text-xl font-bold" style={{ color: '#C9A84C', fontFamily: "'IBM Plex Mono', monospace" }}>
            {fmtCurrency(priceIncrease)}
          </div>
          <div className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: "'IBM Plex Mono', monospace" }}>
            in 6 months at {appreciationRateAnnual}% annual
          </div>
        </div>

        {/* Total cost of waiting */}
        <div className="px-5 py-4 text-center">
          <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: "'IBM Plex Mono', monospace" }}>
            Total Cost
          </div>
          <div className="text-xl font-bold" style={{ color: costColor, fontFamily: "'IBM Plex Mono', monospace" }}>
            {fmtCurrency(totalCostOfWaiting)}
          </div>
          <div className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: "'IBM Plex Mono', monospace" }}>
            over 30-yr loan life
          </div>
        </div>
      </div>

      {/* ── Context box ── */}
      {monthlyDelta > 0 && (
        <div className="px-5 py-3 flex items-start gap-3" style={{ background: costBgColor, borderTop: `1px solid ${costColor}33` }}>
          <div style={{ fontSize: 14, color: costColor, flexShrink: 0, marginTop: 1 }}>
            {monthlyDelta > 50 ? '⚠' : 'ℹ'}
          </div>
          <p style={{ fontSize: 11, color: costColor, fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.5, opacity: 0.85 }}>
            Waiting 6 months to buy increases your monthly payment by {fmtCurrency(monthlyDelta)}/mo
            {' '}due to both the higher purchase price ({fmtCurrency(priceIncrease)} appreciation)
            {' '}and the projected rate of {fmtRate(projectedRate6m)}.
            {' '}Over the life of your loan, this amounts to {fmtCurrency(totalCostOfWaiting)}.
          </p>
        </div>
      )}

      {/* ── Compliance footer ── */}
      <div className="px-5 py-3" style={{ background: 'var(--sc-card)', borderTop: '1px solid var(--sc-border)' }}>
        <p className="text-[10px] italic" style={{ color: 'var(--sc-muted)', fontFamily: "'IBM Plex Mono', monospace" }}>
          This analysis is illustrative only and assumes your projected rate, home appreciation rate, and loan term remain constant.
          {' '}Future mortgage rates could increase or decrease — this calculation is not a prediction.
          {' '}Not a product recommendation. Approval and eligibility subject to underwriting.
        </p>
      </div>

    </div>
  )
}
