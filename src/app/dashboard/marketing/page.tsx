'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useOrg } from '@/hooks/useOrg'
import { DAYS, TCOLS } from '@/lib/marketing/schedule'
// DayTask, DayDef imported for type reference in schedule lib

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

type GeneratedNewsletter = {
  subject: string
  teaserHtml: string
  webTitle: string
  webHtml: string
  slug: string
}

type UserMarketingSettings = {
  anthropic_api_key?: string
  mailchimp_api_key?: string
  mailchimp_server_prefix?: string
  mailchimp_realtor_list_id?: string
  mailchimp_borrower_list_id?: string
  dispatch_webhook_url?: string
  dispatch_secret?: string
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

// DAYS, TCOLS, DayTask, DayDef imported from @/lib/marketing/schedule

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

const TABS = ['THIS WEEK', 'TODAY', 'WEEK', 'CONTACTS', 'SOCIAL', 'NEWSLETTERS', 'TRACKER', 'LOG', 'BRAIN DUMP'] as const
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
      style={{ background: '#18181b', borderColor: '#3f3f46', ...style }}
    >
      {children}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono text-[10px] tracking-widest mb-3" style={{ color: '#71717a' }}>
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
      style={{ borderColor: '#3f3f46', color: '#f4f4f5' }}
    />
  )
}

function Btn({ onClick, children, variant = 'default', disabled = false, className = '' }: {
  onClick: () => void; children: React.ReactNode
  variant?: 'default' | 'gold' | 'danger' | 'green'
  disabled?: boolean; className?: string
}) {
  const colors = {
    default: { color: '#71717a', border: '#3f3f46' },
    gold:    { color: '#C9A84C',  border: '#C9A84C' },
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
        style={{ background: '#18181b', borderColor: '#3f3f46' }}
      >
        <div className="flex items-center justify-between">
          <div className="font-mono text-sm tracking-widest" style={{ color: '#C9A84C' }}>{title}</div>
          <button onClick={onClose} className="font-mono text-[10px] hover:opacity-70" style={{ color: '#71717a' }}>ESC</button>
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
          <div className="font-mono text-[9px] mb-1" style={{ color: '#71717a' }}>ACTIVITY</div>
          <Input value={activity} onChange={setActivity} placeholder="What did you do?" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="font-mono text-[9px] mb-1" style={{ color: '#71717a' }}>CHANNEL</div>
            <select
              value={channel}
              onChange={e => setChannel(e.target.value)}
              className="bg-transparent border-b font-mono text-xs px-1 py-0.5 outline-none w-full"
              style={{ borderColor: '#3f3f46', color: '#f4f4f5' }}
            >
              {LOG_CHANNELS.map(c => <option key={c} value={c} style={{ background: '#1a1a1a' }}>{c}</option>)}
            </select>
          </div>
          <div>
            <div className="font-mono text-[9px] mb-1" style={{ color: '#71717a' }}>DATE</div>
            <Input type="date" value={date} onChange={setDate} />
          </div>
        </div>
        <div>
          <div className="font-mono text-[9px] mb-1" style={{ color: '#71717a' }}>NOTES (optional)</div>
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
      color: '#C9A84C',
    },
    {
      label: 'TASKS COMPLETE',
      value: `${done}/${total}`,
      sub:   done === total && total > 0 ? 'All done ✓' : `${total - done} remaining`,
      color: done === total && total > 0 ? '#4CAF82' : '#f4f4f5',
    },
    {
      label: 'LOANS IN PROCESS',
      value: loans || '—',
      sub:   loans ? 'active files' : 'add in Contacts',
      color: '#f4f4f5',
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
          style={{ background: '#18181b', borderColor: '#3f3f46' }}
        >
          <div className="font-mono text-[9px] tracking-widest mb-1" style={{ color: '#71717a' }}>
            {st.label}
          </div>
          <div className="font-mono text-2xl font-semibold leading-none" style={{ color: st.color as string }}>
            {st.value}
          </div>
          <div className="font-mono text-[10px] mt-1 leading-snug" style={{ color: '#71717a' }}>{st.sub}</div>
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
                  style={{ background: 'rgba(201,168,76,0.15)', color: '#C9A84C' }}
                >
                  {day.name.toUpperCase()}
                </span>
              </div>
              <div className="font-display tracking-widest text-base" style={{ color: '#C9A84C' }}>
                {day.focus} Day
              </div>
              <div className="font-mono text-[10px] mt-0.5" style={{ color: '#71717a' }}>{day.sub}</div>
            </div>
            <div className="text-right">
              <div
                className="font-mono text-2xl font-semibold"
                style={{ color: done === day.tasks.length ? '#4CAF82' : '#C9A84C' }}
              >
                {done}/{day.tasks.length}
              </div>
              <div className="font-mono text-[9px] tracking-widest mb-2" style={{ color: '#71717a' }}>COMPLETE</div>
              {/* Progress bar */}
              <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: '#3f3f46' }}>
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${day.tasks.length > 0 ? Math.round((done / day.tasks.length) * 100) : 0}%`,
                    background: done === day.tasks.length ? '#4CAF82' : '#C9A84C',
                  }}
                />
              </div>
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
                    background: checked ? 'rgba(201,168,76,0.08)' : '#09090b',
                    border: `1px solid ${checked ? 'rgba(201,168,76,0.3)' : '#3f3f46'}`,
                  }}
                >
                  <div
                    className="w-4 h-4 border flex-shrink-0 flex items-center justify-center"
                    style={{ borderColor: checked ? '#C9A84C' : '#3f3f46' }}
                  >
                    {checked && <div className="w-2 h-2" style={{ background: '#C9A84C' }} />}
                  </div>
                  <span className="text-sm">{task.e}</span>
                  <span
                    className="font-mono text-xs flex-1 leading-snug"
                    style={{ color: checked ? '#71717a' : '#f4f4f5', textDecoration: checked ? 'line-through' : 'none' }}
                  >
                    {task.label}
                  </span>
                  {task.tracker && !checked && (
                    <button
                      onClick={e => { e.stopPropagation(); onLogTracker(task.tracker!) }}
                      className="font-mono text-[9px] px-1.5 py-0.5 border rounded-sm hover:opacity-70 transition-opacity flex-shrink-0"
                      style={{ color: '#C9A84C', borderColor: 'rgba(201,168,76,0.4)', background: 'rgba(201,168,76,0.08)' }}
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
              style={{ borderColor: '#3f3f46', color: '#f4f4f5' }}
            />
            <Btn onClick={addTodo} variant="gold">ADD</Btn>
          </div>
          <div className="flex flex-col gap-1.5">
            {s.todos.length === 0 && (
              <div className="font-mono text-[10px]" style={{ color: '#71717a' }}>Nothing here. You&apos;re clear.</div>
            )}
            {s.todos.slice(0, 12).map(t => (
              <div key={t.id} className="flex items-center gap-2 py-1.5 border-b" style={{ borderColor: '#3f3f46' }}>
                <button
                  onClick={() => completeTodo(t.id)}
                  className="w-3.5 h-3.5 border flex-shrink-0 hover:opacity-70 transition-opacity"
                  style={{ borderColor: '#3f3f46' }}
                />
                <span className="font-mono text-[10px] flex-1 leading-snug" style={{ color: '#f4f4f5' }}>{t.text}</span>
              </div>
            ))}
            {s.todos.length > 12 && (
              <div className="font-mono text-[9px]" style={{ color: '#71717a' }}>
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
                style={{ color: isToday ? '#C9A84C' : '#f4f4f5' }}
              >
                {day.name.slice(0, 3).toUpperCase()}
                {isToday && <span className="ml-1 text-[8px]">· TODAY</span>}
              </div>
              <div className="font-mono text-[9px] mb-2" style={{ color: '#71717a' }}>
                {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
              <div className="font-mono text-[10px] mb-2 leading-snug" style={{ color: '#71717a' }}>{day.focus}</div>
              <div className="h-1 rounded-full mb-1" style={{ background: '#3f3f46' }}>
                <div className="h-1 rounded-full transition-all" style={{ width: `${pct}%`, background: pct === 100 ? '#4CAF82' : '#C9A84C' }} />
              </div>
              <div className="font-mono text-[10px] text-right" style={{ color: done === day.tasks.length ? '#4CAF82' : '#71717a' }}>
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
              <div className="font-mono text-[10px] font-semibold mb-2" style={{ color: isToday ? '#C9A84C' : '#f4f4f5' }}>
                {day.name} — {day.focus}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                {day.tasks.map(t => (
                  <div key={t.id} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: TCOLS[t.type] }} />
                    <span className="font-mono text-[10px]" style={{ color: '#71717a' }}>{t.label}</span>
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
              borderColor: list === k ? '#C9A84C' : '#3f3f46',
              color:       list === k ? '#C9A84C' : '#71717a',
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
          style={{ borderColor: '#3f3f46', color: '#f4f4f5' }}
        />
        <Btn onClick={() => setShowAdd(v => !v)} variant="gold">+ ADD</Btn>
        <Btn onClick={() => setShowImport(true)}>CSV IMPORT</Btn>
        <span className="font-mono text-[9px]" style={{ color: '#71717a' }}>
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
                <div className="font-mono text-[9px] mb-1" style={{ color: '#71717a' }}>{f.toUpperCase()}</div>
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
          <div className="font-mono text-[9px] mb-2" style={{ color: '#71717a' }}>
            Columns: <span style={{ color: '#C9A84C' }}>FirstName, LastName, Company, Phone, Email, LastTouch</span>
          </div>
          <textarea
            value={csvText}
            onChange={e => setCsvText(e.target.value)}
            placeholder={`FirstName,LastName,Company,Phone,Email,LastTouch\nJohn,Smith,Realty One,512-555-1234,john@email.com,2025-02-15`}
            className="w-full bg-transparent border rounded-sm font-mono text-xs p-2 outline-none resize-none"
            style={{ borderColor: '#3f3f46', color: '#f4f4f5', minHeight: 110 }}
          />
        </div>
        <div className="flex gap-2">
          <Btn onClick={runImport} variant="gold">IMPORT</Btn>
          <Btn onClick={() => setShowImport(false)}>CANCEL</Btn>
        </div>
      </Modal>

      {/* Contact grid */}
      {filtered.length === 0 && (
        <div className="font-mono text-xs mt-2" style={{ color: '#71717a' }}>
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
                  <div className="font-mono text-xs font-semibold" style={{ color: '#f4f4f5' }}>
                    {c.first} {c.last}
                  </div>
                  {c.company && <div className="font-mono text-[10px]" style={{ color: '#71717a' }}>{c.company}</div>}
                </div>
                <span className="font-mono text-[8px] px-1.5 py-0.5 rounded-sm" style={{ background: 'rgba(201,168,76,0.1)', color: '#C9A84C' }}>
                  {LIST_META[list].label.toUpperCase()}
                </span>
              </div>

              {c.phone && (
                <div className="font-mono text-[10px] mb-0.5" style={{ color: '#71717a' }}>
                  📞 <a href={`tel:${c.phone}`} style={{ color: '#f4f4f5' }}>{c.phone}</a>
                </div>
              )}
              {c.email && (
                <div className="font-mono text-[10px] mb-1" style={{ color: '#71717a' }}>
                  ✉ <a href={`mailto:${c.email}`} style={{ color: '#f4f4f5' }}>{c.email}</a>
                </div>
              )}

              <div
                className="font-mono text-[9px] mb-2"
                style={{ color: isStale ? '#E05252' : days !== null ? '#4CAF82' : '#71717a' }}
              >
                ⏱ Last Touch: {days === null ? 'Never' : days === 0 ? 'Today' : `${days}d ago`}
                {c.lastTouch ? ` (${c.lastTouch})` : ''}
              </div>

              {c.note && (
                <div className="font-mono text-[10px] mb-2 pb-2 border-b" style={{ color: '#71717a', borderColor: '#3f3f46' }}>
                  💬 {c.note}
                </div>
              )}

              {c.callHistory && c.callHistory.length > 0 && (
                <div className="font-mono text-[9px] mb-2" style={{ color: '#71717a' }}>
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

  // ── Testimonials automation ──────────────────────────────────────
  const [runningTestimonials, setRunningTestimonials] = useState(false)
  const [testimonialsStatus, setTestimonialsStatus]   = useState('')

  async function runTestimonialsAutomation() {
    setRunningTestimonials(true)
    setTestimonialsStatus('')
    try {
      const res = await fetch('/api/marketing/run-testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (res.ok) {
        setTestimonialsStatus(`✓ Workflow triggered! Execution ID: ${data.executionId}`)
        // Log it to the tracker
        save({
          ...s,
          log: [...s.log, {
            id: uid(), date: new Date().toISOString(),
            activity: 'Testimonials automation triggered', channel: 'LinkedIn', notes: '',
          }],
          last: { ...s.last, 'social-post': new Date().toISOString() },
        })
      } else {
        setTestimonialsStatus(`Error: ${data.error}`)
      }
    } catch {
      setTestimonialsStatus('Network error — check N8N_API_KEY env variable.')
    } finally {
      setRunningTestimonials(false)
    }
  }

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

      {/* ── Testimonials Automation ── */}
      <Card className="mb-4" style={{ borderColor: 'rgba(155,114,207,0.4)' }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-mono text-xs font-semibold mb-0.5" style={{ color: '#9B72CF' }}>
              🏆 TESTIMONIALS AUTOMATION
            </div>
            <div className="font-mono text-[9px] leading-snug" style={{ color: '#71717a' }}>
              Runs the LoanOS Weekly Social Post n8n workflow — pulls recent reviews
              and generates LinkedIn/Facebook posts automatically.
            </div>
            {testimonialsStatus && (
              <div
                className="font-mono text-[9px] mt-2 px-2 py-1 rounded-sm"
                style={{
                  background: testimonialsStatus.startsWith('✓') ? 'rgba(76,175,130,0.1)' : 'rgba(224,82,82,0.1)',
                  color:      testimonialsStatus.startsWith('✓') ? '#4CAF82' : '#E05252',
                }}
              >
                {testimonialsStatus}
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <button
              onClick={runTestimonialsAutomation}
              disabled={runningTestimonials}
              className="font-mono text-[10px] tracking-widest border px-2 py-1 transition-opacity hover:opacity-70 disabled:opacity-40"
              style={{ background: 'rgba(155,114,207,0.15)', borderColor: 'rgba(155,114,207,0.5)', color: '#9B72CF' }}
            >
              {runningTestimonials ? '⟳ RUNNING…' : '▶ RUN NOW'}
            </button>
            {s.last['social-post'] && (
              <span className="font-mono text-[8px]" style={{ color: '#71717a' }}>
                Last: {fmtDate(s.last['social-post'])}
              </span>
            )}
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap gap-2 items-center justify-between mb-3">
        <div className="flex gap-1">
          {PLAT_FILTERS.map(p => (
            <button
              key={p}
              onClick={() => setPlatFilter(p)}
              className="font-mono text-[9px] tracking-widest px-2.5 py-1 border rounded-sm transition-colors"
              style={{
                borderColor: platFilter === p ? '#C9A84C' : '#3f3f46',
                color:       platFilter === p ? '#C9A84C' : '#71717a',
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
              <div className="font-mono text-[9px] mb-1" style={{ color: '#71717a' }}>PLATFORM</div>
              <select
                value={form.platform}
                onChange={e => setForm(p => ({ ...p, platform: e.target.value }))}
                className="bg-transparent border-b font-mono text-xs px-1 py-0.5 outline-none w-full"
                style={{ borderColor: '#3f3f46', color: '#f4f4f5' }}
              >
                {PLAT_OPTS.map(p => (
                  <option key={p} value={p} style={{ background: '#1a1a1a' }}>{PLAT_DISPLAY[p] ?? p}</option>
                ))}
              </select>
            </div>
            {(['caption', 'url', 'date', 'notes'] as const).map(f => (
              <div key={f}>
                <div className="font-mono text-[9px] mb-1" style={{ color: '#71717a' }}>
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
        <div className="font-mono text-xs" style={{ color: '#71717a' }}>No posts logged yet.</div>
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
                <span className="font-mono text-[9px]" style={{ color: '#71717a' }}>{fmtDate(p.date)}</span>
              </div>
              {p.caption && (
                <div className="font-mono text-[10px] mb-1 leading-snug" style={{ color: '#f4f4f5' }}>
                  {p.caption.slice(0, 140)}{p.caption.length > 140 ? '…' : ''}
                </div>
              )}
              {p.url && (
                <div className="font-mono text-[9px] mb-1 truncate" style={{ color: '#5B8FD4' }}>
                  <a href={p.url} target="_blank" rel="noopener noreferrer">{p.url}</a>
                </div>
              )}
              {p.notes && <div className="font-mono text-[9px] mb-2" style={{ color: '#71717a' }}>💬 {p.notes}</div>}
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
type GenAudience    = 'Realtors' | 'Borrowers' | 'Both'
const AUDIENCE_BADGE: Record<string, string> = { Realtors: '#5B8FD4', Borrowers: '#4CAF82', Both: '#C9A84C' }

function useMarketingSettings() {
  const supabase = useSupabase()
  const { userId, loading: orgLoading } = useOrg()
  const [settings, setSettings] = useState<UserMarketingSettings>({})
  useEffect(() => {
    if (orgLoading || !userId) return
    Promise.all([
      supabase.from('user_settings').select('value').eq('user_id', userId).eq('key', 'integrations').single(),
      supabase.from('user_settings').select('value').eq('user_id', userId).eq('key', 'website').single(),
    ]).then(([integ, site]) => {
      setSettings({
        ...((integ.data?.value as Record<string, string>) ?? {}),
        ...((site.data?.value  as Record<string, string>) ?? {}),
      })
    })
  }, [supabase, userId, orgLoading])
  return settings
}

function NewslettersTab({ s, save }: { s: MCCState; save: (next: MCCState) => void }) {
  const settings = useMarketingSettings()

  // ── Log form (manual entry) ──────────────────────────────────────
  const [filter, setFilter]   = useState<AudienceFilter>('all')
  const [showAdd, setShowAdd] = useState(false)
  const BLANK: Omit<Newsletter, 'id'> = {
    audience: 'Realtors', subject: '', date: isoDate(), mailchimpUrl: '', openRate: '', notes: '',
  }
  const [form, setForm] = useState({ ...BLANK })

  // ── Generator state ──────────────────────────────────────────────
  const [showGen, setShowGen]     = useState(false)
  const [genAudience, setGenAud]  = useState<GenAudience>('Realtors')
  const [genNotes, setGenNotes]   = useState('')
  const [generating, setGenerating] = useState(false)
  const [preview, setPreview]     = useState<GeneratedNewsletter | null>(null)
  const [sendingMC, setSendingMC] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')

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

  // ── Generator functions ──────────────────────────────────────────

  async function generateNewsletter() {
    setGenerating(true)
    setStatusMsg('')
    setPreview(null)
    try {
      const res = await fetch('/api/marketing/generate-newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audience: genAudience,
          notes: genNotes,
          apiKey: settings.anthropic_api_key,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setStatusMsg(`Error: ${data.error}`); return }
      setPreview(data as GeneratedNewsletter)
    } catch {
      setStatusMsg('Generation failed — check Anthropic API key in Settings.')
    } finally {
      setGenerating(false)
    }
  }

  async function sendMailchimp() {
    if (!preview) return
    if (!settings.mailchimp_api_key || !settings.mailchimp_server_prefix) {
      setStatusMsg('Mailchimp credentials not configured. Go to Settings → Integrations.')
      return
    }
    const listId = genAudience === 'Realtors'
      ? settings.mailchimp_realtor_list_id
      : settings.mailchimp_borrower_list_id
    if (!listId) {
      setStatusMsg(`Mailchimp ${genAudience} list ID not configured in Settings.`)
      return
    }
    setSendingMC(true)
    setStatusMsg('')
    try {
      const res = await fetch('/api/marketing/send-mailchimp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key:         settings.mailchimp_api_key,
          server_prefix:   settings.mailchimp_server_prefix,
          list_id:         listId,
          subject:         preview.subject,
          html_body:       preview.teaserHtml,
        }),
      })
      const data = await res.json()
      if (res.ok) setStatusMsg(`✓ Mailchimp campaign sent! Campaign ID: ${data.campaignId}`)
      else setStatusMsg(`Mailchimp error: ${data.error}`)
    } finally {
      setSendingMC(false)
    }
  }

  async function publishToWebsite() {
    if (!preview) return
    if (!settings.dispatch_webhook_url) {
      setStatusMsg('Dispatch webhook URL not configured. Go to Settings → Website.')
      return
    }
    setPublishing(true)
    setStatusMsg('')
    try {
      const res = await fetch('/api/marketing/publish-newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dispatch_url:    settings.dispatch_webhook_url,
          dispatch_secret: settings.dispatch_secret,
          audience:        genAudience,
          slug:            preview.slug,
          title:           preview.webTitle,
          html:            preview.webHtml,
        }),
      })
      const data = await res.json()
      if (res.ok) setStatusMsg(`✓ Published to website! ${data.url ? `URL: ${data.url}` : 'Check your site.'}`)
      else setStatusMsg(`Publish error: ${data.error}`)
    } finally {
      setPublishing(false)
    }
  }

  function logGeneratedNewsletter() {
    if (!preview) return
    const now = new Date().toISOString()
    const nl: Newsletter = {
      id: uid(), audience: genAudience, subject: preview.subject,
      date: isoDate(), mailchimpUrl: '', openRate: '', notes: genNotes,
    }
    const lastUpd = { ...s.last }
    if (genAudience === 'Realtors'  || genAudience === 'Both') lastUpd['realtor-nl']  = now
    if (genAudience === 'Borrowers' || genAudience === 'Both') lastUpd['borrower-nl'] = now
    const logEntry: LogEntry = {
      id: uid(), date: now,
      activity: `Newsletter generated & sent — ${preview.subject}`,
      channel: 'Email', notes: genAudience,
    }
    save({ ...s, newsletters: [...s.newsletters, nl], log: [...s.log, logEntry], last: lastUpd })
    setPreview(null)
    setShowGen(false)
    setGenNotes('')
    setStatusMsg('')
  }

  return (
    <div className="max-w-4xl">

      {/* ── Generator Panel ── */}
      <Card className="mb-4" style={{ borderColor: showGen ? '#C9A84C' : undefined }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-mono text-xs font-semibold" style={{ color: '#C9A84C' }}>🚀 NEWSLETTER GENERATOR</div>
            <div className="font-mono text-[9px] mt-0.5" style={{ color: '#71717a' }}>
              AI drafts → Mailchimp campaign → publish to website
            </div>
          </div>
          <Btn onClick={() => { setShowGen(v => !v); setPreview(null); setStatusMsg('') }} variant="gold">
            {showGen ? 'COLLAPSE' : 'GENERATE NEW'}
          </Btn>
        </div>

        {showGen && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <div className="font-mono text-[9px] mb-1" style={{ color: '#71717a' }}>AUDIENCE</div>
                <select
                  value={genAudience}
                  onChange={e => setGenAud(e.target.value as GenAudience)}
                  className="bg-transparent border-b font-mono text-xs px-1 py-0.5 outline-none w-full"
                  style={{ borderColor: '#3f3f46', color: '#f4f4f5' }}
                >
                  {(['Realtors', 'Borrowers', 'Both'] as const).map(a => (
                    <option key={a} value={a} style={{ background: '#1a1a1a' }}>{a}</option>
                  ))}
                </select>
              </div>
              <div>
                <div className="font-mono text-[9px] mb-1" style={{ color: '#71717a' }}>
                  RATE / MARKET CONTEXT (optional)
                </div>
                <Input
                  value={genNotes}
                  onChange={setGenNotes}
                  placeholder="e.g. 30yr at 6.875%, Austin inventory up 12% MOM"
                />
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Btn onClick={generateNewsletter} variant="gold" disabled={generating}>
                {generating ? '⟳ GENERATING…' : '✦ GENERATE DRAFT'}
              </Btn>
              {preview && (
                <>
                  <Btn onClick={sendMailchimp} disabled={sendingMC}>
                    {sendingMC ? '⟳ SENDING…' : '📧 SEND MAILCHIMP'}
                  </Btn>
                  <Btn onClick={publishToWebsite} disabled={publishing}>
                    {publishing ? '⟳ PUBLISHING…' : '🌐 PUBLISH TO WEBSITE'}
                  </Btn>
                  <Btn onClick={logGeneratedNewsletter} variant="green">✓ LOG THIS</Btn>
                </>
              )}
            </div>

            {statusMsg && (
              <div
                className="font-mono text-[10px] px-3 py-2 rounded-sm"
                style={{
                  background: statusMsg.startsWith('✓') ? 'rgba(76,175,130,0.1)' : 'rgba(224,82,82,0.1)',
                  color:      statusMsg.startsWith('✓') ? '#4CAF82' : '#E05252',
                  border:     `1px solid ${statusMsg.startsWith('✓') ? '#4CAF8233' : '#E0525233'}`,
                }}
              >
                {statusMsg}
              </div>
            )}

            {/* Preview */}
            {preview && (
              <div className="flex flex-col gap-3 mt-1">
                <div>
                  <div className="font-mono text-[9px] mb-1" style={{ color: '#C9A84C' }}>SUBJECT LINE</div>
                  <div className="font-mono text-xs px-3 py-2 rounded-sm" style={{ background: 'rgba(201,168,76,0.08)', color: '#f4f4f5' }}>
                    {preview.subject}
                  </div>
                </div>
                <div>
                  <div className="font-mono text-[9px] mb-1" style={{ color: '#71717a' }}>TEASER EMAIL (Mailchimp)</div>
                  <div
                    className="text-xs rounded-sm p-3 overflow-auto max-h-40 font-mono leading-relaxed"
                    style={{ background: '#0D0D0D', color: '#71717a', border: '1px solid #3f3f46', fontSize: 10 }}
                    dangerouslySetInnerHTML={{ __html: preview.teaserHtml }}
                  />
                </div>
                <div>
                  <div className="font-mono text-[9px] mb-1" style={{ color: '#71717a' }}>WEB PAGE CONTENT</div>
                  <div
                    className="font-mono text-[9px] px-3 py-2 rounded-sm leading-snug"
                    style={{ background: '#0D0D0D', color: '#71717a', border: '1px solid #3f3f46', whiteSpace: 'pre-wrap', maxHeight: 160, overflow: 'auto' }}
                  >
                    {preview.webTitle} — slug: /{preview.slug}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      <div className="flex flex-wrap gap-2 items-center justify-between mb-3">
        <div className="flex gap-1">
          {(['all', 'Realtors', 'Borrowers', 'Both'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="font-mono text-[9px] tracking-widest px-2.5 py-1 border rounded-sm transition-colors"
              style={{
                borderColor: filter === f ? '#C9A84C' : '#3f3f46',
                color:       filter === f ? '#C9A84C' : '#71717a',
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
              <div className="font-mono text-[9px] mb-1" style={{ color: '#71717a' }}>DATE SENT</div>
              <Input type="date" value={form.date} onChange={v => setForm(p => ({ ...p, date: v }))} />
            </div>
            <div className="md:col-span-2">
              <div className="font-mono text-[9px] mb-1" style={{ color: '#71717a' }}>SUBJECT LINE *</div>
              <Input value={form.subject} onChange={v => setForm(p => ({ ...p, subject: v }))} placeholder="Austin Market Update — Feb 2026" />
            </div>
            <div>
              <div className="font-mono text-[9px] mb-1" style={{ color: '#71717a' }}>OPEN RATE</div>
              <Input value={form.openRate} onChange={v => setForm(p => ({ ...p, openRate: v }))} placeholder="42%" />
            </div>
            <div>
              <div className="font-mono text-[9px] mb-1" style={{ color: '#71717a' }}>MAILCHIMP URL</div>
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
      <div className="border rounded-sm overflow-hidden" style={{ borderColor: '#3f3f46' }}>
        <div
          className="grid font-mono text-[9px] tracking-widest px-3 py-2"
          style={{
            gridTemplateColumns: '90px 1fr 90px 70px 80px',
            background: '#09090b', color: '#71717a', borderBottom: '1px solid #3f3f46',
          }}
        >
          <span>DATE</span><span>SUBJECT</span><span>AUDIENCE</span><span>OPEN %</span><span>ACTIONS</span>
        </div>
        {sorted.length === 0 && (
          <div className="font-mono text-[10px] px-3 py-4" style={{ color: '#71717a' }}>No newsletters logged yet.</div>
        )}
        {sorted.map(n => (
          <div
            key={n.id}
            className="grid items-center px-3 py-2.5 border-b font-mono"
            style={{ gridTemplateColumns: '90px 1fr 90px 70px 80px', borderColor: '#3f3f46', background: '#18181b' }}
          >
            <span className="text-[9px]" style={{ color: '#71717a' }}>
              {new Date(n.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
            </span>
            <div>
              <div className="text-[10px]" style={{ color: '#f4f4f5' }}>{n.subject}</div>
              {n.notes && <div className="text-[9px]" style={{ color: '#71717a' }}>{n.notes}</div>}
            </div>
            <span>
              <span
                className="text-[8px] px-1.5 py-0.5 rounded-full"
                style={{ background: (AUDIENCE_BADGE[n.audience] ?? '#888') + '22', color: AUDIENCE_BADGE[n.audience] ?? '#888' }}
              >
                {n.audience.toUpperCase()}
              </span>
            </span>
            <span className="text-[10px]" style={{ color: n.openRate ? '#4CAF82' : '#71717a' }}>
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
                  <div className="font-mono text-xs" style={{ color: '#f4f4f5' }}>{t.name}</div>
                  <div className="font-mono text-[9px]" style={{ color: '#71717a' }}>{t.channel}</div>
                </div>
                <Btn onClick={() => onLogTracker(t.id)} variant="gold">LOG NOW</Btn>
              </div>
              <div className="h-1.5 rounded-full mb-2" style={{ background: '#3f3f46' }}>
                <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: fillColor }} />
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs" style={{ color }}>{lbl}</span>
                <span className="font-mono text-[9px]" style={{ color: '#71717a' }}>{dt} · every {t.freq}d</span>
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
                borderColor: view === v ? '#C9A84C' : '#3f3f46',
                color:       view === v ? '#C9A84C' : '#71717a',
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
              <div className="font-mono text-[9px] mb-1" style={{ color: '#71717a' }}>DATE</div>
              <Input type="date" value={form.date} onChange={v => setForm(p => ({ ...p, date: v }))} />
            </div>
            <div>
              <div className="font-mono text-[9px] mb-1" style={{ color: '#71717a' }}>CHANNEL</div>
              <select
                value={form.channel}
                onChange={e => setForm(p => ({ ...p, channel: e.target.value }))}
                className="bg-transparent border-b font-mono text-xs px-1 py-0.5 outline-none w-full"
                style={{ borderColor: '#3f3f46', color: '#f4f4f5' }}
              >
                {LOG_CHANNELS.map(c => <option key={c} value={c} style={{ background: '#1a1a1a' }}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="mb-3">
            <div className="font-mono text-[9px] mb-1" style={{ color: '#71717a' }}>ACTIVITY</div>
            <Input value={form.activity} onChange={v => setForm(p => ({ ...p, activity: v }))} placeholder="What did you do?" />
          </div>
          <div className="mb-3">
            <div className="font-mono text-[9px] mb-1" style={{ color: '#71717a' }}>NOTES</div>
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
            <span className="font-mono text-xs flex-1 text-center" style={{ color: '#71717a' }}>{weekLabel}</span>
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
                    borderColor: isToday ? 'rgba(201,168,76,0.5)' : '#3f3f46',
                    background:  isToday ? 'rgba(201,168,76,0.05)' : '#18181b',
                    minHeight:   80,
                  }}
                >
                  <div className="font-mono text-[8px] mb-0.5" style={{ color: '#71717a' }}>
                    {DAY_NAMES[day.getDay()]}
                  </div>
                  <div
                    className="font-mono text-sm font-semibold mb-1"
                    style={{ color: isToday ? '#C9A84C' : '#f4f4f5' }}
                  >
                    {day.getDate()}
                  </div>
                  {entries.length === 0
                    ? <div className="font-mono text-[8px]" style={{ color: '#3f3f46' }}>—</div>
                    : entries.map((e, i) => (
                      <div key={i} className="mb-0.5">
                        <div className="font-mono text-[8px] leading-snug" style={{ color: '#f4f4f5' }}>
                          {e.activity.slice(0, 22)}{e.activity.length > 22 ? '…' : ''}
                        </div>
                        <div className="font-mono text-[7px]" style={{ color: '#71717a' }}>{e.channel}</div>
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
            style={{ gridTemplateColumns: '80px 1fr 100px 50px 24px', background: '#09090b', borderColor: '#3f3f46', color: '#71717a' }}
          >
            <span>DATE</span><span>ACTIVITY</span><span>CHANNEL</span><span>STATUS</span><span />
          </div>
          {[...s.log].reverse().map(entry => (
            <div
              key={entry.id}
              className="grid items-center px-3 py-2 border-b font-mono"
              style={{ gridTemplateColumns: '80px 1fr 100px 50px 24px', borderColor: '#3f3f46', background: '#18181b' }}
            >
              <span className="text-[9px]" style={{ color: '#71717a' }}>
                {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
              <div>
                <div className="text-[10px]" style={{ color: '#f4f4f5' }}>{entry.activity}</div>
                {entry.notes && <div className="text-[9px]" style={{ color: '#71717a' }}>{entry.notes}</div>}
              </div>
              <span className="text-[9px]" style={{ color: '#71717a' }}>{entry.channel}</span>
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
            <div className="font-mono text-[10px] px-3 py-4" style={{ color: '#71717a' }}>No activity logged yet.</div>
          )}
        </div>
      )}
    </div>
  )
}

// ── THIS WEEK tab — Rate Update + Newsletter cadence summary ─────────────────

function ThisWeekTab({ s, save, onLogTracker }: {
  s: MCCState
  save: (next: MCCState) => void
  onLogTracker: (id: string) => void
}) {
  const settings = useMarketingSettings()

  // ── Rate Update inline logger ─────────────────────────────────────
  const [showRateForm, setShowRateForm] = useState(false)
  const RATE_BLANK = {
    date: isoDate(), rate_30yr: '', rate_15yr: '', rate_arm: '',
    audience: 'Realtors', notes: '', channel: 'Email + Text',
  }
  const [rateForm, setRateForm] = useState({ ...RATE_BLANK })

  function saveRateUpdate() {
    if (!rateForm.rate_30yr.trim()) { alert('30yr rate is required.'); return }
    const now = new Date().toISOString()
    const logEntry: LogEntry = {
      id: uid(), date: now,
      activity: `Rate Update sent — 30yr ${rateForm.rate_30yr} · ${rateForm.audience}`,
      channel: rateForm.channel, notes: rateForm.notes,
    }
    save({
      ...s,
      log:  [...s.log, logEntry],
      last: { ...s.last, 'rate-update': now },
    })
    // Persist to localStorage for rate-updates standalone page
    if (typeof window !== 'undefined') {
      const LS_KEY = 'loanos_rate_updates'
      const existing: unknown[] = (() => { try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]') } catch { return [] } })()
      const entry = { ...rateForm, id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7) }
      localStorage.setItem(LS_KEY, JSON.stringify([entry, ...existing]))
    }
    setRateForm({ ...RATE_BLANK })
    setShowRateForm(false)
  }

  // ── Newsletter inline generator ───────────────────────────────────
  const [showNLForm, setShowNLForm]       = useState(false)
  const [genAudience, setGenAud]          = useState<GenAudience>('Realtors')
  const [genNotes, setGenNotes]           = useState('')
  const [generating, setGenerating]       = useState(false)
  const [preview, setPreview]             = useState<GeneratedNewsletter | null>(null)
  const [sendingMC, setSendingMC]         = useState(false)
  const [publishing, setPublishing]       = useState(false)
  const [statusMsg, setStatusMsg]         = useState('')

  async function generateNewsletter() {
    setGenerating(true); setStatusMsg(''); setPreview(null)
    try {
      const res = await fetch('/api/marketing/generate-newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audience: genAudience, notes: genNotes, apiKey: settings.anthropic_api_key }),
      })
      const data = await res.json()
      if (!res.ok) { setStatusMsg(`Error: ${data.error}`); return }
      setPreview(data as GeneratedNewsletter)
    } catch { setStatusMsg('Generation failed — check Anthropic API key in Settings.') }
    finally { setGenerating(false) }
  }

  async function sendMailchimp() {
    if (!preview) return
    if (!settings.mailchimp_api_key || !settings.mailchimp_server_prefix) {
      setStatusMsg('Mailchimp credentials not configured. Go to Settings → Integrations.')
      return
    }
    const listId = genAudience === 'Realtors' ? settings.mailchimp_realtor_list_id : settings.mailchimp_borrower_list_id
    if (!listId) { setStatusMsg(`Mailchimp ${genAudience} list ID not configured.`); return }
    setSendingMC(true); setStatusMsg('')
    try {
      const res = await fetch('/api/marketing/send-mailchimp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: settings.mailchimp_api_key, server_prefix: settings.mailchimp_server_prefix,
          list_id: listId, subject: preview.subject, html_body: preview.teaserHtml,
        }),
      })
      const data = await res.json()
      if (res.ok) setStatusMsg(`Mailchimp sent — Campaign ID: ${data.campaignId}`)
      else setStatusMsg(`Mailchimp error: ${data.error}`)
    } finally { setSendingMC(false) }
  }

  async function publishToWebsite() {
    if (!preview) return
    if (!settings.dispatch_webhook_url) {
      setStatusMsg('Dispatch webhook not configured. Go to Settings → Website.')
      return
    }
    setPublishing(true); setStatusMsg('')
    try {
      const res = await fetch('/api/marketing/publish-newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dispatch_url: settings.dispatch_webhook_url, dispatch_secret: settings.dispatch_secret,
          audience: genAudience, slug: preview.slug, title: preview.webTitle, html: preview.webHtml,
        }),
      })
      const data = await res.json()
      if (res.ok) setStatusMsg(`Published to website${data.url ? ` — ${data.url}` : ''}`)
      else setStatusMsg(`Publish error: ${data.error}`)
    } finally { setPublishing(false) }
  }

  function logNewsletter() {
    if (!preview) return
    const now = new Date().toISOString()
    const nl: Newsletter = {
      id: uid(), audience: genAudience, subject: preview.subject,
      date: isoDate(), mailchimpUrl: '', openRate: '', notes: genNotes,
    }
    const lastUpd = { ...s.last }
    if (genAudience === 'Realtors'  || genAudience === 'Both') lastUpd['realtor-nl']  = now
    if (genAudience === 'Borrowers' || genAudience === 'Both') lastUpd['borrower-nl'] = now
    const logEntry: LogEntry = {
      id: uid(), date: now,
      activity: `Newsletter generated & sent — ${preview.subject}`,
      channel: 'Email', notes: genAudience,
    }
    save({ ...s, newsletters: [...s.newsletters, nl], log: [...s.log, logEntry], last: lastUpd })
    setPreview(null); setShowNLForm(false); setGenNotes(''); setStatusMsg('')
  }

  // ── Computed values ───────────────────────────────────────────────
  const rateLastSent    = s.last['rate-update']
  const realtorNLLast   = s.last['realtor-nl']
  const borrowerNLLast  = s.last['borrower-nl']

  function cadenceLabel(iso: string | undefined | null, freq: number): { label: string; color: string } {
    const d = daysSince(iso)
    if (d === null)  return { label: 'Never sent', color: '#E05252' }
    if (d === 0)     return { label: 'Sent today', color: '#4CAF82' }
    if (d <= freq)   return { label: `${d}d ago`, color: '#4CAF82' }
    if (d <= freq * 1.5) return { label: `${d}d ago — due soon`, color: '#C9A84C' }
    return { label: `${d}d ago — overdue`, color: '#E05252' }
  }

  const rateCadence    = cadenceLabel(rateLastSent,   7)
  const realtorCad     = cadenceLabel(realtorNLLast,  7)
  const borrowerCad    = cadenceLabel(borrowerNLLast, 7)

  const mailchimpConfigured = !!(settings.mailchimp_api_key && settings.mailchimp_server_prefix)
  const dispatchConfigured  = !!settings.dispatch_webhook_url
  const aiConfigured        = !!settings.anthropic_api_key

  return (
    <div className="flex flex-col gap-4 max-w-4xl">

      {/* ── Section Label ── */}
      <div className="font-mono text-[9px] tracking-widest" style={{ color: '#71717a' }}>
        A — THIS WEEK · HIGH-FREQUENCY ACTIONS
      </div>

      {/* ── Section A: Rate Update ── */}
      <Card style={{ borderColor: showRateForm ? '#C9A84C' : '#3f3f46' }}>
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="font-mono text-xs font-semibold" style={{ color: '#C9A84C' }}>RATE UPDATE</div>
              <span
                className="font-mono text-[8px] px-2 py-0.5 rounded-full"
                style={{
                  background: rateCadence.color + '22',
                  color: rateCadence.color,
                }}
              >
                {rateCadence.label}
              </span>
              {rateLastSent && (
                <span className="font-mono text-[8px]" style={{ color: '#52525b' }}>
                  {fmtDate(rateLastSent)}
                </span>
              )}
            </div>
            <div className="font-mono text-[9px]" style={{ color: '#71717a' }}>
              Weekly rate communication to realtors and borrowers · every Friday
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Btn onClick={() => { setShowRateForm(v => !v) }} variant="gold">
              {showRateForm ? 'COLLAPSE' : '+ LOG RATE UPDATE'}
            </Btn>
            <Btn onClick={() => onLogTracker('rate-update')}>QUICK LOG</Btn>
          </div>
        </div>

        {showRateForm && (
          <div className="border-t pt-3" style={{ borderColor: '#3f3f46' }}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
              <div>
                <div className="font-mono text-[9px] mb-1" style={{ color: '#71717a' }}>DATE</div>
                <Input type="date" value={rateForm.date} onChange={v => setRateForm(p => ({ ...p, date: v }))} />
              </div>
              <div>
                <div className="font-mono text-[9px] mb-1" style={{ color: '#71717a' }}>30-YR FIXED *</div>
                <Input value={rateForm.rate_30yr} onChange={v => setRateForm(p => ({ ...p, rate_30yr: v }))} placeholder="6.875%" />
              </div>
              <div>
                <div className="font-mono text-[9px] mb-1" style={{ color: '#71717a' }}>15-YR FIXED</div>
                <Input value={rateForm.rate_15yr} onChange={v => setRateForm(p => ({ ...p, rate_15yr: v }))} placeholder="6.125%" />
              </div>
              <div>
                <div className="font-mono text-[9px] mb-1" style={{ color: '#71717a' }}>ARM</div>
                <Input value={rateForm.rate_arm} onChange={v => setRateForm(p => ({ ...p, rate_arm: v }))} placeholder="5.875% (5/1)" />
              </div>
              <div>
                <div className="font-mono text-[9px] mb-1" style={{ color: '#71717a' }}>AUDIENCE</div>
                <select
                  value={rateForm.audience}
                  onChange={e => setRateForm(p => ({ ...p, audience: e.target.value }))}
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
                  value={rateForm.channel}
                  onChange={e => setRateForm(p => ({ ...p, channel: e.target.value }))}
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
                <Input value={rateForm.notes} onChange={v => setRateForm(p => ({ ...p, notes: v }))} placeholder="Market context, lock advice…" />
              </div>
            </div>
            <div className="flex gap-2">
              <Btn onClick={saveRateUpdate} variant="gold">SAVE</Btn>
              <Btn onClick={() => setShowRateForm(false)}>CANCEL</Btn>
            </div>
          </div>
        )}
      </Card>

      {/* ── Section A: Newsletter ── */}
      <Card style={{ borderColor: showNLForm ? '#C9A84C' : '#3f3f46' }}>
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <div className="font-mono text-xs font-semibold" style={{ color: '#C9A84C' }}>WEEKLY NEWSLETTER</div>
              <span className="font-mono text-[8px] px-2 py-0.5 rounded-full" style={{ background: realtorCad.color + '22', color: realtorCad.color }}>
                Realtors: {realtorCad.label}
              </span>
              <span className="font-mono text-[8px] px-2 py-0.5 rounded-full" style={{ background: borrowerCad.color + '22', color: borrowerCad.color }}>
                Borrowers: {borrowerCad.label}
              </span>
            </div>
            <div className="font-mono text-[9px] flex flex-wrap gap-3" style={{ color: '#71717a' }}>
              <span>AI drafts · Mailchimp · website publish</span>
              {!aiConfigured && (
                <span style={{ color: '#E05252' }}>⚠ Anthropic key not configured</span>
              )}
              {!mailchimpConfigured && (
                <span style={{ color: '#C9A84C' }}>⚠ Mailchimp not configured</span>
              )}
              {!dispatchConfigured && (
                <span style={{ color: '#52525b' }}>Website publish not configured</span>
              )}
            </div>
          </div>
          <Btn onClick={() => { setShowNLForm(v => !v); setPreview(null); setStatusMsg('') }} variant="gold">
            {showNLForm ? 'COLLAPSE' : 'GENERATE NEW'}
          </Btn>
        </div>

        {showNLForm && (
          <div className="border-t pt-3 flex flex-col gap-3" style={{ borderColor: '#3f3f46' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <div className="font-mono text-[9px] mb-1" style={{ color: '#71717a' }}>AUDIENCE</div>
                <select
                  value={genAudience}
                  onChange={e => setGenAud(e.target.value as GenAudience)}
                  className="bg-transparent border-b font-mono text-xs px-1 py-0.5 outline-none w-full"
                  style={{ borderColor: '#3f3f46', color: '#f4f4f5' }}
                >
                  {(['Realtors', 'Borrowers', 'Both'] as const).map(a => (
                    <option key={a} value={a} style={{ background: '#1a1a1a' }}>{a}</option>
                  ))}
                </select>
              </div>
              <div>
                <div className="font-mono text-[9px] mb-1" style={{ color: '#71717a' }}>RATE / MARKET CONTEXT (optional)</div>
                <Input value={genNotes} onChange={setGenNotes} placeholder="e.g. 30yr at 6.875%, Austin inventory up 12% MOM" />
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Btn onClick={generateNewsletter} variant="gold" disabled={generating}>
                {generating ? 'GENERATING...' : 'GENERATE DRAFT'}
              </Btn>
              {preview && (
                <>
                  <Btn onClick={sendMailchimp} disabled={sendingMC || !mailchimpConfigured}>
                    {sendingMC ? 'SENDING...' : 'SEND MAILCHIMP'}
                  </Btn>
                  <Btn onClick={publishToWebsite} disabled={publishing || !dispatchConfigured}>
                    {publishing ? 'PUBLISHING...' : 'PUBLISH TO WEBSITE'}
                  </Btn>
                  <Btn onClick={logNewsletter} variant="green">LOG THIS</Btn>
                </>
              )}
            </div>

            {statusMsg && (
              <div
                className="font-mono text-[10px] px-3 py-2 rounded-sm"
                style={{
                  background: statusMsg.startsWith('✓') || statusMsg.includes('sent') || statusMsg.includes('Published') ? 'rgba(76,175,130,0.1)' : 'rgba(224,82,82,0.1)',
                  color: statusMsg.startsWith('✓') || statusMsg.includes('sent') || statusMsg.includes('Published') ? '#4CAF82' : '#E05252',
                  border: `1px solid ${statusMsg.startsWith('✓') || statusMsg.includes('sent') || statusMsg.includes('Published') ? '#4CAF8233' : '#E0525233'}`,
                }}
              >
                {statusMsg}
              </div>
            )}

            {preview && (
              <div className="flex flex-col gap-3">
                <div>
                  <div className="font-mono text-[9px] mb-1" style={{ color: '#C9A84C' }}>SUBJECT LINE</div>
                  <div className="font-mono text-xs px-3 py-2 rounded-sm" style={{ background: 'rgba(201,168,76,0.08)', color: '#f4f4f5' }}>
                    {preview.subject}
                  </div>
                </div>
                <div>
                  <div className="font-mono text-[9px] mb-1" style={{ color: '#71717a' }}>TEASER EMAIL (Mailchimp)</div>
                  <div
                    className="text-xs rounded-sm p-3 overflow-auto max-h-40 font-mono leading-relaxed"
                    style={{ background: '#0D0D0D', color: '#71717a', border: '1px solid #3f3f46', fontSize: 10 }}
                    dangerouslySetInnerHTML={{ __html: preview.teaserHtml }}
                  />
                </div>
                <div>
                  <div className="font-mono text-[9px] mb-1" style={{ color: '#71717a' }}>WEB PAGE</div>
                  <div
                    className="font-mono text-[9px] px-3 py-2 rounded-sm"
                    style={{ background: '#0D0D0D', color: '#71717a', border: '1px solid #3f3f46', whiteSpace: 'pre-wrap', maxHeight: 120, overflow: 'auto' }}
                  >
                    {preview.webTitle} — slug: /{preview.slug}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* ── Section B: Email Tools ── */}
      <div className="font-mono text-[9px] tracking-widest mt-2" style={{ color: '#71717a' }}>
        B — EMAIL TOOLS
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {[
          { label: 'Newsletter Generator', sub: 'AI drafts · Mailchimp · website', href: '/dashboard/marketing/content', configured: aiConfigured },
          { label: 'Template Builder', sub: 'Pre-approval · CD · referral intro', href: '/dashboard/emails', configured: true },
          { label: 'Campaign Builder', sub: 'Compose + send to Mailchimp list', href: '/dashboard/marketing/content', configured: mailchimpConfigured },
        ].map((item, i) => (
          <a
            key={i}
            href={item.href}
            className="border rounded-sm px-4 py-3 flex flex-col gap-1 transition-colors hover:border-zinc-500"
            style={{ background: '#18181b', borderColor: '#3f3f46', textDecoration: 'none' }}
          >
            <div className="flex items-center justify-between">
              <div className="font-mono text-[10px] font-semibold" style={{ color: '#f4f4f5' }}>{item.label}</div>
              <div
                className="font-mono text-[8px] px-1.5 py-0.5 rounded-full"
                style={{
                  background: item.configured ? 'rgba(76,175,130,0.15)' : 'rgba(201,168,76,0.15)',
                  color: item.configured ? '#4CAF82' : '#C9A84C',
                }}
              >
                {item.configured ? 'READY' : 'CONFIGURE'}
              </div>
            </div>
            <div className="font-mono text-[9px]" style={{ color: '#71717a' }}>{item.sub}</div>
          </a>
        ))}
      </div>

      {/* ── Section C: Reach ── */}
      <div className="font-mono text-[9px] tracking-widest mt-2" style={{ color: '#71717a' }}>
        C — REACH · CALL LISTS + DISTRIBUTION
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {[
          {
            label: 'Call Lists',
            sub: `${s.contacts.realtors.length} Realtors · ${s.contacts.preapprovals.length} Pre-Approvals · ${s.contacts.inprocess.length} Active Files · ${s.contacts.hotleads.length} Hot Leads`,
            action: 'OPEN',
            color: '#4CAF82',
            tab: 'CONTACTS' as Tab,
          },
          {
            label: 'Mailchimp Sync',
            sub: mailchimpConfigured ? 'Connected — Realtor + Borrower lists' : 'Not configured — add keys in Settings',
            action: mailchimpConfigured ? 'READY' : 'CONFIGURE',
            color: mailchimpConfigured ? '#4CAF82' : '#C9A84C',
            href: mailchimpConfigured ? undefined : '/dashboard/settings',
          },
        ].map((item, i) => {
          const handleClick = () => {
            if ('tab' in item && item.tab) {
              // Will be handled by parent — for now just navigate to contacts
              window.location.href = '/dashboard/marketing?tab=contacts'
            } else if ('href' in item && item.href) {
              window.location.href = item.href
            }
          }
          return (
            <div
              key={i}
              onClick={handleClick}
              className="border rounded-sm px-4 py-3 flex flex-col gap-1 cursor-pointer transition-colors hover:border-zinc-500"
              style={{ background: '#18181b', borderColor: '#3f3f46' }}
            >
              <div className="flex items-center justify-between">
                <div className="font-mono text-[10px] font-semibold" style={{ color: '#f4f4f5' }}>{item.label}</div>
                <div
                  className="font-mono text-[8px] px-1.5 py-0.5 rounded-full"
                  style={{ background: item.color + '22', color: item.color }}
                >
                  {item.action}
                </div>
              </div>
              <div className="font-mono text-[9px]" style={{ color: '#71717a' }}>{item.sub}</div>
            </div>
          )
        })}
      </div>

      {/* ── Section D: Analytics ── */}
      <div className="font-mono text-[9px] tracking-widest mt-2" style={{ color: '#71717a' }}>
        D — ANALYTICS · CADENCE + ACTIVITY LOG
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {TRACKERS.slice(0, 4).map(t => {
          const d = daysSince(s.last[t.id])
          const color = statusColor(d, t.freq)
          return (
            <div
              key={t.id}
              className="border rounded-sm px-3 py-3 cursor-pointer hover:border-zinc-500 transition-colors"
              style={{ background: '#18181b', borderColor: '#3f3f46' }}
              onClick={() => onLogTracker(t.id)}
            >
              <div className="font-mono text-[9px] tracking-widest mb-1" style={{ color: '#71717a' }}>{t.name.toUpperCase()}</div>
              <div className="font-mono text-lg font-semibold" style={{ color }}>
                {d === null ? 'Never' : d === 0 ? 'Today' : `${d}d`}
              </div>
              <div className="font-mono text-[8px] mt-0.5" style={{ color: '#52525b' }}>
                {s.last[t.id] ? fmtDate(s.last[t.id]) : '—'} · every {t.freq}d
              </div>
            </div>
          )
        })}
      </div>
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
          style={{ borderColor: '#3f3f46', color: '#f4f4f5' }}
        />
        <Btn onClick={addTodo} variant="gold">ADD</Btn>
      </div>

      <div className="flex flex-col gap-1.5 mb-6">
        {s.todos.map(t => (
          <div key={t.id} className="flex items-center gap-3 px-3 py-2 border" style={{ borderColor: '#3f3f46', background: '#18181b' }}>
            <button onClick={() => completeTodo(t.id)} className="w-4 h-4 border flex-shrink-0 hover:opacity-70 transition-opacity" style={{ borderColor: '#3f3f46' }} />
            <span className="font-mono text-xs flex-1" style={{ color: '#f4f4f5' }}>{t.text}</span>
            <span className="font-mono text-[9px]" style={{ color: '#71717a' }}>{t.created}</span>
            <Btn onClick={() => save({ ...s, todos: s.todos.filter(x => x.id !== t.id) })} variant="danger">×</Btn>
          </div>
        ))}
        {s.todos.length === 0 && (
          <div className="font-mono text-xs" style={{ color: '#71717a' }}>Nothing here. You&apos;re clear.</div>
        )}
      </div>

      {s.doneTodos.length > 0 && (
        <>
          <SectionLabel>COMPLETED</SectionLabel>
          <div className="flex flex-col gap-1.5">
            {s.doneTodos.slice(0, 20).map(t => (
              <div key={t.id} className="flex items-center gap-3 px-3 py-2 border" style={{ borderColor: '#3f3f46', background: '#09090b', opacity: 0.6 }}>
                <div className="w-4 h-4 border flex-shrink-0 flex items-center justify-center" style={{ borderColor: '#4CAF82' }}>
                  <div className="w-2 h-2" style={{ background: '#4CAF82' }} />
                </div>
                <span className="font-mono text-xs flex-1 line-through" style={{ color: '#71717a' }}>{t.text}</span>
                <span className="font-mono text-[9px]" style={{ color: '#71717a' }}>done {t.done_at}</span>
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
  const supabase      = useSupabase()
  const searchParams  = useSearchParams()
  const { userId, loading: orgLoading } = useOrg()
  const [s, setState] = useState<MCCState>(BLANK_STATE)
  const [tab, setTab] = useState<Tab>(() => {
    const p = searchParams?.get('tab')?.toUpperCase() as Tab | undefined
    return p && (TABS as readonly string[]).includes(p) ? p : 'THIS WEEK'
  })
  const [loading, setLoading] = useState(true)

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
    if (orgLoading) return
    if (!userId) { setLoading(false); return }
    supabase
      .from('mcc_state')
      .select('value')
      .eq('user_id', userId)
      .eq('key', 'mcc')
      .single()
      .then(({ data }) => {
        if (data) setState(data.value as MCCState)
        setLoading(false)
      })
  }, [supabase, userId, orgLoading])

  function save(next: MCCState) {
    setState(next)
    if (!userId) return
    supabase
      .from('mcc_state')
      .upsert({ user_id: userId, key: 'mcc', value: next }, { onConflict: 'user_id,key' })
  }

  function toggle(taskId: string, tracker?: string) {
    const isNowChecked = !todayTasks[taskId]
    const dayTasks     = { ...todayTasks, [taskId]: isNowChecked }
    const day          = DAYS[todayDow]
    const task         = day?.tasks.find(t => t.id === taskId)

    let newLog = s.log

    if (isNowChecked && task) {
      // Append to in-memory activity log
      const logEntry: LogEntry = {
        id:       uid(),
        date:     new Date().toISOString(),
        activity: task.label,
        channel:  'Task',
        notes:    `Daily schedule — ${day.name}`,
      }
      newLog = [...s.log, logEntry]

      // Persist to dedicated Supabase table
      if (userId) {
        supabase.from('marketing_activity_log').insert({
          user_id:     userId,
          task_name:   task.label,
          day_of_week: day.name,
          logged_at:   new Date().toISOString(),
          source:      'daily_schedule',
        })
      }
    }

    save({
      ...s,
      tasks: { ...s.tasks, [todayKey]: dayTasks },
      last:  tracker ? { ...s.last, [tracker]: isoDate() } : s.last,
      log:   newLog,
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
    <div className="flex items-center justify-center h-64 font-mono text-xs" style={{ color: '#71717a' }}>
      LOADING…
    </div>
  )

  return (
    <div className="flex flex-col gap-3">

      {/* ── Page Header ── */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-mono text-lg font-bold" style={{ color: '#f4f4f5' }}>Marketing Hub</h1>
          <p className="font-mono text-[10px] mt-0.5" style={{ color: '#71717a' }}>
            Weekly cadence · rate updates · newsletters · calls · social · activity log
          </p>
        </div>
      </div>

      {/* ── Stat Row ── */}
      <StatRow todayDow={todayDow} todayTasks={todayTasks} s={s} isWeekend={isWeekend} />

      {/* ── Overdue Banner ── */}
      <OverdueBanner s={s} onLog={openLogModal} />

      {/* ── Tab nav ── */}
      <div className="flex flex-wrap gap-1">
        {TABS.map(t => {
          const isThisWeek = t === 'THIS WEEK'
          const isActive   = tab === t
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="font-mono text-[10px] tracking-widest px-3 py-1.5 rounded-sm transition-colors"
              style={{
                background: isActive ? '#C9A84C' : isThisWeek ? 'rgba(201,168,76,0.08)' : '#09090b',
                color:      isActive ? '#000000' : isThisWeek ? '#C9A84C' : '#71717a',
                border:     `1px solid ${isActive ? '#C9A84C' : isThisWeek ? 'rgba(201,168,76,0.4)' : '#3f3f46'}`,
                fontWeight: isThisWeek ? 600 : 400,
              }}
            >
              {t}
            </button>
          )
        })}
      </div>

      {/* ── Tab content ── */}
      {tab === 'THIS WEEK'   && <ThisWeekTab s={s} save={save} onLogTracker={openLogModal} />}
      {tab === 'TODAY' && (isWeekend
        ? <div className="font-mono text-xs max-w-sm" style={{ color: '#71717a' }}>
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
