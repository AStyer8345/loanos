'use client'

import { useMemo } from 'react'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceDot, Cell, LabelList,
} from 'recharts'
import type { DisplayData } from '@/lib/scenarios/displayData'

const CHART_COLORS = ['#5b8def', '#C9A84C', '#4CC98A', '#a78bfa']

const fmtK = (v: number) => {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}K`
  return `$${v.toFixed(0)}`
}

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

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[14px] p-5" style={{ background: 'var(--sc-card)', border: '1px solid var(--sc-border)' }}>
      <h4 className="text-sm font-semibold mb-5" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{title}</h4>
      {children}
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function BarTopLabel(props: any) {
  const { x, y, width, value } = props
  if (!value) return null
  return (
    <text
      x={x + width / 2}
      y={y - 6}
      textAnchor="middle"
      fontSize={10}
      fontWeight={600}
      fontFamily="'IBM Plex Mono', monospace"
      fill="var(--sc-text)"
    >
      {fmtK(value)}
    </text>
  )
}

export default function ScenarioCharts({ data }: { data: DisplayData }) {
  if (!data.rows.length) return null
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <MonthlyPaymentChart data={data} />
      <TotalInterestChart data={data} />
      <div className="lg:col-span-2">
        <CumulativeSavingsChart data={data} />
      </div>
    </div>
  )
}

// ─── Chart 1: Monthly Payment Comparison ─────────────────────────
function MonthlyPaymentChart({ data }: { data: DisplayData }) {
  const chartData = useMemo(() => data.rows.map(r => ({
    name: r.label,
    payment: Math.round(r.totalMonthlyPayment),
    isRecommended: r.isRecommended,
  })), [data])

  return (
    <ChartCard title="Monthly Payment by Scenario">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} margin={{ top: 28, right: 10, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--sc-border)" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: 'var(--sc-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={fmtK} tick={{ fill: 'var(--sc-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            {...tooltipStyle}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(v: any) => [`$${Number(v).toLocaleString()}`, 'Monthly Payment']}
          />
          <Bar dataKey="payment" radius={[6, 6, 0, 0]} maxBarSize={80}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.isRecommended ? '#C9A84C' : CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
            <LabelList content={<BarTopLabel />} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// ─── Chart 2: Total Interest Paid ────────────────────────────────
function TotalInterestChart({ data }: { data: DisplayData }) {
  const firstInterest = data.rows[0]?.totalInterest ?? 0
  const chartData = useMemo(() => data.rows.map(r => {
    const diff = firstInterest - r.totalInterest
    return {
      name: r.label,
      interest: Math.round(r.totalInterest),
      diff: Math.round(diff),
      isRecommended: r.isRecommended,
    }
  }), [data, firstInterest])

  return (
    <ChartCard title="Total Interest Paid">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} margin={{ top: 28, right: 10, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--sc-border)" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: 'var(--sc-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={fmtK} tick={{ fill: 'var(--sc-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            {...tooltipStyle}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(v: any, _: any, props: any) => {
              const diff = props?.payload?.diff ?? 0
              const suffix = diff > 0 ? ` (saves ${fmtK(diff)} vs. first)` : diff < 0 ? ` (costs ${fmtK(-diff)} more)` : ''
              return [`$${Number(v).toLocaleString()}${suffix}`, 'Total Interest']
            }}
          />
          <Bar dataKey="interest" radius={[6, 6, 0, 0]} maxBarSize={80}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.isRecommended ? '#C9A84C' : CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
            <LabelList content={<BarTopLabel />} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// ─── Chart 3: Cumulative Savings / Break-Even ─────────────────────
function CumulativeSavingsChart({ data }: { data: DisplayData }) {
  const { cumulativeSavingsData, rows, breakEvenRows } = data

  // For purchase: skip baseline (index 0). For refi: show all.
  const chartLabels = data.mode === 'purchase'
    ? rows.filter((_, i) => i !== 0).map(r => r.label)
    : rows.map(r => r.label)

  if (!chartLabels.length) return null

  return (
    <ChartCard title="Cumulative Savings vs. Baseline (7 Years)">
      <div className="text-[10px] mb-3" style={{ color: 'var(--sc-muted)' }}>
        Positive = savings ahead of baseline. Gold dot = break-even point.
      </div>
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(v: any, name: any) => [fmtK(Number(v)), name]}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            labelFormatter={(month: any) => `Month ${month}`}
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
                fill: '#C9A84C',
                fontFamily: "'IBM Plex Mono', monospace",
              }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
