'use client'

import { Card } from '@/components/ui/card'

interface DtcEntry {
  type: string
  avgDays: number
  count: number
}

interface DaysToCloseGaugeProps {
  data: DtcEntry[]
}

function gaugeColor(days: number): string {
  if (days <= 25) return '#22c55e'
  if (days <= 35) return '#C9A84C'
  if (days <= 45) return '#f97316'
  return '#ef4444'
}

export default function DaysToCloseGauge({ data }: DaysToCloseGaugeProps) {
  if (data.length === 0) return null
  const maxDays = Math.max(...data.map(d => d.avgDays), 45)

  const totalDays = data.reduce((sum, d) => sum + d.avgDays * d.count, 0)
  const totalCount = data.reduce((sum, d) => sum + d.count, 0)
  const overallAvg = totalCount > 0 ? Math.round(totalDays / totalCount) : 0

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
          Avg Days to Close
        </h3>
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-mono font-bold" style={{ color: gaugeColor(overallAvg) }}>
            {overallAvg}
          </span>
          <span className="text-[10px] font-mono text-muted-foreground">days avg</span>
        </div>
      </div>
      <div className="space-y-3">
        {data.map(entry => {
          const color = gaugeColor(entry.avgDays)
          const pct = (entry.avgDays / maxDays) * 100
          return (
            <div key={entry.type}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono text-foreground">{entry.type}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-muted-foreground">{entry.count} loans</span>
                  <span className="text-xs font-mono font-medium" style={{ color }}>
                    {entry.avgDays}d
                  </span>
                </div>
              </div>
              <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: color, opacity: 0.7 }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
