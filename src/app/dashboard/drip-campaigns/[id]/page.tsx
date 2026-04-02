'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import type { DripCampaignRow, DripStepRow } from '@/lib/drip/types'
import StepCard from '@/components/drip/StepCard'
import StepEditor from '@/components/drip/StepEditor'
import EnrollmentTable from '@/components/drip/EnrollmentTable'
import SendHistoryTable from '@/components/drip/SendHistoryTable'
import ExitRulesPanel from '@/components/drip/ExitRulesPanel'

type Tab = 'steps' | 'enrolled' | 'history' | 'rules'

export default function CampaignDetailPage() {
  const params = useParams()
  const router = useRouter()
  const campaignId = params.id as string

  const [campaign, setCampaign] = useState<DripCampaignRow | null>(null)
  const [steps, setSteps] = useState<DripStepRow[]>([])
  const [activeTab, setActiveTab] = useState<Tab>('steps')
  const [editingStepId, setEditingStepId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchCampaign = useCallback(async () => {
    setLoading(true)
    try {
      const [campRes, stepsRes] = await Promise.all([
        fetch(`/api/drip/campaigns/${campaignId}`),
        fetch(`/api/drip/campaigns/${campaignId}/steps`),
      ])
      const campData = await campRes.json() as DripCampaignRow
      const stepsData = await stepsRes.json() as { steps: DripStepRow[] }
      setCampaign(campData)
      setSteps(stepsData.steps ?? [])
    } catch (err) {
      console.error('Failed to load campaign:', err)
    } finally {
      setLoading(false)
    }
  }, [campaignId])

  useEffect(() => { void fetchCampaign() }, [fetchCampaign])

  function handleStepSaved(updated: DripStepRow) {
    setSteps(prev => prev.map(s => s.id === updated.id ? updated : s))
    setEditingStepId(null)
  }

  async function handleStatusToggle() {
    if (!campaign) return
    const newStatus = campaign.status === 'active' ? 'paused' : 'active'
    const res = await fetch(`/api/drip/campaigns/${campaignId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    const updated = await res.json() as DripCampaignRow
    setCampaign(updated)
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-surface2 rounded" />
          <div className="h-4 w-96 bg-surface2 rounded" />
        </div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8 text-center text-loanmuted font-mono">
        Campaign not found.
      </div>
    )
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'steps', label: 'Steps & Skeletons' },
    { key: 'enrolled', label: 'Enrolled Contacts' },
    { key: 'history', label: 'Send History' },
    { key: 'rules', label: 'Exit Rules' },
  ]

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <button onClick={() => router.push('/dashboard/drip-campaigns')} className="font-mono text-[11px] text-gold hover:text-gold/80 mb-2 block">
            &larr; All Campaigns
          </button>
          <h1 className="font-display text-[24px] tracking-wide">{campaign.name.toUpperCase()}</h1>
          <p className="font-mono text-[11px] text-loanmuted mt-1">
            {campaign.description} &middot; {steps.length} steps &middot; {campaign.status}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleStatusToggle} className="font-mono text-xs px-4 py-2 border border-loanborder bg-surface rounded-lg hover:bg-surface2">
            {campaign.status === 'active' ? 'Pause' : 'Resume'}
          </button>
          <button className="font-mono text-xs px-4 py-2 bg-gold text-white rounded-lg hover:bg-gold/90">
            + Add Contact
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-loanborder mb-5">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2.5 font-mono text-xs font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'text-gold border-gold'
                : 'text-loanmuted border-transparent hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'steps' && (
        <div className="space-y-2">
          {steps.map(step =>
            editingStepId === step.id ? (
              <StepEditor
                key={step.id}
                step={step}
                campaignId={campaignId}
                onSave={handleStepSaved}
                onCancel={() => setEditingStepId(null)}
              />
            ) : (
              <StepCard
                key={step.id}
                step={step}
                onEdit={() => setEditingStepId(step.id)}
              />
            )
          )}
        </div>
      )}

      {activeTab === 'enrolled' && (
        <EnrollmentTable campaignId={campaignId} />
      )}

      {activeTab === 'history' && (
        <SendHistoryTable campaignId={campaignId} />
      )}

      {activeTab === 'rules' && campaign && (
        <ExitRulesPanel campaign={campaign} onUpdate={setCampaign} />
      )}
    </div>
  )
}
