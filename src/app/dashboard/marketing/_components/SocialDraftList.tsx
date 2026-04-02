'use client'

import { useState } from 'react'

const GOLD = 'var(--primary)'

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

type FilterStatus = 'ALL' | 'draft' | 'approved' | 'scheduled' | 'rejected' | 'posted'
type FilterPlatform = 'ALL' | 'instagram' | 'linkedin' | 'facebook'
type FilterSource = 'ALL' | 'agent' | 'human'

const FILTERS: { key: FilterStatus; label: string }[] = [
  { key: 'ALL', label: 'ALL' },
  { key: 'draft', label: 'DRAFT' },
  { key: 'approved', label: 'APPROVED' },
  { key: 'scheduled', label: 'SCHEDULED' },
  { key: 'posted', label: 'POSTED' },
  { key: 'rejected', label: 'REJECTED' },
]

const PLATFORM_FILTERS: { key: FilterPlatform; label: string }[] = [
  { key: 'ALL', label: 'ALL' },
  { key: 'linkedin', label: 'LI' },
  { key: 'instagram', label: 'IG' },
  { key: 'facebook', label: 'FB' },
]

const SOURCE_FILTERS: { key: FilterSource; label: string }[] = [
  { key: 'ALL', label: 'ALL' },
  { key: 'agent', label: 'AGENT' },
  { key: 'human', label: 'MANUAL' },
]

const STATUS_COLORS: Record<string, string> = {
  draft: '#D97706',
  approved: '#4CAF82',
  scheduled: '#3B82F6',
  posted: '#9B72CF',
  rejected: '#E05252',
}

const PLATFORM_LABELS: Record<string, string> = {
  instagram: 'IG',
  linkedin: 'LI',
  facebook: 'FB',
  all: 'ALL',
}

function normalizePlatform(platform: string | null): FilterPlatform | 'all' | null {
  if (!platform) return null
  const normalized = platform.toLowerCase()
  if (normalized === 'all') return 'all'
  if (normalized === 'instagram' || normalized === 'linkedin' || normalized === 'facebook') {
    return normalized
  }
  return null
}

function normalizeCreatedBy(createdBy: string | null): FilterSource {
  return createdBy === 'agent' ? 'agent' : 'human'
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function SocialDraftList({ drafts, selectedId, onSelect, onCompose }: Props) {
  const [filter, setFilter] = useState<FilterStatus>('ALL')
  const [platformFilter, setPlatformFilter] = useState<FilterPlatform>('ALL')
  const [sourceFilter, setSourceFilter] = useState<FilterSource>('ALL')

  const filtered = drafts.filter((d) => {
    const normalizedPlatform = normalizePlatform(d.platform)
    const normalizedSource = normalizeCreatedBy(d.created_by)

    if (filter !== 'ALL' && d.status !== filter) return false
    if (
      platformFilter !== 'ALL'
      && normalizedPlatform !== platformFilter
      && normalizedPlatform !== 'all'
    ) return false
    if (sourceFilter !== 'ALL' && normalizedSource !== sourceFilter) return false
    return true
  })

  function renderFilterRow(
    items: { key: string; label: string }[],
    active: string,
    onSet: (k: string) => void,
  ) {
    return (
      <div className="flex gap-1 px-3 pb-1.5 flex-wrap">
        {items.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onSet(key)}
            className="px-2 py-0.5 rounded-sm text-xs font-bold transition-colors"
            style={{
              background: active === key ? GOLD : 'transparent',
              color: active === key ? 'var(--bg)' : 'var(--muted-foreground)',
              border: active === key ? `1px solid ${GOLD}` : '1px solid var(--border)',
              fontFamily: 'inherit',
              fontSize: 10,
            }}
          >
            {label}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div
      className="w-72 border-r border-input flex flex-col h-full"
      style={{ fontFamily: "'IBM Plex Mono', 'Courier New', monospace" }}
    >
      {/* New Post button */}
      <div className="p-3">
        <button
          onClick={onCompose}
          className="w-full py-2 rounded-sm text-xs font-bold tracking-widest transition-opacity hover:opacity-80"
          style={{ background: GOLD, color: 'var(--bg)', fontFamily: 'inherit' }}
        >
          + NEW POST
        </button>
      </div>

      {/* Filter pills — status */}
      {renderFilterRow(FILTERS, filter, (k) => setFilter(k as FilterStatus))}

      {/* Filter pills — platform */}
      {renderFilterRow(PLATFORM_FILTERS, platformFilter, (k) => setPlatformFilter(k as FilterPlatform))}

      {/* Filter pills — source */}
      {renderFilterRow(SOURCE_FILTERS, sourceFilter, (k) => setSourceFilter(k as FilterSource))}

      {/* Count */}
      <div className="px-3 pb-2">
        <span className="text-muted-foreground" style={{ fontSize: 10 }}>
          {filtered.length} of {drafts.length} posts
        </span>
      </div>

      {/* Draft list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <div className="px-3 py-6 text-center">
            <span className="text-muted-foreground" style={{ fontSize: 11 }}>No drafts found</span>
          </div>
        )}
        {filtered.map((draft) => {
          const isSelected = draft.id === selectedId
          const statusColor = STATUS_COLORS[draft.status] || 'var(--muted-foreground)'
          return (
            <button
              key={draft.id}
              onClick={() => onSelect(draft.id)}
              className="w-full text-left px-3 py-2.5 border-b border-input/50 transition-colors hover:bg-card/50"
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
                  color: isSelected ? 'var(--foreground)' : 'var(--muted-foreground)',
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
                {draft.platform && PLATFORM_LABELS[draft.platform] && (
                  <span
                    className="inline-block px-1.5 py-0.5 rounded-sm font-bold uppercase"
                    style={{
                      fontSize: 9,
                      background: 'var(--surface)',
                      color: 'var(--muted-foreground)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    {PLATFORM_LABELS[draft.platform]}
                  </span>
                )}
              </div>

              {/* Subtitle */}
              <div className="mt-1 text-muted-foreground truncate" style={{ fontSize: 10 }}>
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
