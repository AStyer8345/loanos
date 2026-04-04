'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'

interface MarketingActivityProps {
  log: Array<{ id: string; date: string; activity: string; channel: string; notes?: string }>
}

function channelBadge(channel: string): { label: string; className: string } {
  const c = channel.toLowerCase()
  if (c === 'rate update') {
    return { label: channel, className: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' }
  }
  if (c === 'email') {
    return { label: channel, className: 'bg-blue-500/15 text-blue-400 border border-blue-500/30' }
  }
  if (c === 'newsletter') {
    return { label: channel, className: 'bg-violet-500/15 text-violet-400 border border-violet-500/30' }
  }
  if (['social', 'linkedin', 'facebook', 'instagram', 'google'].includes(c)) {
    return { label: channel, className: 'bg-amber-500/15 text-amber-400 border border-amber-500/30' }
  }
  return { label: channel, className: 'bg-muted text-muted-foreground border border-input' }
}

function relativeTime(date: string): string {
  const daysAgo = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
  if (daysAgo === 0) return 'today'
  if (daysAgo === 1) return '1d ago'
  return `${daysAgo}d ago`
}

export default function MarketingActivity({ log }: MarketingActivityProps) {
  if (log.length === 0) return null

  return (
    <Card className="p-4 bg-card border border-input">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
          Recent Marketing
        </h3>
        <Link
          href="/dashboard/marketing"
          className="text-[11px] font-mono text-[#C9A84C] hover:opacity-80 transition-opacity"
        >
          View all →
        </Link>
      </div>

      <div className={log.length > 6 ? 'max-h-[280px] overflow-y-auto space-y-2 pr-1' : 'space-y-2'}>
        {log.map(entry => {
          const badge = channelBadge(entry.channel)
          const time = relativeTime(entry.date)

          return (
            <div
              key={entry.id}
              className="flex items-start gap-2 rounded -mx-2 px-2 py-1.5 hover:bg-secondary/50 transition-colors"
            >
              <span className={`mt-0.5 shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-mono leading-none ${badge.className}`}>
                {badge.label}
              </span>
              <span className="flex-1 text-xs font-mono text-foreground leading-snug">
                {entry.activity}
              </span>
              <span className="shrink-0 text-[10px] font-mono text-muted-foreground mt-0.5">
                {time}
              </span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
