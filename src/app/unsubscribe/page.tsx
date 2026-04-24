import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: { c?: string }
}) {
  const contactId = searchParams.c

  if (!contactId) {
    return <UnsubscribeLayout status="invalid" />
  }

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('contacts')
    .update({ email_opt_out: true })
    .eq('id', contactId)

  if (error) {
    return <UnsubscribeLayout status="error" />
  }

  return <UnsubscribeLayout status="success" />
}

function UnsubscribeLayout({ status }: { status: 'success' | 'error' | 'invalid' }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: '#050505' }}
    >
      <div className="max-w-md w-full mx-auto px-6 text-center">
        <div className="border border-zinc-800 rounded-lg p-8" style={{ background: '#0a0a0a' }}>
          {status === 'success' ? (
            <>
              <div className="text-[#4ADE80] font-mono text-xs uppercase tracking-wider mb-4">
                Unsubscribed
              </div>
              <h1 className="text-zinc-100 font-bold text-xl mb-3">
                You&apos;ve been removed from the list.
              </h1>
              <p className="text-zinc-400 text-sm leading-relaxed">
                You won&apos;t receive any more emails from Adam Styer | Mortgage Solutions LP.
                If you have questions, reply to any prior email or call (512) 710-1400.
              </p>
            </>
          ) : status === 'invalid' ? (
            <>
              <div className="text-zinc-500 font-mono text-xs uppercase tracking-wider mb-4">
                Invalid Link
              </div>
              <h1 className="text-zinc-100 font-bold text-xl mb-3">
                This unsubscribe link is not valid.
              </h1>
              <p className="text-zinc-400 text-sm">
                To be removed from emails, reply directly to any email you received.
              </p>
            </>
          ) : (
            <>
              <div className="text-red-500 font-mono text-xs uppercase tracking-wider mb-4">
                Error
              </div>
              <h1 className="text-zinc-100 font-bold text-xl mb-3">
                Something went wrong.
              </h1>
              <p className="text-zinc-400 text-sm">
                Please reply to the email you received and ask to be removed. We&apos;ll take care of it.
              </p>
            </>
          )}
          <div className="mt-8 pt-6 border-t border-zinc-800 text-zinc-600 text-xs">
            Adam Styer | Mortgage Solutions LP &nbsp;&middot;&nbsp; NMLS #513013<br />
            5900 Balcones Drive, Suite 100, Austin TX 78731<br />
            Equal Housing Lender
          </div>
        </div>
      </div>
    </div>
  )
}
