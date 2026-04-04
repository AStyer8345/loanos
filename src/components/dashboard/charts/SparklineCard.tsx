'use client'

import Link from 'next/link'
import { ResponsiveContainer, AreaChart, Area } from 'recharts'
import { Card } from '@/components/ui/card'

interface SparklineCardProps {
  href: string
  label: string
  value: string
  subtitle: string
  borderColor: string
  valueColor?: string
  data: Array<{ value: number }>
  sparkColor: string
}

export default function SparklineCard({
  href, label, value, subtitle, borderColor, valueColor, data, sparkColor,
}: SparklineCardProps) {
  const hasData = data.some(d => d.value > 0)

  return (
    <Link href={href}>
      <Card
        className="p-3 hover:bg-secondary/50 transition-colors relative overflow-hidden"
        style={{ borderLeftWidth: 4, borderLeftColor: borderColor }}
      >
        <div className="relative z-10">
          <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
            {label}
          </div>
          <div className={`text-2xl font-mono font-bold ${valueColor ?? 'text-foreground'}`}>
            {value}
          </div>
          <div className="text-[11px] font-mono text-muted-foreground mt-0.5">
            {subtitle}
          </div>
        </div>
        {hasData && (
          <div className="absolute bottom-0 right-0 w-24 h-10 opacity-30">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={sparkColor}
                  fill={sparkColor}
                  fillOpacity={0.3}
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </Link>
  )
}
