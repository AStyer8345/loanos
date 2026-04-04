'use client'

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { Card } from '@/components/ui/card'
import { fmtK, fmtCurrency } from '@/lib/formatters'

interface YoYPoint {
  month: string
  thisYear: number
  lastYear: number
}

interface YoYVolumeChartProps {
  data: YoYPoint[]
  currentYear: number
}

interface TTProps {
  active?: boolean
  payload?: Array<{ value: number; name: string; color?: string }>
  label?: string
}

const ChartTooltip = ({ active, payload, label }: TTProps) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-muted border border-input rounded px-3 py-2 text-xs font-mono space-y-0.5">
      <div className="text-foreground/80 mb-1">{label}</div>
      {payload.map(p => (
        <div key={p.name} className="text-muted-foreground">
          {p.name}: <span className="text-foreground">{fmtCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function YoYVolumeChart({ data, currentYear }: YoYVolumeChartProps) {
  const hasData = data.some(d => d.thisYear > 0 || d.lastYear > 0)

  if (!hasData) {
    return (
      <Card className="p-4">
        <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-4">
          Volume by Month — YoY
        </h3>
        <div className="h-[220px] flex items-center justify-center text-muted-foreground font-mono text-sm">
          No funded loans yet
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4">
      <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-4">
        Volume by Month — YoY
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
          <XAxis
            dataKey="month"
            tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }}
            axisLine={{ stroke: '#1e293b' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => fmtK(v as number)}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Legend wrapperStyle={{ fontSize: 10, fontFamily: 'monospace' }} />
          <Bar
            dataKey="lastYear"
            name={String(currentYear - 1)}
            fill="#3b82f6"
            fillOpacity={0.3}
            radius={[3, 3, 0, 0]}
          />
          <Bar
            dataKey="thisYear"
            name={String(currentYear)}
            fill="#3b82f6"
            radius={[3, 3, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}
