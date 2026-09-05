import { NextResponse } from 'next/server';
import { operationalContext } from '@/lib/operations/server';
import { createServiceClient } from '@/lib/supabase/service';
import { decryptActivityPii } from '@/lib/activity/pii';
export async function GET(req: Request) {
    let ctx: Awaited<ReturnType<typeof operationalContext>>;
    try {
        ctx = await operationalContext(req);
    }
    catch {
        return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
    }
    const params = new URL(req.url).searchParams, id = params.get('id'), kind = params.get('kind');
    if (!id || !/^[\da-f-]{36}$/i.test(id) || !['contact', 'loan'].includes(kind || ''))
        return NextResponse.json({ error: 'Choose a contact or loan' }, { status: 400 });
    const table = kind === 'loan' ? 'loans' : 'contacts', column = kind === 'loan' ? 'loan_id' : 'contact_id';
    const check = await ctx.db.from(table).select('id').eq('id', id).eq('organization_id', ctx.organizationId).maybeSingle();
    if (check.error || !check.data)
        return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    const { data, error } = await createServiceClient({ noStore: true }).from('activity_log').select('id,type,action,occurred_at,external_id,activity_log_pii(pii_ciphertext,pii_iv,pii_tag,key_version)').eq('organization_id', ctx.organizationId).eq(column, id).order('occurred_at', { ascending: false, nullsFirst: false }).limit(60);
    if (error)
        return NextResponse.json({ error: 'Communication history could not be loaded' }, { status: 503 });
    const rows = decryptActivityPii((data || []) as unknown as Record<string, unknown>[]).map(r => ({ id: r.id, type: r.type, action: r.action, occurred_at: r.occurred_at, subject: r.pii?.subject || null, summary: r.pii?.summary || null, source_url: typeof r.pii?.metadata?.webLink === 'string' && r.pii.metadata.webLink.startsWith('https://') ? r.pii.metadata.webLink : null, content_available: !!r.pii }));
    return NextResponse.json({ rows }, { headers: { 'Cache-Control': 'private, no-store' } });
}
