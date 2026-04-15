import { createServiceClient } from '@/lib/supabase/service'
import { getOrganization } from '@/lib/getOrganization'
import DraftsList from './DraftsList'

export const dynamic = 'force-dynamic'

export interface DraftRow {
  id: string
  automation_name: string
  recipient_name: string | null
  recipient_email: string
  subject: string
  body_html: string
  body_preview: string | null
  status: 'pending' | 'sent' | 'discarded'
  created_at: string | null
  loan_id: string | null
  contact_id: string | null
}

export default async function DraftsPage() {
  const { organizationId } = await getOrganization()
  const supabase: any = createServiceClient() // eslint-disable-line @typescript-eslint/no-explicit-any

  const { data: pending } = await supabase
    .from('email_drafts')
    .select('id, automation_name, recipient_name, recipient_email, subject, body_html, body_preview, status, created_at, loan_id, contact_id')
    .eq('organization_id', organizationId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(100)

  const { data: recent } = await supabase
    .from('email_drafts')
    .select('id, automation_name, recipient_name, recipient_email, subject, body_html, body_preview, status, created_at, loan_id, contact_id')
    .eq('organization_id', organizationId)
    .neq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(25)

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 font-mono">
      <div className="mb-6">
        <h1 className="text-sm font-bold tracking-widest text-amber-400" style={{ letterSpacing: '0.2em' }}>
          EMAIL DRAFTS
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Review AI-drafted emails. Edit, then open in Outlook or copy the HTML to send from your own inbox.
        </p>
      </div>

      <DraftsList pending={(pending ?? []) as DraftRow[]} recent={(recent ?? []) as DraftRow[]} />
    </div>
  )
}
