'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { MailQuestion, UserPlus, X } from 'lucide-react'
import { Card } from '@/components/ui/card'

type UnmatchedEmail = {
  id: string
  from_address: string | null
  subject: string | null
  occurred_at: string | null
  metadata: { from_name?: string } | null
}

type SenderGroup = {
  address: string
  displayName: string
  count: number
  latestSubject: string
  emailIds: string[]
}

function parseName(group: { displayName: string; address: string }): { first_name: string; last_name: string | null } {
  const raw = group.displayName.trim()
  // Display names from email headers are often "First Last" or "Last, First"
  if (raw && !raw.includes('@')) {
    const parts = raw.includes(',')
      ? raw.split(',').map(s => s.trim()).reverse()
      : raw.split(/\s+/)
    return { first_name: parts[0] || raw, last_name: parts.slice(1).join(' ') || null }
  }
  const local = group.address.split('@')[0]
  const parts = local.split(/[._-]+/).filter(Boolean)
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
  return { first_name: cap(parts[0] || local), last_name: parts[1] ? cap(parts[1]) : null }
}

export default function UnknownSendersWidget() {
  const [groups, setGroups] = useState<SenderGroup[]>([])
  const [total, setTotal] = useState(0)
  const [busy, setBusy] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/activity?type=email_inbound&unmatched=true&order=occurred_at&limit=200&columns=id,from_address,subject,occurred_at,metadata')
        if (res.ok) {
          const emails: UnmatchedEmail[] = await res.json()
          const map = new Map<string, SenderGroup>()
          for (const e of emails) {
            const addr = (e.from_address || '').toLowerCase()
            if (!addr) continue
            const g = map.get(addr) ?? {
              address: addr,
              displayName: e.metadata?.from_name || addr,
              count: 0,
              latestSubject: e.subject || '',
              emailIds: [],
            }
            g.count++
            g.emailIds.push(e.id)
            map.set(addr, g)
          }
          const sorted = [...map.values()].sort((a, b) => b.count - a.count)
          setGroups(sorted.slice(0, 6))
          setTotal(emails.length)
        }
      } catch { /* widget stays empty */ }
      setLoaded(true)
    })()
  }, [])

  async function ignoreSender(group: SenderGroup) {
    setBusy(group.address)
    try {
      await Promise.all(group.emailIds.map(id =>
        fetch('/api/emails/link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emailId: id, dismiss: true }),
        })
      ))
      setGroups(prev => prev.filter(g => g.address !== group.address))
      setTotal(t => Math.max(0, t - group.count))
    } finally {
      setBusy(null)
    }
  }

  async function createContact(group: SenderGroup) {
    setBusy(group.address)
    try {
      const name = parseName(group)
      const res = await fetch('/api/contacts/quick-add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmed: true,
          contact: { ...name, email: group.address, stage: 'Lead', contact_type: 'borrower' },
        }),
      })
      if (!res.ok) return
      const { contact } = await res.json()
      if (contact?.id) {
        await Promise.all(group.emailIds.map(id =>
          fetch('/api/emails/link', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emailId: id, contactId: contact.id }),
          })
        ))
      }
      setGroups(prev => prev.filter(g => g.address !== group.address))
      setTotal(t => Math.max(0, t - group.count))
    } finally {
      setBusy(null)
    }
  }

  if (loaded && total === 0) return null

  return (
    <Card className="overflow-hidden flex flex-col">
      <div className="px-4 py-3 border-b border-input flex items-center gap-2">
        <MailQuestion className="w-3.5 h-3.5 text-blue-400" />
        <span className="text-xs font-mono font-semibold text-blue-400 uppercase tracking-widest">Unknown Senders</span>
        {total > 0 && <span className="text-[10px] font-mono text-muted-foreground">{total} unmatched emails</span>}
        <Link href="/dashboard/emails/unmatched" className="ml-auto text-[10px] font-mono text-[#C9A84C]/80 hover:text-[#C9A84C]">
          Review all →
        </Link>
      </div>

      <div className="divide-y divide-input max-h-[280px] overflow-y-auto">
        {!loaded && (
          <p className="px-4 py-3 text-[11px] font-mono text-muted-foreground italic">Loading…</p>
        )}
        {groups.map(g => (
          <div key={g.address} className="px-4 py-2.5 group">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-medium text-foreground truncate">{g.displayName}</span>
                  <span className="text-[10px] font-mono text-muted-foreground flex-shrink-0">×{g.count}</span>
                </div>
                <p className="text-[10px] font-mono text-muted-foreground truncate">{g.address}</p>
                {g.latestSubject && (
                  <p className="text-[10px] font-mono text-muted-foreground/70 truncate italic">{g.latestSubject}</p>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => createContact(g)}
                  disabled={busy === g.address}
                  title="Create contact and link these emails"
                  className="p-1.5 rounded hover:bg-emerald-900/40 text-muted-foreground hover:text-emerald-400 transition-colors disabled:opacity-40"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => ignoreSender(g)}
                  disabled={busy === g.address}
                  title="Ignore this sender"
                  className="p-1.5 rounded hover:bg-red-900/40 text-muted-foreground hover:text-red-400 transition-colors disabled:opacity-40"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
