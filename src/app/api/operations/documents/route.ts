import { operationalContext } from '@/lib/operations/server';
import { loanBaseline, registerReview, VERSION_COLUMNS } from '@/lib/documents/server';
const headers = { 'Cache-Control': 'private, no-store' };
export const dynamic = 'force-dynamic';
export async function GET(req: Request) { let ctx; try {
    ctx = await operationalContext(req);
}
catch {
    return Response.json({ error: 'Sign in required' }, { status: 401, headers });
} try {
    const loan = new URL(req.url).searchParams.get('loan_id') || '';
    await loanBaseline(ctx, loan);
    const [v, d, m] = await Promise.all([ctx.db.from('document_review_versions').select(VERSION_COLUMNS).eq('organization_id', ctx.organizationId).eq('loan_id', loan).order('version', { ascending: false }).limit(200), ctx.db.from('documents').select('id,file_name,created_at').eq('organization_id', ctx.organizationId).eq('loan_id', loan).order('created_at', { ascending: false }).limit(500), ctx.db.from('profiles').select('id,full_name,email').eq('organization_id', ctx.organizationId)]);
    if (v.error || d.error || m.error)
        throw Error('Document review data unavailable');
    return Response.json({ versions: v.data, documents: d.data, members: m.data, extractionEnabled: process.env.DOCUMENT_EXTRACTION_ENABLED === 'true', limited: v.data.length === 200 || d.data.length === 500 }, { headers });
}
catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : 'Document reviews unavailable' }, { status: 400, headers });
} }
export async function POST(req: Request) { let ctx; try {
    ctx = await operationalContext(req);
}
catch {
    return Response.json({ error: 'Sign in required' }, { status: 401, headers });
} try {
    return Response.json(await registerReview(ctx, await req.json()), { status: 201, headers });
}
catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : 'Document version could not be saved' }, { status: 400, headers });
} }
