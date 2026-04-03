'use client'

import { useMemo } from 'react'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceDot,
} from 'recharts'
import type { DisplayData } from '@/lib/scenarios/displayData'

const SEGMENT_COLORS = {
  pi: '#5b8def',
  tax: '#a78bfa',
  insurance: '#4CC98A',
  hoa: '#f97316',
  pmi: '#ec4899',
}

const fmtK = (v: number) => {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}K`
  return `$${v.toFixed(0)}`
}

const fmtCurrency = (v: number) => '$' + Math.round(v).toLocaleString('en-US')

const tooltipStyle = {
  contentStyle: {
    background: 'var(--sc-card)',
    border: '1px solid var(--sc-border)',
    borderRadius: 10,
    fontSize: 11,
    color: 'var(--sc-text)',
  },
  labelStyle: { color: 'var(--sc-muted)' },
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[14px] p-5" style={{ background: 'var(--sc-card)', border: '1px solid var(--sc-border)' }}>
      <h4 className="text-sm font-semibold mb-1" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{title}</h4>
      {subtitle && <p className="text-[10px] mb-4" style={{ color: 'var(--sc-muted)' }}>{subtitle}</p>}
      {!subtitle && <div className="mb-5" />}
      {children}
    </div>
  )
}

export { MonthlyPaymentChart, CumulativeSavingsChart }

export default function ScenarioCharts({ data }: { data: DisplayData }) {
  if (!data.rows.length) return null
  return (
    <div className="space-y-5">
      <MonthlyPaymentChart data={data} />
      <CumulativeSavingsChart data={data} />
    </div>
  )
}

// ─── Chart 1: Monthly Payment Comparison (Stacked) ──────────────
function MonthlyPaymentChart({ data }: { data: DisplayData }) {
  const hasHOA = data.rows.some(r => r.hoa > 0)
  const hasPMI = data.rows.some(r => r.pmi > 0)

  const chartData = useMemo(() => data.rows.map(r => ({
    name: r.label,
    'P&I': Math.round(r.monthlyPI),
    'Property Tax': Math.round(r.propertyTaxes),
    Insurance: Math.round(r.homeownersInsurance),
    ...(hasHOA ? { HOA: Math.round(r.hoa) } : {}),
    ...(hasPMI ? { PMI: Math.round(r.pmi) } : {}),
  })), [data, hasHOA, hasPMI])

  const segments: { key: string; color: string }[] = [
    { key: 'P&I', color: SEGMENT_COLORS.pi },
    { key: 'Property Tax', color: SEGMENT_COLORS.tax },
    { key: 'Insurance', color: SEGMENT_COLORS.insurance },
    ...(hasHOA ? [{ key: 'HOA', color: SEGMENT_COLORS.hoa }] : []),
    ...(hasPMI ? [{ key: 'PMI', color: SEGMENT_COLORS.pmi }] : []),
  ]

  return (
    <ChartCard title="Monthly Payment Comparison" subtitle="Total monthly cost broken down by component">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} margin={{ top: 28, right: 10, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--sc-border)" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: 'var(--sc-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={fmtK} tick={{ fill: 'var(--sc-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            {...tooltipStyle}
            formatter={(v: any) => [fmtCurrency(Number(v))]} // eslint-disable-line @typescript-eslint/no-explicit-any
          />
          <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }} iconType="circle" iconSize={8} />
          {segments.map((seg, i) => (
            <Bar
              key={seg.key}
              dataKey={seg.key}
              stackId="payment"
              fill={seg.color}
              radius={i === segments.length - 1 ? [6, 6, 0, 0] : [0, 0, 0, 0]}
              maxBarSize={80}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// ─── Chart 2: Cumulative Savings / Break-Even ───────────────────
function CumulativeSavingsChart({ data }: { data: DisplayData }) {
  const CHART_COLORS = ['#5b8def', '#C9A84C', '#4CC98A', '#a78bfa']
  const { cumulativeSavingsData, rows, breakEvenRows } = data

  const chartLabels = data.mode === 'purchase'
    ? rows.filter((_, i) => i !== 0).map(r => r.label)
    : rows.map(r => r.label)

  if (!chartLabels.length) return null

  return (
    <ChartCard title="Cumulative Savings vs. Baseline (7 Years)" subtitle="Positive = savings ahead of baseline. Gold dot = break-even point.">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={cumulativeSavingsData} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--sc-border)" />
          <XAxis
            dataKey="month"
            tick={{ fill: 'var(--sc-muted)', fontSize: 10 }}
            label={{ value: 'Months', position: 'insideBottom', offset: -10, fill: 'var(--sc-muted)', fontSize: 10 }}
          />
          <YAxis tickFormatter={fmtK} tick={{ fill: 'var(--sc-muted)', fontSize: 10 }} />
          <Tooltip
            {...tooltipStyle}
            formatter={(v: any, name: any) => [fmtK(Number(v)), name]} // eslint-disable-line @typescript-eslint/no-explicit-any
            labelFormatter={(month: any) => `Month ${month}`} // eslint-disable-line @typescript-eslint/no-explicit-any
          />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
          {chartLabels.map((label, i) => (
            <Line
              key={label}
              type="monotone"
              dataKey={label}
              stroke={CHART_COLORS[i % CHART_COLORS.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
          {breakEvenRows.map((dot, i) => (
            <ReferenceDot
              key={i}
              x={dot.breakEvenMonths}
              y={0}
              r={5}
              fill="#C9A84C"
              stroke="var(--sc-card)"
              strokeWidth={2}
              label={{
                value: `Break-even: Mo ${dot.breakEvenMonths}`,
                position: 'top',
                fontSize: 9,
                fill: 'var(--sc-accent)',
                fontFamily: "'IBM Plex Mono', monospace",
              }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
