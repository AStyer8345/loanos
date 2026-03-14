'use client'

import { useState } from 'react'
import { Brain, CheckCircle2, Circle, ChevronRight, Loader2 } from 'lucide-react'
import Link from 'next/link'

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
      if (!res.ok) throw new Error('Failed to fetch briefing')
      const json = await res.json()
      setData(json)
      setChecked([])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const top3 = data?.top7?.slice(0, 3) ?? []

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-yellow-500" />
          <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Daily Briefing</span>
          {data && (
            <span className="text-xs font-mono text-zinc-600">
              — {new Date(data.generatedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {data && (
            <Link
              href="/dashboard/briefing"
              className="text-xs font-mono text-zinc-500 hover:text-yellow-400 flex items-center gap-1 transition-colors"
            >
              Full briefing <ChevronRight className="w-3 h-3" />
            </Link>
          )}
          <button
            onClick={runBriefing}
            disabled={loading}
            className="text-xs font-mono bg-zinc-800 border border-zinc-600 hover:border-yellow-600 text-zinc-300 hover:text-yellow-400 px-3 py-1.5 rounded transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            {loading ? <><Loader2 className="w-3 h-3 animate-spin" /> Running...</> : 'Run Briefing'}
          </button>
        </div>
      </div>

      {!data && !loading && !error && (
        <div className="flex flex-col items-center justify-center py-8 text-zinc-600">
          <Brain className="w-8 h-8 mb-2 text-zinc-700" />
          <div className="font-mono text-sm">No briefing generated today</div>
          <div className="font-mono text-xs mt-1 text-zinc-700">Click Run Briefing for your daily action plan</div>
        </div>
      )}

      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-10 bg-zinc-800 rounded animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="text-xs font-mono text-red-400 bg-red-900/20 border border-red-800 rounded px-3 py-2">
          {error}
        </div>
      )}

      {data && !loading && (
        <div className="space-y-3">
          {/* Summary */}
          <div className="text-sm font-mono text-zinc-300 bg-zinc-800 rounded px-3 py-2 leading-relaxed border-l-2 border-yellow-600">
            {data.summary}
          </div>

          {/* Top 3 actions */}
          {top3.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-xs font-mono text-zinc-600 uppercase tracking-wider">Top Actions</div>
              {top3.map((item) => (
                <div
                  key={item.rank}
                  className="flex items-start gap-2 bg-zinc-800 rounded px-3 py-2 cursor-pointer group"
                  onClick={() => setChecked(c => c.includes(item.rank) ? c.filter(x => x !== item.rank) : [...c, item.rank])}
                >
                  {checked.includes(item.rank) ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-zinc-600 mt-0.5 flex-shrink-0 group-hover:text-zinc-400" />
                  )}
                  <div className={checked.includes(item.rank) ? 'opacity-50' : ''}>
                    <div className="text-sm font-mono text-zinc-200">{item.contact}</div>
                    <div className="text-xs font-mono text-zinc-500">{item.action}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
