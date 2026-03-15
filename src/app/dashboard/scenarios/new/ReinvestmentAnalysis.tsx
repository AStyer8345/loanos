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
  const [open, setOpen] = useState(false)

  // Determine monthly savings for display
  let monthlySavings = 0
  if (mode === 'purchase' && purchaseResults.length > 1) {
    monthlySavings = purchaseResults[0].totalMonthlyPayment - Math.min(...purchaseResults.map(r => r.totalMonthlyPayment))
  } else if (mode === 'refinance' && refiResults.length > 0) {
    monthlySavings = Math.max(...refiResults.map(r => r.monthlySavings))
  }

  return (
    <div className="mt-8 rounded-lg" style={{ background: 'var(--sc-card)', border: '1px solid var(--sc-border)' }}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-4 py-3 text-sm font-semibold"
        style={{ color: 'var(--sc-text)', fontFamily: "'IBM Plex Sans', sans-serif" }}
      >
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        <TrendingUp size={16} style={{ color: 'var(--sc-gold)' }} />
        What If You Invest the Savings?
      </button>

      {open && (
        <div className="px-4 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--sc-muted)' }}>Assumed Return Rate</label>
              <div className="relative">
                <input
                  type="number"
                  value={settings.returnRate}
                  onChange={e => onSettingsChange({ ...settings, returnRate: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-md text-sm border outline-none pr-8"
                  style={{ borderColor: 'var(--sc-border)', color: 'var(--sc-text)', background: 'transparent', fontFamily: "'IBM Plex Mono', monospace" }}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--sc-muted)' }}>%</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--sc-muted)' }}>Time Horizon</label>
              <select
                value={settings.horizonYears}
                onChange={e => onSettingsChange({ ...settings, horizonYears: parseInt(e.target.value) })}
                className="w-full px-3 py-2 rounded-md text-sm border outline-none"
                style={{ borderColor: 'var(--sc-border)', color: 'var(--sc-text)', background: 'var(--sc-card)' }}
              >
                {[5, 10, 15, 20, 30].map(y => <option key={y} value={y}>{y} years</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={onRecalculate}
                className="px-4 py-2 rounded-md text-sm font-medium"
                style={{ background: 'var(--sc-gold-dim)', color: 'var(--sc-gold)', border: '1px solid var(--sc-gold)' }}
              >
                Recalculate
              </button>
            </div>
          </div>

          {result && result.futureValue > 0 && (
            <>
              <div className="p-3 rounded-md mb-4" style={{ background: 'var(--sc-gold-dim)' }}>
                <p className="text-sm" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
                  If you invest the <span className="font-semibold" style={{ color: 'var(--sc-gold)', fontFamily: "'IBM Plex Mono', monospace" }}>
                    ${monthlySavings.toLocaleString('en-US', { minimumFractionDigits: 2 })}/month
                  </span> savings at {settings.returnRate}% for {settings.horizonYears} years, it grows to{' '}
                  <span className="font-bold text-lg" style={{ color: 'var(--sc-gold)', fontFamily: "'IBM Plex Mono', monospace" }}>
                    ${result.futureValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </p>
                <p className="text-[10px] mt-1" style={{ color: 'var(--sc-muted)' }}>
                  Total contributed: ${result.totalContributed.toLocaleString()} | Investment growth: ${result.totalGrowth.toLocaleString()}
                </p>
              </div>

              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={result.yearlySnapshots}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                  <XAxis dataKey="year" tick={{ fill: '#F0EDE880', fontSize: 11 }} label={{ value: 'Years', position: 'insideBottom', offset: -5, fill: '#F0EDE880', fontSize: 10 }} />
                  <YAxis tickFormatter={fmtK} tick={{ fill: '#F0EDE880', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: '#141414', border: '1px solid #262626', borderRadius: '6px', fontSize: '11px', color: '#F0EDE8' }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any) => typeof value === 'number' ? `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : String(value ?? '')}
                  />
                  <Line type="monotone" dataKey="value" stroke="#C9A84C" strokeWidth={2} dot={false} name="Portfolio Value" />
                </LineChart>
              </ResponsiveContainer>

              <p className="text-[10px] mt-3 italic" style={{ color: 'var(--sc-muted)' }}>
                Assumes consistent monthly investment with compound returns. Actual returns may vary.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
