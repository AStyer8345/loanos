'use client'

import { useState } from 'react'
import type { AutomationRegistryRow, AutomationConfig } from '@/lib/automations/types'
import GuidedControls from './GuidedControls'
import AskClaudePanel from './AskClaudePanel'
import RunHistoryList from './RunHistoryList'

const GOLD = '#C9A84C'
const MONO = "'IBM Plex Mono', 'Courier New', monospace"

interface DetailPanelProps {
  automation: AutomationRegistryRow
  onSave: (updates: Partial<AutomationRegistryRow>) => void
  saving?: boolean
}

const TABS = [
  { id: 'controls', label: 'Controls' },
  { id: 'run_history', label: 'Run History' },
  { id: 'prompt', label: 'Prompt' },
]

export default function AgentDetailPanel({ automation, onSave, saving }: DetailPanelProps) {
  const [activeTab, setActiveTab] = useState('controls')
  const [localConfig, setLocalConfig] = useState<AutomationConfig>({ ...automation.config })
  const [localStatus, setLocalStatus] = useState(automation.status)

  function handleConfigChange(updates: Partial<AutomationConfig>) {
    const upd = updates as Record<string, unknown>
    if ('_status' in upd) {
      setLocalStatus(upd._status as AutomationRegistryRow['status'])
    } else {
      setLocalConfig(prev => ({ ...prev, ...updates }))
    }
  }

  function handleSave() {
    onSave({ config: localConfig, status: localStatus })
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
                  onApply={(newConfig) => setLocalConfig(newConfig)}
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

        {/* Run History tab */}
        {activeTab === 'run_history' && (
          <RunHistoryList automationId={automation.id} />
        )}

        {/* Prompt tab */}
        {activeTab === 'prompt' && (
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
      </div>
    </div>
  )
}
