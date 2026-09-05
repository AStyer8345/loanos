import { operationalContext } from '@/lib/operations/server';
import { authorizedVersion, loanBaseline, digest, verifiedSource } from '@/lib/documents/server';
import { parseConditionTasks } from '@/lib/documents/review';
import { encryptInquiry } from '@/lib/intake/inquiry';
import { intakeDb } from '@/lib/intake/server';
export async function POST(req: Request, { params }: {
    params: {
        id: string;
    };
}) { let ctx; try {
    ctx = await operationalContext(req);
}
catch {
    return Response.json({ error: 'Sign in required' }, { status: 401 });
} try {
    const body = await req.json(), v = await authorizedVersion(ctx, params.id);
    if (!['reviewed', 'rejected'].includes(body.decision) || typeof body.notes !== 'string' || body.notes.trim().length < 10 || body.notes.length > 5000)
        throw Error('Record a review decision and source-based explanation');
    await verifiedSource(ctx, v);
    const current = await loanBaseline(ctx, v.loan_id);
    if (body.current_baseline_hash !== digest(current))
        return Response.json({ error: 'The source loan changed. Refresh and review the current diff before recording your decision.' }, { status: 409 });
    const conditions = parseConditionTasks(body.conditions || []);
    const { data, error } = await intakeDb().rpc('review_document_version', { p_org: ctx.organizationId, p_actor: ctx.userId, p_version: params.id, p_decision: body.decision, p_notes: encryptInquiry({ notes: body.notes, current_baseline_hash: digest(current), current_at_review: current }), p_conditions: conditions });
    if (error)
        throw Error('Review could not be recorded. Verify this is the latest version and every owner belongs to your team.');
    return Response.json(data, { headers: { 'Cache-Control': 'private, no-store' } });
}
catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : 'Invalid review' }, { status: 400 });
} }
