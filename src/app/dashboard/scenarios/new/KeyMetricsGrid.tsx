'use client'

import type { KeyMetrics } from '@/lib/scenarios/displayData'

const fmtCurrency = (v: number) => '$' + Math.round(v).toLocaleString('en-US')

function StatCard({ label, value, subLabel, positive }: {
  label: string; value: string; subLabel?: string; positive?: boolean
}) {
  return (
    <div className="rounded-[14px] p-5 flex flex-col justify-between" style={{
      background: 'var(--sc-card)',
      border: `1px solid ${positive ? 'rgba(42,122,75,0.3)' : 'var(--sc-border)'}`,
    }}>
      <p className="text-[10px] font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--sc-muted)' }}>
        {label}
      </p>
      <p className="text-2xl font-bold" style={{
        fontFamily: "'IBM Plex Mono', monospace",
        color: positive ? '#4CC98A' : 'var(--sc-text)',
      }}>
        {value}
      </p>
      {subLabel && (
        <p className="text-[10px] mt-1" style={{ color: 'var(--sc-muted)' }}>{subLabel}</p>
      )}
    </div>
  )
}

export default function KeyMetricsGrid({ metrics, mode }: { metrics: KeyMetrics; mode: 'purchase' | 'refinance' }) {
  const hasSavings = metrics.monthlySavings > 0
  const baseline = mode === 'refinance' ? 'current payment' : 'most expensive option'

  return (
    <div>
      <h3 className="text-sm font-semibold mb-4" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
        Key Metrics — Best Scenario
      </h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Monthly Savings"
          value={fmtCurrency(metrics.monthlySavings) + '/mo'}
          subLabel={`vs. ${baseline}`}
          positive={hasSavings}
        />
        <StatCard
          label="Savings Over 5 Years"
          value={fmtCurrency(metrics.savings5yr)}
          subLabel="60 months"
          positive={hasSavings}
        />
        <StatCard
          label="Savings Over 15 Years"
          value={fmtCurrency(metrics.savings15yr)}
          subLabel="180 months"
          positive={hasSavings}
        />
        <StatCard
          label="Total Interest Paid"
          value={fmtCurrency(metrics.totalInterestBest)}
          subLabel="full loan term"
        />
      </div>
    </div>
  )
}
