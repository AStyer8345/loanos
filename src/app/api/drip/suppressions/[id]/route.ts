import { NextRequest, NextResponse } from 'next/server'
import { getOrganization } from '@/lib/getOrganization'
import { createServiceClient } from '@/lib/supabase/service'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { organizationId } = await getOrganization()
    const supabase = createServiceClient() as any // eslint-disable-line @typescript-eslint/no-explicit-any
    const { error } = await supabase
      .from('drip_suppressions')
      .delete()
      .eq('id', params.id)
      .eq('org_id', organizationId)
    if (error) throw error
    return new NextResponse(null, { status: 204 })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
