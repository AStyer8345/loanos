'use client'

import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, LabelList,
} from 'recharts'
import type { ScenarioDisplayRow } from '@/lib/scenarios/displayData'
import { GOLD, TEXT, MUTED, CARD_BG, BORDER, fmtCurrency, fmtK } from './constants'

const BAR_COLORS = ['#5b8def', '#a78bfa', '#4CC98A', '#f97316']

function TopLabel(props: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
  const { x, y, width, value } = props
  if (!value) return null
  return (
    <text
      x={x + width / 2}
      y={y - 8}
      textAnchor="middle"
      fontSize={12}
      fontWeight={700}
      fontFamily="'IBM Plex Mono', monospace"
      fill={TEXT}
    >
      {fmtK(value)}
    </text>
  )
}

interface PaymentComparisonChartProps {
  rows: ScenarioDisplayRow[]
  recommendedIdx: number
}

export default function PaymentComparisonChart({ rows, recommendedIdx }: PaymentComparisonChartProps) {
  const chartData = useMemo(() => rows.map((r, i) => ({
    name: r.label,
    payment: Math.round(r.totalMonthlyPayment),
    isWinner: i === recommendedIdx,
  })), [rows, recommendedIdx])

  if (rows.length < 2) return null

  return (
    <div className="rounded-2xl p-5" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
      <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: GOLD }}>
        Monthly Payment Comparison
      </p>
      <p className="text-[10px] mb-4" style={{ color: MUTED }}>
        Total monthly cost including taxes, insurance &amp; escrow
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 24, right: 10, bottom: 0, left: 0 }}>
          <XAxis
            dataKey="name"
            tick={{ fill: MUTED, fontSize: 11, fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={fmtK}
            tick={{ fill: `${MUTED}80`, fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={50}
          />
          <Tooltip
            contentStyle={{
              background: '#1a1a1a',
              border: `1px solid ${BORDER}`,
              borderRadius: 10,
              fontSize: 12,
              color: TEXT,
              fontFamily: "'IBM Plex Mono', monospace",
            }}
            labelStyle={{ color: MUTED }}
            formatter={(v: any) => [fmtCurrency(Number(v)), 'Monthly Payment']} // eslint-disable-line @typescript-eslint/no-explicit-any
          />
          <Bar dataKey="payment" radius={[8, 8, 0, 0]} maxBarSize={90}>
            {chartData.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.isWinner ? GOLD : BAR_COLORS[i % BAR_COLORS.length]}
                opacity={entry.isWinner ? 1 : 0.6}
              />
            ))}
            <LabelList content={<TopLabel />} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
