'use client'

import { Card } from '@/components/ui/card'

interface FunnelStep {
  stage: string
  count: number
}

interface ConversionFunnelProps {
  data: FunnelStep[]
}

export default function ConversionFunnel({ data }: ConversionFunnelProps) {
  const max = data[0]?.count || 1

  return (
    <Card className="p-4">
      <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-4">
        Pipeline Funnel
      </h3>
      <div className="space-y-2">
        {data.map((step, i) => {
          const pct = max > 0 ? (step.count / max) * 100 : 0
          const dropoff = i > 0 && data[i - 1].count > 0
            ? Math.round(((data[i - 1].count - step.count) / data[i - 1].count) * 100)
            : null

          return (
            <div key={step.stage} className="flex items-center gap-3">
              <div className="w-20 text-[11px] font-mono text-muted-foreground text-right flex-shrink-0">
                {step.stage}
              </div>
              <div className="flex-1 h-7 bg-muted/50 rounded relative overflow-hidden">
                <div
                  className="h-full rounded transition-all duration-500"
                  style={{
                    width: `${Math.max(pct, 2)}%`,
                    background: `linear-gradient(90deg, #C9A84C, #C9A84C${Math.round(40 + pct * 0.6).toString(16)})`,
                  }}
                />
                <span className="absolute inset-y-0 left-2 flex items-center text-[11px] font-mono font-semibold text-foreground">
                  {step.count}
                </span>
              </div>
              {dropoff !== null && dropoff > 0 && (
                <span className="text-[10px] font-mono text-red-400 w-10 flex-shrink-0">
                  -{dropoff}%
                </span>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}
