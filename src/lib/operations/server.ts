import { createClient as authenticatedClient } from '@/lib/supabase/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
export async function operationalContext(req: Request) {
    const authorization = req.headers.get('authorization');
    const db: SupabaseClient = authorization?.startsWith('Bearer ') ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { global: { headers: { Authorization: authorization }, fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }) }, auth: { persistSession: false, autoRefreshToken: false } }) : authenticatedClient({ noStore: true }) as unknown as SupabaseClient;
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : undefined;
    const { data: { user }, error } = await db.auth.getUser(token);
    if (error || !user)
        throw new Error('Sign in required');
    const { data: profile, error: profileError } = await db.from('profiles').select('organization_id,role').eq('id', user.id).single();
    if (profileError || !profile?.organization_id)
        throw new Error('Organization membership required');
    return { db, userId: user.id, organizationId: profile.organization_id as string, role: profile.role as string };
}
