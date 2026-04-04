import { redirect } from 'next/navigation'
import { getOrganization } from '@/lib/getOrganization'
import { createClient } from '@/lib/supabase/server'
import LendersClient from './LendersClient'
import type { Lender } from '@/components/lenders/LenderCard'

export const metadata = { title: 'Lenders | LoanOS' }

export default async function LendersPage() {
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
    .select('id, name, channel, website, broker_id, contacts, specialty_products, notes, updated_at')
    .eq('organization_id', org.organizationId)
    .order('name')

  const lenders: Lender[] = error
    ? []
    : (data ?? []).map((row: Record<string, unknown>) => ({
        id: row.id as string,
        name: row.name as string,
        channel: (row.channel as string) ?? null,
        website: (row.website as string) ?? null,
        broker_id: (row.broker_id as string) ?? null,
        contacts: Array.isArray(row.contacts) ? row.contacts : [],
        specialty_products: Array.isArray(row.specialty_products) ? row.specialty_products : [],
        notes: (row.notes as string) ?? null,
        updated_at: (row.updated_at as string) ?? '',
      }))

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Lender Resources</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Wholesale and correspondent lender contacts, products, and notes.
        </p>
      </div>
      <LendersClient lenders={lenders} />
    </div>
  )
}
