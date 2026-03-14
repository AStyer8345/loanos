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

type Todo = { id: string; text: string; created: string }
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
    { id: 't1', e: '📧', label: 'Send Borrower Newsletter (Mailchimp)',                                 type: 'email',  tracker: 'borrower-nl' },
    { id: 't2', e: '📞', label: 'Past client call block — birthday / equity check-in',                  type: 'call',   tracker: 'past-client' },
    { id: 't3', e: '📱', label: 'Post — LinkedIn + Facebook (homebuyer tip or testimonial)',            type: 'social', tracker: 'social-post' },
    { id: 't4', e: '📲', label: 'Personal check-in texts — 3–5 warm leads (see Hot Leads)',            type: 'text' },
  ]},
  3: { name: 'Wednesday', focus: 'Loans in Process', sub: 'File updates · No outbound marketing', tasks: [
    { id: 'w1', e: '📞', label: 'Borrower update call — every active file',          type: 'call',  tracker: 'in-process' },
    { id: 'w2', e: '📞', label: "Buyer's agent call — every active file",             type: 'call' },
    { id: 'w3', e: '📞', label: 'Listing agent call — every active file',             type: 'call' },
    { id: 'w4', e: '📋', label: 'Update Salesforce Last Touch on all active files',   type: 'admin' },
  ]},
  4: { name: 'Thursday', focus: 'Pre-Approval Pipeline', sub: 'Pre-approvals · Re-engage · Social', tasks: [
    { id: 'h1', e: '📞', label: 'Call every active pre-approval — showings, timeline, offers',           type: 'call',   tracker: 'preapproval' },
    { id: 'h2', e: '📲', label: 'Re-engage text/email to pre-approvals not actively shopping',           type: 'text' },
    { id: 'h3', e: '📱', label: 'Post — LinkedIn + Facebook (first-time buyer or program content)',      type: 'social', tracker: 'social-post' },
    { id: 'h4', e: '🎥', label: 'Optional: Video — what happens after your offer is accepted',           type: 'video',  tracker: 'video' },
  ]},
  5: { name: 'Friday', focus: 'Realtor Weekend Push', sub: 'Deal updates · Rate text · Wrap up', tasks: [
    { id: 'f1', e: '📞', label: 'Quick calls to realtors on active deals — weekend heads-up',           type: 'call',  tracker: 'realtor-calls' },
    { id: 'f2', e: '📲', label: 'Rate update text or email to top 10–15 realtor partners',              type: 'text',  tracker: 'rate-update' },
    { id: 'f3', e: '📱', label: 'Post — LinkedIn + Facebook (end of week value-add or personal)',        type: 'social', tracker: 'social-post' },
    { id: 'f4', e: '📋', label: 'Log all week activity, prep for Monday',                               type: 'admin' },
  ]},
}

const TRACKERS = [
  { id: 'realtor-nl',    name: 'Realtor Newsletter',  channel: 'Email · Mailchimp',  freq: 7 },
  { id: 'borrower-nl',   name: 'Borrower Newsletter', channel: 'Email · Mailchimp',  freq: 7 },
  { id: 'rate-update',   name: 'Rate Update',         channel: 'Email + Text',       freq: 7 },
  { id: 'social-post',   name: 'Social Post',         channel: 'LinkedIn + Meta',    freq: 2 },
  { id: 'realtor-calls', name: 'Realtor Calls',       channel: 'Phone · Mon + Fri',  freq: 7 },
  { id: 'past-client',   name: 'Past Client Calls',   channel: 'Phone · Tuesday',    freq: 7 },
  { id: 'preapproval',   name: 'Pre-Approval Calls',  channel: 'Phone · Thursday',   freq: 7 },
  { id: 'in-process',    name: 'In-Process Calls',    channel: 'Phone · Wednesday',  freq: 7 },
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7) }
function isoDate() { return new Date().toISOString().slice(0, 10) }

function daysSince(iso: string | undefined): number | null {
  if (!iso) return null
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
}

function statusColor(days: number | null, freq: number): string {
  if (days === null) return '#E05252'
  if (days <= freq) return '#4CAF82'
  if (days <= freq * 1.5) return '#C9A84C'
  return '#E05252'
}

// ── Shared UI atoms ───────────────────────────────────────────────────────────

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`border rounded-sm p-4 ${className}`}
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
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

function Input({ value, onChange, placeholder, className = '' }: {
  value: string; onChange: (v: string) => void; placeholder?: string; className?: string
}) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={`bg-transparent border-b font-mono text-xs px-1 py-0.5 outline-none w-full ${className}`}
      style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
    />
  )
}

function Btn({ onClick, children, variant = 'default' }: {
  onClick: () => void; children: React.ReactNode; variant?: 'default' | 'gold' | 'danger'
}) {
  const colors = {
    default: { color: 'var(--muted)', border: 'var(--border)' },
    gold:    { color: 'var(--gold)',  border: 'var(--gold)' },
    danger:  { color: '#E05252',      border: '#E05252' },
  }[variant]
  return (
    <button
      onClick={onClick}
      className="font-mono text-[10px] tracking-widest border px-2 py-1 transition-opacity hover:opacity-70"
      style={{ color: colors.color, borderColor: colors.border }}
    >
      {children}
    </button>
  )
}

// ── TODAY tab ─────────────────────────────────────────────────────────────────

function TodayTab({
  todayDow, todayTasks, toggle,
}: {
  todayDow: number
  todayTasks: Record<string, boolean>
  toggle: (taskId: string, tracker?: string) => void
}) {
  const day = DAYS[todayDow]
  const done = day.tasks.filter(t => todayTasks[t.id]).length

  return (
    <div className="max-w-2xl">
      <Card>
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="font-display tracking-widest text-base" style={{ color: 'var(--gold)' }}>
              {day.name.toUpperCase()}
            </div>
            <div className="font-mono text-xs mt-0.5" style={{ color: 'var(--text)' }}>{day.focus}</div>
            <div className="font-mono text-[10px] mt-0.5" style={{ color: 'var(--muted)' }}>{day.sub}</div>
          </div>
          <div className="font-mono text-[10px] text-right" style={{ color: 'var(--muted)' }}>
            <span style={{ color: done === day.tasks.length ? '#4CAF82' : 'var(--gold)' }}>
              {done}/{day.tasks.length}
            </span> COMPLETE
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
                <span className="font-mono text-[10px]">{task.e}</span>
                <span
                  className="font-mono text-xs flex-1"
                  style={{
                    color: checked ? 'var(--muted)' : 'var(--text)',
                    textDecoration: checked ? 'line-through' : 'none',
                  }}
                >
                  {task.label}
                </span>
                <span
                  className="font-mono text-[9px] px-1.5 py-0.5 rounded-sm"
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
  )
}

// ── WEEK tab ──────────────────────────────────────────────────────────────────

function WeekTab({ s, todayKey }: { s: MCCState; todayKey: string }) {
  // Build Mon–Fri dates for the current week
  const todayDate  = new Date()
  const dow        = todayDate.getDay() // 0=Sun
  const mondayDate = new Date(todayDate)
  mondayDate.setDate(todayDate.getDate() - (dow === 0 ? 6 : dow - 1))

  const weekDays = [1, 2, 3, 4, 5].map(d => {
    const date = new Date(mondayDate)
    date.setDate(mondayDate.getDate() + (d - 1))
    const key = date.toISOString().slice(0, 10)
    const tasks = s.tasks[key] ?? {}
    const day   = DAYS[d]
    const done  = day.tasks.filter(t => tasks[t.id]).length
    return { d, key, date, day, tasks, done }
  })

  return (
    <div className="flex flex-col gap-3 max-w-3xl">
      <SectionLabel>WEEK AT A GLANCE</SectionLabel>
      {weekDays.map(({ d, key, date, day, done }) => {
        const isToday = key === todayKey
        const pct = Math.round((done / day.tasks.length) * 100)
        return (
          <Card key={d}>
            <div className="flex items-center gap-4">
              <div className="w-20 flex-shrink-0">
                <div
                  className="font-display tracking-widest text-sm"
                  style={{ color: isToday ? 'var(--gold)' : 'var(--text)' }}
                >
                  {day.name.slice(0, 3).toUpperCase()}
                </div>
                <div className="font-mono text-[10px]" style={{ color: 'var(--muted)' }}>
                  {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
              <div className="flex-1">
                <div className="font-mono text-[10px] mb-1" style={{ color: 'var(--muted)' }}>{day.focus}</div>
                <div className="h-1 rounded-full" style={{ background: 'var(--border)' }}>
                  <div
                    className="h-1 rounded-full transition-all"
                    style={{ width: `${pct}%`, background: pct === 100 ? '#4CAF82' : 'var(--gold)' }}
                  />
                </div>
              </div>
              <div className="font-mono text-[10px] w-16 text-right" style={{ color: 'var(--muted)' }}>
                <span style={{ color: done === day.tasks.length ? '#4CAF82' : 'var(--text)' }}>
                  {done}/{day.tasks.length}
                </span>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

// ── CONTACTS tab ──────────────────────────────────────────────────────────────

function ContactsTab({ s, save }: { s: MCCState; save: (next: MCCState) => void }) {
  const [list, setList] = useState<ListKey>('realtors')
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [callNote, setCallNote] = useState<{ id: string; note: string } | null>(null)

  const BLANK_C: Omit<MCCContact, 'id' | 'callHistory' | 'calledToday'> = {
    first: '', last: '', company: '', phone: '', email: '', lastTouch: null, note: '',
  }
  const [form, setForm] = useState({ ...BLANK_C })

  const contacts = s.contacts[list]

  function addContact() {
    const c: MCCContact = { ...form, id: uid(), callHistory: [], calledToday: false }
    const next = { ...s, contacts: { ...s.contacts, [list]: [c, ...contacts] } }
    save(next)
    setForm({ ...BLANK_C })
    setShowAdd(false)
  }

  function updateContact(id: string, patch: Partial<MCCContact>) {
    const next = { ...s, contacts: { ...s.contacts, [list]: contacts.map(c => c.id === id ? { ...c, ...patch } : c) } }
    save(next)
  }

  function deleteContact(id: string) {
    if (!confirm('Delete this contact?')) return
    const next = { ...s, contacts: { ...s.contacts, [list]: contacts.filter(c => c.id !== id) } }
    save(next)
  }

  function logCall(id: string, note: string) {
    const today = isoDate()
    const entry = { date: today, note }
    const next = { ...s, contacts: { ...s.contacts, [list]: contacts.map(c =>
      c.id === id
        ? { ...c, calledToday: true, lastTouch: today, callHistory: [entry, ...c.callHistory] }
        : c
    )}}
    save(next)
    setCallNote(null)
  }

  return (
    <div className="max-w-3xl">
      {/* List selector */}
      <div className="flex gap-1 mb-4">
        {LIST_KEYS.map(k => (
          <button
            key={k}
            onClick={() => setList(k)}
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

      {/* Add form */}
      {showAdd ? (
        <Card className="mb-4">
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
      ) : (
        <div className="mb-4">
          <Btn onClick={() => setShowAdd(true)} variant="gold">+ ADD {LIST_META[list].label.toUpperCase()}</Btn>
        </div>
      )}

      {/* Contact list */}
      {contacts.length === 0 && (
        <div className="font-mono text-xs" style={{ color: 'var(--muted)' }}>No contacts in this list.</div>
      )}
      <div className="flex flex-col gap-2">
        {contacts.map(c => {
          const isEdit = editId === c.id
          const days   = daysSince(c.lastTouch ?? undefined)
          return (
            <Card key={c.id}>
              {isEdit ? (
                <>
                  <SectionLabel>EDITING</SectionLabel>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {(['first', 'last', 'company', 'phone', 'email', 'note'] as const).map(f => (
                      <div key={f} className={f === 'note' ? 'col-span-2' : ''}>
                        <div className="font-mono text-[9px] mb-1" style={{ color: 'var(--muted)' }}>{f.toUpperCase()}</div>
                        <Input value={String(c[f] ?? '')} onChange={v => updateContact(c.id, { [f]: v })} />
                      </div>
                    ))}
                  </div>
                  <Btn onClick={() => setEditId(null)}>DONE</Btn>
                </>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {c.calledToday && (
                        <span className="font-mono text-[9px] px-1 rounded-sm" style={{ background: '#4CAF8222', color: '#4CAF82' }}>CALLED</span>
                      )}
                      <span className="font-mono text-xs font-semibold" style={{ color: 'var(--text)' }}>
                        {c.first} {c.last}
                      </span>
                      {c.company && (
                        <span className="font-mono text-[10px]" style={{ color: 'var(--muted)' }}>· {c.company}</span>
                      )}
                    </div>
                    {c.phone && <div className="font-mono text-[10px]" style={{ color: 'var(--muted)' }}>{c.phone}</div>}
                    {c.note  && <div className="font-mono text-[10px] mt-1" style={{ color: 'var(--text)' }}>{c.note}</div>}
                    {days !== null && (
                      <div className="font-mono text-[9px] mt-1" style={{ color: 'var(--muted)' }}>
                        Last touch: <span style={{ color: days > 30 ? '#E05252' : days > 14 ? '#C9A84C' : '#4CAF82' }}>{days}d ago</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <Btn onClick={() => setCallNote({ id: c.id, note: '' })}>LOG CALL</Btn>
                    <Btn onClick={() => setEditId(c.id)}>EDIT</Btn>
                    <Btn onClick={() => deleteContact(c.id)} variant="danger">×</Btn>
                  </div>
                </div>
              )}

              {/* Call note entry */}
              {callNote?.id === c.id && (
                <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                  <div className="font-mono text-[9px] mb-1" style={{ color: 'var(--muted)' }}>CALL NOTE</div>
                  <Input value={callNote.note} onChange={v => setCallNote({ id: c.id, note: v })} placeholder="What was discussed…" />
                  <div className="flex gap-2 mt-2">
                    <Btn onClick={() => logCall(c.id, callNote.note)} variant="gold">SAVE</Btn>
                    <Btn onClick={() => setCallNote(null)}>CANCEL</Btn>
                  </div>
                </div>
              )}

              {/* Call history */}
              {c.callHistory.length > 0 && !isEdit && (
                <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                  <div className="font-mono text-[9px] mb-1" style={{ color: 'var(--muted)' }}>CALL HISTORY</div>
                  {c.callHistory.slice(0, 3).map((h, i) => (
                    <div key={i} className="font-mono text-[10px] mb-0.5" style={{ color: 'var(--muted)' }}>
                      <span style={{ color: 'var(--text)' }}>{h.date}</span> — {h.note || 'No note'}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}

// ── SOCIAL tab ────────────────────────────────────────────────────────────────

function SocialTab({ s, save }: { s: MCCState; save: (next: MCCState) => void }) {
  const BLANK: Omit<SocialPost, 'id'> = { platform: 'LinkedIn + Facebook', caption: '', url: '', date: isoDate(), notes: '' }
  const [form, setForm] = useState({ ...BLANK })
  const [showAdd, setShowAdd] = useState(false)

  function addPost() {
    const post: SocialPost = { ...form, id: uid() }
    save({ ...s, socialPosts: [post, ...s.socialPosts] })
    setForm({ ...BLANK })
    setShowAdd(false)
  }

  function deletePost(id: string) {
    save({ ...s, socialPosts: s.socialPosts.filter(p => p.id !== id) })
  }

  return (
    <div className="max-w-2xl">
      <SectionLabel>SOCIAL POST LOG</SectionLabel>
      {showAdd ? (
        <Card className="mb-4">
          <div className="flex flex-col gap-3">
            {(['platform', 'caption', 'url', 'date', 'notes'] as const).map(f => (
              <div key={f}>
                <div className="font-mono text-[9px] mb-1" style={{ color: 'var(--muted)' }}>{f.toUpperCase()}</div>
                <Input value={(form as Record<string, string>)[f]} onChange={v => setForm(p => ({ ...p, [f]: v }))} />
              </div>
            ))}
            <div className="flex gap-2">
              <Btn onClick={addPost} variant="gold">ADD POST</Btn>
              <Btn onClick={() => setShowAdd(false)}>CANCEL</Btn>
            </div>
          </div>
        </Card>
      ) : (
        <div className="mb-4"><Btn onClick={() => setShowAdd(true)} variant="gold">+ LOG POST</Btn></div>
      )}

      <div className="flex flex-col gap-2">
        {s.socialPosts.map(p => (
          <Card key={p.id}>
            <div className="flex justify-between items-start">
              <div>
                <div className="font-mono text-xs" style={{ color: 'var(--text)' }}>{p.date} · {p.platform}</div>
                {p.caption && <div className="font-mono text-[10px] mt-1" style={{ color: 'var(--muted)' }}>{p.caption}</div>}
                {p.url && <div className="font-mono text-[10px] mt-1" style={{ color: '#5B8FD4' }}>{p.url}</div>}
              </div>
              <Btn onClick={() => deletePost(p.id)} variant="danger">×</Btn>
            </div>
          </Card>
        ))}
        {s.socialPosts.length === 0 && (
          <div className="font-mono text-xs" style={{ color: 'var(--muted)' }}>No posts logged yet.</div>
        )}
      </div>
    </div>
  )
}

// ── NEWSLETTERS tab ───────────────────────────────────────────────────────────

function NewslettersTab({ s, save }: { s: MCCState; save: (next: MCCState) => void }) {
  const BLANK: Omit<Newsletter, 'id'> = { audience: 'Realtors', subject: '', date: isoDate(), mailchimpUrl: '', openRate: '', notes: '' }
  const [form, setForm] = useState({ ...BLANK })
  const [showAdd, setShowAdd] = useState(false)

  function addNL() {
    const nl: Newsletter = { ...form, id: uid() }
    save({ ...s, newsletters: [nl, ...s.newsletters] })
    setForm({ ...BLANK })
    setShowAdd(false)
  }

  return (
    <div className="max-w-2xl">
      <SectionLabel>NEWSLETTER LOG</SectionLabel>
      {showAdd ? (
        <Card className="mb-4">
          <div className="flex flex-col gap-3">
            {(['audience', 'subject', 'date', 'mailchimpUrl', 'openRate', 'notes'] as const).map(f => (
              <div key={f}>
                <div className="font-mono text-[9px] mb-1" style={{ color: 'var(--muted)' }}>
                  {f === 'mailchimpUrl' ? 'MAILCHIMP URL' : f === 'openRate' ? 'OPEN RATE' : f.toUpperCase()}
                </div>
                <Input value={(form as Record<string, string>)[f]} onChange={v => setForm(p => ({ ...p, [f]: v }))} />
              </div>
            ))}
            <div className="flex gap-2">
              <Btn onClick={addNL} variant="gold">ADD</Btn>
              <Btn onClick={() => setShowAdd(false)}>CANCEL</Btn>
            </div>
          </div>
        </Card>
      ) : (
        <div className="mb-4"><Btn onClick={() => setShowAdd(true)} variant="gold">+ LOG NEWSLETTER</Btn></div>
      )}

      <div className="flex flex-col gap-2">
        {s.newsletters.map(n => (
          <Card key={n.id}>
            <div className="flex justify-between items-start">
              <div>
                <div className="font-mono text-xs" style={{ color: 'var(--text)' }}>
                  {n.date} · {n.audience}
                </div>
                {n.subject && <div className="font-mono text-[10px] mt-1" style={{ color: 'var(--muted)' }}>{n.subject}</div>}
                {n.openRate && <div className="font-mono text-[10px] mt-0.5" style={{ color: '#4CAF82' }}>Open rate: {n.openRate}</div>}
              </div>
              <Btn onClick={() => save({ ...s, newsletters: s.newsletters.filter(x => x.id !== n.id) })} variant="danger">×</Btn>
            </div>
          </Card>
        ))}
        {s.newsletters.length === 0 && (
          <div className="font-mono text-xs" style={{ color: 'var(--muted)' }}>No newsletters logged yet.</div>
        )}
      </div>
    </div>
  )
}

// ── TRACKER tab ───────────────────────────────────────────────────────────────

function TrackerTab({ s }: { s: MCCState }) {
  return (
    <div className="max-w-2xl">
      <SectionLabel>LAST DEPLOYED — CADENCE TRACKER</SectionLabel>
      <div className="flex flex-col gap-2">
        {TRACKERS.map(t => {
          const days = daysSince(s.last[t.id])
          const color = statusColor(days, t.freq)
          return (
            <Card key={t.id}>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="font-mono text-xs" style={{ color: 'var(--text)' }}>{t.name}</div>
                  <div className="font-mono text-[10px] mt-0.5" style={{ color: 'var(--muted)' }}>{t.channel} · every {t.freq}d</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-xs" style={{ color }}>
                    {days === null ? 'NEVER' : `${days}d AGO`}
                  </div>
                  {s.last[t.id] && (
                    <div className="font-mono text-[9px]" style={{ color: 'var(--muted)' }}>
                      {new Date(s.last[t.id]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  )}
                </div>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

// ── LOG tab ───────────────────────────────────────────────────────────────────

function LogTab({ s, save }: { s: MCCState; save: (next: MCCState) => void }) {
  const BLANK: Omit<LogEntry, 'id'> = { date: isoDate(), activity: '', channel: 'Call', notes: '' }
  const [form, setForm] = useState({ ...BLANK })
  const CHANNELS = ['Call', 'Email', 'Text', 'Social', 'Video', 'In-Person', 'Admin']

  function addEntry() {
    if (!form.activity.trim()) return
    const entry: LogEntry = { ...form, id: uid() }
    save({ ...s, log: [entry, ...s.log] })
    setForm({ ...BLANK })
  }

  return (
    <div className="max-w-2xl">
      <SectionLabel>ACTIVITY LOG</SectionLabel>

      <Card className="mb-4">
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="font-mono text-[9px] mb-1" style={{ color: 'var(--muted)' }}>DATE</div>
              <Input value={form.date} onChange={v => setForm(p => ({ ...p, date: v }))} />
            </div>
            <div>
              <div className="font-mono text-[9px] mb-1" style={{ color: 'var(--muted)' }}>CHANNEL</div>
              <select
                value={form.channel}
                onChange={e => setForm(p => ({ ...p, channel: e.target.value }))}
                className="bg-transparent border-b font-mono text-xs px-1 py-0.5 outline-none w-full"
                style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
              >
                {CHANNELS.map(c => <option key={c} value={c} style={{ background: '#1a1a1a' }}>{c}</option>)}
              </select>
            </div>
            <div />
          </div>
          <div>
            <div className="font-mono text-[9px] mb-1" style={{ color: 'var(--muted)' }}>ACTIVITY</div>
            <Input value={form.activity} onChange={v => setForm(p => ({ ...p, activity: v }))} placeholder="What did you do?" />
          </div>
          <div>
            <div className="font-mono text-[9px] mb-1" style={{ color: 'var(--muted)' }}>NOTES</div>
            <Input value={form.notes} onChange={v => setForm(p => ({ ...p, notes: v }))} placeholder="Details…" />
          </div>
          <Btn onClick={addEntry} variant="gold">LOG ACTIVITY</Btn>
        </div>
      </Card>

      <div className="flex flex-col gap-2">
        {s.log.map(entry => (
          <Card key={entry.id}>
            <div className="flex justify-between items-start">
              <div>
                <div className="font-mono text-[10px]" style={{ color: 'var(--muted)' }}>
                  {entry.date} · <span style={{ color: TCOLS[entry.channel.toLowerCase()] ?? 'var(--text)' }}>{entry.channel.toUpperCase()}</span>
                </div>
                <div className="font-mono text-xs mt-1" style={{ color: 'var(--text)' }}>{entry.activity}</div>
                {entry.notes && <div className="font-mono text-[10px] mt-0.5" style={{ color: 'var(--muted)' }}>{entry.notes}</div>}
              </div>
              <Btn onClick={() => save({ ...s, log: s.log.filter(x => x.id !== entry.id) })} variant="danger">×</Btn>
            </div>
          </Card>
        ))}
        {s.log.length === 0 && (
          <div className="font-mono text-xs" style={{ color: 'var(--muted)' }}>No activity logged yet.</div>
        )}
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
    save({ ...s, todos: s.todos.filter(t => t.id !== id), doneTodos: [done, ...s.doneTodos] })
  }

  function deleteTodo(id: string) {
    save({ ...s, todos: s.todos.filter(t => t.id !== id) })
  }

  function deleteDone(id: string) {
    save({ ...s, doneTodos: s.doneTodos.filter(t => t.id !== id) })
  }

  return (
    <div className="max-w-xl">
      <SectionLabel>BRAIN DUMP / TODO</SectionLabel>

      <div className="flex gap-2 mb-4">
        <div className="flex-1">
          <Input
            value={text}
            onChange={setText}
            placeholder="Capture anything on your mind…"
          />
        </div>
        <Btn onClick={addTodo} variant="gold">ADD</Btn>
      </div>

      {/* Active todos */}
      <div className="flex flex-col gap-1.5 mb-6">
        {s.todos.map(t => (
          <div
            key={t.id}
            className="flex items-center gap-3 px-3 py-2 border"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
          >
            <button
              onClick={() => completeTodo(t.id)}
              className="w-4 h-4 border flex-shrink-0"
              style={{ borderColor: 'var(--border)' }}
            />
            <span className="font-mono text-xs flex-1" style={{ color: 'var(--text)' }}>{t.text}</span>
            <span className="font-mono text-[9px]" style={{ color: 'var(--muted)' }}>{t.created}</span>
            <Btn onClick={() => deleteTodo(t.id)} variant="danger">×</Btn>
          </div>
        ))}
        {s.todos.length === 0 && (
          <div className="font-mono text-xs" style={{ color: 'var(--muted)' }}>Nothing here. Brain dump away.</div>
        )}
      </div>

      {/* Done todos */}
      {s.doneTodos.length > 0 && (
        <>
          <SectionLabel>COMPLETED</SectionLabel>
          <div className="flex flex-col gap-1.5">
            {s.doneTodos.slice(0, 20).map(t => (
              <div
                key={t.id}
                className="flex items-center gap-3 px-3 py-2 border"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)', opacity: 0.6 }}
              >
                <div className="w-4 h-4 border flex-shrink-0 flex items-center justify-center" style={{ borderColor: '#4CAF82' }}>
                  <div className="w-2 h-2" style={{ background: '#4CAF82' }} />
                </div>
                <span className="font-mono text-xs flex-1 line-through" style={{ color: 'var(--muted)' }}>{t.text}</span>
                <span className="font-mono text-[9px]" style={{ color: 'var(--muted)' }}>done {t.done_at}</span>
                <Btn onClick={() => deleteDone(t.id)} variant="danger">×</Btn>
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
  const [s, setState] = useState<MCCState>(BLANK_STATE)
  const [tab, setTab] = useState<Tab>('TODAY')
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  const todayKey = isoDate()
  const todayDow = new Date().getDay()
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
    const next: MCCState = {
      ...s,
      tasks: { ...s.tasks, [todayKey]: dayTasks },
      last: tracker ? { ...s.last, [tracker]: isoDate() } : s.last,
    }
    save(next)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64 font-mono text-xs" style={{ color: 'var(--muted)' }}>
      LOADING…
    </div>
  )

  return (
    <div className="flex flex-col gap-4">
      {/* Tab nav */}
      <div className="flex flex-wrap gap-1">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="font-mono text-[10px] tracking-widest px-3 py-1.5 rounded-sm transition-colors"
            style={{
              background: tab === t ? 'var(--gold)' : 'var(--bg)',
              color: tab === t ? 'var(--bg-deep)' : 'var(--muted)',
              border: `1px solid ${tab === t ? 'var(--gold)' : 'var(--border)'}`,
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'TODAY'       && <TodayTab todayDow={todayDow} todayTasks={todayTasks} toggle={toggle} />}
      {tab === 'WEEK'        && <WeekTab s={s} todayKey={todayKey} />}
      {tab === 'CONTACTS'    && <ContactsTab s={s} save={save} />}
      {tab === 'SOCIAL'      && <SocialTab s={s} save={save} />}
      {tab === 'NEWSLETTERS' && <NewslettersTab s={s} save={save} />}
      {tab === 'TRACKER'     && <TrackerTab s={s} />}
      {tab === 'LOG'         && <LogTab s={s} save={save} />}
      {tab === 'BRAIN DUMP'  && <BrainDumpTab s={s} save={save} />}
    </div>
  )
}
