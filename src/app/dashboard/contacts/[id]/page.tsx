'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { AlertCircle } from 'lucide-react'
import { ContactRecordView, type Contact, type ContactLoan, type ActivityEntry, type EmailDraftRow } from './ContactRecordView'

export default function ContactRecordPage() {
  const params = useParams()
  const id = params.id as string

  const [contact, setContact] = useState<Contact | null>(null)
  const [loans, setLoans] = useState<ContactLoan[]>([])
  const [activity, setActivity] = useState<ActivityEntry[]>([])
  const [referrerContactId, setReferrerContactId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'loans' | 'activity' | 'notes' | 'emails'>('overview')
  const [emailDrafts, setEmailDrafts] = useState<EmailDraftRow[]>([])
  const [newNote, setNewNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  const supabase = createClient()

  const fetchContact = useCallback(async () => {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', id)
      .single()
    if (!error && data) setContact(data as Contact)
    return data as Contact | null
  }, [id, supabase])

  const fetchLoans = useCallback(async () => {
    const { data } = await supabase
      .from('loans')
      .select('id, loan_name, borrower_name, status, loan_amount, interest_rate, closing_date, property_address, property_city, property_state, loan_purpose, loan_type, created_at')
      .eq('contact_id', id)
      .order('closing_date', { ascending: false, nullsFirst: false })
    setLoans((data as ContactLoan[]) ?? [])
  }, [id, supabase])

  const fetchActivity = useCallback(async () => {
    // 1. Activity directly linked to this contact
    const { data: contactRows } = await supabase
      .from('activity_log')
      .select('id, created_at, action, entity_type, metadata, type, summary, raw_payload, external_id, loan_id')
      .eq('contact_id', id)
      .order('created_at', { ascending: false })
      .limit(200)

    const merged: ActivityEntry[] = (contactRows ?? []) as ActivityEntry[]
    const seen = new Set(merged.map(r => r.id))

    // 2. Activity from loans linked to this contact
    const { data: linkedLoans } = await supabase
      .from('loans')
      .select('id, loan_name')
      .eq('contact_id', id)

    if (linkedLoans && linkedLoans.length > 0) {
      const loanIds = linkedLoans.map((l: { id: string }) => l.id)
      const { data: loanRows } = await supabase
        .from('activity_log')
        .select('id, created_at, action, entity_type, metadata, type, summary, raw_payload, external_id, loan_id')
        .in('loan_id', loanIds)
        .order('created_at', { ascending: false })
        .limit(200)

      for (const row of (loanRows ?? []) as ActivityEntry[]) {
        if (seen.has(row.id)) continue          // already in contact activity
        const loan = linkedLoans.find((l: { id: string }) => l.id === row.loan_id)
        const label = (loan as { loan_name?: string | null } | undefined)?.loan_name
          ? `Loan: ${(loan as { loan_name: string }).loan_name}`
          : 'Linked Loan'
        merged.push({ ...row, _source: label })
        seen.add(row.id)
      }
    }

    // 3. Sort merged list chronologically
    merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    setActivity(merged)
  }, [id, supabase])

  const resolveReferrer = useCallback(async (referredBy: string | null) => {
    if (!referredBy?.trim()) { setReferrerContactId(null); return }
    const parts = referredBy.trim().split(/\s+/)
    const firstName = parts[0] ?? ''
    const lastName = parts.slice(1).join(' ') || ''
    let q = supabase.from('contacts').select('id, first_name, last_name')
    if (firstName) q = q.ilike('first_name', firstName)
    if (lastName) q = q.ilike('last_name', lastName)
    const { data: list } = await q.limit(50)
    const match = (list ?? []).find(
      (c: { first_name: string | null; last_name: string | null }) =>
        `${(c.first_name ?? '').trim()} ${(c.last_name ?? '').trim()}`.trim() === referredBy.trim()
    )
    setReferrerContactId(match ? (match as { id: string }).id : null)
  }, [supabase])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const c = await fetchContact()
      if (cancelled) return
      if (c) {
        await Promise.all([fetchLoans(), fetchActivity()])
        await resolveReferrer(c.referred_by)
        const { data: drafts } = await supabase
          .from('email_drafts')
          .select('id, automation_name, recipient_name, recipient_email, subject, body_html, body_preview, status, created_at')
          .eq('contact_id', id)
          .order('created_at', { ascending: false })
          .limit(100)
        setEmailDrafts((drafts ?? []) as EmailDraftRow[])
      }
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [fetchContact, fetchLoans, fetchActivity, resolveReferrer])

  const handleAddNote = async () => {
    if (!contact || !newNote.trim()) return
    setSavingNote(true)
    const dateLabel = new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
    const appended = (contact.notes ?? '') + '\n\n--- ' + dateLabel + ' ---\n' + newNote.trim()
    const { error: updateErr } = await supabase
      .from('contacts')
      .update({ notes: appended })
      .eq('id', contact.id)
    if (!updateErr) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('activity_log').insert({
          action: 'note.added',
          entity_type: 'contact',
          contact_id: contact.id,
          metadata: { preview: newNote.trim().slice(0, 100) },
          user_id: user.id,
        })
      }
      setContact(prev => prev ? { ...prev, notes: appended } : null)
      setNewNote('')
      await fetchActivity()
    }
    setSavingNote(false)
  }

  const handleSaveNotes = async (notes: string) => {
    if (!contact) return
    const { error } = await supabase
      .from('contacts')
      .update({ notes })
      .eq('id', contact.id)
    if (!error) {
      setContact(prev => prev ? { ...prev, notes } : null)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)' }}>
        Loading...
      </div>
    )
  }

  if (!contact) {
    return (
      <div style={{ padding: 48, textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
        <AlertCircle size={24} style={{ color: 'var(--muted)', marginBottom: 12 }} />
        <p style={{ color: 'var(--muted)', marginBottom: 16 }}>Contact not found</p>
        <Link
          href="/dashboard/contacts"
          style={{ color: '#c9a84c', textDecoration: 'none', fontSize: 12 }}
        >
          Back to Contacts
        </Link>
      </div>
    )
  }

  return (
    <ContactRecordView
      contact={contact}
      loans={loans}
      activity={activity}
      emailDrafts={emailDrafts}
      referrerContactId={referrerContactId}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      newNote={newNote}
      setNewNote={setNewNote}
      savingNote={savingNote}
      onAddNote={handleAddNote}
      onSaveNotes={handleSaveNotes}
    />
  )
}
