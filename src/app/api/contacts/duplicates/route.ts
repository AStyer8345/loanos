export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getOrganization } from '@/lib/getOrganization'
import {
  findFuzzyNameGroups,
  findPhoneGroups,
  groupSignature,
  type DupeContact,
  type DupeGroup,
} from '@/lib/contacts/duplicateMatch'

const CONTACT_FIELDS = 'id, first_name, last_name, email, phone, contact_type, stage, created_at, updated_at'
const PAGE_SIZE = 1000

// GET /api/contacts/duplicates
// Returns candidate duplicate groups across four match types: exact name and
// exact email (via the find_duplicate_contacts RPC), plus normalized phone and
// first-name variants (computed here). Pass ?countOnly=1 for just the count.
export async function GET(request: Request) {
  try {
    const { organizationId } = await getOrganization()
    const supabase = createServiceClient()

    const { data, error } = await supabase.rpc('find_duplicate_contacts', {
      org_id: organizationId,
    })

    if (error) {
      console.error('Duplicate detection RPC error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const groups = (data ?? []) as DupeGroup[]
    const seen = new Set(groups.map(groupSignature))

    // Paginate — the book is already past a single PostgREST page, and a silent
    // truncation here would read as "no duplicates" for everyone after row 1000.
    const contacts: DupeContact[] = []
    for (let offset = 0; ; offset += PAGE_SIZE) {
      const { data: page, error: pageError } = await supabase
        .from('contacts')
        .select(CONTACT_FIELDS)
        .eq('organization_id', organizationId)
        .order('id', { ascending: true })
        .range(offset, offset + PAGE_SIZE - 1)

      if (pageError) {
        console.error('Duplicate detection contact fetch error:', pageError)
        return NextResponse.json({ error: pageError.message }, { status: 500 })
      }

      const rows = (page ?? []) as DupeContact[]
      contacts.push(...rows)
      if (rows.length < PAGE_SIZE) break
    }

    for (const group of [...findPhoneGroups(contacts), ...findFuzzyNameGroups(contacts)]) {
      const signature = groupSignature(group)
      if (seen.has(signature)) continue
      seen.add(signature)
      groups.push(group)
    }

    const countOnly = new URL(request.url).searchParams.get('countOnly') === '1'
    if (countOnly) {
      return NextResponse.json({ count: groups.length })
    }

    return NextResponse.json({ groups, count: groups.length })
  } catch (err) {
    console.error('Duplicate contacts error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
