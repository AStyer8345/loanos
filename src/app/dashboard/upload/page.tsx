import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import UploadForm from './UploadForm'

export type Loan = {
  id: string
  loan_number: string | null
  property_address: string | null
  contacts: { first_name: string; last_name: string }[] | null
}

export default async function UploadPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: loans } = await supabase
    .from('loans')
    .select('id, loan_number, property_address, contacts!contact_id(first_name, last_name)')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8 min-h-full" style={{ background: 'var(--bg)' }}>
      <div className="max-w-xl">

        <h1
          className="font-display text-4xl tracking-widest leading-none mb-1"
          style={{ color: 'var(--text)' }}
        >
          UPLOAD DOCUMENT
        </h1>
        <p className="font-mono text-xs mb-8" style={{ color: 'var(--muted)' }}>
          Attach a PDF to a loan record — stored in Supabase, logged automatically.
        </p>

        <div
          className="rounded border p-6"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <UploadForm loans={(loans ?? []) as Loan[]} userId={user.id} />
        </div>

      </div>
    </div>
  )
}
