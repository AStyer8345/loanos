'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Mail, Check, X, ChevronDown, ChevronUp, Clock, Inbox } from 'lucide-react'

interface EmailDraft {
  id: string
  automation_name: string
  recipient_name: string | null
  recipient_email: string
  subject: string
  body_html: string
  body_preview: string | null
  status: string
  created_at: string
}

const AUTOMATION_COLORS: Record<string, string> = {
  pre_approval: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  contract_received: 'bg-blue-100 text-blue-700 border-blue-200',
  final_cd: 'bg-amber-100 text-amber-700 border-amber-200',
  review_request: 'bg-purple-100 text-purple-700 border-purple-200',
  referral_intro: 'bg-orange-100 text-orange-700 border-orange-200',
  morning_report: 'bg-slate-100 text-slate-600 border-slate-200',
  milestone: 'bg-indigo-100 text-indigo-700 border-indigo-200',
}

const AUTOMATION_LABELS: Record<string, string> = {
  pre_approval: 'Pre-Approval',
  contract_received: 'Contract',
  final_cd: 'Final CD',
  review_request: 'Review Request',
  referral_intro: 'Referral Intro',
  morning_report: 'Morning Report',
  milestone: 'Milestone',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function SkeletonCard() {
  return (
    <div className="border border-slate-200 rounded-lg p-4 animate-pulse">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-5 w-20 bg-slate-200 rounded-full" />
        <div className="h-4 w-16 bg-slate-100 rounded" />
      </div>
      <div className="h-4 w-3/4 bg-slate-200 rounded mb-2" />
      <div className="h-3 w-1/2 bg-slate-100 rounded mb-2" />
      <div className="h-3 w-full bg-slate-100 rounded" />
    </div>
  )
}

function DraftCard({
  draft,
  isExpanded,
  onToggle,
  onUpdateStatus,
}: {
  draft: EmailDraft
  isExpanded: boolean
  onToggle: () => void
  onUpdateStatus: (id: string, status: 'sent' | 'discarded') => void
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const colorClass = AUTOMATION_COLORS[draft.automation_name] || AUTOMATION_COLORS.morning_report
  const label = AUTOMATION_LABELS[draft.automation_name] || draft.automation_name

  useEffect(() => {
    if (isExpanded && iframeRef.current) {
      const doc = iframeRef.current.contentDocument
      if (doc) {
        doc.open()
        doc.write(`
          <html>
            <head><style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; line-height: 1.6; color: #1e293b; padding: 16px; margin: 0; }
              a { color: #059669; }
            </style></head>
            <body>${draft.body_html}</body>
          </html>
        `)
        doc.close()
      }
    }
  }, [isExpanded, draft.body_html])

  return (
    <div className="border border-slate-200 rounded-lg bg-white hover:border-slate-300 transition-colors">
      {/* Card header — clickable */}
      <button
        onClick={onToggle}
        className="w-full text-left p-4 focus:outline-none"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${colorClass}`}>
              {label}
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {timeAgo(draft.created_at)}
            </span>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>

        <div className="text-sm font-medium text-slate-900 mb-1 truncate">
          {draft.subject}
        </div>
        <div className="text-xs text-slate-500 truncate">
          To: {draft.recipient_name ? `${draft.recipient_name} <${draft.recipient_email}>` : draft.recipient_email}
        </div>

        {!isExpanded && draft.body_preview && (
          <div className="text-xs text-slate-400 mt-2 line-clamp-2">
            {draft.body_preview}
          </div>
        )}
      </button>

      {/* Expanded view */}
      {isExpanded && (
        <div className="border-t border-slate-100">
          <div className="bg-slate-50 rounded-b-lg">
            <iframe
              ref={iframeRef}
              className="w-full border-0 rounded-b-lg"
              style={{ minHeight: '200px', maxHeight: '400px' }}
              title="Email preview"
              sandbox="allow-same-origin"
            />
          </div>
          <div className="flex gap-2 p-3 border-t border-slate-100">
            <button
              onClick={(e) => { e.stopPropagation(); onUpdateStatus(draft.id, 'sent') }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              Mark Sent
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onUpdateStatus(draft.id, 'discarded') }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Discard
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function EmailDraftPreview() {
  const [drafts, setDrafts] = useState<EmailDraft[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  const fetchDrafts = useCallback(async () => {
    try {
      const res = await fetch('/api/email-drafts?status=pending&limit=20')
      const data = await res.json()
      setDrafts(data.drafts || [])
    } catch (err) {
      console.error('Failed to fetch drafts:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const updateStatus = async (id: string, status: 'sent' | 'discarded') => {
    await fetch('/api/email-drafts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status })
    })
    setDrafts(prev => prev.filter(d => d.id !== id))
    if (expanded === id) setExpanded(null)
  }

  useEffect(() => {
    fetchDrafts()
    const interval = setInterval(fetchDrafts, 60000)
    return () => clearInterval(interval)
  }, [fetchDrafts])

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-900">Email Drafts</h2>
          {drafts.length > 0 && (
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold text-white bg-emerald-600 rounded-full">
              {drafts.length}
            </span>
          )}
        </div>
        <button
          onClick={fetchDrafts}
          className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : drafts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-400">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
              <Inbox className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-sm font-medium text-slate-500">No pending drafts</p>
            <p className="text-xs text-slate-400 mt-1">All caught up</p>
          </div>
        ) : (
          drafts.map((draft) => (
            <DraftCard
              key={draft.id}
              draft={draft}
              isExpanded={expanded === draft.id}
              onToggle={() => setExpanded(expanded === draft.id ? null : draft.id)}
              onUpdateStatus={updateStatus}
            />
          ))
        )}
      </div>
    </div>
  )
}
