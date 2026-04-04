import { redirect, notFound } from 'next/navigation'
import { getOrganization } from '@/lib/getOrganization'
import { createClient } from '@/lib/supabase/server'
import LenderDetailClient from './LenderDetailClient'

export const metadata = { title: 'Lender Details | LoanOS' }

export default async function LenderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let org: Awaited<ReturnType<typeof getOrganization>>
  try {
    org = await getOrganization()
  } catch {
    redirect('/login')
  }

  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('lenders')
    .select('*')
    .eq('id', id)
    .eq('organization_id', org.organizationId)
    .single()

  if (error || !data) notFound()

  const lender = {
    id: data.id as string,
    name: data.name as string,
    channel: (data.channel as string) ?? null,
    website: (data.website as string) ?? null,
    broker_id: (data.broker_id as string) ?? null,
    contacts: Array.isArray(data.contacts) ? data.contacts : [],
    specialty_products: Array.isArray(data.specialty_products) ? data.specialty_products : [],
    notes: (data.notes as string) ?? null,
    updated_at: (data.updated_at as string) ?? '',
  }

  return <LenderDetailClient lender={lender} />
}
