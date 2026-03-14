'use client'

import { useState } from 'react'
import { Brain, RefreshCw, CheckCircle2, Circle, AlertCircle, Users, FileText, Bell, Clock } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────
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
  recentMilestones: object[]
  realtorTouches: object[]
  pendingDrafts: object[]
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, count, icon: Icon, color }: {
  label: string
  count: number
  icon: React.ElementType
  color: string
}) {
  return (
    <div className="bg-zinc-900/80 border border-zinc-700 border-l-[3px] border-l-amber-500 rounded-r-lg p-4 flex items-center gap-3">
      <div className={`p-2 rounded-md ${color}`}>
        <Icon size={16} className="text-white" />
      </div>
      <div>
        <div className="text-2xl font-mono font-bold text-zinc-100">{count}</div>
        <div className="text-xs font-mono text-zinc-500 uppercase tracking-wider">{label}</div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DailyBriefingPage() {
  const [data, setData] = useState<BriefingData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checked, setChecked] = useState<Set<number>>(new Set())

  async function fetchBriefing() {
    setLoading(true)
    setError(null)
    setChecked(new Set())
    try {
      const res = await fetch('/api/agents/daily-briefing')
      if (!res.ok) throw new Error(`Request failed: ${res.status}`)
      const json = await res.json()
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  function toggleCheck(rank: number) {
    setChecked(prev => {
      const next = new Set(prev)
      if (next.has(rank)) { next.delete(rank) } else { next.add(rank) }
      return next
    })
  }

  const checkedCount = checked.size
  const totalItems   = data?.top7.length ?? 0

  return (
    <div className="min-h-screen bg-[#050505]">
      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 border border-amber-500/50 rounded-lg">
              <Brain size={20} className="text-amber-400" />
            </div>
            <div>
              <h1 className="text-lg font-mono font-bold text-zinc-100 uppercase tracking-wider">Daily Briefing</h1>
              {data && (
                <p className="text-xs font-mono text-zinc-500">
                  Generated {new Date(data.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={fetchBriefing}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 border border-amber-500/50 text-amber-400 rounded font-mono text-sm hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Generating…' : data ? 'Refresh' : 'Run Briefing'}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm font-mono mb-6">
            <AlertCircle size={15} />
            {error}
          </div>
        )}

        {/* Empty state */}
        {!data && !loading && !error && (
          <div className="flex flex-col items-center justify-center py-24 text-zinc-500">
            <Brain size={40} strokeWidth={1.2} className="mb-3 text-zinc-600" />
            <p className="text-sm font-mono">Click <strong className="text-zinc-400">Run Briefing</strong> to generate your morning action list.</p>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="bg-zinc-900 border border-zinc-700 rounded-r-lg border-l-[3px] border-l-amber-500 p-4 animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-zinc-700 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-zinc-700 rounded w-3/4" />
                    <div className="h-3 bg-zinc-800 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Briefing data */}
        {data && !loading && (
          <>
            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <StatCard label="Stale Leads"    count={data.staleLeads.length}    icon={Users}     color="bg-amber-500/30" />
              <StatCard label="Active Loans"   count={data.activeLoans.length}   icon={FileText}  color="bg-amber-500/30" />
              <StatCard label="Realtor Touches" count={data.realtorTouches.length} icon={Clock}   color="bg-amber-500/30" />
              <StatCard label="Pending Drafts" count={data.pendingDrafts.length} icon={Bell}      color="bg-amber-500/30" />
            </div>

            {/* AI Summary */}
            {data.summary && (
              <div className="bg-zinc-900 border border-zinc-700 border-l-[3px] border-l-amber-500 rounded-r-lg p-4 mb-6">
                <p className="text-sm font-mono text-zinc-300 leading-relaxed">{data.summary}</p>
              </div>
            )}

            {/* Progress */}
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider">Today&apos;s Actions</h2>
              <span className="text-xs font-mono text-zinc-500">{checkedCount}/{totalItems} done</span>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 bg-zinc-800 rounded-full mb-4 overflow-hidden border border-zinc-700">
              <div
                className="h-full bg-[#4ADE80] rounded-full transition-all duration-300"
                style={{ width: totalItems > 0 ? `${(checkedCount / totalItems) * 100}%` : '0%' }}
              />
            </div>

            {/* Action checklist */}
            <div className="space-y-2">
              {data.top7.map((item) => {
                const done = checked.has(item.rank)
                return (
                  <div
                    key={item.rank}
                    onClick={() => toggleCheck(item.rank)}
                    className={`
                      bg-zinc-900 border rounded-r-lg border-l-[3px] px-4 py-3 cursor-pointer transition-all
                      ${done
                        ? 'border-zinc-700 border-l-zinc-600 opacity-60'
                        : 'border-zinc-700 border-l-amber-500 hover:border-amber-500/70'
                      }
                    `}
                  >
                    <div className="flex items-start gap-3">
                      {/* Rank + check */}
                      <div className="flex-shrink-0 mt-0.5">
                        {done
                          ? <CheckCircle2 size={18} className="text-[#4ADE80]" />
                          : <Circle size={18} className="text-zinc-500" />
                        }
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[11px] font-mono font-semibold text-zinc-500 uppercase tracking-wide">
                            #{item.rank}
                          </span>
                          <span className={`text-sm font-mono font-semibold ${done ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
                            {item.contact}
                          </span>
                        </div>
                        <p className={`text-sm font-mono ${done ? 'text-zinc-500' : 'text-zinc-400'}`}>
                          {item.action}
                        </p>
                        <p className="text-xs font-mono text-zinc-500 mt-1">{item.reason}</p>
                        {item.snippet && !done && (
                          <p className="text-xs text-amber-400 font-mono mt-1.5 italic">
                            &quot;{item.snippet}&quot;
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* All done */}
            {checkedCount === totalItems && totalItems > 0 && (
              <div className="mt-6 flex flex-col items-center py-8 text-zinc-500">
                <CheckCircle2 size={36} className="text-[#4ADE80] mb-2" />
                <p className="text-sm font-mono">All done for today.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
