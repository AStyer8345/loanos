'use client'

import type { DripStepRow } from '@/lib/drip/types'

interface StepCardProps {
  step: DripStepRow
  onEdit: () => void
}

export default function StepCard({ step, onEdit }: StepCardProps) {
  const approvalTag = step.requires_approval
    ? { label: 'needs approval', className: 'text-[#e67e22] bg-[rgba(230,126,34,0.1)]' }
    : { label: 'auto-send', className: 'text-loangreen bg-[rgba(22,163,74,0.1)]' }

  const channelLabel = step.channel === 'both' ? 'email + card' : step.channel.replace('_', ' ')

  const triggerLabel = step.trigger_type === 'relative_days'
    ? `Trigger: ${step.trigger_config.days} days after enrollment`
    : step.trigger_type === 'annual_date'
    ? `Trigger: yearly on ${step.trigger_config.date_field}`
    : `Trigger: condition-based`

  return (
    <div className="bg-surface border border-loanborder rounded-lg px-5 py-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] font-semibold bg-surface2 text-gold px-2.5 py-0.5 rounded">
              {step.step_order}
            </span>
            <span className="text-[13px] font-semibold">{step.name}</span>
            <span className={`font-mono text-[10px] font-medium px-2 py-0.5 rounded ${approvalTag.className}`}>
              {approvalTag.label}
            </span>
            <span className="font-mono text-[10px] text-loanmuted bg-surface2 px-2 py-0.5 rounded">
              {channelLabel}
            </span>
          </div>
          <div className="font-mono text-[11px] text-loanmuted mt-1.5 ml-[42px]">
            {triggerLabel}
          </div>
          <div className="text-[12px] text-loanmuted/60 italic mt-1 ml-[42px] leading-relaxed">
            &ldquo;{step.skeleton}&rdquo;
          </div>
        </div>
        <button
          onClick={onEdit}
          className="font-mono text-[11px] text-gold hover:text-gold/80 transition-colors"
        >
          Edit
        </button>
      </div>
    </div>
  )
}
