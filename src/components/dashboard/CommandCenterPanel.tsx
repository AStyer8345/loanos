'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import type { Category, CommandCenter, WorkItem } from '@/lib/command-center'
import { ROUTING_REASONS } from '@/lib/command-center-routing'

const currency = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const when = (s: string | null) => s ? new Date(s.length === 10 ? s + 'T12:00:00Z' : s).toLocaleDateString('en-US', { timeZone: 'America/Chicago', month: 'short', day: 'numeric' }) : 'Not recorded'
const categories: Category[] = ['Needs LO', 'Needs Team', 'Waiting on Borrower', 'Waiting on Third Party', 'Overdue', 'Closing Risk', 'Hot Lead', 'Unassigned']
const selectClass = 'rounded border border-input bg-background px-2 py-1.5 text-sm text-foreground'

export default function CommandCenterPanel() {
  const [data, setData] = useState<CommandCenter | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<Category | 'All'>('All')
  const [scope, setScope] = useState('all')
  const [limits, setLimits] = useState({ tasks: 10, leads: 10, exceptions: 10 })
  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/command-center', { cache: 'no-store' })
      if (!response.ok) throw new Error('The complete queue could not be loaded. Please refresh.')
      setData(await response.json())
      setError('')
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load queue') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { void refresh() }, [refresh])
  const visible = useMemo(() => {
    const matches = (item: WorkItem) => (category === 'All' || item.categories.includes(category)) &&
      (scope === 'all' || (scope === 'mine' ? item.ownerId === data?.viewerId : scope === 'unassigned' ? !item.ownerId : item.ownerId === scope)) &&
      [item.name, item.issue, item.owner, item.source, item.stage].filter(Boolean).join(' ').toLowerCase().includes(query.toLowerCase())
    return { tasks: data?.tasks.filter(matches) || [], leads: data?.leads.filter(matches) || [], exceptions: data?.exceptions.filter(matches) || [] }
  }, [data, category, scope, query])
  const routeTask = async (id: string, value: { assigned_to?: string | null; follow_up_reason?: string | null }) => {
    setSaving(id)
    try {
      const response = await fetch('/api/command-center/tasks/' + id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value) })
      if (!response.ok) throw new Error('Task routing could not be saved. No change is confirmed.')
      await refresh()
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to save task') }
    finally { setSaving(null) }
  }
  const label = (c: string) => c === 'Needs LO' ? `Needs ${data?.loanOfficerName || 'LO'}` : c
  const renderSection = (key: keyof typeof visible, title: string, note: string) => <section className="rounded-xl border border-input bg-card p-4" aria-label={title}>
    <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2"><h2 className="text-lg font-semibold">{title} <span className="text-muted-foreground">{visible[key].length}</span></h2><span className="text-xs text-muted-foreground">{note}</span></div>
    {!visible[key].length && <p className="py-3 text-sm text-muted-foreground">No recorded items match this view.</p>}
    <div className="divide-y divide-input">{visible[key].slice(0, limits[key]).map(item => <article key={item.id} className="py-4 first:pt-0">
      <div className="flex flex-wrap justify-between gap-2"><Link href={item.href} className="font-semibold text-foreground underline decoration-muted-foreground underline-offset-4">{item.name}</Link><span className={item.loNeeded ? 'text-sm font-semibold text-amber-400' : 'text-sm text-muted-foreground'}>{data?.loanOfficerName} needed: {item.loNeeded ? 'Yes' : 'No'}</span></div>
      <p className="mt-1 font-medium">{item.issue}</p><p className="mt-1 text-sm text-muted-foreground">{item.why}</p>
      <p className="mt-2 text-sm"><span className="text-muted-foreground">Next: </span>{item.nextAction}</p>
      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground"><span>{key === 'tasks' ? 'Task owner' : 'Related task / processor'}: {item.owner}</span><span>Due: {when(item.dueAt)}</span><span>Last communication: {when(item.lastActivity)}</span><span>Stage: {item.stage || 'Not recorded'}</span><span>Risk: {item.risk === 'high' ? 'Review promptly' : 'Routine'}</span>{item.amount != null && <span>Opportunity: {currency(item.amount)}</span>}{item.revenue != null && <span>Commission: {currency(item.revenue)}</span>}</div>
      {item.receivedAt && <p className="mt-2 text-xs text-muted-foreground">Received {when(item.receivedAt)} · {Math.max(0, Math.floor((Date.parse(data!.asOf) - Date.parse(item.receivedAt)) / 3600000))} hours old · {item.source || 'Source not recorded'} · {item.sourcePage?.split('?')[0] || 'Page not recorded'} · {item.purpose || 'Purpose not recorded'} · {item.responseState}</p>}
      <div className="mt-2 flex flex-wrap gap-2">{item.categories.map(c => <span key={c} className="rounded bg-muted px-2 py-1 text-xs">{label(c)}</span>)}</div>
      {item.taskId && <div className="mt-3 flex flex-wrap items-center gap-2">
        <label className="text-xs">Task owner <select aria-label={`Assign ${item.issue}`} className={selectClass + ' ml-1'} disabled={!!saving || loading} value={item.ownerId || ''} onChange={e => void routeTask(item.taskId!, { assigned_to: e.target.value || null })}><option value="">Unassigned</option>{data?.members.map(m => <option key={m.id} value={m.id}>{m.full_name || 'Team member'}</option>)}</select></label>
        <label className="text-xs">Route <select aria-label={`Route ${item.issue}`} className={selectClass + ' ml-1'} disabled={!!saving || loading} value="" onChange={e => { if (e.target.value) void routeTask(item.taskId!, { follow_up_reason: e.target.value === 'clear' ? null : e.target.value }) }}><option value="">Choose action…</option><option value="clear">Clear waiting / escalation</option>{ROUTING_REASONS.map(r => <option key={r} value={r}>{r.replace('waiting:', 'Waiting: ').replace('escalation:', 'Escalate: ').replaceAll('_', ' ')}</option>)}</select></label>
      </div>}
    </article>)}</div>
    {visible[key].length > limits[key] && <button className="mt-3 text-sm underline" onClick={() => setLimits(l => ({ ...l, [key]: l[key] + 20 }))}>Show 20 more</button>}
  </section>
  return <div id="attention" className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-2xl font-semibold">What needs attention?</h2><p className="mt-1 text-xs text-muted-foreground">{data ? `Loaded ${new Date(data.asOf).toLocaleString('en-US', { timeZone: 'America/Chicago' })} Central` : 'Loading your team’s work…'}</p></div><button disabled={loading} onClick={() => void refresh()} className={selectClass}>{loading ? 'Refreshing…' : 'Refresh'}</button></div>
    {error && <p role="alert" className="rounded border border-red-500 p-3 text-sm text-red-400">{error} {data ? 'The previous snapshot remains visible.' : ''}</p>}
    {data && <>
      <p className="rounded border border-amber-700/50 bg-amber-900/10 p-3 text-sm text-muted-foreground">Ownership comes from task assignments and matched processors. Full loan handoff is not yet configured. {data.members.length < 2 ? 'Add your team in Settings before assigning work to them. ' : ''}Contact history is incomplete; verify a first response before treating a lead as missed. <Link href="/dashboard/team" className="underline">Team settings</Link></p>
      <div className="flex flex-wrap gap-2"><input aria-label="Search attention queue" className={selectClass + ' min-w-48 flex-1'} placeholder="Search borrower, issue, source…" value={query} onChange={e => setQuery(e.target.value)} /><select aria-label="Work owner filter" className={selectClass} value={scope} onChange={e => setScope(e.target.value)}><option value="all">Whole team</option><option value="mine">My assigned work</option><option value="unassigned">Unassigned</option>{data.members.map(m => <option key={m.id} value={m.id}>{m.full_name || 'Team member'}</option>)}</select></div>
      <div className="flex flex-wrap gap-2">{(['All', ...categories] as const).map(c => <button key={c} aria-pressed={category === c} onClick={() => setCategory(c)} className={`rounded-full border px-3 py-1 text-xs ${category === c ? 'border-[#C9A84C] bg-[#C9A84C] text-black' : 'border-input text-muted-foreground'}`}>{label(c)}</button>)}</div>
      <p className="text-sm text-muted-foreground" aria-live="polite">This view: <strong className="text-foreground">{visible.tasks.length} tasks · {visible.leads.length} leads · {visible.exceptions.length} loan exceptions</strong></p>
      {renderSection('tasks', 'Today / needs attention', 'Open tasks; snoozed and completed work stays quiet')}
      {renderSection('leads', 'Leads to follow up', 'Website and referrals first; response review after 1 hour')}
      {renderSection('exceptions', 'Pipeline exceptions', 'Recorded deadlines and missing information')}
      <section className="rounded-xl border border-input bg-card p-4" aria-label="Money"><h2 className="mb-3 text-lg font-semibold">Money <span className="text-xs font-normal text-muted-foreground">Whole organization · recorded gross commission</span></h2><div className="grid grid-cols-2 gap-4 md:grid-cols-5">{([['Closed this month', data.money.closed], ['Expected this month', data.money.expected], ['Probable this month', data.money.probable], ['At risk this month', data.money.atRisk], ['Pipeline commission', data.money.pipeline]] as const).map(([name, value]) => <div key={name}><p className="text-xs text-muted-foreground">{name}</p><p className="mt-1 text-xl font-semibold">{currency(value)}</p></div>)}</div><p className="mt-3 text-xs text-muted-foreground">Expected = clear to close without a recorded deadline risk. Probable = other active files closing this month without that risk. At risk = this month’s active files with closing or lock risk. These are stage groups, not payment guarantees. {data.money.missing} included files have no recorded commission; amounts are incomplete when this count is above zero.</p></section>
    </>}
  </div>
}
