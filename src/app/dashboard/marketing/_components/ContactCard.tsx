'use client'

import { useState } from 'react'
import { type MCCContact, type MCCState, type LogEntry } from '@/lib/marketing/types'
import { Btn, Input } from './shared'
import { todayString } from '@/lib/marketing/utils'

const GOLD = '#C9A84C'
const GREEN = '#4CAF82'
const RED = '#E05252'

type Props = {
  contact:   MCCContact
  listKey:   keyof MCCState['contacts']
  mccState:  MCCState
  onSave:    (next: MCCState) => Promise<void>
  onDelete:  () => void
}

export default function ContactCard({ contact, listKey, mccState, onSave, onDelete }: Props) {
  const [showNoteInput, setShowNoteInput] = useState(false)
  const [callNote, setCallNote]           = useState('')
  const [saving, setSaving]               = useState(false)
  const [saveError, setSaveError]         = useState('')

  const calledToday = contact.lastTouch === todayString()

  // Last touch color
  const lastTouchColor = (() => {
    if (!contact.lastTouch) return RED
    const days = Math.floor((Date.now() - new Date(contact.lastTouch + 'T12:00:00').getTime()) / 86400000)
    if (days <= 14) return GREEN
    if (days <= 21) return GOLD
    return RED
  })()

  const handleMarkCalled = () => setShowNoteInput(true)

  const handleSaveCall = async () => {
    setSaving(true)
    try {
      const today = todayString()
      const now   = new Date().toISOString()

      // Update contact
      const updatedContact: MCCContact = {
        ...contact,
        lastTouch:   today,
        callHistory: [
          { date: today, note: callNote },
          ...(contact.callHistory ?? []),
        ],
      }

      // Create log entry
      const entry: LogEntry = {
        id:       crypto.randomUUID(),
        date:     now,
        activity: `Called ${contact.first} ${contact.last}`,
        channel:  'Phone Call',
        notes:    callNote,
      }

      // Determine tracker key update for this list
      const trackerUpdates: Record<string, string> = {}
      if (listKey === 'realtors')     trackerUpdates['realtor-calls'] = now
      if (listKey === 'preapprovals') trackerUpdates['preapproval']   = now

      // Update state
      const updatedList = mccState.contacts[listKey].map(c =>
        c.id === contact.id ? updatedContact : c
      )

      const nextState: MCCState = {
        ...mccState,
        log:  [entry, ...mccState.log],
        last: { ...mccState.last, ...trackerUpdates },
        contacts: { ...mccState.contacts, [listKey]: updatedList },
      }

      await onSave(nextState)
      setSaveError('')
      setShowNoteInput(false)
      setCallNote('')
    } catch {
      setSaveError('Failed to save call. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="bg-card border border-input rounded-sm p-3 relative transition-opacity"
      style={{ opacity: calledToday ? 0.55 : 1 }}
    >
      {/* Called today badge */}
      {calledToday && (
        <div className="absolute top-2 right-2 text-xs font-bold" style={{ color: GREEN, fontSize: 9 }}>
          ✓ CALLED TODAY
        </div>
      )}

      {/* Delete */}
      {!calledToday && (
        <button
          onClick={onDelete}
          className="absolute top-2 right-2 text-muted-foreground hover:text-red-400 text-xs leading-none"
          title="Delete contact"
        >
          ✕
        </button>
      )}

      {/* Name + company */}
      <div className="font-bold text-foreground pr-6" style={{ fontSize: 13 }}>
        {contact.first} {contact.last}
      </div>
      {contact.company && (
        <div className="text-muted-foreground text-xs mt-0.5">{contact.company}</div>
      )}

      {/* Contact links */}
      <div className="flex gap-3 mt-2 text-xs">
        {contact.phone && (
          <a href={`tel:${contact.phone}`} className="text-muted-foreground hover:text-foreground">{contact.phone}</a>
        )}
        {contact.email && (
          <a href={`mailto:${contact.email}`} className="text-muted-foreground hover:text-foreground">{contact.email}</a>
        )}
      </div>

      {/* Last touch */}
      <div className="mt-2 text-xs" style={{ color: lastTouchColor }}>
        Last touch: {contact.lastTouch
          ? new Date(contact.lastTouch).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : 'Never'}
      </div>

      {/* Call history (last 2) */}
      {contact.callHistory?.slice(0, 2).map((h) => (
        <div key={h.date} className="text-xs text-muted-foreground mt-0.5">
          {h.date}: {h.note || 'No note'}
        </div>
      ))}

      {/* Mark called / note input */}
      {!showNoteInput ? (
        <div className="mt-3">
          <Btn size="xs" onClick={handleMarkCalled} disabled={calledToday}>
            📞 Mark Called
          </Btn>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          <Input
            placeholder="Add a call note (optional)..."
            value={callNote}
            onChange={e => setCallNote(e.target.value)}
            autoFocus
          />
          {saveError && (
            <p className="text-red-400 text-xs">{saveError}</p>
          )}
          <div className="flex gap-2">
            <Btn size="xs" onClick={handleSaveCall} disabled={saving}>
              {saving ? 'Saving...' : 'Save Call'}
            </Btn>
            <Btn size="xs" variant="ghost" onClick={() => { setShowNoteInput(false); setCallNote(''); setSaveError('') }}>
              Cancel
            </Btn>
          </div>
        </div>
      )}
    </div>
  )
}
