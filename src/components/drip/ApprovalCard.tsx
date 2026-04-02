'use client'

import { useState } from 'react'
import type { DripSendWithDetails } from '@/lib/drip/types'

interface ApprovalCardProps {
  send: DripSendWithDetails
  onAction: (sendId: string, action: 'approve' | 'skip' | 'cancel', edits?: { subject?: string; body?: string }) => void
}

export default function ApprovalCard({ send, onAction }: ApprovalCardProps) {
  const [editing, setEditing] = useState(false)
  const [subject, setSubject] = useState(send.generated_subject ?? '')
  const [body, setBody] = useState(send.generated_body ?? '')

  return (
    <div className="bg-surface border border-loanborder rounded-lg px-5 py-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="font-medium text-sm">{send.contact_name}</span>
          <span className="font-mono text-[11px] text-loanmuted ml-3">{send.contact_email}</span>
        </div>
        <div className="font-mono text-[10px] text-loanmuted">
          <span className="text-gold">{send.campaign_name}</span>
          <span className="mx-2">&middot;</span>
          <span>{send.step_name}</span>
        </div>
      </div>

      {/* Email Preview */}
      <div className="bg-surface2 rounded-lg px-4 py-3 mb-4">
        {editing ? (
          <>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-background border border-loanborder rounded px-3 py-1.5 text-sm font-semibold mb-2"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full bg-background border border-loanborder rounded px-3 py-2 text-sm min-h-[120px] resize-y"
            />
          </>
        ) : (
          <>
            <div className="text-sm font-semibold mb-2">{send.generated_subject}</div>
            <div className="text-sm text-loanmuted whitespace-pre-wrap leading-relaxed">{send.generated_body}</div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end">
        <button
          onClick={() => onAction(send.id, 'cancel')}
          className="font-mono text-xs px-4 py-2 border border-loanborder bg-surface rounded-lg hover:bg-surface2 text-loanred"
        >
          Cancel
        </button>
        <button
          onClick={() => onAction(send.id, 'skip')}
          className="font-mono text-xs px-4 py-2 border border-loanborder bg-surface rounded-lg hover:bg-surface2"
        >
          Skip
        </button>
        {editing ? (
          <button
            onClick={() => { onAction(send.id, 'approve', { subject, body }); setEditing(false) }}
            className="font-mono text-xs px-4 py-2 bg-gold text-white rounded-lg hover:bg-gold/90"
          >
            Save & Approve
          </button>
        ) : (
          <>
            <button
              onClick={() => setEditing(true)}
              className="font-mono text-xs px-4 py-2 border border-gold text-gold rounded-lg hover:bg-gold/10"
            >
              Edit
            </button>
            <button
              onClick={() => onAction(send.id, 'approve')}
              className="font-mono text-xs px-4 py-2 bg-gold text-white rounded-lg hover:bg-gold/90"
            >
              Approve & Send
            </button>
          </>
        )}
      </div>
    </div>
  )
}
