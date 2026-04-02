'use client'

import { useState, useCallback } from 'react'

const GOLD = '#C9A84C'
const MONO = "'IBM Plex Mono', 'Courier New', monospace"

type EditorState = 'editing' | 'refining' | 'sending' | 'sent'

interface Props {
  draftId: string
  initialSubject: string
  initialBody: string
  onSent: () => void
  onDiscard: () => void
}

export default function InlineDraftEditor({
  draftId,
  initialSubject,
  initialBody,
  onSent,
  onDiscard,
}: Props) {
  const [state, setState] = useState<EditorState>('editing')
  const [subject, setSubject] = useState(initialSubject)
  const [body, setBody] = useState(initialBody)
  const [refineInput, setRefineInput] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleRefine = useCallback(async () => {
    if (!refineInput.trim()) return
    setState('refining')
    setError(null)

    try {
      const res = await fetch(`/api/automations/email/${draftId}/refine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instruction: refineInput.trim(),
          currentSubject: subject,
          currentBody: body,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Unknown error' }))
        setError(data.error || `Refine failed (${res.status})`)
        setState('editing')
        return
      }

      const data = await res.json()
      setSubject(data.subject || subject)
      setBody(data.body || body)
      setRefineInput('')
      setState('editing')
    } catch {
      setError('Network error — could not reach server')
      setState('editing')
    }
  }, [draftId, refineInput, subject, body])

  const handleSend = useCallback(async () => {
    setState('sending')
    setError(null)

    try {
      const res = await fetch(`/api/automations/email/${draftId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Unknown error' }))
        setError(data.error || `Send failed (${res.status})`)
        setState('editing')
        return
      }

      setState('sent')
      onSent()
    } catch {
      setError('Network error — could not reach server')
      setState('editing')
    }
  }, [draftId, onSent])

  if (state === 'sent') {
    return (
      <div
        className="bg-card border border-input rounded-lg p-4"
        style={{ fontFamily: MONO }}
      >
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 text-xs">&#10003;</span>
          <span className="text-emerald-400 text-xs font-bold tracking-wider uppercase">
            Sent
          </span>
        </div>
      </div>
    )
  }

  const isBusy = state === 'refining' || state === 'sending'

  return (
    <div
      className="bg-card border border-input rounded-lg p-4 space-y-3"
      style={{ fontFamily: MONO }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span
          className="font-bold"
          style={{ color: GOLD, fontSize: 10, letterSpacing: '0.2em' }}
        >
          DRAFT
        </span>
        <span
          className="text-xs px-2 py-0.5 rounded"
          style={{ background: '#C9A84C22', color: GOLD, fontSize: 9 }}
        >
          DRAFT
        </span>
      </div>

      {/* Subject */}
      <div>
        <label
          className="block mb-1"
          style={{ color: '#71717a', fontSize: 9, letterSpacing: '0.1em' }}
        >
          SUBJECT
        </label>
        <input
          type="text"
          value={subject}
          onChange={e => setSubject(e.target.value)}
          disabled={isBusy}
          className="w-full bg-[var(--surface)] border border-input text-foreground text-xs rounded px-3 py-2 focus:outline-none focus:border-yellow-500 disabled:opacity-50"
          style={{ fontFamily: 'inherit' }}
        />
      </div>

      {/* Body */}
      <div>
        <label
          className="block mb-1"
          style={{ color: '#71717a', fontSize: 9, letterSpacing: '0.1em' }}
        >
          BODY
        </label>
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          disabled={isBusy}
          rows={6}
          className="w-full bg-[var(--surface)] border border-input text-foreground text-xs rounded px-3 py-2 focus:outline-none focus:border-yellow-500 resize-none disabled:opacity-50"
          style={{ fontFamily: 'inherit', lineHeight: 1.6, minHeight: 140 }}
        />
      </div>

      {/* Refine bar */}
      <div className="flex gap-2">
        <input
          type="text"
          value={refineInput}
          onChange={e => setRefineInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleRefine()
            }
          }}
          placeholder="Refine this draft..."
          disabled={isBusy}
          className="flex-1 bg-background border border-input text-foreground text-xs rounded px-2 py-1.5 placeholder-zinc-600 focus:outline-none focus:border-yellow-500 disabled:opacity-50"
          style={{ fontFamily: 'inherit' }}
        />
        <button
          onClick={handleRefine}
          disabled={isBusy || !refineInput.trim()}
          className="px-3 py-1.5 rounded text-xs font-bold transition-opacity hover:opacity-80 disabled:opacity-40"
          style={{ background: GOLD, color: 'var(--bg)', fontFamily: 'inherit' }}
        >
          {state === 'refining' ? '...' : 'REFINE'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="text-red-400" style={{ fontSize: 11 }}>
          {error}
        </div>
      )}

      {/* Action row */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={onDiscard}
          disabled={isBusy}
          className="px-3 py-1.5 rounded text-xs font-bold text-muted-foreground transition-opacity hover:opacity-80 disabled:opacity-40"
          style={{ border: '1px solid #3f3f46', fontFamily: 'inherit' }}
        >
          DISCARD
        </button>
        <button
          onClick={handleSend}
          disabled={isBusy}
          className="px-4 py-1.5 rounded text-xs font-bold tracking-wider transition-opacity hover:opacity-80 disabled:opacity-60"
          style={{ background: GOLD, color: 'var(--bg)', fontFamily: 'inherit' }}
        >
          {state === 'sending' ? 'SENDING...' : 'SEND'}
        </button>
      </div>
    </div>
  )
}
