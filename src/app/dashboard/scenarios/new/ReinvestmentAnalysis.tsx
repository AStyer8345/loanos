'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, TrendingUp } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { ScenarioMode, PurchaseCalculatedResult, RefiCalculatedResult, ReinvestmentResult } from '@/lib/scenarios/types'

const fmtK = (v: number) => {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}K`
  return `$${v.toFixed(0)}`
}

export default function ReinvestmentAnalysis({ mode, purchaseResults, refiResults, settings, result, onSettingsChange, onRecalculate }: {
  mode: ScenarioMode
  purchaseResults: PurchaseCalculatedResult[]
  refiResults: RefiCalculatedResult[]
  settings: { returnRate: number; horizonYears: number }
  result: ReinvestmentResult | null
  onSettingsChange: (s: { returnRate: number; horizonYears: number }) => void
  onRecalculate: () => void
}) {
  const [open, setOpen] = useState(true)

  // Determine monthly savings for display
  let monthlySavings = 0
  if (mode === 'purchase' && purchaseResults.length > 1) {
    monthlySavings = purchaseResults[0].totalMonthlyPayment - Math.min(...purchaseResults.map(r => r.totalMonthlyPayment))
  } else if (mode === 'refinance' && refiResults.length > 0) {
    monthlySavings = Math.max(...refiResults.map(r => r.monthlySavings))
  }

  return (
    <div className="rounded-[14px]" style={{ background: 'var(--sc-card)', border: '1px solid var(--sc-border)' }}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 w-full px-5 py-4 text-sm font-semibold"
        style={{ color: 'var(--sc-text)', fontFamily: "'Inter', sans-serif" }}
      >
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        <TrendingUp size={16} style={{ color: 'var(--sc-accent)' }} />
        What If You Invest the Savings?
      </button>

      {open && (
        <div className="px-5 pb-5">
          {/* Inline controls */}
          <div className="flex flex-wrap items-end gap-4 mb-5">
            <div className="flex-1 min-w-[120px]">
              <label className="block text-xs font-medium mb-2" style={{ color: 'var(--sc-muted)' }}>Return Rate</label>
              <div className="relative">
                <input
                  type="number"
                  value={settings.returnRate}
                  onChange={e => onSettingsChange({ ...settings, returnRate: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2.5 rounded-[10px] text-sm border outline-none pr-8"
                  style={{ borderColor: 'var(--sc-border)', color: 'var(--sc-text)', background: 'var(--sc-bg)', fontFamily: "'IBM Plex Mono', monospace" }}
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--sc-muted)' }}>%</span>
              </div>
            </div>
            <div className="flex-1 min-w-[120px]">
              <label className="block text-xs font-medium mb-2" style={{ color: 'var(--sc-muted)' }}>Horizon</label>
              <select
                value={settings.horizonYears}
                onChange={e => onSettingsChange({ ...settings, horizonYears: parseInt(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-[10px] text-sm border outline-none"
                style={{ borderColor: 'var(--sc-border)', color: 'var(--sc-text)', background: 'var(--sc-bg)', fontFamily: "'Inter', sans-serif" }}
              >
                {[5, 10, 15, 20, 30].map(y => <option key={y} value={y}>{y} years</option>)}
              </select>
            </div>
            <button
              onClick={onRecalculate}
              className="px-5 py-2.5 rounded-[10px] text-sm font-medium"
              style={{ background: 'var(--sc-accent-dim)', color: 'var(--sc-accent)', border: '1px solid var(--sc-accent)' }}
            >
              Update
            </button>
          </div>

          {result && result.futureValue > 0 && (
            <>
              <div className="p-4 rounded-[10px] mb-5" style={{ background: 'var(--sc-accent-dim)' }}>
                <p className="text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                  If you invest the <span className="font-semibold" style={{ color: 'var(--sc-accent)', fontFamily: "'IBM Plex Mono', monospace" }}>
                    ${monthlySavings.toLocaleString('en-US', { minimumFractionDigits: 2 })}/month
                  </span> savings at {settings.returnRate}% for {settings.horizonYears} years, it grows to{' '}
                  <span className="font-bold text-lg" style={{ color: 'var(--sc-accent)', fontFamily: "'IBM Plex Mono', monospace" }}>
                    ${result.futureValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </p>
                <p className="text-[10px] mt-2" style={{ color: 'var(--sc-muted)' }}>
                  Total contributed: ${result.totalContributed.toLocaleString()} | Investment growth: ${result.totalGrowth.toLocaleString()}
                </p>
              </div>

              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={result.yearlySnapshots}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--sc-border)" />
                  <XAxis dataKey="year" tick={{ fill: 'var(--sc-muted)', fontSize: 11 }} label={{ value: 'Years', position: 'insideBottom', offset: -5, fill: 'var(--sc-muted)', fontSize: 10 }} />
                  <YAxis tickFormatter={fmtK} tick={{ fill: 'var(--sc-muted)', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: 'var(--sc-card)', border: '1px solid var(--sc-border)', borderRadius: '10px', fontSize: '11px', color: 'var(--sc-text)' }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any) => typeof value === 'number' ? `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : String(value ?? '')}
                  />
                  <Line type="monotone" dataKey="value" stroke="var(--sc-accent)" strokeWidth={2} dot={false} name="Portfolio Value" />
                </LineChart>
              </ResponsiveContainer>

              <p className="text-[10px] mt-4 italic" style={{ color: 'var(--sc-muted)' }}>
                Assumes consistent monthly investment with compound returns. Actual returns may vary.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
