'use client'

import { useState, useMemo } from 'react'
import {
  BarChart, Bar, AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import type {
  ScenarioMode, PurchaseScenarioInput, PurchaseCalculatedResult,
  RefiScenarioInput, RefiCalculatedResult,
} from '@/lib/scenarios/types'

const COLORS = ['#5b8def', '#4ade80', '#a78bfa', '#f87171']

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fmtTooltipCurrency = (value: any) => typeof value === 'number' ? `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : String(value ?? '')
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fmtTooltipK = (value: any) => typeof value === 'number' ? (value >= 1000 ? `$${(value / 1000).toFixed(0)}k` : `$${value.toLocaleString()}`) : String(value ?? '')

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[14px] p-5" style={{ background: 'var(--sc-card)', border: '1px solid var(--sc-border)' }}>
      <h4 className="text-sm font-semibold mb-5" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{title}</h4>
      {children}
    </div>
  )
}

function HorizonToggle({ value, onChange, options }: { value: number; onChange: (v: number) => void; options: number[] }) {
  return (
    <div className="flex gap-1.5 mb-4">
      {options.map(o => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className="px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors"
          style={{
            background: value === o ? 'var(--sc-accent)' : 'transparent',
            color: value === o ? '#ffffff' : 'var(--sc-muted)',
            border: `1px solid ${value === o ? 'var(--sc-accent)' : 'var(--sc-border)'}`,
          }}
        >
          {o}yr
        </button>
      ))}
    </div>
  )
}

const fmtK = (v: number) => {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}K`
  return `$${v.toFixed(0)}`
}

const tooltipStyle = {
  contentStyle: { background: 'var(--sc-card)', border: '1px solid var(--sc-border)', borderRadius: '10px', fontSize: '11px', color: 'var(--sc-text)' },
  labelStyle: { color: 'var(--sc-muted)' },
}

export default function ScenarioCharts({ mode, purchaseScenarios, purchaseResults, refiScenarios, refiResults }: {
  mode: ScenarioMode
  purchaseScenarios: PurchaseScenarioInput[]
  purchaseResults: PurchaseCalculatedResult[]
  refiScenarios: RefiScenarioInput[]
  refiResults: RefiCalculatedResult[]
}) {
  const scenarios = mode === 'purchase' ? purchaseScenarios : refiScenarios
  const results = mode === 'purchase' ? purchaseResults : refiResults

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <MonthlyPaymentChart mode={mode} scenarios={scenarios} results={results} />
      <EquityChart mode={mode} scenarios={scenarios} results={results} />
      <SavingsChart mode={mode} scenarios={scenarios} results={results} />
      <AmortizationChart mode={mode} scenarios={scenarios} results={results} />
    </div>
  )
}

// ─── Chart 1: Monthly Payment Comparison (Stacked Bar) ──────────

function MonthlyPaymentChart({ mode, scenarios, results }: {
  mode: ScenarioMode; scenarios: (PurchaseScenarioInput | RefiScenarioInput)[]; results: (PurchaseCalculatedResult | RefiCalculatedResult)[]
}) {
  const data = useMemo(() => {
    return results.map((r, i) => {
      const s = scenarios[i]
      if (mode === 'purchase') {
        const pr = r as PurchaseCalculatedResult
        const ps = s as PurchaseScenarioInput
        return {
          name: ps.label || `Option ${i + 1}`,
          'P&I': pr.monthlyPI,
          'Taxes': ps.propertyTaxes,
          'Insurance': ps.homeownersInsurance,
          'HOA': ps.hoa,
          'PMI': ps.pmi,
        }
      } else {
        const rr = r as RefiCalculatedResult
        const rs = s as RefiScenarioInput
        return {
          name: rs.label || `Option ${i + 1}`,
          'P&I': rr.newMonthlyPI,
          'Taxes': rs.propertyTaxes,
          'Insurance': rs.insurance,
          'HOA': rs.hoa,
          'PMI': rs.pmi,
        }
      }
    })
  }, [mode, scenarios, results])

  return (
    <ChartCard title="Monthly Payment Comparison">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} barCategoryGap="20%">
          <CartesianGrid strokeDasharray="3 3" stroke="var(--sc-border)" />
          <XAxis dataKey="name" tick={{ fill: 'var(--sc-muted)', fontSize: 11 }} />
          <YAxis tickFormatter={fmtK} tick={{ fill: 'var(--sc-muted)', fontSize: 11 }} />
          <Tooltip {...tooltipStyle} formatter={fmtTooltipCurrency} />
          <Legend wrapperStyle={{ fontSize: '11px' }} />
          <Bar dataKey="P&I" stackId="a" fill="#5b8def" />
          <Bar dataKey="Taxes" stackId="a" fill="#3b5fa0" />
          <Bar dataKey="Insurance" stackId="a" fill="#2d4a7a" />
          <Bar dataKey="HOA" stackId="a" fill="#1e3560" />
          <Bar dataKey="PMI" stackId="a" fill="#162545" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// ─── Chart 2: Equity Build-Up Over Time (Area Chart) ────────────

function EquityChart({ mode, scenarios, results }: {
  mode: ScenarioMode; scenarios: (PurchaseScenarioInput | RefiScenarioInput)[]; results: (PurchaseCalculatedResult | RefiCalculatedResult)[]
}) {
  const [horizon, setHorizon] = useState(10)

  const data = useMemo(() => {
    const points: Record<string, number | string>[] = []

    for (let year = 0; year <= horizon; year++) {
      const month = year * 12
      const point: Record<string, number | string> = { year: `Year ${year}` }
      results.forEach((r, i) => {
        const schedule = mode === 'purchase'
          ? (r as PurchaseCalculatedResult).amortizationSchedule
          : (r as RefiCalculatedResult).amortizationSchedule
        const label = (scenarios[i] as PurchaseScenarioInput)?.label || (scenarios[i] as RefiScenarioInput)?.label || `Option ${i + 1}`
        if (month === 0) {
          point[label] = mode === 'purchase' ? (scenarios[i] as PurchaseScenarioInput).downPaymentAmount : 0
        } else {
          const entry = schedule[Math.min(month - 1, schedule.length - 1)]
          const downPmt = mode === 'purchase' ? (scenarios[i] as PurchaseScenarioInput).downPaymentAmount : 0
          point[label] = entry ? Math.round(downPmt + entry.cumulativePrincipal) : 0
        }
      })
      points.push(point)
    }
    return points
  }, [mode, scenarios, results, horizon])

  const labels = scenarios.map((s, i) =>
    (s as PurchaseScenarioInput)?.label || (s as RefiScenarioInput)?.label || `Option ${i + 1}`
  )

  return (
    <ChartCard title="Equity Build-Up Over Time">
      <HorizonToggle value={horizon} onChange={setHorizon} options={[5, 10, 15, 30]} />
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--sc-border)" />
          <XAxis dataKey="year" tick={{ fill: 'var(--sc-muted)', fontSize: 11 }} />
          <YAxis tickFormatter={fmtK} tick={{ fill: 'var(--sc-muted)', fontSize: 11 }} />
          <Tooltip {...tooltipStyle} formatter={fmtTooltipK} />
          <Legend wrapperStyle={{ fontSize: '11px' }} />
          {labels.map((label, i) => (
            <Area key={label} type="monotone" dataKey={label} stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.15} strokeWidth={2} />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// ─── Chart 3: Cumulative Savings / Break-Even (Line Chart) ──────

function SavingsChart({ mode, scenarios, results }: {
  mode: ScenarioMode; scenarios: (PurchaseScenarioInput | RefiScenarioInput)[]; results: (PurchaseCalculatedResult | RefiCalculatedResult)[]
}) {
  const [horizon, setHorizon] = useState(5)

  const data = useMemo(() => {
    if (results.length < 1) return []
    const maxMonths = horizon * 12
    const points: Record<string, number | string>[] = []

    // For purchase: savings vs Option A
    // For refi: cumulative savings vs current loan minus closing costs
    for (let month = 0; month <= maxMonths; month += 3) {
      const point: Record<string, number | string> = { month }
      results.forEach((r, i) => {
        const label = (scenarios[i] as PurchaseScenarioInput)?.label || (scenarios[i] as RefiScenarioInput)?.label || `Option ${i + 1}`
        if (mode === 'purchase' && i > 0) {
          const base = (results[0] as PurchaseCalculatedResult).totalMonthlyPayment
          const cur = (r as PurchaseCalculatedResult).totalMonthlyPayment
          point[label] = Math.round((base - cur) * month)
        } else if (mode === 'refinance') {
          const rr = r as RefiCalculatedResult
          point[label] = Math.round(rr.monthlySavings * month - (scenarios[i] as RefiScenarioInput).closingCosts)
        }
      })
      points.push(point)
    }
    return points
  }, [mode, scenarios, results, horizon])

  const labels = mode === 'purchase'
    ? scenarios.slice(1).map((s, i) => (s as PurchaseScenarioInput)?.label || `Option ${i + 2}`)
    : scenarios.map((s, i) => (s as RefiScenarioInput)?.label || `Option ${i + 1}`)

  return (
    <ChartCard title={mode === 'refinance' ? 'Cumulative Savings / Break-Even' : 'Cumulative Savings vs Option A'}>
      <HorizonToggle value={horizon} onChange={setHorizon} options={[3, 5, 10]} />
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--sc-border)" />
          <XAxis dataKey="month" tick={{ fill: 'var(--sc-muted)', fontSize: 11 }} label={{ value: 'Months', position: 'insideBottom', offset: -5, fill: 'var(--sc-muted)', fontSize: 10 }} />
          <YAxis tickFormatter={fmtK} tick={{ fill: 'var(--sc-muted)', fontSize: 11 }} />
          <Tooltip {...tooltipStyle} formatter={fmtTooltipK} />
          <Legend wrapperStyle={{ fontSize: '11px' }} />
          <ReferenceLine y={0} stroke="var(--sc-muted)" strokeDasharray="3 3" />
          {labels.map((label, i) => (
            <Line key={label} type="monotone" dataKey={label} stroke={COLORS[mode === 'purchase' ? i + 1 : i]} strokeWidth={2} dot={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// ─── Chart 4: Principal vs Interest Over Time (Stacked Area) ────

function AmortizationChart({ mode, scenarios, results }: {
  mode: ScenarioMode; scenarios: (PurchaseScenarioInput | RefiScenarioInput)[]; results: (PurchaseCalculatedResult | RefiCalculatedResult)[]
}) {
  const [selectedIdx, setSelectedIdx] = useState(0)

  const data = useMemo(() => {
    if (!results[selectedIdx]) return []
    const schedule = mode === 'purchase'
      ? (results[selectedIdx] as PurchaseCalculatedResult).amortizationSchedule
      : (results[selectedIdx] as RefiCalculatedResult).amortizationSchedule

    const points: { year: number; principal: number; interest: number }[] = []
    for (let i = 11; i < schedule.length; i += 12) {
      points.push({
        year: Math.ceil((i + 1) / 12),
        principal: Math.round(schedule[i].cumulativePrincipal),
        interest: Math.round(schedule[i].cumulativeInterest),
      })
    }
    return points
  }, [mode, results, selectedIdx])

  const labels = scenarios.map((s, i) =>
    (s as PurchaseScenarioInput)?.label || (s as RefiScenarioInput)?.label || `Option ${i + 1}`
  )

  return (
    <ChartCard title="Principal vs Interest Over Time">
      <div className="flex gap-1 mb-3">
        {labels.map((label, i) => (
          <button
            key={i}
            onClick={() => setSelectedIdx(i)}
            className="px-2 py-1 rounded text-[10px] font-medium transition-colors"
            style={{
              background: selectedIdx === i ? COLORS[i] : 'transparent',
              color: selectedIdx === i ? '#0a0a0a' : 'var(--sc-muted)',
              border: `1px solid ${selectedIdx === i ? COLORS[i] : 'var(--sc-border)'}`,
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--sc-border)" />
          <XAxis dataKey="year" tick={{ fill: 'var(--sc-muted)', fontSize: 11 }} label={{ value: 'Years', position: 'insideBottom', offset: -5, fill: 'var(--sc-muted)', fontSize: 10 }} />
          <YAxis tickFormatter={fmtK} tick={{ fill: 'var(--sc-muted)', fontSize: 11 }} />
          <Tooltip {...tooltipStyle} formatter={fmtTooltipK} />
          <Legend wrapperStyle={{ fontSize: '11px' }} />
          <Area type="monotone" dataKey="principal" stackId="1" stroke="#5b8def" fill="#5b8def" fillOpacity={0.3} name="Principal" />
          <Area type="monotone" dataKey="interest" stackId="1" stroke="#4a5568" fill="#4a5568" fillOpacity={0.2} name="Interest" />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
