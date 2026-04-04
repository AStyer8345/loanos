'use client'

import { useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend, CartesianGrid, ReferenceLine,
} from 'recharts'
import type { ScenarioDisplayRow } from '@/lib/scenarios/displayData'
import { TEXT, MUTED, CARD_BG, BORDER, GOLD, fmtK, fmtCurrency } from './constants'

const BALANCE_COLOR = '#ef4444'
const EQUITY_COLOR = GOLD        // #C9A84C
const APPRECIATION_RATE = 0.03   // 3% annual

interface ShareEquityChartProps {
  rows: ScenarioDisplayRow[]
}

interface EquityDataPoint {
  year: number
  'Loan Balance': number
  'Home Equity': number
}

function buildEquityCurve(row: ScenarioDisplayRow): EquityDataPoint[] {
  const { loanAmount, interestRate, downPaymentAmount, purchasePrice } = row
  if (!loanAmount || !interestRate) return []

  const monthlyRate = interestRate / 100 / 12
  const n = 360 // 30yr fixed
  const monthlyPI = monthlyRate > 0
    ? loanAmount * monthlyRate / (1 - Math.pow(1 + monthlyRate, -n))
    : loanAmount / n

  let balance = loanAmount
  const initialEquity = downPaymentAmount ?? 0
  const baseHomeValue = purchasePrice ?? (loanAmount + initialEquity)

  const points: EquityDataPoint[] = []

  for (let year = 0; year <= 30; year++) {
    const homeValue = baseHomeValue * Math.pow(1 + APPRECIATION_RATE, year)
    const equity = homeValue - balance

    points.push({
      year,
      'Loan Balance': Math.round(Math.max(balance, 0)),
      'Home Equity': Math.round(Math.max(equity, 0)),
    })

    // Advance 12 months of amortization
    for (let m = 0; m < 12; m++) {
      const interest = balance * monthlyRate
      const principal = monthlyPI - interest
      balance = Math.max(balance - principal, 0)
      if (balance <= 0) break
    }
  }

  return points
}

interface TooltipEntry {
  name: string
  value: number
  color: string
}

interface TooltipProps {
  active?: boolean
  payload?: TooltipEntry[]
  label?: number
}

function EquityTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div
      style={{
        background: '#1a1a1a',
        border: `1px solid ${BORDER}`,
        borderRadius: 12,
        padding: '10px 14px',
        fontSize: 12,
        color: TEXT,
        fontFamily: "'IBM Plex Mono', monospace",
        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
      }}
    >
      <p style={{ color: GOLD, fontWeight: 600, marginBottom: 6 }}>Year {label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color, marginBottom: 2 }}>
          {entry.name}: {fmtCurrency(entry.value)}
        </p>
      ))}
      <p style={{ color: MUTED, fontSize: 10, marginTop: 6 }}>
        Net equity: {fmtCurrency(payload.find(p => p.name === 'Home Equity')?.value ?? 0)}
      </p>
    </div>
  )
}

export default function ShareEquityChart({ rows }: ShareEquityChartProps) {
  // Use the lowest-payment scenario as the base (most borrower-relevant)
  const baseRow = useMemo(() => {
    if (!rows.length) return null
    return rows.reduce((best, r) =>
      r.totalMonthlyPayment > 0 && r.totalMonthlyPayment < (best?.totalMonthlyPayment ?? Infinity) ? r : best
    , rows[0])
  }, [rows])

  const data = useMemo(() =>
    baseRow ? buildEquityCurve(baseRow) : []
  , [baseRow])

  if (!baseRow || !data.length || !baseRow.loanAmount || !baseRow.interestRate) return null

  // Find crossover year (when equity exceeds balance)
  const crossoverYear = data.find(d => d['Home Equity'] >= d['Loan Balance'])?.year

  return (
    <div
      className="rounded-2xl p-6"
      style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
    >
      <p
        className="text-[11px] font-semibold uppercase tracking-[0.15em] mb-1"
        style={{ color: GOLD }}
      >
        Equity Build Over Time
      </p>
      <p className="text-sm mb-1" style={{ color: MUTED }}>
        Your equity grows as your balance declines — and appreciation accelerates the gap.
      </p>
      {crossoverYear !== undefined && (
        <p className="text-sm mb-6 font-semibold" style={{ color: EQUITY_COLOR }}>
          Equity exceeds loan balance in Year {crossoverYear} →
        </p>
      )}

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={`${BORDER}`} vertical={false} />
          <XAxis
            dataKey="year"
            tick={{ fill: `${MUTED}`, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            label={{ value: 'Year', position: 'insideBottomRight', offset: -4, fill: MUTED, fontSize: 11 }}
          />
          <YAxis
            tickFormatter={fmtK}
            tick={{ fill: `${MUTED}`, fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={52}
          />
          <Tooltip content={<EquityTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 11, color: MUTED, paddingTop: 12 }}
            iconType="circle"
            iconSize={8}
          />
          {crossoverYear !== undefined && (
            <ReferenceLine
              x={crossoverYear}
              stroke={EQUITY_COLOR}
              strokeDasharray="4 4"
              strokeOpacity={0.5}
            />
          )}
          <Line
            type="monotone"
            dataKey="Loan Balance"
            stroke={BALANCE_COLOR}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: BALANCE_COLOR }}
          />
          <Line
            type="monotone"
            dataKey="Home Equity"
            stroke={EQUITY_COLOR}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, fill: EQUITY_COLOR }}
          />
        </LineChart>
      </ResponsiveContainer>

      <p className="text-[10px] mt-4" style={{ color: `${MUTED}99` }}>
        Illustrative only. Assumes {(APPRECIATION_RATE * 100).toFixed(0)}% annual appreciation and fixed rate for full term.
        Actual home values and balance paydown will vary. Not a guarantee of future value.
      </p>
    </div>
  )
}
