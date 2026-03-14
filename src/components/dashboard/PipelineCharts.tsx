'use client'

import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts'

interface StageCount {
  stage: string
  count: number
  volume: number
}

interface WeeklyTrend {
  week: string
  volume: number
  count: number
}

interface PipelineChartsProps {
  stageCounts: Record<string, { count: number; volume: number }>
  weeklyTrend: WeeklyTrend[]
}

const STAGE_ORDER = ['Lead', 'Pre-App', 'Application', 'Processing', 'Underwriting', 'Cond. Approval', 'Clear to Close', 'Closing', 'Closed', 'Funded']

function formatDollars(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}

const CustomTooltipBar = ({ active, payload, label }: TooltipProps) => {
  if (active && payload?.length) {
    return (
      <div className="bg-zinc-800 border border-zinc-600 rounded px-3 py-2 text-xs font-mono">
        <div className="text-zinc-300 mb-1">{label}</div>
        <div className="text-yellow-400">{payload[0].value} loans</div>
      </div>
    )
  }
  return null
}

const CustomTooltipLine = ({ active, payload, label }: TooltipProps) => {
  if (active && payload?.length) {
    return (
      <div className="bg-zinc-800 border border-zinc-600 rounded px-3 py-2 text-xs font-mono">
        <div className="text-zinc-300 mb-1">Week of {label}</div>
        <div className="text-yellow-400">{formatDollars(payload[0].value)}</div>
        <div className="text-zinc-400">{payload[1]?.value ?? 0} loans</div>
      </div>
    )
  }
  return null
}

export default function PipelineCharts({ stageCounts, weeklyTrend }: PipelineChartsProps) {
  // Build sorted stage data
  const stageData: StageCount[] = []
  for (const stage of STAGE_ORDER) {
    if (stageCounts[stage]) {
      stageData.push({ stage, ...stageCounts[stage] })
    }
  }
  // Add any stages not in our known order
  for (const [stage, vals] of Object.entries(stageCounts)) {
    if (!STAGE_ORDER.includes(stage)) {
      stageData.push({ stage, ...vals })
    }
  }

  const hasStageData = stageData.length > 0
  const hasTrendData = weeklyTrend.some(w => w.volume > 0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Stage Bar Chart */}
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4">
        <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-wider mb-4">Pipeline by Stage</h3>
        {hasStageData ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stageData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="stage"
                tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'IBM Plex Mono' }}
                axisLine={{ stroke: '#3f3f46' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'IBM Plex Mono' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltipBar />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                {stageData.map((entry) => (
                  <Cell
                    key={entry.stage}
                    fill={['Closing', 'Clear to Close', 'Funded', 'Closed'].includes(entry.stage) ? '#eab308' : '#3f3f46'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[200px] flex flex-col items-center justify-center text-zinc-600">
            <div className="font-mono text-sm">No loan data yet</div>
            <div className="font-mono text-xs mt-1 text-zinc-700">Import loans from Arive to see pipeline</div>
          </div>
        )}
      </div>

      {/* Weekly Closing Trend */}
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4">
        <div className="flex items-baseline justify-between mb-4">
          <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Closing Volume — Last 90 Days</h3>
          {hasTrendData && (() => {
            const total90Count = weeklyTrend.reduce((s, w) => s + w.count, 0)
            const total90Vol = weeklyTrend.reduce((s, w) => s + w.volume, 0)
            return (
              <span className="text-xs font-mono text-yellow-500">
                {total90Count} loans · {formatDollars(total90Vol)}
              </span>
            )
          })()}
        </div>
        {hasTrendData ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={weeklyTrend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="week"
                tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'IBM Plex Mono' }}
                axisLine={{ stroke: '#3f3f46' }}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => formatDollars(v)}
                tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'IBM Plex Mono' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltipLine />} cursor={{ stroke: '#52525b' }} />
              <Line
                type="monotone"
                dataKey="volume"
                stroke="#eab308"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#eab308' }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#3f3f46"
                strokeWidth={1}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[200px] flex flex-col items-center justify-center text-zinc-600">
            <div className="font-mono text-sm">No closed loans in 90 days</div>
            <div className="font-mono text-xs mt-1 text-zinc-700">Funded loans will appear here</div>
          </div>
        )}
      </div>
    </div>
  )
}
