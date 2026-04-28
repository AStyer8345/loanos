import 'server-only'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getOrganization } from '@/lib/getOrganization'
import {
  ALL_FEATURE_KEYS,
  DEFAULT_FEATURES,
  type OrgFeatures,
} from './types'

export { ALL_FEATURE_KEYS, DEFAULT_FEATURES, type OrgFeatures }

function coerce(raw: unknown): OrgFeatures {
  if (!raw || typeof raw !== 'object') return DEFAULT_FEATURES
  const r = raw as Record<string, unknown>
  const out: OrgFeatures = { ...DEFAULT_FEATURES }
  for (const key of ALL_FEATURE_KEYS) {
    if (r[key] === false) out[key] = false
  }
  return out
}

/**
 * Server-only. Reads the current authenticated user's org `features` jsonb
 * and returns a fully-typed object. Defaults all keys to `true` if the row
 * is missing or the column is NULL. Wrapped in React `cache` so multiple
 * callers in the same render tree share one DB read.
 *
 * Returns DEFAULT_FEATURES (everything on) if the user is not authenticated
 * — callers in non-auth contexts should not use this; use only inside
 * authenticated server components and route handlers.
 */
export const getOrgFeatures = cache(async (): Promise<OrgFeatures> => {
  let organizationId: string
  try {
    organizationId = (await getOrganization()).organizationId
  } catch {
    return DEFAULT_FEATURES
  }

  const supabase = createClient()
  const { data } = await supabase
    .from('organizations')
    .select('features')
    .eq('id', organizationId)
    .maybeSingle()

  return coerce((data as { features?: unknown } | null)?.features)
})
