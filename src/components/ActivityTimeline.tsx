'use client'

import { useState } from 'react'
import {
  Mail,
  Send,
  FileText,
  Phone,
  StickyNote,
  Activity,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

export type ActivityLogRow = {
  id: string
  created_at: string
  // Legacy schema
  action?: string
  entity_type?: string
  metadata?: Record<string, unknown>
  // New schema
  type?: string
  summary?: string
  raw_payload?: Record<string, unknown>
  external_id?: string
}

type NormalizedEntry = {
  id: string
  created_at: string
  type: string
  summary: string
  detail: Record<string, unknown> | null
}

// ── Normalize legacy + new rows ──────────────────────────────────────────────

function normalize(row: ActivityLogRow): NormalizedEntry {
  // Prefer new schema fields when present
  if (row.type && row.summary) {
    return {
      id: row.id,
      created_at: row.created_at,
      type: row.type,
      summary: row.summary,
      detail: row.raw_payload ?? row.metadata ?? null,
    }
  }

  // Fall back to legacy schema
  const action = row.action ?? 'unknown'
  const meta = row.metadata ?? {}

  let summary = action.replace(/_/g, ' ')
  if (meta.subject) summary = meta.subject
  else if (meta.note) summary = meta.note
  else if (meta.description) summary = meta.description

  return {
    id: row.id,
    created_at: row.created_at,
    type: action,
    summary,
    detail: meta,
  }
}

// ── Icon by type ─────────────────────────────────────────────────────────────

function EntryIcon({ type }: { type: string }) {
  const cls = 'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0'
  const t = type.toLowerCase()

  if (t.includes('email_inbound') || t.includes('email_received')) {
    return (
      <div className={`${cls} bg-blue-50`}>
        <Mail size={14} className="text-blue-600" />
      </div>
    )
  }
  if (t.includes('email_outbound') || t.includes('email_sent')) {
    return (
      <div className={`${cls} bg-emerald-50`}>
        <Send size={14} className="text-emerald-600" />
      </div>
    )
  }
  if (t.includes('doc') || t.includes('file') || t.includes('upload')) {
    return (
      <div className={`${cls} bg-amber-50`}>
        <FileText size={14} className="text-amber-600" />
      </div>
    )
  }
  if (t.includes('call') || t.includes('phone')) {
    return (
      <div className={`${cls} bg-purple-50`}>
        <Phone size={14} className="text-purple-600" />
      </div>
    )
  }
  if (t.includes('note')) {
    return (
      <div className={`${cls} bg-slate-100`}>
        <StickyNote size={14} className="text-slate-500" />
      </div>
    )
  }
  return (
    <div className={`${cls} bg-slate-100`}>
      <Activity size={14} className="text-slate-400" />
    </div>
  )
}

// ── Relative timestamp ────────────────────────────────────────────────────────

function relativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d ago`
  return new Date(isoString).toLocaleDateString()
}

// ── Single entry ─────────────────────────────────────────────────────────────

function TimelineEntry({ entry }: { entry: NormalizedEntry }) {
  const [expanded, setExpanded] = useState(false)
  const hasDetail = entry.detail && Object.keys(entry.detail).length > 0

  return (
    <div className="flex gap-3 group">
      <div className="flex flex-col items-center">
        <EntryIcon type={entry.type} />
        <div className="w-px flex-1 bg-slate-100 mt-1" />
      </div>

      <div className="pb-5 flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-slate-700 leading-snug break-words">{entry.summary}</p>
          <span className="text-xs text-slate-400 whitespace-nowrap flex-shrink-0 mt-0.5">
            {relativeTime(entry.created_at)}
          </span>
        </div>

        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-slate-400 capitalize">
            {entry.type.replace(/_/g, ' ')}
          </span>

          {hasDetail && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="inline-flex items-center gap-0.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              {expanded ? (
                <><ChevronUp size={11} /> hide</>
              ) : (
                <><ChevronDown size={11} /> details</>
              )}
            </button>
          )}
        </div>

        {expanded && hasDetail && (
          <pre className="mt-2 p-2 rounded bg-slate-50 border border-slate-100 text-xs text-slate-600 overflow-x-auto whitespace-pre-wrap break-words max-h-64 overflow-y-auto">
            {JSON.stringify(entry.detail, null, 2)}
          </pre>
        )}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

const PAGE_SIZE = 20

type Props = {
  rows: ActivityLogRow[]
  loading?: boolean
}

export default function ActivityTimeline({ rows, loading = false }: Props) {
  const [page, setPage] = useState(1)

  const entries = rows.map(normalize)
  const visible = entries.slice(0, page * PAGE_SIZE)
  const hasMore = entries.length > visible.length

  if (loading) {
    return (
      <div className="py-10 text-center text-sm text-slate-400 animate-pulse">
        Loading activity...
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-slate-400">
        No activity yet.
      </div>
    )
  }

  return (
    <div>
      {visible.map((entry, i) => (
        <div key={entry.id} className={i === visible.length - 1 ? '[&_.w-px]:hidden' : ''}>
          <TimelineEntry entry={entry} />
        </div>
      ))}

      {hasMore && (
        <button
          onClick={() => setPage((p) => p + 1)}
          className="text-xs text-emerald-600 hover:text-emerald-700 font-medium mt-1"
        >
          Load {Math.min(PAGE_SIZE, entries.length - visible.length)} more
        </button>
      )}
    </div>
  )
}
