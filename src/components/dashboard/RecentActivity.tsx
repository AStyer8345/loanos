'use client'

import { useState } from 'react'
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

const ALL_TYPES = ['all', 'email', 'call', 'automation', 'document', 'note', 'task']

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
  const [filter, setFilter] = useState('all')

  const filtered = filter === 'all'
    ? entries
    : entries.filter(e => (e.type || e.action || '').toLowerCase().includes(filter))

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Activity — Last 7 Days</span>
        <span className="text-xs font-mono text-zinc-600">{filtered.length} entries</span>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 flex-wrap mb-3">
        {ALL_TYPES.map(type => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`text-xs font-mono px-2 py-1 rounded transition-colors ${
              filter === type
                ? 'bg-zinc-700 text-zinc-200'
                : 'text-zinc-600 hover:text-zinc-400'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-zinc-600">
          <div className="font-mono text-sm">No activity in last 7 days</div>
          <div className="font-mono text-xs mt-1 text-zinc-700">Activity logs will appear here</div>
        </div>
      )}

      <div className="space-y-1 max-h-64 overflow-y-auto">
        {filtered.slice(0, 25).map(entry => {
          const type = (entry.type || entry.action || 'task').toLowerCase()
          const icon = TYPE_ICONS[type] ?? <Clock className="w-3.5 h-3.5" />
          const colors = TYPE_COLORS[type] ?? 'text-zinc-400 bg-zinc-800'
          const contactName = (entry.metadata?.contact_name as string) || (entry.metadata?.borrower_name as string) || null
          const summary = entry.summary || entry.action || 'Activity logged'

          return (
            <div key={entry.id} className="flex items-start gap-2.5 py-2 border-b border-zinc-800 last:border-0">
              <span className={`p-1 rounded flex-shrink-0 mt-0.5 ${colors}`}>{icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-mono text-zinc-200 truncate">{summary}</div>
                  <span className="text-xs font-mono text-zinc-600 flex-shrink-0">{timeAgo(entry.created_at)}</span>
                </div>
                {contactName && (
                  <div className="text-xs font-mono text-zinc-500 mt-0.5">{contactName}</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
