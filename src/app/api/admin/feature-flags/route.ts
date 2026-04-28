import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/auth'
import { ALL_FEATURE_KEYS, type OrgFeatures } from '@/lib/features/getOrgFeatures'

type OrgFlagsRow = {
  id: string
  name: string
  features: Partial<OrgFeatures> | null
}

export async function GET() {
  const result = await requireAdmin()
  if (result.error) return result.error
  const { serviceClient } = result

  const { data, error } = await serviceClient!
    .from('organizations')
    .select('id, name, features')
    .order('name', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data as unknown as OrgFlagsRow[])
}

export async function PATCH(request: Request) {
  const result = await requireAdmin()
  if (result.error) return result.error
  const { serviceClient } = result

  const body = (await request.json().catch(() => null)) as
    | { organizationId?: string; features?: Partial<OrgFeatures> | null }
    | null

  if (!body?.organizationId) {
    return NextResponse.json({ error: 'organizationId required' }, { status: 400 })
  }

  let nextFeatures: Partial<OrgFeatures> | null = null
  if (body.features !== null && body.features !== undefined) {
    const sanitized: Partial<OrgFeatures> = {}
    for (const key of ALL_FEATURE_KEYS) {
      const v = body.features[key]
      if (typeof v === 'boolean') sanitized[key] = v
    }
    nextFeatures = sanitized
  }

  const { error } = await serviceClient!
    .from('organizations')
    .update({ features: nextFeatures } as never)
    .eq('id', body.organizationId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
