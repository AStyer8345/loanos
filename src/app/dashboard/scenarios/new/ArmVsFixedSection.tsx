'use client'

import type { PurchaseScenarioInput } from '@/lib/scenarios/types'

// ─── Constants ──────────────────────────────────────────────────────

// Typical 5/1 ARM spread below 30yr fixed at time of origination
const ARM_DISCOUNT = 0.5 // ARM rate = fixed rate − 0.5%

// Worst-case scenario: rate jumps 2% above fixed after 5yr reset
// (conservative — typical 5/1 ARM caps are 2% per adjustment, 5% lifetime)
const WORST_CASE_PREMIUM = 2.0 // ARM worst-case = fixed rate + 2.0%

// ARM fixed period in months
const ARM_FIXED_MONTHS = 60 // 5-year ARM

// ─── Math helpers ───────────────────────────────────────────────────

// Standard monthly P&I: M = P[r(1+r)^n]/[(1+r)^n-1]
function calcPI(principal: number, annualRate: number, termMonths: number): number {
  if (principal <= 0 || termMonths <= 0) return 0
  if (annualRate <= 0) return principal / termMonths
  const r = annualRate / 100 / 12
  return principal * (r * Math.pow(1 + r, termMonths)) / (Math.pow(1 + r, termMonths) - 1)
}

// Remaining loan balance after N payments
function remainingBalance(
  principal: number,
  annualRate: number,
  termMonths: number,
  monthsPaid: number
): number {
  if (principal <= 0 || annualRate <= 0) return principal
  const r = annualRate / 100 / 12
  const n = termMonths
  const k = monthsPaid
  // Standard formula: B = P * [(1+r)^n - (1+r)^k] / [(1+r)^n - 1]
  return principal * (Math.pow(1 + r, n) - Math.pow(1 + r, k)) / (Math.pow(1 + r, n) - 1)
}

// ─── Component ──────────────────────────────────────────────────────

interface ArmVsFixedSectionProps {
  purchaseScenarios: PurchaseScenarioInput[]
}

export default function ArmVsFixedSection({ purchaseScenarios }: ArmVsFixedSectionProps) {
  const base = purchaseScenarios[0]
  if (!base) return null

  const fixedRate = base.interestRate
  const loanAmount = base.loanAmount > 0 ? base.loanAmount : base.purchasePrice - base.downPaymentAmount
  const termMonths = base.loanTerm * 12

  if (fixedRate <= 0 || loanAmount <= 0 || termMonths <= 0) return null

  // ── ARM calculations ──
  const armRate = Math.max(fixedRate - ARM_DISCOUNT, 0.1)
  const worstCaseRate = fixedRate + WORST_CASE_PREMIUM

  // Monthly P&I for each loan type
  const fixedPI = calcPI(loanAmount, fixedRate, termMonths)
  const armPI = calcPI(loanAmount, armRate, termMonths)

  // Monthly savings during fixed ARM period (positive = ARM saves money)
  const monthlySavings = fixedPI - armPI

  // 5-year cumulative savings
  const fiveYrSavings = monthlySavings * ARM_FIXED_MONTHS

  // Remaining balance + term after ARM resets at month 60
  const balanceAtReset = remainingBalance(loanAmount, armRate, termMonths, ARM_FIXED_MONTHS)
  const remainingMonths = termMonths - ARM_FIXED_MONTHS

  // Worst-case payment after reset
  const worstCasePI = calcPI(balanceAtReset, worstCaseRate, remainingMonths)
  const worstCaseExtra = worstCasePI - fixedPI // how much MORE per month vs just staying fixed

  // Break-even: how many months of worst-case overage to burn through the 5yr savings
  // If worstCaseExtra <= 0, ARM always wins (rate reset still below fixed — unlikely with +2%)
  let breakEvenMonthsAfterReset: number | null = null
  if (worstCaseExtra > 0) {
    breakEvenMonthsAfterReset = Math.ceil(fiveYrSavings / worstCaseExtra)
  }

  // ── Year-by-year table rows ──
  interface YearRow {
    year: number
    label: string
    rate: number
    pi: number
    monthlyDelta: number // vs fixed (negative = ARM costs less)
    isArmPeriod: boolean
  }

  const yearRows: YearRow[] = []
  for (let yr = 1; yr <= Math.min(base.loanTerm, 10); yr++) {
    const isArmPeriod = yr <= 5
    const rate = isArmPeriod ? armRate : worstCaseRate
    const pi = isArmPeriod ? armPI : worstCasePI
    yearRows.push({
      year: yr,
      label: yr <= 5 ? `Year ${yr}` : `Year ${yr}+`,
      rate,
      pi,
      monthlyDelta: pi - fixedPI,
      isArmPeriod,
    })
    // Only show one row for post-reset years (they're all the same worst-case)
    if (!isArmPeriod) break
  }

  // ── Styles ──────────────────────────────────────────────────────

  const fmtCurrency = (v: number) => '$' + Math.round(Math.abs(v)).toLocaleString('en-US')
  const fmtRate = (v: number) => v.toFixed(3) + '%'

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

  // ── Break-even label ──
  let breakEvenLabel: string
  let breakEvenColor: string
  if (!breakEvenMonthsAfterReset) {
    breakEvenLabel = 'ARM always wins'
    breakEvenColor = '#4CC98A'
  } else if (breakEvenMonthsAfterReset > remainingMonths) {
    breakEvenLabel = 'ARM wins (never caught up)'
    breakEvenColor = '#4CC98A'
  } else {
    const yrs = Math.floor(breakEvenMonthsAfterReset / 12)
    const mos = breakEvenMonthsAfterReset % 12
    breakEvenLabel = yrs > 0
      ? `Yr ${5 + yrs}${mos > 0 ? ` Mo ${mos}` : ''} after origination`
      : `Mo ${breakEvenMonthsAfterReset} after reset`
    breakEvenColor = breakEvenMonthsAfterReset <= 36 ? '#ef4444' : '#f59e0b'
  }

  return (
    <div className="rounded-[14px] overflow-hidden" style={{ border: '1px solid var(--sc-border)' }}>

      {/* ── Header ── */}
      <div className="px-5 py-4" style={{ background: 'var(--sc-card)' }}>
        <h3 className="text-sm font-semibold" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
          ARM vs. Fixed Comparison
        </h3>
        <p className="text-xs mt-0.5" style={{ color: 'var(--sc-muted)', fontFamily: "'IBM Plex Mono', monospace" }}>
          5/1 ARM at {fmtRate(armRate)} vs. 30-yr fixed at {fmtRate(fixedRate)} · {fmtCurrency(loanAmount)} loan ·
          Worst-case reset: {fmtRate(worstCaseRate)} after Year 5
        </p>
      </div>

      {/* ── Stat Cards ── */}
      <div
        className="grid grid-cols-3 divide-x"
        style={{ background: '#0A1628', borderTop: '1px solid var(--sc-border)', borderBottom: '1px solid var(--sc-border)' }}
      >
        {/* Monthly savings (ARM period) */}
        <div className="px-5 py-4 text-center">
          <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: "'IBM Plex Mono', monospace" }}>
            Monthly Savings
          </div>
          <div className="text-xl font-bold" style={{ color: '#4CC98A', fontFamily: "'IBM Plex Mono', monospace" }}>
            {fmtCurrency(monthlySavings)}/mo
          </div>
          <div className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: "'IBM Plex Mono', monospace" }}>
            during 5-yr fixed period
          </div>
        </div>

        {/* 5-year cumulative savings */}
        <div className="px-5 py-4 text-center">
          <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: "'IBM Plex Mono', monospace" }}>
            5-Yr Savings
          </div>
          <div className="text-xl font-bold" style={{ color: '#C9A84C', fontFamily: "'IBM Plex Mono', monospace" }}>
            {fmtCurrency(fiveYrSavings)}
          </div>
          <div className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: "'IBM Plex Mono', monospace" }}>
            cumulative vs. 30-yr fixed
          </div>
        </div>

        {/* Break-even */}
        <div className="px-5 py-4 text-center">
          <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: "'IBM Plex Mono', monospace" }}>
            Break-Even (worst case)
          </div>
          <div className="text-sm font-bold leading-tight" style={{ color: breakEvenColor, fontFamily: "'IBM Plex Mono', monospace" }}>
            {breakEvenLabel}
          </div>
          <div className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: "'IBM Plex Mono', monospace" }}>
            if rate jumps to {fmtRate(worstCaseRate)}
          </div>
        </div>
      </div>

      {/* ── Year-by-year table ── */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 440 }}>
          <thead>
            <tr style={{ background: '#0A1628' }}>
              <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid rgba(255,255,255,0.15)' }}>
                Period
              </th>
              <th style={{ textAlign: 'right', padding: '10px 16px', fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid rgba(255,255,255,0.15)' }}>
                ARM Rate
              </th>
              <th style={{ textAlign: 'right', padding: '10px 16px', fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid rgba(255,255,255,0.15)' }}>
                ARM P&amp;I
              </th>
              <th style={{ textAlign: 'right', padding: '10px 16px', fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid rgba(255,255,255,0.15)' }}>
                Fixed P&amp;I
              </th>
              <th style={{ textAlign: 'right', padding: '10px 16px', fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid rgba(255,255,255,0.15)' }}>
                Monthly Delta
              </th>
            </tr>
          </thead>
          <tbody>
            {yearRows.map((row, i) => {
              const isBg = i % 2 === 0
              const deltaColor = row.monthlyDelta < 0 ? '#4CC98A' : '#ef4444'
              const deltaSign = row.monthlyDelta < 0 ? '−' : '+'

              return (
                <tr
                  key={row.year}
                  style={{
                    background: row.isArmPeriod
                      ? (isBg ? 'rgba(201,168,76,0.05)' : 'var(--sc-card)')
                      : '#1a0a0a',
                  }}
                >
                  <td style={{ ...tdLabel, fontWeight: row.isArmPeriod ? 400 : 600 }}>
                    {row.label}
                    {row.isArmPeriod && (
                      <span style={{ fontSize: 9, color: '#C9A84C', marginLeft: 6, background: 'rgba(201,168,76,0.1)', padding: '1px 5px', borderRadius: 4, border: '1px solid rgba(201,168,76,0.3)' }}>
                        ARM FIXED
                      </span>
                    )}
                    {!row.isArmPeriod && (
                      <span style={{ fontSize: 9, color: '#ef4444', marginLeft: 6, background: 'rgba(239,68,68,0.08)', padding: '1px 5px', borderRadius: 4, border: '1px solid rgba(239,68,68,0.25)' }}>
                        WORST CASE
                      </span>
                    )}
                  </td>
                  <td style={{ ...td, color: row.isArmPeriod ? '#C9A84C' : '#ef4444', fontWeight: 600 }}>
                    {fmtRate(row.rate)}
                  </td>
                  <td style={td}>
                    {fmtCurrency(row.pi)}
                    <span style={{ fontSize: 9, color: 'var(--sc-muted)', marginLeft: 3 }}>/mo</span>
                  </td>
                  <td style={{ ...td, color: 'var(--sc-muted)' }}>
                    {fmtCurrency(fixedPI)}
                    <span style={{ fontSize: 9, color: 'var(--sc-muted)', marginLeft: 3 }}>/mo</span>
                  </td>
                  <td style={{ ...td, fontWeight: 700, color: deltaColor }}>
                    {deltaSign}{fmtCurrency(row.monthlyDelta)}/mo
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── Context box for worst-case ── */}
      {worstCaseExtra > 0 && breakEvenMonthsAfterReset !== null && (
        <div className="px-5 py-3 flex items-start gap-3" style={{ background: 'rgba(239,68,68,0.05)', borderTop: '1px solid rgba(239,68,68,0.15)' }}>
          <div style={{ fontSize: 14, color: '#ef4444', flexShrink: 0, marginTop: 1 }}>⚠</div>
          <p style={{ fontSize: 11, color: 'rgba(239,68,68,0.85)', fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.5 }}>
            If the ARM resets to {fmtRate(worstCaseRate)} after Year 5, the payment jumps {fmtCurrency(worstCasePI)}/mo (+{fmtCurrency(worstCaseExtra)}/mo vs. fixed).
            {' '}The 5-yr savings of {fmtCurrency(fiveYrSavings)} would be erased in {breakEvenMonthsAfterReset <= remainingMonths ? `~${Math.ceil(breakEvenMonthsAfterReset / 12)} yr${Math.ceil(breakEvenMonthsAfterReset / 12) !== 1 ? 's' : ''} after reset` : 'the remaining loan term (ARM still wins)'}.
            {' '}<strong>If you plan to sell or refi before Year {5 + Math.ceil(breakEvenMonthsAfterReset / 12)}, the ARM saves money.</strong>
          </p>
        </div>
      )}

      {/* ── Compliance footer ── */}
      <div className="px-5 py-3" style={{ background: 'var(--sc-card)', borderTop: '1px solid var(--sc-border)' }}>
        <p className="text-[10px] italic" style={{ color: 'var(--sc-muted)', fontFamily: "'IBM Plex Mono', monospace" }}>
          ARM rate shown is estimated at {ARM_DISCOUNT}% below the 30-yr fixed rate — actual ARM rates vary by lender and market conditions.
          Worst-case scenario assumes a {WORST_CASE_PREMIUM}% rate increase at the first adjustment (Year 5); actual caps depend on loan terms.
          This analysis is illustrative only. ARM loans carry interest rate risk — payment amounts may increase significantly after the fixed period.
          Not a product recommendation. Approval and eligibility subject to underwriting.
        </p>
      </div>

    </div>
  )
}
