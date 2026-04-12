// SaaS-safe: org-scoped via RLS
'use client'

import {
  Mail,
  Clock,
  Zap,
  FileText,
  StickyNote,
  MessageSquare,
  Phone,
  AlertTriangle,
  RefreshCw,
  Activity,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface ActivityRow {
  id: string
  created_at: string
  action: string | null
  event_type: string | null
  type: string | null
  summary: string | null
  metadata: Record<string, unknown> | null
  contact_id: string | null
  loan_id: string | null
  entity_type: string | null
  // Optional join data
  loan_name?: string | null
}

interface EventStyle {
  icon: LucideIcon
  color: string
  bg: string
  label: string
}

const EVENT_STYLES: Record<string, EventStyle> = {
  email_sent:           { icon: Mail,           color: '#22d3ee', bg: 'rgba(34,211,238,0.12)',  label: 'Email' },
  status_changed:       { icon: Clock,          color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', label: 'Status Changed' },
  automation_fired:     { icon: Zap,            color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  label: 'Automation' },
  document_uploaded:    { icon: FileText,        color: '#34d399', bg: 'rgba(52,211,153,0.12)',  label: 'Document' },
  note_added:           { icon: StickyNote,      color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', label: 'Note' },
  imessage_received:    { icon: MessageSquare,   color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', label: 'iMessage' },
  communication_logged: { icon: Phone,           color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: 'Communication' },
  system_error:         { icon: AlertTriangle,   color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  label: 'Error' },
  record_changed:       { icon: RefreshCw,       color: '#64748b', bg: 'rgba(100,116,139,0.12)', label: 'Record Updated' },
  other:                { icon: Activity,        color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', label: 'Activity' },
}

function getStyle(eventType: string | null): EventStyle {
  return EVENT_STYLES[eventType ?? 'other'] ?? EVENT_STYLES.other
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

function actionLabel(action: string | null, eventType: string | null): string {
  if (!action) return getStyle(eventType).label
  // Use readable action names for known types
  const labels: Record<string, string> = {
    'email.received': 'Email received',
    'email_outbound': 'Email sent',
    'emails.drafted': 'Email drafted',
    'status_updated': 'Status updated',
    'loan_stage_changed': 'Loan stage changed',
    'loan.status_changed': 'Status changed',
    'note_added': 'Note added',
    'note.added': 'Note added',
    'Logged note': 'Note added',
    'document.uploaded': 'Document uploaded',
    'document.unmatched': 'Unmatched document',
    'automation_fired': 'Automation fired',
    'imessage.received': 'iMessage received',
    'communication.logged': 'Communication logged',
    'loan_created': 'Loan created',
    'contact_updated': 'Contact updated',
    'contact_created': 'Contact created',
    'contract.received': 'Contract received',
  }
  return labels[action] ?? action.replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// ── Match method badge for iMessage ──────────────────────────────────────────

function MatchMethodBadge({ method }: { method: string }) {
  const labels: Record<string, { text: string; className: string }> = {
    contact_phone_to_loan: { text: 'Matched to loan', className: 'bg-green-900/40 text-green-400' },
    contact_phone_only:    { text: 'No active loan', className: 'bg-yellow-900/40 text-yellow-400' },
    loan_phone_direct:     { text: 'Direct match', className: 'bg-blue-900/40 text-blue-400' },
  }
  const badge = labels[method] ?? { text: method, className: 'bg-slate-700 text-slate-400' }
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-mono ${badge.className}`}>
      {badge.text}
    </span>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

interface ActivityTimelineItemProps {
  entry: ActivityRow
  showLoanLabel?: boolean
}

export default function ActivityTimelineItem({ entry, showLoanLabel }: ActivityTimelineItemProps) {
  const style = getStyle(entry.event_type)
  const Icon = style.icon
  const meta = entry.metadata ?? {}
  const isIMessage = entry.event_type === 'imessage_received' || entry.action === 'imessage.received'

  return (
    <div className="flex gap-3 py-2 group">
      {/* Icon */}
      <div
        className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5"
        style={{ backgroundColor: style.bg }}
      >
        <Icon className="w-3.5 h-3.5" style={{ color: style.color }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-white font-mono">
            {actionLabel(entry.action, entry.event_type)}
          </span>
          {showLoanLabel && entry.loan_name && (
            <span className="text-[10px] text-slate-500 font-mono bg-[#0f172a] px-1.5 py-0.5 rounded">
              {entry.loan_name}
            </span>
          )}
          {isIMessage && !!meta.match_method && (
            <MatchMethodBadge method={meta.match_method as string} />
          )}
          <span className="text-[10px] text-slate-600 font-mono ml-auto flex-shrink-0">
            {timeAgo(entry.created_at)}
          </span>
        </div>

        {/* Summary / snippet */}
        {isIMessage && meta.snippet ? (
          <p className="text-xs text-slate-400 mt-0.5 font-mono truncate">
            {meta.snippet as string}
          </p>
        ) : entry.summary ? (
          <p className="text-xs text-slate-400 mt-0.5 font-mono truncate">
            {entry.summary}
          </p>
        ) : null}
      </div>
    </div>
  )
}
