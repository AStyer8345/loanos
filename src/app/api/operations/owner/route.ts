import { NextResponse } from 'next/server';
import { operationalContext } from '@/lib/operations/server';
export async function PATCH(req: Request) {
    let ctx: Awaited<ReturnType<typeof operationalContext>>;
    try {
        ctx = await operationalContext(req);
    }
    catch {
        return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
    }
    try {
        const { kind, id, owner } = await req.json();
        if (!['loan', 'contact', 'inquiry'].includes(kind))
            throw Error();
        const { error } = await ctx.db.rpc('set_operational_owner', { p_kind: kind, p_id: id, p_owner: owner || null });
        if (error)
            throw error;
        return NextResponse.json({ saved: true });
    }
    catch {
        return NextResponse.json({ error: 'Ownership could not be saved. Choose a member of your team.' }, { status: 400 });
    }
}
