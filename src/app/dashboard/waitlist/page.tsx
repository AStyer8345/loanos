import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

type WaitlistSignup = {
  id: string
  name: string
  email: string
  company: string | null
  source: string
  mailchimp_status: string
  notes: string | null
  created_at: string
}

export default async function WaitlistPage() {
  // ── Auth gate — system admins only ────────────────────────────────────────
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Look up admin status via the system_admins table instead of a hardcoded
  // email. The table has deny-all RLS for normal users; we use the service
  // client here specifically so the lookup succeeds for the admin themselves.
  const service = createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: adminRow } = await (service as any)
    .from('system_admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!adminRow) {
    redirect('/dashboard')
  }

  // ── Fetch signups ─────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: signups, error } = await (service as any)
    .from('waitlist_signups')
    .select('*')
    .order('created_at', { ascending: false })

  const rows = (signups ?? []) as WaitlistSignup[]

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 text-foreground">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight font-mono">
          Loan<span className="text-[#C9A84C]">OS</span>{' '}
          <span className="text-muted-foreground">Beta Waitlist</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {rows.length} signup{rows.length !== 1 ? 's' : ''} · visible to you only
        </p>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-md bg-red-900/30 border border-red-700 text-red-300 text-sm">
          Failed to load signups: {error.message}
        </div>
      )}

      {rows.length === 0 && !error ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          No signups yet. Share the marketing site to start building the list.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-input">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-card text-muted-foreground text-xs uppercase tracking-widest">
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Email</th>
                <th className="px-4 py-3 text-left font-medium">Company</th>
                <th className="px-4 py-3 text-left font-medium">Mailchimp</th>
                <th className="px-4 py-3 text-left font-medium">Source</th>
                <th className="px-4 py-3 text-left font-medium">Signed up</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-card/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{row.name}</td>
                  <td className="px-4 py-3 text-foreground/80 font-mono text-xs">{row.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.company ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono ${
                        row.mailchimp_status === 'subscribed'
                          ? 'bg-emerald-900/40 text-emerald-400'
                          : row.mailchimp_status === 'error'
                          ? 'bg-red-900/40 text-red-400'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {row.mailchimp_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{row.source}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs font-mono">
                    {new Date(row.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
