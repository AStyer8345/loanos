'use client'

import { useState } from 'react'
import { Card, SectionLabel, FieldLabel, Input, Textarea, Btn, Banner, Spinner, CadenceBadge } from './shared'
import { type MCCState, type LogEntry } from '@/lib/marketing/types'
import { TRACKERS } from '@/lib/marketing/schedule'

const NETLIFY_URL = 'https://styermortgage.com/.netlify/functions/generate-newsletter'
const GOLD = '#C9A84C'

type NLPreview = {
  pageTitle:         string
  pageUrl:           string
  borrowerSubject:   string
  borrowerPreheader: string
  borrowerEmailHtml: string
  realtorSubject:    string
  realtorPreheader:  string
  realtorEmailHtml:  string
  webContent:        string
  linkedinPost:      string
  facebookPost:      string
}

type Props = {
  mccState: MCCState
  onSave:   (next: MCCState) => Promise<void>
}

export default function NewsletterForm({ mccState, onSave }: Props) {
  const [mode, setMode]           = useState<'structured' | 'prompt'>('structured')
  const [audiences, setAudiences] = useState<string[]>(['borrower', 'realtor'])

  // Structured fields
  const [topic, setTopic]       = useState('')
  const [story, setStory]       = useState('')
  const [articles, setArticles] = useState('')
  const [aiTool, setAiTool]     = useState('')
  const [notes, setNotes]       = useState('')

  // Custom prompt
  const [customPrompt, setCustomPrompt] = useState('')

  const [preview, setPreview]         = useState<NLPreview | null>(null)
  const [status, setStatus]           = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg]       = useState('')
  const [showSchedule, setShowSchedule] = useState(false)
  const [scheduleTime, setScheduleTime] = useState('')
  const [showConfirm, setShowConfirm]   = useState(false)

  const realtorTracker  = TRACKERS.find(t => t.key === 'realtor-nl')!
  const borrowerTracker = TRACKERS.find(t => t.key === 'borrower-nl')!

  const toggleAudience = (a: string) =>
    setAudiences(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a])

  const buildPayload = (nlMode: string, extraScheduleTime?: string) => {
    const base = {
      audiences,
      mode: nlMode,
      ...(extraScheduleTime ? { scheduleTime: extraScheduleTime } : {}),
    }
    if (mode === 'structured') {
      return { ...base, topic, story, articles, aiTool, notes }
    }
    return { ...base, customPrompt }
  }

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

      // Build audience label for log entry notes
      const audienceLabel = audiences.length === 2
        ? 'Borrowers + Realtors'
        : audiences[0] === 'borrower' ? 'Borrowers' : 'Realtors'

      const entry: LogEntry = {
        id:       crypto.randomUUID(),
        date:     new Date().toISOString(),
        activity: `Newsletter sent — ${preview?.borrowerSubject || preview?.realtorSubject || topic}`,
        channel:  'Email',
        notes:    scheduledTime
          ? `${audienceLabel} · Mailchimp (email scheduled for ${scheduledTime})`
          : `${audienceLabel} · Mailchimp`,
      }

      // Update last timestamps for selected audiences
      const now = new Date().toISOString()
      const lastUpdates: Record<string, string> = {}
      if (audiences.includes('realtor'))  lastUpdates['realtor-nl']  = now
      if (audiences.includes('borrower')) lastUpdates['borrower-nl'] = now

      const nextState: MCCState = {
        ...mccState,
        log:  [entry, ...mccState.log],
        last: { ...mccState.last, ...lastUpdates },
      }
      await onSave(nextState)

      setPreview(prev => prev ? { ...prev, pageUrl: data.pageUrl ?? prev.pageUrl } : prev)
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
      {/* Cadence badges */}
      <div className="flex gap-2 flex-wrap">
        <CadenceBadge label={realtorTracker.label}  lastTimestamp={mccState.last['realtor-nl'] ?? null}  freqDays={realtorTracker.freq} />
        <CadenceBadge label={borrowerTracker.label} lastTimestamp={mccState.last['borrower-nl'] ?? null} freqDays={borrowerTracker.freq} />
      </div>

      {/* Audience + mode */}
      <Card>
        <div className="flex gap-4 items-start flex-wrap">
          {/* Audience chips */}
          <div>
            <FieldLabel>AUDIENCE</FieldLabel>
            <div className="flex gap-2 mt-1">
              {[
                { key: 'borrower', label: 'Borrowers / Past Clients' },
                { key: 'realtor',  label: 'Realtors / Partners' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => toggleAudience(key)}
                  className="px-3 py-1 rounded-sm text-xs font-bold transition-all"
                  style={{
                    border: `1px solid ${audiences.includes(key) ? GOLD : '#3f3f46'}`,
                    color: audiences.includes(key) ? GOLD : '#71717a',
                    background: audiences.includes(key) ? `${GOLD}15` : 'transparent',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Content mode toggle */}
          <div>
            <FieldLabel>CONTENT MODE</FieldLabel>
            <div className="flex gap-0 mt-1 border border-input rounded-sm overflow-hidden">
              {(['structured', 'prompt'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className="px-3 py-1 text-xs font-bold transition-colors"
                  style={{
                    background: mode === m ? GOLD : 'transparent',
                    color: mode === m ? 'var(--bg)' : '#71717a',
                  }}
                >
                  {m === 'structured' ? 'STRUCTURED FIELDS' : 'CUSTOM PROMPT'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Form fields */}
      <Card>
        {mode === 'structured' ? (
          <div className="space-y-3">
            <SectionLabel>STRUCTURED FIELDS</SectionLabel>
            <div>
              <FieldLabel htmlFor="nl-topic">THIS WEEK&apos;S TOPIC / THEME <span style={{ color: '#E05252' }}>*</span></FieldLabel>
              <Input id="nl-topic" placeholder="e.g. Spring market heating up..." value={topic} onChange={e => setTopic(e.target.value)} />
            </div>
            <div>
              <FieldLabel htmlFor="nl-articles">ARTICLES / LINKS TO REFERENCE</FieldLabel>
              <Textarea id="nl-articles" rows={2} placeholder="Paste URLs or article text..." value={articles} onChange={e => setArticles(e.target.value)} />
            </div>
            <div>
              <FieldLabel htmlFor="nl-story">PERSONAL STORY / ANECDOTE</FieldLabel>
              <Textarea id="nl-story" rows={4} placeholder="Client win, recent experience, bullet points fine..." value={story} onChange={e => setStory(e.target.value)} />
            </div>
            <div>
              <FieldLabel htmlFor="nl-aitool">AI TOOL TIP FOR REALTORS</FieldLabel>
              <Textarea id="nl-aitool" rows={2} placeholder="Optional — for the &quot;AI Edge&quot; section in the realtor version..." value={aiTool} onChange={e => setAiTool(e.target.value)} />
            </div>
            <div>
              <FieldLabel htmlFor="nl-notes">ANYTHING ELSE</FieldLabel>
              <Textarea id="nl-notes" rows={2} placeholder="Tone preferences, things to include or avoid..." value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
          </div>
        ) : (
          <div>
            <SectionLabel>CUSTOM PROMPT</SectionLabel>
            <FieldLabel htmlFor="nl-prompt">FULL PROMPT</FieldLabel>
            <Textarea
              id="nl-prompt"
              rows={10}
              placeholder="Write everything the AI needs — topic, voice, stories, data, what to cover for each audience..."
              value={customPrompt}
              onChange={e => setCustomPrompt(e.target.value)}
            />
          </div>
        )}
      </Card>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        <Btn onClick={handlePreview} disabled={isLoading}>
          {isLoading ? <><Spinner /> Loading...</> : '👁 Preview'}
        </Btn>
        <Btn variant="secondary" onClick={() => setShowConfirm(true)} disabled={isLoading}>
          ▶ Publish + Send Emails
        </Btn>
        <Btn variant="ghost" onClick={() => setShowSchedule(!showSchedule)} disabled={!preview || isLoading}>
          📅 Schedule
        </Btn>
      </div>

      {/* Confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowConfirm(false)}>
          <div className="bg-card border border-input rounded-lg p-6 max-w-sm w-full mx-4 space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-foreground font-bold text-sm">Confirm Send</h3>
            <p className="text-muted-foreground text-xs leading-relaxed">
              This will publish a newsletter and send Mailchimp campaigns to:
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
              <FieldLabel htmlFor="nl-schedule-time">DATE + TIME (local)</FieldLabel>
              <Input id="nl-schedule-time" type="datetime-local" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} />
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
              <a href={preview.pageUrl} target="_blank" rel="noopener noreferrer" style={{ color: GOLD }}>{preview.pageUrl}</a>
            </div>
            {preview.borrowerSubject && (
              <div><span className="text-muted-foreground">Borrower subject: </span><span className="text-foreground">{preview.borrowerSubject}</span></div>
            )}
            {preview.realtorSubject && (
              <div><span className="text-muted-foreground">Realtor subject: </span><span className="text-foreground">{preview.realtorSubject}</span></div>
            )}
            {preview.linkedinPost && (
              <details className="mt-2">
                <summary className="text-muted-foreground cursor-pointer">LinkedIn post draft</summary>
                <p className="mt-1 text-foreground/80 leading-relaxed whitespace-pre-wrap">{preview.linkedinPost}</p>
              </details>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
