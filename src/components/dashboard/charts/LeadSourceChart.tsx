'use client'

import { Card } from '@/components/ui/card'

interface LeadSourceChartProps {
  data: Array<{ source: string; count: number; volume: number }>
}

export default function LeadSourceChart({ data }: LeadSourceChartProps) {
  if (!data || data.length === 0) return null

  const rows = data.slice(0, 15)
  const max = Math.max(...rows.map(d => d.count), 1)

  return (
    <Card className="p-4">
      <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-4">
        Lead Sources
      </h3>
      <div className="space-y-2">
        {rows.map((row) => {
          const pct = max > 0 ? (row.count / max) * 100 : 0
          const hexOpacity = Math.round(40 + pct * 0.6).toString(16)

          return (
            <div key={row.source} className="flex items-center gap-3">
              <div className="w-28 text-[11px] font-mono text-muted-foreground text-right flex-shrink-0 truncate">
                {row.source}
              </div>
              <div className="flex-1 h-7 bg-muted/50 rounded relative overflow-hidden">
                <div
                  className="h-full rounded transition-all duration-500"
                  style={{
                    width: `${Math.max(pct, 2)}%`,
                    background: `linear-gradient(90deg, #C9A84C, #C9A84C${hexOpacity})`,
                  }}
                />
                <span className="absolute inset-y-0 left-2 flex items-center text-[11px] font-mono font-semibold text-foreground">
                  {row.count}
                </span>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground w-16 flex-shrink-0 text-right">
                ${(row.volume / 1000).toFixed(0)}k
              </span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
