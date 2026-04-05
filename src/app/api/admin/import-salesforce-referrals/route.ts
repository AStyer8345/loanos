import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getOrganization } from '@/lib/getOrganization'
import { requireAdmin } from '@/lib/admin/auth'
import type { TablesInsert } from '@/lib/database.types'

interface SalesforceRecord {
  first_name: string
  last_name: string
  phone: string | null
  mobile: string | null
  home_phone: string | null
  email: string | null
  group: string | null
  account_name: string | null
  referred_by: string | null
}

// POST /api/admin/import-salesforce-referrals
// Body: { contacts: SalesforceRecord[] }
// Upserts contacts from Salesforce export, matches "Referred By" to realtor contacts.
export async function POST(req: NextRequest) {
  const adminCheck = await requireAdmin()
  if (adminCheck.error) return adminCheck.error

  try {
    const { organizationId } = await getOrganization()
    const supabase = createServiceClient()
    const { contacts: records }: { contacts: SalesforceRecord[] } = await req.json()

    if (!records?.length) {
      return NextResponse.json({ error: 'No contacts provided' }, { status: 400 })
    }

    // Build name→id map for realtor contacts (for referred_by matching)
    const { data: realtors } = await supabase
      .from('contacts')
      .select('id, first_name, last_name')
      .eq('organization_id', organizationId)
      .eq('contact_type', 'realtor')
    const realtorMap = new Map<string, string>()
    for (const r of realtors ?? []) {
      const key = `${r.first_name} ${r.last_name}`.toLowerCase().trim()
      if (key) realtorMap.set(key, r.id)
    }

    // Also build email→id map for dedup
    const { data: allContacts } = await supabase
      .from('contacts')
      .select('id, email, first_name, last_name')
      .eq('organization_id', organizationId)
    const emailMap = new Map<string, string>()
    const nameMap = new Map<string, string>()
    for (const c of allContacts ?? []) {
      if (c.email) emailMap.set(c.email.toLowerCase().trim(), c.id)
      const key = `${c.first_name} ${c.last_name}`.toLowerCase().trim()
      if (key) nameMap.set(key, c.id)
    }

    const log: { action: string; name: string; email: string | null; referred_by: string | null; referred_by_matched: boolean; contact_id: string }[] = []

    // Map Salesforce group to contact_type
    const mapContactType = (group: string | null, accountName: string | null): string => {
      if (accountName === 'Realtor Database') return 'realtor'
      if (!group) return 'borrower'
      const g = group.toLowerCase()
      if (g.includes('realtor')) return 'realtor'
      // No 'lead' contact_type — leads are borrower with stage=Lead
      return 'borrower'
    }

    const mapStage = (group: string | null): string => {
      if (!group) return 'Lead'
      const g = group.toLowerCase()
      if (g.includes('client')) return 'Past Client'
      if (g.includes('lead') || g.includes('refi lead')) return 'Lead'
      return 'Lead'
    }

    for (const rec of records) {
      const contactType = mapContactType(rec.group, rec.account_name)
      const stage = mapStage(rec.group)
      const fullNameKey = `${rec.first_name} ${rec.last_name}`.toLowerCase().trim()

      // Find referred_by contact
      const referredByKey = rec.referred_by?.toLowerCase().trim() ?? ''
      const referredByContactId = realtorMap.get(referredByKey) || nameMap.get(referredByKey) || null

      // Check for existing contact (email match first, then name match)
      let existingId: string | null = null
      if (rec.email) {
        existingId = emailMap.get(rec.email.toLowerCase().trim()) ?? null
      }
      if (!existingId) {
        existingId = nameMap.get(fullNameKey) ?? null
      }

      if (existingId) {
        // Update: only set referred_by_contact_id if not already set, and fill empty phone/email
        const updates: Record<string, unknown> = {}
        if (referredByContactId) updates.referred_by_contact_id = referredByContactId
        if (rec.phone) updates.phone = rec.phone
        if (rec.mobile) updates.phone_mobile = rec.mobile
        if (rec.home_phone) updates.home_phone = rec.home_phone
        if (rec.email) updates.email = rec.email

        if (Object.keys(updates).length > 0) {
          await supabase.from('contacts').update(updates).eq('id', existingId)
        }
        log.push({ action: 'updated', name: `${rec.first_name} ${rec.last_name}`, email: rec.email, referred_by: rec.referred_by, referred_by_matched: !!referredByContactId, contact_id: existingId })
      } else {
        // Insert new contact
        const { data: inserted, error: insertErr } = await supabase
          .from('contacts')
          .insert({
            first_name: rec.first_name,
            last_name: rec.last_name,
            email: rec.email,
            phone: rec.phone || rec.mobile,
            phone_mobile: rec.mobile,
            home_phone: rec.home_phone,
            contact_type: contactType,
            stage: stage,
            lead_source: 'Realtor Referral',
            organization_id: organizationId,
            referred_by_contact_id: referredByContactId,
          } as unknown as TablesInsert<'contacts'>)
          .select('id')
          .single()

        if (insertErr) {
          log.push({ action: `error: ${insertErr.message}`, name: `${rec.first_name} ${rec.last_name}`, email: rec.email, referred_by: rec.referred_by, referred_by_matched: false, contact_id: '' })
          continue
        }

        const newId = inserted!.id
        // Update maps so subsequent records can match
        if (rec.email) emailMap.set(rec.email.toLowerCase().trim(), newId)
        nameMap.set(fullNameKey, newId)

        log.push({ action: 'created', name: `${rec.first_name} ${rec.last_name}`, email: rec.email, referred_by: rec.referred_by, referred_by_matched: !!referredByContactId, contact_id: newId })
      }
    }

    const summary = {
      total_processed: records.length,
      created: log.filter(l => l.action === 'created').length,
      updated: log.filter(l => l.action === 'updated').length,
      errors: log.filter(l => l.action.startsWith('error')).length,
      referred_by_matched: log.filter(l => l.referred_by_matched).length,
      referred_by_unmatched: log.filter(l => l.referred_by && !l.referred_by_matched).length,
      unique_referrers_unmatched: [...new Set(log.filter(l => l.referred_by && !l.referred_by_matched).map(l => l.referred_by))],
    }

    return NextResponse.json({ summary, log })
  } catch (err) {
    console.error('Import error:', err)
    return NextResponse.json({ error: 'Import failed', detail: String(err) }, { status: 500 })
  }
}
