'use client'

import { useState } from 'react'
import Link from 'next/link'
import { DollarSign, Settings2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { fmtCurrency, fmtK } from '@/lib/formatters'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'

export type CompPlan = {
  id: string
  comp_bps: number
  company_share_pct: number
  loa_fee_bps: number
  broker_fee: number
  correspondent_fee: number
  default_deal_type: string
}

export type CompRow = {
  id: string
  loan_id: string
  borrower: string
  fundedDate: string | null
  loan_amount: number | null
  deal_type: string
  comp_bps: number
  gross_source: string
  gross_comp: number | null
  total_deductions: number | null
  net_comp: number | null
  net_bps: number | null
  payout_status: string
}

interface CompensationPanelProps {
  plan: CompPlan | null
  rows: CompRow[]
}

const DEAL_TYPES = ['both', 'brokered', 'correspondent', 'none'] as const
const PAYOUT_STATUSES = ['pending', 'confirmed', 'paid'] as const

const SOURCE_BADGE: Record<string, { label: string; cls: string }> = {
  arive: { label: 'Arive', cls: 'bg-blue-900/40 text-blue-400' },
  plan: { label: 'Plan', cls: 'bg-zinc-800 text-muted-foreground' },
  manual: { label: 'Manual', cls: 'bg-violet-900/40 text-violet-400' },
}

export default function CompensationPanel({ plan, rows: initialRows }: CompensationPanelProps) {
  const [rows, setRows] = useState(initialRows)
  const [showPlan, setShowPlan] = useState(false)
  const [planDraft, setPlanDraft] = useState({
    comp_bps: plan?.comp_bps ?? 200,
    company_share_pct: plan?.company_share_pct ?? 0.10,
    loa_fee_bps: plan?.loa_fee_bps ?? 25,
    broker_fee: plan?.broker_fee ?? 879,
    correspondent_fee: plan?.correspondent_fee ?? 379,
    default_deal_type: plan?.default_deal_type ?? 'both',
  })
  const [savingPlan, setSavingPlan] = useState(false)

  const grossYTD = rows.reduce((s, r) => s + (r.gross_comp ?? 0), 0)
  const deductionsYTD = rows.reduce((s, r) => s + (r.total_deductions ?? 0), 0)
  const netYTD = rows.reduce((s, r) => s + (r.net_comp ?? 0), 0)
  const volume = rows.reduce((s, r) => s + (r.loan_amount ?? 0), 0)
  const avgNetBps = volume > 0 ? (netYTD / volume) * 10000 : 0

  async function patchRow(id: string, patch: Record<string, unknown>) {
    const res = await fetch(`/api/comp/loans/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    if (res.ok) {
      const updated = await res.json()
      setRows(prev => prev.map(r => (r.id === id ? { ...r, ...updated } : r)))
    }
  }

  async function savePlan() {
    setSavingPlan(true)
    try {
      const res = await fetch('/api/comp/plan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planDraft),
      })
      if (res.ok) setShowPlan(false)
    } finally {
      setSavingPlan(false)
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="px-4 py-3 border-b border-input flex items-center gap-2">
        <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
        <span className="text-xs font-mono font-semibold text-emerald-400 uppercase tracking-widest">Compensation</span>
        <span className="text-[10px] font-mono text-muted-foreground">funded loans, auto-synced</span>
        <button
          onClick={() => setShowPlan(v => !v)}
          className="ml-auto flex items-center gap-1 text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors"
        >
          <Settings2 className="w-3 h-3" /> Plan defaults
        </button>
      </div>

      {/* Summary chips */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-input">
        {[
          { label: 'Gross Comp YTD', value: fmtCurrency(grossYTD), color: 'text-blue-400' },
          { label: 'Deductions YTD', value: fmtCurrency(deductionsYTD), color: 'text-orange-400' },
          { label: 'Net Comp YTD', value: fmtCurrency(netYTD), color: 'text-emerald-400' },
          { label: 'Avg Net BPS', value: avgNetBps ? avgNetBps.toFixed(1) : '—', color: 'text-foreground' },
        ].map(c => (
          <div key={c.label} className="bg-card px-4 py-3">
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{c.label}</div>
            <div className={`text-lg font-mono font-bold ${c.color}`}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Plan editor */}
      {showPlan && (
        <div className="px-4 py-3 border-t border-input bg-muted/30">
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
            {([
              { key: 'comp_bps', label: 'Comp (bps)', step: 1 },
              { key: 'company_share_pct', label: 'Company share', step: 0.01 },
              { key: 'loa_fee_bps', label: 'LOA fee (bps)', step: 1 },
              { key: 'broker_fee', label: 'Broker fee ($)', step: 1 },
              { key: 'correspondent_fee', label: 'Corresp. fee ($)', step: 1 },
            ] as const).map(f => (
              <label key={f.key} className="block">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{f.label}</span>
                <input
                  type="number"
                  step={f.step}
                  value={planDraft[f.key]}
                  onChange={e => setPlanDraft(d => ({ ...d, [f.key]: Number(e.target.value) }))}
                  className="mt-1 w-full bg-muted border border-input rounded px-2 py-1 text-xs font-mono text-foreground focus:outline-none focus:border-[#C9A84C]/60"
                />
              </label>
            ))}
            <label className="block">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Default deal type</span>
              <select
                value={planDraft.default_deal_type}
                onChange={e => setPlanDraft(d => ({ ...d, default_deal_type: e.target.value }))}
                className="mt-1 w-full bg-muted border border-input rounded px-2 py-1 text-xs font-mono text-foreground focus:outline-none"
              >
                {DEAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
          </div>
          <div className="flex items-center justify-between mt-3">
            <p className="text-[10px] font-mono text-muted-foreground">
              Applies to newly funded loans. Existing rows keep their numbers — edit them inline below.
            </p>
            <button
              onClick={savePlan}
              disabled={savingPlan}
              className="px-3 py-1 rounded text-[11px] font-mono font-medium bg-[#C9A84C] text-black disabled:opacity-40 hover:opacity-90"
            >
              {savingPlan ? 'Saving…' : 'Save plan'}
            </button>
          </div>
        </div>
      )}

      {/* Per-loan table */}
      <div className="max-h-[420px] overflow-y-auto border-t border-input">
        <Table className="font-mono text-xs">
          <TableHeader>
            <TableRow>
              <TableHead className="text-left">Borrower</TableHead>
              <TableHead>Funded</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Deal</TableHead>
              <TableHead className="text-right">Gross</TableHead>
              <TableHead>Src</TableHead>
              <TableHead className="text-right">Deductions</TableHead>
              <TableHead className="text-right">Net</TableHead>
              <TableHead className="text-right">Net bps</TableHead>
              <TableHead>Payout</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground italic py-6">
                  No funded loans yet this year — rows appear automatically when a loan hits Funded.
                </TableCell>
              </TableRow>
            )}
            {rows.map(r => {
              const badge = SOURCE_BADGE[r.gross_source] ?? SOURCE_BADGE.plan
              return (
                <TableRow key={r.id} className="hover:bg-muted/40">
                  <TableCell>
                    <Link href={`/dashboard/loans/${r.loan_id}`} className="font-medium text-foreground hover:text-[#C9A84C]">
                      {r.borrower}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">{r.fundedDate ?? '—'}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{r.loan_amount ? fmtK(r.loan_amount) : '—'}</TableCell>
                  <TableCell>
                    <select
                      value={r.deal_type}
                      onChange={e => patchRow(r.id, { deal_type: e.target.value })}
                      className="bg-muted border border-input rounded px-1 py-0.5 text-[10px] font-mono text-foreground focus:outline-none"
                    >
                      {DEAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </TableCell>
                  <TableCell className="text-right text-blue-400">
                    <input
                      type="number"
                      defaultValue={r.gross_comp ?? ''}
                      onBlur={e => {
                        const v = Number(e.target.value)
                        if (v && v !== r.gross_comp) patchRow(r.id, { gross_comp: v })
                      }}
                      className="w-20 bg-transparent border border-transparent hover:border-input focus:border-[#C9A84C]/60 rounded px-1 py-0.5 text-right text-[11px] font-mono focus:outline-none"
                    />
                  </TableCell>
                  <TableCell>
                    <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${badge.cls}`}>{badge.label}</span>
                  </TableCell>
                  <TableCell className="text-right text-orange-400">{r.total_deductions != null ? fmtCurrency(r.total_deductions) : '—'}</TableCell>
                  <TableCell className="text-right text-emerald-400 font-semibold">{r.net_comp != null ? fmtCurrency(r.net_comp) : '—'}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{r.net_bps != null ? Number(r.net_bps).toFixed(1) : '—'}</TableCell>
                  <TableCell>
                    <select
                      value={r.payout_status}
                      onChange={e => patchRow(r.id, { payout_status: e.target.value })}
                      className={`bg-muted border border-input rounded px-1 py-0.5 text-[10px] font-mono focus:outline-none ${
                        r.payout_status === 'paid' ? 'text-emerald-400' : r.payout_status === 'confirmed' ? 'text-blue-400' : 'text-muted-foreground'
                      }`}
                    >
                      {PAYOUT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}
