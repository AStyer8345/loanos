'use client'

import { useState } from 'react'
import type { AutomationRegistryRow } from '@/lib/automations/types'
import { getGroupLabel } from '@/lib/automations/groups'
import AutomationRow from './AutomationRow'
import AgentDetailPanel from './AgentDetailPanel'
import EmailDetailPanel from './EmailDetailPanel'
import AssistantDetailPanel from './AssistantDetailPanel'

const GOLD = '#C9A84C'
const MONO = "'IBM Plex Mono', 'Courier New', monospace"

interface AutomationGroupProps {
  groupName: string
  automations: AutomationRegistryRow[]
  expandedId: string | null
  onToggle: (id: string) => void
  onUpdate: (id: string, data: Partial<AutomationRegistryRow>) => void
  savingId?: string | null
}

export default function AutomationGroup({
  groupName,
  automations,
  expandedId,
  onToggle,
  onUpdate,
  savingId,
}: AutomationGroupProps) {
  const [groupOpen, setGroupOpen] = useState(true)
  const label = getGroupLabel(groupName)

  return (
    <div className="border border-input" style={{ borderLeft: `3px solid ${GOLD}` }}>
      {/* Group header */}
      <button
        onClick={() => setGroupOpen(prev => !prev)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-card/40 transition-colors"
        style={{ fontFamily: MONO }}
      >
        <span
          className="text-xs font-bold tracking-widest uppercase"
          style={{ color: GOLD, letterSpacing: '0.15em' }}
        >
          {label}
        </span>
        <div className="flex items-center gap-3">
          <span className="text-zinc-600 text-xs" style={{ fontFamily: MONO }}>
            {automations.length}
          </span>
          <span className="text-zinc-500 text-xs" style={{ color: GOLD }}>
            {groupOpen ? '▾' : '▸'}
          </span>
        </div>
      </button>

      {/* Automation rows */}
      {groupOpen && (
        <div>
          {automations.map(automation => (
            <div key={automation.id}>
              <AutomationRow
                automation={automation}
                isExpanded={expandedId === automation.id}
                onToggle={() => onToggle(automation.id)}
              />
              {expandedId === automation.id && (
                <div className="border-t border-input/50">
                  {automation.source === 'claude_code' && (
                    <AgentDetailPanel
                      automation={automation}
                      onSave={(updates) => onUpdate(automation.id, updates)}
                      saving={savingId === automation.id}
                    />
                  )}
                  {automation.source === 'n8n' && (
                    <EmailDetailPanel
                      automation={automation}
                      onSave={(updates) => onUpdate(automation.id, updates)}
                      saving={savingId === automation.id}
                    />
                  )}
                  {automation.source === 'supabase_setting' && (
                    <AssistantDetailPanel
                      automation={automation}
                      onSave={(updates) => onUpdate(automation.id, updates)}
                      saving={savingId === automation.id}
                    />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
