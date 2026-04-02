import { NextRequest, NextResponse } from 'next/server'
import { getOrganization } from '@/lib/getOrganization'
import { getEnrollments, enrollContact, getCampaignById } from '@/lib/drip/queries'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { organizationId } = await getOrganization()
    const campaign = await getCampaignById(organizationId, params.id)
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }
    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get('page') ?? '1', 10)
    const limit = parseInt(url.searchParams.get('limit') ?? '50', 10)
    const search = url.searchParams.get('search') ?? undefined
    const result = await getEnrollments(organizationId, params.id, page, limit, search)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { organizationId } = await getOrganization()
    const body = await req.json() as {
      contact_id: string
      loan_id?: string
      next_send_at?: string
    }
    if (!body.contact_id) {
      return NextResponse.json({ error: 'contact_id is required' }, { status: 400 })
    }
    const enrollment = await enrollContact(
      organizationId,
      params.id,
      body.contact_id,
      body.loan_id ?? null,
      'manual',
      body.next_send_at ?? null
    )
    return NextResponse.json(enrollment, { status: 201 })
  } catch (err) {
    if (err instanceof Error && err.message.includes('23505')) {
      return NextResponse.json({ error: 'Contact is already enrolled in this campaign' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
