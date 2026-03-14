'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// ── Supabase ──────────────────────────────────────────────────────────────────

function useSupabase() {
  return useMemo(() => createClient(), [])
}

// ── Types ─────────────────────────────────────────────────────────────────────

type MCCContact = {
  id: string
  first: string; last: string; company: string
  phone: string; email: string
  lastTouch: string | null
  note: string
  callHistory: { date: string; note: string }[]
  calledToday: boolean
}

type LogEntry = {
  id: string; date: string; activity: string; channel: string; notes: string
}

type SocialPost = {
  id: string; platform: string; caption: string; url: string; date: string; notes: string
}

type Newsletter = {
  id: string; audience: string; subject: string; date: string
  mailchimpUrl: string; openRate: string; notes: string
}

type Todo    = { id: string; text: string; created: string }
type DoneTodo = Todo & { done_at: string }

type MCCState = {
  tasks:       Record<string, Record<string, boolean>>
  log:         LogEntry[]
  last:        Record<string, string>
  contacts:    { realtors: MCCContact[]; preapprovals: MCCContact[]; inprocess: MCCContact[]; hotleads: MCCContact[] }
  socialPosts: SocialPost[]
  newsletters: Newsletter[]
  todos:       Todo[]
  doneTodos:   DoneTodo[]
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TCOLS: Record<string, string> = {
  email: '#5B8FD4', call: '#4CAF82', social: '#9B72CF',
  text: '#C9A84C', video: '#E05252', admin: '#5A5754',
}

type DayTask = { id: string; e: string; label: string; type: string; tracker?: string }
type DayDef  = { name: string; focus: string; sub: string; tasks: DayTask[] }

const DAYS: Record<number, DayDef> = {
  1: { name: 'Monday', focus: 'Realtor Nurture', sub: 'Newsletter · Calls · Social', tasks: [
    { id: 'm1', e: '📧', label: 'Send Realtor Newsletter (Mailchimp)',                            type: 'email',  tracker: 'realtor-nl' },
    { id: 'm2', e: '📞', label: 'Realtor call block — 3–5 relationship check-ins',                type: 'call' },
    { id: 'm3', e: '📱', label: 'Post — LinkedIn + Facebook (market insight or rate commentary)', type: 'social', tracker: 'social-post' },
    { id: 'm4', e: '🎥', label: 'Optional: Short video for realtors',                             type: 'video',  tracker: 'video' },
  ]},
  2: { name: 'Tuesday', focus: 'Lead & Past Client', sub: 'Newsletter · Past clients · Social', tasks: [
    { id: 't1', e: '📧', label: 'Send Borrower Newsletter (Mailchimp)',                           type: 'email',  tracker: 'borrower-nl' },
    { id: 't2', e: '📞', label: 'Past client call block — birthday / equity check-in',            type: 'call',   tracker: 'past-client' },
    { id: 't3', e: '📱', label: 'Post — LinkedIn + Facebook (homebuyer tip or testimonial)',      type: 'social', tracker: 'social-post' },
    { id: 't4', e: '📲', label: 'Personal check-in texts — 3–5 warm leads (see Hot Leads)',       type: 'text' },
  ]},
  3: { name: 'Wednesday', focus: 'Loans in Process', sub: 'File updates · No outbound marketing', tasks: [
    { id: 'w1', e: '📞', label: 'Borrower update call — every active file',        type: 'call',  tracker: 'in-process' },
    { id: 'w2', e: '📞', label: "Buyer's agent call — every active file",           type: 'call' },
    { id: 'w3', e: '📞', label: 'Listing agent call — every active file',           type: 'call' },
    { id: 'w4', e: '📋', label: 'Update Salesforce Last Touch on all active files', type: 'admin' },
  ]},
  4: { name: 'Thursday', focus: 'Pre-Approval Pipeline', sub: 'Pre-approvals · Re-engage · Social', tasks: [
    { id: 'h1', e: '📞', label: 'Call every active pre-approval — showings, timeline, offers',      type: 'call',   tracker: 'preapproval' },
    { id: 'h2', e: '📲', label: 'Re-engage text/email to pre-approvals not actively shopping',      type: 'text' },
    { id: 'h3', e: '📱', label: 'Post — LinkedIn + Facebook (first-time buyer or program content)', type: 'social', tracker: 'social-post' },
    { id: 'h4', e: '🎥', label: 'Optional: Video — what happens after your offer is accepted',      type: 'video',  tracker: 'video' },
  ]},
  5: { name: 'Friday', focus: 'Realtor Weekend Push', sub: 'Deal updates · Rate text · Wrap up', tasks: [
    { id: 'f1', e: '📞', label: 'Quick calls to realtors on active deals — weekend heads-up',    type: 'call',   tracker: 'realtor-calls' },
    { id: 'f2', e: '📲', label: 'Rate update text or email to top 10–15 realtor partners',        type: 'text',   tracker: 'rate-update' },
    { id: 'f3', e: '📱', label: 'Post — LinkedIn + Facebook (end of week value-add or personal)', type: 'social', tracker: 'social-post' },
    { id: 'f4', e: '📋', label: 'Log all week activity, prep for Monday',                         type: 'admin' },
  ]},
}

const TRACKERS = [
  { id: 'realtor-nl',    name: 'Realtor Newsletter',  channel: 'Email · Mailchimp',  freq: 7  },
  { id: 'borrower-nl',   name: 'Borrower Newsletter', channel: 'Email · Mailchimp',  freq: 7  },
  { id: 'rate-update',   name: 'Rate Update',         channel: 'Email + Text',       freq: 7  },
  { id: 'social-post',   name: 'Social Post',         channel: 'LinkedIn + Meta',    freq: 2  },
  { id: 'realtor-calls', name: 'Realtor Calls',       channel: 'Phone · Mon + Fri',  freq: 7  },
  { id: 'past-client',   name: 'Past Client Calls',   channel: 'Phone · Tuesday',    freq: 7  },
  { id: 'preapproval',   name: 'Pre-Approval Calls',  channel: 'Phone · Thursday',   freq: 7  },
  { id: 'in-process',    name: 'In-Process Calls',    channel: 'Phone · Wednesday',  freq: 7  },
  { id: 'video',         name: 'Short Video',         channel: 'Video · Mon or Thu', freq: 14 },
]

const LIST_KEYS = ['realtors', 'preapprovals', 'inprocess', 'hotleads'] as const
type ListKey = typeof LIST_KEYS[number]

const LIST_META: Record<ListKey, { label: string }> = {
  realtors:     { label: 'Realtor' },
  preapprovals: { label: 'Pre-Approval' },
  inprocess:    { label: 'Active File' },
  hotleads:     { label: 'Hot Lead' },
}

const TABS = ['TODAY', 'WEEK', 'CONTACTS', 'SOCIAL', 'NEWSLETTERS', 'TRACKER', 'LOG', 'BRAIN DUMP'] as const
type Tab = typeof TABS[number]

const BLANK_STATE: MCCState = {
  tasks: {}, log: [], last: {},
  contacts: { realtors: [], preapprovals: [], inprocess: [], hotleads: [] },
  socialPosts: [], newsletters: [], todos: [], doneTodos: [],
}

const LOG_CHANNELS = ['Email', 'Phone Call', 'LinkedIn', 'Facebook', 'Instagram', 'Text', 'Video', 'Rate Update', 'Task', 'Other']

// ── Helpers ───────────────────────────────────────────────────────────────────

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7) }
function isoDate() { return new Date().toISOString().slice(0, 10) }

function daysSince(iso: string | undefined | null): number | null {
  if (!iso) return null
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
}

function fmtDate(iso: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
}

function statusColor(days: number | null, freq: number): string {
  if (days === null) return '#E05252'
  if (days <= freq) return '#4CAF82'
  if (days <= freq * 1.5) return '#C9A84C'
  return '#E05252'
}

function overdueTrackers(s: MCCState) {
  return TRACKERS.filter(t => {
    const ds = daysSince(s.last[t.id])
    return ds === null || ds > t.freq * 1.5
  })
}

// ── Shared UI atoms ───────────────────────────────────────────────────────────

function Card({ children, className = '', style }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties
}) {
  return (
    <div
      className={`border rounded-sm p-4 ${className}`}
      style={{ background: 'var(--surface)', borderColor: 'var(--border)', ...style }}
    >
      {children}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono text-[10px] tracking-widest mb-3" style={{ color: 'var(--muted)' }}>
      {children}
    </div>
  )
}

function Input({ value, onChange, placeholder, type = 'text', className = '' }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; className?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={`bg-transparent border-b font-mono text-xs px-1 py-0.5 outline-none w-full ${className}`}
      style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
    />
  )
}

function Btn({ onClick, children, variant = 'default', disabled = false, className = '' }: {
  onClick: () => void; children: React.ReactNode
  variant?: 'default' | 'gold' | 'danger' | 'green'
  disabled?: boolean; className?: string
}) {
  const colors = {
    default: { color: 'var(--muted)', border: 'var(--border)' },
    gold:    { color: 'var(--gold)',  border: 'var(--gold)' },
    danger:  { color: '#E05252',      border: '#E05252' },
    green:   { color: '#4CAF82',      border: '#4CAF82' },
  }[variant]
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`font-mono text-[10px] tracking-widest border px-2 py-1 transition-opacity hover:opacity-70 disabled:opacity-40 ${className}`}
      style={{ color: colors.color, borderColor: colors.border }}
    >
      {children}
    </button>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────

function Modal({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode
}) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-md rounded-sm border p-6 flex flex-col gap-4"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center justify-between">
          <div className="font-mono text-sm tracking-widest" style={{ color: 'var(--gold)' }}>{title}</div>
          <button onClick={onClose} className="font-mono text-[10px] hover:opacity-70" style={{ color: 'var(--muted)' }}>ESC</button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ── Log Modal (shared) ────────────────────────────────────────────────────────

function LogModal({ open, trackerId, onSave, onClose }: {
  open: boolean; trackerId: string | null
  onSave: (activity: string, channel: string, notes: string, date: string) => void
  onClose: () => void
}) {
  const tracker = trackerId ? TRACKERS.find(t => t.id === trackerId) : null
  const [activity, setActivity] = useState('')
  const [channel, setChannel]   = useState('Email')
  const [notes, setNotes]       = useState('')
  const [date, setDate]         = useState(isoDate())

  useEffect(() => {
    if (open) {
      setActivity(tracker?.name ?? '')
      setChannel('Email')
      setNotes('')
      setDate(isoDate())
    }
  }, [open, trackerId]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Modal open={open} onClose={onClose} title={tracker ? `LOG — ${tracker.name.toUpperCase()}` : 'LOG ACTIVITY'}>
      <div className="flex flex-col gap-3">
        <div>
          <div className="font-mono text-[9px] mb-1" style={{ color: 'var(--muted)' }}>ACTIVITY</div>
          <Input value={activity} onChange={setActivity} placeholder="What did you do?" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="font-mono text-[9px] mb-1" style={{ color: 'var(--muted)' }}>CHANNEL</div>
            <select
              value={channel}
              onChange={e => setChannel(e.target.value)}
              className="bg-transparent border-b font-mono text-xs px-1 py-0.5 outline-none w-full"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            >
              {LOG_CHANNELS.map(c => <option key={c} value={c} style={{ background: '#1a1a1a' }}>{c}</option>)}
            </select>
          </div>
          <div>
            <div className="font-mono text-[9px] mb-1" style={{ color: 'var(--muted)' }}>DATE</div>
            <Input type="date" value={date} onChange={setDate} />
          </div>
        </div>
        <div>
          <div className="font-mono text-[9px] mb-1" style={{ color: 'var(--muted)' }}>NOTES (optional)</div>
          <Input value={notes} onChange={setNotes} placeholder="Any context…" />
        </div>
        <div className="flex gap-2">
          <Btn
            onClick={() => {
              if (activity.trim()) { onSave(activity.trim(), channel, notes.trim(), date); onClose() }
            }}
            variant="gold"
          >
            LOG IT
          </Btn>
          <Btn onClick={onClose}>CANCEL</Btn>
        </div>
      </div>
    </Modal>
  )
}

// ── Stat Row ──────────────────────────────────────────────────────────────────

function StatRow({ todayDow, todayTasks, s, isWeekend }: {
  todayDow: number; todayTasks: Record<string, boolean>; s: MCCState; isWeekend: boolean
}) {
  const day     = DAYS[todayDow]
  const done    = day.tasks.filter(t => todayTasks[t.id]).length
  const total   = day.tasks.length
  const loans   = s.contacts.inprocess.length
  const overdue = overdueTrackers(s)

  const stats = [
    {
      label: "TODAY'S FOCUS",
      value: isWeekend ? 'Weekend' : day.focus,
      sub:   isWeekend ? 'Recharge' : day.sub,
      color: 'var(--gold)',
    },
    {
      label: 'TASKS COMPLETE',
      value: `${done}/${total}`,
      sub:   done === total && total > 0 ? 'All done ✓' : `${total - done} remaining`,
      color: done === total && total > 0 ? '#4CAF82' : 'var(--text)',
    },
    {
      label: 'LOANS IN PROCESS',
      value: loans || '—',
      sub:   loans ? 'active files' : 'add in Contacts',
      color: 'var(--text)',
    },
    {
      label: 'OVERDUE ITEMS',
      value: overdue.length,
      sub:   overdue.length > 0 ? 'Need attention' : 'All on track',
      color: overdue.length > 0 ? '#E05252' : '#4CAF82',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {stats.map((st, i) => (
        <div
          key={i}
          className="border rounded-sm px-4 py-3"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="font-mono text-[9px] tracking-widest mb-1" style={{ color: 'var(--muted)' }}>
            {st.label}
          </div>
          <div className="font-mono text-2xl font-semibold leading-none" style={{ color: st.color as string }}>
            {st.value}
          </div>
          <div className="font-mono text-[10px] mt-1 leading-snug" style={{ color: 'var(--muted)' }}>{st.sub}</div>
        </div>
      ))}
    </div>
  )
}

// ── Overdue Banner ────────────────────────────────────────────────────────────

function OverdueBanner({ s, onLog }: { s: MCCState; onLog: (trackerId: string) => void }) {
  const overdue = overdueTrackers(s)
  if (!overdue.length) return null
  return (
    <div
      className="flex flex-wrap gap-1.5 items-center px-4 py-2.5 rounded-sm border"
      style={{ background: 'rgba(224,82,82,0.08)', borderColor: 'rgba(224,82,82,0.3)' }}
    >
      <span className="font-mono text-[9px] tracking-widest mr-2" style={{ color: '#E05252' }}>
        ⚠ OVERDUE
      </span>
      {overdue.map(t => {
        const ds    = daysSince(s.last[t.id])
        const label = ds === null ? 'Never' : `${ds}d`
        return (
          <button
            key={t.id}
            onClick={() => onLog(t.id)}
            className="font-mono text-[9px] px-2 py-0.5 rounded-full border hover:opacity-70 transition-opacity"
            style={{ background: 'rgba(224,82,82,0.15)', borderColor: 'rgba(224,82,82,0.4)', color: '#E05252' }}
          >
            {t.name} — {label}
          </button>
        )
      })}
    </div>
  )
}

// ── TODAY tab ─────────────────────────────────────────────────────────────────

function TodayTab({
  todayDow, todayTasks, toggle, s, save, onLogTracker,
}: {
  todayDow: number
  todayTasks: Record<string, boolean>
  toggle: (taskId: string, tracker?: string) => void
  s: MCCState
  save: (next: MCCState) => void
  onLogTracker: (trackerId: string) => void
}) {
  const day  = DAYS[todayDow]
  const done = day.tasks.filter(t => todayTasks[t.id]).length
  const [dumpText, setDumpText] = useState('')

  function addTodo() {
    if (!dumpText.trim()) return
    const todo: Todo = { id: uid(), text: dumpText.trim(), created: isoDate() }
    save({ ...s, todos: [todo, ...s.todos] })
    setDumpText('')
  }

  function completeTodo(id: string) {
    const todo = s.todos.find(t => t.id === id)
    if (!todo) return
    const doneTodo: DoneTodo = { ...todo, done_at: isoDate() }
    const logEntry: LogEntry = { id: uid(), date: new Date().toISOString(), activity: todo.text, channel: 'Task', notes: '' }
    save({
      ...s,
      todos: s.todos.filter(t => t.id !== id),
      doneTodos: [doneTodo, ...s.doneTodos],
      log: [...s.log, logEntry],
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Main task card */}
      <div className="lg:col-span-2">
        <Card>
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className="font-mono text-[9px] tracking-widest px-2 py-0.5 rounded-sm"
                  style={{ background: 'rgba(201,168,76,0.15)', color: 'var(--gold)' }}
                >
                  {day.name.toUpperCase()}
                </span>
              </div>
              <div className="font-display tracking-widest text-base" style={{ color: 'var(--gold)' }}>
                {day.focus} Day
              </div>
              <div className="font-mono text-[10px] mt-0.5" style={{ color: 'var(--muted)' }}>{day.sub}</div>
            </div>
            <div className="text-right">
              <div
                className="font-mono text-2xl font-semibold"
                style={{ color: done === day.tasks.length ? '#4CAF82' : 'var(--gold)' }}
              >
                {done}/{day.tasks.length}
              </div>
              <div className="font-mono text-[9px] tracking-widest" style={{ color: 'var(--muted)' }}>COMPLETE</div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {day.tasks.map(task => {
              const checked = !!todayTasks[task.id]
              return (
                <div
                  key={task.id}
                  onClick={() => toggle(task.id, task.tracker)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-sm cursor-pointer transition-colors"
                  style={{
                    background: checked ? 'rgba(201,168,76,0.08)' : 'var(--bg)',
                    border: `1px solid ${checked ? 'rgba(201,168,76,0.3)' : 'var(--border)'}`,
                  }}
                >
                  <div
                    className="w-4 h-4 border flex-shrink-0 flex items-center justify-center"
                    style={{ borderColor: checked ? 'var(--gold)' : 'var(--border)' }}
                  >
                    {checked && <div className="w-2 h-2" style={{ background: 'var(--gold)' }} />}
                  </div>
                  <span className="text-sm">{task.e}</span>
                  <span
                    className="font-mono text-xs flex-1 leading-snug"
                    style={{ color: checked ? 'var(--muted)' : 'var(--text)', textDecoration: checked ? 'line-through' : 'none' }}
                  >
                    {task.label}
                  </span>
                  {task.tracker && !checked && (
                    <button
                      onClick={e => { e.stopPropagation(); onLogTracker(task.tracker!) }}
                      className="font-mono text-[9px] px-1.5 py-0.5 border rounded-sm hover:opacity-70 transition-opacity flex-shrink-0"
                      style={{ color: 'var(--gold)', borderColor: 'rgba(201,168,76,0.4)', background: 'rgba(201,168,76,0.08)' }}
                    >
                      Log ↗
                    </button>
                  )}
                  <span
                    className="font-mono text-[9px] px-1.5 py-0.5 rounded-sm flex-shrink-0"
                    style={{ background: TCOLS[task.type] + '22', color: TCOLS[task.type] }}
                  >
                    {task.type.toUpperCase()}
                  </span>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      {/* Brain Dump sidebar */}
      <div>
        <Card>
          <SectionLabel>BRAIN DUMP</SectionLabel>
          <div className="flex gap-2 mb-3">
            <input
              value={dumpText}
              onChange={e => setDumpText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTodo()}
              placeholder="Capture anything…"
              className="flex-1 bg-transparent border-b font-mono text-xs px-1 py-0.5 outline-none"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            />
            <Btn onClick={addTodo} variant="gold">ADD</Btn>
          </div>
          <div className="flex flex-col gap-1.5">
            {s.todos.length === 0 && (
              <div className="font-mono text-[10px]" style={{ color: 'var(--muted)' }}>Nothing here. You&apos;re clear.</div>
            )}
            {s.todos.slice(0, 12).map(t => (
              <div key={t.id} className="flex items-center gap-2 py-1.5 border-b" style={{ borderColor: 'var(--border)' }}>
                <button
                  onClick={() => completeTodo(t.id)}
                  className="w-3.5 h-3.5 border flex-shrink-0 hover:opacity-70 transition-opacity"
                  style={{ borderColor: 'var(--border)' }}
                />
                <span className="font-mono text-[10px] flex-1 leading-snug" style={{ color: 'var(--text)' }}>{t.text}</span>
              </div>
            ))}
            {s.todos.length > 12 && (
              <div className="font-mono text-[9px]" style={{ color: 'var(--muted)' }}>
                +{s.todos.length - 12} more — see Brain Dump tab
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

// ── WEEK tab ──────────────────────────────────────────────────────────────────

function WeekTab({ s, todayKey }: { s: MCCState; todayKey: string }) {
  const todayDate  = new Date()
  const dow        = todayDate.getDay()
  const mondayDate = new Date(todayDate)
  mondayDate.setDate(todayDate.getDate() - (dow === 0 ? 6 : dow - 1))

  const weekDays = [1, 2, 3, 4, 5].map(d => {
    const date  = new Date(mondayDate)
    date.setDate(mondayDate.getDate() + (d - 1))
    const key   = date.toISOString().slice(0, 10)
    const tasks = s.tasks[key] ?? {}
    const day   = DAYS[d]
    const done  = day.tasks.filter(t => tasks[t.id]).length
    return { d, key, date, day, tasks, done }
  })

  return (
    <div className="max-w-4xl">
      <SectionLabel>WEEK AT A GLANCE</SectionLabel>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
        {weekDays.map(({ d, key, date, day, done }) => {
          const isToday = key === todayKey
          const pct     = Math.round((done / day.tasks.length) * 100)
          return (
            <Card key={d} style={{ outline: isToday ? '1px solid rgba(201,168,76,0.4)' : 'none' }}>
              <div
                className="font-display tracking-widest text-xs mb-0.5"
                style={{ color: isToday ? 'var(--gold)' : 'var(--text)' }}
              >
                {day.name.slice(0, 3).toUpperCase()}
                {isToday && <span className="ml-1 text-[8px]">· TODAY</span>}
              </div>
              <div className="font-mono text-[9px] mb-2" style={{ color: 'var(--muted)' }}>
                {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
              <div className="font-mono text-[10px] mb-2 leading-snug" style={{ color: 'var(--muted)' }}>{day.focus}</div>
              <div className="h-1 rounded-full mb-1" style={{ background: 'var(--border)' }}>
                <div className="h-1 rounded-full transition-all" style={{ width: `${pct}%`, background: pct === 100 ? '#4CAF82' : 'var(--gold)' }} />
              </div>
              <div className="font-mono text-[10px] text-right" style={{ color: done === day.tasks.length ? '#4CAF82' : 'var(--muted)' }}>
                {done}/{day.tasks.length}
              </div>
            </Card>
          )
        })}
      </div>

      <div className="flex flex-col gap-2">
        {weekDays.map(({ d, key, day }) => {
          const isToday = key === todayKey
          return (
            <Card key={d}>
              <div className="font-mono text-[10px] font-semibold mb-2" style={{ color: isToday ? 'var(--gold)' : 'var(--text)' }}>
                {day.name} — {day.focus}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                {day.tasks.map(t => (
                  <div key={t.id} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: TCOLS[t.type] }} />
                    <span className="font-mono text-[10px]" style={{ color: 'var(--muted)' }}>{t.label}</span>
                  </div>
                ))}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

// ── CONTACTS tab ──────────────────────────────────────────────────────────────

function ContactsTab({ s, save }: { s: MCCState; save: (next: MCCState) => void }) {
  const [list, setList]             = useState<ListKey>('realtors')
  const [search, setSearch]         = useState('')
  const [showAdd, setShowAdd]       = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [csvText, setCsvText]       = useState('')
  const [callNote, setCallNote]     = useState<{ id: string; note: string } | null>(null)

  const BLANK_C = { first: '', last: '', company: '', phone: '', email: '', note: '' }
  const [form, setForm] = useState({ ...BLANK_C })

  const contacts = s.contacts[list]
  const filtered = search
    ? contacts.filter(c =>
        `${c.first} ${c.last} ${c.company} ${c.phone} ${c.email}`
          .toLowerCase().includes(search.toLowerCase()))
    : contacts

  function addContact() {
    const c: MCCContact = { ...form, id: uid(), lastTouch: isoDate(), callHistory: [], calledToday: false }
    save({ ...s, contacts: { ...s.contacts, [list]: [c, ...contacts] } })
    setForm({ ...BLANK_C })
    setShowAdd(false)
  }

  function deleteContact(id: string) {
    if (!confirm('Delete this contact?')) return
    save({ ...s, contacts: { ...s.contacts, [list]: contacts.filter(c => c.id !== id) } })
  }

  function markCalled(id: string, note: string) {
    const contact = contacts.find(c => c.id === id)
    if (!contact) return
    const today    = isoDate()
    const logEntry: LogEntry = {
      id: uid(), date: new Date().toISOString(),
      activity: `Called ${contact.first} ${contact.last}`,
      channel: 'Phone Call', notes: LIST_META[list].label,
    }
    save({
      ...s,
      contacts: { ...s.contacts, [list]: contacts.map(c =>
        c.id === id
          ? { ...c, calledToday: true, lastTouch: today, callHistory: [{ date: today, note }, ...(c.callHistory || [])] }
          : c
      )},
      log: [...s.log, logEntry],
    })
    setCallNote(null)
  }

  function runImport() {
    const lines = csvText.trim().split('\n').map(l => l.trim()).filter(Boolean)
    if (lines.length < 2) return
    const header = lines[0].split(',').map(h => h.trim().toLowerCase())
    const gi = (col: string) => header.indexOf(col.toLowerCase())
    const iF = gi('firstname'), iL = gi('lastname'), iCo = gi('company')
    const iP = gi('phone'), iE = gi('email'), iT = gi('lasttouch')
    if (iF < 0 || iL < 0) { alert('Missing columns: FirstName, LastName'); return }
    const existing  = new Set(contacts.map(c => `${c.first}|${c.last}`.toLowerCase()))
    const imported: MCCContact[] = []
    for (let r = 1; r < lines.length; r++) {
      const cols  = lines[r].split(',').map(v => v.trim().replace(/^"|"$/g, ''))
      const first = iF >= 0 ? cols[iF] : ''
      const last  = iL >= 0 ? cols[iL] : ''
      if (existing.has(`${first}|${last}`.toLowerCase())) continue
      imported.push({
        id: uid(), first, last,
        company:   iCo >= 0 ? cols[iCo] || '' : '',
        phone:     iP  >= 0 ? cols[iP]  || '' : '',
        email:     iE  >= 0 ? cols[iE]  || '' : '',
        lastTouch: iT  >= 0 ? cols[iT]  || null : null,
        note: '', callHistory: [], calledToday: false,
      })
      existing.add(`${first}|${last}`.toLowerCase())
    }
    save({ ...s, contacts: { ...s.contacts, [list]: [...contacts, ...imported] } })
    alert(`Imported ${imported.length} contact${imported.length !== 1 ? 's' : ''}.${imported.length < lines.length - 1 ? ` ${lines.length - 1 - imported.length} duplicate(s) skipped.` : ''}`)
    setCsvText('')
    setShowImport(false)
  }

  return (
    <div className="max-w-4xl">
      {/* List selector */}
      <div className="flex flex-wrap gap-1 mb-3">
        {LIST_KEYS.map(k => (
          <button
            key={k}
            onClick={() => { setList(k); setSearch('') }}
            className="font-mono text-[10px] tracking-widest px-3 py-1.5 border transition-colors"
            style={{
              borderColor: list === k ? 'var(--gold)' : 'var(--border)',
              color:       list === k ? 'var(--gold)' : 'var(--muted)',
              background:  list === k ? 'rgba(201,168,76,0.08)' : 'transparent',
            }}
          >
            {LIST_META[k].label.toUpperCase()}S ({s.contacts[k].length})
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 mb-3 items-center">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search contacts…"
          className="flex-1 min-w-40 bg-transparent border rounded-sm font-mono text-xs px-3 py-1.5 outline-none"
          style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
        />
        <Btn onClick={() => setShowAdd(v => !v)} variant="gold">+ ADD</Btn>
        <Btn onClick={() => setShowImport(true)}>CSV IMPORT</Btn>
        <span className="font-mono text-[9px]" style={{ color: 'var(--muted)' }}>
          {filtered.length} contact{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Inline add form */}
      {showAdd && (
        <Card className="mb-3">
          <SectionLabel>ADD {LIST_META[list].label.toUpperCase()}</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            {(['first', 'last', 'company', 'phone', 'email', 'note'] as const).map(f => (
              <div key={f} className={f === 'note' ? 'col-span-2' : ''}>
                <div className="font-mono text-[9px] mb-1" style={{ color: 'var(--muted)' }}>{f.toUpperCase()}</div>
                <Input value={(form as Record<string, string>)[f] ?? ''} onChange={v => setForm(p => ({ ...p, [f]: v }))} />
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            <Btn onClick={addContact} variant="gold">ADD</Btn>
            <Btn onClick={() => { setShowAdd(false); setForm({ ...BLANK_C }) }}>CANCEL</Btn>
          </div>
        </Card>
      )}

      {/* CSV Import modal */}
      <Modal open={showImport} onClose={() => setShowImport(false)} title="IMPORT FROM SALESFORCE CSV">
        <div>
          <div className="font-mono text-[9px] mb-2" style={{ color: 'var(--muted)' }}>
            Columns: <span style={{ color: 'var(--gold)' }}>FirstName, LastName, Company, Phone, Email, LastTouch</span>
          </div>
          <textarea
            value={csvText}
            onChange={e => setCsvText(e.target.value)}
            placeholder={`FirstName,LastName,Company,Phone,Email,LastTouch\nJohn,Smith,Realty One,512-555-1234,john@email.com,2025-02-15`}
            className="w-full bg-transparent border rounded-sm font-mono text-xs p-2 outline-none resize-none"
            style={{ borderColor: 'var(--border)', color: 'var(--text)', minHeight: 110 }}
          />
        </div>
        <div className="flex gap-2">
          <Btn onClick={runImport} variant="gold">IMPORT</Btn>
          <Btn onClick={() => setShowImport(false)}>CANCEL</Btn>
        </div>
      </Modal>

      {/* Contact grid */}
      {filtered.length === 0 && (
        <div className="font-mono text-xs mt-2" style={{ color: 'var(--muted)' }}>
          {search ? 'No contacts match that search.' : 'No contacts yet — add manually or import CSV.'}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {filtered.map(c => {
          const days    = daysSince(c.lastTouch ?? undefined)
          const isStale = days !== null && days > 14
          return (
            <Card key={c.id} className={c.calledToday ? 'opacity-60' : ''}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  {c.calledToday && (
                    <span className="font-mono text-[8px] px-1.5 py-0.5 rounded-sm mr-1" style={{ background: '#4CAF8222', color: '#4CAF82' }}>✓ CALLED</span>
                  )}
                  <div className="font-mono text-xs font-semibold" style={{ color: 'var(--text)' }}>
                    {c.first} {c.last}
                  </div>
                  {c.company && <div className="font-mono text-[10px]" style={{ color: 'var(--muted)' }}>{c.company}</div>}
                </div>
                <span className="font-mono text-[8px] px-1.5 py-0.5 rounded-sm" style={{ background: 'rgba(201,168,76,0.1)', color: 'var(--gold)' }}>
                  {LIST_META[list].label.toUpperCase()}
                </span>
              </div>

              {c.phone && (
                <div className="font-mono text-[10px] mb-0.5" style={{ color: 'var(--muted)' }}>
                  📞 <a href={`tel:${c.phone}`} style={{ color: 'var(--text)' }}>{c.phone}</a>
                </div>
              )}
              {c.email && (
                <div className="font-mono text-[10px] mb-1" style={{ color: 'var(--muted)' }}>
                  ✉ <a href={`mailto:${c.email}`} style={{ color: 'var(--text)' }}>{c.email}</a>
                </div>
              )}

              <div
                className="font-mono text-[9px] mb-2"
                style={{ color: isStale ? '#E05252' : days !== null ? '#4CAF82' : 'var(--muted)' }}
              >
                ⏱ Last Touch: {days === null ? 'Never' : days === 0 ? 'Today' : `${days}d ago`}
                {c.lastTouch ? ` (${c.lastTouch})` : ''}
              </div>

              {c.note && (
                <div className="font-mono text-[10px] mb-2 pb-2 border-b" style={{ color: 'var(--muted)', borderColor: 'var(--border)' }}>
                  💬 {c.note}
                </div>
              )}

              {c.callHistory && c.callHistory.length > 0 && (
                <div className="font-mono text-[9px] mb-2" style={{ color: 'var(--muted)' }}>
                  Recent: {c.callHistory.slice(0, 2).map((h, i) => (
                    <span key={i}>{i > 0 ? ' · ' : ''}{h.date}{h.note ? ` (${h.note})` : ''}</span>
                  ))}
                </div>
              )}

              {callNote?.id === c.id && (
                <div className="mb-2">
                  <Input value={callNote.note} onChange={v => setCallNote({ id: c.id, note: v })} placeholder="Call note (optional)…" />
                  <div className="flex gap-2 mt-1.5">
                    <Btn onClick={() => markCalled(c.id, callNote.note)} variant="green">SAVE CALL</Btn>
                    <Btn onClick={() => setCallNote(null)}>CANCEL</Btn>
                  </div>
                </div>
              )}

              <div className="flex gap-1.5 flex-wrap">
                <Btn
                  onClick={() => setCallNote({ id: c.id, note: '' })}
                  variant="green"
                  disabled={c.calledToday}
                >
                  {c.calledToday ? '✓ Called' : '📞 Mark Called'}
                </Btn>
                <Btn onClick={() => deleteContact(c.id)} variant="danger">✕</Btn>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

// ── SOCIAL tab ────────────────────────────────────────────────────────────────

const PLAT_COLORS: Record<string, string> = {
  LinkedIn: '#5B8FD4', Facebook: '#9B72CF', Instagram: '#E05252', Both: '#C9A84C', All: '#4CAF82',
}
const PLAT_DISPLAY: Record<string, string> = { Both: 'LinkedIn + FB', All: 'LI + FB + IG' }
const PLAT_OPTS     = ['LinkedIn', 'Facebook', 'Instagram', 'Both', 'All']
const PLAT_FILTERS  = ['All', 'LinkedIn', 'Facebook', 'Instagram'] as const
type PlatFilter     = typeof PLAT_FILTERS[number]

function SocialTab({ s, save }: { s: MCCState; save: (next: MCCState) => void }) {
  const [platFilter, setPlatFilter] = useState<PlatFilter>('All')
  const [showAdd, setShowAdd]       = useState(false)
  const BLANK: Omit<SocialPost, 'id'> = { platform: 'Both', caption: '', url: '', date: isoDate(), notes: '' }
  const [form, setForm] = useState({ ...BLANK })

  const filtered = platFilter === 'All' ? s.socialPosts : s.socialPosts.filter(p => {
    if (platFilter === 'LinkedIn')   return p.platform === 'LinkedIn' || p.platform === 'Both' || p.platform === 'All'
    if (platFilter === 'Facebook')   return p.platform === 'Facebook' || p.platform === 'Both' || p.platform === 'All'
    if (platFilter === 'Instagram')  return p.platform === 'Instagram' || p.platform === 'All'
    return true
  })

  function addPost() {
    const post: SocialPost = { ...form, id: uid() }
    const logEntry: LogEntry = {
      id: uid(), date: new Date().toISOString(),
      activity: `Social post — ${form.platform}`, channel: form.platform, notes: form.caption.slice(0, 60),
    }
    save({
      ...s,
      socialPosts: [post, ...s.socialPosts],
      log: [...s.log, logEntry],
      last: { ...s.last, 'social-post': new Date().toISOString() },
    })
    setForm({ ...BLANK })
    setShowAdd(false)
  }

  return (
    <div className="max-w-3xl">
      <div className="flex flex-wrap gap-2 items-center justify-between mb-3">
        <div className="flex gap-1">
          {PLAT_FILTERS.map(p => (
            <button
              key={p}
              onClick={() => setPlatFilter(p)}
              className="font-mono text-[9px] tracking-widest px-2.5 py-1 border rounded-sm transition-colors"
              style={{
                borderColor: platFilter === p ? 'var(--gold)' : 'var(--border)',
                color:       platFilter === p ? 'var(--gold)' : 'var(--muted)',
                background:  platFilter === p ? 'rgba(201,168,76,0.08)' : 'transparent',
              }}
            >
              {p.toUpperCase()}
            </button>
          ))}
        </div>
        <Btn onClick={() => setShowAdd(v => !v)} variant="gold">+ LOG POST</Btn>
      </div>

      {showAdd && (
        <Card className="mb-3">
          <SectionLabel>LOG SOCIAL POST</SectionLabel>
          <div className="flex flex-col gap-3">
            <div>
              <div className="font-mono text-[9px] mb-1" style={{ color: 'var(--muted)' }}>PLATFORM</div>
              <select
                value={form.platform}
                onChange={e => setForm(p => ({ ...p, platform: e.target.value }))}
                className="bg-transparent border-b font-mono text-xs px-1 py-0.5 outline-none w-full"
                style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
              >
                {PLAT_OPTS.map(p => (
                  <option key={p} value={p} style={{ background: '#1a1a1a' }}>{PLAT_DISPLAY[p] ?? p}</option>
                ))}
              </select>
            </div>
            {(['caption', 'url', 'date', 'notes'] as const).map(f => (
              <div key={f}>
                <div className="font-mono text-[9px] mb-1" style={{ color: 'var(--muted)' }}>
                  {f === 'url' ? 'POST URL (optional)' : f === 'notes' ? 'NOTES (optional)' : f.toUpperCase()}
                </div>
                <Input
                  value={form[f] as string}
                  onChange={v => setForm(p => ({ ...p, [f]: v }))}
                  type={f === 'date' ? 'date' : 'text'}
                  placeholder={f === 'caption' ? 'Paste first few lines…' : f === 'url' ? 'https://linkedin.com/posts/…' : ''}
                />
              </div>
            ))}
            <div className="flex gap-2">
              <Btn onClick={addPost} variant="gold">SAVE POST</Btn>
              <Btn onClick={() => setShowAdd(false)}>CANCEL</Btn>
            </div>
          </div>
        </Card>
      )}

      {filtered.length === 0 && (
        <div className="font-mono text-xs" style={{ color: 'var(--muted)' }}>No posts logged yet.</div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {[...filtered].reverse().map(p => {
          const platColor = PLAT_COLORS[p.platform] ?? '#888'
          return (
            <Card key={p.id}>
              <div className="flex justify-between items-start mb-2">
                <div
                  className="font-mono text-[9px] px-2 py-0.5 rounded-full"
                  style={{ background: platColor + '22', color: platColor }}
                >
                  {PLAT_DISPLAY[p.platform] ?? p.platform}
                </div>
                <span className="font-mono text-[9px]" style={{ color: 'var(--muted)' }}>{fmtDate(p.date)}</span>
              </div>
              {p.caption && (
                <div className="font-mono text-[10px] mb-1 leading-snug" style={{ color: 'var(--text)' }}>
                  {p.caption.slice(0, 140)}{p.caption.length > 140 ? '…' : ''}
                </div>
              )}
              {p.url && (
                <div className="font-mono text-[9px] mb-1 truncate" style={{ color: '#5B8FD4' }}>
                  <a href={p.url} target="_blank" rel="noopener noreferrer">{p.url}</a>
                </div>
              )}
              {p.notes && <div className="font-mono text-[9px] mb-2" style={{ color: 'var(--muted)' }}>💬 {p.notes}</div>}
              <Btn onClick={() => save({ ...s, socialPosts: s.socialPosts.filter(x => x.id !== p.id) })} variant="danger">✕ DELETE</Btn>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

// ── NEWSLETTERS tab ───────────────────────────────────────────────────────────

type AudienceFilter = 'all' | 'Realtors' | 'Borrowers' | 'Both'
const AUDIENCE_BADGE: Record<string, string> = { Realtors: '#5B8FD4', Borrowers: '#4CAF82', Both: '#C9A84C' }

function NewslettersTab({ s, save }: { s: MCCState; save: (next: MCCState) => void }) {
  const [filter, setFilter]   = useState<AudienceFilter>('all')
  const [showAdd, setShowAdd] = useState(false)
  const BLANK: Omit<Newsletter, 'id'> = {
    audience: 'Realtors', subject: '', date: isoDate(), mailchimpUrl: '', openRate: '', notes: '',
  }
  const [form, setForm] = useState({ ...BLANK })

  const filtered = filter === 'all' ? s.newsletters : s.newsletters.filter(n => n.audience === filter)
  const sorted   = [...filtered].reverse()

  function addNL() {
    if (!form.subject.trim()) { alert('Subject line is required.'); return }
    const nl: Newsletter = { ...form, id: uid() }
    const now = new Date().toISOString()
    const lastUpd: Record<string, string> = { ...s.last }
    if (form.audience === 'Realtors'  || form.audience === 'Both') lastUpd['realtor-nl']  = now
    if (form.audience === 'Borrowers' || form.audience === 'Both') lastUpd['borrower-nl'] = now
    const logEntry: LogEntry = {
      id: uid(), date: now, activity: `Newsletter sent — ${form.subject}`, channel: 'Email', notes: form.audience,
    }
    save({ ...s, newsletters: [...s.newsletters, nl], log: [...s.log, logEntry], last: lastUpd })
    setForm({ ...BLANK })
    setShowAdd(false)
  }

  return (
    <div className="max-w-4xl">
      <div className="flex flex-wrap gap-2 items-center justify-between mb-3">
        <div className="flex gap-1">
          {(['all', 'Realtors', 'Borrowers', 'Both'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="font-mono text-[9px] tracking-widest px-2.5 py-1 border rounded-sm transition-colors"
              style={{
                borderColor: filter === f ? 'var(--gold)' : 'var(--border)',
                color:       filter === f ? 'var(--gold)' : 'var(--muted)',
                background:  filter === f ? 'rgba(201,168,76,0.08)' : 'transparent',
              }}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>
        <Btn onClick={() => setShowAdd(v => !v)} variant="gold">+ LOG NEWSLETTER</Btn>
      </div>

      {showAdd && (
        <Card className="mb-3">
          <SectionLabel>LOG NEWSLETTER</SectionLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="font-mono text-[9px] mb-1" style={{ color: 'var(--muted)' }}>AUDIENCE</div>
              <select
                value={form.audience}
                onChange={e => setForm(p => ({ ...p, audience: e.target.value }))}
                className="bg-transparent border-b font-mono text-xs px-1 py-0.5 outline-none w-full"
                style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
              >
                {['Realtors', 'Borrowers', 'Both'].map(a => (
                  <option key={a} value={a} style={{ background: '#1a1a1a' }}>{a}</option>
                ))}
              </select>
            </div>
            <div>
              <div className="font-mono text-[9px] mb-1" style={{ color: 'var(--muted)' }}>DATE SENT</div>
              <Input type="date" value={form.date} onChange={v => setForm(p => ({ ...p, date: v }))} />
            </div>
            <div className="md:col-span-2">
              <div className="font-mono text-[9px] mb-1" style={{ color: 'var(--muted)' }}>SUBJECT LINE *</div>
              <Input value={form.subject} onChange={v => setForm(p => ({ ...p, subject: v }))} placeholder="Austin Market Update — Feb 2026" />
            </div>
            <div>
              <div className="font-mono text-[9px] mb-1" style={{ color: 'var(--muted)' }}>OPEN RATE</div>
              <Input value={form.openRate} onChange={v => setForm(p => ({ ...p, openRate: v }))} placeholder="42%" />
            </div>
            <div>
              <div className="font-mono text-[9px] mb-1" style={{ color: 'var(--muted)' }}>MAILCHIMP URL</div>
              <Input value={form.mailchimpUrl} onChange={v => setForm(p => ({ ...p, mailchimpUrl: v }))} placeholder="https://mailchi.mp/…" />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <Btn onClick={addNL} variant="gold">SAVE</Btn>
            <Btn onClick={() => setShowAdd(false)}>CANCEL</Btn>
          </div>
        </Card>
      )}

      {/* Table */}
      <div className="border rounded-sm overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <div
          className="grid font-mono text-[9px] tracking-widest px-3 py-2"
          style={{
            gridTemplateColumns: '90px 1fr 90px 70px 80px',
            background: 'var(--bg)', color: 'var(--muted)', borderBottom: '1px solid var(--border)',
          }}
        >
          <span>DATE</span><span>SUBJECT</span><span>AUDIENCE</span><span>OPEN %</span><span>ACTIONS</span>
        </div>
        {sorted.length === 0 && (
          <div className="font-mono text-[10px] px-3 py-4" style={{ color: 'var(--muted)' }}>No newsletters logged yet.</div>
        )}
        {sorted.map(n => (
          <div
            key={n.id}
            className="grid items-center px-3 py-2.5 border-b font-mono"
            style={{ gridTemplateColumns: '90px 1fr 90px 70px 80px', borderColor: 'var(--border)', background: 'var(--surface)' }}
          >
            <span className="text-[9px]" style={{ color: 'var(--muted)' }}>
              {new Date(n.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
            </span>
            <div>
              <div className="text-[10px]" style={{ color: 'var(--text)' }}>{n.subject}</div>
              {n.notes && <div className="text-[9px]" style={{ color: 'var(--muted)' }}>{n.notes}</div>}
            </div>
            <span>
              <span
                className="text-[8px] px-1.5 py-0.5 rounded-full"
                style={{ background: (AUDIENCE_BADGE[n.audience] ?? '#888') + '22', color: AUDIENCE_BADGE[n.audience] ?? '#888' }}
              >
                {n.audience.toUpperCase()}
              </span>
            </span>
            <span className="text-[10px]" style={{ color: n.openRate ? '#4CAF82' : 'var(--muted)' }}>
              {n.openRate || '—'}
            </span>
            <div className="flex gap-1">
              {n.mailchimpUrl && (
                <a
                  href={n.mailchimpUrl} target="_blank" rel="noopener noreferrer"
                  className="font-mono text-[8px] px-1.5 py-0.5 border rounded-sm"
                  style={{ color: '#5B8FD4', borderColor: '#5B8FD433' }}
                >
                  VIEW
                </a>
              )}
              <Btn onClick={() => save({ ...s, newsletters: s.newsletters.filter(x => x.id !== n.id) })} variant="danger">✕</Btn>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── TRACKER tab ───────────────────────────────────────────────────────────────

function TrackerTab({ s, onLogTracker }: { s: MCCState; onLogTracker: (id: string) => void }) {
  return (
    <div className="max-w-3xl">
      <SectionLabel>CADENCE TRACKER — LAST DEPLOYED</SectionLabel>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {TRACKERS.map(t => {
          const days      = daysSince(s.last[t.id])
          const pct       = days === null ? 100 : Math.min(100, Math.round((days / t.freq) * 100))
          const color     = statusColor(days, t.freq)
          const fillColor = days === null ? '#E05252' : days <= t.freq ? '#4CAF82' : days <= t.freq * 1.5 ? '#C9A84C' : '#E05252'
          const lbl       = days === null ? 'Never logged' : days === 0 ? 'Today' : `${days}d ago`
          const dt        = s.last[t.id]
            ? new Date(s.last[t.id]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            : '—'
          return (
            <Card key={t.id}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-mono text-xs" style={{ color: 'var(--text)' }}>{t.name}</div>
                  <div className="font-mono text-[9px]" style={{ color: 'var(--muted)' }}>{t.channel}</div>
                </div>
                <Btn onClick={() => onLogTracker(t.id)} variant="gold">LOG NOW</Btn>
              </div>
              <div className="h-1.5 rounded-full mb-2" style={{ background: 'var(--border)' }}>
                <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: fillColor }} />
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs" style={{ color }}>{lbl}</span>
                <span className="font-mono text-[9px]" style={{ color: 'var(--muted)' }}>{dt} · every {t.freq}d</span>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

// ── LOG tab ───────────────────────────────────────────────────────────────────

type LogView = 'cal' | 'list'

function LogTab({ s, save }: { s: MCCState; save: (next: MCCState) => void }) {
  const [view, setView]           = useState<LogView>('cal')
  const [calOffset, setCalOffset] = useState(0)
  const [showAdd, setShowAdd]     = useState(false)
  const BLANK: Omit<LogEntry, 'id'> = { date: isoDate(), activity: '', channel: 'Call', notes: '' }
  const [form, setForm] = useState({ ...BLANK })

  function addEntry() {
    if (!form.activity.trim()) return
    const entry: LogEntry = { ...form, id: uid() }
    save({ ...s, log: [...s.log, entry] })
    setForm({ ...BLANK })
    setShowAdd(false)
  }

  const today  = new Date()
  const dow    = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1) + calOffset * 7)
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)

  const fmt       = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const weekLabel = `${fmt(monday)} – ${fmt(sunday)}${calOffset === 0 ? ' · This Week' : calOffset === -1 ? ' · Last Week' : ''}`

  const byDay: Record<string, LogEntry[]> = {}
  s.log.forEach(e => {
    const d = new Date(e.date)
    if (d >= monday && d <= sunday) {
      const k = d.toDateString()
      if (!byDay[k]) byDay[k] = []
      byDay[k].push(e)
    }
  })

  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const calDays   = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday)
    day.setDate(monday.getDate() + i)
    return day
  })

  return (
    <div className="max-w-4xl">
      <div className="flex flex-wrap gap-2 items-center justify-between mb-3">
        <div className="flex gap-1">
          {([['cal', '📅 Calendar'], ['list', '📋 List']] as [LogView, string][]).map(([v, label]) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="font-mono text-[9px] tracking-widest px-3 py-1.5 border rounded-sm transition-colors"
              style={{
                borderColor: view === v ? 'var(--gold)' : 'var(--border)',
                color:       view === v ? 'var(--gold)' : 'var(--muted)',
                background:  view === v ? 'rgba(201,168,76,0.08)' : 'transparent',
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <Btn onClick={() => setShowAdd(v => !v)} variant="gold">+ LOG ACTIVITY</Btn>
      </div>

      {showAdd && (
        <Card className="mb-3">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <div className="font-mono text-[9px] mb-1" style={{ color: 'var(--muted)' }}>DATE</div>
              <Input type="date" value={form.date} onChange={v => setForm(p => ({ ...p, date: v }))} />
            </div>
            <div>
              <div className="font-mono text-[9px] mb-1" style={{ color: 'var(--muted)' }}>CHANNEL</div>
              <select
                value={form.channel}
                onChange={e => setForm(p => ({ ...p, channel: e.target.value }))}
                className="bg-transparent border-b font-mono text-xs px-1 py-0.5 outline-none w-full"
                style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
              >
                {LOG_CHANNELS.map(c => <option key={c} value={c} style={{ background: '#1a1a1a' }}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="mb-3">
            <div className="font-mono text-[9px] mb-1" style={{ color: 'var(--muted)' }}>ACTIVITY</div>
            <Input value={form.activity} onChange={v => setForm(p => ({ ...p, activity: v }))} placeholder="What did you do?" />
          </div>
          <div className="mb-3">
            <div className="font-mono text-[9px] mb-1" style={{ color: 'var(--muted)' }}>NOTES</div>
            <Input value={form.notes} onChange={v => setForm(p => ({ ...p, notes: v }))} placeholder="Details…" />
          </div>
          <div className="flex gap-2">
            <Btn onClick={addEntry} variant="gold">LOG ACTIVITY</Btn>
            <Btn onClick={() => setShowAdd(false)}>CANCEL</Btn>
          </div>
        </Card>
      )}

      {/* Calendar view */}
      {view === 'cal' && (
        <>
          <div className="flex items-center gap-3 mb-3">
            <Btn onClick={() => setCalOffset(p => p - 1)}>← PREV</Btn>
            <span className="font-mono text-xs flex-1 text-center" style={{ color: 'var(--muted)' }}>{weekLabel}</span>
            <Btn onClick={() => setCalOffset(p => Math.min(0, p + 1))} disabled={calOffset === 0}>NEXT →</Btn>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calDays.map(day => {
              const isToday = day.toDateString() === today.toDateString()
              const entries = byDay[day.toDateString()] || []
              return (
                <div
                  key={day.toDateString()}
                  className="border rounded-sm p-2"
                  style={{
                    borderColor: isToday ? 'rgba(201,168,76,0.5)' : 'var(--border)',
                    background:  isToday ? 'rgba(201,168,76,0.05)' : 'var(--surface)',
                    minHeight:   80,
                  }}
                >
                  <div className="font-mono text-[8px] mb-0.5" style={{ color: 'var(--muted)' }}>
                    {DAY_NAMES[day.getDay()]}
                  </div>
                  <div
                    className="font-mono text-sm font-semibold mb-1"
                    style={{ color: isToday ? 'var(--gold)' : 'var(--text)' }}
                  >
                    {day.getDate()}
                  </div>
                  {entries.length === 0
                    ? <div className="font-mono text-[8px]" style={{ color: 'var(--border)' }}>—</div>
                    : entries.map((e, i) => (
                      <div key={i} className="mb-0.5">
                        <div className="font-mono text-[8px] leading-snug" style={{ color: 'var(--text)' }}>
                          {e.activity.slice(0, 22)}{e.activity.length > 22 ? '…' : ''}
                        </div>
                        <div className="font-mono text-[7px]" style={{ color: 'var(--muted)' }}>{e.channel}</div>
                      </div>
                    ))
                  }
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* List view */}
      {view === 'list' && (
        <div>
          <div
            className="grid font-mono text-[9px] tracking-widest px-3 py-2 border"
            style={{ gridTemplateColumns: '80px 1fr 100px 50px 24px', background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--muted)' }}
          >
            <span>DATE</span><span>ACTIVITY</span><span>CHANNEL</span><span>STATUS</span><span />
          </div>
          {[...s.log].reverse().map(entry => (
            <div
              key={entry.id}
              className="grid items-center px-3 py-2 border-b font-mono"
              style={{ gridTemplateColumns: '80px 1fr 100px 50px 24px', borderColor: 'var(--border)', background: 'var(--surface)' }}
            >
              <span className="text-[9px]" style={{ color: 'var(--muted)' }}>
                {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
              <div>
                <div className="text-[10px]" style={{ color: 'var(--text)' }}>{entry.activity}</div>
                {entry.notes && <div className="text-[9px]" style={{ color: 'var(--muted)' }}>{entry.notes}</div>}
              </div>
              <span className="text-[9px]" style={{ color: 'var(--muted)' }}>{entry.channel}</span>
              <span className="text-[9px]" style={{ color: '#4CAF82' }}>Done</span>
              <button
                onClick={() => save({ ...s, log: s.log.filter(x => x.id !== entry.id) })}
                className="font-mono text-[9px] hover:opacity-70 transition-opacity"
                style={{ color: '#E05252' }}
              >
                ✕
              </button>
            </div>
          ))}
          {s.log.length === 0 && (
            <div className="font-mono text-[10px] px-3 py-4" style={{ color: 'var(--muted)' }}>No activity logged yet.</div>
          )}
        </div>
      )}
    </div>
  )
}

// ── BRAIN DUMP tab ────────────────────────────────────────────────────────────

function BrainDumpTab({ s, save }: { s: MCCState; save: (next: MCCState) => void }) {
  const [text, setText] = useState('')

  function addTodo() {
    if (!text.trim()) return
    const todo: Todo = { id: uid(), text: text.trim(), created: isoDate() }
    save({ ...s, todos: [todo, ...s.todos] })
    setText('')
  }

  function completeTodo(id: string) {
    const todo = s.todos.find(t => t.id === id)
    if (!todo) return
    const done: DoneTodo = { ...todo, done_at: isoDate() }
    const logEntry: LogEntry = { id: uid(), date: new Date().toISOString(), activity: todo.text, channel: 'Task', notes: '' }
    save({ ...s, todos: s.todos.filter(t => t.id !== id), doneTodos: [done, ...s.doneTodos], log: [...s.log, logEntry] })
  }

  return (
    <div className="max-w-xl">
      <SectionLabel>BRAIN DUMP / TODO</SectionLabel>
      <div className="flex gap-2 mb-4">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTodo()}
          placeholder="Capture anything on your mind…"
          className="flex-1 bg-transparent border-b font-mono text-xs px-1 py-0.5 outline-none"
          style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
        />
        <Btn onClick={addTodo} variant="gold">ADD</Btn>
      </div>

      <div className="flex flex-col gap-1.5 mb-6">
        {s.todos.map(t => (
          <div key={t.id} className="flex items-center gap-3 px-3 py-2 border" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
            <button onClick={() => completeTodo(t.id)} className="w-4 h-4 border flex-shrink-0 hover:opacity-70 transition-opacity" style={{ borderColor: 'var(--border)' }} />
            <span className="font-mono text-xs flex-1" style={{ color: 'var(--text)' }}>{t.text}</span>
            <span className="font-mono text-[9px]" style={{ color: 'var(--muted)' }}>{t.created}</span>
            <Btn onClick={() => save({ ...s, todos: s.todos.filter(x => x.id !== t.id) })} variant="danger">×</Btn>
          </div>
        ))}
        {s.todos.length === 0 && (
          <div className="font-mono text-xs" style={{ color: 'var(--muted)' }}>Nothing here. You&apos;re clear.</div>
        )}
      </div>

      {s.doneTodos.length > 0 && (
        <>
          <SectionLabel>COMPLETED</SectionLabel>
          <div className="flex flex-col gap-1.5">
            {s.doneTodos.slice(0, 20).map(t => (
              <div key={t.id} className="flex items-center gap-3 px-3 py-2 border" style={{ borderColor: 'var(--border)', background: 'var(--bg)', opacity: 0.6 }}>
                <div className="w-4 h-4 border flex-shrink-0 flex items-center justify-center" style={{ borderColor: '#4CAF82' }}>
                  <div className="w-2 h-2" style={{ background: '#4CAF82' }} />
                </div>
                <span className="font-mono text-xs flex-1 line-through" style={{ color: 'var(--muted)' }}>{t.text}</span>
                <span className="font-mono text-[9px]" style={{ color: 'var(--muted)' }}>done {t.done_at}</span>
                <Btn onClick={() => save({ ...s, doneTodos: s.doneTodos.filter(x => x.id !== t.id) })} variant="danger">×</Btn>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MarketingPage() {
  const supabase = useSupabase()
  const [s, setState]         = useState<MCCState>(BLANK_STATE)
  const [tab, setTab]         = useState<Tab>('TODAY')
  const [loading, setLoading] = useState(true)
  const [userId, setUserId]   = useState<string | null>(null)

  // Global log modal — shared by overdue banner, tracker "Log Now", and today quick-log buttons
  const [logModal, setLogModal] = useState<{ open: boolean; trackerId: string | null }>({
    open: false, trackerId: null,
  })

  const todayKey   = isoDate()
  const rawDow     = new Date().getDay()
  const isWeekend  = rawDow === 0 || rawDow === 6
  const todayDow   = rawDow === 0 ? 1 : rawDow === 6 ? 5 : rawDow
  const todayTasks = s.tasks[todayKey] ?? {}

  useEffect(() => {
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
          if (data) setState(data.value as MCCState)
          setLoading(false)
        })
    })
  }, [supabase])

  function save(next: MCCState) {
    setState(next)
    if (!userId) return
    supabase
      .from('mcc_state')
      .upsert({ user_id: userId, key: 'mcc', value: next }, { onConflict: 'user_id,key' })
  }

  function toggle(taskId: string, tracker?: string) {
    const dayTasks = { ...todayTasks, [taskId]: !todayTasks[taskId] }
    save({
      ...s,
      tasks: { ...s.tasks, [todayKey]: dayTasks },
      last: tracker ? { ...s.last, [tracker]: isoDate() } : s.last,
    })
  }

  function openLogModal(trackerId: string) {
    setLogModal({ open: true, trackerId })
  }

  function handleLogSave(activity: string, channel: string, notes: string, date: string) {
    const entryDate = date ? new Date(`${date}T12:00:00`).toISOString() : new Date().toISOString()
    const entry: LogEntry = { id: uid(), date: entryDate, activity, channel, notes }
    save({
      ...s,
      log: [...s.log, entry],
      last: logModal.trackerId ? { ...s.last, [logModal.trackerId]: entryDate } : s.last,
    })
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64 font-mono text-xs" style={{ color: 'var(--muted)' }}>
      LOADING…
    </div>
  )

  return (
    <div className="flex flex-col gap-3">

      {/* ── Stat Row ── */}
      <StatRow todayDow={todayDow} todayTasks={todayTasks} s={s} isWeekend={isWeekend} />

      {/* ── Overdue Banner ── */}
      <OverdueBanner s={s} onLog={openLogModal} />

      {/* ── Tab nav ── */}
      <div className="flex flex-wrap gap-1">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="font-mono text-[10px] tracking-widest px-3 py-1.5 rounded-sm transition-colors"
            style={{
              background: tab === t ? 'var(--gold)' : 'var(--bg)',
              color:      tab === t ? 'var(--bg-deep)' : 'var(--muted)',
              border:     `1px solid ${tab === t ? 'var(--gold)' : 'var(--border)'}`,
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      {tab === 'TODAY' && (isWeekend
        ? <div className="font-mono text-xs max-w-sm" style={{ color: 'var(--muted)' }}>
            No tasks today — it&apos;s the weekend. Come back Monday.
          </div>
        : <TodayTab todayDow={todayDow} todayTasks={todayTasks} toggle={toggle} s={s} save={save} onLogTracker={openLogModal} />
      )}
      {tab === 'WEEK'        && <WeekTab s={s} todayKey={todayKey} />}
      {tab === 'CONTACTS'    && <ContactsTab s={s} save={save} />}
      {tab === 'SOCIAL'      && <SocialTab s={s} save={save} />}
      {tab === 'NEWSLETTERS' && <NewslettersTab s={s} save={save} />}
      {tab === 'TRACKER'     && <TrackerTab s={s} onLogTracker={openLogModal} />}
      {tab === 'LOG'         && <LogTab s={s} save={save} />}
      {tab === 'BRAIN DUMP'  && <BrainDumpTab s={s} save={save} />}

      {/* ── Global Log Modal ── */}
      <LogModal
        open={logModal.open}
        trackerId={logModal.trackerId}
        onSave={handleLogSave}
        onClose={() => setLogModal({ open: false, trackerId: null })}
      />
    </div>
  )
}
