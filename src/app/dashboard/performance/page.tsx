'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, Legend,
} from 'recharts'
import { Pencil, Trash2, X, Plus } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────
type Loan = { id: number; month: string; name: string; amount: number; gross: number; compRate: number; date: string }
type OIE  = Record<string, { income: number; expenses: number }>
type Tab  = 'dashboard' | 'loans' | 'expenses'

// ── Constants ──────────────────────────────────────────────────────────────
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const SHORT: Record<string,string> = {January:'Jan',February:'Feb',March:'Mar',April:'Apr',May:'May',June:'Jun',July:'Jul',August:'Aug',September:'Sep',October:'Oct',November:'Nov',December:'Dec'}
const TRUST_START = 1611
// localStorage key kept for one-time migration of existing data
const STORAGE_KEY = 'loanDashboard2026'

// Seed data — shown only when no Supabase data exists (new user first login)
const SEED_LOANS: Loan[] = [
  {id:1,month:'January',name:'Anderson',amount:313000,gross:3000,compRate:1.2,date:'2026-01-13'},
  {id:2,month:'January',name:'Martinez',amount:320000,gross:6080,compRate:1,date:'2026-01-16'},
  {id:3,month:'January',name:'Thompson',amount:501500,gross:10000,compRate:1,date:''},
  {id:4,month:'January',name:'Jackson',amount:396000,gross:9900,compRate:1,date:''},
  {id:5,month:'January',name:'Williams',amount:832750,gross:8992,compRate:1,date:'2026-01-01'},
  {id:6,month:'February',name:'Davis',amount:150000,gross:3500,compRate:1,date:''},
  {id:7,month:'February',name:'Miller',amount:400610,gross:4400,compRate:1,date:''},
  {id:8,month:'February',name:'Wilson',amount:451000,gross:4383,compRate:1,date:''},
  {id:9,month:'February',name:'Moore',amount:189000,gross:4300,compRate:1,date:''},
  {id:10,month:'February',name:'Taylor',amount:380000,gross:4297,compRate:1,date:''},
  {id:11,month:'February',name:'Brown',amount:318750,gross:5976,compRate:1,date:''},
]

function seedOIE(): OIE {
  const o: OIE = {}
  MONTHS.forEach(m => { o[m] = { income: m==='January'?1465:0, expenses: m==='January'?5692:0 } })
  return o
}

// ── Formatters ─────────────────────────────────────────────────────────────
const fmt    = (n: number) => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n)
const fmtK   = (n: number) => { if(Math.abs(n)>=1e6) return `$${(n/1e6).toFixed(2)}M`; if(Math.abs(n)>=1e3) return `$${(n/1e3).toFixed(1)}K`; return fmt(n) }
const fmtPct = (n: number) => (n*100).toFixed(2)+'%'
const lComp   = (l: Loan) => l.amount*(l.compRate/100)
const lPnl    = (l: Loan) => l.gross - lComp(l)
const lMargin = (l: Loan) => l.amount ? l.gross/l.amount : 0

const pnlCls  = (n: number) => n >= 0 ? 'text-green-400' : 'text-red-400'

// ── Tooltip ────────────────────────────────────────────────────────────────
interface TTProps { active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string }

const BarTT = ({ active, payload, label }: TTProps) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-muted border border-input rounded px-3 py-2 text-xs font-mono space-y-0.5">
      <div className="text-foreground/80 mb-1">{label}</div>
      {payload.map(p => <div key={p.name} style={{color:'#a1a1aa'}}>{p.name}: <span className="text-foreground">{fmt(p.value)}</span></div>)}
    </div>
  )
}

const LineTT = ({ active, payload, label }: TTProps) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-muted border border-input rounded px-3 py-2 text-xs font-mono">
      <div className="text-foreground/80 mb-1">{label}</div>
      <div className="text-blue-400">{fmt(payload[0].value)}</div>
    </div>
  )
}

// ── Component ──────────────────────────────────────────────────────────────
export default function PerformancePage() {
  const [loans, setLoans]           = useState<Loan[]>([])
  const [oie, setOie]               = useState<OIE>(seedOIE())
  const [nextId, setNextId]         = useState(12)
  const [tab, setTab]               = useState<Tab>('dashboard')
  const [editingId, setEditingId]   = useState<number|null>(null)
  const [confirmDel, setConfirmDel] = useState<number|null>(null)
  const [showForm, setShowForm]     = useState(false)
  const [loaded, setLoaded]         = useState(false)
  const [form, setForm]             = useState({ month:'January', name:'', amount:'', gross:'', compRate:'1', date:'' })

  // Load from Supabase (with one-time migration from localStorage)
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/performance')
        if (res.ok) {
          const { data } = await res.json()
          if (data) {
            setLoans(data.loans ?? []); setOie(data.oie ?? seedOIE()); setNextId(data.nextId || 12)
            setLoaded(true)
            return
          }
        }
      } catch { /* fall through to localStorage migration */ }

      // One-time migration: if Supabase had no data, check localStorage
      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
          const d = JSON.parse(saved)
          setLoans(d.loans ?? []); setOie(d.oie ?? seedOIE()); setNextId(d.nextId || 12)
        } else {
          setLoans([...SEED_LOANS])
        }
      } catch { setLoans([...SEED_LOANS]) }
      setLoaded(true)
    }
    load()
  }, [])

  // Save to Supabase
  useEffect(() => {
    if (!loaded) return
    const payload = { loans, oie, nextId }
    fetch('/api/performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => null)
  }, [loans, oie, nextId, loaded])

  // ── Calculations ──────────────────────────────────────────────────────────
  const monthly = useMemo(() => MONTHS.map(m => {
    const ml = loans.filter(l => l.month === m)
    const vol = ml.reduce((s,l)=>s+l.amount,0)
    const gr  = ml.reduce((s,l)=>s+l.gross,0)
    const cp  = ml.reduce((s,l)=>s+lComp(l),0)
    const pl  = gr - cp
    const oi  = oie[m]?.income || 0
    const ex  = oie[m]?.expenses || 0
    return { month:SHORT[m], full:m, loans:ml.length, volume:vol, gross:gr, comp:cp, pnl:pl, otherInc:oi, expenses:ex, netPnl:pl+oi-ex }
  }), [loans, oie])

  const ytd = useMemo(() => ({
    volume:   monthly.reduce((s,m)=>s+m.volume,0),
    loans:    monthly.reduce((s,m)=>s+m.loans,0),
    gross:    monthly.reduce((s,m)=>s+m.gross,0),
    comp:     monthly.reduce((s,m)=>s+m.comp,0),
    pnl:      monthly.reduce((s,m)=>s+m.pnl,0),
    otherInc: monthly.reduce((s,m)=>s+m.otherInc,0),
    expenses: monthly.reduce((s,m)=>s+m.expenses,0),
    netPnl:   monthly.reduce((s,m)=>s+m.netPnl,0),
  }), [monthly])

  const activeMonthly = useMemo(() => monthly.filter(m => m.loans > 0), [monthly])

  const cumData = useMemo(() => {
    let cum = 0
    return activeMonthly.map(m => { cum += m.netPnl; return { month: m.month, cumNetPnl: cum } })
  }, [activeMonthly])

  const trustBal       = TRUST_START + ytd.netPnl
  const avgLoan        = ytd.loans ? ytd.volume / ytd.loans : 0
  const avgMargin      = ytd.volume ? ytd.gross / ytd.volume : 0
  const activeMonthCnt = activeMonthly.length || 1

  // ── Form ──────────────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditingId(null)
    setForm({ month:'January', name:'', amount:'', gross:'', compRate:'1', date:'' })
    setShowForm(true)
  }

  const openEdit = (id: number) => {
    const l = loans.find(x => x.id === id)
    if (!l) return
    setEditingId(id)
    setForm({ month:l.month, name:l.name, amount:String(l.amount), gross:String(l.gross), compRate:String(l.compRate), date:l.date||'' })
    setShowForm(true)
  }

  const closeForm = () => { setShowForm(false); setEditingId(null) }

  const saveLoan = () => {
    const name = form.name.trim(); const amount = Number(form.amount)||0
    if (!name || !amount) return
    const loan: Loan = { id:editingId||nextId, month:form.month, name, amount, gross:Number(form.gross)||0, compRate:Number(form.compRate)||1, date:form.date||'' }
    if (editingId) {
      setLoans(prev => prev.map(l => l.id===editingId ? loan : l))
    } else {
      setLoans(prev => [...prev, loan]); setNextId(n => n+1)
    }
    closeForm()
  }

  const handleOie = (month: string, field: 'income'|'expenses', val: string) =>
    setOie(prev => ({ ...prev, [month]: { ...prev[month], [field]: Number(val)||0 } }))

  const resetData = () => {
    const input = prompt('Type RESET to confirm. This will erase all data and cannot be undone.')
    if (input?.trim().toUpperCase() !== 'RESET') return
    setLoans([...SEED_LOANS]); setOie(seedOIE()); setNextId(12)
  }

  // form preview
  const fAmt = Number(form.amount)||0; const fGross = Number(form.gross)||0; const fCr = Number(form.compRate)||1
  const preview = fAmt && fGross ? { margin:fmtPct(fGross/fAmt), comp:fmt(fAmt*fCr/100), pl:fGross-fAmt*fCr/100 } : null

  if (!loaded) return <div className="min-h-screen bg-background" />

  return (
    <div className="min-h-screen bg-background p-4 lg:p-6">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-lg font-mono font-bold text-foreground">2026 Loan Performance</h1>
          <p className="text-xs font-mono text-muted-foreground mt-0.5">Year-to-date dashboard</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={resetData}
            className="text-xs font-mono text-muted-foreground border border-input rounded px-3 py-1.5 hover:border-red-600 hover:text-red-500 transition-colors"
          >
            Reset Data
          </button>
          <div className="flex bg-card border border-input rounded-lg p-1 gap-0.5">
            {(['dashboard','loans','expenses'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors ${
                  tab===t ? 'bg-blue-600 text-white' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t==='dashboard' ? 'Dashboard' : t==='loans' ? 'Manage Loans' : 'Income & Expenses'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          DASHBOARD TAB
      ══════════════════════════════════════════════════════════════════ */}
      {tab==='dashboard' && (
        <div className="space-y-4">

          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              { label:'Total Volume',  value:fmtK(ytd.volume),  sub:`${ytd.loans} loans closed`,                                     border:'border-l-blue-500'  },
              { label:'Avg Loan',      value:fmtK(avgLoan),     sub:`${fmtPct(avgMargin)} avg margin`,                              border:'border-l-indigo-500'},
              { label:'Total Gross',   value:fmt(ytd.gross),    sub:`Comp: ${fmt(ytd.comp)}`,                                        border:'border-l-emerald-500'},
              { label:'Net P&L',       value:fmt(ytd.netPnl),   sub:`P&L ${fmt(ytd.pnl)} + Inc ${fmt(ytd.otherInc)} − Exp ${fmt(ytd.expenses)}`, border:ytd.netPnl>=0?'border-l-green-500':'border-l-red-500' },
              { label:'Trust Balance', value:fmt(trustBal),     sub:`Started at ${fmt(TRUST_START)}`,                               border:'border-l-cyan-500'  },
              { label:'Loans Closed',  value:String(ytd.loans), sub:`${(ytd.loans/activeMonthCnt).toFixed(1)} avg/month`,           border:'border-l-violet-500'},
              { label:'Total Comp',    value:fmt(ytd.comp),     sub:ytd.gross ? `${fmtPct(ytd.comp/ytd.gross)} of gross` : '',      border:'border-l-amber-500' },
              { label:'Other Income',  value:fmt(ytd.otherInc), sub:`Expenses: ${fmt(ytd.expenses)}`,                               border:'border-l-rose-500'  },
            ].map(k => (
              <div key={k.label} className={`bg-card border border-input border-l-4 ${k.border} rounded-lg p-3`}>
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">{k.label}</div>
                <div className="text-xl font-mono font-bold text-foreground">{k.value}</div>
                {k.sub && <div className="text-[10px] font-mono text-muted-foreground mt-0.5 leading-tight">{k.sub}</div>}
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-card border border-input rounded-lg p-4">
              <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-4">Monthly Performance</h3>
              {activeMonthly.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={activeMonthly} margin={{top:0,right:0,left:-10,bottom:0}}>
                    <XAxis dataKey="month" tick={{fill:'#71717a',fontSize:10,fontFamily:'monospace'}} axisLine={{stroke:'#3f3f46'}} tickLine={false} />
                    <YAxis tick={{fill:'#71717a',fontSize:10,fontFamily:'monospace'}} axisLine={false} tickLine={false} tickFormatter={v=>fmtK(v)} />
                    <Tooltip content={<BarTT />} cursor={{fill:'rgba(255,255,255,0.03)'}} />
                    <Legend wrapperStyle={{fontSize:10,fontFamily:'monospace'}} />
                    <Bar dataKey="gross"  name="Gross"   fill="#10b981" radius={[3,3,0,0]} />
                    <Bar dataKey="comp"   name="Comp"    fill="#f59e0b" radius={[3,3,0,0]} />
                    <Bar dataKey="netPnl" name="Net P&L" radius={[3,3,0,0]}>
                      {activeMonthly.map((m,i) => <Cell key={i} fill={m.netPnl>=0?'#22c55e':'#ef4444'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-muted-foreground font-mono text-sm">No closed loans yet</div>
              )}
            </div>

            <div className="bg-card border border-input rounded-lg p-4">
              <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-4">Cumulative Net P&L</h3>
              {cumData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={cumData} margin={{top:0,right:0,left:-10,bottom:0}}>
                    <XAxis dataKey="month" tick={{fill:'#71717a',fontSize:10,fontFamily:'monospace'}} axisLine={{stroke:'#3f3f46'}} tickLine={false} />
                    <YAxis tick={{fill:'#71717a',fontSize:10,fontFamily:'monospace'}} axisLine={false} tickLine={false} tickFormatter={v=>fmtK(v)} />
                    <Tooltip content={<LineTT />} cursor={{stroke:'#52525b'}} />
                    <Line type="monotone" dataKey="cumNetPnl" name="Cumulative P&L" stroke="#3b82f6" strokeWidth={2.5} dot={{r:4,fill:'#3b82f6'}} activeDot={{r:5}} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-muted-foreground font-mono text-sm">No data yet</div>
              )}
            </div>
          </div>

          {/* Monthly Breakdown Table */}
          <div className="bg-card border border-input rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-input text-xs font-mono text-muted-foreground uppercase tracking-wider">Monthly Breakdown</div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b border-input">
                    {['Month','Loans','Volume','Gross','Comp','P&L','Other Inc','Expenses','Net P&L'].map(h => (
                      <th key={h} className={`px-3 py-2.5 text-muted-foreground font-medium uppercase tracking-wider text-[10px] ${h==='Month'?'text-left':'text-right'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeMonthly.map((m,i) => (
                    <tr key={m.full} className={i%2 ? 'bg-background/50' : ''}>
                      <td className="px-3 py-2.5 text-foreground font-medium">{m.full}</td>
                      <td className="px-3 py-2.5 text-muted-foreground text-right">{m.loans}</td>
                      <td className="px-3 py-2.5 text-blue-400 text-right">{fmtK(m.volume)}</td>
                      <td className="px-3 py-2.5 text-emerald-400 text-right">{fmt(m.gross)}</td>
                      <td className="px-3 py-2.5 text-amber-400 text-right">{fmt(m.comp)}</td>
                      <td className={`px-3 py-2.5 text-right ${pnlCls(m.pnl)}`}>{fmt(m.pnl)}</td>
                      <td className="px-3 py-2.5 text-muted-foreground text-right">{m.otherInc ? fmt(m.otherInc) : '—'}</td>
                      <td className="px-3 py-2.5 text-muted-foreground text-right">{m.expenses ? fmt(m.expenses) : '—'}</td>
                      <td className={`px-3 py-2.5 text-right font-semibold ${pnlCls(m.netPnl)}`}>{fmt(m.netPnl)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-input bg-muted/50">
                    <td className="px-3 py-2.5 text-foreground font-semibold">YTD Total</td>
                    <td className="px-3 py-2.5 text-foreground text-right font-semibold">{ytd.loans}</td>
                    <td className="px-3 py-2.5 text-blue-400 text-right font-semibold">{fmtK(ytd.volume)}</td>
                    <td className="px-3 py-2.5 text-emerald-400 text-right font-semibold">{fmt(ytd.gross)}</td>
                    <td className="px-3 py-2.5 text-amber-400 text-right font-semibold">{fmt(ytd.comp)}</td>
                    <td className={`px-3 py-2.5 text-right font-semibold ${pnlCls(ytd.pnl)}`}>{fmt(ytd.pnl)}</td>
                    <td className="px-3 py-2.5 text-muted-foreground text-right font-semibold">{fmt(ytd.otherInc)}</td>
                    <td className="px-3 py-2.5 text-muted-foreground text-right font-semibold">{fmt(ytd.expenses)}</td>
                    <td className={`px-3 py-2.5 text-right font-semibold ${pnlCls(ytd.netPnl)}`}>{fmt(ytd.netPnl)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MANAGE LOANS TAB
      ══════════════════════════════════════════════════════════════════ */}
      {tab==='loans' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-mono text-muted-foreground">{loans.length} loans tracked</p>
            <button onClick={openAdd} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-mono font-medium px-3 py-1.5 rounded transition-colors">
              <Plus size={13} /> Add Loan
            </button>
          </div>

          {/* Add / Edit Form */}
          {showForm && (
            <div className="bg-card border border-input rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-mono font-semibold text-foreground">{editingId ? 'Edit Loan' : 'Add New Loan'}</h3>
                <button onClick={closeForm} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Month</label>
                  <select value={form.month} onChange={e=>setForm(p=>({...p,month:e.target.value}))} className="w-full bg-muted border border-input rounded px-2.5 py-1.5 text-foreground text-xs font-mono outline-none focus:border-blue-500">
                    {MONTHS.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Borrower Name</label>
                  <input type="text" placeholder="Last name" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} className="w-full bg-muted border border-input rounded px-2.5 py-1.5 text-foreground text-xs font-mono outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Loan Amount ($)</label>
                  <input type="number" placeholder="300000" value={form.amount} onChange={e=>setForm(p=>({...p,amount:e.target.value}))} className="w-full bg-muted border border-input rounded px-2.5 py-1.5 text-foreground text-xs font-mono outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Gross Income ($)</label>
                  <input type="number" placeholder="5000" value={form.gross} onChange={e=>setForm(p=>({...p,gross:e.target.value}))} className="w-full bg-muted border border-input rounded px-2.5 py-1.5 text-foreground text-xs font-mono outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Comp Rate (%)</label>
                  <input type="number" step="0.1" placeholder="1" value={form.compRate} onChange={e=>setForm(p=>({...p,compRate:e.target.value}))} className="w-full bg-muted border border-input rounded px-2.5 py-1.5 text-foreground text-xs font-mono outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Closing Date</label>
                  <input type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))} className="w-full bg-muted border border-input rounded px-2.5 py-1.5 text-foreground text-xs font-mono outline-none focus:border-blue-500" />
                </div>
              </div>
              {preview && (
                <div className="text-xs font-mono text-muted-foreground mb-3">
                  Margin: <span className="text-blue-400">{preview.margin}</span>
                  {' · '}Comp: <span className="text-amber-400">{preview.comp}</span>
                  {' · '}P&L: <span className={pnlCls(preview.pl)}>{fmt(preview.pl)}</span>
                </div>
              )}
              <button onClick={saveLoan} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono font-medium px-4 py-1.5 rounded transition-colors">
                {editingId ? 'Save Changes' : 'Add Loan'}
              </button>
            </div>
          )}

          {/* Loans Table */}
          <div className="bg-card border border-input rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b border-input">
                    {['Mo','Borrower','Loan Amt','Gross','Margin','Comp','P&L','Date',''].map(h => (
                      <th key={h} className={`px-3 py-2.5 text-muted-foreground font-medium uppercase tracking-wider text-[10px] ${h==='Mo'||h===''?'text-left':'text-right'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...loans].sort((a,b) => MONTHS.indexOf(a.month)-MONTHS.indexOf(b.month) || a.name.localeCompare(b.name)).map((l,i) => (
                    <tr key={l.id} className={i%2 ? 'bg-background/50' : ''}>
                      <td className="px-3 py-2.5 text-muted-foreground">{SHORT[l.month]}</td>
                      <td className="px-3 py-2.5 text-foreground font-medium">{l.name}</td>
                      <td className="px-3 py-2.5 text-blue-400 text-right">{fmt(l.amount)}</td>
                      <td className="px-3 py-2.5 text-emerald-400 text-right">{fmt(l.gross)}</td>
                      <td className="px-3 py-2.5 text-muted-foreground text-right">{fmtPct(lMargin(l))}</td>
                      <td className="px-3 py-2.5 text-amber-400 text-right">{fmt(lComp(l))}</td>
                      <td className={`px-3 py-2.5 text-right font-semibold ${pnlCls(lPnl(l))}`}>{fmt(lPnl(l))}</td>
                      <td className="px-3 py-2.5 text-muted-foreground text-right">{l.date || '—'}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          {confirmDel===l.id ? (
                            <>
                              <button onClick={() => { setLoans(prev=>prev.filter(x=>x.id!==l.id)); setConfirmDel(null) }} className="text-red-400 hover:text-red-300 text-[10px] font-semibold">Delete?</button>
                              <button onClick={() => setConfirmDel(null)} className="text-muted-foreground hover:text-foreground/80"><X size={12} /></button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => openEdit(l.id)} className="text-muted-foreground hover:text-blue-400 transition-colors"><Pencil size={13} /></button>
                              <button onClick={() => setConfirmDel(l.id)} className="text-muted-foreground hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  {(() => {
                    const totVol = loans.reduce((s,l)=>s+l.amount,0)
                    const totGross = loans.reduce((s,l)=>s+l.gross,0)
                    const totComp = loans.reduce((s,l)=>s+lComp(l),0)
                    const totPnl = totGross - totComp
                    return (
                      <tr className="border-t-2 border-input bg-muted/50">
                        <td className="px-3 py-2.5 text-foreground font-semibold" colSpan={2}>{loans.length} Loans</td>
                        <td className="px-3 py-2.5 text-blue-400 text-right font-semibold">{fmt(totVol)}</td>
                        <td className="px-3 py-2.5 text-emerald-400 text-right font-semibold">{fmt(totGross)}</td>
                        <td className="px-3 py-2.5 text-muted-foreground text-right">{totVol ? fmtPct(totGross/totVol) : '—'}</td>
                        <td className="px-3 py-2.5 text-amber-400 text-right font-semibold">{fmt(totComp)}</td>
                        <td className={`px-3 py-2.5 text-right font-semibold ${pnlCls(totPnl)}`}>{fmt(totPnl)}</td>
                        <td colSpan={2} />
                      </tr>
                    )
                  })()}
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          INCOME & EXPENSES TAB
      ══════════════════════════════════════════════════════════════════ */}
      {tab==='expenses' && (
        <div className="space-y-4">
          <p className="text-xs font-mono text-muted-foreground">Edit monthly other income and business expenses. These flow into your Net P&L and Trust Balance.</p>

          <div className="bg-card border border-input rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b border-input">
                    {['Month','Other Income','Expenses','Loan P&L','Net P&L'].map(h => (
                      <th key={h} className={`px-3 py-2.5 text-muted-foreground font-medium uppercase tracking-wider text-[10px] ${h==='Month'?'text-left':'text-right'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {monthly.map((m,i) => (
                    <tr key={m.full} className={i%2 ? 'bg-background/50' : ''}>
                      <td className="px-3 py-2.5 text-foreground font-medium">{m.full}</td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          value={oie[m.full]?.income || ''}
                          onChange={e => handleOie(m.full,'income',e.target.value)}
                          placeholder="0"
                          className="w-28 bg-muted border border-input rounded px-2 py-1 text-emerald-400 text-right outline-none focus:border-emerald-500 text-xs font-mono"
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          value={oie[m.full]?.expenses || ''}
                          onChange={e => handleOie(m.full,'expenses',e.target.value)}
                          placeholder="0"
                          className="w-28 bg-muted border border-input rounded px-2 py-1 text-red-400 text-right outline-none focus:border-red-500 text-xs font-mono"
                        />
                      </td>
                      <td className={`px-3 py-2.5 text-right ${m.pnl ? pnlCls(m.pnl) : 'text-muted-foreground'}`}>{m.pnl ? fmt(m.pnl) : '—'}</td>
                      <td className={`px-3 py-2.5 text-right font-semibold ${m.netPnl ? pnlCls(m.netPnl) : 'text-muted-foreground'}`}>{m.netPnl ? fmt(m.netPnl) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-input bg-muted/50">
                    <td className="px-3 py-2.5 text-foreground font-semibold">YTD Total</td>
                    <td className="px-3 py-2.5 text-emerald-400 text-right font-semibold">{fmt(ytd.otherInc)}</td>
                    <td className="px-3 py-2.5 text-red-400 text-right font-semibold">{fmt(ytd.expenses)}</td>
                    <td className={`px-3 py-2.5 text-right font-semibold ${pnlCls(ytd.pnl)}`}>{fmt(ytd.pnl)}</td>
                    <td className={`px-3 py-2.5 text-right font-semibold ${pnlCls(ytd.netPnl)}`}>{fmt(ytd.netPnl)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Trust Account */}
          <div className="bg-card border border-input rounded-lg p-4">
            <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-4">Trust Account</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label:'Starting Balance', value:fmt(TRUST_START),  color:'text-foreground'  },
                { label:'+ Net P&L (YTD)',  value:fmt(ytd.netPnl),   color:pnlCls(ytd.netPnl) },
                { label:'= Current Balance',value:fmt(trustBal),     color:'text-cyan-400'  },
                { label:'Growth',           value:`${TRUST_START ? ((trustBal/TRUST_START-1)*100).toFixed(0) : 0}%`, color:trustBal>TRUST_START?'text-green-400':'text-red-400' },
              ].map(item => (
                <div key={item.label}>
                  <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">{item.label}</div>
                  <div className={`text-2xl font-mono font-bold ${item.color}`}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
