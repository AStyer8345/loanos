'use client'

import { useState } from 'react'
import type {
  AgentConfig,
  EmailConfig,
  AssistantConfig,
  AutomationConfig,
  AutomationSource,
  AutomationStatus,
} from '@/lib/automations/types'

const GOLD = '#C9A84C'
const MONO = "'IBM Plex Mono', 'Courier New', monospace"

interface GuidedControlsProps {
  config: AutomationConfig
  source: AutomationSource
  status: AutomationStatus
  schedule: string | null
  onChange: (updates: Partial<AutomationConfig>) => void
}

export default function GuidedControls({
  config,
  source,
  status,
  schedule,
  onChange,
}: GuidedControlsProps) {
  return (
    <div className="flex flex-col gap-4" style={{ fontFamily: MONO }}>
      {/* Status toggle */}
      <StatusToggle status={status} onChange={onChange} />

      {/* Source-specific controls */}
      {source === 'claude_code' && (
        <AgentControls config={config as AgentConfig} onChange={onChange} />
      )}
      {source === 'n8n' && (
        <EmailControls config={config as EmailConfig} onChange={onChange} />
      )}
      {source === 'supabase_setting' && (
        <AssistantControls config={config as AssistantConfig} onChange={onChange} />
      )}

      {/* Schedule (read-only) */}
      {schedule && (
        <div>
          <SectionLabel>SCHEDULE</SectionLabel>
          <div
            className="mt-1 px-2 py-1.5 border border-input rounded text-muted-foreground text-xs"
            style={{ fontFamily: MONO, background: 'var(--bg)' }}
          >
            {schedule}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Status Toggle ─────────────────────────────────────────────────────────────

function StatusToggle({
  status,
  onChange,
}: {
  status: AutomationStatus
  onChange: (updates: Partial<AutomationConfig>) => void
}) {
  // onChange for status is handled outside config — expose via a special key
  // We use a workaround: callers check for `_status` in updates
  const isActive = status === 'active'
  const isPaused = status === 'paused'

  return (
    <div>
      <SectionLabel>STATUS</SectionLabel>
      <div className="flex gap-2 mt-1">
        <ToggleButton
          label="Active"
          active={isActive}
          activeColor="#4ADE80"
          onClick={() => (onChange as (u: Record<string, unknown>) => void)({ _status: 'active' })}
        />
        <ToggleButton
          label="Paused"
          active={isPaused}
          activeColor="#fbbf24"
          onClick={() => (onChange as (u: Record<string, unknown>) => void)({ _status: 'paused' })}
        />
      </div>
    </div>
  )
}

// ── Agent Controls (claude_code) ──────────────────────────────────────────────

function AgentControls({
  config,
  onChange,
}: {
  config: AgentConfig
  onChange: (updates: Partial<AgentConfig>) => void
}) {
  const focusAreas = config.focus_areas ?? []

  return (
    <>
      {/* Focus Areas */}
      <div>
        <SectionLabel>FOCUS AREAS</SectionLabel>
        <ChipList
          chips={focusAreas}
          activeChips={focusAreas}
          onToggle={(chip) => {
            const next = focusAreas.includes(chip)
              ? focusAreas.filter((f) => f !== chip)
              : [...focusAreas, chip]
            onChange({ focus_areas: next })
          }}
        />
      </div>

      {/* Avoid */}
      <div>
        <SectionLabel>AVOID</SectionLabel>
        <TextInput
          value={config.avoid ?? ''}
          placeholder="Topics or actions to avoid..."
          onChange={(val) => onChange({ avoid: val })}
        />
      </div>

      {/* Priority This Week */}
      <div>
        <SectionLabel>PRIORITY THIS WEEK</SectionLabel>
        <TextInput
          value={config.priority ?? ''}
          placeholder="What should this agent focus on this week..."
          onChange={(val) => onChange({ priority: val })}
        />
      </div>
    </>
  )
}

// ── Email Controls (n8n) ──────────────────────────────────────────────────────

const TONE_OPTIONS: Array<NonNullable<EmailConfig['tone']>> = ['formal', 'conversational', 'casual']
const LENGTH_OPTIONS: Array<NonNullable<EmailConfig['length']>> = ['short', 'medium', 'long']

function EmailControls({
  config,
  onChange,
}: {
  config: EmailConfig
  onChange: (updates: Partial<EmailConfig>) => void
}) {
  const alwaysInclude = config.always_include ?? []
  const neverInclude = config.never_include ?? []

  return (
    <>
      {/* Tone */}
      <div>
        <SectionLabel>TONE</SectionLabel>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {TONE_OPTIONS.map((t) => (
            <Chip
              key={t}
              label={t}
              active={config.tone === t}
              onClick={() => onChange({ tone: t })}
            />
          ))}
        </div>
      </div>

      {/* Length */}
      <div>
        <SectionLabel>LENGTH</SectionLabel>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {LENGTH_OPTIONS.map((l) => (
            <Chip
              key={l}
              label={l}
              active={config.length === l}
              onClick={() => onChange({ length: l })}
            />
          ))}
        </div>
      </div>

      {/* Always Include */}
      <div>
        <SectionLabel>ALWAYS INCLUDE</SectionLabel>
        <EditableChipList
          chips={alwaysInclude}
          onChange={(next) => onChange({ always_include: next })}
        />
      </div>

      {/* Never Include */}
      <div>
        <SectionLabel>NEVER INCLUDE</SectionLabel>
        <EditableChipList
          chips={neverInclude}
          onChange={(next) => onChange({ never_include: next })}
        />
      </div>
    </>
  )
}

// ── Assistant Controls (supabase_setting) ─────────────────────────────────────

const ASSISTANT_TONE_OPTIONS: Array<NonNullable<AssistantConfig['tone']>> = [
  'professional',
  'friendly',
  'casual',
]

function AssistantControls({
  config,
  onChange,
}: {
  config: AssistantConfig
  onChange: (updates: Partial<AssistantConfig>) => void
}) {
  const topicsFocus = config.topics_focus ?? []
  const topicsAvoid = config.topics_avoid ?? []

  return (
    <>
      {/* Tone */}
      <div>
        <SectionLabel>TONE</SectionLabel>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {ASSISTANT_TONE_OPTIONS.map((t) => (
            <Chip
              key={t}
              label={t}
              active={config.tone === t}
              onClick={() => onChange({ tone: t })}
            />
          ))}
        </div>
      </div>

      {/* Topics Focus */}
      <div>
        <SectionLabel>TOPICS FOCUS</SectionLabel>
        <EditableChipList
          chips={topicsFocus}
          onChange={(next) => onChange({ topics_focus: next })}
        />
      </div>

      {/* Topics Avoid */}
      <div>
        <SectionLabel>TOPICS AVOID</SectionLabel>
        <EditableChipList
          chips={topicsAvoid}
          onChange={(next) => onChange({ topics_avoid: next })}
        />
      </div>

      {/* Key Instructions */}
      <div>
        <SectionLabel>KEY INSTRUCTIONS</SectionLabel>
        <textarea
          value={config.key_instructions ?? ''}
          placeholder="Key instructions for this assistant..."
          rows={3}
          onChange={(e) => onChange({ key_instructions: e.target.value })}
          className="w-full mt-1 px-2 py-1.5 text-xs text-foreground bg-[var(--bg)] border border-input rounded resize-none focus:outline-none focus:border-[#C9A84C] placeholder:text-muted-foreground"
          style={{ fontFamily: MONO }}
        />
      </div>
    </>
  )
}

// ── Shared Primitives ─────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="text-muted-foreground mb-1"
      style={{ fontSize: 9, letterSpacing: '0.15em', fontFamily: MONO }}
    >
      {children}
    </div>
  )
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="px-2 py-0.5 rounded text-xs border transition-colors"
      style={{
        fontFamily: MONO,
        fontSize: 10,
        background: active ? 'rgba(201,168,76,0.12)' : '#18181b',
        color: active ? GOLD : '#71717a',
        borderColor: active ? GOLD : '#3f3f46',
      }}
    >
      {label}
    </button>
  )
}

function ChipList({
  chips,
  activeChips,
  onToggle,
}: {
  chips: string[]
  activeChips: string[]
  onToggle: (chip: string) => void
}) {
  if (chips.length === 0) {
    return (
      <div className="mt-1 text-muted-foreground" style={{ fontSize: 10, fontFamily: MONO }}>
        No focus areas defined
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-1.5 mt-1">
      {chips.map((chip) => (
        <Chip
          key={chip}
          label={chip}
          active={activeChips.includes(chip)}
          onClick={() => onToggle(chip)}
        />
      ))}
    </div>
  )
}

function EditableChipList({
  chips,
  onChange,
}: {
  chips: string[]
  onChange: (next: string[]) => void
}) {
  const [inputVal, setInputVal] = useState('')

  function addChip() {
    const trimmed = inputVal.trim()
    if (trimmed && !chips.includes(trimmed)) {
      onChange([...chips, trimmed])
    }
    setInputVal('')
  }

  function removeChip(chip: string) {
    onChange(chips.filter((c) => c !== chip))
  }

  return (
    <div className="mt-1">
      <div className="flex flex-wrap gap-1.5 mb-1.5">
        {chips.map((chip) => (
          <span
            key={chip}
            className="flex items-center gap-1 px-2 py-0.5 rounded border text-xs"
            style={{
              fontFamily: MONO,
              fontSize: 10,
              background: 'rgba(201,168,76,0.12)',
              color: GOLD,
              borderColor: GOLD,
            }}
          >
            {chip}
            <button
              onClick={() => removeChip(chip)}
              className="ml-0.5 text-muted-foreground hover:text-foreground/80 leading-none"
              style={{ fontSize: 10 }}
              aria-label={`Remove ${chip}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-1.5">
        <input
          type="text"
          value={inputVal}
          placeholder="+ Add"
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addChip()
            }
          }}
          className="flex-1 px-2 py-1 text-xs text-foreground bg-[var(--bg)] border border-input rounded focus:outline-none focus:border-[#C9A84C] placeholder:text-muted-foreground"
          style={{ fontFamily: MONO, fontSize: 10 }}
        />
        <button
          onClick={addChip}
          className="px-2 py-1 text-xs border border-input bg-card text-muted-foreground rounded transition-colors hover:text-[#C9A84C] hover:border-[#C9A84C]"
          style={{ fontFamily: MONO, fontSize: 10 }}
        >
          Add
        </button>
      </div>
    </div>
  )
}

function TextInput({
  value,
  placeholder,
  onChange,
}: {
  value: string
  placeholder: string
  onChange: (val: string) => void
}) {
  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full mt-1 px-2 py-1.5 text-xs text-foreground bg-[var(--bg)] border border-input rounded focus:outline-none focus:border-[#C9A84C] placeholder:text-muted-foreground"
      style={{ fontFamily: MONO }}
    />
  )
}

function ToggleButton({
  label,
  active,
  activeColor,
  onClick,
}: {
  label: string
  active: boolean
  activeColor: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 text-xs border rounded transition-colors"
      style={{
        fontFamily: MONO,
        background: active ? `${activeColor}18` : '#18181b',
        color: active ? activeColor : '#71717a',
        borderColor: active ? activeColor : '#3f3f46',
      }}
    >
      {label}
    </button>
  )
}
