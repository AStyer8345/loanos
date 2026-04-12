// SaaS-safe: org-scoped via RLS
'use client'

import { useState } from 'react'
import { Pencil, Trash2, Check, X } from 'lucide-react'
import type { NoteRow } from './NoteInput'

interface NoteCardProps {
  note: NoteRow
  onUpdate: (id: string, content: string) => void
  onDelete: (id: string) => void
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

export default function NoteCard({ note, onUpdate, onDelete }: NoteCardProps) {
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(note.content)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleSave = async () => {
    if (!editContent.trim() || saving) return
    setSaving(true)
    try {
      const res = await fetch(`/api/notes/${note.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent.trim() }),
      })
      if (res.ok) {
        onUpdate(note.id, editContent.trim())
        setEditing(false)
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (deleting) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/notes/${note.id}`, { method: 'DELETE' })
      if (res.ok) {
        onDelete(note.id)
      }
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="bg-[#1e293b] border border-[#334155] rounded-md p-3 group">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs text-slate-500 font-mono flex-shrink-0">
          {timeAgo(note.created_at)}
          {note.updated_at !== note.created_at && ' (edited)'}
        </span>
        {!editing && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => { setEditContent(note.content); setEditing(true) }}
              className="p-1 text-slate-500 hover:text-[#C9A84C] transition-colors"
              title="Edit note"
            >
              <Pencil className="w-3 h-3" />
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-1 text-slate-500 hover:text-red-400 transition-colors"
              title="Delete note"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
      {editing ? (
        <div className="mt-2">
          <textarea
            value={editContent}
            onChange={e => setEditContent(e.target.value)}
            className="w-full bg-[#0f172a] border border-[#334155] rounded-md px-3 py-2 text-sm text-white resize-none focus:outline-none focus:ring-1 focus:ring-[#C9A84C] font-mono"
            rows={3}
            autoFocus
          />
          <div className="flex gap-1 mt-1 justify-end">
            <button
              onClick={() => setEditing(false)}
              className="p-1 text-slate-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={handleSave}
              disabled={!editContent.trim() || saving}
              className="p-1 text-[#C9A84C] hover:text-[#d4b85d] transition-colors disabled:opacity-40"
            >
              <Check className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-1 text-sm text-slate-300 whitespace-pre-wrap font-mono">
          {note.content}
        </p>
      )}
    </div>
  )
}
