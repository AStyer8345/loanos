import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const ADAM_EMAIL = 'adam@thestyerteam.com'

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
  // ── Auth gate — Adam only ─────────────────────────────────────────────────
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== ADAM_EMAIL) {
    redirect('/dashboard')
  }

  // ── Fetch signups (raw client — waitlist_signups not in generated types) ──
  const service = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data: signups, error } = await service
    .from('waitlist_signups')
    .select('*')
    .order('created_at', { ascending: false })

  const rows = (signups ?? []) as WaitlistSignup[]

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 text-zinc-100">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight font-mono">
          Loan<span className="text-[#C9A84C]">OS</span>{' '}
          <span className="text-zinc-400">Beta Waitlist</span>
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          {rows.length} signup{rows.length !== 1 ? 's' : ''} · visible to you only
        </p>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-md bg-red-900/30 border border-red-700 text-red-300 text-sm">
          Failed to load signups: {error.message}
        </div>
      )}

      {rows.length === 0 && !error ? (
        <div className="text-center py-16 text-zinc-600 text-sm">
          No signups yet. Share the marketing site to start building the list.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-input">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-card text-zinc-400 text-xs uppercase tracking-widest">
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
                  <td className="px-4 py-3 font-medium text-zinc-100">{row.name}</td>
                  <td className="px-4 py-3 text-zinc-300 font-mono text-xs">{row.email}</td>
                  <td className="px-4 py-3 text-zinc-400">{row.company ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono ${
                        row.mailchimp_status === 'subscribed'
                          ? 'bg-emerald-900/40 text-emerald-400'
                          : row.mailchimp_status === 'error'
                          ? 'bg-red-900/40 text-red-400'
                          : 'bg-zinc-800 text-zinc-500'
                      }`}
                    >
                      {row.mailchimp_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-500 text-xs">{row.source}</td>
                  <td className="px-4 py-3 text-zinc-500 text-xs font-mono">
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
