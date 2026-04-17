export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getOrganization } from '@/lib/getOrganization'

// GET /api/contacts/duplicates
// Returns groups of contacts with case-insensitive matching names OR identical emails.
export async function GET() {
  try {
    const { organizationId } = await getOrganization()
    const supabase = createServiceClient()

    // Find duplicate groups by case-insensitive full name
    const { data, error } = await supabase.rpc('find_duplicate_contacts', {
      org_id: organizationId,
    })

    if (error) {
      console.error('Duplicate detection RPC error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ groups: data ?? [] })
  } catch (err) {
    console.error('Duplicate contacts error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
