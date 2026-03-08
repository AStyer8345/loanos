import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import UploadForm from './UploadForm'

export type Loan = {
  id: string
  loan_number: string | null
  property_address: string | null
  contacts: { first_name: string; last_name: string } | null
}

export default async function UploadPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: loans } = await supabase
    .from('loans')
    .select('id, loan_number, property_address, contacts(first_name, last_name)')
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-xl mx-auto">

        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/dashboard"
            className="text-gray-400 hover:text-white text-sm transition-colors"
          >
            ← Dashboard
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-white mb-1">Upload Document</h1>
        <p className="text-gray-400 text-sm mb-8">
          Attach a PDF to a loan record — stored in Supabase, logged automatically.
        </p>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <UploadForm loans={(loans ?? []) as Loan[]} userId={user.id} />
        </div>

      </div>
    </main>
  )
}
