'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

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
  { key: 'ALL', label: 'All' },
  { key: 'draft', label: 'Draft' },
  { key: 'approved', label: 'Approved' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'posted', label: 'Posted' },
  { key: 'rejected', label: 'Rejected' },
]

const PLATFORM_FILTERS: { key: FilterPlatform; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'linkedin', label: 'LI' },
  { key: 'instagram', label: 'IG' },
  { key: 'facebook', label: 'FB' },
]

const SOURCE_FILTERS: { key: FilterSource; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'agent', label: 'Agent' },
  { key: 'human', label: 'Manual' },
]

const STATUS_VARIANT: Record<string, 'default' | 'success' | 'info' | 'destructive' | 'warning' | 'secondary'> = {
  draft: 'warning',
  approved: 'success',
  scheduled: 'info',
  posted: 'default',
  rejected: 'destructive',
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

function FilterPills({
  items,
  active,
  onSet,
}: {
  items: { key: string; label: string }[]
  active: string
  onSet: (k: string) => void
}) {
  return (
    <div className="flex gap-1 flex-wrap">
      {items.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onSet(key)}
          className={cn(
            'px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wide transition-all',
            active === key
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-transparent text-muted-foreground border border-input hover:bg-accent hover:text-accent-foreground',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
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

  return (
    <div className="w-72 border-r border-input flex flex-col h-full bg-card/30">
      {/* New Post button */}
      <div className="p-3">
        <Button
          onClick={onCompose}
          className="w-full font-semibold tracking-wider text-xs"
          size="sm"
        >
          + New Post
        </Button>
      </div>

      {/* Filters */}
      <div className="px-3 space-y-2 pb-3">
        <FilterPills items={FILTERS} active={filter} onSet={(k) => setFilter(k as FilterStatus)} />
        <FilterPills items={PLATFORM_FILTERS} active={platformFilter} onSet={(k) => setPlatformFilter(k as FilterPlatform)} />
        <FilterPills items={SOURCE_FILTERS} active={sourceFilter} onSet={(k) => setSourceFilter(k as FilterSource)} />
      </div>

      <Separator />

      {/* Count */}
      <div className="px-3 py-2">
        <span className="text-muted-foreground text-[10px] font-medium">
          {filtered.length} of {drafts.length} posts
        </span>
      </div>

      {/* Draft list */}
      <ScrollArea className="flex-1">
        {filtered.length === 0 && (
          <div className="px-3 py-8 text-center">
            <span className="text-muted-foreground text-xs">No drafts found</span>
          </div>
        )}
        {filtered.map((draft) => {
          const isSelected = draft.id === selectedId
          return (
            <button
              key={draft.id}
              onClick={() => onSelect(draft.id)}
              className={cn(
                'w-full text-left px-3 py-3 border-b border-input/30 transition-all group',
                isSelected
                  ? 'bg-primary/5 border-l-2 border-l-primary'
                  : 'border-l-2 border-l-transparent hover:bg-card/60',
              )}
            >
              {/* Title */}
              <div
                className={cn(
                  'truncate text-[11px] font-semibold leading-tight',
                  isSelected ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground',
                )}
              >
                {draft.title || 'Untitled'}
              </div>

              {/* Status + platform badges */}
              <div className="mt-1.5 flex items-center gap-1.5">
                <Badge
                  variant={STATUS_VARIANT[draft.status] || 'outline'}
                  className="text-[9px] px-1.5 py-0 h-4 uppercase"
                >
                  {draft.status}
                </Badge>
                {draft.platform && PLATFORM_LABELS[draft.platform] && (
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">
                    {PLATFORM_LABELS[draft.platform]}
                  </Badge>
                )}
              </div>

              {/* Subtitle */}
              <div className="mt-1 text-muted-foreground truncate text-[10px]">
                {[
                  draft.platform,
                  draft.pillar,
                  formatDate(draft.scheduled_for || draft.created_at),
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </div>
            </button>
          )
        })}
      </ScrollArea>
    </div>
  )
}
