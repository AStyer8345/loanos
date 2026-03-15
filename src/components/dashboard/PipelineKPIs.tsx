'use client'

import { TrendingUp, TrendingDown, AlertTriangle, FileText, Calendar } from 'lucide-react'

interface PipelineKPIsProps {
  totalCount: number
  totalVolume: number
  closedThisMonth: number
  closedThisMonthVolume: number
  closedLastMonth: number
  closedLastMonthVolume: number
  closingNext30: number
  closingNext30Volume: number
  urgentCount: number
}

function formatDollars(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}

export default function PipelineKPIs(props: PipelineKPIsProps) {
  const { totalCount, totalVolume, closedThisMonth, closedLastMonth, closedThisMonthVolume, closingNext30, closingNext30Volume, urgentCount } = props

  const mtdDelta = closedThisMonth - closedLastMonth
  const mtdTrending = mtdDelta >= 0

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Active Pipeline */}
      <div className="bg-zinc-900 rounded shadow-lg shadow-black/50 p-3.5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-zinc-400 text-xs font-mono uppercase tracking-wider">Active Pipeline</span>
          <FileText className="w-4 h-4 text-zinc-500" />
        </div>
        <div className="text-2xl font-mono font-bold text-zinc-100">{totalCount}</div>
        <div className="text-sm font-mono text-gold mt-1">{formatDollars(totalVolume)}</div>
        <div className="text-xs text-zinc-500 mt-1">loans in progress</div>
      </div>

      {/* Closed This Month */}
      <div className="bg-zinc-900 rounded shadow-lg shadow-black/50 p-3.5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-zinc-400 text-xs font-mono uppercase tracking-wider">Closed MTD</span>
          {mtdTrending ? (
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-500" />
          )}
        </div>
        <div className="text-2xl font-mono font-bold text-zinc-100">{closedThisMonth}</div>
        <div className="text-sm font-mono text-gold mt-1">{formatDollars(closedThisMonthVolume)}</div>
        <div className={`text-xs mt-1 font-mono ${mtdTrending ? 'text-emerald-500' : 'text-red-400'}`}>
          {mtdDelta >= 0 ? '+' : ''}{mtdDelta} vs last month
        </div>
      </div>

      {/* Closing Next 30 */}
      <div className="bg-zinc-900 rounded shadow-lg shadow-black/50 p-3.5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-zinc-400 text-xs font-mono uppercase tracking-wider">Est. Close 30d</span>
          <Calendar className="w-4 h-4 text-zinc-500" />
        </div>
        <div className="text-2xl font-mono font-bold text-zinc-100">{closingNext30}</div>
        <div className="text-sm font-mono text-gold mt-1">{formatDollars(closingNext30Volume)}</div>
        <div className="text-xs text-zinc-500 mt-1">projected this month</div>
      </div>

      {/* Urgent Items */}
      <div className={`bg-zinc-900 rounded shadow-lg shadow-black/50 p-3.5 ${urgentCount > 0 ? 'border border-amber-600' : ''}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-zinc-400 text-xs font-mono uppercase tracking-wider">Needs Attention</span>
          <AlertTriangle className={`w-4 h-4 ${urgentCount > 0 ? 'text-amber-500' : 'text-zinc-500'}`} />
        </div>
        <div className={`text-2xl font-mono font-bold ${urgentCount > 0 ? 'text-amber-400' : 'text-zinc-100'}`}>{urgentCount}</div>
        <div className="text-xs text-zinc-500 mt-1">urgent flags</div>
        {urgentCount === 0 && <div className="text-xs text-emerald-500 mt-1">All clear</div>}
      </div>
    </div>
  )
}
