'use client'

import type { AutomationRegistryRow } from '@/lib/automations/types'

const GOLD = '#C9A84C'
const MONO = "'IBM Plex Mono', 'Courier New', monospace"

interface StatusBarProps {
  automations: AutomationRegistryRow[]
  onBulkAction: (action: 'pause_all' | 'resume_all') => void
  loading?: boolean
}

export default function StatusBar({ automations, onBulkAction, loading }: StatusBarProps) {
  const activeCount = automations.filter(a => a.status === 'active').length
  const pausedCount = automations.filter(a => a.status === 'paused').length
  const erroredCount = automations.filter(a => a.status === 'errored').length

  return (
    <div
      className="flex items-center justify-between px-4 py-3 bg-[#09090b] border border-zinc-800"
      style={{ borderLeft: `3px solid ${GOLD}`, fontFamily: MONO }}
    >
      {/* Left: status counts */}
      <div className="flex items-center gap-5">
        <StatusCount
          dot="#4ADE80"
          count={activeCount}
          label="Active"
        />
        <StatusCount
          dot="#fbbf24"
          count={pausedCount}
          label="Paused"
        />
        <StatusCount
          dot="#ef4444"
          count={erroredCount}
          label="Errored"
        />
      </div>

      {/* Right: bulk actions */}
      <div className="flex items-center gap-2">
        <BulkButton
          label="Pause All"
          onClick={() => onBulkAction('pause_all')}
          disabled={loading || activeCount === 0}
        />
        <BulkButton
          label="Resume All"
          onClick={() => onBulkAction('resume_all')}
          disabled={loading || pausedCount === 0}
        />
      </div>
    </div>
  )
}

function StatusCount({ dot, count, label }: { dot: string; count: number; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="inline-block w-2 h-2 rounded-full flex-shrink-0"
        style={{ background: dot }}
      />
      <span
        className="text-zinc-100 text-xs tabular-nums"
        style={{ fontFamily: "'IBM Plex Mono', 'Courier New', monospace" }}
      >
        {count}
      </span>
      <span
        className="text-zinc-500 text-xs"
        style={{ fontFamily: "'IBM Plex Mono', 'Courier New', monospace" }}
      >
        {label}
      </span>
    </div>
  )
}

function BulkButton({
  label,
  onClick,
  disabled,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-3 py-1.5 text-xs border border-zinc-700 bg-zinc-900 text-zinc-400 rounded transition-colors hover:text-[#C9A84C] hover:border-[#C9A84C] disabled:opacity-30 disabled:cursor-not-allowed"
      style={{ fontFamily: "'IBM Plex Mono', 'Courier New', monospace" }}
    >
      {label}
    </button>
  )
}
