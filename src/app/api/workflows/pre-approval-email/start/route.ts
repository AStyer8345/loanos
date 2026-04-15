import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/auth'
import { start } from 'workflow/api'
import { preApprovalEmailWorkflow } from '@/workflows/pre-approval-email'

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Admin-only — requires system_admins membership
  const result = await requireAdmin()
  if (result.error) return result.error

  let body: { contact_id?: string; loan_id?: string; org_id?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { contact_id, loan_id, org_id } = body

  if (!contact_id || !loan_id || !org_id) {
    return NextResponse.json(
      { error: 'Missing required fields: contact_id, loan_id, org_id' },
      { status: 400 }
    )
  }

  console.log('[pre-approval-start] triggering workflow', { contact_id, loan_id, org_id, triggered_by: result.user?.id })
  await start(preApprovalEmailWorkflow, [{ contact_id, loan_id, org_id }])
  console.log('[pre-approval-start] workflow started successfully', { contact_id, loan_id })
  return NextResponse.json({ started: true })
}
