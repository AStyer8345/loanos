'use client'

import { useState } from 'react'
import type { AutomationConfig } from '@/lib/automations/types'

const GOLD = '#C9A84C'
const MONO = "'IBM Plex Mono', 'Courier New', monospace"

type PanelState = 'idle' | 'loading' | 'preview'

interface AskClaudePanelProps {
  automationId: string
  currentConfig: AutomationConfig
  onApply: (newConfig: AutomationConfig) => void
}

export default function AskClaudePanel({
  automationId,
  currentConfig,
  onApply,
}: AskClaudePanelProps) {
  const [state, setState] = useState<PanelState>('idle')
  const [instruction, setInstruction] = useState('')
  const [previewConfig, setPreviewConfig] = useState<AutomationConfig | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleUpdateAgent() {
    if (!instruction.trim()) return

    setState('loading')
    setError(null)

    try {
      const res = await fetch(`/api/automations/registry/${automationId}/ask-claude`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instruction: instruction.trim() }),
      })

      if (!res.ok) {
        const body = await res.text()
        throw new Error(body || `HTTP ${res.status}`)
      }

      const data = (await res.json()) as { config: AutomationConfig }
      setPreviewConfig(data.config)
      setState('preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setState('idle')
    }
  }

  function handleApply() {
    if (previewConfig) {
      onApply(previewConfig)
    }
    setInstruction('')
    setPreviewConfig(null)
    setState('idle')
  }

  function handleCancel() {
    setPreviewConfig(null)
    setState('idle')
  }

  return (
    <div
      className="flex flex-col gap-4 p-4 bg-[var(--bg)] border border-input rounded"
      style={{ fontFamily: MONO }}
    >
      {/* Header */}
      <div
        className="font-bold"
        style={{ color: GOLD, fontSize: 9, letterSpacing: '0.2em' }}
      >
        ASK CLAUDE
      </div>

      {/* Instruction textarea */}
      <div>
        <textarea
          value={instruction}
          placeholder="Tell Claude what you want this agent to do differently"
          rows={4}
          disabled={state === 'loading' || state === 'preview'}
          onChange={(e) => setInstruction(e.target.value)}
          className="w-full px-2 py-2 text-xs text-foreground bg-background border border-input rounded resize-none focus:outline-none focus:border-[#C9A84C] placeholder:text-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ fontFamily: MONO }}
        />
      </div>

      {/* Update Agent button */}
      {state !== 'preview' && (
        <button
          onClick={handleUpdateAgent}
          disabled={state === 'loading' || !instruction.trim()}
          className="px-3 py-2 text-xs border border-input bg-card text-muted-foreground rounded transition-colors hover:text-[#C9A84C] hover:border-[#C9A84C] disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ fontFamily: MONO }}
        >
          {state === 'loading' ? 'Thinking...' : 'Update Agent'}
        </button>
      )}

      {/* Error */}
      {error && (
        <div
          className="px-2 py-1.5 rounded border border-red-900 text-red-400 text-xs"
          style={{ background: 'rgba(239,68,68,0.08)', fontFamily: MONO }}
        >
          {error}
        </div>
      )}

      {/* Preview Changes */}
      {state === 'preview' && previewConfig && (
        <PreviewChanges
          oldConfig={currentConfig}
          newConfig={previewConfig}
          onApply={handleApply}
          onCancel={handleCancel}
        />
      )}
    </div>
  )
}

// ── Preview Changes ───────────────────────────────────────────────────────────

interface PreviewChangesProps {
  oldConfig: AutomationConfig
  newConfig: AutomationConfig
  onApply: () => void
  onCancel: () => void
}

function PreviewChanges({ oldConfig, newConfig, onApply, onCancel }: PreviewChangesProps) {
  const diff = buildDiff(oldConfig, newConfig)

  return (
    <div className="flex flex-col gap-3">
      {/* Section label */}
      <div
        className="text-muted-foreground"
        style={{ fontSize: 9, letterSpacing: '0.15em' }}
      >
        PREVIEW CHANGES
      </div>

      {/* Diff lines */}
      <div
        className="rounded border border-input overflow-auto"
        style={{ background: 'var(--bg)', maxHeight: 240 }}
      >
        {diff.length === 0 ? (
          <div className="px-3 py-2 text-muted-foreground text-xs">No changes detected</div>
        ) : (
          diff.map((line, i) => (
            <DiffLine key={i} line={line} />
          ))
        )}
      </div>

      {/* Apply / Cancel */}
      <div className="flex gap-2">
        <button
          onClick={onApply}
          className="px-3 py-1.5 text-xs border rounded transition-colors"
          style={{
            fontFamily: MONO,
            background: 'rgba(74,222,128,0.08)',
            color: '#4ADE80',
            borderColor: '#4ADE80',
          }}
        >
          Apply
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-xs border border-input bg-card text-muted-foreground rounded transition-colors hover:text-foreground hover:border-zinc-500"
          style={{ fontFamily: MONO }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── Diff line ─────────────────────────────────────────────────────────────────

type DiffLineData =
  | { kind: 'removed'; text: string }
  | { kind: 'added'; text: string }
  | { kind: 'context'; text: string }

function DiffLine({ line }: { line: DiffLineData }) {
  const prefix = line.kind === 'removed' ? '-' : line.kind === 'added' ? '+' : ' '
  const color =
    line.kind === 'removed'
      ? '#ef4444'
      : line.kind === 'added'
      ? '#4ADE80'
      : '#52525b'
  const bg =
    line.kind === 'removed'
      ? 'rgba(239,68,68,0.06)'
      : line.kind === 'added'
      ? 'rgba(74,222,128,0.06)'
      : 'transparent'

  return (
    <div
      className="px-3 py-0.5 text-xs whitespace-pre-wrap break-all"
      style={{ fontFamily: MONO, color, background: bg, fontSize: 10 }}
    >
      {prefix} {line.text}
    </div>
  )
}

// ── Diff builder ──────────────────────────────────────────────────────────────

function buildDiff(oldConfig: AutomationConfig, newConfig: AutomationConfig): DiffLineData[] {
  const lines: DiffLineData[] = []

  const allKeys = new Set([
    ...Object.keys(oldConfig as Record<string, unknown>),
    ...Object.keys(newConfig as Record<string, unknown>),
  ])

  for (const key of allKeys) {
    const oldVal = (oldConfig as Record<string, unknown>)[key]
    const newVal = (newConfig as Record<string, unknown>)[key]

    const oldStr = formatValue(oldVal)
    const newStr = formatValue(newVal)

    if (oldStr === newStr) {
      lines.push({ kind: 'context', text: `${key}: ${oldStr}` })
    } else {
      if (oldVal !== undefined) {
        lines.push({ kind: 'removed', text: `${key}: ${oldStr}` })
      }
      if (newVal !== undefined) {
        lines.push({ kind: 'added', text: `${key}: ${newStr}` })
      }
    }
  }

  return lines
}

function formatValue(val: unknown): string {
  if (val === undefined || val === null) return '—'
  if (Array.isArray(val)) return val.length > 0 ? val.join(', ') : '(empty)'
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}
