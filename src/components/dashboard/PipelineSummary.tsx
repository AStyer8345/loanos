'use client'

interface StageStat {
  count: number
  volume: number
}

interface PipelineSummaryProps {
  stageCounts: Record<string, StageStat>
  totalCount: number
  totalVolume: number
}

function fmtVolume(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}

// The 4 primary pipeline stages shown in the summary widget
const SUMMARY_STAGES = ['Pre-App', 'Processing', 'Underwriting', 'Clear to Close']

// Fallback aliases in case stage names come in slightly different
const STAGE_ALIASES: Record<string, string> = {
  'Pre-Approval': 'Pre-App',
  'Pre-app': 'Pre-App',
  'Cond. Approval': 'Cond. Approval',
  'Application': 'Application',
}

export default function PipelineSummary({ stageCounts, totalCount, totalVolume }: PipelineSummaryProps) {
  // Normalize stage keys through alias map
  const normalized: Record<string, StageStat> = {}
  for (const [key, val] of Object.entries(stageCounts)) {
    const resolved = STAGE_ALIASES[key] ?? key
    if (!normalized[resolved]) normalized[resolved] = { count: 0, volume: 0 }
    normalized[resolved].count += val.count
    normalized[resolved].volume += val.volume
  }

  return (
    <div className="bg-zinc-900 rounded shadow-lg shadow-black/50 p-4">
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-widest">
          Pipeline Summary
        </span>
        <span className="text-xs font-mono text-zinc-400">
          {totalVolume > 0 && <span className="text-indigo-400">{fmtVolume(totalVolume)}</span>}
          {totalVolume > 0 && totalCount > 0 && <span className="text-zinc-600"> · </span>}
          {totalCount > 0 && <span>{totalCount} loans</span>}
        </span>
      </div>

      {/* Stage columns */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {SUMMARY_STAGES.map(stage => {
          const stat = normalized[stage] ?? { count: 0, volume: 0 }
          const barPct = totalVolume > 0 ? Math.min(100, (stat.volume / totalVolume) * 100) : 0

          return (
            <div key={stage}>
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1">{stage}</p>
              <p className="text-2xl font-mono font-bold text-zinc-100">{stat.count}</p>
              <p className="text-xs font-mono text-indigo-400 mt-0.5">
                {stat.volume > 0 ? fmtVolume(stat.volume) : '—'}
              </p>
              {/* Progress bar */}
              <div className="mt-2 h-0.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${barPct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
