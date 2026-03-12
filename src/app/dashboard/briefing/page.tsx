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
    <div className="bg-white rounded-lg border border-slate-200 p-4 flex items-center gap-3">
      <div className={`p-2 rounded-md ${color}`}>
        <Icon size={16} className="text-white" />
      </div>
      <div>
        <div className="text-2xl font-semibold text-slate-900">{count}</div>
        <div className="text-xs text-slate-500">{label}</div>
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
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600 rounded-lg">
              <Brain size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Daily Briefing</h1>
              {data && (
                <p className="text-xs text-slate-500">
                  Generated {new Date(data.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={fetchBriefing}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Generating…' : data ? 'Refresh' : 'Run Briefing'}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-6">
            <AlertCircle size={15} />
            {error}
          </div>
        )}

        {/* Empty state */}
        {!data && !loading && !error && (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <Brain size={40} strokeWidth={1.2} className="mb-3" />
            <p className="text-sm">Click <strong className="text-slate-600">Run Briefing</strong> to generate your morning action list.</p>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg border border-slate-200 p-4 animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-slate-200 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
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
              <StatCard label="Stale Leads"    count={data.staleLeads.length}    icon={Users}     color="bg-amber-500" />
              <StatCard label="Active Loans"   count={data.activeLoans.length}   icon={FileText}  color="bg-emerald-600" />
              <StatCard label="Realtor Touches" count={data.realtorTouches.length} icon={Clock}   color="bg-blue-500" />
              <StatCard label="Pending Drafts" count={data.pendingDrafts.length} icon={Bell}      color="bg-rose-500" />
            </div>

            {/* AI Summary */}
            {data.summary && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-emerald-900 leading-relaxed">{data.summary}</p>
              </div>
            )}

            {/* Progress */}
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-700">Today&apos;s Actions</h2>
              <span className="text-xs text-slate-500">{checkedCount}/{totalItems} done</span>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 bg-slate-200 rounded-full mb-4 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
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
                      bg-white rounded-lg border px-4 py-3 cursor-pointer transition-all
                      ${done
                        ? 'border-emerald-200 bg-emerald-50 opacity-60'
                        : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                      }
                    `}
                  >
                    <div className="flex items-start gap-3">
                      {/* Rank + check */}
                      <div className="flex-shrink-0 mt-0.5">
                        {done
                          ? <CheckCircle2 size={18} className="text-emerald-500" />
                          : <Circle size={18} className="text-slate-300" />
                        }
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                            #{item.rank}
                          </span>
                          <span className={`text-sm font-semibold ${done ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                            {item.contact}
                          </span>
                        </div>
                        <p className={`text-sm ${done ? 'text-slate-400' : 'text-slate-700'}`}>
                          {item.action}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">{item.reason}</p>
                        {item.snippet && !done && (
                          <p className="text-xs text-emerald-600 mt-1.5 italic">
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
              <div className="mt-6 flex flex-col items-center py-8 text-slate-500">
                <CheckCircle2 size={36} className="text-emerald-500 mb-2" />
                <p className="text-sm font-medium">All done for today.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
