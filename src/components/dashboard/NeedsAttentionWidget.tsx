'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, Clock, ExternalLink, Mail, X } from 'lucide-react'
import { Card } from '@/components/ui/card'
import type { NeedsAttentionItem } from '@/lib/needsAttention'

// Intents that justify a NEW LEAD badge — must match the engagement set in
// needsAttentionScore. A "new lead" is only meaningful if the unknown sender is
// trying to engage; bare automated/system mail with contact_id=NULL is not.
const ENGAGEMENT_INTENTS = new Set(['question', 'status_request', 'scheduling', 'complaint', 'urgent'])

interface NeedsAttentionWidgetProps {
  items: NeedsAttentionItem[]
}

const URGENCY_ACCENT: Record<string, string> = {
  high: 'border-l-red-500',
  medium: 'border-l-amber-500',
  low: 'border-l-slate-500',
}

const ACTION_LABEL: Record<string, string> = {
  respond_today: 'Respond today',
  respond_this_week: 'This week',
  escalate: 'ESCALATE',
  route_to_janie: 'Route to Janie',
  log_only: 'Log only',
}

function daysLabel(n: number): string {
  if (n === 0) return 'today'
  if (n === 1) return '1d ago'
  return `${n}d ago`
}

export default function NeedsAttentionWidget({ items }: NeedsAttentionWidgetProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [expanded, setExpanded] = useState<string | null>(null)

  const visible = items.filter(i => !dismissed.has(i.id))

  async function handleDismiss(id: string) {
    setDismissed(prev => new Set([...prev, id]))
    // activity_log has no UPDATE RLS policy — client .update() silently fails.
    // Use the service-role endpoint that already handles this for the inbox.
    const res = await fetch('/api/emails/link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailId: id, dismiss: true }),
    })
    if (!res.ok) {
      setDismissed(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      console.error('[NeedsAttention] dismiss failed', await res.text())
    }
  }

  if (visible.length === 0) return null

  return (
    <Card className="overflow-hidden">
      <div className="px-4 py-3 border-b border-input flex items-center gap-2">
        <AlertTriangle size={14} className="text-red-500" />
        <span className="text-xs font-mono font-semibold text-red-500 uppercase tracking-widest">
          Needs Your Attention
        </span>
        <span className="text-[10px] font-mono text-muted-foreground">last 7 days</span>
      </div>

      <div className="divide-y divide-input">
        {visible.map(item => {
          const accent = URGENCY_ACCENT[item.ai_urgency ?? 'low'] ?? 'border-l-slate-500'
          const actionLabel = ACTION_LABEL[item.ai_suggested_action ?? ''] ?? item.ai_suggested_action
          const contactHref = item.contact_id ? `/dashboard/contacts/${item.contact_id}` : null
          const reasoning = item.ai_reasoning
          const confidence = item.ai_confidence != null ? Math.round(item.ai_confidence * 100) : null

          const senderLabel = item.contact_name
            ?? item.from_name
            ?? item.from_address
            ?? 'Unknown sender'
          const isOpen = expanded === item.id

          return (
            <div
              key={item.id}
              className={`px-4 py-3 border-l-[3px] ${accent} bg-card/80 hover:bg-card transition-colors cursor-pointer`}
              onClick={() => setExpanded(isOpen ? null : item.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {item.is_new_lead && ENGAGEMENT_INTENTS.has(item.ai_intent ?? '') && (
                      <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest">
                        🆕 NEW LEAD
                      </span>
                    )}
                    <span className="text-[10px] font-mono font-semibold text-foreground uppercase tracking-wider">
                      {actionLabel}
                    </span>
                    {item.ai_sentiment === 'frustrated' && (
                      <span className="text-[10px] font-mono text-red-400">⚠ frustrated</span>
                    )}
                    {confidence != null && confidence < 70 && (
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {confidence}% confidence
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-muted-foreground inline-flex items-center gap-1">
                      <Clock size={10} />
                      {daysLabel(item.daysAgo)}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-foreground mb-0.5 truncate">
                    {senderLabel}
                    {item.from_address && senderLabel !== item.from_address && (
                      <span className="ml-2 text-xs font-mono text-muted-foreground font-normal">
                        {item.from_address}
                      </span>
                    )}
                  </div>
                  {item.subject && (
                    <div className="text-xs text-foreground/90 truncate mb-0.5">{item.subject}</div>
                  )}
                  {!isOpen && reasoning && (
                    <div className="text-xs text-muted-foreground line-clamp-2">
                      {reasoning}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                  {item.from_address && (
                    <a
                      href={`mailto:${item.from_address}?subject=${encodeURIComponent(item.subject ? `Re: ${item.subject}` : '')}`}
                      className="p-1.5 hover:bg-input rounded-md text-muted-foreground hover:text-emerald-400 transition-colors"
                      title={`Reply to ${item.from_address}`}
                    >
                      <Mail size={14} />
                    </a>
                  )}
                  {contactHref && (
                    <Link
                      href={contactHref}
                      className="p-1.5 hover:bg-input rounded-md text-muted-foreground hover:text-foreground transition-colors"
                      title="Open contact"
                    >
                      <ExternalLink size={14} />
                    </Link>
                  )}
                  <button
                    onClick={() => handleDismiss(item.id)}
                    className="p-1.5 hover:bg-input rounded-md text-muted-foreground hover:text-foreground transition-colors"
                    title="Dismiss"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Expanded message view */}
              {isOpen && (
                <div className="mt-2 pt-2 border-t border-input/60" onClick={e => e.stopPropagation()}>
                  {item.body_snippet ? (
                    <p className="text-xs text-foreground/85 leading-relaxed whitespace-pre-wrap">
                      {item.body_snippet}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No message preview available.</p>
                  )}
                  {reasoning && (
                    <p className="text-[11px] font-mono text-muted-foreground mt-2">AI: {reasoning}</p>
                  )}
                  {item.is_new_lead && (
                    <Link
                      href="/dashboard/emails/unmatched"
                      className="inline-block mt-2 text-[11px] font-mono text-[#C9A84C]/80 hover:text-[#C9A84C]"
                    >
                      Open in Inbox Review (link or create contact) →
                    </Link>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}
