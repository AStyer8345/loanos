'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { AlertCircle } from 'lucide-react'

export default function ContactByNameRedirectPage() {
  const params = useParams()
  const router = useRouter()
  const encodedName = params.name as string
  const name = decodeURIComponent(encodedName?.replace(/\+/g, ' ') ?? '')
  const [status, setStatus] = useState<'loading' | 'found' | 'not-found'>('loading')

  useEffect(() => {
    if (!name.trim()) {
      setStatus('not-found')
      return
    }
    const supabase = createClient()
    const parts = name.trim().split(/\s+/)
    const firstName = parts[0] ?? ''
    const lastName = parts.slice(1).join(' ') || ''
    let q = supabase.from('contacts').select('id, first_name, last_name')
    if (firstName) q = q.ilike('first_name', firstName)
    if (lastName) q = q.ilike('last_name', lastName)
    q.limit(50).then(({ data: list }) => {
      const match = (list ?? []).find(
        (c: { first_name: string | null; last_name: string | null }) =>
          `${(c.first_name ?? '').trim()} ${(c.last_name ?? '').trim()}`.trim() === name.trim()
      )
      if (match) {
        setStatus('found')
        router.replace(`/dashboard/contacts/${(match as { id: string }).id}`)
      } else {
        setStatus('not-found')
      }
    })
  }, [name, router])

  if (status === 'loading') {
    return (
      <div style={{ padding: 48, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)' }}>
        Finding contact…
      </div>
    )
  }

  return (
    <div style={{ padding: 48, textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
      <AlertCircle size={24} style={{ color: 'var(--muted)', marginBottom: 12 }} />
      <p style={{ color: 'var(--muted)', marginBottom: 16 }}>No contact found matching &ldquo;{name}&rdquo;</p>
      <Link href="/dashboard/contacts" style={{ color: '#c9a84c', textDecoration: 'none', fontSize: 12 }}>
        ← Back to Contacts
      </Link>
    </div>
  )
}
