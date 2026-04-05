/**
 * src/lib/los/resolveOrgFromSlug.ts
 *
 * Layer 1 of LOS webhook verification: look up the organization and its
 * active integration rows for a given (slug, provider) pair.
 *
 * Called from the per-provider webhook route BEFORE verifying the secret
 * (layer 2) or the payload identity (layer 3). If this returns null, we
 * short-circuit with 404 — an unknown slug reveals nothing about other
 * tenants and doesn't leak the list of valid orgs.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { HashedSecret } from './hashSecret'

export type LosProvider = 'arive' | 'encompass' | 'calyx' | 'byte'

export interface ResolvedLosOrg {
  organization_id: string
  organization_name: string
  verification_mode: 'shadow' | 'enforce'
  /** All active integration rows for (org, provider). Usually 1, may be more if
   *  the org has multiple LOs/processors on the same Arive seat.
   *  Layer 2 picks the row whose secret_hash matches the inbound header. */
  integrations: Array<{
    id: string
    secret: HashedSecret
    external_user_id: string | null
    external_user_email: string | null
    label: string | null
  }>
}

/**
 * Resolve slug → org + integrations. Uses service role client so it can
 * bypass RLS (this is called from the webhook handler before any user
 * context exists).
 */
export async function resolveOrgFromSlug(
  serviceClient: SupabaseClient,
  slug: string,
  provider: LosProvider
): Promise<ResolvedLosOrg | null> {
  // Step 1 — slug → organization
  const { data: org, error: orgErr } = await serviceClient
    .from('organizations')
    .select('id, name')
    .eq('slug', slug)
    .maybeSingle()

  if (orgErr || !org) return null

  // Step 2 — load verification mode from org_settings
  const { data: settings } = await serviceClient
    .from('org_settings')
    .select('los_verification_mode')
    .eq('organization_id', org.id)
    .maybeSingle()

  const verification_mode: 'shadow' | 'enforce' =
    settings?.los_verification_mode === 'enforce' ? 'enforce' : 'shadow'

  // Step 3 — load all active integrations for this provider
  const { data: rows, error: rowsErr } = await serviceClient
    .from('los_integrations')
    .select('id, secret_hash, secret_salt, external_user_id, external_user_email, label')
    .eq('organization_id', org.id)
    .eq('provider', provider)
    .eq('active', true)

  if (rowsErr) return null

  return {
    organization_id: org.id,
    organization_name: org.name,
    verification_mode,
    integrations: (rows ?? []).map((r) => ({
      id: r.id,
      secret: { secret_hash: r.secret_hash, secret_salt: r.secret_salt },
      external_user_id: r.external_user_id,
      external_user_email: r.external_user_email,
      label: r.label,
    })),
  }
}
