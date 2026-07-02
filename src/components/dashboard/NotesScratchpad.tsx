'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { StickyNote } from 'lucide-react'
import { Card } from '@/components/ui/card'

type ScratchNote = {
  id: string
  content: string
  contact_id: string | null
  loan_id: string | null
  created_at: string
  contacts: { first_name: string | null; last_name: string | null } | null
  loans: { loan_name: string | null; borrower_first_name: string | null; borrower_last_name: string | null } | null
}

function relTime(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return days === 1 ? '1d ago' : `${days}d ago`
}

function noteTarget(n: ScratchNote): { label: string; href: string } | null {
  if (n.contact_id) {
    const name = [n.contacts?.first_name, n.contacts?.last_name].filter(Boolean).join(' ') || 'Contact'
    return { label: name, href: `/dashboard/contacts/${n.contact_id}` }
  }
  if (n.loan_id) {
    const name = [n.loans?.borrower_first_name, n.loans?.borrower_last_name].filter(Boolean).join(' ')
      || n.loans?.loan_name || 'Loan'
    return { label: name, href: `/dashboard/loans/${n.loan_id}` }
  }
  return null
}

export default function NotesScratchpad() {
  const [notes, setNotes] = useState<ScratchNote[]>([])
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/notes')
      if (res.ok) setNotes(await res.json())
    } catch { /* leave list as-is */ }
    setLoaded(true)
  }, [])

  useEffect(() => { load() }, [load])

  async function saveNote() {
    const content = draft.trim()
    if (!content || saving) return
    setSaving(true)
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      if (res.ok) {
        setDraft('')
        await load()
      }
    } finally {
      setSaving(false)
    }
  }

  async function deleteNote(id: string) {
    setNotes(prev => prev.filter(n => n.id !== id))
    await fetch(`/api/notes/${id}`, { method: 'DELETE' })
  }

  return (
    <Card className="overflow-hidden flex flex-col">
      <div className="px-4 py-3 border-b border-input flex items-center gap-2">
        <StickyNote className="w-3.5 h-3.5 text-[#C9A84C]" />
        <span className="text-xs font-mono font-semibold text-[#C9A84C] uppercase tracking-widest">Notes</span>
        <span className="text-[10px] font-mono text-muted-foreground">scratchpad + recent record notes</span>
      </div>

      <div className="p-3 border-b border-input">
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') saveNote()
          }}
          placeholder="Jot something — a call, a thought on a file… (⌘↵ to save)"
          rows={2}
          className="w-full bg-muted border border-input rounded px-2.5 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground/60 resize-none focus:outline-none focus:border-[#C9A84C]/60"
        />
        <div className="flex justify-end mt-1.5">
          <button
            onClick={saveNote}
            disabled={!draft.trim() || saving}
            className="px-3 py-1 rounded text-[11px] font-mono font-medium bg-[#C9A84C] text-black disabled:opacity-40 hover:opacity-90 transition-opacity"
          >
            {saving ? 'Saving…' : 'Save note'}
          </button>
        </div>
      </div>

      <div className="divide-y divide-input max-h-[220px] overflow-y-auto">
        {loaded && notes.length === 0 && (
          <p className="px-4 py-3 text-[11px] font-mono text-muted-foreground italic">No notes yet.</p>
        )}
        {notes.map(n => {
          const target = noteTarget(n)
          return (
            <div key={n.id} className="px-4 py-2.5 group">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[11px] font-mono text-foreground leading-relaxed whitespace-pre-wrap flex-1">{n.content}</p>
                <button
                  onClick={() => deleteNote(n.id)}
                  title="Delete note"
                  className="text-zinc-700 hover:text-muted-foreground transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                >×</button>
              </div>
              <div className="flex items-center gap-2 mt-1">
                {target ? (
                  <Link href={target.href} className="text-[10px] font-mono text-[#C9A84C]/80 hover:text-[#C9A84C]">
                    {target.label}
                  </Link>
                ) : (
                  <span className="text-[10px] font-mono text-muted-foreground/70">global</span>
                )}
                <span className="text-[10px] font-mono text-muted-foreground/70">{relTime(n.created_at)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
