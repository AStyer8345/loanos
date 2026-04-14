'use client'

import { useState } from 'react'
import { UserPlus, Building2, Mail, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

interface Member {
  id: string
  full_name: string | null
  email: string | null
  role: string
}

type FormState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; message: string }
  | { status: 'error'; message: string }

export default function TeamClient({ members }: { members: Member[] }) {
  return (
    <div className="min-h-screen bg-background py-10 px-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-white">Team</h1>
          <p className="text-sm text-gray-400 mt-1">
            Invite teammates to share your pipeline, or sponsor independent LOs with their own org.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          <InviteTeammateCard />
          <SponsorLoCard />
        </div>

        <section className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="text-sm font-semibold text-white">Current teammates</h2>
            <p className="text-xs text-gray-500 mt-1">People who share this org&apos;s pipeline.</p>
          </div>
          <div className="divide-y divide-gray-800">
            {members.length === 0 && (
              <p className="px-6 py-8 text-sm text-gray-500 text-center">No teammates yet.</p>
            )}
            {members.map((m) => (
              <div key={m.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">{m.full_name || '(no name set)'}</p>
                  <p className="text-xs text-gray-500">{m.email}</p>
                </div>
                <span className="text-xs uppercase tracking-wider px-2 py-1 bg-gray-800 text-gray-300 rounded">
                  {m.role}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

// ── Invite Teammate (existing /api/org/invite) ─────────────────────────────
function InviteTeammateCard() {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'member'>('member')
  const [state, setState] = useState<FormState>({ status: 'idle' })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setState({ status: 'loading' })
    try {
      const res = await fetch('/api/org/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Invite failed')
      setState({ status: 'success', message: `Invite sent to ${email}` })
      setEmail('')
    } catch (err) {
      setState({ status: 'error', message: err instanceof Error ? err.message : 'Invite failed' })
    }
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center">
          <UserPlus className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-white">Invite teammate</h2>
          <p className="text-xs text-gray-500">Shares your pipeline, contacts, loans.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            placeholder="teammate@example.com"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'admin' | 'member')}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          >
            <option value="member">Member — view and edit shared data</option>
            <option value="admin">Admin — can also invite teammates</option>
          </select>
        </div>
        <StatusLine state={state} />
        <button
          type="submit"
          disabled={state.status === 'loading'}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {state.status === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
          Send invite
        </button>
      </form>
    </div>
  )
}

// ── Sponsor LO (new /api/org/sponsor) ──────────────────────────────────────
function SponsorLoCard() {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [orgName, setOrgName] = useState('')
  const [plan, setPlan] = useState<'starter' | 'professional'>('starter')
  const [state, setState] = useState<FormState>({ status: 'idle' })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setState({ status: 'loading' })
    try {
      const res = await fetch('/api/org/sponsor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, fullName, orgName, plan }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Sponsor failed')
      setState({ status: 'success', message: `New org created — invite sent to ${email}` })
      setEmail(''); setFullName(''); setOrgName('')
    } catch (err) {
      setState({ status: 'error', message: err instanceof Error ? err.message : 'Sponsor failed' })
    }
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-purple-600/20 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-white">Sponsor LO</h2>
          <p className="text-xs text-gray-500">Creates their own org. Isolated pipeline.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">LO&apos;s email</label>
          <input
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
            placeholder="uncle@example.com"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">LO&apos;s full name</label>
          <input
            type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
            placeholder="Jane Doe"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">Their org/business name</label>
          <input
            type="text" required value={orgName} onChange={(e) => setOrgName(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
            placeholder="Doe Mortgage Solutions"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">Plan</label>
          <select
            value={plan} onChange={(e) => setPlan(e.target.value as 'starter' | 'professional')}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
          >
            <option value="starter">Starter</option>
            <option value="professional">Professional ($197/mo)</option>
          </select>
        </div>
        <StatusLine state={state} />
        <button
          type="submit"
          disabled={state.status === 'loading'}
          className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {state.status === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Building2 className="w-4 h-4" />}
          Create org + invite
        </button>
      </form>
    </div>
  )
}

function StatusLine({ state }: { state: FormState }) {
  if (state.status === 'success') {
    return (
      <div className="flex items-center gap-2 text-xs text-green-400 bg-green-900/20 border border-green-800/40 rounded-lg px-3 py-2">
        <CheckCircle className="w-4 h-4 shrink-0" /> {state.message}
      </div>
    )
  }
  if (state.status === 'error') {
    return (
      <div className="flex items-center gap-2 text-xs text-red-400 bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">
        <AlertCircle className="w-4 h-4 shrink-0" /> {state.message}
      </div>
    )
  }
  return null
}
