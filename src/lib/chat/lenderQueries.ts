import { createServiceClient } from '@/lib/supabase/service'

/**
 * Tenant-scoped lender query helper used by the chat API's `queryLenderDatabase`
 * tool. The chat route uses service-role to bypass RLS (so the Claude tool can
 * run without an auth cookie on certain execution paths), which means we are
 * responsible for enforcing org scoping ourselves.
 *
 * This helper exists to add a second layer of safety on top of the per-call
 * `.eq('organization_id', organizationId)` filter: every entry point requires
 * `organizationId` as its first argument, throws on missing/blank ids, and
 * logs any callers that try to skip scoping. Without this, a future refactor
 * could silently drop the filter and leak lenders across tenants with zero
 * DB-layer backstop (the `lenders` table is accessed via service-role here).
 */

type LenderRow = {
  name: string
  channel: string | null
  contacts: unknown
  specialty_products: string[] | null
  website: string | null
  broker_id: string | null
  notes: string | null
}

const LENDER_COLUMNS = 'name, channel, contacts, specialty_products, website, broker_id, notes'

function assertOrgId(organizationId: string, caller: string): void {
  if (!organizationId || typeof organizationId !== 'string' || !organizationId.trim()) {
    console.error(`[lenderQueries] ${caller} called with missing/blank organizationId`)
    throw new Error('organizationId is required for lender queries')
  }
}

export async function listLendersForOrg(organizationId: string): Promise<LenderRow[]> {
  assertOrgId(organizationId, 'listLendersForOrg')
  const supabase = createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('lenders')
    .select(LENDER_COLUMNS)
    .eq('organization_id', organizationId)
    .order('name')
  return (data ?? []) as LenderRow[]
}

export async function searchLendersByName(
  organizationId: string,
  term: string
): Promise<LenderRow[]> {
  assertOrgId(organizationId, 'searchLendersByName')
  const supabase = createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('lenders')
    .select(LENDER_COLUMNS)
    .eq('organization_id', organizationId)
    .ilike('name', `%${term}%`)
  return (data ?? []) as LenderRow[]
}
