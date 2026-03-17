'use client'

import { useState, useEffect } from 'react'
import { Brain, CheckCircle2, Circle, RefreshCw } from 'lucide-react'

interface ActionItem {
  rank: number
  contact: string
  action: string
  reason: string
  snippet?: string
}

interface BriefingData {
  generatedAt: string
  summary: string
  top7: ActionItem[]
  staleLeads: object[]
  activeLoans: object[]
  realtorTouches: object[]
  pendingDrafts: object[]
}

export default function DailyBriefingPanel() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<BriefingData | null>(null)
  const [checked, setChecked] = useState<number[]>([])
  const [error, setError] = useState<string | null>(null)

  async function runBriefing() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/agents/daily-briefing')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to fetch briefing')
      setData(json)
      setChecked([])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  // Auto-fetch on mount
  useEffect(() => { runBriefing() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const checkedCount = checked.length
  const totalItems = data?.top7?.length ?? 0

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-widest">Daily Briefing</span>
          {data && (
            <span className="text-xs font-mono text-zinc-600">
              — generated {new Date(data.generatedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </span>
          )}
        </div>
        <button
          onClick={runBriefing}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs font-mono bg-[#0f172a] border border-zinc-700 hover:border-amber-600/50 text-zinc-400 hover:text-amber-400 px-3 py-1.5 rounded transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Generating…' : data ? 'Refresh' : 'Run Briefing'}
        </button>
      </div>

      {error && (
        <div className="text-xs font-mono text-red-400 bg-red-900/20 border border-red-800 rounded px-3 py-2">
          {error}
        </div>
      )}

      {loading && (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6, 7].map(i => (
            <div key={i} className="h-14 bg-[#0f172a] border border-[#1e293b] rounded-lg border-l-[3px] border-l-amber-800/40 animate-pulse" />
          ))}
        </div>
      )}

      {data && !loading && (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Stale Leads', count: data.staleLeads.length },
              { label: 'Active Loans', count: data.activeLoans.length },
              { label: 'Realtor Touches', count: data.realtorTouches?.length ?? 0 },
              { label: 'Pending Drafts', count: data.pendingDrafts.length },
            ].map(s => (
              <div key={s.label} className="bg-[#0f172a] border border-[#1e293b] border-l-[3px] border-l-amber-600/50 rounded-lg p-3">
                <div className="text-xl font-mono font-bold text-zinc-100">{s.count}</div>
                <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* AI Summary */}
          {data.summary && (
            <div className="bg-[#0f172a] border border-[#1e293b] border-l-[3px] border-l-amber-600 rounded-lg px-4 py-3">
              <p className="text-sm font-mono text-zinc-300 leading-relaxed">{data.summary}</p>
            </div>
          )}

          {/* Progress */}
          {totalItems > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-widest">Today&apos;s Actions</span>
                <span className="text-xs font-mono text-zinc-500">{checkedCount}/{totalItems} done</span>
              </div>
              <div className="h-1 bg-[#1e293b] rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${(checkedCount / totalItems) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Action checklist */}
          <div className="space-y-2">
            {data.top7.map(item => {
              const done = checked.includes(item.rank)
              return (
                <div
                  key={item.rank}
                  onClick={() => setChecked(c => c.includes(item.rank) ? c.filter(x => x !== item.rank) : [...c, item.rank])}
                  className={`bg-[#0f172a] border rounded-lg border-l-[3px] px-4 py-3 cursor-pointer transition-all ${
                    done
                      ? 'border-[#1e293b] border-l-zinc-700 opacity-60'
                      : 'border-[#1e293b] border-l-amber-600/70 hover:border-amber-600/40'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {done
                        ? <CheckCircle2 size={16} className="text-emerald-500" />
                        : <Circle size={16} className="text-zinc-600" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-wide">#{item.rank}</span>
                        <span className={`text-sm font-mono font-semibold ${done ? 'line-through text-zinc-600' : 'text-zinc-200'}`}>
                          {item.contact}
                        </span>
                      </div>
                      <p className={`text-xs font-mono ${done ? 'text-zinc-600' : 'text-zinc-400'}`}>{item.action}</p>
                      {item.reason && <p className="text-[10px] font-mono text-zinc-600 mt-0.5">{item.reason}</p>}
                      {item.snippet && !done && (
                        <p className="text-[10px] font-mono text-amber-500/80 mt-1 italic">&ldquo;{item.snippet}&rdquo;</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {checkedCount === totalItems && totalItems > 0 && (
            <div className="flex flex-col items-center py-6 text-zinc-600">
              <CheckCircle2 size={28} className="text-emerald-500 mb-2" />
              <p className="text-sm font-mono">All done for today.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
