'use client'

import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend, Cell, LabelList,
} from 'recharts'
import type { ScenarioDisplayRow } from '@/lib/scenarios/displayData'
import { TEXT, MUTED, CARD_BG, BORDER, GOLD, fmtCurrency, fmtK } from './constants'

const SEGMENT_COLORS = {
  pi: '#5b8def',
  tax: '#a78bfa',
  insurance: '#4CC98A',
  hoa: '#f97316',
  pmi: '#ec4899',
}

interface PaymentComparisonChartProps {
  rows: ScenarioDisplayRow[]
}

export default function PaymentComparisonChart({ rows }: PaymentComparisonChartProps) {
  const hasHOA = rows.some(r => r.hoa > 0)
  const hasPMI = rows.some(r => r.pmi > 0)

  const chartData = useMemo(() => rows.map((r) => ({
    name: r.label,
    'P&I': Math.round(r.monthlyPI),
    'Property Tax': Math.round(r.propertyTaxes),
    Insurance: Math.round(r.homeownersInsurance),
    ...(hasHOA ? { HOA: Math.round(r.hoa) } : {}),
    ...(hasPMI ? { PMI: Math.round(r.pmi) } : {}),
    total: Math.round(r.totalMonthlyPayment),
  })), [rows, hasHOA, hasPMI])

  if (rows.length < 2) return null

  const segments: { key: string; color: string }[] = [
    { key: 'P&I', color: SEGMENT_COLORS.pi },
    { key: 'Property Tax', color: SEGMENT_COLORS.tax },
    { key: 'Insurance', color: SEGMENT_COLORS.insurance },
    ...(hasHOA ? [{ key: 'HOA', color: SEGMENT_COLORS.hoa }] : []),
    ...(hasPMI ? [{ key: 'PMI', color: SEGMENT_COLORS.pmi }] : []),
  ]

  // Find the lowest-payment option index
  const lowestIdx = rows.reduce(
    (min, r, i) => (r.totalMonthlyPayment < rows[min].totalMonthlyPayment ? i : min),
    0,
  )

  return (
    <div className="rounded-2xl p-6" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
      <p
        className="text-[11px] font-semibold uppercase tracking-[0.15em] mb-1"
        style={{ color: GOLD }}
      >
        Monthly Payment Comparison
      </p>
      <p className="text-sm mb-6" style={{ color: MUTED }}>
        See how each option breaks down — the lowest total is highlighted.
      </p>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData} margin={{ top: 30, right: 10, bottom: 0, left: 0 }}>
          <XAxis
            dataKey="name"
            tick={{ fill: TEXT, fontSize: 12, fontWeight: 600 }}
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
              borderRadius: 12,
              fontSize: 12,
              color: TEXT,
              fontFamily: "'IBM Plex Mono', monospace",
              boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            }}
            labelStyle={{ color: GOLD, fontWeight: 600 }}
            formatter={(v: any) => fmtCurrency(Number(v))} // eslint-disable-line @typescript-eslint/no-explicit-any
          />
          <Legend
            wrapperStyle={{ fontSize: 11, color: MUTED, paddingTop: 12 }}
            iconType="circle"
            iconSize={8}
          />
          {segments.map((seg, i) => {
            const isLast = i === segments.length - 1
            return (
              <Bar
                key={seg.key}
                dataKey={seg.key}
                stackId="payment"
                fill={seg.color}
                radius={isLast ? [6, 6, 0, 0] : [0, 0, 0, 0]}
                maxBarSize={80}
              >
                {/* Only put total label on the top segment */}
                {isLast && (
                  <LabelList
                    dataKey="total"
                    position="top"
                    formatter={(v: any) => fmtCurrency(Number(v))} // eslint-disable-line @typescript-eslint/no-explicit-any
                    style={{
                      fill: TEXT,
                      fontSize: 12,
                      fontWeight: 700,
                      fontFamily: "'IBM Plex Mono', monospace",
                    }}
                  />
                )}
                {/* Highlight lowest payment bar */}
                {chartData.map((_, idx) => (
                  <Cell
                    key={idx}
                    fill={seg.color}
                    fillOpacity={idx === lowestIdx ? 1 : 0.7}
                  />
                ))}
              </Bar>
            )
          })}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
