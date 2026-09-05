import { operationalContext } from '@/lib/operations/server';
import { authorizedVersion, verifiedSource } from '@/lib/documents/server';
import { intakeDb } from '@/lib/intake/server';
export const maxDuration = 60;
export async function POST(req: Request, { params }: {
    params: {
        id: string;
    };
}) {
    let ctx;
    try {
        ctx = await operationalContext(req);
    }
    catch {
        return Response.json({ error: 'Sign in required' }, { status: 401 });
    }
    try {
        const v = await authorizedVersion(ctx, params.id), db = intakeDb();
        const doc = await verifiedSource(ctx, v);
        const base = process.env.N8N_WEBHOOK_BASE || process.env.N8N_WEBHOOK_BASE_URL || process.env.NEXT_PUBLIC_N8N_WEBHOOK_BASE;
        const secret = process.env.LOANOS_AGENT_SECRET;
        if (!base || !secret)
            throw Error('Extraction connection is unavailable; source remains ready for manual review');
        const { data: signed, error: signError } = await db.storage.from('documents').createSignedUrl(doc.file_path, 600);
        if (signError || !signed)
            throw Error('Source document unavailable');
        const { data: claimed, error: claimError } = await db.rpc('claim_document_extraction', { p_org: ctx.organizationId, p_version: v.id });
        if (claimError)
            throw Error('This document version cannot be queued');
        if (!claimed)
            return Response.json({ queued: false, status: v.status, message: 'This version is already processing or has a review proposal.' }, { status: 202 });
        try {
            const response = await fetch(base.replace(/\/$/, '') + '/loanos-document-review', { method: 'POST', headers: { Authorization: 'Bearer ' + secret, 'Content-Type': 'application/json' }, body: JSON.stringify({ review_id: v.id, organization_id: ctx.organizationId, loan_id: v.loan_id, kind: v.kind, file_name: doc.file_name, file_url: signed.signedUrl }), redirect: 'error', signal: AbortSignal.timeout(20000) });
            if (!response.ok) {
                if (response.status === 404 || response.status === 401) {
                    await db.from('document_review_versions').update({ status: 'failed', last_error: 'Extraction connection rejected the request; source is retained for review.' }).eq('id', v.id).eq('organization_id', ctx.organizationId).eq('status', 'processing');
                }
                throw Error('Extraction did not confirm acceptance; source and review task are retained');
            }
        }
        catch {
            return Response.json({ queued: false, status: 'needs_verification', message: 'Source and review task are saved. Extraction acceptance needs verification before retry.' }, { status: 202 });
        }
        return Response.json({ queued: true, status: 'processing', financial_fields_changed: false }, { status: 202, headers: { 'Cache-Control': 'private, no-store' } });
    }
    catch (e) {
        return Response.json({ error: e instanceof Error ? e.message : 'Extraction unavailable' }, { status: 400 });
    }
}
