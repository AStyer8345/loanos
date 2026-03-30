'use client'

import type { AutomationRegistryRow, AutomationStatus, AutomationSource, TriggerType } from '@/lib/automations/types'

const GOLD = '#C9A84C'
const MONO = "'IBM Plex Mono', 'Courier New', monospace"

// ── Relative time helper ──────────────────────────────────────────────────────

export function relativeTime(dateStr: string | null): string {
  if (!dateStr) return 'never'

  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return 'never'

  const now = Date.now()
  const diffMs = now - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  if (diffSec < 60) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDay < 7) return `${diffDay}d ago`

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ── Status dot color ──────────────────────────────────────────────────────────

function statusColor(status: AutomationStatus): string {
  switch (status) {
    case 'active': return '#4ADE80'
    case 'paused': return '#fbbf24'
    case 'errored': return '#ef4444'
    case 'disabled': return '#52525b'
    default: return '#52525b'
  }
}

// ── Source badge label ────────────────────────────────────────────────────────

function sourceBadgeLabel(source: AutomationSource): string {
  switch (source) {
    case 'n8n': return 'n8n'
    case 'claude_code': return 'claude'
    case 'supabase_setting': return 'setting'
    default: return source
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

interface AutomationRowProps {
  automation: AutomationRegistryRow
  isExpanded: boolean
  onToggle: () => void
}

export default function AutomationRow({ automation, isExpanded, onToggle }: AutomationRowProps) {
  const dot = statusColor(automation.status)
  const lastRun = relativeTime(automation.last_run_at)

  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-zinc-900/50 border-b border-zinc-800/50"
      style={{ fontFamily: MONO }}
    >
      {/* Status dot */}
      <span
        className="inline-block w-2 h-2 rounded-full flex-shrink-0"
        style={{ background: dot }}
      />

      {/* Name */}
      <span className="flex-1 text-xs font-bold text-zinc-100 truncate min-w-0">
        {automation.name}
      </span>

      {/* Source badge */}
      <SystemBadge label={sourceBadgeLabel(automation.source)} />

      {/* Trigger badge */}
      <SystemBadge label={triggerLabel(automation.trigger_type)} />

      {/* Last run */}
      <span
        className="text-zinc-500 flex-shrink-0 hidden sm:block"
        style={{ fontSize: 10, minWidth: 56, textAlign: 'right' }}
      >
        {lastRun}
      </span>

      {/* Expand arrow */}
      <span
        className="flex-shrink-0 text-xs"
        style={{ color: GOLD }}
      >
        {isExpanded ? '▾' : '▸'}
      </span>
    </button>
  )
}

function SystemBadge({ label }: { label: string }) {
  return (
    <span
      className="flex-shrink-0 px-1.5 py-0.5 rounded text-[#a1a1aa]"
      style={{
        background: '#27272a',
        fontSize: 9,
        fontFamily: MONO,
        letterSpacing: '0.05em',
      }}
    >
      {label}
    </span>
  )
}

function triggerLabel(trigger: TriggerType): string {
  switch (trigger) {
    case 'webhook': return 'webhook'
    case 'schedule': return 'schedule'
    case 'manual': return 'manual'
    case 'disabled': return 'disabled'
    default: return trigger
  }
}
