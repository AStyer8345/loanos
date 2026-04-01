'use client'

import { useState } from 'react'

const GOLD = '#C9A84C'

export type SocialDraft = {
  id: string
  platform: string | null
  format: string | null
  pillar: string | null
  title: string | null
  content: string | null
  hashtags: string | null
  media_urls: string[] | null
  status: 'draft' | 'approved' | 'scheduled' | 'posted' | 'rejected'
  scheduled_for: string | null
  agent_notes: string | null
  publer_post_id: string | null
  rejection_reason?: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

type Props = {
  drafts: SocialDraft[]
  selectedId: string | null
  onSelect: (id: string) => void
  onCompose: () => void
}

type FilterStatus = 'ALL' | 'draft' | 'approved' | 'scheduled'

const FILTERS: { key: FilterStatus; label: string }[] = [
  { key: 'ALL', label: 'ALL' },
  { key: 'draft', label: 'DRAFT' },
  { key: 'approved', label: 'APPROVED' },
  { key: 'scheduled', label: 'SCHEDULED' },
]

const STATUS_COLORS: Record<string, string> = {
  draft: '#D97706',
  approved: '#4CAF82',
  scheduled: '#3B82F6',
  posted: '#9B72CF',
  rejected: '#E05252',
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function SocialDraftList({ drafts, selectedId, onSelect, onCompose }: Props) {
  const [filter, setFilter] = useState<FilterStatus>('ALL')

  const filtered = filter === 'ALL'
    ? drafts
    : drafts.filter((d) => d.status === filter)

  return (
    <div
      className="w-72 border-r border-zinc-800 flex flex-col h-full"
      style={{ fontFamily: "'IBM Plex Mono', 'Courier New', monospace" }}
    >
      {/* New Post button */}
      <div className="p-3">
        <button
          onClick={onCompose}
          className="w-full py-2 rounded-sm text-xs font-bold tracking-widest transition-opacity hover:opacity-80"
          style={{ background: GOLD, color: '#09090b', fontFamily: 'inherit' }}
        >
          + NEW POST
        </button>
      </div>

      {/* Filter pills */}
      <div className="flex gap-1 px-3 pb-2">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className="px-2 py-0.5 rounded-sm text-xs font-bold transition-colors"
            style={{
              background: filter === key ? GOLD : 'transparent',
              color: filter === key ? '#09090b' : '#71717a',
              border: filter === key ? `1px solid ${GOLD}` : '1px solid #3f3f46',
              fontFamily: 'inherit',
              fontSize: 10,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Draft list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <div className="px-3 py-6 text-center">
            <span className="text-zinc-600" style={{ fontSize: 11 }}>No drafts found</span>
          </div>
        )}
        {filtered.map((draft) => {
          const isSelected = draft.id === selectedId
          const statusColor = STATUS_COLORS[draft.status] || '#71717a'
          return (
            <button
              key={draft.id}
              onClick={() => onSelect(draft.id)}
              className="w-full text-left px-3 py-2.5 border-b border-zinc-800/50 transition-colors hover:bg-zinc-900/50"
              style={{
                borderLeft: isSelected ? `2px solid ${GOLD}` : '2px solid transparent',
                background: isSelected ? `${GOLD}08` : 'transparent',
                fontFamily: 'inherit',
              }}
            >
              {/* Title */}
              <div
                className="truncate font-bold"
                style={{
                  fontSize: 11,
                  color: isSelected ? '#fff' : '#a1a1aa',
                }}
              >
                {draft.title || 'Untitled'}
              </div>

              {/* Status badge */}
              <div className="mt-1 flex items-center gap-2">
                <span
                  className="inline-block px-1.5 py-0.5 rounded-sm font-bold uppercase"
                  style={{
                    fontSize: 9,
                    background: `${statusColor}20`,
                    color: statusColor,
                    border: `1px solid ${statusColor}40`,
                  }}
                >
                  {draft.status}
                </span>
              </div>

              {/* Subtitle */}
              <div className="mt-1 text-zinc-600 truncate" style={{ fontSize: 10 }}>
                {[
                  draft.platform,
                  draft.pillar,
                  formatDate(draft.scheduled_for || draft.created_at),
                ]
                  .filter(Boolean)
                  .join(' \u00B7 ')}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
