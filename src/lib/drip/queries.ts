// src/lib/drip/queries.ts
import { createServiceClient } from '@/lib/supabase/service'
import type {
  DripCampaignRow,
  DripCampaignWithStats,
  DripStepRow,
  DripEnrollmentRow,
  DripEnrollmentWithContact,
  DripSendRow,
  DripSendWithDetails,
  DripSendStatus,
} from './types'

function supabase(): any { // eslint-disable-line @typescript-eslint/no-explicit-any
  return createServiceClient()
}

// ── Campaigns ──────────────────────────────────────────────

export async function getCampaignsWithStats(orgId: string): Promise<DripCampaignWithStats[]> {
  const { data, error } = await supabase()
    .from('drip_campaigns')
    .select('*')
    .eq('org_id', orgId)
    .order('name')

  if (error) throw error
  const campaigns = (data ?? []) as DripCampaignRow[]

  const stats = await Promise.all(
    campaigns.map(async (c) => {
      const [stepRes, enrollRes, completedRes, removedRes, sendRes] = await Promise.all([
        supabase().from('drip_steps').select('id', { count: 'exact', head: true }).eq('campaign_id', c.id),
        supabase().from('drip_enrollments').select('id', { count: 'exact', head: true }).eq('campaign_id', c.id).eq('status', 'active'),
        supabase().from('drip_enrollments').select('id', { count: 'exact', head: true }).eq('campaign_id', c.id).eq('status', 'completed'),
        supabase().from('drip_enrollments').select('id', { count: 'exact', head: true }).eq('campaign_id', c.id).eq('status', 'removed'),
        supabase().from('drip_sends').select('sent_at').eq('org_id', orgId).not('sent_at', 'is', null).order('sent_at', { ascending: false }).limit(1),
      ])
      return {
        ...c,
        exit_rules: (c.exit_rules as unknown as DripCampaignWithStats['exit_rules']) ?? [],
        step_count: stepRes.count ?? 0,
        enrollment_count: enrollRes.count ?? 0,
        completed_count: completedRes.count ?? 0,
        removed_count: removedRes.count ?? 0,
        last_send_at: sendRes.data?.[0]?.sent_at ?? null,
      }
    })
  )

  return stats
}

export async function getCampaignById(orgId: string, id: string): Promise<DripCampaignRow | null> {
  const { data, error } = await supabase()
    .from('drip_campaigns')
    .select('*')
    .eq('id', id)
    .eq('org_id', orgId)
    .single()

  if (error) return null
  return data as DripCampaignRow
}

export async function updateCampaign(
  orgId: string,
  id: string,
  updates: Partial<Pick<DripCampaignRow, 'name' | 'description' | 'status' | 'exit_rules'>>
): Promise<DripCampaignRow> {
  const { data, error } = await supabase()
    .from('drip_campaigns')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('org_id', orgId)
    .select()
    .single()

  if (error) throw error
  return data as DripCampaignRow
}

// ── Steps ──────────────────────────────────────────────────

export async function getSteps(orgId: string, campaignId: string): Promise<DripStepRow[]> {
  const { data, error } = await supabase()
    .from('drip_steps')
    .select('*')
    .eq('org_id', orgId)
    .eq('campaign_id', campaignId)
    .order('step_order')

  if (error) throw error
  return (data ?? []) as DripStepRow[]
}

export async function updateStep(
  orgId: string,
  stepId: string,
  updates: Partial<Pick<DripStepRow, 'name' | 'skeleton' | 'trigger_config' | 'channel' | 'requires_approval' | 'tone' | 'step_order'>>
): Promise<DripStepRow> {
  const { data, error } = await supabase()
    .from('drip_steps')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', stepId)
    .eq('org_id', orgId)
    .select()
    .single()

  if (error) throw error
  return data as DripStepRow
}

// ── Enrollments ────────────────────────────────────────────

export async function getEnrollments(
  orgId: string,
  campaignId: string,
  page = 1,
  limit = 50,
  search?: string
): Promise<{ data: DripEnrollmentWithContact[]; total: number }> {
  let query = supabase()
    .from('drip_enrollments')
    .select(`
      *,
      contacts!inner(first_name, last_name, email, property_address),
      drip_steps(name)
    `, { count: 'exact' })
    .eq('campaign_id', campaignId)
    .eq('org_id', orgId)
    .order('enrolled_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (search) {
    query = query.or(`contacts.first_name.ilike.%${search}%,contacts.last_name.ilike.%${search}%,contacts.email.ilike.%${search}%`)
  }

  const { data, error, count } = await query

  if (error) throw error

  const rows = (data ?? []).map((row: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
    ...row,
    contact_name: `${row.contacts?.first_name ?? ''} ${row.contacts?.last_name ?? ''}`.trim(),
    contact_email: row.contacts?.email ?? '',
    property_address: row.contacts?.property_address ?? null,
    next_step_name: row.drip_steps?.name ?? null,
    contacts: undefined,
    drip_steps: undefined,
  })) as DripEnrollmentWithContact[]

  return { data: rows, total: count ?? 0 }
}

export async function enrollContact(
  orgId: string,
  campaignId: string,
  contactId: string,
  loanId: string | null,
  enrolledBy: 'auto' | 'manual',
  nextSendAt: string | null
): Promise<DripEnrollmentRow> {
  const { data, error } = await supabase()
    .from('drip_enrollments')
    .insert({
      org_id: orgId,
      campaign_id: campaignId,
      contact_id: contactId,
      loan_id: loanId,
      enrolled_by: enrolledBy,
      next_send_at: nextSendAt,
      current_step: 0,
      status: 'active',
    })
    .select()
    .single()

  if (error) throw error
  return data as DripEnrollmentRow
}

export async function updateEnrollment(
  orgId: string,
  enrollmentId: string,
  updates: Partial<Pick<DripEnrollmentRow, 'status' | 'removed_at' | 'removed_reason' | 'current_step' | 'next_send_at'>>
): Promise<DripEnrollmentRow> {
  const { data, error } = await supabase()
    .from('drip_enrollments')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', enrollmentId)
    .eq('org_id', orgId)
    .select()
    .single()

  if (error) throw error
  return data as DripEnrollmentRow
}

// ── Sends / Approval Queue ────────────────────────────────

export async function getApprovalQueue(orgId: string): Promise<DripSendWithDetails[]> {
  const { data, error } = await supabase()
    .from('drip_sends')
    .select(`
      *,
      contacts!inner(first_name, last_name, email),
      drip_steps!inner(name),
      drip_enrollments!inner(campaign_id, drip_campaigns!inner(name))
    `)
    .eq('org_id', orgId)
    .eq('status', 'queued')
    .order('created_at', { ascending: true })

  if (error) throw error

  return (data ?? []).map((row: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
    ...row,
    contact_name: `${row.contacts?.first_name ?? ''} ${row.contacts?.last_name ?? ''}`.trim(),
    contact_email: row.contacts?.email ?? '',
    step_name: row.drip_steps?.name ?? '',
    campaign_name: row.drip_enrollments?.drip_campaigns?.name ?? '',
    contacts: undefined,
    drip_steps: undefined,
    drip_enrollments: undefined,
  })) as DripSendWithDetails[]
}

export async function updateSendStatus(
  orgId: string,
  sendId: string,
  status: DripSendStatus,
  updates?: { generated_subject?: string; generated_body?: string }
): Promise<DripSendRow> {
  const payload: Record<string, unknown> = { status }
  if (status === 'sent') payload.sent_at = new Date().toISOString()
  if (updates?.generated_subject) payload.generated_subject = updates.generated_subject
  if (updates?.generated_body) payload.generated_body = updates.generated_body

  const { data, error } = await supabase()
    .from('drip_sends')
    .update(payload)
    .eq('id', sendId)
    .eq('org_id', orgId)
    .select()
    .single()

  if (error) throw error
  return data as DripSendRow
}

export async function getSendHistory(
  orgId: string,
  campaignId: string,
  page = 1,
  limit = 50
): Promise<{ data: DripSendWithDetails[]; total: number }> {
  const { data, error, count } = await supabase()
    .from('drip_sends')
    .select(`
      *,
      contacts!inner(first_name, last_name, email),
      drip_steps!inner(name, campaign_id),
      drip_enrollments!inner(campaign_id)
    `, { count: 'exact' })
    .eq('org_id', orgId)
    .eq('drip_enrollments.campaign_id', campaignId)
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (error) throw error

  const rows = (data ?? []).map((row: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
    ...row,
    contact_name: `${row.contacts?.first_name ?? ''} ${row.contacts?.last_name ?? ''}`.trim(),
    contact_email: row.contacts?.email ?? '',
    step_name: row.drip_steps?.name ?? '',
    campaign_name: '',
    contacts: undefined,
    drip_steps: undefined,
    drip_enrollments: undefined,
  })) as DripSendWithDetails[]

  return { data: rows, total: count ?? 0 }
}

export async function getApprovalQueueCount(orgId: string): Promise<number> {
  const { count, error } = await supabase()
    .from('drip_sends')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .eq('status', 'queued')

  if (error) return 0
  return count ?? 0
}

export async function getRecentSends(orgId: string, limit = 25): Promise<DripSendWithDetails[]> {
  const { data, error } = await supabase()
    .from('drip_sends')
    .select(`
      *,
      contacts!inner(first_name, last_name, email),
      drip_steps!inner(name),
      drip_enrollments!inner(campaign_id, drip_campaigns!inner(name))
    `)
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error

  return (data ?? []).map((row: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
    ...row,
    contact_name: `${row.contacts?.first_name ?? ''} ${row.contacts?.last_name ?? ''}`.trim(),
    contact_email: row.contacts?.email ?? '',
    step_name: row.drip_steps?.name ?? '',
    campaign_name: row.drip_enrollments?.drip_campaigns?.name ?? '',
    contacts: undefined,
    drip_steps: undefined,
    drip_enrollments: undefined,
  })) as DripSendWithDetails[]
}
