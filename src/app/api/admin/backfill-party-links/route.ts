import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getOrganization } from '@/lib/getOrganization'
import { requireAdmin } from '@/lib/admin/auth'

// POST /api/admin/backfill-party-links
// One-time (re-runnable) backfill: matches agent name strings on loans
// to contact records by case-insensitive name, then sets the FK columns.
export async function POST() {
  const adminCheck = await requireAdmin()
  if (adminCheck.error) return adminCheck.error

  try {
    const { organizationId } = await getOrganization()
    const supabase = createServiceClient()

    const log: { loan_id: string; borrower: string | null; party: string; matched_contact: string; contact_id: string }[] = []

    // ---------- helpers ----------
    // Build a name→contact_id lookup from contacts table
    const buildContactMap = async (contactType?: string) => {
      let query = supabase
        .from('contacts')
        .select('id, first_name, last_name')
        .eq('organization_id', organizationId)
      if (contactType) query = query.eq('contact_type', contactType)
      const { data } = await query
      const map = new Map<string, string>()
      for (const c of data ?? []) {
        const key = `${c.first_name} ${c.last_name}`.toLowerCase().trim()
        if (key && !map.has(key)) map.set(key, c.id)
      }
      return map
    }

    // All contacts (for co-borrowers, title — could be any type)
    const allMap = await buildContactMap()
    // Realtors only (for agents)
    const realtorMap = await buildContactMap('realtor')

    // ---------- fetch loans needing backfill ----------
    const { data: loans } = await supabase
      .from('loans')
      .select('id, borrower_name, buyers_agent_name, buyer_agent_name, buyer_agent_contact_id, listing_agent_name, listing_agent_contact_id, referring_agent_name, referral_contact_id, title_contact, title_contact_id, co_borrower_name, co_borrower_contact_id')
      .eq('organization_id', organizationId)

    if (!loans) return NextResponse.json({ error: 'Failed to fetch loans' }, { status: 500 })

    // ---------- backfill each loan ----------
    for (const loan of loans) {
      const updates: Record<string, string> = {}

      // Buyer's agent
      if (!loan.buyer_agent_contact_id) {
        const name = (loan.buyers_agent_name || loan.buyer_agent_name || '').toLowerCase().trim()
        const match = realtorMap.get(name) || allMap.get(name)
        if (match) {
          updates.buyer_agent_contact_id = match
          log.push({ loan_id: loan.id, borrower: loan.borrower_name, party: 'buyer_agent', matched_contact: name, contact_id: match })
        }
      }

      // Listing agent
      if (!loan.listing_agent_contact_id) {
        const name = (loan.listing_agent_name || '').toLowerCase().trim()
        const match = realtorMap.get(name) || allMap.get(name)
        if (match) {
          updates.listing_agent_contact_id = match
          log.push({ loan_id: loan.id, borrower: loan.borrower_name, party: 'listing_agent', matched_contact: name, contact_id: match })
        }
      }

      // Referring agent
      if (!loan.referral_contact_id) {
        const name = (loan.referring_agent_name || '').toLowerCase().trim()
        const match = realtorMap.get(name) || allMap.get(name)
        if (match) {
          updates.referral_contact_id = match
          log.push({ loan_id: loan.id, borrower: loan.borrower_name, party: 'referring_agent', matched_contact: name, contact_id: match })
        }
      }

      // Title contact
      if (!loan.title_contact_id) {
        const name = (loan.title_contact || '').toLowerCase().trim()
        const match = allMap.get(name)
        if (match) {
          updates.title_contact_id = match
          log.push({ loan_id: loan.id, borrower: loan.borrower_name, party: 'title', matched_contact: name, contact_id: match })
        }
      }

      // Co-borrower
      if (!loan.co_borrower_contact_id) {
        const name = (loan.co_borrower_name || '').toLowerCase().trim()
        const match = allMap.get(name)
        if (match) {
          updates.co_borrower_contact_id = match
          log.push({ loan_id: loan.id, borrower: loan.borrower_name, party: 'co_borrower', matched_contact: name, contact_id: match })
        }
      }

      // Apply updates
      if (Object.keys(updates).length > 0) {
        await supabase.from('loans').update(updates).eq('id', loan.id)
      }
    }

    // Summarize
    const summary = {
      total_loans_scanned: loans.length,
      total_links_created: log.length,
      by_party: {
        buyer_agent: log.filter(l => l.party === 'buyer_agent').length,
        listing_agent: log.filter(l => l.party === 'listing_agent').length,
        referring_agent: log.filter(l => l.party === 'referring_agent').length,
        title: log.filter(l => l.party === 'title').length,
        co_borrower: log.filter(l => l.party === 'co_borrower').length,
      },
    }

    return NextResponse.json({ summary, log })
  } catch (err) {
    console.error('Backfill error:', err)
    return NextResponse.json({ error: 'Backfill failed', detail: String(err) }, { status: 500 })
  }
}
