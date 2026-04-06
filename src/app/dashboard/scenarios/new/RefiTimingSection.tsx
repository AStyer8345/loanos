'use client'

import { useState } from 'react'
import type { CurrentLoanInput, RefiScenarioInput, RefiCalculatedResult } from '@/lib/scenarios/types'

// ─── Math helpers ───────────────────────────────────────────────────────

// Standard monthly P&I
function calcPI(principal: number, annualRate: number, termMonths: number): number {
  if (principal <= 0 || termMonths <= 0) return 0
  if (annualRate <= 0) return principal / termMonths
  const r = annualRate / 100 / 12
  return principal * (r * Math.pow(1 + r, termMonths)) / (Math.pow(1 + r, termMonths) - 1)
}

// Reverse: find the rate at which closingCosts / (currentPI - newPI) = targetMonths
// Binary search on interest rate
function findRateForBreakEven(
  principal: number,
  termMonths: number,
  currentMonthlyPI: number,
  closingCosts: number,
  targetBreakEvenMonths: number
): number | null {
  // We need: closingCosts / (currentMonthlyPI - newPI(r)) = targetBreakEvenMonths
  // → newPI(r) = currentMonthlyPI - closingCosts / targetBreakEvenMonths
  const targetNewPI = currentMonthlyPI - closingCosts / targetBreakEvenMonths
  if (targetNewPI <= 0) return null

  // Binary search for rate where calcPI(principal, rate, termMonths) ≈ targetNewPI
  let lo = 0.01
  let hi = 20.0
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2
    const pi = calcPI(principal, mid, termMonths)
    if (Math.abs(pi - targetNewPI) < 0.01) return mid
    if (pi > targetNewPI) hi = mid
    else lo = mid
  }
  return (lo + hi) / 2
}

// ─── Component ──────────────────────────────────────────────────────────

interface RefiTimingSectionProps {
  currentLoan: CurrentLoanInput
  refiScenarios: RefiScenarioInput[]
  refiResults: RefiCalculatedResult[]
}

export default function RefiTimingSection({ currentLoan, refiScenarios, refiResults }: RefiTimingSectionProps) {
  const [planToStayMonths, setPlanToStayMonths] = useState(60)

  // Pick best scenario: positive monthly savings, lowest break-even month
  const bestIdx = refiResults.reduce<number | null>((best, r, i) => {
    if (r.monthlySavings <= 0) return best
    if (best === null) return i
    return r.breakEvenMonth < refiResults[best].breakEvenMonth ? i : best
  }, null)

  if (bestIdx === null) return null

  const result = refiResults[bestIdx]
  const scenario = refiScenarios[bestIdx]

  if (!result || !scenario) return null

  const closingCosts = scenario.closingCosts ?? 3500
  const currentRate = currentLoan.interestRate
  const newRate = scenario.interestRate
  const newLoanAmount = scenario.newLoanAmount
  const termMonths = scenario.loanTerm * 12

  if (newLoanAmount <= 0 || currentRate <= 0 || newRate <= 0) return null

  // ── Derived values ──────────────────────────────────────────────────

  const monthlySavings = result.monthlySavings
  const breakEvenMonths = result.breakEvenMonth
  const savings5yr = result.totalSavings5Year

  // "Plan to stay" verdict
  const verdict = planToStayMonths >= breakEvenMonths ? 'worth-it' : 'wait'
  const monthsShort = breakEvenMonths - planToStayMonths

  // Rate threshold: what rate gives 24-month break-even?
  const targetBreakEvenMonths = 24
  const currentPI = calcPI(newLoanAmount, currentRate, termMonths)
  const thresholdRate = findRateForBreakEven(newLoanAmount, termMonths, currentPI, closingCosts, targetBreakEvenMonths)

  // Cost of waiting: if rates drop 0.25% in 6 months, how does break-even change?
  const futureRate = newRate - 0.25
  const futurePI = calcPI(newLoanAmount, futureRate, termMonths)
  const futureSavings = currentPI - futurePI
  const futureBreakEven = futureSavings > 0 ? Math.round(closingCosts / futureSavings) : null

  // ── Formatting ─────────────────────────────────────────────────────

  const fmt = (v: number) => '$' + Math.round(Math.abs(v)).toLocaleString('en-US')
  const fmtRate = (v: number) => v.toFixed(3) + '%'

  const verdictColor = verdict === 'worth-it' ? '#4CC98A' : '#f59e0b'
  const verdictBg = verdict === 'worth-it' ? 'rgba(76,201,138,0.08)' : 'rgba(245,158,11,0.08)'
  const breakEvenColor = breakEvenMonths <= 24 ? '#4CC98A' : breakEvenMonths <= 48 ? '#C9A84C' : '#f59e0b'

  return (
    <div className="rounded-[14px] overflow-hidden" style={{ border: '1px solid var(--sc-border)' }}>

      {/* ── Header ── */}
      <div className="px-5 py-4" style={{ background: 'var(--sc-card)' }}>
        <h3 className="text-sm font-semibold" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
          Should You Refi Now?
        </h3>
        <p className="text-xs mt-0.5" style={{ color: 'var(--sc-muted)', fontFamily: "'IBM Plex Mono', monospace" }}>
          {fmtRate(currentRate)} current → {fmtRate(newRate)} new · {scenario.label}
          {' '}· Break-even analysis based on {fmt(closingCosts)} closing costs
        </p>
      </div>

      {/* ── Stat Cards ── */}
      <div
        className="grid grid-cols-3 divide-x"
        style={{ background: '#0A1628', borderTop: '1px solid var(--sc-border)', borderBottom: '1px solid var(--sc-border)' }}
      >
        <div className="px-5 py-4 text-center">
          <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: "'IBM Plex Mono', monospace" }}>
            Monthly Savings
          </div>
          <div className="text-xl font-bold" style={{ color: '#4CC98A', fontFamily: "'IBM Plex Mono', monospace" }}>
            {fmt(monthlySavings)}/mo
          </div>
          <div className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: "'IBM Plex Mono', monospace" }}>
            vs. current payment
          </div>
        </div>

        <div className="px-5 py-4 text-center">
          <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: "'IBM Plex Mono', monospace" }}>
            Break-Even Month
          </div>
          <div className="text-xl font-bold" style={{ color: breakEvenColor, fontFamily: "'IBM Plex Mono', monospace" }}>
            Month {breakEvenMonths}
          </div>
          <div className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: "'IBM Plex Mono', monospace" }}>
            closing costs recouped
          </div>
        </div>

        <div className="px-5 py-4 text-center">
          <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: "'IBM Plex Mono', monospace" }}>
            5-Year Savings
          </div>
          <div className="text-xl font-bold" style={{ color: '#C9A84C', fontFamily: "'IBM Plex Mono', monospace" }}>
            {fmt(savings5yr)}
          </div>
          <div className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: "'IBM Plex Mono', monospace" }}>
            cumulative net savings
          </div>
        </div>
      </div>

      {/* ── Plan to Stay Input + Verdict ── */}
      <div className="px-5 py-4" style={{ background: 'var(--sc-card)', borderBottom: '1px solid var(--sc-border)' }}>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-[11px]" style={{ color: 'var(--sc-muted)', fontFamily: "'IBM Plex Mono', monospace" }}>
              Planning to stay:
            </span>
            <input
              type="number"
              min={1}
              max={360}
              value={planToStayMonths}
              onChange={e => setPlanToStayMonths(Math.max(1, Math.min(360, Number(e.target.value))))}
              className="w-16 text-center text-xs rounded-md border px-2 py-1"
              style={{
                background: 'var(--sc-surface)',
                borderColor: 'var(--sc-border)',
                color: 'var(--sc-text)',
                fontFamily: "'IBM Plex Mono', monospace"
              }}
            />
            <span className="text-[11px]" style={{ color: 'var(--sc-muted)', fontFamily: "'IBM Plex Mono', monospace" }}>months</span>
          </div>

          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2 flex-1"
            style={{ background: verdictBg, border: `1px solid ${verdictColor}33` }}
          >
            <span style={{ color: verdictColor, fontSize: 14 }}>
              {verdict === 'worth-it' ? '✓' : '⚠'}
            </span>
            <span className="text-[11px]" style={{ color: verdictColor, fontFamily: "'IBM Plex Mono', monospace" }}>
              {verdict === 'worth-it'
                ? `Refi makes sense — you'll recoup closing costs by month ${breakEvenMonths}, ${planToStayMonths - breakEvenMonths} months before you plan to move.`
                : `Break-even is month ${breakEvenMonths}, but you plan to stay ${planToStayMonths} months — you'd need to stay ${monthsShort} more months to come out ahead.`
              }
            </span>
          </div>
        </div>
      </div>

      {/* ── Rate Threshold + Cost of Waiting ── */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x"
        style={{ background: '#0A1628', borderBottom: '1px solid var(--sc-border)' }}
      >
        {/* Rate threshold */}
        <div className="px-5 py-4">
          <div className="text-[10px] uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: "'IBM Plex Mono', monospace" }}>
            24-Month Break-Even Threshold
          </div>
          {thresholdRate !== null ? (
            <>
              <div className="text-base font-bold mb-1" style={{ color: '#C9A84C', fontFamily: "'IBM Plex Mono', monospace" }}>
                {fmtRate(thresholdRate)}
              </div>
              <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.5 }}>
                Rates would need to reach {fmtRate(thresholdRate)} for this refi to break even in 24 months.
                {' '}{thresholdRate < newRate
                  ? `Today's offered rate of ${fmtRate(newRate)} already beats that threshold.`
                  : `Today's offered rate is ${fmtRate(newRate)} — still ${(thresholdRate - newRate).toFixed(3)}% away.`
                }
              </p>
            </>
          ) : (
            <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: "'IBM Plex Mono', monospace" }}>
              Not achievable with current loan balance and closing costs.
            </p>
          )}
        </div>

        {/* Cost of waiting 6 months */}
        <div className="px-5 py-4">
          <div className="text-[10px] uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: "'IBM Plex Mono', monospace" }}>
            If Rates Drop 0.25% in 6 Months
          </div>
          {futureBreakEven !== null ? (
            <>
              <div className="text-base font-bold mb-1" style={{
                color: futureBreakEven < breakEvenMonths ? '#4CC98A' : '#f59e0b',
                fontFamily: "'IBM Plex Mono', monospace"
              }}>
                Break-even: Month {futureBreakEven}
              </div>
              <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.5 }}>
                At {fmtRate(futureRate)}, you&apos;d save {fmt(futureSavings)}/mo — break-even moves to month {futureBreakEven}.
                {' '}{futureBreakEven < breakEvenMonths
                  ? `That's ${breakEvenMonths - futureBreakEven} months faster than today.`
                  : `No improvement over today's scenario.`
                }
                {' '}The 6-month wait costs {fmt(monthlySavings * 6)} in foregone savings.
              </p>
            </>
          ) : (
            <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: "'IBM Plex Mono', monospace" }}>
              Insufficient savings data to compute.
            </p>
          )}
        </div>
      </div>

      {/* ── Compliance footer ── */}
      <div className="px-5 py-3" style={{ background: 'var(--sc-card)' }}>
        <p className="text-[10px] italic" style={{ color: 'var(--sc-muted)', fontFamily: "'IBM Plex Mono', monospace" }}>
          This analysis is illustrative only. Break-even calculations assume the offered rate and closing cost estimate remain constant.
          {' '}Future rates could increase or decrease. Monthly savings shown are P&I only — taxes, insurance, and HOA may differ.
          {' '}Not a product recommendation. Eligibility subject to underwriting approval.
        </p>
      </div>

    </div>
  )
}
