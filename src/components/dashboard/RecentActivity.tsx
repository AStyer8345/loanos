'use client'

import { Mail, Phone, FileText, Zap, MessageSquare, Clock } from 'lucide-react'

interface ActivityEntry {
  id: string
  created_at: string
  type?: string | null
  action?: string | null
  summary?: string | null
  contact_id?: string | null
  loan_id?: string | null
  metadata?: Record<string, unknown> | null
}

interface RecentActivityProps {
  entries: ActivityEntry[]
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  email: <Mail className="w-3.5 h-3.5" />,
  call: <Phone className="w-3.5 h-3.5" />,
  document: <FileText className="w-3.5 h-3.5" />,
  automation: <Zap className="w-3.5 h-3.5" />,
  note: <MessageSquare className="w-3.5 h-3.5" />,
  task: <Clock className="w-3.5 h-3.5" />,
}

const TYPE_COLORS: Record<string, string> = {
  email: 'text-blue-400 bg-blue-900/20',
  call: 'text-emerald-400 bg-emerald-900/20',
  document: 'text-zinc-400 bg-zinc-800',
  automation: 'text-yellow-400 bg-yellow-900/20',
  note: 'text-purple-400 bg-purple-900/20',
  task: 'text-zinc-400 bg-zinc-800',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (mins > 0) return `${mins}m ago`
  return 'just now'
}

export default function RecentActivity({ entries }: RecentActivityProps) {
  return (
    <div className="bg-zinc-900 rounded shadow-lg shadow-black/50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <span className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-widest">Activity</span>
        <span className="text-xs font-mono text-zinc-600">{entries.length} entries</span>
      </div>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-zinc-600 font-mono">
          <div className="text-sm">No activity in last 7 days</div>
        </div>
      ) : (
        <div className="divide-y divide-zinc-800 overflow-y-auto max-h-96">
          {entries.slice(0, 15).map(entry => {
            const type = (entry.type || entry.action || 'task').toLowerCase()
            const icon = TYPE_ICONS[type] ?? <Clock className="w-3.5 h-3.5" />
            const colors = TYPE_COLORS[type] ?? 'text-zinc-400 bg-zinc-800'
            const contactName = (entry.metadata?.contact_name as string) || (entry.metadata?.borrower_name as string) || null
            const summary = entry.summary || entry.action || 'Activity logged'

            return (
              <div key={entry.id} className="flex items-start gap-2.5 px-4 py-3">
                <span className={`p-1 rounded flex-shrink-0 mt-0.5 ${colors}`}>{icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-xs font-mono text-zinc-200 leading-snug">{summary}</div>
                    <span className="text-[10px] font-mono text-zinc-600 flex-shrink-0 mt-0.5">{timeAgo(entry.created_at)}</span>
                  </div>
                  {contactName && (
                    <div className="text-[10px] font-mono text-zinc-500 mt-0.5">{contactName}</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
