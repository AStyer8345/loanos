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
        if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(k => !['status', 'notes', 'priority_follow_up', 'hidden'].includes(k)))
            throw Error('Only working status, notes and flags can be edited');
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
        const { data, error } = await ctx.db.from('lead_desk_preferences').update({ ...body, updated_at: new Date().toISOString() }).eq('id', id).eq('organization_id', ctx.organizationId).select('id').maybeSingle();
        if (error || !data)
            throw Error('Saved lead changes unavailable');
        return NextResponse.json(data, { headers: { 'Cache-Control': 'private, no-store' } });
    }
    catch (e) {
        return NextResponse.json({ error: e instanceof Error ? e.message : 'Invalid request' }, { status: 400 });
    }
}
