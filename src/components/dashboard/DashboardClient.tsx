'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ListChecks, ArrowRight,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import { fmtCurrency, fmtK } from '@/lib/formatters'
import { statusHex } from '@/lib/constants/loan-stages'
import HotLeadsWidget, { type HotLead } from '@/components/dashboard/HotLeadsWidget'
import NeedsAttentionWidget from '@/components/dashboard/NeedsAttentionWidget'
import type { NeedsAttentionItem } from '@/lib/needsAttention'
import { Card } from '@/components/ui/card'
import SparklineCard from './charts/SparklineCard'
import ConversionFunnel from './charts/ConversionFunnel'
import ReferralLeaderboard from './charts/ReferralLeaderboard'
import RateLockCountdown from './charts/RateLockCountdown'
import YoYVolumeChart from './charts/YoYVolumeChart'
import CommissionForecast from './charts/CommissionForecast'
import DaysToCloseGauge from './charts/DaysToCloseGauge'
import LeadSourceChart from './charts/LeadSourceChart'
import NewLeadsChart from './charts/NewLeadsChart'
import type { LeadSourceCategory } from '@/lib/leadSources'
import NotesScratchpad from './NotesScratchpad'
import StalledWidget, { type StalledItem } from './StalledWidget'
import UnknownSendersWidget from './UnknownSendersWidget'
import CompensationPanel, { type CompPlan, type CompRow } from './CompensationPanel'
import AeoVsSeoCard from '@/components/dashboard/analytics/AeoVsSeoCard'
import SourceConversionTable, { type SourceConversionRow } from '@/components/dashboard/analytics/SourceConversionTable'
import RealtorPerformanceTable, { type RealtorPerformanceRow } from '@/components/dashboard/analytics/RealtorPerformanceTable'
import { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell } from '@/components/ui/table'

// ── Types ────────────────────────────────────────────────────────────────
interface StageData { stage: string; count: number; volume: number; commission: number }
interface ChartPoint { month: string; loans: number; volume: number; commission: number }

interface DashboardClientProps {
  totalActive: number; totalActiveVolume: number; totalActiveCommission: number
  pipelineCount?: number; pipelineVolume?: number; pipelineCommission?: number
  commissionThisMonth: number; commissionYTD: number; projectedCommission: number
  fundedThisMonth: number; fundedYTD: number
  volumeThisMonth: number; volumeYTD: number
  stageData: StageData[]
  chartData: ChartPoint[]
  hotLeads: HotLead[]
  needsAttention: NeedsAttentionItem[]
  funnelData: Array<{ stage: string; count: number }>
  showSetupBanner?: boolean
  sparklineMonths: Array<{ month: string; commission: number; volume: number; funded: number }>
  referralData: Array<{ source: string; loans: number; volume: number; funded: number }>
  rateLockLoans: Array<{ id: string; name: string; daysRemaining: number; totalDays: number; expirationDate: string }>
  yoyChartData: Array<{ month: string; thisYear: number; lastYear: number }>
  forecastData: Array<{ month: string; actual: number; projected: number }>
  daysToCloseData: Array<{ type: string; avgDays: number; count: number }>
  pipelineLoans: Array<{ id: string; name: string; amount: number; status: string | null; closingDate: string | null; rate: number | null; commission: number; rateLockExp: string | null; lender: string | null }>
  newAppsAndPAs: Array<{ id: string; name: string; amount: number; status: string | null; stage: string; createdAt: string | null; loanType: string | null; referralSource: string | null }>
  leadSourceData: Array<{ source: string; count: number; volume: number }>
  newLeadSourceData: Array<{ source: LeadSourceCategory; count: number }>
  newLeadsWindowDays: number
  sourceConversionRows: SourceConversionRow[]
  aeoBucket: { leads: number; funded: number; volume: number }
  seoBucket: { leads: number; funded: number; volume: number }
  realtorPerformanceRows: RealtorPerformanceRow[]
  stalledItems: StalledItem[]
  neverContactedCount: number
  stalledThresholdDays: number
  compPlan: CompPlan | null
  compRows: CompRow[]
}

// ── Formatters ──────────────────────────────────────────────────────────
const fmt = fmtCurrency

// ── Tooltip ─────────────────────────────────────────────────────────────
interface TTProps { active?: boolean; payload?: Array<{ value: number; name: string; color?: string }>; label?: string }
const ChartTooltip = ({ active, payload, label }: TTProps) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-muted border border-input rounded px-3 py-2 text-xs font-mono space-y-0.5">
      <div className="text-foreground/80 mb-1">{label}</div>
      {payload.map(p => (
        <div key={p.name} className="text-muted-foreground">{p.name}: <span className="text-foreground">{fmt(p.value)}</span></div>
      ))}
    </div>
  )
}

function fmtDateShort(s: string | null): string {
  if (!s) return '—'
  const d = s.includes('T') ? new Date(s) : new Date(s + 'T00:00:00')
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ── Component ───────────────────────────────────────────────────────────
export default function DashboardClient(props: DashboardClientProps) {
  const [tab, setTab] = useState<'pipeline' | 'performance'>('pipeline')
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <div className="min-h-screen bg-[var(--bg)] p-4 lg:p-6 space-y-4">

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
          <h1 className="text-xl font-mono font-bold text-foreground">Dashboard</h1>
          <p className="text-xs font-mono text-muted-foreground mt-0.5">{dateStr}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-card border border-input rounded-lg p-1 gap-0.5">
            <button
              onClick={() => setTab('pipeline')}
              className={`px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors ${tab === 'pipeline' ? 'bg-[#C9A84C] text-black' : 'text-muted-foreground hover:text-foreground'}`}
            >Pipeline</button>
            <button
              onClick={() => setTab('performance')}
              className={`px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors ${tab === 'performance' ? 'bg-[#C9A84C] text-black' : 'text-muted-foreground hover:text-foreground'}`}
            >Performance</button>
          </div>
        </div>
      </div>

      {/* ═══ PIPELINE TAB ═══ */}
      {tab === 'pipeline' && (
        <div className="space-y-4">
          {/* ── KPI Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <SparklineCard
              href="/dashboard/loans?stage=funded&period=ytd"
              label="Commission Earned"
              value={fmt(props.commissionYTD)}
              subtitle={`${props.fundedYTD} loans · ${fmtK(props.volumeYTD)} volume YTD`}
              borderColor="#10b981"
              valueColor="text-emerald-400"
              data={props.sparklineMonths.map(m => ({ value: m.commission }))}
              sparkColor="#10b981"
            />
            <SparklineCard
              href="/dashboard/loans"
              label="Pipeline Commission"
              value={fmt(props.pipelineCommission ?? props.totalActiveCommission)}
              subtitle={`${props.pipelineCount ?? props.totalActive} loans · ${fmtK(props.pipelineVolume ?? props.totalActiveVolume)} volume`}
              borderColor="#C9A84C"
              data={props.sparklineMonths.map(m => ({ value: m.volume }))}
              sparkColor="#C9A84C"
            />
            <SparklineCard
              href="/dashboard/loans?stage=funded&period=mtd"
              label="Closed This Month"
              value={fmt(props.commissionThisMonth)}
              subtitle={`${props.fundedThisMonth} loans · ${fmtK(props.volumeThisMonth)} volume`}
              borderColor="#8b5cf6"
              valueColor="text-violet-400"
              data={props.sparklineMonths.map(m => ({ value: m.funded }))}
              sparkColor="#8b5cf6"
            />
            <SparklineCard
              href="/dashboard/loans"
              label="Pipeline Loans"
              value={String(props.pipelineCount ?? props.totalActive)}
              subtitle={`${fmtK(props.pipelineVolume ?? props.totalActiveVolume)} volume`}
              borderColor="#3b82f6"
              data={props.sparklineMonths.map(m => ({ value: m.volume }))}
              sparkColor="#3b82f6"
            />
          </div>

          {/* Mini Pipeline Table removed 2026-04-16 — duplicated the Pipeline tab one click away */}

          {/* ── Command center row: Notes scratchpad + Unknown senders ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <NotesScratchpad />
            <UnknownSendersWidget />
          </div>

          {/* ── New Applications & Pre-Approvals ── */}
          {props.newAppsAndPAs.length > 0 && (
            <Card className="overflow-hidden">
              <div className="px-4 py-3 border-b border-input">
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">New Applications & Pre-Approvals</span>
              </div>
              <div className="max-h-[280px] overflow-y-auto">
                <Table className="font-mono text-xs">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-left">Borrower</TableHead>
                      <TableHead>Stage</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead className="text-right">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {props.newAppsAndPAs.map(l => (
                      <TableRow key={l.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => window.location.href = `/dashboard/loans/${l.id}`}>
                        <TableCell className="font-medium text-foreground">{l.name}</TableCell>
                        <TableCell>{l.status && <StageBadge status={l.status} />}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{l.amount ? fmtK(l.amount) : '—'}</TableCell>
                        <TableCell className="text-muted-foreground">{l.loanType ?? '—'}</TableCell>
                        <TableCell className="text-muted-foreground truncate max-w-[120px]">{l.referralSource ?? '—'}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{fmtDateShort(l.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}

          {/* ── Needs Your Attention (AI-classified inbound emails) ── */}
          {props.needsAttention.length > 0 && (
            <NeedsAttentionWidget items={props.needsAttention} />
          )}

          {/* ── Stalled: loans with no movement + never-contacted leads ── */}
          <StalledWidget
            items={props.stalledItems}
            neverContactedCount={props.neverContactedCount}
            thresholdDays={props.stalledThresholdDays}
          />

          {/* ── Two-column: Hot Leads (compact) + Rate Lock (compact) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <HotLeadsWidget hotLeads={props.hotLeads.slice(0, 5)} />
            <RateLockCountdown locks={props.rateLockLoans.slice(0, 5)} />
          </div>

          {/* ── Two-column: New Leads by Source (30d) + Closed Business by Source ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <NewLeadsChart data={props.newLeadSourceData} windowDays={props.newLeadsWindowDays} />
            <LeadSourceChart data={props.leadSourceData} />
          </div>

          {/* ── Conversion Funnel ── */}
          <ConversionFunnel data={props.funnelData} />

          {/* ── Top Realtors ── */}
          <ReferralLeaderboard data={props.referralData} />

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
                <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-1">{k.label}</div>
                <div className="text-xl font-mono font-bold text-foreground">{k.value}</div>
                {k.sub && <div className="text-[11px] font-mono text-muted-foreground mt-0.5">{k.sub}</div>}
              </Card>
            ))}
          </div>

          {/* ── Compensation: live from funded loans + comp plan ── */}
          <CompensationPanel plan={props.compPlan} rows={props.compRows} />

          {/* Charts — YoY Volume + Commission Forecast */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <YoYVolumeChart data={props.yoyChartData} currentYear={new Date().getFullYear()} />
            <CommissionForecast data={props.forecastData} />
          </div>

          {/* AEO vs SEO */}
          <AeoVsSeoCard aeo={props.aeoBucket} seo={props.seoBucket} />

          {/* Source conversion table */}
          <SourceConversionTable rows={props.sourceConversionRows} />

          {/* Realtor performance — top 10 */}
          <RealtorPerformanceTable rows={props.realtorPerformanceRows} />

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

          {/* Days to Close Gauge */}
          <DaysToCloseGauge data={props.daysToCloseData} />

          {/* Monthly breakdown table */}
          {props.chartData.length > 0 && (
            <Card className="overflow-hidden">
              <div className="px-4 py-3 border-b border-input text-xs font-mono text-muted-foreground uppercase tracking-wider">Monthly Breakdown</div>
              <Table className="font-mono">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-left">Month</TableHead>
                    <TableHead className="text-right">Loans</TableHead>
                    <TableHead className="text-right">Volume</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {props.chartData.map((d) => (
                    <TableRow key={d.month}>
                      <TableCell className="text-foreground font-medium">{d.month}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{d.loans}</TableCell>
                      <TableCell className="text-right text-blue-400">{fmtK(d.volume)}</TableCell>
                      <TableCell className="text-right text-primary">{fmt(d.commission)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow className="border-t-2 border-input">
                    <TableCell className="text-foreground font-semibold">YTD</TableCell>
                    <TableCell className="text-right text-foreground font-semibold">{props.fundedYTD}</TableCell>
                    <TableCell className="text-right text-blue-400 font-semibold">{fmtK(props.volumeYTD)}</TableCell>
                    <TableCell className="text-right text-primary font-semibold">{fmt(props.commissionYTD)}</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </Card>
          )}
        </div>
      )}

    </div>
  )
}

// ── Stage badge (uses global statusHex map) ─────────────────────────────
function StageBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-muted-foreground text-[11px] font-mono">—</span>
  const hex = statusHex(status)
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-mono font-medium border"
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
