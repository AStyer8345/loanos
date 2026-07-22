'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, Target } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { fmtCurrency, fmtK } from '@/lib/formatters'

type ActivityKey = 'partnerConversations' | 'pastClientConversations' | 'qualifiedOpportunities' | 'applications' | 'contracts'
type FocusState = {
  version: 3
  goals: { monthlyIncome: number; monthlyVolume: number; monthlyClosings: number; weeklyConversations: number; weeklyApplications: number; weeklyContracts: number }
  activity: Record<string, Record<ActivityKey, number>>
}

const today = () => new Date().toISOString().slice(0, 10)
const defaults: FocusState = {
  version: 3,
  goals: { monthlyIncome: 100000, monthlyVolume: 12000000, monthlyClosings: 16, weeklyConversations: 50, weeklyApplications: 6, weeklyContracts: 4 },
  activity: {},
}

function mergeState(raw: unknown): FocusState {
  if (!raw || typeof raw !== 'object') return defaults
  const source = raw as Partial<FocusState>
  return { ...defaults, ...source, version: 3, goals: { ...defaults.goals, ...source.goals }, activity: source.activity ?? {} }
}

function Progress({ value, goal, color = '#D4AF37' }: { value: number; goal: number; color?: string }) {
  const pct = goal > 0 ? Math.min(100, Math.round((value / goal) * 100)) : 0
  return <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-800"><div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} /></div>
}

export default function FocusCommandCenter(props: { netIncomeMTD: number; fundedVolumeMTD: number; fundedMTD: number; pipelineNet: number }) {
  const [state, setState] = useState<FocusState>(defaults)
  const [loaded, setLoaded] = useState(false)
  const [saved, setSaved] = useState(true)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetch('/api/performance/focus').then(r => r.ok ? r.json() : Promise.reject()).then(({ data }) => setState(mergeState(data))).finally(() => setLoaded(true))
  }, [])

  useEffect(() => {
    if (!loaded) return
    setSaved(false)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      const res = await fetch('/api/performance/focus', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(state) })
      setSaved(res.ok)
    }, 650)
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
  }, [state, loaded])

  const day = state.activity[today()] ?? { partnerConversations: 0, pastClientConversations: 0, qualifiedOpportunities: 0, applications: 0, contracts: 0 }
  const weekDates = useMemo(() => {
    const now = new Date(); const monday = new Date(now); monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
    return Array.from({ length: 7 }, (_, i) => { const d = new Date(monday); d.setDate(monday.getDate() + i); return d.toISOString().slice(0, 10) })
  }, [])
  const weekly = weekDates.reduce((sum, date) => {
    const d = state.activity[date]
    if (d) (Object.keys(sum) as ActivityKey[]).forEach(k => { sum[k] += d[k] ?? 0 })
    return sum
  }, { partnerConversations: 0, pastClientConversations: 0, qualifiedOpportunities: 0, applications: 0, contracts: 0 })
  const conversations = weekly.partnerConversations + weekly.pastClientConversations

  function increment(key: ActivityKey, delta: number) {
    setState(s => ({ ...s, activity: { ...s.activity, [today()]: { ...day, [key]: Math.max(0, day[key] + delta) } } }))
  }
  function updateGoal(key: keyof FocusState['goals'], value: number) { setState(s => ({ ...s, goals: { ...s.goals, [key]: value } })) }

  if (!loaded) return <Card className="p-8 text-center font-mono text-sm text-muted-foreground">Loading your command center…</Card>

  const metricCards = [
    ['Net income MTD', props.netIncomeMTD, state.goals.monthlyIncome, 'currency'],
    ['Funded volume MTD', props.fundedVolumeMTD, state.goals.monthlyVolume, 'compact'],
    ['Closings MTD', props.fundedMTD, state.goals.monthlyClosings, 'number'],
    ['Pipeline commission', props.pipelineNet, state.goals.monthlyIncome, 'currency'],
  ] as const

  return <div className="space-y-4">
    <Card className="border-l-[3px] border-l-amber-500 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-amber-400"><Target className="size-4" /> $100K Monthly Mission</div><p className="mt-1 text-sm text-muted-foreground">Close high-value mortgage opportunities. Protect selling time. Track the few numbers that create revenue.</p></div><span className={`flex items-center gap-1 text-[11px] font-mono ${saved ? 'text-green-400' : 'text-amber-400'}`}><Check className="size-3" /> {saved ? 'Saved' : 'Saving…'}</span></div></Card>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{metricCards.map(([label, value, goal, mode]) => <Card key={label} className="border-l-[3px] border-l-amber-500 p-3"><div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</div><div className="mt-1 text-xl font-mono font-bold text-foreground">{mode === 'currency' ? fmtCurrency(value) : mode === 'compact' ? fmtK(value) : value}</div><div className="mt-0.5 text-[10px] font-mono text-muted-foreground">Goal {mode === 'currency' ? fmtCurrency(goal) : mode === 'compact' ? fmtK(goal) : goal}</div><Progress value={value} goal={goal} /></Card>)}</div>
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
      <Card className="xl:col-span-3 overflow-hidden"><div className="border-b border-input px-4 py-3"><h2 className="text-xs font-mono font-bold uppercase tracking-widest text-foreground">Today’s revenue actions</h2><p className="text-[11px] text-muted-foreground">Log real conversations and advances—not emails sent.</p></div><div className="grid grid-cols-1 gap-px bg-input sm:grid-cols-2">{([
        ['partnerConversations', 'Referral partner conversations', 'Weekly goal contributes to 50 conversations'], ['pastClientConversations', 'Past-client conversations', 'Personal calls, texts, or videos'], ['qualifiedOpportunities', 'New qualified opportunities', 'Real borrower need + plausible timing'], ['applications', 'Completed applications', `Weekly target ${state.goals.weeklyApplications}`], ['contracts', 'New contracts', `Weekly target ${state.goals.weeklyContracts}`],
      ] as Array<[ActivityKey,string,string]>).map(([key,label,sub]) => <div key={key} className="flex items-center gap-3 bg-card p-4"><div className="min-w-0 flex-1"><div className="text-sm font-medium text-foreground">{label}</div><div className="text-[10px] font-mono text-muted-foreground">{sub}</div></div><button onClick={() => increment(key,-1)} className="size-7 rounded border border-input text-muted-foreground hover:bg-muted">−</button><span className="w-7 text-center text-lg font-mono font-bold">{day[key]}</span><button onClick={() => increment(key,1)} className="size-7 rounded bg-amber-500 text-zinc-950 hover:bg-amber-400">+</button></div>)}</div></Card>
      <Card className="xl:col-span-2 p-4"><h2 className="text-xs font-mono font-bold uppercase tracking-widest text-foreground">This week</h2>{[
        ['Partner + client conversations', conversations, state.goals.weeklyConversations], ['Qualified opportunities', weekly.qualifiedOpportunities, 10], ['Applications', weekly.applications, state.goals.weeklyApplications], ['Contracts', weekly.contracts, state.goals.weeklyContracts],
      ].map(([label,value,goal]) => <div key={String(label)} className="mt-4"><div className="flex justify-between text-xs"><span className="text-muted-foreground">{label}</span><span className="font-mono text-foreground">{value} / {goal}</span></div><Progress value={Number(value)} goal={Number(goal)} color={Number(value) >= Number(goal) ? '#4ADE80' : '#D4AF37'} /></div>)}</Card>
    </div>
    <Card className="p-4"><h2 className="text-xs font-mono font-bold uppercase tracking-widest text-foreground">Targets</h2><div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-6">{([
      ['monthlyIncome','Monthly income'],['monthlyVolume','Monthly volume'],['monthlyClosings','Monthly closings'],['weeklyConversations','Weekly conversations'],['weeklyApplications','Weekly applications'],['weeklyContracts','Weekly contracts'],
    ] as Array<[keyof FocusState['goals'],string]>).map(([key,label])=><label key={key}><span className="text-[10px] font-mono uppercase text-muted-foreground">{label}</span><input type="number" value={state.goals[key]} onChange={e=>updateGoal(key,Number(e.target.value))} className="mt-1 w-full rounded border border-input bg-muted px-2 py-2 text-xs font-mono focus:border-amber-500 focus:outline-none"/></label>)}</div></Card>
  </div>
}
