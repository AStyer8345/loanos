'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'

// ── Types (inlined from schedule.ts) ───────────────────────────────────────────

type DayTask = { id: string; e: string; label: string; type: string; tracker?: string }
type DayDef  = { name: string; focus: string; sub: string; tasks: DayTask[] }

// ── Constants (inlined from schedule.ts) ────────────────────────────────────────

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

const TCOLS: Record<string, string> = {
  email: '#5B8FD4', call: '#4CAF82', social: '#9B72CF',
  text: '#C9A84C', video: '#E05252', admin: '#5A5754',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7) }
function isoDate() { return new Date().toISOString().slice(0, 10) }

// ── Local Types ─────────────────────────────────────────────────────────────────

type TaskMap = Record<string, boolean>
type LogEntry = { id: string; date: string; activity: string; channel: string; notes: string }

// ── Component ─────────────────────────────────────────────────────────────────

export default function DailyScheduleWidget() {
  const supabase = useMemo(() => createClient(), [])

  const [userId, setUserId]     = useState<string | null>(null)
  const [todayTasks, setTodayTasks] = useState<TaskMap>({})
  const [mccState, setMccState] = useState<Record<string, unknown>>({})
  const [loading, setLoading]   = useState(true)

  const todayKey  = isoDate()
  const rawDow    = new Date().getDay()
  const isWeekend = rawDow === 0 || rawDow === 6
  // On weekends show Friday's schedule (most relevant carry-over)
  const todayDow  = rawDow === 0 ? 1 : rawDow === 6 ? 5 : rawDow
  const day       = DAYS[todayDow]
  const done      = day.tasks.filter(t => todayTasks[t.id]).length
  const pct       = day.tasks.length > 0 ? Math.round((done / day.tasks.length) * 100) : 0
  const allDone   = done === day.tasks.length

  // Load MCC state from Supabase
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
          if (data?.value) {
            const v = data.value as Record<string, unknown>
            setMccState(v)
            const tasks = (v.tasks as Record<string, TaskMap>) ?? {}
            setTodayTasks(tasks[todayKey] ?? {})
          }
          setLoading(false)
        })
    })
  }, [supabase, todayKey])

  async function toggle(taskId: string, tracker?: string) {
    const isNowChecked = !todayTasks[taskId]
    const next = { ...todayTasks, [taskId]: isNowChecked }
    setTodayTasks(next)

    const task = day.tasks.find(t => t.id === taskId)

    // Build updated mcc blob
    const currentTasks = (mccState.tasks as Record<string, TaskMap>) ?? {}
    const currentLog   = (mccState.log as LogEntry[]) ?? []
    const currentLast  = (mccState.last as Record<string, string>) ?? {}

    let newLog = currentLog
    let newLast = currentLast

    if (isNowChecked && task) {
      const logEntry: LogEntry = {
        id:       uid(),
        date:     new Date().toISOString(),
        activity: task.label,
        channel:  'Task',
        notes:    `Daily schedule — ${day.name}`,
      }
      newLog = [...currentLog, logEntry]
      if (tracker) newLast = { ...currentLast, [tracker]: isoDate() }

      // Log to marketing_activity_log
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

    const updatedMcc = {
      ...mccState,
      tasks: { ...currentTasks, [todayKey]: next },
      log:   newLog,
      last:  newLast,
    }
    setMccState(updatedMcc)

    if (userId) {
      supabase
        .from('mcc_state')
        .upsert({ user_id: userId, key: 'mcc', value: updatedMcc }, { onConflict: 'user_id,key' })
    }
  }

  if (loading) return null
  if (isWeekend) return null // clean dashboard on weekends

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-input">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-widest">
            Today&apos;s Schedule
          </span>
          <span
            className="text-[9px] font-mono px-2 py-0.5 rounded-sm uppercase tracking-wider"
            style={{ background: 'rgba(201,168,76,0.15)', color: '#C9A84C' }}
          >
            {day.name} · {day.focus}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono" style={{ color: allDone ? '#4CAF82' : '#C9A84C' }}>
              {done}/{day.tasks.length}
            </span>
            <div className="w-20 h-1 rounded-full overflow-hidden bg-input">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${pct}%`, background: allDone ? '#4CAF82' : '#C9A84C' }}
              />
            </div>
          </div>
          <Link
            href="/dashboard/marketing"
            className="flex items-center gap-1 text-[10px] font-mono text-[#C9A84C] hover:text-[#d4b860]"
          >
            Full hub <ArrowRight size={10} />
          </Link>
        </div>
      </div>

      {/* Task list */}
      <div className="divide-y divide-input">
        {day.tasks.map(task => {
          const checked = !!todayTasks[task.id]
          return (
            <button
              key={task.id}
              type="button"
              onClick={() => toggle(task.id, task.tracker)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[#1e293b]/40"
              style={{ background: checked ? 'rgba(201,168,76,0.04)' : 'transparent' }}
            >
              {/* Checkbox */}
              <div
                className="w-3.5 h-3.5 border flex-shrink-0 flex items-center justify-center rounded-sm"
                style={{ borderColor: checked ? '#C9A84C' : '#334155' }}
              >
                {checked && <div className="w-2 h-2 rounded-sm" style={{ background: '#C9A84C' }} />}
              </div>

              {/* Emoji */}
              <span className="text-sm flex-shrink-0">{task.e}</span>

              {/* Label */}
              <span
                className="font-mono text-xs flex-1 leading-snug"
                style={{
                  color:          checked ? '#52525b' : '#cbd5e1',
                  textDecoration: checked ? 'line-through' : 'none',
                }}
              >
                {task.label}
              </span>

              {/* Type badge */}
              <span
                className="font-mono text-[9px] px-1.5 py-0.5 rounded-sm flex-shrink-0 uppercase"
                style={{ background: TCOLS[task.type] + '22', color: TCOLS[task.type] }}
              >
                {task.type}
              </span>
            </button>
          )
        })}
      </div>
    </Card>
  )
}
