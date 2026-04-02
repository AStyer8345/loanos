'use client'

import { useState, useEffect } from 'react'
import type { AutomationRegistryRow, AutomationConfig, AssistantConfig } from '@/lib/automations/types'
import GuidedControls from './GuidedControls'
import AskClaudePanel from './AskClaudePanel'

const GOLD = '#C9A84C'
const MONO = "'IBM Plex Mono', 'Courier New', monospace"

interface DetailPanelProps {
  automation: AutomationRegistryRow
  onSave: (updates: Partial<AutomationRegistryRow>) => void
  saving?: boolean
}

const TABS = [
  { id: 'controls', label: 'Controls' },
  { id: 'prompt', label: 'Prompt' },
]

function resolvePromptRoute(sourceId: string): string {
  if (sourceId === 'ai_system_prompt') return '/api/settings/system-prompt'
  if (sourceId === 'outreach_bot_prompt') return '/api/settings/outreach-prompt'
  return '/api/settings/system-prompt'
}

export default function AssistantDetailPanel({ automation, onSave, saving }: DetailPanelProps) {
  const [activeTab, setActiveTab] = useState('controls')
  const [localConfig, setLocalConfig] = useState<AssistantConfig>({
    ...(automation.config as AssistantConfig),
  })
  const [localStatus, setLocalStatus] = useState(automation.status)
  const [systemPrompt, setSystemPrompt] = useState<string | null>(null)
  const [promptLoading, setPromptLoading] = useState(false)
  const [promptError, setPromptError] = useState<string | null>(null)

  // Fetch system prompt when Prompt tab is first opened
  useEffect(() => {
    if (activeTab !== 'prompt') return
    if (systemPrompt !== null) return

    const route = resolvePromptRoute(automation.source_id)

    setPromptLoading(true)
    setPromptError(null)

    fetch(route)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<{ prompt?: string; system_prompt?: string; content?: string }>
      })
      .then(data => {
        const text = data.prompt ?? data.system_prompt ?? data.content ?? null
        setSystemPrompt(typeof text === 'string' ? text : JSON.stringify(data, null, 2))
      })
      .catch(err => {
        setPromptError(err instanceof Error ? err.message : 'Failed to load prompt')
      })
      .finally(() => {
        setPromptLoading(false)
      })
  }, [activeTab, automation.source_id, systemPrompt])

  function handleConfigChange(updates: Partial<AutomationConfig>) {
    const upd = updates as Record<string, unknown>
    if ('_status' in upd) {
      setLocalStatus(upd._status as AutomationRegistryRow['status'])
    } else {
      setLocalConfig(prev => ({ ...prev, ...(updates as Partial<AssistantConfig>) }))
    }
  }

  function handleSave() {
    onSave({ config: localConfig as AutomationConfig, status: localStatus })
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

        {/* Controls tab */}
        {activeTab === 'controls' && (
          <div>
            <div className="grid grid-cols-2 gap-6">
              {/* Left: GuidedControls */}
              <div>
                <GuidedControls
                  config={localConfig}
                  source={automation.source}
                  status={localStatus}
                  schedule={automation.schedule}
                  onChange={handleConfigChange}
                />
              </div>

              {/* Right: AskClaudePanel */}
              <div>
                <AskClaudePanel
                  automationId={automation.id}
                  currentConfig={localConfig}
                  onApply={newConfig => setLocalConfig(newConfig as AssistantConfig)}
                />
              </div>
            </div>

            {/* Bottom bar */}
            <div className="mt-6 flex justify-end border-t border-input pt-4">
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

        {/* Prompt tab */}
        {activeTab === 'prompt' && (
          <div>
            {promptLoading && (
              <div className="flex items-center justify-center py-8">
                <span className="text-muted-foreground text-xs" style={{ fontFamily: MONO }}>
                  loading...
                </span>
              </div>
            )}

            {promptError && (
              <div className="py-4 px-3">
                <span className="text-xs text-red-400" style={{ fontFamily: MONO }}>
                  {promptError}
                </span>
              </div>
            )}

            {!promptLoading && !promptError && systemPrompt && (
              <pre
                className="text-foreground/80 whitespace-pre-wrap break-words rounded p-4 border border-input bg-background"
                style={{ fontFamily: MONO, fontSize: 11, lineHeight: 1.7 }}
              >
                {systemPrompt}
              </pre>
            )}

            {!promptLoading && !promptError && systemPrompt === null && (
              <div className="py-8 text-center">
                <span className="text-muted-foreground text-xs" style={{ fontFamily: MONO }}>
                  no prompt available
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
