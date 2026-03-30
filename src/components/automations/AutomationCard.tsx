'use client'

import { useState, useRef, useCallback } from 'react'
import type { AutomationDef } from '@/lib/automations/definitions'

const GOLD = '#C9A84C'

type CardState = 'idle' | 'uploading' | 'extracting' | 'generating' | 'draft' | 'refining' | 'sending' | 'sent'

interface Props {
  automation: AutomationDef
  recordType: 'contact' | 'loan'
  recordId: string
  initialSent?: boolean
  sentAt?: string | null
  onDocumentUploaded?: () => void
}

export default function AutomationCard({
  automation,
  recordType,
  recordId,
  initialSent,
  sentAt,
  onDocumentUploaded,
}: Props) {
  const [state, setState] = useState<CardState>(initialSent ? 'sent' : 'idle')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [draftId, setDraftId] = useState<string | null>(null)
  const [refineInput, setRefineInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sentTimestamp, setSentTimestamp] = useState<string | null>(sentAt ?? null)
  const [fileName, setFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isPdf = automation.triggerType === 'pdf'

  const handleTrigger = useCallback(() => {
    if (isPdf) {
      // Open file picker
      fileInputRef.current?.click()
    } else {
      // Generate directly from DB data
      handleGenerate(null)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPdf])

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate PDF
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setError('Please upload a PDF file')
      return
    }

    setFileName(file.name)
    handleGenerate(file)

    // Reset file input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleGenerate(file: File | null) {
    setState(file ? 'uploading' : 'generating')
    setError(null)

    try {
      let res: Response

      if (file) {
        // Send as FormData with PDF
        setState('extracting')
        const fd = new FormData()
        fd.append('automationId', automation.id)
        fd.append('recordType', recordType)
        fd.append('recordId', recordId)
        fd.append('pdf', file)

        res = await fetch('/api/automations/generate', {
          method: 'POST',
          body: fd,
        })
      } else {
        // Send as JSON (no file)
        setState('generating')
        res = await fetch('/api/automations/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ automationId: automation.id, recordType, recordId }),
        })
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Unknown error' }))
        setError(data.error || `Generate failed (${res.status})`)
        setState('idle')
        setFileName(null)
        return
      }

      const data = await res.json()
      setSubject(data.subject || '')
      setBody(data.body || '')
      setDraftId(data.draftId || null)
      setState('draft')

      // Notify parent that a document was uploaded (refresh docs list)
      if (file && onDocumentUploaded) {
        onDocumentUploaded()
      }
    } catch {
      setError('Network error — could not reach server')
      setState('idle')
      setFileName(null)
    }
  }

  async function handleRefine() {
    if (!refineInput.trim() || !draftId) return
    setState('refining')
    setError(null)

    try {
      const res = await fetch('/api/automations/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draftId,
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
      const res = await fetch('/api/automations/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId }),
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
    setFileName(null)
  }

  // Status label for in-progress states
  function statusLabel(): string {
    switch (state) {
      case 'uploading': return 'Uploading document...'
      case 'extracting': return `Extracting fields from ${fileName || 'PDF'}...`
      case 'generating': return 'Generating draft...'
      case 'refining': return 'Refining...'
      case 'sending': return 'Sending to Outlook...'
      default: return ''
    }
  }

  // ── Hidden file input for PDF automations ─────────────────────────────────
  const fileInput = isPdf ? (
    <input
      ref={fileInputRef}
      type="file"
      accept="application/pdf,.pdf"
      onChange={handleFileSelect}
      className="hidden"
    />
  ) : null

  // ── Sent state ─────────────────────────────────────────────────────────────
  if (state === 'sent') {
    return (
      <div
        className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-4"
        style={{ fontFamily: "'IBM Plex Mono', 'Courier New', monospace" }}
      >
        {fileInput}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 text-xs">&#10003;</span>
            <span className="text-emerald-400 text-xs font-bold tracking-wider uppercase">
              Sent
            </span>
            <span className="text-zinc-600 text-xs">
              {automation.label}
            </span>
          </div>
          {sentTimestamp && (
            <span className="text-zinc-600" style={{ fontSize: 10 }}>
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
        className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-4"
        style={{ fontFamily: "'IBM Plex Mono', 'Courier New', monospace" }}
      >
        {fileInput}
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0 mr-3">
            <div className="text-zinc-100 text-xs font-bold">{automation.label}</div>
            <div className="text-zinc-500 mt-0.5" style={{ fontSize: 11 }}>
              {automation.description}
            </div>
          </div>
          <button
            onClick={handleTrigger}
            className="px-3 py-1.5 rounded text-xs font-bold tracking-wider transition-opacity hover:opacity-80 flex-shrink-0 flex items-center gap-1.5"
            style={{
              background: 'transparent',
              color: GOLD,
              border: `1px solid ${GOLD}`,
            }}
          >
            {isPdf ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                {automation.triggerLabel || 'Upload PDF'}
              </>
            ) : (
              'GENERATE'
            )}
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

  // ── In-progress states (uploading, extracting, generating) ─────────────────
  if (state === 'uploading' || state === 'extracting' || state === 'generating') {
    return (
      <div
        className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-4"
        style={{ fontFamily: "'IBM Plex Mono', 'Courier New', monospace" }}
      >
        {fileInput}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-zinc-100 text-xs font-bold">{automation.label}</div>
            <div className="text-zinc-500 mt-0.5" style={{ fontSize: 11 }}>
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
            {state === 'uploading' ? 'UPLOADING...' : state === 'extracting' ? 'EXTRACTING...' : 'DRAFTING...'}
          </div>
        </div>
        <div className="mt-2 text-zinc-500" style={{ fontSize: 11 }}>
          {statusLabel()}
        </div>
      </div>
    )
  }

  // ── Draft / Refining / Sending state ───────────────────────────────────────
  return (
    <div
      className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-4 space-y-3"
      style={{ fontFamily: "'IBM Plex Mono', 'Courier New', monospace" }}
    >
      {fileInput}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="font-bold"
            style={{ color: GOLD, fontSize: 10, letterSpacing: '0.2em' }}
          >
            {automation.label.toUpperCase()}
          </div>
          {fileName && (
            <span className="text-zinc-600" style={{ fontSize: 10 }}>
              from {fileName}
            </span>
          )}
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
          className="w-full bg-[#111118] border border-zinc-800 text-zinc-100 text-xs rounded px-3 py-2 focus:outline-none focus:border-yellow-500"
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
          className="w-full bg-[#111118] border border-zinc-800 text-zinc-100 text-xs rounded px-3 py-2 focus:outline-none focus:border-yellow-500 resize-none"
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
          className="flex-1 bg-zinc-950 border border-zinc-700 text-zinc-100 text-xs rounded px-2 py-1.5 placeholder-zinc-600 focus:outline-none focus:border-yellow-500 disabled:opacity-50"
          style={{ fontFamily: 'inherit' }}
        />
        <button
          onClick={handleRefine}
          disabled={state === 'refining' || !refineInput.trim()}
          className="px-3 py-1.5 rounded text-xs font-bold transition-opacity hover:opacity-80 disabled:opacity-40"
          style={{ background: GOLD, color: '#09090b', fontFamily: 'inherit' }}
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
          className="px-3 py-1.5 rounded text-xs font-bold text-zinc-500 transition-opacity hover:opacity-80 disabled:opacity-40"
          style={{ border: '1px solid #3f3f46', fontFamily: 'inherit' }}
        >
          DISCARD
        </button>
        <button
          onClick={handleSend}
          disabled={state === 'sending'}
          className="px-4 py-1.5 rounded text-xs font-bold tracking-wider transition-opacity hover:opacity-80 disabled:opacity-60"
          style={{ background: GOLD, color: '#09090b', fontFamily: 'inherit' }}
        >
          {state === 'sending' ? 'SENDING...' : 'SEND'}
        </button>
      </div>
    </div>
  )
}
