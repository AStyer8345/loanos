'use client'

import { useState } from 'react'
import { Copy, ExternalLink, Check, X, Edit3, Save, ChevronDown, ChevronRight, Inbox } from 'lucide-react'
import type { DraftRow } from './page'

// Strip HTML tags to plain text for mailto fallback and body preview.
// mailto: cannot carry HTML — most clients render as plain text regardless.
function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// Outlook web compose deeplink — opens in the LO's own signed-in Outlook session.
// Works for business/personal Outlook web; desktop client also handles it via OS default.
function outlookWebUrl(to: string, subject: string, body: string): string {
  const params = new URLSearchParams({ to, subject, body })
  return `https://outlook.office.com/mail/deeplink/compose?${params.toString()}`
}

function mailtoUrl(to: string, subject: string, body: string): string {
  const params = new URLSearchParams({ subject, body })
  return `mailto:${encodeURIComponent(to)}?${params.toString()}`
}

function relativeTime(iso: string | null): string {
  if (!iso) return ''
  const ms = Date.now() - new Date(iso).getTime()
  const min = Math.floor(ms / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const d = Math.floor(hr / 24)
  if (d < 7) return `${d}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatAutomation(name: string): string {
  return name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

interface Props {
  pending: DraftRow[]
  recent: DraftRow[]
}

export default function DraftsList({ pending: initialPending, recent }: Props) {
  const [pending, setPending] = useState<DraftRow[]>(initialPending)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editing, setEditing] = useState<Record<string, { subject: string; body_html: string }>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  function toggleExpand(id: string) {
    setExpandedId(prev => (prev === id ? null : id))
  }

  function startEdit(d: DraftRow) {
    setEditing(prev => ({ ...prev, [d.id]: { subject: d.subject, body_html: d.body_html } }))
  }

  function cancelEdit(id: string) {
    setEditing(prev => {
      const { [id]: _omit, ...rest } = prev
      void _omit
      return rest
    })
  }

  async function saveEdit(id: string) {
    const edit = editing[id]
    if (!edit) return
    setBusy(id)
    try {
      const res = await fetch(`/api/automations/email/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(edit),
      })
      if (!res.ok) throw new Error('Save failed')
      setPending(prev => prev.map(p => (p.id === id ? { ...p, subject: edit.subject, body_html: edit.body_html } : p)))
      cancelEdit(id)
      setFlash('✓ Draft saved')
    } catch {
      setFlash('✗ Save failed')
    } finally {
      setBusy(null)
    }
  }

  async function markSent(id: string) {
    if (!confirm('Mark this draft as sent? (Use this after you\'ve manually sent it from your Outlook.)')) return
    setBusy(id)
    try {
      const res = await fetch('/api/email-drafts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'sent' }),
      })
      if (!res.ok) throw new Error('Update failed')
      setPending(prev => prev.filter(p => p.id !== id))
      setFlash('✓ Marked as sent')
    } catch {
      setFlash('✗ Update failed')
    } finally {
      setBusy(null)
    }
  }

  async function discard(id: string) {
    if (!confirm('Discard this draft? It won\'t be sent.')) return
    setBusy(id)
    try {
      const res = await fetch('/api/email-drafts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'discarded' }),
      })
      if (!res.ok) throw new Error('Update failed')
      setPending(prev => prev.filter(p => p.id !== id))
      setFlash('✓ Draft discarded')
    } catch {
      setFlash('✗ Update failed')
    } finally {
      setBusy(null)
    }
  }

  async function copyHtml(d: DraftRow) {
    try {
      await navigator.clipboard.writeText(d.body_html)
      setCopiedId(d.id)
      setFlash('✓ HTML copied — paste into Outlook compose window')
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      setFlash('✗ Clipboard blocked by browser')
    }
  }

  if (pending.length === 0 && recent.length === 0) {
    return (
      <div className="border border-input rounded-md px-4 py-12 text-center">
        <Inbox size={28} className="mx-auto text-muted-foreground mb-3" />
        <p className="text-xs text-muted-foreground">No email drafts yet.</p>
        <p className="text-[11px] text-muted-foreground mt-1">
          Drafts appear here automatically when uploads trigger a workflow (purchase contract, CD, pre-approval, etc.).
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {flash && (
        <div
          onClick={() => setFlash(null)}
          className={`px-4 py-2 rounded text-xs border cursor-pointer ${
            flash.startsWith('✗')
              ? 'bg-red-900/20 border-red-800 text-red-400'
              : 'bg-[#4ADE80]/10 border-[#4ADE80]/40 text-[#4ADE80]'
          }`}
        >
          {flash}
        </div>
      )}

      {/* ── Pending section ─────────────────────────────────────────── */}
      <section>
        <h2 className="text-[11px] font-bold tracking-widest text-amber-400 mb-3" style={{ letterSpacing: '0.15em' }}>
          PENDING ({pending.length})
        </h2>

        {pending.length === 0 ? (
          <p className="text-xs text-muted-foreground border border-dashed border-input rounded-md px-4 py-6 text-center">
            No pending drafts. You&apos;re clear.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {pending.map(d => {
              const isExpanded = expandedId === d.id
              const isEditing = editing[d.id] !== undefined
              const subject = editing[d.id]?.subject ?? d.subject
              const bodyHtml = editing[d.id]?.body_html ?? d.body_html
              const bodyText = htmlToText(bodyHtml)

              return (
                <div
                  key={d.id}
                  className="border border-input rounded-md bg-card"
                  style={{ borderLeft: '3px solid #C9A84C' }}
                >
                  {/* Collapsed row */}
                  <button
                    type="button"
                    onClick={() => toggleExpand(d.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
                  >
                    {isExpanded ? <ChevronDown size={14} className="text-muted-foreground flex-shrink-0" /> : <ChevronRight size={14} className="text-muted-foreground flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-[10px] font-bold tracking-wider text-amber-400 uppercase">{formatAutomation(d.automation_name)}</span>
                        <span className="text-[10px] text-muted-foreground">→ {d.recipient_name || d.recipient_email}</span>
                      </div>
                      <p className="text-xs text-foreground truncate mt-0.5">{subject}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground flex-shrink-0">{relativeTime(d.created_at)}</span>
                  </button>

                  {/* Expanded body */}
                  {isExpanded && (
                    <div className="border-t border-input px-4 py-4 space-y-3">
                      {/* Recipient */}
                      <div>
                        <label className="text-[10px] tracking-widest text-muted-foreground uppercase block mb-1">To</label>
                        <p className="text-xs font-mono text-foreground">{d.recipient_name ? `${d.recipient_name} <${d.recipient_email}>` : d.recipient_email}</p>
                      </div>

                      {/* Subject */}
                      <div>
                        <label className="text-[10px] tracking-widest text-muted-foreground uppercase block mb-1">Subject</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={subject}
                            onChange={e => setEditing(prev => ({ ...prev, [d.id]: { ...prev[d.id], subject: e.target.value } }))}
                            className="w-full bg-muted border border-input rounded px-3 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:border-amber-500"
                          />
                        ) : (
                          <p className="text-xs font-mono text-foreground">{subject}</p>
                        )}
                      </div>

                      {/* Body */}
                      <div>
                        <label className="text-[10px] tracking-widest text-muted-foreground uppercase block mb-1">Body</label>
                        {isEditing ? (
                          <textarea
                            value={bodyHtml}
                            onChange={e => setEditing(prev => ({ ...prev, [d.id]: { ...prev[d.id], body_html: e.target.value } }))}
                            rows={14}
                            className="w-full bg-muted border border-input rounded px-3 py-2 text-[11px] font-mono text-foreground resize-y focus:outline-none focus:border-amber-500 leading-relaxed"
                            spellCheck={false}
                          />
                        ) : (
                          <div
                            className="bg-muted border border-input rounded px-3 py-2 text-xs text-foreground max-h-80 overflow-y-auto prose prose-sm prose-invert"
                            dangerouslySetInnerHTML={{ __html: bodyHtml }}
                          />
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-input/50">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={() => saveEdit(d.id)}
                              disabled={busy === d.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-medium bg-amber-500 text-zinc-900 hover:bg-amber-400 disabled:opacity-50"
                            >
                              <Save size={11} /> Save
                            </button>
                            <button
                              type="button"
                              onClick={() => cancelEdit(d.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] border border-input text-muted-foreground hover:text-foreground"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <a
                              href={outlookWebUrl(d.recipient_email, subject, bodyText)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-medium bg-amber-500 text-zinc-900 hover:bg-amber-400"
                            >
                              <ExternalLink size={11} /> Open in Outlook
                            </a>
                            <a
                              href={mailtoUrl(d.recipient_email, subject, bodyText)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] border border-input text-foreground hover:border-amber-500"
                            >
                              <ExternalLink size={11} /> Mailto
                            </a>
                            <button
                              type="button"
                              onClick={() => copyHtml(d)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] border border-input text-foreground hover:border-amber-500"
                            >
                              {copiedId === d.id ? <Check size={11} /> : <Copy size={11} />}
                              {copiedId === d.id ? 'Copied' : 'Copy HTML'}
                            </button>
                            <button
                              type="button"
                              onClick={() => startEdit(d)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] border border-input text-muted-foreground hover:text-foreground"
                            >
                              <Edit3 size={11} /> Edit
                            </button>
                            <div className="ml-auto flex gap-2">
                              <button
                                type="button"
                                onClick={() => markSent(d.id)}
                                disabled={busy === d.id}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] border border-[#4ADE80]/40 text-[#4ADE80] hover:bg-[#4ADE80]/10 disabled:opacity-50"
                              >
                                <Check size={11} /> Mark Sent
                              </button>
                              <button
                                type="button"
                                onClick={() => discard(d.id)}
                                disabled={busy === d.id}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] border border-red-800 text-red-400 hover:bg-red-900/20 disabled:opacity-50"
                              >
                                <X size={11} /> Discard
                              </button>
                            </div>
                          </>
                        )}
                      </div>

                      <p className="text-[10px] text-muted-foreground">
                        Tip: &quot;Open in Outlook&quot; opens a compose window in Outlook web with plain-text body. For full HTML formatting, click &quot;Copy HTML&quot;, open Outlook compose, and paste into the body.
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ── Recent section ─────────────────────────────────────────── */}
      {recent.length > 0 && (
        <section>
          <h2 className="text-[11px] font-bold tracking-widest text-muted-foreground mb-3" style={{ letterSpacing: '0.15em' }}>
            RECENT ({recent.length})
          </h2>
          <div className="flex flex-col gap-1">
            {recent.map(d => (
              <div
                key={d.id}
                className="flex items-center gap-3 px-4 py-2 text-xs border border-input/50 rounded-md bg-card/50"
              >
                <span className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${d.status === 'sent' ? 'bg-[#4ADE80]' : 'bg-muted-foreground'}`} />
                <span className="text-[10px] tracking-wider uppercase text-muted-foreground w-20 flex-shrink-0">{d.status}</span>
                <span className="text-[10px] text-amber-400 uppercase tracking-wider flex-shrink-0">{formatAutomation(d.automation_name)}</span>
                <span className="text-foreground truncate flex-1 min-w-0">{d.subject}</span>
                <span className="text-[10px] text-muted-foreground flex-shrink-0">{relativeTime(d.created_at)}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
