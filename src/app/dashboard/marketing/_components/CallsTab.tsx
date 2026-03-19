'use client'

import { useState, useRef } from 'react'
import { type MCCContact, type MCCState } from '@/lib/marketing/types'
import { SectionLabel, FieldLabel, Input, Btn } from './shared'
import ContactCard from './ContactCard'

type ListKey = keyof MCCState['contacts']

const LIST_CONFIG: { key: ListKey; label: string }[] = [
  { key: 'realtors',     label: 'REALTORS' },
  { key: 'preapprovals', label: 'PRE-APPROVALS' },
  { key: 'inprocess',    label: 'ACTIVE FILES' },
  { key: 'hotleads',     label: 'HOT LEADS' },
]

type Props = {
  mccState: MCCState
  onSave:   (next: MCCState) => Promise<void>
}

const emptyContact = (): Omit<MCCContact, 'id'> => ({
  first: '', last: '', company: '', phone: '', email: '',
  lastTouch: null, note: '', callHistory: [],
})

export default function CallsTab({ mccState, onSave }: Props) {
  const [activeList, setActiveList] = useState<ListKey>('realtors')
  const [search, setSearch]         = useState('')
  const [showAdd, setShowAdd]       = useState(false)
  const [newContact, setNewContact] = useState(emptyContact())
  const [addError, setAddError]     = useState('')
  const [mutateError, setMutateError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const contacts = mccState.contacts[activeList] ?? []

  const filtered = contacts.filter(c => {
    const q = search.toLowerCase()
    return !q || `${c.first} ${c.last} ${c.company}`.toLowerCase().includes(q)
  })

  // ── Add contact ────────────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!newContact.first.trim() || !newContact.last.trim()) {
      setAddError('First name and last name are required.')
      return
    }
    const contact: MCCContact = {
      ...newContact,
      id: crypto.randomUUID(),
      callHistory: [],
    }
    const nextState: MCCState = {
      ...mccState,
      contacts: {
        ...mccState.contacts,
        [activeList]: [contact, ...mccState.contacts[activeList]],
      },
    }
    try {
      await onSave(nextState)
    } catch {
      setMutateError('Save failed. Please try again.')
      return
    }
    setNewContact(emptyContact())
    setShowAdd(false)
    setAddError('')
    setMutateError('')
  }

  // ── Delete contact ─────────────────────────────────────────────────────────
  const handleDelete = async (id: string, first: string, last: string) => {
    if (!confirm(`Delete ${first} ${last}? This cannot be undone.`)) return
    const nextState: MCCState = {
      ...mccState,
      contacts: {
        ...mccState.contacts,
        [activeList]: mccState.contacts[activeList].filter(c => c.id !== id),
      },
    }
    try {
      await onSave(nextState)
    } catch {
      setMutateError('Save failed. Please try again.')
      return
    }
    setMutateError('')
  }

  // ── CSV import ─────────────────────────────────────────────────────────────
  const handleCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const text = await file.text()
    const lines = text.split('\n').filter(Boolean)
    if (lines.length < 2) { alert('CSV is empty or missing rows.'); return }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    const idxOf = (name: string) => headers.indexOf(name)

    const existing = new Set(
      mccState.contacts[activeList].map(c => `${c.first}|${c.last}`.toLowerCase())
    )

    let added = 0
    let skipped = 0
    const imported: MCCContact[] = []

    for (const line of lines.slice(1)) {
      const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''))
      const first = cols[idxOf('firstname')] ?? ''
      const last  = cols[idxOf('lastname')]  ?? ''
      if (!first && !last) continue
      const key = `${first}|${last}`.toLowerCase()
      if (existing.has(key)) { skipped++; continue }
      imported.push({
        id:          crypto.randomUUID(),
        first,
        last,
        company:     cols[idxOf('company')]   ?? '',
        phone:       cols[idxOf('phone')]      ?? '',
        email:       cols[idxOf('email')]      ?? '',
        lastTouch:   cols[idxOf('lasttouch')]  || null,
        note:        '',
        callHistory: [],
      })
      existing.add(key)
      added++
    }

    if (added === 0) { alert(`No new contacts to import. ${skipped} duplicate(s) skipped.`); return }

    const nextState: MCCState = {
      ...mccState,
      contacts: {
        ...mccState.contacts,
        [activeList]: [...imported, ...mccState.contacts[activeList]],
      },
    }
    try {
      await onSave(nextState)
    } catch {
      setMutateError('Save failed. Please try again.')
      return
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
    setMutateError('')
    alert(`Imported ${added} contact(s).${skipped ? ` ${skipped} duplicate(s) skipped.` : ''}`)
  }

  return (
    <div className="space-y-4">
      {/* List selector pills */}
      <div className="flex gap-2 flex-wrap">
        {LIST_CONFIG.map(({ key, label }) => {
          const count = mccState.contacts[key]?.length ?? 0
          const active = activeList === key
          return (
            <button
              key={key}
              onClick={() => { setActiveList(key); setSearch(''); setShowAdd(false) }}
              className="px-3 py-1.5 rounded-sm text-xs font-bold transition-all border"
              style={{
                borderColor: active ? '#C9A84C' : '#3f3f46',
                color:       active ? '#09090b' : '#71717a',
                background:  active ? '#C9A84C' : 'transparent',
              }}
            >
              {label} ({count})
            </button>
          )
        })}
      </div>

      {/* Mutate error */}
      {mutateError && <p className="text-red-400 text-xs">{mutateError}</p>}

      {/* Search + actions */}
      <div className="flex gap-2">
        <Input
          placeholder="Search contacts..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1"
        />
        <Btn variant="secondary" size="sm" onClick={() => setShowAdd(!showAdd)}>
          + ADD
        </Btn>
        <Btn variant="ghost" size="sm" onClick={() => fileRef.current?.click()}>
          ↑ CSV
        </Btn>
        <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCSV} />
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-zinc-900 border border-zinc-700 rounded-sm p-4 space-y-3">
          <SectionLabel>ADD CONTACT</SectionLabel>
          {addError && <p className="text-red-400 text-xs">{addError}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>FIRST NAME *</FieldLabel>
              <Input value={newContact.first} onChange={e => setNewContact(p => ({ ...p, first: e.target.value }))} autoFocus />
            </div>
            <div>
              <FieldLabel>LAST NAME *</FieldLabel>
              <Input value={newContact.last} onChange={e => setNewContact(p => ({ ...p, last: e.target.value }))} />
            </div>
            <div>
              <FieldLabel>COMPANY</FieldLabel>
              <Input value={newContact.company} onChange={e => setNewContact(p => ({ ...p, company: e.target.value }))} />
            </div>
            <div>
              <FieldLabel>PHONE</FieldLabel>
              <Input type="tel" value={newContact.phone} onChange={e => setNewContact(p => ({ ...p, phone: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <FieldLabel>EMAIL</FieldLabel>
              <Input type="email" value={newContact.email} onChange={e => setNewContact(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <FieldLabel>NOTE</FieldLabel>
              <Input value={newContact.note} onChange={e => setNewContact(p => ({ ...p, note: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2">
            <Btn onClick={handleAdd}>Save Contact</Btn>
            <Btn variant="ghost" onClick={() => { setShowAdd(false); setNewContact(emptyContact()); setAddError('') }}>
              Cancel
            </Btn>
          </div>
        </div>
      )}

      {/* Contact grid — empty state */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-zinc-600">
          <p className="text-sm">
            {search
              ? `No contacts match "${search}"`
              : (() => {
                  const rawLabel = LIST_CONFIG.find(l => l.key === activeList)?.label ?? ''
                  const friendlyLabel = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1).toLowerCase()
                  return `No ${friendlyLabel} yet. Add manually or import a CSV.`
                })()}
          </p>
          {!search && (
            <div className="mt-3">
              <Btn variant="secondary" size="sm" onClick={() => setShowAdd(true)}>+ ADD</Btn>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map(contact => (
            <ContactCard
              key={contact.id}
              contact={contact}
              listKey={activeList}
              mccState={mccState}
              onSave={onSave}
              onDelete={() => handleDelete(contact.id, contact.first, contact.last)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
