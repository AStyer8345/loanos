'use client'

import type { DripCampaignRow, ExitRule } from '@/lib/drip/types'

interface ExitRulesPanelProps {
  campaign: DripCampaignRow
  onUpdate: (updated: DripCampaignRow) => void
}

const RULE_DESCRIPTIONS: Record<string, string> = {
  status_change: 'Remove when contact status changes to any of these pipeline stages',
  bounce_limit: 'Remove after this many email bounces',
  unsubscribe: 'Remove when contact unsubscribes',
  inactive: 'Remove when contact is marked inactive',
}

export default function ExitRulesPanel({ campaign }: ExitRulesPanelProps) {
  const rules = (campaign.exit_rules ?? []) as ExitRule[]

  return (
    <div className="space-y-3">
      <p className="font-mono text-[11px] text-loanmuted mb-4">
        Exit rules automatically remove contacts from this campaign when conditions are met.
        The daily scheduler checks these rules before generating any email.
      </p>

      {rules.length === 0 && (
        <div className="bg-surface border border-loanborder rounded-lg px-5 py-8 text-center font-mono text-xs text-loanmuted">
          No exit rules configured. Contacts will only be removed manually or when they complete all steps.
        </div>
      )}

      {rules.map((rule, i) => (
        <div key={i} className="bg-surface border border-loanborder rounded-lg px-5 py-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="font-mono text-[10px] font-semibold bg-surface2 text-gold px-2.5 py-0.5 rounded uppercase">
              {rule.type.replace('_', ' ')}
            </span>
          </div>
          <p className="text-xs text-loanmuted mb-2">
            {RULE_DESCRIPTIONS[rule.type] ?? rule.type}
          </p>
          {rule.config.statuses && (
            <div className="flex gap-2 flex-wrap">
              {rule.config.statuses.map(s => (
                <span key={s} className="font-mono text-[10px] bg-surface2 px-2 py-0.5 rounded">{s}</span>
              ))}
            </div>
          )}
          {rule.config.max_bounces && (
            <span className="font-mono text-xs">Max bounces: {rule.config.max_bounces}</span>
          )}
        </div>
      ))}
    </div>
  )
}
