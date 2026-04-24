'use client'

import { useState } from 'react'
import type { DisplayData } from '@/lib/scenarios/displayData'
import { GOLD, TEXT, MUTED, CARD_BG, BORDER, fmtCurrency, fmtRate } from './constants'

interface Props {
  displayData: DisplayData
}

interface Row {
  label: string
  value: string
  bold?: boolean
  gold?: boolean
}

function buildRows(
  row: DisplayData['rows'][number],
  mode: 'purchase' | 'refinance',
  hasPropertyTax: boolean,
  hasInsurance: boolean,
  hasHOA: boolean,
  hasPMI: boolean,
  hasSavings: boolean,
): Row[] {
  const rows: Row[] = []

  if (mode === 'purchase' && row.purchasePrice) {
    rows.push({ label: 'Purchase Price', value: fmtCurrency(row.purchasePrice) })
  }
  rows.push({ label: 'Loan Amount', value: fmtCurrency(row.loanAmount) })
  rows.push({ label: 'Interest Rate', value: fmtRate(row.interestRate) })
  rows.push({ label: 'APR', value: fmtRate(row.apr) })
  rows.push({ label: 'Monthly Payment', value: fmtCurrency(row.totalMonthlyPayment), bold: true })
  rows.push({ label: '  P&I', value: fmtCurrency(row.monthlyPI) })
  if (hasPropertyTax) rows.push({ label: '  Property Tax', value: row.propertyTaxes > 0 ? fmtCurrency(row.propertyTaxes) : '—' })
  if (hasInsurance) rows.push({ label: '  Insurance', value: row.homeownersInsurance > 0 ? fmtCurrency(row.homeownersInsurance) : '—' })
  if (hasHOA) rows.push({ label: '  HOA', value: row.hoa > 0 ? fmtCurrency(row.hoa) : '—' })
  if (hasPMI) rows.push({ label: '  PMI', value: row.pmi > 0 ? fmtCurrency(row.pmi) : '—' })
  rows.push({ label: mode === 'purchase' ? 'Cash to Close' : 'Closing Costs', value: fmtCurrency(row.cashToClose), bold: true })
  rows.push({ label: 'Total Interest', value: fmtCurrency(row.totalInterest) })
  if (hasSavings) {
    const savings = row.monthlySavingsVsCurrent ?? 0
    rows.push({ label: 'Monthly Savings', value: savings > 0 ? `+${fmtCurrency(savings)}/mo` : '—', gold: savings > 0 })
  }
  return rows
}

export default function MobileComparisonCards({ displayData }: Props) {
  const { rows, mode } = displayData
  const [activeIndex, setActiveIndex] = useState(0)

  if (rows.length < 2) return null

  const commonlyChosenIndex = rows.reduce((best, row, i) => {
    const bestPmt = rows[best].totalMonthlyPayment
    const rowPmt = row.totalMonthlyPayment
    return rowPmt > 0 && (bestPmt === 0 || rowPmt < bestPmt) ? i : best
  }, 0)

  const hasPropertyTax = rows.some(r => r.propertyTaxes > 0)
  const hasInsurance = rows.some(r => r.homeownersInsurance > 0)
  const hasHOA = rows.some(r => r.hoa > 0)
  const hasPMI = rows.some(r => r.pmi > 0)
  const hasSavings = rows.some(r => (r.monthlySavingsVsCurrent ?? 0) > 0)

  const activeRow = rows[activeIndex]
  const isChosen = activeIndex === commonlyChosenIndex
  const dataRows = buildRows(activeRow, mode, hasPropertyTax, hasInsurance, hasHOA, hasPMI, hasSavings)

  return (
    <div className="md:hidden print:hidden">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-3">
        <div style={{ width: 16, height: 1, background: GOLD }} />
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: GOLD }}>
          Side-by-Side Comparison
        </p>
      </div>

      {/* Card */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: CARD_BG,
          border: `1px solid ${isChosen ? `${GOLD}60` : BORDER}`,
        }}
      >
        {/* Card header — option name + badge */}
        <div
          className="px-5 py-4 flex items-center justify-between"
          style={{
            borderBottom: `1px solid ${BORDER}`,
            background: isChosen ? `${GOLD}09` : 'transparent',
          }}
        >
          <span
            className="text-sm font-semibold"
            style={{ color: isChosen ? GOLD : TEXT, fontFamily: "'IBM Plex Mono', monospace" }}
          >
            {activeRow.label}
          </span>
          {isChosen && (
            <span
              className="text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
              style={{
                background: `${GOLD}18`,
                color: GOLD,
                border: `1px solid ${GOLD}40`,
              }}
            >
              ★ Commonly Chosen
            </span>
          )}
        </div>

        {/* Data rows */}
        <div>
          {dataRows.map((r, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-5"
              style={{
                paddingTop: 8,
                paddingBottom: 8,
                borderBottom: `1px solid rgba(255,255,255,0.04)`,
                background: r.bold ? 'rgba(255,255,255,0.025)' : 'transparent',
              }}
            >
              <span
                className="text-[11px]"
                style={{ color: r.gold ? GOLD : MUTED, fontWeight: r.bold ? 600 : 400 }}
              >
                {r.label}
              </span>
              <span
                className="text-[12px]"
                style={{
                  color: r.gold ? GOLD : r.bold ? TEXT : TEXT,
                  fontWeight: r.bold ? 700 : 400,
                  fontFamily: "'IBM Plex Mono', monospace",
                }}
              >
                {r.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation — dots + prev/next */}
      <div className="flex items-center justify-between mt-4 px-1">
        <button
          onClick={() => setActiveIndex(i => Math.max(0, i - 1))}
          disabled={activeIndex === 0}
          className="px-4 py-2 rounded-lg text-xs font-medium transition-opacity"
          style={{
            background: `${GOLD}15`,
            color: activeIndex === 0 ? MUTED : GOLD,
            border: `1px solid ${activeIndex === 0 ? 'transparent' : `${GOLD}30`}`,
            opacity: activeIndex === 0 ? 0.4 : 1,
          }}
        >
          ← Prev
        </button>

        {/* Dot indicators */}
        <div className="flex items-center gap-2">
          {rows.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              style={{
                width: i === activeIndex ? 20 : 6,
                height: 6,
                borderRadius: 3,
                background: i === activeIndex ? GOLD : `${GOLD}30`,
                transition: 'all 0.2s ease',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
              }}
            />
          ))}
        </div>

        <button
          onClick={() => setActiveIndex(i => Math.min(rows.length - 1, i + 1))}
          disabled={activeIndex === rows.length - 1}
          className="px-4 py-2 rounded-lg text-xs font-medium transition-opacity"
          style={{
            background: `${GOLD}15`,
            color: activeIndex === rows.length - 1 ? MUTED : GOLD,
            border: `1px solid ${activeIndex === rows.length - 1 ? 'transparent' : `${GOLD}30`}`,
            opacity: activeIndex === rows.length - 1 ? 0.4 : 1,
          }}
        >
          Next →
        </button>
      </div>

      {/* Position hint */}
      <p className="text-center mt-2 text-[10px]" style={{ color: MUTED }}>
        {activeIndex + 1} of {rows.length} options
      </p>
    </div>
  )
}
