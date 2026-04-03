'use client'

import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import type { ScenarioDisplayRow } from '@/lib/scenarios/displayData'
import { TEXT, MUTED, CARD_BG, BORDER, fmtCurrency, fmtK } from './constants'

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
  })), [rows, hasHOA, hasPMI])

  if (rows.length < 2) return null

  const segments: { key: string; color: string }[] = [
    { key: 'P&I', color: SEGMENT_COLORS.pi },
    { key: 'Property Tax', color: SEGMENT_COLORS.tax },
    { key: 'Insurance', color: SEGMENT_COLORS.insurance },
    ...(hasHOA ? [{ key: 'HOA', color: SEGMENT_COLORS.hoa }] : []),
    ...(hasPMI ? [{ key: 'PMI', color: SEGMENT_COLORS.pmi }] : []),
  ]

  return (
    <div className="rounded-2xl p-5" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
      <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: '#C9A84C' }}>
        Monthly Payment Comparison
      </p>
      <p className="text-[10px] mb-4" style={{ color: MUTED }}>
        Total monthly cost broken down by component
      </p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
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
            formatter={(v: any) => fmtCurrency(Number(v))} // eslint-disable-line @typescript-eslint/no-explicit-any
          />
          <Legend
            wrapperStyle={{ fontSize: 10, color: MUTED, paddingTop: 8 }}
            iconType="circle"
            iconSize={8}
          />
          {segments.map((seg, i) => (
            <Bar
              key={seg.key}
              dataKey={seg.key}
              stackId="payment"
              fill={seg.color}
              radius={i === segments.length - 1 ? [8, 8, 0, 0] : [0, 0, 0, 0]}
              maxBarSize={90}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
