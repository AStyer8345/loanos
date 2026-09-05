import { NextResponse } from 'next/server';
import { operationalContext } from '@/lib/operations/server';
import { parseTaskMutation } from '@/lib/tasks';
import { parseRouting } from '@/lib/command-center-routing';
export async function POST(req: Request) {
    let ctx: Awaited<ReturnType<typeof operationalContext>>;
    try {
        ctx = await operationalContext(req);
    }
    catch {
        return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
    }
    try {
        const raw = await req.json();
        const { inquiry_id, ...taskBody } = raw;
        const body = parseTaskMutation(taskBody, 'create');
        let source = 'manual', sourceKey: string | null = null;
        if (inquiry_id) {
            const match = await ctx.db.from('inquiries').select('id,contact_id,task_id').eq('id', inquiry_id).eq('organization_id', ctx.organizationId).maybeSingle();
            if (match.error || !match.data)
                throw Error('Inquiry not found');
            if (match.data.task_id)
                throw Error('This inquiry already has a task. Edit its existing next action.');
            body.related_contact_id = match.data.contact_id;
            source = 'inquiry';
            sourceKey = 'inquiry:' + match.data.id;
        }
        if ('follow_up_reason' in body)
            parseRouting({ follow_up_reason: body.follow_up_reason });
        const { data, error } = await ctx.db.from('todo_items').insert({ ...body, organization_id: ctx.organizationId, user_id: ctx.userId, source, source_key: sourceKey }).select('id').single();
        if (error)
            throw new Error('Task could not be saved. Verify that all records and the assignee belong to your team.');
        return NextResponse.json(data, { headers: { 'Cache-Control': 'private, no-store' } });
    }
    catch (e) {
        return NextResponse.json({ error: e instanceof Error ? e.message : 'Invalid task' }, { status: 400 });
    }
}
