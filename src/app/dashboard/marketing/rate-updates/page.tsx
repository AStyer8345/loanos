'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// ── Types ─────────────────────────────────────────────────────────────────────

type RateUpdate = {
  id: string
  date: string
  rate_30yr: string
  rate_15yr: string
  rate_arm: string
  audience: string
  notes: string
  channel: string
}

type MCCRateState = {
  last: Record<string, string>
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function uid()    { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7) }
function isoDate(){ return new Date().toISOString().slice(0, 10) }
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
}
function daysSince(iso: string | undefined | null): number | null {
  if (!iso) return null
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
}

// ── Shared UI ─────────────────────────────────────────────────────────────────

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`border rounded-sm p-4 ${className}`}
      style={{ background: '#18181b', borderColor: '#3f3f46' }}
    >
      {children}
    </div>
  )
}

function Input({ value, onChange, placeholder, type = 'text' }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="bg-transparent border-b font-mono text-xs px-1 py-0.5 outline-none w-full"
      style={{ borderColor: '#3f3f46', color: '#f4f4f5' }}
    />
  )
}

function Btn({ onClick, children, variant = 'default', disabled = false }: {
  onClick: () => void; children: React.ReactNode
  variant?: 'default' | 'gold' | 'danger'
  disabled?: boolean
}) {
  const colors = {
    default: { color: '#71717a', border: '#3f3f46' },
    gold:    { color: '#C9A84C', border: '#C9A84C' },
    danger:  { color: '#E05252', border: '#E05252' },
  }[variant]
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="font-mono text-[10px] tracking-widest border px-2 py-1 transition-opacity hover:opacity-70 disabled:opacity-40"
      style={{ color: colors.color, borderColor: colors.border }}
    >
      {children}
    </button>
  )
}

// ── Local storage key for rate updates ────────────────────────────────────────

const LS_KEY = 'loanos_rate_updates'

function loadUpdates(): RateUpdate[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]') } catch { return [] }
}

function saveUpdates(updates: RateUpdate[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(LS_KEY, JSON.stringify(updates))
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RateUpdatesPage() {
  const supabase  = useMemo(() => createClient(), [])
  const [userId, setUserId]   = useState<string | null>(null)
  const [mccLast, setMccLast] = useState<Record<string, string>>({})
  const [updates, setUpdates] = useState<RateUpdate[]>([])
  const [loading, setLoading] = useState(true)

  const [showAdd, setShowAdd] = useState(false)
  const BLANK = { date: isoDate(), rate_30yr: '', rate_15yr: '', rate_arm: '', audience: 'Realtors', notes: '', channel: 'Email + Text' }
  const [form, setForm] = useState({ ...BLANK })

  // Load
  useEffect(() => {
    setUpdates(loadUpdates())
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLoading(false); return }
      setUserId(user.id)
      supabase
        .from('mcc_state')
        .select('value')
        .eq('user_id', user.id)
        .eq('key', 'mcc')
        .single()
        .then(({ data }) => {
          if (data?.value) {
            const v = data.value as Record<string, unknown>
            setMccLast((v.last as Record<string, string>) ?? {})
          }
          setLoading(false)
        })
    })
  }, [supabase])

  async function addUpdate() {
    if (!form.rate_30yr.trim()) { alert('30yr rate is required.'); return }
    const update: RateUpdate = { ...form, id: uid() }
    const next = [update, ...updates]
    setUpdates(next)
    saveUpdates(next)
    setShowAdd(false)
    setForm({ ...BLANK })

    // Update last['rate-update'] in mcc_state
    if (userId) {
      const { data } = await supabase
        .from('mcc_state')
        .select('value')
        .eq('user_id', userId)
        .eq('key', 'mcc')
        .single()
      const current = (data?.value as Record<string, unknown>) ?? {}
      const now = new Date().toISOString()
      const updatedLast = { ...((current.last as Record<string, string>) ?? {}), 'rate-update': now }
      setMccLast(updatedLast)
      await supabase
        .from('mcc_state')
        .upsert(
          { user_id: userId, key: 'mcc', value: { ...current, last: updatedLast } },
          { onConflict: 'user_id,key' }
        )
    }
  }

  function deleteUpdate(id: string) {
    const next = updates.filter(u => u.id !== id)
    setUpdates(next)
    saveUpdates(next)
  }

  const lastSent = mccLast['rate-update']
  const daysSinceLast = daysSince(lastSent)
  const statusColor = daysSinceLast === null ? '#E05252' : daysSinceLast <= 7 ? '#4CAF82' : daysSinceLast <= 10 ? '#C9A84C' : '#E05252'

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-xs font-mono" style={{ color: '#71717a' }}>LOADING…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-4 lg:p-6">

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-mono text-lg font-bold" style={{ color: '#f4f4f5' }}>Rate Updates</h1>
        <p className="font-mono text-[10px] mt-0.5" style={{ color: '#71717a' }}>
          Log weekly rate communications to realtors and borrowers
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        {[
          { label: 'LAST SENT',    value: lastSent ? fmtDate(lastSent) : '—', color: statusColor },
          { label: 'DAYS AGO',     value: daysSinceLast !== null ? `${daysSinceLast}d` : '—', color: statusColor },
          { label: 'TOTAL LOGGED', value: updates.length, color: '#f4f4f5' },
          { label: 'THIS MONTH',   value: updates.filter(u => {
            const d = new Date(u.date)
            const now = new Date()
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
          }).length, color: '#f4f4f5' },
        ].map((st, i) => (
          <div key={i} className="border rounded-sm px-4 py-3" style={{ background: '#18181b', borderColor: '#3f3f46' }}>
            <div className="font-mono text-[9px] tracking-widest mb-1" style={{ color: '#71717a' }}>{st.label}</div>
            <div className="font-mono text-xl font-semibold" style={{ color: st.color as string }}>{st.value}</div>
          </div>
        ))}
      </div>

      {/* Cadence health */}
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-sm border mb-4 font-mono text-xs"
        style={{
          borderColor: statusColor + '44',
          background:  statusColor === '#4CAF82' ? 'rgba(76,175,130,0.06)' : 'rgba(201,168,76,0.06)',
          color:       statusColor,
        }}
      >
        <span className="text-[9px] tracking-widest">CADENCE STATUS</span>
        <span>
          {daysSinceLast === null
            ? 'Never sent — start logging rate updates'
            : daysSinceLast === 0
            ? '✓ Sent today'
            : daysSinceLast <= 7
            ? `✓ On track — sent ${daysSinceLast}d ago`
            : `⚠ ${daysSinceLast}d since last update — weekly cadence recommended`
          }
        </span>
      </div>

      {/* Log button */}
      <div className="flex justify-end mb-3">
        <Btn onClick={() => setShowAdd(v => !v)} variant="gold">+ LOG RATE UPDATE</Btn>
      </div>

      {/* Add form */}
      {showAdd && (
        <Card className="mb-4">
          <div className="font-mono text-[10px] tracking-widest mb-3" style={{ color: '#71717a' }}>LOG RATE UPDATE</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
            <div>
              <div className="font-mono text-[9px] mb-1" style={{ color: '#71717a' }}>DATE</div>
              <Input type="date" value={form.date} onChange={v => setForm(p => ({ ...p, date: v }))} />
            </div>
            <div>
              <div className="font-mono text-[9px] mb-1" style={{ color: '#71717a' }}>30-YR FIXED *</div>
              <Input value={form.rate_30yr} onChange={v => setForm(p => ({ ...p, rate_30yr: v }))} placeholder="6.875%" />
            </div>
            <div>
              <div className="font-mono text-[9px] mb-1" style={{ color: '#71717a' }}>15-YR FIXED</div>
              <Input value={form.rate_15yr} onChange={v => setForm(p => ({ ...p, rate_15yr: v }))} placeholder="6.125%" />
            </div>
            <div>
              <div className="font-mono text-[9px] mb-1" style={{ color: '#71717a' }}>ARM</div>
              <Input value={form.rate_arm} onChange={v => setForm(p => ({ ...p, rate_arm: v }))} placeholder="5.875% (5/1)" />
            </div>
            <div>
              <div className="font-mono text-[9px] mb-1" style={{ color: '#71717a' }}>AUDIENCE</div>
              <select
                value={form.audience}
                onChange={e => setForm(p => ({ ...p, audience: e.target.value }))}
                className="bg-transparent border-b font-mono text-xs px-1 py-0.5 outline-none w-full"
                style={{ borderColor: '#3f3f46', color: '#f4f4f5' }}
              >
                {['Realtors', 'Borrowers', 'Both'].map(a => (
                  <option key={a} value={a} style={{ background: '#1a1a1a' }}>{a}</option>
                ))}
              </select>
            </div>
            <div>
              <div className="font-mono text-[9px] mb-1" style={{ color: '#71717a' }}>CHANNEL</div>
              <select
                value={form.channel}
                onChange={e => setForm(p => ({ ...p, channel: e.target.value }))}
                className="bg-transparent border-b font-mono text-xs px-1 py-0.5 outline-none w-full"
                style={{ borderColor: '#3f3f46', color: '#f4f4f5' }}
              >
                {['Email + Text', 'Email', 'Text', 'Mailchimp', 'Website'].map(c => (
                  <option key={c} value={c} style={{ background: '#1a1a1a' }}>{c}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2 md:col-span-3">
              <div className="font-mono text-[9px] mb-1" style={{ color: '#71717a' }}>NOTES (optional)</div>
              <Input value={form.notes} onChange={v => setForm(p => ({ ...p, notes: v }))} placeholder="Market context, lock advice, etc." />
            </div>
          </div>
          <div className="flex gap-2">
            <Btn onClick={addUpdate} variant="gold">SAVE</Btn>
            <Btn onClick={() => setShowAdd(false)}>CANCEL</Btn>
          </div>
        </Card>
      )}

      {/* History table */}
      <div className="border rounded-sm overflow-hidden" style={{ borderColor: '#3f3f46' }}>
        <div
          className="grid font-mono text-[9px] tracking-widest px-3 py-2"
          style={{
            gridTemplateColumns: '80px 80px 80px 80px 100px 1fr 24px',
            background: '#09090b', color: '#71717a', borderBottom: '1px solid #3f3f46',
          }}
        >
          <span>DATE</span>
          <span>30-YR</span>
          <span>15-YR</span>
          <span>ARM</span>
          <span>AUDIENCE</span>
          <span>NOTES</span>
          <span />
        </div>

        {updates.length === 0 && (
          <div className="font-mono text-[10px] px-3 py-4" style={{ color: '#71717a' }}>
            No rate updates logged yet.
          </div>
        )}

        {updates.map(u => (
          <div
            key={u.id}
            className="grid items-center px-3 py-2.5 border-b font-mono"
            style={{
              gridTemplateColumns: '80px 80px 80px 80px 100px 1fr 24px',
              borderColor: '#3f3f46', background: '#18181b',
            }}
          >
            <span className="text-[9px]" style={{ color: '#71717a' }}>{fmtDate(u.date)}</span>
            <span className="text-[10px]" style={{ color: '#C9A84C' }}>{u.rate_30yr || '—'}</span>
            <span className="text-[10px]" style={{ color: '#f4f4f5' }}>{u.rate_15yr || '—'}</span>
            <span className="text-[10px]" style={{ color: '#f4f4f5' }}>{u.rate_arm  || '—'}</span>
            <span className="text-[9px]"  style={{ color: '#71717a' }}>{u.audience}</span>
            <span className="text-[9px]"  style={{ color: '#71717a' }}>{u.notes || '—'}</span>
            <button
              onClick={() => deleteUpdate(u.id)}
              className="font-mono text-[9px] hover:opacity-70 transition-opacity"
              style={{ color: '#E05252' }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
