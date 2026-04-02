'use client'

import { useState, useMemo } from 'react'
import type { EmailMode } from '@/lib/automations/types'

const GOLD = '#C9A84C'
const MONO = "'IBM Plex Mono', 'Courier New', monospace"

interface EmailTemplateEditorProps {
  template: string
  mode: EmailMode
  onTemplateChange: (value: string) => void
  onModeChange: (mode: EmailMode) => void
}

const MODE_OPTIONS: Array<{ id: EmailMode; label: string }> = [
  { id: 'ai_generated', label: 'AI Generated' },
  { id: 'fixed_template', label: 'Fixed Template' },
  { id: 'hybrid', label: 'Hybrid' },
]

// Parse template into segments: plain text or variable tokens
type Segment = { kind: 'text'; value: string } | { kind: 'variable'; value: string }

function parseTemplate(template: string): Segment[] {
  const segments: Segment[] = []
  const regex = /\{\{([^}]+)\}\}/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(template)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ kind: 'text', value: template.slice(lastIndex, match.index) })
    }
    segments.push({ kind: 'variable', value: match[0] })
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < template.length) {
    segments.push({ kind: 'text', value: template.slice(lastIndex) })
  }

  return segments
}

export default function EmailTemplateEditor({
  template,
  mode,
  onTemplateChange,
  onModeChange,
}: EmailTemplateEditorProps) {
  const [showPreview, setShowPreview] = useState(false)
  const segments = useMemo(() => parseTemplate(template), [template])

  return (
    <div className="flex flex-col gap-3" style={{ fontFamily: MONO }}>
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div
          className="text-zinc-500"
          style={{ fontSize: 9, letterSpacing: '0.15em', fontFamily: MONO }}
        >
          EMAIL TEMPLATE
        </div>
        <button
          onClick={() => setShowPreview(v => !v)}
          className="text-xs px-2 py-0.5 rounded border border-zinc-700 text-zinc-400 transition-colors hover:border-[#C9A84C] hover:text-[#C9A84C]"
          style={{ fontFamily: MONO, fontSize: 10 }}
        >
          {showPreview ? 'Edit' : 'Preview'}
        </button>
      </div>

      {/* Edit view */}
      {!showPreview && (
        <textarea
          value={template}
          onChange={e => onTemplateChange(e.target.value)}
          rows={10}
          className="w-full px-3 py-2 text-xs text-zinc-200 bg-zinc-950 border border-input rounded resize-none focus:outline-none focus:border-[#C9A84C] placeholder:text-zinc-600"
          style={{ fontFamily: MONO, lineHeight: 1.7 }}
          placeholder="Write your email template here. Use {{variable_name}} for dynamic values."
        />
      )}

      {/* Preview — variables rendered as gold pills */}
      {showPreview && (
        <div
          className="min-h-[160px] px-3 py-2 border border-input rounded bg-zinc-950"
          style={{ lineHeight: 1.9, fontSize: 12 }}
        >
          {segments.length === 0 ? (
            <span className="text-zinc-600 text-xs" style={{ fontFamily: MONO }}>
              (empty template)
            </span>
          ) : (
            segments.map((seg, i) =>
              seg.kind === 'variable' ? (
                <span
                  key={i}
                  className="inline-flex items-center px-1.5 py-0.5 rounded mx-0.5 text-xs font-bold"
                  style={{
                    fontFamily: MONO,
                    background: 'rgba(201,168,76,0.20)',
                    color: GOLD,
                    border: `1px solid rgba(201,168,76,0.35)`,
                    fontSize: 10,
                    userSelect: 'none',
                  }}
                >
                  {seg.value}
                </span>
              ) : (
                <span
                  key={i}
                  className="text-zinc-300 whitespace-pre-wrap"
                  style={{ fontFamily: MONO, fontSize: 12 }}
                >
                  {seg.value}
                </span>
              )
            )
          )}
        </div>
      )}

      {/* Mode toggle */}
      <div className="flex items-center gap-1 pt-1">
        <span
          className="text-zinc-500 mr-2"
          style={{ fontSize: 9, letterSpacing: '0.12em', fontFamily: MONO }}
        >
          MODE
        </span>
        {MODE_OPTIONS.map(opt => (
          <button
            key={opt.id}
            onClick={() => onModeChange(opt.id)}
            className="px-2 py-0.5 rounded text-xs border transition-colors"
            style={{
              fontFamily: MONO,
              fontSize: 10,
              background: mode === opt.id ? 'rgba(201,168,76,0.12)' : '#18181b',
              color: mode === opt.id ? GOLD : '#71717a',
              borderColor: mode === opt.id ? GOLD : '#3f3f46',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
