'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle, Clock, Brain, ListChecks,
  Phone, Mail, MessageSquare, FileText, Zap, ArrowRight,
} from 'lucide-react'
import SmartActionQueue from '@/components/SmartActionQueue'
import type { ScoredLoan } from '@/lib/scoreLoans'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import DailyBriefingPanel from './DailyBriefingPanel'
import DailyScheduleWidget from './DailyScheduleWidget'
import { fmtCurrency, fmtK } from '@/lib/formatters'
import { statusHex } from '@/lib/constants/loan-stages'

// ── Types ────────────────────────────────────────────────────────────────
interface StageData { stage: string; count: number; volume: number; commission: number }
interface UrgentFlag { id: string; name: string; flag: string; date: string }
interface StaleLoan { id: string; name: string; daysSinceActivity: number }
interface LoanRow {
  id: string; borrower_first_name: string | null; borrower_last_name: string | null
  loan_name: string | null; loan_amount: number | null; loan_type: string | null
  loan_program: string | null; loan_term: number | null; status: string | null
  estimated_closing_date: string | null; closing_date: string | null
  commission_amount: number | null; contact_id: string | null
}
interface ActivityEntry {
  id: string; created_at: string; type?: string | null; action?: string | null
  summary?: string | null; contact_id?: string | null; loan_id?: string | null
  metadata?: Record<string, unknown> | null
}
interface ChartPoint { month: string; loans: number; volume: number; commission: number }

interface DashboardClientProps {
  totalActive: number; totalActiveVolume: number; totalActiveCommission: number
  commissionThisMonth: number; commissionYTD: number; projectedCommission: number
  fundedThisMonth: number; fundedYTD: number
  volumeThisMonth: number; volumeYTD: number
  stageData: StageData[]
  urgentFlags: UrgentFlag[]; staleLoans: StaleLoan[]
  recentLoans: LoanRow[]; activityEntries: ActivityEntry[]
  chartData: ChartPoint[]
  scoredLoans: ScoredLoan[]
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

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (mins > 0) return `${mins}m ago`
  return 'just now'
}

function fmtDate(s: string | null): string {
  if (!s) return '—'
  return new Date(s + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  email: <Mail className="w-3.5 h-3.5" />,
  call: <Phone className="w-3.5 h-3.5" />,
  document: <FileText className="w-3.5 h-3.5" />,
  automation: <Zap className="w-3.5 h-3.5" />,
  note: <MessageSquare className="w-3.5 h-3.5" />,
  text: <MessageSquare className="w-3.5 h-3.5" />,
  task: <Clock className="w-3.5 h-3.5" />,
}

// ── Component ───────────────────────────────────────────────────────────
export default function DashboardClient(props: DashboardClientProps) {
  const [tab, setTab] = useState<'pipeline' | 'performance' | 'briefing' | 'queue'>('pipeline')
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <div className="min-h-screen bg-[#060b18] p-4 lg:p-6 space-y-4">

      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-mono font-bold text-zinc-100">Dashboard</h1>
          <p className="text-xs font-mono text-zinc-500 mt-0.5">{dateStr}</p>
        </div>
        <div className="flex items-center gap-3">
          {props.urgentFlags.length > 0 && (
            <div className="flex items-center gap-1.5 bg-amber-900/30 border border-amber-700 rounded-lg px-3 py-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-mono text-amber-400">{props.urgentFlags.length} urgent</span>
            </div>
          )}
          {/* Tab toggle */}
          <div className="flex bg-[#0f172a] border border-[#1e293b] rounded-lg p-1 gap-0.5">
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
          {/* Top-level KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Link href="/dashboard/loans" className="block bg-[#0f172a] border border-[#1e293b] border-l-4 border-l-[#3b82f6] rounded-lg p-3 hover:bg-[#1e293b]/50 transition-colors">
              <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-1">Pipeline Loans</div>
              <div className="text-2xl font-mono font-bold text-zinc-100">{props.totalActive}</div>
              <div className="text-[10px] font-mono text-zinc-500 mt-0.5">{fmtK(props.totalActiveVolume)} volume</div>
            </Link>
            <Link href="/dashboard/loans" className="block bg-[#0f172a] border border-[#1e293b] border-l-4 border-l-[#C9A84C] rounded-lg p-3 hover:bg-[#1e293b]/50 transition-colors">
              <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-1">Gross Commission</div>
              <div className="text-2xl font-mono font-bold text-[#C9A84C]">{fmt(props.totalActiveCommission)}</div>
              <div className="text-[10px] font-mono text-zinc-500 mt-0.5">In pipeline</div>
            </Link>
            <Link href="/dashboard/loans?stage=funded&period=ytd" className="block bg-[#0f172a] border border-[#1e293b] border-l-4 border-l-[#10b981] rounded-lg p-3 hover:bg-[#1e293b]/50 transition-colors">
              <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-1">Commission YTD</div>
              <div className="text-2xl font-mono font-bold text-emerald-400">{fmt(props.commissionYTD)}</div>
              <div className="text-[10px] font-mono text-zinc-500 mt-0.5">{props.fundedYTD} loans funded</div>
            </Link>
            <Link href="/dashboard/loans?stage=funded&period=mtd" className="block bg-[#0f172a] border border-[#1e293b] border-l-4 border-l-[#8b5cf6] rounded-lg p-3 hover:bg-[#1e293b]/50 transition-colors">
              <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-1">This Month</div>
              <div className="text-2xl font-mono font-bold text-violet-400">{fmt(props.commissionThisMonth)}</div>
              <div className="text-[10px] font-mono text-zinc-500 mt-0.5">{props.fundedThisMonth} loans · {fmtK(props.volumeThisMonth)}</div>
            </Link>
          </div>

          {/* Stage pipeline cards */}
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-widest">Loans by Stage</span>
              <Link href="/dashboard/loans" className="flex items-center gap-1 text-xs font-mono text-[#C9A84C] hover:text-[#d4b860]">
                View all <ArrowRight size={11} />
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {props.stageData.map(s => {
                const barPct = props.totalActiveVolume > 0 ? Math.min(100, (s.volume / props.totalActiveVolume) * 100) : 0
                const color = statusHex(s.stage)
                return (
                  <Link
                    key={s.stage}
                    href={`/dashboard/loans?stage=${encodeURIComponent(s.stage)}`}
                    className="block hover:bg-[#1e293b]/50 rounded-lg p-3 -m-3 transition-colors cursor-pointer"
                  >
                    <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1">{s.stage}</p>
                    <p className="text-2xl font-mono font-bold text-zinc-100">{s.count}</p>
                    <p className="text-xs font-mono mt-0.5" style={{ color }}>{s.volume > 0 ? fmtK(s.volume) : '—'}</p>
                    {s.commission > 0 && (
                      <p className="text-[10px] font-mono text-[#C9A84C] mt-0.5">{fmt(s.commission)} comm.</p>
                    )}
                    <div className="mt-2 h-0.5 bg-[#1e293b] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${barPct}%`, backgroundColor: color }} />
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Urgent flags */}
          {props.urgentFlags.length > 0 && (
            <div className="bg-amber-950/20 border border-amber-800/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={14} className="text-amber-400" />
                <span className="text-xs font-mono font-semibold text-amber-400 uppercase tracking-widest">Urgent Attention</span>
              </div>
              <div className="space-y-2">
                {props.urgentFlags.map(f => (
                  <Link key={f.id + f.flag} href={`/dashboard/loans/${f.id}`} className="flex items-center justify-between text-xs font-mono hover:bg-amber-900/20 rounded px-2 py-1.5 -mx-2 transition-colors">
                    <span className="text-zinc-200">{f.name}</span>
                    <span className="text-amber-400">{f.flag} — {fmtDate(f.date)}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Needs Attention — full width */}
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={14} className="text-orange-400" />
              <span className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-widest">Needs Attention</span>
              <span className="text-[10px] font-mono text-zinc-600">3+ days no activity</span>
              {props.staleLoans.length > 0 && (
                <Link href="/dashboard/loans?filter=no_activity_3days" className="ml-auto flex items-center gap-1 text-[10px] font-mono text-[#C9A84C] hover:text-[#d4b860]">
                  View all <ArrowRight size={9} />
                </Link>
              )}
            </div>
            {props.staleLoans.length === 0 ? (
              <p className="text-xs font-mono text-zinc-600">All loans are up to date</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
                {props.staleLoans.slice(0, 12).map(l => (
                  <Link key={l.id} href={`/dashboard/loans/${l.id}`} className="flex items-center justify-between text-xs font-mono hover:bg-[#1e293b]/50 rounded px-2 py-1.5 transition-colors">
                    <span className="text-zinc-300 truncate">{l.name}</span>
                    <span className="text-orange-400 ml-2 flex-shrink-0">{l.daysSinceActivity}d idle</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Daily Schedule */}
          <DailyScheduleWidget />

          {/* Recent Loans + Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-[#0f172a] border border-[#1e293b] rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e293b]">
                <span className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-widest">Active Loans</span>
                <Link href="/dashboard/loans" className="flex items-center gap-1 text-xs font-mono text-[#C9A84C] hover:text-[#d4b860]">
                  View all <ArrowRight size={11} />
                </Link>
              </div>
              {props.recentLoans.length === 0 ? (
                <div className="py-12 text-center text-xs font-mono text-zinc-600">No active loans</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-mono">
                    <thead>
                      <tr className="border-b border-[#1e293b]">
                        <th className="text-left px-4 py-2.5 text-[10px] text-zinc-500 uppercase tracking-wider">Borrower</th>
                        <th className="text-right px-4 py-2.5 text-[10px] text-zinc-500 uppercase tracking-wider">Amount</th>
                        <th className="text-left px-4 py-2.5 text-[10px] text-zinc-500 uppercase tracking-wider">Stage</th>
                        <th className="text-right px-4 py-2.5 text-[10px] text-zinc-500 uppercase tracking-wider hidden md:table-cell">Commission</th>
                        <th className="text-right px-4 py-2.5 text-[10px] text-zinc-500 uppercase tracking-wider hidden md:table-cell">Close</th>
                      </tr>
                    </thead>
                    <tbody>
                      {props.recentLoans.map((loan, i) => {
                        const name = [loan.borrower_first_name, loan.borrower_last_name].filter(Boolean).join(' ') || loan.loan_name || '(unnamed)'
                        return (
                          <tr key={loan.id} className={`hover:bg-[#1e293b]/30 ${i > 0 ? 'border-t border-[#1e293b]' : ''}`}>
                            <td className="px-4 py-2.5">
                              <Link href={`/dashboard/loans/${loan.id}`} className="text-zinc-200 hover:text-[#C9A84C] transition-colors">{name}</Link>
                            </td>
                            <td className="px-4 py-2.5 text-right text-zinc-200">{fmt(loan.loan_amount ?? 0)}</td>
                            <td className="px-4 py-2.5"><StageBadge status={loan.status} /></td>
                            <td className="px-4 py-2.5 text-right text-[#C9A84C] hidden md:table-cell">{loan.commission_amount ? fmt(loan.commission_amount) : '—'}</td>
                            <td className="px-4 py-2.5 text-right text-zinc-500 hidden md:table-cell">{fmtDate(loan.estimated_closing_date || loan.closing_date)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Activity feed */}
            <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-[#1e293b]">
                <span className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-widest">Activity</span>
              </div>
              {props.activityEntries.length === 0 ? (
                <div className="py-10 text-center text-xs font-mono text-zinc-600">No activity in last 7 days</div>
              ) : (
                <div className="divide-y divide-[#1e293b] overflow-y-auto max-h-96">
                  {props.activityEntries.slice(0, 15).map(entry => {
                    const type = (entry.type || entry.action || 'task').toLowerCase()
                    const icon = TYPE_ICONS[type] ?? <Clock className="w-3.5 h-3.5" />
                    const summary = entry.summary || entry.action || 'Activity logged'
                    const href = entry.loan_id
                      ? `/dashboard/loans/${entry.loan_id}`
                      : entry.contact_id
                      ? `/dashboard/contacts/${entry.contact_id}`
                      : null
                    const Inner = (
                      <>
                        <span className="p-1 rounded text-zinc-400 bg-[#1e293b] flex-shrink-0 mt-0.5">{icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="text-xs font-mono text-zinc-200 leading-snug">{summary}</div>
                            <span className="text-[10px] font-mono text-zinc-600 flex-shrink-0">{timeAgo(entry.created_at)}</span>
                          </div>
                        </div>
                      </>
                    )
                    return href ? (
                      <Link key={entry.id} href={href} className="flex items-start gap-2.5 px-4 py-3 hover:bg-[#1e293b]/40 transition-colors">
                        {Inner}
                      </Link>
                    ) : (
                      <div key={entry.id} className="flex items-start gap-2.5 px-4 py-3">
                        {Inner}
                      </div>
                    )
                  })}
                </div>
              )}
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
              <div key={k.label} className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-3" style={{ borderLeftWidth: 4, borderLeftColor: k.border }}>
                <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-1">{k.label}</div>
                <div className="text-xl font-mono font-bold text-zinc-100">{k.value}</div>
                {k.sub && <div className="text-[10px] font-mono text-zinc-500 mt-0.5">{k.sub}</div>}
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-4">
              <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-wider mb-4">Volume by Month</h3>
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
            </div>

            <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-4">
              <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-wider mb-4">Commission Trend</h3>
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
            </div>
          </div>

          {/* Loans by stage chart */}
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-4">
            <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-wider mb-4">Active Pipeline by Stage</h3>
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
          </div>

          {/* Monthly breakdown table */}
          {props.chartData.length > 0 && (
            <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-[#1e293b] text-xs font-mono text-zinc-400 uppercase tracking-wider">Monthly Breakdown</div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="border-b border-[#1e293b]">
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
                    <tr className="border-t-2 border-[#334155] bg-[#1e293b]/50">
                      <td className="px-3 py-2.5 text-zinc-100 font-semibold">YTD</td>
                      <td className="px-3 py-2.5 text-right text-zinc-100 font-semibold">{props.fundedYTD}</td>
                      <td className="px-3 py-2.5 text-right text-blue-400 font-semibold">{fmtK(props.volumeYTD)}</td>
                      <td className="px-3 py-2.5 text-right text-[#C9A84C] font-semibold">{fmt(props.commissionYTD)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
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
        <SmartActionQueue scoredLoans={props.scoredLoans} />
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
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-medium border"
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
