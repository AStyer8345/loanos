'use client'

import { Card } from '@/components/ui/card'
import type { LeadSourceCategory } from '@/lib/leadSources'

interface NewLeadsChartProps {
  data: Array<{ source: LeadSourceCategory; count: number }>
  windowDays: number
}

// Distinct color per category so Adam can eyeball AEO trend at a glance
const COLORS: Record<LeadSourceCategory, string> = {
  'AEO':              '#8b5cf6', // purple — the newcomer, most interesting
  'Realtor Referral': '#C9A84C', // gold (brand)
  'Web Lead':         '#3b82f6', // blue
  'Organic Search':   '#10b981', // green
  'Social':           '#ec4899', // pink
  'Direct':           '#64748b', // slate
  'Other':            '#94a3b8', // lighter slate
}

export default function NewLeadsChart({ data, windowDays }: NewLeadsChartProps) {
  const total = data.reduce((sum, d) => sum + d.count, 0)
  const max = Math.max(...data.map(d => d.count), 1)

  return (
    <Card className="p-4">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
          New Leads by Source
        </h3>
        <span className="text-[10px] font-mono text-muted-foreground">
          last {windowDays}d · {total} total
        </span>
      </div>
      {total === 0 ? (
        <div className="text-xs font-mono text-muted-foreground py-8 text-center">
          No new leads in the last {windowDays} days
        </div>
      ) : (
        <div className="space-y-2">
          {data.map((row) => {
            const pct = (row.count / max) * 100
            const color = COLORS[row.source]
            return (
              <div key={row.source} className="flex items-center gap-3">
                <div className="w-32 text-[11px] font-mono text-muted-foreground text-right flex-shrink-0 truncate">
                  {row.source}
                </div>
                <div className="flex-1 h-7 bg-muted/50 rounded relative overflow-hidden">
                  <div
                    className="h-full rounded transition-all duration-500"
                    style={{ width: `${Math.max(pct, 2)}%`, background: color }}
                  />
                  <span className="absolute inset-y-0 left-2 flex items-center text-[11px] font-mono font-semibold text-foreground">
                    {row.count}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground w-12 flex-shrink-0 text-right">
                  {total > 0 ? `${Math.round((row.count / total) * 100)}%` : '0%'}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
