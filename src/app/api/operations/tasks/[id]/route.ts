import { NextResponse } from 'next/server';
import { operationalContext } from '@/lib/operations/server';
import { parseTaskMutation } from '@/lib/tasks';
import { parseRouting } from '@/lib/command-center-routing';
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
        const body = parseTaskMutation(await req.json(), 'update');
        if ('follow_up_reason' in body)
            parseRouting({ follow_up_reason: body.follow_up_reason });
        if (body.status === 'completed')
            body.is_complete = true;
        if (body.status === 'open' || body.status === 'in_progress') {
            body.is_complete = false;
            body.completed_at = null;
            body.dismissed_at = null;
        }
        const { data, error } = await ctx.db.from('todo_items').update(body).eq('id', params.id).eq('organization_id', ctx.organizationId).select('id').maybeSingle();
        if (error)
            throw new Error('Task could not be saved. Verify that all linked records belong to your team.');
        if (!data)
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        return NextResponse.json(data, { headers: { 'Cache-Control': 'private, no-store' } });
    }
    catch (e) {
        return NextResponse.json({ error: e instanceof Error ? e.message : 'Invalid task' }, { status: 400 });
    }
}
