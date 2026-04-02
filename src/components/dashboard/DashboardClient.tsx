'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle, Clock, Brain, ListChecks, ArrowRight,
} from 'lucide-react'
import SmartActionQueue from '@/components/SmartActionQueue'
import type { ScoredLoan } from '@/lib/scoreLoans'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import DailyBriefingPanel from './DailyBriefingPanel'
import DailyScheduleWidget from './DailyScheduleWidget'
import TodoList from './TodoList'
import { fmtCurrency, fmtK } from '@/lib/formatters'
import { statusHex } from '@/lib/constants/loan-stages'
import HotLeadsWidget, { type HotLead } from '@/components/dashboard/HotLeadsWidget'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// ── Types ────────────────────────────────────────────────────────────────
interface StageData { stage: string; count: number; volume: number; commission: number }
interface UrgentFlag { id: string; name: string; flag: string; date: string }
interface StaleLoan { id: string; name: string; daysSinceActivity: number; status: string | null; estimated_closing_date: string | null; loan_amount: number | null }
interface ChartPoint { month: string; loans: number; volume: number; commission: number }

interface DashboardClientProps {
  totalActive: number; totalActiveVolume: number; totalActiveCommission: number
  pipelineCount?: number; pipelineVolume?: number; pipelineCommission?: number
  commissionThisMonth: number; commissionYTD: number; projectedCommission: number
  fundedThisMonth: number; fundedYTD: number
  volumeThisMonth: number; volumeYTD: number
  stageData: StageData[]
  urgentFlags: UrgentFlag[]; staleLoans: StaleLoan[]
  chartData: ChartPoint[]
  scoredLoans: ScoredLoan[]
  hotLeads: HotLead[]
  showSetupBanner?: boolean
}

// ── Formatters ──────────────────────────────────────────────────────────
const fmt = fmtCurrency

// ── Tooltip ─────────────────────────────────────────────────────────────
interface TTProps { active?: boolean; payload?: Array<{ value: number; name: string; color?: string }>; label?: string }
const ChartTooltip = ({ active, payload, label }: TTProps) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-zinc-800 border border-zinc-600 rounded px-3 py-2 text-xs font-mono space-y-0.5">
      <div className="text-zinc-300 mb-1">{label}</div>
      {payload.map(p => (
        <div key={p.name} className="text-zinc-400">{p.name}: <span className="text-zinc-100">{fmt(p.value)}</span></div>
      ))}
    </div>
  )
}

function fmtDateShort(s: string | null): string {
  if (!s) return '—'
  return new Date(s + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ── Component ───────────────────────────────────────────────────────────
export default function DashboardClient(props: DashboardClientProps) {
  const [tab, setTab] = useState<'pipeline' | 'performance' | 'briefing' | 'queue'>('pipeline')
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  const needsAttentionCount = props.urgentFlags.length + props.staleLoans.length

  return (
    <div className="min-h-screen bg-[#060b18] p-4 lg:p-6 space-y-4">

      {/* ── Setup Banner ── */}
      {props.showSetupBanner && (
        <Link
          href="/dashboard/getting-started"
          className="flex items-center justify-between gap-3 bg-blue-900/30 border border-blue-700/60 rounded-xl px-4 py-3 hover:bg-blue-900/50 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 flex items-center justify-center shrink-0">
              <ListChecks className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-200">Finish setting up your account</p>
              <p className="text-xs text-blue-400/80">Connect your LOS, import contacts, and review automations</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-blue-400 group-hover:translate-x-1 transition-transform shrink-0" />
        </Link>
      )}

      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-mono font-bold text-zinc-100">Dashboard</h1>
          <p className="text-xs font-mono text-zinc-500 mt-0.5">{dateStr}</p>
        </div>
        <div className="flex items-center gap-3">
          {needsAttentionCount > 0 && (
            <Badge variant="warning" className="gap-1.5 px-3 py-1.5 rounded-lg">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="font-mono">{needsAttentionCount} need attention</span>
            </Badge>
          )}
          <div className="flex bg-card border border-input rounded-lg p-1 gap-0.5">
            <button
              onClick={() => setTab('pipeline')}
              className={`px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors ${tab === 'pipeline' ? 'bg-[#C9A84C] text-black' : 'text-zinc-400 hover:text-zinc-100'}`}
            >Pipeline</button>
            <button
              onClick={() => setTab('performance')}
              className={`px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors ${tab === 'performance' ? 'bg-[#C9A84C] text-black' : 'text-zinc-400 hover:text-zinc-100'}`}
            >Performance</button>
            <button
              onClick={() => setTab('briefing')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors ${tab === 'briefing' ? 'bg-[#C9A84C] text-black' : 'text-zinc-400 hover:text-zinc-100'}`}
            ><Brain size={11} />Briefing</button>
            <button
              onClick={() => setTab('queue')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors ${tab === 'queue' ? 'bg-[#C9A84C] text-black' : 'text-zinc-400 hover:text-zinc-100'}`}
            ><ListChecks size={11} />Queue</button>
          </div>
        </div>
      </div>

      {/* ═══ PIPELINE TAB ═══ */}
      {tab === 'pipeline' && (
        <div className="space-y-4">
          {/* ── KPI Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Link href="/dashboard/loans?stage=funded&period=ytd">
              <Card className="border-l-4 border-l-[#10b981] p-3 hover:bg-secondary/50 transition-colors">
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">Commission Earned</div>
                <div className="text-2xl font-mono font-bold text-emerald-400">{fmt(props.commissionYTD)}</div>
                <div className="text-[10px] font-mono text-muted-foreground mt-0.5">{props.fundedYTD} loans · {fmtK(props.volumeYTD)} volume YTD</div>
              </Card>
            </Link>
            <Link href="/dashboard/loans">
              <Card className="border-l-4 border-l-primary p-3 hover:bg-secondary/50 transition-colors">
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">Pipeline Commission</div>
                <div className="text-2xl font-mono font-bold text-primary">{fmt(props.pipelineCommission ?? props.totalActiveCommission)}</div>
                <div className="text-[10px] font-mono text-muted-foreground mt-0.5">{props.pipelineCount ?? props.totalActive} loans · {fmtK(props.pipelineVolume ?? props.totalActiveVolume)} volume</div>
              </Card>
            </Link>
            <Link href="/dashboard/loans?stage=funded&period=mtd">
              <Card className="border-l-4 border-l-[#8b5cf6] p-3 hover:bg-secondary/50 transition-colors">
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">Closed This Month</div>
                <div className="text-2xl font-mono font-bold text-violet-400">{fmt(props.commissionThisMonth)}</div>
                <div className="text-[10px] font-mono text-muted-foreground mt-0.5">{props.fundedThisMonth} loans · {fmtK(props.volumeThisMonth)} volume</div>
              </Card>
            </Link>
            <Link href="/dashboard/loans">
              <Card className="border-l-4 border-l-[#3b82f6] p-3 hover:bg-secondary/50 transition-colors">
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">Pipeline Loans</div>
                <div className="text-2xl font-mono font-bold text-foreground">{props.pipelineCount ?? props.totalActive}</div>
                <div className="text-[10px] font-mono text-muted-foreground mt-0.5">{fmtK(props.pipelineVolume ?? props.totalActiveVolume)} volume</div>
              </Card>
            </Link>
          </div>

          {/* ── Needs Attention (merged urgent + stale) ── */}
          {needsAttentionCount > 0 && (
            <div className="bg-amber-950/20 border border-amber-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={14} className="text-amber-400" />
                  <span className="text-xs font-mono font-semibold text-amber-400 uppercase tracking-widest">Needs Attention</span>
                  <span className="text-[10px] font-mono text-zinc-600">{needsAttentionCount} items</span>
                </div>
                <Link href="/dashboard/loans" className="flex items-center gap-1 text-[10px] font-mono text-[#C9A84C] hover:text-[#d4b860]">
                  View pipeline <ArrowRight size={9} />
                </Link>
              </div>

              {/* Urgent flags — rate locks, past closing, expiring pre-approvals */}
              {props.urgentFlags.length > 0 && (
                <div className="space-y-1 mb-3">
                  {props.urgentFlags.map(f => (
                    <Link
                      key={f.id + f.flag}
                      href={`/dashboard/loans/${f.id}`}
                      className="flex items-center justify-between text-xs font-mono hover:bg-amber-900/20 rounded px-3 py-2 -mx-1 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                        <span className="text-zinc-200">{f.name}</span>
                      </div>
                      <span className="text-amber-400">{f.flag} — {fmtDateShort(f.date)}</span>
                    </Link>
                  ))}
                </div>
              )}

              {/* Stale loans — 7+ days no human touch */}
              {props.staleLoans.length > 0 && (
                <>
                  {props.urgentFlags.length > 0 && (
                    <div className="border-t border-amber-800/30 my-2" />
                  )}
                  <div className="flex items-center gap-2 mb-2 px-2">
                    <Clock size={11} className="text-orange-400" />
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">No activity 7+ days</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {props.staleLoans.slice(0, 12).map(l => (
                      <Link
                        key={l.id}
                        href={`/dashboard/loans/${l.id}`}
                        className="flex items-center justify-between text-xs font-mono hover:bg-amber-900/20 rounded px-3 py-2 -mx-1 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0" />
                          <span className="text-zinc-300 truncate">{l.name}</span>
                          {l.status && <StageBadge status={l.status} />}
                        </div>
                        <div className="flex items-center gap-3 ml-2 flex-shrink-0">
                          {l.estimated_closing_date && (
                            <span className="text-zinc-600 text-[10px]">close {fmtDateShort(l.estimated_closing_date)}</span>
                          )}
                          <span className="text-orange-400">{l.daysSinceActivity}d idle</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Hot Leads ── */}
          <HotLeadsWidget hotLeads={props.hotLeads} />

          {/* ── Today's Priorities: Marketing Schedule + To-Do ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <DailyScheduleWidget />
            </div>
            <div>
              <TodoList />
            </div>
          </div>
        </div>
      )}

      {/* ═══ PERFORMANCE TAB ═══ */}
      {tab === 'performance' && (
        <div className="space-y-4">
          {/* KPI row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Volume YTD', value: fmtK(props.volumeYTD), sub: `${props.fundedYTD} loans funded`, border: '#3b82f6' },
              { label: 'Commission YTD', value: fmt(props.commissionYTD), sub: `${fmt(props.commissionThisMonth)} this month`, border: '#C9A84C' },
              { label: 'Projected', value: fmt(props.commissionYTD + props.projectedCommission), sub: `${fmt(props.projectedCommission)} in pipeline`, border: '#10b981' },
              { label: 'Avg Per Loan', value: props.fundedYTD > 0 ? fmt(props.commissionYTD / props.fundedYTD) : '—', sub: props.fundedYTD > 0 ? `${fmtK(props.volumeYTD / props.fundedYTD)} avg loan` : '', border: '#8b5cf6' },
            ].map(k => (
              <Card key={k.label} className="p-3" style={{ borderLeftWidth: 4, borderLeftColor: k.border }}>
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">{k.label}</div>
                <div className="text-xl font-mono font-bold text-foreground">{k.value}</div>
                {k.sub && <div className="text-[10px] font-mono text-muted-foreground mt-0.5">{k.sub}</div>}
              </Card>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-4">
              <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-4">Volume by Month</h3>
              {props.chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={props.chartData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                    <XAxis dataKey="month" tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }} axisLine={{ stroke: '#1e293b' }} tickLine={false} />
                    <YAxis tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} tickFormatter={v => fmtK(v as number)} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                    <Bar dataKey="volume" name="Volume" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-zinc-600 font-mono text-sm">No funded loans this year</div>
              )}
            </Card>

            <Card className="p-4">
              <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-4">Commission Trend</h3>
              {props.chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={props.chartData.reduce<Array<{ month: string; cumCommission: number }>>((acc, d) => {
                    const prev = acc.length > 0 ? acc[acc.length - 1].cumCommission : 0
                    acc.push({ month: d.month, cumCommission: prev + d.commission })
                    return acc
                  }, [])} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                    <XAxis dataKey="month" tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }} axisLine={{ stroke: '#1e293b' }} tickLine={false} />
                    <YAxis tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} tickFormatter={v => fmtK(v as number)} />
                    <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#334155' }} />
                    <Line type="monotone" dataKey="cumCommission" name="Cumulative Commission" stroke="#C9A84C" strokeWidth={2.5} dot={{ r: 4, fill: '#C9A84C' }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-zinc-600 font-mono text-sm">No data yet</div>
              )}
            </Card>
          </div>

          {/* Loans by stage chart */}
          <Card className="p-4">
            <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-4">Active Pipeline by Stage</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={props.stageData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                <XAxis dataKey="stage" tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }} axisLine={{ stroke: '#1e293b' }} tickLine={false} />
                <YAxis tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="count" name="Loans" radius={[3, 3, 0, 0]}>
                  {props.stageData.map((s, i) => (
                    <Cell key={i} fill={statusHex(s.stage)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Monthly breakdown table */}
          {props.chartData.length > 0 && (
            <Card className="overflow-hidden">
              <div className="px-4 py-3 border-b border-input text-xs font-mono text-muted-foreground uppercase tracking-wider">Monthly Breakdown</div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="border-b border-input">
                      <th className="text-left px-3 py-2.5 text-[10px] text-zinc-500 uppercase tracking-wider">Month</th>
                      <th className="text-right px-3 py-2.5 text-[10px] text-zinc-500 uppercase tracking-wider">Loans</th>
                      <th className="text-right px-3 py-2.5 text-[10px] text-zinc-500 uppercase tracking-wider">Volume</th>
                      <th className="text-right px-3 py-2.5 text-[10px] text-zinc-500 uppercase tracking-wider">Commission</th>
                    </tr>
                  </thead>
                  <tbody>
                    {props.chartData.map((d, i) => (
                      <tr key={d.month} className={i % 2 ? 'bg-black/20' : ''}>
                        <td className="px-3 py-2.5 text-zinc-100 font-medium">{d.month}</td>
                        <td className="px-3 py-2.5 text-right text-zinc-400">{d.loans}</td>
                        <td className="px-3 py-2.5 text-right text-blue-400">{fmtK(d.volume)}</td>
                        <td className="px-3 py-2.5 text-right text-[#C9A84C]">{fmt(d.commission)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-input bg-secondary/50">
                      <td className="px-3 py-2.5 text-zinc-100 font-semibold">YTD</td>
                      <td className="px-3 py-2.5 text-right text-zinc-100 font-semibold">{props.fundedYTD}</td>
                      <td className="px-3 py-2.5 text-right text-blue-400 font-semibold">{fmtK(props.volumeYTD)}</td>
                      <td className="px-3 py-2.5 text-right text-[#C9A84C] font-semibold">{fmt(props.commissionYTD)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ═══ BRIEFING TAB ═══ */}
      {tab === 'briefing' && (
        <div className="max-w-3xl">
          <DailyBriefingPanel />
        </div>
      )}

      {/* ═══ QUEUE TAB ═══ */}
      {tab === 'queue' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <SmartActionQueue scoredLoans={props.scoredLoans} />
          </div>
          <div>
            <TodoList />
          </div>
        </div>
      )}
    </div>
  )
}

// ── Stage badge (uses global statusHex map) ─────────────────────────────
function StageBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-zinc-600 text-[10px] font-mono">—</span>
  const hex = statusHex(status)
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-mono font-medium border"
      style={{
        background: `${hex}22`,
        color: hex,
        borderColor: `${hex}44`,
      }}
    >
      {status}
    </span>
  )
}
