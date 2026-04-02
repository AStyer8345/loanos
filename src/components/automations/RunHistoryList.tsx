'use client'

import { useState, useEffect, useCallback } from 'react'
import type { AutomationRunRow } from '@/lib/automations/types'
import { relativeTime } from './AutomationRow'

const GOLD = '#C9A84C'
const MONO = "'IBM Plex Mono', 'Courier New', monospace"
const LIMIT = 20

interface RunHistoryListProps {
  automationId: string
}

function runStatusColor(status: AutomationRunRow['status']): string {
  switch (status) {
    case 'success': return '#4ADE80'
    case 'error': return '#ef4444'
    case 'running': return '#fbbf24'
    default: return '#52525b'
  }
}

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export default function RunHistoryList({ automationId }: RunHistoryListProps) {
  const [runs, setRuns] = useState<AutomationRunRow[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchRuns = useCallback(async (currentOffset: number, append: boolean) => {
    if (append) setLoadingMore(true)
    else setLoading(true)
    setError(null)

    try {
      const res = await fetch(
        `/api/automations/registry/${automationId}/runs?limit=${LIMIT}&offset=${currentOffset}`
      )
      if (!res.ok) throw new Error('Failed to load run history')
      const data = await res.json() as { runs: AutomationRunRow[]; total: number }
      setRuns(prev => append ? [...prev, ...data.runs] : data.runs)
      setTotal(data.total)
      setOffset(currentOffset + data.runs.length)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [automationId])

  useEffect(() => {
    setRuns([])
    setOffset(0)
    setTotal(0)
    setExpandedId(null)
    fetchRuns(0, false)
  }, [automationId, fetchRuns])

  const handleLoadMore = () => {
    fetchRuns(offset, true)
  }

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <span className="text-muted-foreground text-xs" style={{ fontFamily: MONO }}>
          loading...
        </span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-4 px-3">
        <span className="text-xs text-red-400" style={{ fontFamily: MONO }}>{error}</span>
      </div>
    )
  }

  if (runs.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <span className="text-muted-foreground text-xs" style={{ fontFamily: MONO }}>
          no runs yet
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-0">
      {runs.map(run => {
        const isExpanded = expandedId === run.id
        const statusColor = runStatusColor(run.status)

        return (
          <div key={run.id} className="border-b border-input/50">
            {/* Row */}
            <button
              onClick={() => toggleExpand(run.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-card/50"
              style={{ fontFamily: MONO }}
            >
              {/* Status dot */}
              <span
                className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: statusColor }}
              />

              {/* Date/time */}
              <span className="text-xs text-foreground/80 flex-shrink-0" style={{ minWidth: 140 }}>
                {formatDateTime(run.started_at)}
              </span>

              {/* Summary */}
              <span className="flex-1 text-xs text-muted-foreground truncate min-w-0">
                {run.summary ?? '—'}
              </span>

              {/* Relative time */}
              <span className="text-muted-foreground flex-shrink-0 hidden sm:block" style={{ fontSize: 10 }}>
                {relativeTime(run.started_at)}
              </span>

              {/* Status badge */}
              <span
                className="flex-shrink-0 px-1.5 py-0.5 rounded text-xs"
                style={{
                  background: '#27272a',
                  color: statusColor,
                  fontSize: 9,
                  letterSpacing: '0.05em',
                }}
              >
                {run.status}
              </span>

              {/* Expand arrow */}
              <span className="flex-shrink-0 text-xs" style={{ color: GOLD }}>
                {isExpanded ? '▾' : '▸'}
              </span>
            </button>

            {/* Expanded log */}
            {isExpanded && run.full_log && (
              <div className="px-4 pb-3 pt-1">
                <pre
                  className="text-muted-foreground whitespace-pre-wrap break-words rounded p-3 bg-background border border-input"
                  style={{ fontFamily: MONO, fontSize: 11, lineHeight: 1.6 }}
                >
                  {run.full_log}
                </pre>
              </div>
            )}
            {isExpanded && !run.full_log && (
              <div className="px-4 pb-3 pt-1">
                <span className="text-xs text-muted-foreground" style={{ fontFamily: MONO }}>
                  no log available
                </span>
              </div>
            )}
          </div>
        )
      })}

      {/* Load More */}
      {runs.length < total && (
        <div className="flex justify-center py-3">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="px-4 py-1.5 rounded border border-input text-xs text-foreground/80 transition-colors hover:border-[#C9A84C] hover:text-[#C9A84C] disabled:opacity-30"
            style={{ fontFamily: MONO }}
          >
            {loadingMore ? 'loading...' : `load more (${total - runs.length} remaining)`}
          </button>
        </div>
      )}
    </div>
  )
}
