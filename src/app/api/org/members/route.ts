import { NextResponse } from 'next/server'
import { getOrganization } from '@/lib/getOrganization'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET() {
  try {
    const { organizationId } = await getOrganization()
    const supabase = createClient()

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, created_at')
      .eq('organization_id', organizationId)
      .order('created_at')

    if (error) throw error
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function PATCH(req: Request) {
  try {
    const { role: myRole, organizationId } = await getOrganization()
    if (!['owner', 'admin'].includes(myRole!)) {
      return NextResponse.json({ error: 'Only owners and admins can change roles' }, { status: 403 })
    }

    const { userId, role } = await req.json()
    if (!['admin', 'member'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role. Must be admin or member.' }, { status: 400 })
    }

    const service = createServiceClient()
    const { error } = await service
      .from('profiles')
      .update({ role })
      .eq('id', userId)
      .eq('organization_id', organizationId)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
