'use client'

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { Card } from '@/components/ui/card'
import { fmtK, fmtCurrency } from '@/lib/formatters'

interface ForecastPoint {
  month: string
  actual: number
  projected: number
}

interface CommissionForecastProps {
  data: ForecastPoint[]
}

interface TTProps {
  active?: boolean
  payload?: Array<{ value: number; name: string }>
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

export default function CommissionForecast({ data }: CommissionForecastProps) {
  const hasData = data.some(d => d.actual > 0 || d.projected > 0)

  if (!hasData) {
    return (
      <Card className="p-4">
        <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-4">
          Commission — Actual vs Projected
        </h3>
        <div className="h-[220px] flex items-center justify-center text-muted-foreground font-mono text-sm">
          No data yet
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4">
      <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-4">
        Commission — Actual vs Projected
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
            dataKey="actual"
            name="Actual"
            fill="#C9A84C"
            radius={[3, 3, 0, 0]}
            stackId="commission"
          />
          <Bar
            dataKey="projected"
            name="Projected"
            fill="#C9A84C"
            fillOpacity={0.3}
            radius={[3, 3, 0, 0]}
            stackId="commission"
          />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}
