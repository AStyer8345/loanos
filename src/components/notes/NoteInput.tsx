// SaaS-safe: org-scoped via RLS
'use client'

import { useState } from 'react'
import { StickyNote } from 'lucide-react'

interface NoteInputProps {
  contactId?: string | null
  loanId?: string | null
  onNoteCreated: (note: NoteRow) => void
}

export interface NoteRow {
  id: string
  organization_id: string
  contact_id: string | null
  loan_id: string | null
  content: string
  created_by: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export default function NoteInput({ contactId, loanId, onNoteCreated }: NoteInputProps) {
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!content.trim() || saving) return
    setSaving(true)
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_id: contactId || null,
          loan_id: loanId || null,
          content: content.trim(),
        }),
      })
      if (res.ok) {
        const note = await res.json()
        onNoteCreated(note)
        setContent('')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex gap-2 items-start">
      <div className="flex-shrink-0 mt-2">
        <StickyNote className="w-4 h-4 text-[#C9A84C]" />
      </div>
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Add a note..."
        className="flex-1 bg-[#1e293b] border border-[#334155] rounded-md px-3 py-2 text-sm text-white placeholder:text-slate-500 resize-none focus:outline-none focus:ring-1 focus:ring-[#C9A84C] font-mono"
        rows={2}
        onKeyDown={e => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault()
            handleSubmit()
          }
        }}
      />
      <button
        onClick={handleSubmit}
        disabled={!content.trim() || saving}
        className="flex-shrink-0 px-3 py-2 bg-[#C9A84C] text-[#060b18] text-xs font-bold rounded-md hover:bg-[#d4b85d] disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-mono"
      >
        {saving ? 'Saving...' : 'Save'}
      </button>
    </div>
  )
}
