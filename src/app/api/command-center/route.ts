import { createClient } from '@/lib/supabase/server'
import { getOrganization } from '@/lib/getOrganization'
import { buildCommandCenter, type WorkTask, type WorkContact, type WorkLoan, type WorkActivity, type Member } from '@/lib/command-center'
import { collectPages } from '@/lib/command-center-pages'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
const headers = { 'Cache-Control': 'private, no-store' }

export async function GET() {
  let context: Awaited<ReturnType<typeof getOrganization>>
  try { context = await getOrganization() }
  catch { return NextResponse.json({ error: 'Sign in to view your Command Center.' }, { status: 401, headers }) }
  const db = createClient()
  const { organizationId, userId } = context
  // Use the authenticated client and explicit tenant scope on every page.
  // Email bodies, raw payloads, addresses and financial documents never enter this response.
  const read = <T,>(table: 'todo_items' | 'contacts' | 'loans' | 'activity_log' | 'profiles', columns: string) =>
    collectPages<T>(async (from, to) => {
      const result = await db.from(table).select(columns).eq('organization_id', organizationId).order('id').range(from, to)
      return { data: result.data as unknown as T[] | null, error: result.error }
    })
  try {
    const [tasks, contacts, loans, activities, members] = await Promise.all([
      read<WorkTask>('todo_items', 'id,title,text,description,status,is_complete,priority,due_at,snoozed_until,assigned_to,related_contact_id,related_loan_id,follow_up_reason,updated_at,created_at'),
      read<WorkContact>('contacts', 'id,first_name,last_name,stage,contact_type,lead_source,source_page,created_at,lead_tier'),
      read<WorkLoan>('loans', 'id,contact_id,borrower_first_name,borrower_last_name,loan_name,status,loan_amount,commission_amount,closing_date,estimated_closing_date,funding_date,rate_lock_expiration,processor_email,property_address,loan_purpose'),
      read<WorkActivity>('activity_log', 'contact_id,loan_id,type,action,occurred_at,created_at'),
      read<Member>('profiles', 'id,full_name,role,email'),
    ])
    return NextResponse.json(buildCommandCenter({ tasks, contacts, loans, activities, members, viewerId: userId, asOf: new Date().toISOString() }), { headers })
  } catch {
    return NextResponse.json({ error: 'The full queue could not be loaded. Refresh to try again.' }, { status: 503, headers })
  }
}
