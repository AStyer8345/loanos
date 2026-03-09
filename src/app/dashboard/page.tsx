import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const [contacts, loans, documents, activity, closedClients] = await Promise.all([
    supabase.from('contacts').select('*', { count: 'exact', head: true }),
    supabase.from('loans').select('*', { count: 'exact', head: true }),
    supabase.from('documents').select('*', { count: 'exact', head: true }),
    supabase.from('activity_log').select('*', { count: 'exact', head: true }),
    supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('stage', 'Closed Client'),
  ])

  const stats = [
    { label: 'CONTACTS',       value: contacts.count      ?? 0, err: contacts.error },
    { label: 'LOANS',          value: loans.count          ?? 0, err: loans.error },
    { label: 'DOCUMENTS',      value: documents.count      ?? 0, err: documents.error },
    { label: 'ACTIVITY',       value: activity.count       ?? 0, err: activity.error },
    { label: 'CLOSED CLIENTS', value: closedClients.count  ?? 0, err: closedClients.error },
  ]

  return (
    <div className="p-8 min-h-full" style={{ background: 'var(--bg)' }}>

      {/* ── Header ───────────────────────────────────────── */}
      <div className="mb-8">
        <h1
          className="font-display text-4xl tracking-widest leading-none"
          style={{ color: 'var(--text)' }}
        >
          COMMAND CENTER
        </h1>
        <p className="font-mono text-xs mt-2" style={{ color: 'var(--muted)' }}>
          {user.email} · LoanOS v0.5
        </p>
      </div>

      {/* ── Infra status bar ─────────────────────────────── */}
      <div
        className="flex items-center gap-3 px-4 py-3 rounded border mb-8"
        style={{ background: 'var(--surface2)', borderColor: 'var(--green)', borderLeftWidth: '3px' }}
      >
        <span
          className="inline-block w-2 h-2 rounded-full shrink-0"
          style={{ background: 'var(--green)' }}
        />
        <span className="font-mono text-xs tracking-wide" style={{ color: 'var(--green)' }}>
          SYSTEMS NOMINAL — AUTH · DATABASE · STORAGE
        </span>
      </div>

      {/* ── Stat cards ───────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 mb-8 lg:grid-cols-5">
        {stats.map(({ label, value, err }) => (
          <div
            key={label}
            className="rounded border p-5"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)', borderLeftWidth: '3px', borderLeftColor: 'var(--gold)' }}
          >
            <div
              className="font-mono text-[10px] tracking-widest mb-3"
              style={{ color: 'var(--muted)' }}
            >
              {label}
            </div>
            {err ? (
              <div className="font-mono text-xs" style={{ color: 'var(--red)' }}>
                ERR
              </div>
            ) : (
              <div
                className="font-display text-5xl leading-none"
                style={{ color: 'var(--text)' }}
              >
                {value}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Quick actions ─────────────────────────────────── */}
      <div
        className="rounded border p-5"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div
          className="font-mono text-[10px] tracking-widest mb-4"
          style={{ color: 'var(--muted)' }}
        >
          ACTIONS
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/upload"
            className="action-btn font-mono text-xs tracking-wider px-4 py-2.5 rounded border transition-colors"
            style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}
          >
            &gt;_ UPLOAD DOCUMENT
          </Link>
        </div>
      </div>

    </div>
  )
}
