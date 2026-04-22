/**
 * Tenant-isolation test-user helper.
 *
 * Creates signed-in test users bound to a given organization so integration
 * tests can prove RLS actually enforces cross-tenant isolation end-to-end.
 *
 * Env vars required to run (export before `npm test`):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage: see tests/security/tenant-isolation.integration.test.ts.
 */
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export type TestUserContext = {
  userId: string
  orgId: string
  email: string
  accessToken: string
  cleanup: () => Promise<void>
}

/**
 * Create a signed-in test user bound to the given organization.
 * Profile row is seeded BEFORE sign-in so get_my_organization_id() resolves.
 */
export async function createTestUserInOrg(orgId: string, label: string): Promise<TestUserContext> {
  const admin = createSupabaseClient<Database>(SUPABASE_URL, SERVICE_KEY)
  const email = `audit-probe-${label}-${Date.now()}@loanos.test`
  const password = crypto.randomUUID()

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (createErr || !created.user) throw new Error(`createTestUserInOrg auth: ${createErr?.message}`)

  const userId = created.user.id

  const { error: profileErr } = await admin
    .from('profiles')
    .insert({ id: userId, organization_id: orgId, email, role: 'member' } as never)
  if (profileErr) throw new Error(`createTestUserInOrg profile: ${profileErr.message}`)

  const userClient = createSupabaseClient<Database>(SUPABASE_URL, ANON_KEY)
  const { data: session, error: signInErr } = await userClient.auth.signInWithPassword({ email, password })
  if (signInErr || !session.session) throw new Error(`createTestUserInOrg signIn: ${signInErr?.message}`)

  return {
    userId,
    orgId,
    email,
    accessToken: session.session.access_token,
    cleanup: async () => {
      await admin.from('profiles').delete().eq('id', userId)
      await admin.auth.admin.deleteUser(userId)
    },
  }
}

/** Supabase client authenticated as the given test user. RLS-enforced. */
export function createUserScopedTestClient(ctx: TestUserContext) {
  return createSupabaseClient<Database>(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${ctx.accessToken}` } },
  })
}
