import { NextRequest, NextResponse } from 'next/server'
import { getOrganization } from '@/lib/getOrganization'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(req: NextRequest) {
  try {
    const { organizationId } = await getOrganization()
    const key = req.nextUrl.searchParams.get('key')

    if (!key) {
      return NextResponse.json({ error: 'Missing key parameter' }, { status: 400 })
    }

    const supabase = createServiceClient() as any // eslint-disable-line @typescript-eslint/no-explicit-any

    const { data } = await supabase
      .from('social_settings')
      .select('value, updated_at')
      .eq('organization_id', organizationId)
      .eq('key', key)
      .maybeSingle()

    return NextResponse.json({
      value: data?.value ?? null,
      updatedAt: data?.updated_at ?? null,
    })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { organizationId, userId } = await getOrganization()
    const body = await req.json()
    const { key, value, appendEntry } = body

    if (!key || typeof key !== 'string') {
      return NextResponse.json({ error: 'Missing key' }, { status: 400 })
    }

    const supabase = createServiceClient() as any // eslint-disable-line @typescript-eslint/no-explicit-any

    // Append mode: add a new line to existing value (used for voice_feedback log)
    if (appendEntry && typeof appendEntry === 'string') {
      const { data: existing } = await supabase
        .from('social_settings')
        .select('value')
        .eq('organization_id', organizationId)
        .eq('key', key)
        .maybeSingle()

      const currentValue = existing?.value || ''
      const newValue = currentValue ? `${currentValue}\n${appendEntry}` : appendEntry

      await supabase.from('social_settings').upsert(
        {
          organization_id: organizationId,
          key,
          value: newValue,
          updated_by: userId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'organization_id,key' }
      )

      return NextResponse.json({ success: true })
    }

    // Replace mode: overwrite the full value
    if (value === undefined || value === null) {
      return NextResponse.json({ error: 'Missing value' }, { status: 400 })
    }

    await supabase.from('social_settings').upsert(
      {
        organization_id: organizationId,
        key,
        value,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'organization_id,key' }
    )

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
