'use client'

import { useState } from 'react'
import { type MCCState, type LogEntry, LOG_CHANNELS, type LogChannel } from '@/lib/marketing/types'
import { TRACKERS } from '@/lib/marketing/schedule'
import { currentWeekBoundaries, channelToType, formatWeekLabel } from '@/lib/marketing/utils'
import { SectionLabel, FieldLabel, Input, Textarea, Btn, TypeBadge, CadenceBadge } from './shared'

type Props = {
  mccState: MCCState
  onSave:   (next: MCCState) => Promise<void>
}

export default function HistoryTab({ mccState, onSave }: Props) {
  const [weekOffset, setWeekOffset] = useState(0)
  const [showLogForm, setShowLogForm] = useState(false)
  const [logForm, setLogForm] = useState<{
    activity: string
    channel:  LogChannel
    date:     string
    notes:    string
  }>({
    activity: '', channel: 'Task', date: new Date().toISOString().slice(0, 10), notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  // ── Week boundaries ────────────────────────────────────────────────────────
  const { start, end } = currentWeekBoundaries(weekOffset)
  const weekLabel = formatWeekLabel(start, end)
  const isCurrentWeek = weekOffset === 0

  // ── Filter log entries for selected week ───────────────────────────────────
  // entry.date is stored as UTC-noon anchor (T12:00:00) which keeps it
  // within the correct local day for UTC-12 through UTC+12 timezones.
  const weekEntries = (mccState.log ?? []).filter(entry => {
    const d = new Date(entry.date)
    return d >= start && d <= end
  })

  // ── Manual log entry ───────────────────────────────────────────────────────
  const handleSaveLog = async () => {
    if (!logForm.activity.trim()) return
    setSaving(true)
    setSaveError('')
    try {
      const entry: LogEntry = {
        id:       crypto.randomUUID(),
        date:     new Date(logForm.date + 'T12:00:00').toISOString(),
        activity: logForm.activity,
        channel:  logForm.channel,
        notes:    logForm.notes,
      }

      // Update social-post tracker if LinkedIn or Facebook
      const trackerUpdates: Record<string, string> = {}
      if (logForm.channel === 'LinkedIn' || logForm.channel === 'Facebook') {
        trackerUpdates['social-post'] = new Date(logForm.date + 'T12:00:00').toISOString()
      }

      const nextState: MCCState = {
        ...mccState,
        log:  [entry, ...(mccState.log ?? [])],
        last: { ...mccState.last, ...trackerUpdates },
      }
      await onSave(nextState)
      setLogForm({ activity: '', channel: 'Task', date: new Date().toISOString().slice(0, 10), notes: '' })
      setShowLogForm(false)
    } catch {
      setSaveError('Save failed. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Week navigation */}
      <div className="flex items-center gap-3">
        <Btn variant="ghost" size="xs" onClick={() => setWeekOffset(w => w - 1)}>← PREV</Btn>
        <span className="text-zinc-300 text-xs font-bold">
          {weekLabel}{isCurrentWeek ? ' · This Week' : ''}
        </span>
        <Btn variant="ghost" size="xs" onClick={() => setWeekOffset(w => w + 1)} disabled={isCurrentWeek}>
          NEXT →
        </Btn>
      </div>

      {/* Cadence health strip */}
      <div className="flex flex-wrap gap-2">
        {TRACKERS.map(t => (
          <CadenceBadge
            key={t.key}
            label={t.label}
            lastTimestamp={mccState.last[t.key] ?? null}
            freqDays={t.freq}
            showDaysAgo
          />
        ))}
      </div>

      {/* Manual log button + section label */}
      <div className="flex justify-between items-center">
        <SectionLabel>ACTIVITY LOG</SectionLabel>
        <Btn variant="ghost" size="xs" onClick={() => { setShowLogForm(s => !s); setSaveError('') }}>
          + LOG ACTIVITY
        </Btn>
      </div>

      {/* Manual log form */}
      {showLogForm && (
        <div className="bg-zinc-900 border border-zinc-700 rounded-sm p-4 space-y-3">
          <div>
            <FieldLabel>ACTIVITY *</FieldLabel>
            <Input
              placeholder="What did you do?"
              value={logForm.activity}
              onChange={e => setLogForm(p => ({ ...p, activity: e.target.value }))}
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>CHANNEL</FieldLabel>
              <select
                value={logForm.channel}
                onChange={e => setLogForm(p => ({ ...p, channel: e.target.value as LogChannel }))}
                className="w-full bg-zinc-950 border border-zinc-600 text-zinc-100 text-xs rounded-sm px-2 py-1.5 focus:outline-none"
                style={{ fontFamily: 'inherit' }}
              >
                {LOG_CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <FieldLabel>DATE</FieldLabel>
              <Input
                type="date"
                value={logForm.date}
                onChange={e => setLogForm(p => ({ ...p, date: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <FieldLabel>NOTES</FieldLabel>
            <Textarea
              rows={2}
              placeholder="Optional..."
              value={logForm.notes}
              onChange={e => setLogForm(p => ({ ...p, notes: e.target.value }))}
            />
          </div>
          {saveError && <p className="text-red-400 text-xs">{saveError}</p>}
          <div className="flex gap-2">
            <Btn onClick={handleSaveLog} disabled={saving || !logForm.activity.trim()}>
              {saving ? 'Saving...' : 'Save Entry'}
            </Btn>
            <Btn variant="ghost" onClick={() => { setShowLogForm(false); setSaveError('') }}>Cancel</Btn>
          </div>
        </div>
      )}

      {/* Log table */}
      {weekEntries.length === 0 ? (
        <div className="text-center py-12 text-zinc-600">
          <p className="text-sm">Nothing logged this week.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500" style={{ fontSize: 9, letterSpacing: '0.12em' }}>
                <th className="text-left pb-2 pr-4 font-bold">DATE</th>
                <th className="text-left pb-2 pr-4 font-bold">ACTIVITY</th>
                <th className="text-left pb-2 pr-4 font-bold">TYPE</th>
                <th className="text-left pb-2 font-bold">CHANNEL</th>
              </tr>
            </thead>
            <tbody>
              {weekEntries.map(entry => (
                <tr key={entry.id} className="border-b border-zinc-900 hover:bg-zinc-900 transition-colors">
                  <td className="py-2 pr-4 text-zinc-500 whitespace-nowrap">
                    {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </td>
                  <td className="py-2 pr-4 text-zinc-200">
                    {entry.activity}
                    {entry.notes && (
                      <span className="text-zinc-600 ml-2" style={{ fontSize: 10 }}>· {entry.notes}</span>
                    )}
                  </td>
                  <td className="py-2 pr-4">
                    <TypeBadge type={channelToType(entry.channel)} />
                  </td>
                  <td className="py-2 text-zinc-400">{entry.channel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
