import { validateAgentSecret } from '@/lib/auth/validateAgentSecret';
import { intakeDb } from '@/lib/intake/server';
import { encryptInquiry } from '@/lib/intake/inquiry';
import { normalizeProposal } from '@/lib/documents/review';
import { digest } from '@/lib/documents/server';
export async function POST(req: Request) { const denied = validateAgentSecret(req); if (denied)
    return denied; try {
    const body = await req.json();
    const proposal = normalizeProposal(body.proposal);
    const { data: v, error: lookup } = await intakeDb().from('document_review_versions').select('id,organization_id').eq('id', body.review_id).eq('organization_id', body.organization_id).single();
    if (lookup || !v)
        throw Error('Review version not found');
    const { data, error } = await intakeDb().rpc('record_document_extraction', { p_org: v.organization_id, p_version: v.id, p_cipher: encryptInquiry(proposal), p_hash: digest(proposal), p_model: String(body.model || 'source extraction; model not recorded') });
    if (error)
        throw Error('Proposal could not be recorded; check whether a newer or reviewed version exists');
    return Response.json({ recorded: data, review_required: true, financial_fields_changed: false });
}
catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : 'Invalid extraction' }, { status: 400 });
} }
