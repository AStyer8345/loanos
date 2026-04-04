'use client'

import { Card } from '@/components/ui/card'
import { fmtK } from '@/lib/formatters'

interface ReferralEntry {
  source: string
  loans: number
  volume: number
  funded: number
}

interface ReferralLeaderboardProps {
  data: ReferralEntry[]
}

export default function ReferralLeaderboard({ data }: ReferralLeaderboardProps) {
  if (data.length === 0) return null
  const maxVolume = data[0]?.volume || 1

  return (
    <Card className="p-4">
      <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-4">
        Top Realtors
      </h3>
      <div className="space-y-2">
        {data.map((entry, i) => {
          const pct = (entry.volume / maxVolume) * 100
          return (
            <div key={entry.source} className="group">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-muted-foreground w-4">{i + 1}</span>
                  <span className="text-xs font-mono text-foreground">{entry.source}</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-mono text-muted-foreground">
                  <span>{entry.loans} loans</span>
                  <span className="text-primary font-medium">{fmtK(entry.volume)}</span>
                </div>
              </div>
              <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden ml-6">
                <div
                  className="h-full rounded-full bg-primary/60 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
