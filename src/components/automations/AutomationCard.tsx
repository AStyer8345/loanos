'use client'

import { useState, useCallback } from 'react'
import type { AutomationRegistryRow } from '@/lib/automations/types'

const GOLD = '#C9A84C'

type CardState = 'idle' | 'generating' | 'draft' | 'refining' | 'sending' | 'sent'

interface Props {
  automation: AutomationRegistryRow
  recordType: 'contact' | 'loan'
  recordId: string
  initialSent?: boolean
  sentAt?: string | null
}

export default function AutomationCard({
  automation,
  recordType,
  recordId,
  initialSent,
  sentAt,
}: Props) {
  const [state, setState] = useState<CardState>(initialSent ? 'sent' : 'idle')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [draftId, setDraftId] = useState<string | null>(null)
  const [refineInput, setRefineInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sentTimestamp, setSentTimestamp] = useState<string | null>(sentAt ?? null)

  const handleGenerate = useCallback(async () => {
    setState('generating')
    setError(null)

    try {
      const res = await fetch('/api/automations/email/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          automationRegistryId: automation.id,
          recordType,
          recordId,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Unknown error' }))
        setError(data.error || `Generate failed (${res.status})`)
        setState('idle')
        return
      }

      const data = await res.json()
      setSubject(data.subject || '')
      setBody(data.body || '')
      setDraftId(data.draftId || null)
      setState('draft')
    } catch {
      setError('Network error — could not reach server')
      setState('idle')
    }
  }, [automation.id, recordType, recordId])

  async function handleRefine() {
    if (!refineInput.trim() || !draftId) return
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
        setState('draft')
        return
      }

      const data = await res.json()
      setSubject(data.subject || subject)
      setBody(data.body || body)
      setRefineInput('')
      setState('draft')
    } catch {
      setError('Network error — could not reach server')
      setState('draft')
    }
  }

  async function handleSend() {
    if (!draftId) return
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
        setState('draft')
        return
      }

      setSentTimestamp(new Date().toISOString())
      setState('sent')
    } catch {
      setError('Network error — could not reach server')
      setState('draft')
    }
  }

  function handleDiscard() {
    setState('idle')
    setSubject('')
    setBody('')
    setDraftId(null)
    setRefineInput('')
    setError(null)
  }

  // ── Sent state ─────────────────────────────────────────────────────────────
  if (state === 'sent') {
    return (
      <div
        className="bg-card border border-input rounded-lg p-4"
        style={{ fontFamily: "'IBM Plex Mono', 'Courier New', monospace" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 text-xs">&#10003;</span>
            <span className="text-emerald-400 text-xs font-bold tracking-wider uppercase">
              Sent
            </span>
            <span className="text-muted-foreground text-xs">
              {automation.name}
            </span>
          </div>
          {sentTimestamp && (
            <span className="text-muted-foreground" style={{ fontSize: 10 }}>
              {new Date(sentTimestamp).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
              })}
            </span>
          )}
        </div>
      </div>
    )
  }

  // ── Idle state ─────────────────────────────────────────────────────────────
  if (state === 'idle') {
    return (
      <div
        className="bg-card border border-input rounded-lg p-4"
        style={{ fontFamily: "'IBM Plex Mono', 'Courier New', monospace" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0 mr-3">
            <div className="text-foreground text-xs font-bold">{automation.name}</div>
            <div className="text-muted-foreground mt-0.5" style={{ fontSize: 11 }}>
              {automation.description}
            </div>
          </div>
          <button
            onClick={handleGenerate}
            className="px-3 py-1.5 rounded text-xs font-bold tracking-wider transition-opacity hover:opacity-80 flex-shrink-0"
            style={{
              background: 'transparent',
              color: GOLD,
              border: `1px solid ${GOLD}`,
            }}
          >
            GENERATE
          </button>
        </div>
        {error && (
          <div className="text-red-400 mt-2" style={{ fontSize: 11 }}>
            {error}
          </div>
        )}
      </div>
    )
  }

  // ── Generating state ───────────────────────────────────────────────────────
  if (state === 'generating') {
    return (
      <div
        className="bg-card border border-input rounded-lg p-4"
        style={{ fontFamily: "'IBM Plex Mono', 'Courier New', monospace" }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-foreground text-xs font-bold">{automation.name}</div>
            <div className="text-muted-foreground mt-0.5" style={{ fontSize: 11 }}>
              {automation.description}
            </div>
          </div>
          <div
            className="px-3 py-1.5 rounded text-xs font-bold tracking-wider flex-shrink-0 flex items-center gap-1.5 opacity-70"
            style={{ color: GOLD, border: `1px solid ${GOLD}33` }}
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: GOLD }}
            />
            DRAFTING...
          </div>
        </div>
        <div className="mt-2 text-muted-foreground" style={{ fontSize: 11 }}>
          Generating draft...
        </div>
      </div>
    )
  }

  // ── Draft / Refining / Sending state ───────────────────────────────────────
  return (
    <div
      className="bg-card border border-input rounded-lg p-4 space-y-3"
      style={{ fontFamily: "'IBM Plex Mono', 'Courier New', monospace" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div
          className="font-bold"
          style={{ color: GOLD, fontSize: 10, letterSpacing: '0.2em' }}
        >
          {automation.name.toUpperCase()}
        </div>
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
          className="w-full bg-[var(--surface)] border border-input text-foreground text-xs rounded px-3 py-2 focus:outline-none focus:border-yellow-500"
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
          rows={6}
          className="w-full bg-[var(--surface)] border border-input text-foreground text-xs rounded px-3 py-2 focus:outline-none focus:border-yellow-500 resize-none"
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
          disabled={state === 'refining'}
          className="flex-1 bg-background border border-input text-foreground text-xs rounded px-2 py-1.5 placeholder-zinc-600 focus:outline-none focus:border-yellow-500 disabled:opacity-50"
          style={{ fontFamily: 'inherit' }}
        />
        <button
          onClick={handleRefine}
          disabled={state === 'refining' || !refineInput.trim()}
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
          onClick={handleDiscard}
          disabled={state === 'sending'}
          className="px-3 py-1.5 rounded text-xs font-bold text-muted-foreground transition-opacity hover:opacity-80 disabled:opacity-40"
          style={{ border: '1px solid #3f3f46', fontFamily: 'inherit' }}
        >
          DISCARD
        </button>
        <button
          onClick={handleSend}
          disabled={state === 'sending'}
          className="px-4 py-1.5 rounded text-xs font-bold tracking-wider transition-opacity hover:opacity-80 disabled:opacity-60"
          style={{ background: GOLD, color: 'var(--bg)', fontFamily: 'inherit' }}
        >
          {state === 'sending' ? 'SENDING...' : 'SEND'}
        </button>
      </div>
    </div>
  )
}
