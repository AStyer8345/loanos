'use client'

import { useState } from 'react'
import { useMCCState, mergedState } from './_components/useMCCState'
import SendTab    from './_components/SendTab'
import HistoryTab from './_components/HistoryTab'
import SocialTab  from './_components/SocialTab'
import VoiceGuideEditor from './_components/VoiceGuideEditor'

const GOLD = 'var(--primary)'

type Tab = 'SEND' | 'HISTORY' | 'SOCIAL' | 'VOICE GUIDE'

const TABS: Tab[] = ['SOCIAL', 'SEND', 'HISTORY', 'VOICE GUIDE']

export default function MarketingPage() {
  const [activeTab, setActiveTab] = useState<Tab>('SOCIAL')
  const { state, loading, error, saveState } = useMCCState()

  const mcc = mergedState(state)

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center font-mono">
        <span className="text-muted-foreground text-sm tracking-widest">LOADING...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center font-mono">
        <div className="text-center">
          <p className="text-red-400 text-sm">Error loading marketing data.</p>
          <p className="text-muted-foreground text-xs mt-1">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen bg-background text-foreground p-6"
      style={{ fontFamily: "'IBM Plex Mono', 'Courier New', monospace" }}
    >
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-sm font-bold tracking-widest" style={{ color: GOLD }}>
          MARKETING
        </h1>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-input mb-6">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-2 text-xs font-bold tracking-widest transition-colors relative"
            style={{
              color: activeTab === tab ? GOLD : 'var(--muted-foreground)',
              fontFamily: 'inherit',
            }}
          >
            {tab}
            {activeTab === tab && (
              <span
                className="absolute bottom-0 left-0 right-0 h-px"
                style={{ background: GOLD }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'SOCIAL' && (
        <SocialTab onSwitchToVoiceGuide={() => setActiveTab('VOICE GUIDE')} />
      )}
      {activeTab === 'VOICE GUIDE' && (
        <VoiceGuideEditor />
      )}
      <div className="max-w-3xl">
        {activeTab === 'SEND' && (
          <SendTab mccState={mcc} onSave={saveState} />
        )}
        {activeTab === 'HISTORY' && (
          <HistoryTab mccState={mcc} onSave={saveState} />
        )}
      </div>
    </div>
  )
}
