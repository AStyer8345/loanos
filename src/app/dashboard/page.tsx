import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import SignOutButton from './SignOutButton'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // Verify DB connectivity — count rows in each table
  const [contacts, loans, documents, activity] = await Promise.all([
    supabase.from('contacts').select('*', { count: 'exact', head: true }),
    supabase.from('loans').select('*', { count: 'exact', head: true }),
    supabase.from('documents').select('*', { count: 'exact', head: true }),
    supabase.from('activity_log').select('*', { count: 'exact', head: true }),
  ])

  const tables = [
    { name: 'Contacts', count: contacts.count ?? 0, error: contacts.error },
    { name: 'Loans', count: loans.count ?? 0, error: loans.error },
    { name: 'Documents', count: documents.count ?? 0, error: documents.error },
    { name: 'Activity log', count: activity.count ?? 0, error: activity.error },
  ]

  return (
    <main className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">LoanOS</h1>
            <p className="text-gray-400 text-sm mt-0.5">{user.email}</p>
          </div>
          <SignOutButton />
        </div>

        {/* Status banner */}
        <div className="bg-green-950 border border-green-800 rounded-lg p-4 mb-6 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
          <p className="text-green-300 text-sm font-medium">
            Infrastructure connected — auth, database, and storage are live
          </p>
        </div>

        {/* Table connectivity check */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden mb-6">
          <div className="px-4 py-3 border-b border-gray-800">
            <h2 className="text-sm font-medium text-gray-300">Database tables</h2>
          </div>
          <div className="divide-y divide-gray-800">
            {tables.map((table) => (
              <div key={table.name} className="flex items-center justify-between px-4 py-3">
                <span className="text-white text-sm">{table.name}</span>
                {table.error ? (
                  <span className="text-red-400 text-xs font-mono">{table.error.message}</span>
                ) : (
                  <span className="text-gray-400 text-sm">{table.count} rows</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden mb-6">
          <div className="px-4 py-3 border-b border-gray-800">
            <h2 className="text-sm font-medium text-gray-300">Actions</h2>
          </div>
          <div className="p-4 flex flex-wrap gap-3">
            <Link
              href="/dashboard/upload"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Upload Document
            </Link>
          </div>
        </div>

        {/* Auth info */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800">
            <h2 className="text-sm font-medium text-gray-300">Session</h2>
          </div>
          <div className="divide-y divide-gray-800">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-gray-400 text-sm">User ID</span>
              <span className="text-white text-xs font-mono">{user.id}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-gray-400 text-sm">Auth provider</span>
              <span className="text-white text-sm">Magic link (email OTP)</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-gray-400 text-sm">Last sign in</span>
              <span className="text-white text-sm">
                {new Date(user.last_sign_in_at ?? '').toLocaleString()}
              </span>
            </div>
          </div>
        </div>

      </div>
    </main>
  )
}
