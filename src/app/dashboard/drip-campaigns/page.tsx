'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { DripCampaignWithStats } from '@/lib/drip/types'
import CampaignCard from '@/components/drip/CampaignCard'
import RecentSendsTimeline from '@/components/drip/RecentSendsTimeline'

export default function DripCampaignsPage() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<DripCampaignWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [approvalCount, setApprovalCount] = useState(0)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/drip/campaigns')
      const data = await res.json() as { campaigns: DripCampaignWithStats[] }
      setCampaigns(data.campaigns ?? [])

      const queueRes = await fetch('/api/drip/approval-queue')
      const queueData = await queueRes.json() as { queue: unknown[] }
      setApprovalCount(queueData.queue?.length ?? 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load campaigns')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void fetchData() }, [fetchData])

  const totalEnrolled = campaigns.reduce((sum, c) => sum + c.enrollment_count, 0)
  const activeCampaigns = campaigns.filter(c => c.status === 'active')

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Migration banner — drip scheduler archived 2026-04-16 pending WDK migration */}
      <div className="bg-surface border border-loanborder rounded-lg p-4 mb-6 border-l-[3px] border-l-[#e67e22]">
        <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#e67e22] mb-1">
          Paused — Email Platform Migration
        </div>
        <div className="text-sm text-foreground">
          Drip campaigns are paused while we migrate to the new email platform.
          New enrollments will not send. Existing data is untouched.
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-[28px] tracking-wide">DRIP CAMPAIGNS</h1>
        <div className="flex gap-3">
          <button className="font-mono text-xs px-4 py-2 border border-loanborder bg-surface rounded-lg hover:bg-surface2 transition-colors">
            + New Campaign
          </button>
          <button
            onClick={() => router.push('/dashboard/drip-campaigns/approval')}
            className="font-mono text-xs px-4 py-2 border border-loanborder bg-surface rounded-lg hover:bg-surface2 transition-colors"
          >
            Approval Queue
            {approvalCount > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-gold text-white text-[10px] font-semibold rounded-full">
                {approvalCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-7">
        <div className="bg-surface border border-loanborder rounded-lg p-5 border-l-[3px] border-l-gold">
          <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-foreground mb-1">Active Enrollments</div>
          <div className="font-display text-[32px] text-gold">{totalEnrolled}</div>
        </div>
        <div className="bg-surface border border-loanborder rounded-lg p-5 border-l-[3px] border-l-loangreen">
          <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-foreground mb-1">Active Campaigns</div>
          <div className="font-display text-[32px] text-loangreen">{activeCampaigns.length}</div>
        </div>
        <div className="bg-surface border border-loanborder rounded-lg p-5 border-l-[3px] border-l-[#e67e22]">
          <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-foreground mb-1">Awaiting Approval</div>
          <div className="font-display text-[32px] text-[#e67e22]">{approvalCount}</div>
        </div>
      </div>

      {/* Campaign List */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-surface border border-loanborder rounded-lg px-5 py-4 animate-pulse">
              <div className="h-4 w-48 bg-surface2 rounded" />
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="text-center py-12 text-loanred font-mono text-sm">{error}</div>
      )}

      {!loading && !error && campaigns.length === 0 && (
        <div className="text-center py-12 text-loanmuted font-mono text-sm">
          No drip campaigns yet. Create your first one to get started.
        </div>
      )}

      {!loading && !error && campaigns.length > 0 && (
        <div className="space-y-3">
          {campaigns.map(campaign => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              onClick={() => router.push(`/dashboard/drip-campaigns/${campaign.id}`)}
            />
          ))}
        </div>
      )}

      <RecentSendsTimeline />
    </div>
  )
}
