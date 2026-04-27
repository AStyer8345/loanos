'use client'

import type { DripCampaignWithStats } from '@/lib/drip/types'

interface CampaignCardProps {
  campaign: DripCampaignWithStats
  onClick: () => void
}

export default function CampaignCard({ campaign, onClick }: CampaignCardProps) {
  const statusColor = campaign.status === 'active' ? 'text-loangreen' : 'text-loanmuted'
  const statusLabel = campaign.status === 'active' ? '\u25CF Active' : campaign.status === 'paused' ? '\u25CB Paused' : '\u25CB Archived'

  const lastSend = campaign.last_send_at
    ? `Last send: ${new Date(campaign.last_send_at).toLocaleDateString()}`
    : 'No sends yet'

  const finishedCount = campaign.completed_count + campaign.removed_count
  const completionRate = finishedCount > 0
    ? `${Math.round((campaign.completed_count / finishedCount) * 100)}% completed`
    : '— completion'
  const completionTitle = finishedCount > 0
    ? `${campaign.completed_count} of ${finishedCount} finished enrollments completed all steps (${campaign.removed_count} removed)`
    : 'No finished enrollments yet'

  return (
    <div
      onClick={onClick}
      className="bg-surface border border-loanborder rounded-lg px-5 py-4 cursor-pointer transition-shadow hover:shadow-[0_2px_12px_rgba(0,0,0,0.08),0_0_0_1px_rgba(164,133,30,0.2),0_0_16px_rgba(164,133,30,0.06)]"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[13px] font-semibold tracking-wide">
            {campaign.name.toUpperCase()}
          </span>
          <span className={`text-[10px] ${statusColor}`}>{statusLabel}</span>
        </div>
        <div className="flex gap-6 font-mono text-[11px] text-loanmuted">
          <span>{campaign.step_count} steps</span>
          <span>{campaign.enrollment_count} enrolled</span>
          <span title={completionTitle}>{completionRate}</span>
          <span>{lastSend}</span>
        </div>
      </div>
    </div>
  )
}
