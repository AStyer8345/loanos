import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getOrganization } from '@/lib/getOrganization'

// POST /api/contacts/merge
// Body: { keepId: string, mergeId: string }
// Transfers all loans, activity, and email data from mergeId → keepId, then deletes mergeId.
export async function POST(req: NextRequest) {
  try {
    const { organizationId } = await getOrganization()
    const { keepId, mergeId }: { keepId: string; mergeId: string } = await req.json()

    if (!keepId || !mergeId) {
      return NextResponse.json({ error: 'keepId and mergeId are required' }, { status: 400 })
    }
    if (keepId === mergeId) {
      return NextResponse.json({ error: 'keepId and mergeId must be different contacts' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Verify both contacts belong to this org
    const { data: contacts, error: verifyErr } = await supabase
      .from('contacts')
      .select('id, organization_id, first_name, last_name, email')
      .in('id', [keepId, mergeId])
    if (verifyErr || !contacts || contacts.length !== 2) {
      return NextResponse.json({ error: 'One or both contacts not found' }, { status: 404 })
    }
    if (contacts.some(c => c.organization_id !== organizationId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // 1. Re-point loans where mergeId is the primary contact
    await supabase.from('loans').update({ contact_id: keepId }).eq('contact_id', mergeId)

    // 2. Re-point buyer_agent_contact_id
    await supabase.from('loans').update({ buyer_agent_contact_id: keepId }).eq('buyer_agent_contact_id', mergeId)

    // 3. Re-point listing_agent_contact_id
    await supabase.from('loans').update({ listing_agent_contact_id: keepId }).eq('listing_agent_contact_id', mergeId)

    // 4. Re-point activity_log contact references
    await supabase.from('activity_log').update({ contact_id: keepId }).eq('contact_id', mergeId)

    // 5. Re-point email_drafts
    await supabase.from('email_drafts').update({ contact_id: keepId }).eq('contact_id', mergeId)

    // 6. Re-point drip_enrollments if table exists
    await supabase.from('drip_enrollments').update({ contact_id: keepId }).eq('contact_id', mergeId)

    // 7. Fix referring_agent_email on loans — if mergeId contact had a different email,
    //    update referring_agent_email to match the keeper's email where it matched mergeId's email
    const mergeContact = contacts.find(c => c.id === mergeId)
    const keepContact = contacts.find(c => c.id === keepId)
    if (mergeContact?.email && keepContact?.email && mergeContact.email !== keepContact.email) {
      await supabase
        .from('loans')
        .update({ referring_agent_email: keepContact.email })
        .eq('referring_agent_email', mergeContact.email)
    }

    // 8. Delete the merged (secondary) contact
    const { error: deleteErr } = await supabase.from('contacts').delete().eq('id', mergeId)
    if (deleteErr) {
      return NextResponse.json({ error: `Failed to delete merged contact: ${deleteErr.message}` }, { status: 500 })
    }

    const mergeeName = [mergeContact?.first_name, mergeContact?.last_name].filter(Boolean).join(' ') || mergeId
    const keepName = [keepContact?.first_name, keepContact?.last_name].filter(Boolean).join(' ') || keepId

    return NextResponse.json({
      success: true,
      message: `Merged "${mergeeName}" into "${keepName}" and deleted the duplicate.`,
      keepId,
      mergedId: mergeId,
    })
  } catch (err) {
    console.error('Merge contacts error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
