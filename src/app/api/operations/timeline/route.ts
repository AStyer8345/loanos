import {outboundDisplay} from '@/lib/communications/outbound';
import {intakeDb} from '@/lib/intake/server';
import { NextResponse } from 'next/server';
import { operationalContext } from '@/lib/operations/server';
import { createServiceClient } from '@/lib/supabase/service';
import {decryptInquiry,type CipherPayload} from '@/lib/intake/inquiry';
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
    const eventQuery = intakeDb().from('communication_events').select('id,occurred_at,payload_cipher').eq('organization_id',ctx.organizationId).order('occurred_at',{ascending:false}).limit(60);
    const contactIds = kind === 'contact' ? [id] : (await ctx.db.from('loans').select('contact_id').eq('id',id).eq('organization_id',ctx.organizationId).single()).data?.contact_id;
    if(contactIds){const {data:events,error:mailError}=await eventQuery.in('contact_id',Array.isArray(contactIds)?contactIds:[contactIds]);if(mailError)return NextResponse.json({error:'Communication history could not be loaded'},{status:503});for(const e of events||[]){const p=decryptInquiry(e.payload_cipher as CipherPayload);rows.push({id:e.id,type:'email_outbound_metadata',action:'Outbound email recorded; authorship unverified',occurred_at:e.occurred_at,...outboundDisplay(p),summary:'Source metadata only. No body or attachments copied.',content_available:true})}}
    rows.sort((a,b)=>Date.parse(String(b.occurred_at))-Date.parse(String(a.occurred_at)));
    return NextResponse.json({ rows:rows.slice(0,60) }, { headers: { 'Cache-Control': 'private, no-store' } });
}
