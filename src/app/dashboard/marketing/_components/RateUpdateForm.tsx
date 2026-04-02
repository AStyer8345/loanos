'use client'

import { useState, useCallback } from 'react'
import { Card, SectionLabel, FieldLabel, Input, Textarea, Btn, Banner, Spinner, CadenceBadge } from './shared'
import { aprForProduct, buildRatesString } from '@/lib/marketing/utils'
import { DEFAULT_RATE_ROWS, type RateRow, type MCCState, type LogEntry } from '@/lib/marketing/types'
import { TRACKERS } from '@/lib/marketing/schedule'

const NETLIFY_URL = 'https://styermortgage.com/.netlify/functions/generate-rate-update'
const GOLD = 'var(--primary)'

type RatePreview = {
  pageTitle:         string
  pageUrl:           string
  borrowerSubject:   string
  borrowerPreheader: string
  realtorSubject:    string
  realtorPreheader:  string
}

type Props = {
  mccState:  MCCState
  onSave:    (next: MCCState) => Promise<void>
}

export default function RateUpdateForm({ mccState, onSave }: Props) {
  const [rows, setRows]           = useState<RateRow[]>(DEFAULT_RATE_ROWS.map(r => ({ ...r })))
  const [audiences, setAudiences] = useState<string[]>(['borrower', 'realtor'])
  const [direction, setDirection] = useState('')
  const [depth, setDepth]         = useState('standard')
  const [blurb, setBlurb]         = useState('')
  const [notes, setNotes]         = useState('')

  const [preview, setPreview]         = useState<RatePreview | null>(null)
  const [status, setStatus]           = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg]       = useState('')
  const [showSchedule, setShowSchedule] = useState(false)
  const [scheduleTime, setScheduleTime] = useState('')
  const [showConfirm, setShowConfirm]   = useState(false)

  const rateTracker = TRACKERS.find(t => t.key === 'rate-update')!

  // ── APR auto-calc ──────────────────────────────────────────────────────────
  const handleRateChange = useCallback((idx: number, val: string) => {
    setRows(prev => {
      const next = [...prev]
      const num = parseFloat(val)
      const apr = !isNaN(num)
        ? String(Math.round(aprForProduct(next[idx].product, num) * 1000) / 1000)
        : ''
      next[idx] = { ...next[idx], rate: val, apr }
      return next
    })
  }, [])

  const handleAprChange = useCallback((idx: number, val: string) => {
    setRows(prev => { const n = [...prev]; n[idx] = { ...n[idx], apr: val }; return n })
  }, [])

  const toggleAudience = (a: string) =>
    setAudiences(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a])

  // ── Build payload ──────────────────────────────────────────────────────────
  const buildPayload = (mode: string, extraScheduleTime?: string) => ({
    rates:     buildRatesString(rows),
    direction,
    blurb,
    notes,
    depth,
    audiences,
    mode,
    ...(extraScheduleTime ? { scheduleTime: extraScheduleTime } : {}),
  })

  // ── Preview ────────────────────────────────────────────────────────────────
  const handlePreview = async () => {
    setStatus('loading')
    setErrorMsg('')
    setPreview(null)
    try {
      const res = await fetch(NETLIFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload('preview')),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }
      const data = await res.json()
      setPreview(data.preview)
      setStatus('done')
    } catch (e: unknown) {
      setErrorMsg(`Netlify error: ${e instanceof Error ? e.message : String(e)}`)
      setStatus('error')
    }
  }

  // ── Publish ────────────────────────────────────────────────────────────────
  const handlePublish = async (scheduledTime?: string) => {
    setStatus('loading')
    setErrorMsg('')
    try {
      const res = await fetch(NETLIFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload('live', scheduledTime)),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }
      const data = await res.json()

      // ── auto-log to HISTORY ────────────────────────────────────────────────
      const rate30yr = rows.find(r => r.product === '30-Yr Fixed')?.rate ?? ''
      const entry: LogEntry = {
        id:       crypto.randomUUID(),
        date:     new Date().toISOString(),
        activity: `Rate Update sent${rate30yr ? ` — 30yr ${rate30yr}%` : ''}`,
        channel:  'Rate Update',
        notes:    scheduledTime ? `${blurb} (email scheduled for ${scheduledTime})` : blurb,
      }

      const nextState: MCCState = {
        ...mccState,
        log:  [entry, ...mccState.log],
        last: { ...mccState.last, 'rate-update': new Date().toISOString() },
      }
      await onSave(nextState)

      setPreview({
        ...preview!,
        pageUrl: data.pageUrl ?? preview?.pageUrl ?? '',
        pageTitle: scheduledTime
          ? `Published — Email scheduled for ${scheduledTime}`
          : `Published at ${data.pageUrl}`,
      })
      setStatus('done')
      setShowSchedule(false)
    } catch (e: unknown) {
      setErrorMsg(`Netlify error: ${e instanceof Error ? e.message : String(e)}`)
      setStatus('error')
    }
  }

  const handleSchedule = () => {
    if (!scheduleTime) return
    const selected = new Date(scheduleTime)
    const minTime = new Date(Date.now() + 15 * 60 * 1000)
    if (selected < minTime) {
      setErrorMsg('Scheduled time must be at least 15 minutes in the future.')
      return
    }
    handlePublish(selected.toISOString())
  }

  const isLoading = status === 'loading'

  return (
    <div className="space-y-4">
      {/* Cadence badge */}
      <div>
        <CadenceBadge
          label={rateTracker.label}
          lastTimestamp={mccState.last['rate-update'] ?? null}
          freqDays={rateTracker.freq}
        />
      </div>

      {/* Rates table */}
      <Card>
        <SectionLabel>CURRENT RATES</SectionLabel>
        <div className="space-y-2">
          {/* Header */}
          <div className="grid grid-cols-3 gap-2 text-muted-foreground pb-1 border-b border-input" style={{ fontSize: 9, letterSpacing: '0.12em' }}>
            <span>PRODUCT</span>
            <span>RATE</span>
            <span>APR <span className="text-muted-foreground">(auto)</span></span>
          </div>
          {rows.map((row, i) => (
            <div key={row.product} className="grid grid-cols-3 gap-2 items-center">
              <span className="text-muted-foreground" style={{ fontSize: 11 }}>{row.product}</span>
              <Input
                placeholder="6.875"
                value={row.rate}
                onChange={e => handleRateChange(i, e.target.value)}
                style={{ color: GOLD, fontWeight: 700 }}
              />
              <Input
                placeholder="auto"
                value={row.apr}
                onChange={e => handleAprChange(i, e.target.value)}
                style={{ borderStyle: row.apr && !rows[i].rate ? 'solid' : row.apr ? 'dashed' : 'solid', opacity: 0.85 }}
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Context fields */}
      <Card>
        <SectionLabel>CONTEXT</SectionLabel>
        <div className="space-y-3">
          {/* Audience */}
          <div>
            <FieldLabel>AUDIENCE</FieldLabel>
            <div className="flex gap-2">
              {['borrower', 'realtor'].map(a => (
                <button
                  key={a}
                  onClick={() => toggleAudience(a)}
                  className="px-3 py-1 rounded-sm text-xs font-bold transition-all"
                  style={{
                    border: `1px solid ${audiences.includes(a) ? GOLD : 'var(--border)'}`,
                    color: audiences.includes(a) ? GOLD : 'var(--muted-foreground)',
                    background: audiences.includes(a) ? `${GOLD}15` : 'transparent',
                  }}
                >
                  {a === 'borrower' ? 'Borrowers' : 'Realtors'}
                </button>
              ))}
            </div>
          </div>

          {/* Rate Direction */}
          <div>
            <FieldLabel htmlFor="direction">RATE DIRECTION</FieldLabel>
            <select
              id="direction"
              value={direction}
              onChange={e => setDirection(e.target.value)}
              className="w-full bg-background border border-input text-foreground text-xs rounded-sm px-2 py-1.5 focus:outline-none"
              style={{ fontFamily: 'inherit' }}
            >
              <option value="">Select direction...</option>
              <option value="Rates dropped">Rates dropped</option>
              <option value="Rates went up">Rates went up</option>
              <option value="Rates flat">Rates flat</option>
              <option value="Rates volatile">Rates volatile</option>
            </select>
          </div>

          {/* Content Depth */}
          <div>
            <FieldLabel htmlFor="depth">CONTENT DEPTH</FieldLabel>
            <select
              id="depth"
              value={depth}
              onChange={e => setDepth(e.target.value)}
              className="w-full bg-background border border-input text-foreground text-xs rounded-sm px-2 py-1.5 focus:outline-none"
              style={{ fontFamily: 'inherit' }}
            >
              <option value="short">Short & Sweet</option>
              <option value="standard">Standard</option>
              <option value="in-depth">In-Depth</option>
            </select>
          </div>

          {/* Blurb */}
          <div>
            <FieldLabel htmlFor="blurb">BLURB / TALKING POINTS</FieldLabel>
            <Textarea
              id="blurb"
              rows={3}
              placeholder="Market commentary, talking points for AI..."
              value={blurb}
              onChange={e => setBlurb(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div>
            <FieldLabel htmlFor="ru-notes">ANYTHING ELSE</FieldLabel>
            <Textarea
              id="ru-notes"
              rows={2}
              placeholder="Optional..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Action buttons */}
      <div className="flex gap-2 flex-wrap">
        <Btn onClick={handlePreview} disabled={isLoading}>
          {isLoading ? <><Spinner /> Loading...</> : '👁 Preview'}
        </Btn>
        <Btn
          variant="secondary"
          onClick={() => setShowConfirm(true)}
          disabled={isLoading}
        >
          ▶ Publish + Send Emails
        </Btn>
        <Btn
          variant="ghost"
          onClick={() => setShowSchedule(!showSchedule)}
          disabled={!preview || isLoading}
        >
          📅 Schedule
        </Btn>
      </div>

      {/* Confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowConfirm(false)}>
          <div className="bg-card border border-input rounded-lg p-6 max-w-sm w-full mx-4 space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-foreground font-bold text-sm">Confirm Send</h3>
            <p className="text-muted-foreground text-xs leading-relaxed">
              This will publish a rate update page and send Mailchimp campaigns to:
            </p>
            <ul className="text-xs space-y-1">
              {audiences.includes('borrower') && (
                <li className="text-foreground">• <strong>Borrowers / Past Clients</strong> list</li>
              )}
              {audiences.includes('realtor') && (
                <li className="text-foreground">• <strong>Realtors / Partners</strong> list</li>
              )}
              {audiences.length === 0 && (
                <li className="text-muted-foreground">No audiences selected — page only, no emails.</li>
              )}
            </ul>
            <p className="text-muted-foreground text-xs">This cannot be undone.</p>
            <div className="flex gap-2 justify-end pt-2">
              <Btn variant="ghost" onClick={() => setShowConfirm(false)}>Cancel</Btn>
              <Btn variant="secondary" onClick={() => { setShowConfirm(false); handlePublish() }}>
                Yes, Send Now
              </Btn>
            </div>
          </div>
        </div>
      )}

      {/* Schedule picker */}
      {showSchedule && (
        <Card>
          <SectionLabel>SCHEDULE EMAIL SEND</SectionLabel>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <FieldLabel htmlFor="schedule-time">DATE + TIME (local)</FieldLabel>
              <Input
                id="schedule-time"
                type="datetime-local"
                value={scheduleTime}
                onChange={e => setScheduleTime(e.target.value)}
              />
            </div>
            <Btn onClick={handleSchedule} disabled={isLoading}>Confirm</Btn>
          </div>
          <p className="text-muted-foreground mt-2" style={{ fontSize: 9 }}>
            Must be at least 15 minutes in the future. Page publishes immediately; email sends at scheduled time.
          </p>
        </Card>
      )}

      {/* Error */}
      {status === 'error' && <Banner type="error">{errorMsg}</Banner>}

      {/* Preview panel */}
      {preview && (
        <Card>
          <SectionLabel>PREVIEW</SectionLabel>
          <div className="space-y-2 text-xs">
            <div>
              <span className="text-muted-foreground">URL: </span>
              <a href={preview.pageUrl} target="_blank" rel="noopener noreferrer" style={{ color: GOLD }}>
                {preview.pageUrl}
              </a>
            </div>
            {preview.borrowerSubject && (
              <div><span className="text-muted-foreground">Borrower subject: </span><span className="text-foreground">{preview.borrowerSubject}</span></div>
            )}
            {preview.realtorSubject && (
              <div><span className="text-muted-foreground">Realtor subject: </span><span className="text-foreground">{preview.realtorSubject}</span></div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
