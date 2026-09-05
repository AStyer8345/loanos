import { NextResponse } from 'next/server';
import { operationalContext } from '@/lib/operations/server';
export async function PATCH(req: Request, { params }: {
    params: {
        id: string;
    };
}) {
    let ctx: Awaited<ReturnType<typeof operationalContext>>;
    try {
        ctx = await operationalContext(req);
    }
    catch {
        return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
    }
    try {
        const body = await req.json();
        if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(k => !['status', 'notes', 'priority_follow_up', 'hidden','amount_note','product_note','reporting_source','referral_name','next_action'].includes(k)))
            throw Error('Only Lead Desk planning details, notes and flags can be edited');
        for(const [key,limit] of Object.entries({amount_note:200,product_note:500,referral_name:300,next_action:2000}))
            if(key in body && (typeof body[key]!=='string'||body[key].length>limit))throw Error('Invalid '+key);
        if('reporting_source' in body && !['AI','Realtor Referral','Financial Advisor Referral','Other'].includes(body.reporting_source))throw Error('Invalid reporting source');
        if ('notes' in body && (typeof body.notes !== 'string' || body.notes.length > 10000))
            throw Error('Notes are too long');
        if ('status' in body && (typeof body.status !== 'string' || body.status.length > 100))
            throw Error('Invalid working status');
        for (const key of ['priority_follow_up', 'hidden'])
            if (key in body && typeof body[key] !== 'boolean')
                throw Error('Invalid flag');
        let id = params.id;
        if (new URL(req.url).searchParams.get('contact') === 'true') {
            const r = await ctx.db.rpc('ensure_lead_desk_preference', { p_contact: id });
            if (r.error)
                throw Error('Contact not found');
            id = r.data;
        }
        if(['status','amount_note','product_note'].some(k=>k in body)){
            const {data:current,error:readError}=await ctx.db.from('lead_desk_preferences').select('provenance').eq('id',id).eq('organization_id',ctx.organizationId).maybeSingle();
            if(readError||!current)throw Error('Saved lead unavailable');
            if((current.provenance as {arive_match?:{state:string}}|null)?.arive_match?.state==='matched')throw Error('This loan’s amount and status come from ARIVE. Update them in ARIVE.');
        }
        const { data, error } = await ctx.db.from('lead_desk_preferences').update({ ...body, updated_at: new Date().toISOString() }).eq('id', id).eq('organization_id', ctx.organizationId).select('id').maybeSingle();
        if (error || !data)
            throw Error('Saved lead changes unavailable');
        return NextResponse.json(data, { headers: { 'Cache-Control': 'private, no-store' } });
    }
    catch (e) {
        return NextResponse.json({ error: e instanceof Error ? e.message : 'Invalid request' }, { status: 400 });
    }
}
