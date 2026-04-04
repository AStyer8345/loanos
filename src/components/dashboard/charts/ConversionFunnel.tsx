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
  const max = Math.max(...data.map(d => d.count), 1)
  const total = data.reduce((sum, d) => sum + d.count, 0)

  return (
    <Card className="p-4">
      <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-4">
        Pipeline Snapshot
      </h3>
      <div className="space-y-2">
        {data.map((step) => {
          const pct = max > 0 ? (step.count / max) * 100 : 0
          const share = total > 0 ? Math.round((step.count / total) * 100) : 0

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
              <span className="text-[10px] font-mono text-muted-foreground w-10 flex-shrink-0">
                {share}%
              </span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
