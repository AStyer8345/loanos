import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import EmailDraftPreview from '@/components/EmailDraftPreview'

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
    { label: 'Contacts',       value: contacts.count      ?? 0, err: contacts.error },
    { label: 'Loans',          value: loans.count          ?? 0, err: loans.error },
    { label: 'Documents',      value: documents.count      ?? 0, err: documents.error },
    { label: 'Activity',       value: activity.count       ?? 0, err: activity.error },
    { label: 'Closed Clients', value: closedClients.count  ?? 0, err: closedClients.error },
  ]

  return (
    <div className="p-8 min-h-full bg-slate-50">

      {/* ── Header ───────────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Command Center
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {user.email} · LoanOS v0.5
        </p>
      </div>

      {/* ── Status bar ───────────────────────────────────── */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 mb-8">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs font-medium text-emerald-700">
          Systems Nominal — Auth · Database · Storage
        </span>
      </div>

      {/* ── Stat cards ───────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 mb-8 lg:grid-cols-5">
        {stats.map(({ label, value, err }) => (
          <div
            key={label}
            className="bg-white rounded-lg border border-slate-200 shadow-sm p-5"
          >
            <div className="text-xs font-medium text-slate-500 mb-3">
              {label}
            </div>
            {err ? (
              <div className="text-sm text-red-500 font-medium">Error</div>
            ) : (
              <div className="text-4xl font-bold text-slate-900 leading-none">
                {value}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Quick actions + Email Drafts ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
            <div className="text-xs font-medium text-slate-500 mb-4">
              Quick Actions
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard/upload"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors"
              >
                Upload Document
              </Link>
            </div>
          </div>
        </div>
        <div className="lg:col-span-1">
          <EmailDraftPreview />
        </div>
      </div>

    </div>
  )
}
