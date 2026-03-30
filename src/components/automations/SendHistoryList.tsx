'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { relativeTime } from './AutomationRow'

const GOLD = '#C9A84C'
const MONO = "'IBM Plex Mono', 'Courier New', monospace"
const LIMIT = 20

interface SendHistoryListProps {
  automationName: string
}

interface ActivityLogRow {
  id: string
  loan_id: string | null
  contact_id: string | null
  organization_id: string
  type: string | null
  action: string
  subject: string | null
  body_snippet: string | null
  summary: string | null
  to_address: string | null
  from_address: string | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: Record<string, any> | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw_payload: Record<string, any> | null
  created_at: string
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

function extractRecipient(row: ActivityLogRow): string {
  if (row.to_address) return row.to_address
  if (row.metadata?.recipient) return String(row.metadata.recipient)
  if (row.metadata?.to) return String(row.metadata.to)
  if (row.metadata?.email) return String(row.metadata.email)
  return '—'
}

function extractSubject(row: ActivityLogRow): string {
  if (row.subject) return row.subject
  if (row.metadata?.subject) return String(row.metadata.subject)
  if (row.summary) return row.summary
  return row.action ?? '—'
}

function extractBody(row: ActivityLogRow): string | null {
  if (row.body_snippet) return row.body_snippet
  if (row.metadata?.body) return String(row.metadata.body)
  if (row.metadata?.html) return String(row.metadata.html)
  if (row.metadata?.email_body) return String(row.metadata.email_body)
  if (row.metadata?.content) return String(row.metadata.content)
  return null
}

export default function SendHistoryList({ automationName }: SendHistoryListProps) {
  const [entries, setEntries] = useState<ActivityLogRow[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchEntries = useCallback(async (currentOffset: number, append: boolean) => {
    if (append) setLoadingMore(true)
    else setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data, error: supabaseError } = await supabase
        .from('activity_log')
        .select('*')
        .eq('type', 'email_sent')
        .ilike('action', `%${automationName}%`)
        .order('created_at', { ascending: false })
        .range(currentOffset, currentOffset + LIMIT - 1)

      if (supabaseError) throw new Error(supabaseError.message)

      const rows = (data ?? []) as unknown as ActivityLogRow[]
      setEntries(prev => append ? [...prev, ...rows] : rows)
      setHasMore(rows.length === LIMIT)
      setOffset(currentOffset + rows.length)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [automationName])

  useEffect(() => {
    setEntries([])
    setOffset(0)
    setHasMore(false)
    setExpandedId(null)
    fetchEntries(0, false)
  }, [automationName, fetchEntries])

  const handleLoadMore = () => {
    fetchEntries(offset, true)
  }

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <span className="text-zinc-500 text-xs" style={{ fontFamily: MONO }}>
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

  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <span className="text-zinc-500 text-xs" style={{ fontFamily: MONO }}>
          no sends yet
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-0">
      {entries.map(entry => {
        const isExpanded = expandedId === entry.id
        const recipient = extractRecipient(entry)
        const subject = extractSubject(entry)
        const body = extractBody(entry)

        return (
          <div key={entry.id} className="border-b border-zinc-800/50">
            {/* Row */}
            <button
              onClick={() => toggleExpand(entry.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-zinc-900/50"
              style={{ fontFamily: MONO }}
            >
              {/* Date/time */}
              <span className="text-xs text-zinc-300 flex-shrink-0" style={{ minWidth: 140 }}>
                {formatDateTime(entry.created_at)}
              </span>

              {/* Recipient */}
              <span className="text-xs flex-shrink-0" style={{ color: GOLD, minWidth: 120, maxWidth: 160 }}>
                <span className="truncate block" style={{ maxWidth: 160 }}>
                  {recipient}
                </span>
              </span>

              {/* Subject */}
              <span className="flex-1 text-xs text-zinc-400 truncate min-w-0">
                {subject}
              </span>

              {/* Relative time */}
              <span className="text-zinc-600 flex-shrink-0 hidden sm:block" style={{ fontSize: 10 }}>
                {relativeTime(entry.created_at)}
              </span>

              {/* Expand arrow */}
              <span className="flex-shrink-0 text-xs" style={{ color: GOLD }}>
                {isExpanded ? '▾' : '▸'}
              </span>
            </button>

            {/* Expanded email body */}
            {isExpanded && body && (
              <div className="px-4 pb-3 pt-1">
                <pre
                  className="text-zinc-400 whitespace-pre-wrap break-words rounded p-3 bg-zinc-950 border border-zinc-800"
                  style={{ fontFamily: MONO, fontSize: 11, lineHeight: 1.6 }}
                >
                  {body}
                </pre>
              </div>
            )}
            {isExpanded && !body && (
              <div className="px-4 pb-3 pt-1">
                <span className="text-xs text-zinc-600" style={{ fontFamily: MONO }}>
                  no email body available
                </span>
              </div>
            )}
          </div>
        )
      })}

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center py-3">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="px-4 py-1.5 rounded border border-zinc-700 text-xs text-zinc-300 transition-colors hover:border-[#C9A84C] hover:text-[#C9A84C] disabled:opacity-30"
            style={{ fontFamily: MONO }}
          >
            {loadingMore ? 'loading...' : 'load more'}
          </button>
        </div>
      )}
    </div>
  )
}
