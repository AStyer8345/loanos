import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

/**
 * Creates a Supabase client using the service role key.
 * Bypasses RLS — server-only, never expose to the browser.
 */
export function createServiceClient({ noStore = false }: { noStore?: boolean } = {}) {
  return createClient<Database>(
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { global: noStore ? { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }) } : undefined }
  )
}
