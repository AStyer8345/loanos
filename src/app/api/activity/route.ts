/**
 * POST /api/activity — write PII-bearing activity entries (Phase 1)
 * GET  /api/activity — read activity with server-side PII decryption (Phase 2)
 *
 * The encryption key only exists server-side, so client components call
 * these endpoints instead of querying activity_log directly.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getOrganization } from '@/lib/getOrganization'
import { createServiceClient } from '@/lib/supabase/service'
import { writeActivityWithPii, decryptActivityPii, type ActivityPublicFields, type PiiPayload } from '@/lib/activity/pii'

// ── POST — write activity with PII encryption ──────────────────────────────

export async function POST(request: NextRequest) {
  const { organizationId, userId } = await getOrganization()
  const body = await request.json()

  const publicFields: ActivityPublicFields = {
    ...body.publicFields,
    organization_id: organizationId, // enforce from session, never trust client
    user_id: body.publicFields?.user_id ?? userId,
  }

  const pii: PiiPayload = body.pii ?? {}

  const serviceClient = createServiceClient()
  const { activityId, error } = await writeActivityWithPii(serviceClient, publicFields, pii)

  if (error) {
    return NextResponse.json({ error }, { status: 500 })
  }

  return NextResponse.json({ id: activityId })
}

// ── GET — read activity with server-side PII decryption ─────────────────────
//
// Query params:
//   contact_id   — filter by contact
//   loan_id      — filter by loan (single or comma-separated)
//   type         — filter by type (e.g. email_inbound, email_sent)
//   action       — ilike filter for action column
//   unmatched    — "true" → contact_id IS NULL, loan_id IS NULL, dismissed != true
//   or_filter    — raw Supabase .or() string (e.g. "loan_id.eq.X,contact_id.eq.Y")
//   not_action   — exclude actions matching ilike patterns (comma-separated)
//   order        — column to order by (default: created_at)
//   limit        — max rows, 1-200 (default: 50)
//   offset       — pagination offset (default: 0)
//   columns      — comma-separated columns to return (default: standard set)
//   include_joins — "contacts,loans" to include FK joins

const MAX_LIMIT = 200
const DEFAULT_COLUMNS = 'id, created_at, action, entity_type, entity_id, type, occurred_at, contact_id, loan_id, external_id, dismissed'
const PII_COLUMNS = 'summary, metadata, subject, body_snippet, from_address, raw_payload'

export async function GET(request: NextRequest) {
  let organizationId: string
  try {
    const ctx = await getOrganization()
    organizationId = ctx.organizationId
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const params = request.nextUrl.searchParams
  const contactId = params.get('contact_id')
  const loanIdParam = params.get('loan_id')
  const type = params.get('type')
  const action = params.get('action')
  const unmatched = params.get('unmatched') === 'true'
  const orFilter = params.get('or_filter')
  const notAction = params.get('not_action')
  const orderBy = params.get('order') || 'created_at'
  const limit = Math.min(Math.max(parseInt(params.get('limit') || '50', 10) || 50, 1), MAX_LIMIT)
  const offset = Math.max(parseInt(params.get('offset') || '0', 10) || 0, 0)
  const columnsParam = params.get('columns')
  const includeJoins = params.get('include_joins')

  // Build column list — always include PII columns for decryption + the PII companion join
  const requestedColumns = columnsParam || DEFAULT_COLUMNS
  const selectParts = [requestedColumns]

  // Always include PII fields so we can decrypt them server-side
  if (!requestedColumns.includes('summary')) selectParts.push(PII_COLUMNS)

  // Join the encrypted PII companion table
  selectParts.push('activity_log_pii(pii_ciphertext, pii_iv, pii_tag, key_version)')

  // Optional FK joins
  if (includeJoins?.includes('contacts')) selectParts.push('contacts(first_name, last_name)')
  if (includeJoins?.includes('loans')) selectParts.push('loans(loan_name)')

  const serviceClient = createServiceClient()
  let query = serviceClient
    .from('activity_log')
    .select(selectParts.join(', '))
    .eq('organization_id', organizationId)

  // Apply filters
  if (contactId) query = query.eq('contact_id', contactId)

  if (loanIdParam) {
    const loanIds = loanIdParam.split(',').map(s => s.trim()).filter(Boolean)
    if (loanIds.length === 1) {
      query = query.eq('loan_id', loanIds[0])
    } else {
      query = query.in('loan_id', loanIds)
    }
  }

  if (type) query = query.eq('type', type)
  if (action) query = query.ilike('action', action)

  if (unmatched) {
    query = query.is('contact_id', null).is('loan_id', null).not('dismissed', 'eq', true)
  }

  if (orFilter) query = query.or(orFilter)

  if (notAction) {
    for (const pattern of notAction.split(',')) {
      query = query.not('action', 'ilike', pattern.trim())
    }
  }

  // Order + paginate
  query = query.order(orderBy, { ascending: false }).range(offset, offset + limit - 1)

  const { data, error } = await query

  if (error) {
    console.error('[api/activity GET] query error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Decrypt PII server-side and merge back into rows
  const rows = decryptActivityPii((data ?? []) as unknown as Record<string, unknown>[])

  // Flatten: merge pii fields back into the row so clients see the same shape
  // they got when reading inline columns directly
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const flattened = rows.map(({ pii, activity_log_pii, ...rest }) => ({
    ...rest,
    ...(pii ?? {}),
  }))

  return NextResponse.json(flattened)
}
