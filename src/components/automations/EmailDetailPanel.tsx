'use client'

import { useState } from 'react'
import type {
  AutomationRegistryRow,
  AutomationConfig,
  EmailConfig,
  EmailMode,
} from '@/lib/automations/types'
import EmailTemplateEditor from './EmailTemplateEditor'
import SendHistoryList from './SendHistoryList'

const GOLD = '#C9A84C'
const MONO = "'IBM Plex Mono', 'Courier New', monospace"

interface DetailPanelProps {
  automation: AutomationRegistryRow
  onSave: (updates: Partial<AutomationRegistryRow>) => void
  saving?: boolean
}

const TABS = [
  { id: 'email_preview', label: 'Email Preview' },
  { id: 'ai_prompt', label: 'AI Prompt' },
  { id: 'send_history', label: 'Send History' },
  { id: 'controls', label: 'Controls' },
]

const TONE_OPTIONS: Array<NonNullable<EmailConfig['tone']>> = ['formal', 'conversational', 'casual']
const LENGTH_OPTIONS: Array<NonNullable<EmailConfig['length']>> = ['short', 'medium', 'long']

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

  return (
    <div className="mt-1">
      <div className="flex flex-wrap gap-1.5 mb-1.5">
        {chips.map(chip => (
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
              onClick={() => onChange(chips.filter(c => c !== chip))}
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
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={e => {
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

export default function EmailDetailPanel({ automation, onSave, saving }: DetailPanelProps) {
  const [activeTab, setActiveTab] = useState('email_preview')

  const emailConfig = automation.config as EmailConfig
  const [localConfig, setLocalConfig] = useState<EmailConfig>({ ...emailConfig })
  const [localStatus, setLocalStatus] = useState(automation.status)
  const [localTemplate, setLocalTemplate] = useState(automation.email_template ?? '')
  const [localMode, setLocalMode] = useState<EmailMode>(automation.email_mode ?? 'ai_generated')
  const [claudeInstruction, setClaudeInstruction] = useState('')
  const [sendingTest, setSendingTest] = useState(false)
  const [runningNow, setRunningNow] = useState(false)

  function handleConfigUpdate(updates: Partial<EmailConfig>) {
    setLocalConfig(prev => ({ ...prev, ...updates }))
  }

  function handleSave() {
    onSave({
      config: localConfig as AutomationConfig,
      status: localStatus,
      email_template: localTemplate,
      email_mode: localMode,
    })
  }

  async function handleRunNow() {
    setRunningNow(true)
    try {
      await fetch(`/api/automations/registry/${automation.id}/run-now`, { method: 'POST' })
    } finally {
      setRunningNow(false)
    }
  }

  async function handleSendTest() {
    setSendingTest(true)
    try {
      await fetch(`/api/automations/registry/${automation.id}/send-test`, { method: 'POST' })
    } finally {
      setSendingTest(false)
    }
  }

  return (
    <div className="flex flex-col bg-[var(--bg)]" style={{ fontFamily: MONO }}>
      {/* Tab bar */}
      <div className="flex border-b border-input">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="px-4 py-2 text-xs transition-colors"
            style={{
              fontFamily: MONO,
              color: activeTab === tab.id ? GOLD : '#71717a',
              borderBottom: activeTab === tab.id ? `2px solid ${GOLD}` : '2px solid transparent',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-4">

        {/* Email Preview tab */}
        {activeTab === 'email_preview' && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-6">
              {/* Left: template editor */}
              <div>
                <EmailTemplateEditor
                  template={localTemplate}
                  mode={localMode}
                  onTemplateChange={setLocalTemplate}
                  onModeChange={setLocalMode}
                />
              </div>

              {/* Right: tone/length chips + always/never + tell Claude */}
              <div className="flex flex-col gap-4">
                {/* Tone chips */}
                <div>
                  <SectionLabel>TONE</SectionLabel>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {TONE_OPTIONS.map(t => (
                      <Chip
                        key={t}
                        label={t}
                        active={localConfig.tone === t}
                        onClick={() => handleConfigUpdate({ tone: t })}
                      />
                    ))}
                  </div>
                </div>

                {/* Length chips */}
                <div>
                  <SectionLabel>LENGTH</SectionLabel>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {LENGTH_OPTIONS.map(l => (
                      <Chip
                        key={l}
                        label={l}
                        active={localConfig.length === l}
                        onClick={() => handleConfigUpdate({ length: l })}
                      />
                    ))}
                  </div>
                </div>

                {/* Always include chips */}
                <div>
                  <SectionLabel>ALWAYS INCLUDE</SectionLabel>
                  <EditableChipList
                    chips={localConfig.always_include ?? []}
                    onChange={chips => handleConfigUpdate({ always_include: chips })}
                  />
                </div>

                {/* Never include chips */}
                <div>
                  <SectionLabel>NEVER INCLUDE</SectionLabel>
                  <EditableChipList
                    chips={localConfig.never_include ?? []}
                    onChange={chips => handleConfigUpdate({ never_include: chips })}
                  />
                </div>

                {/* Or Tell Claude */}
                <div>
                  <SectionLabel>OR TELL CLAUDE WHAT TO CHANGE</SectionLabel>
                  <textarea
                    value={claudeInstruction}
                    onChange={e => setClaudeInstruction(e.target.value)}
                    rows={3}
                    placeholder="e.g. make this more urgent, add a P.S., mention the rate lock deadline..."
                    className="w-full mt-1 px-2 py-1.5 text-xs text-foreground bg-[var(--bg)] border border-input rounded resize-none focus:outline-none focus:border-[#C9A84C] placeholder:text-muted-foreground"
                    style={{ fontFamily: MONO }}
                  />
                  <button
                    onClick={() => setClaudeInstruction('')}
                    disabled={!claudeInstruction.trim()}
                    className="mt-1.5 px-3 py-1.5 text-xs border border-input bg-card text-muted-foreground rounded transition-colors hover:text-[#C9A84C] hover:border-[#C9A84C] disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ fontFamily: MONO }}
                  >
                    Update Prompt
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="flex items-center justify-between border-t border-input pt-4">
              <button
                onClick={handleSendTest}
                disabled={sendingTest}
                className="px-3 py-1.5 text-xs border border-input bg-card text-muted-foreground rounded transition-colors hover:text-[#C9A84C] hover:border-[#C9A84C] disabled:opacity-30"
                style={{ fontFamily: MONO }}
              >
                {sendingTest ? 'Sending...' : 'Send Test Email'}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-xs font-bold rounded transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  fontFamily: MONO,
                  background: GOLD,
                  color: 'var(--bg)',
                }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}

        {/* AI Prompt tab */}
        {activeTab === 'ai_prompt' && (
          <div>
            {automation.prompt_snapshot ? (
              <pre
                className="text-foreground/80 whitespace-pre-wrap break-words rounded p-4 border border-input bg-background"
                style={{ fontFamily: MONO, fontSize: 11, lineHeight: 1.7 }}
              >
                {automation.prompt_snapshot}
              </pre>
            ) : (
              <div className="py-8 text-center">
                <span className="text-muted-foreground text-xs" style={{ fontFamily: MONO }}>
                  no prompt snapshot available
                </span>
              </div>
            )}
          </div>
        )}

        {/* Send History tab */}
        {activeTab === 'send_history' && (
          <SendHistoryList automationName={automation.name} />
        )}

        {/* Controls tab */}
        {activeTab === 'controls' && (
          <div className="flex flex-col gap-5">
            {/* Status toggle */}
            <div>
              <SectionLabel>STATUS</SectionLabel>
              <div className="flex gap-2 mt-1">
                {(['active', 'paused'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setLocalStatus(s)}
                    className="px-3 py-1.5 text-xs border rounded transition-colors"
                    style={{
                      fontFamily: MONO,
                      background:
                        localStatus === s
                          ? s === 'active'
                            ? 'rgba(74,222,128,0.10)'
                            : 'rgba(251,191,36,0.10)'
                          : '#18181b',
                      color:
                        localStatus === s ? (s === 'active' ? '#4ADE80' : '#fbbf24') : '#71717a',
                      borderColor:
                        localStatus === s ? (s === 'active' ? '#4ADE80' : '#fbbf24') : '#3f3f46',
                    }}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Trigger info */}
            <div>
              <SectionLabel>TRIGGER</SectionLabel>
              <div
                className="mt-1 px-2 py-1.5 border border-input rounded text-muted-foreground text-xs"
                style={{ fontFamily: MONO, background: 'var(--bg)' }}
              >
                {automation.trigger_type}
                {automation.schedule ? ` — ${automation.schedule}` : ''}
              </div>
            </div>

            {/* n8n workflow ID */}
            <div>
              <SectionLabel>N8N WORKFLOW ID</SectionLabel>
              <div
                className="mt-1 px-2 py-1.5 border border-input rounded text-muted-foreground text-xs"
                style={{ fontFamily: MONO, background: 'var(--bg)' }}
              >
                {automation.source_id || '—'}
              </div>
            </div>

            {/* Run Now */}
            <div className="pt-2">
              <button
                onClick={handleRunNow}
                disabled={runningNow}
                className="px-4 py-2 text-xs border border-input bg-card text-muted-foreground rounded transition-colors hover:text-[#C9A84C] hover:border-[#C9A84C] disabled:opacity-30"
                style={{ fontFamily: MONO }}
              >
                {runningNow ? 'Running...' : 'Run Now'}
              </button>
            </div>

            {/* Save */}
            <div className="flex justify-end border-t border-input pt-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-xs font-bold rounded transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  fontFamily: MONO,
                  background: GOLD,
                  color: 'var(--bg)',
                }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
