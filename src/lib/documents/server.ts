import 'server-only';
import { createHash } from 'node:crypto';
import { intakeDb } from '@/lib/intake/server';
import { encryptInquiry, decryptInquiry, type CipherPayload } from '@/lib/intake/inquiry';
import { operationalContext } from '@/lib/operations/server';
import { REVIEW_FIELDS } from './review';
export const VERSION_COLUMNS = 'id,organization_id,loan_id,document_id,created_by,kind,version,sha256,supersedes_id,status,extraction_model,created_at,extracted_at,reviewed_at,last_error,task_id,processing_started_at,extraction_attempts';
export type ReviewContext = Awaited<ReturnType<typeof operationalContext>>;
export const digest = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export async function loanBaseline(ctx: ReviewContext, loanId: string) { const { data, error } = await ctx.db.from('loans').select('id,contact_id,' + REVIEW_FIELDS.join(',')).eq('id', loanId).eq('organization_id', ctx.organizationId).single(); if (error || !data)
    throw Error('Loan not found'); const row = data as unknown as Record<string, unknown>; return Object.fromEntries(REVIEW_FIELDS.map(k => [k, row[k] ?? null])); }
export async function authorizedVersion(ctx: ReviewContext, id: string) { const result = await ctx.db.from('document_review_versions').select(VERSION_COLUMNS).eq('id', id).eq('organization_id', ctx.organizationId).single(); if (result.error || !result.data)
    throw Error('Document review not found'); return result.data; }
export async function reviewDetails(ctx: ReviewContext, id: string) {
    await authorizedVersion(ctx, id);
    const db = intakeDb();
    const { data: v, error } = await db.from('document_review_versions').select('*').eq('organization_id', ctx.organizationId).eq('id', id).single();
    if (error || !v)
        throw Error('Document review not found');
    const current = await loanBaseline(ctx, v.loan_id);
    const history = await db.from('document_review_history').select('id,reviewer_id,decision,notes_cipher,task_ids,created_at').eq('organization_id', ctx.organizationId).eq('version_id', id).order('created_at');
    if (history.error)
        throw Error('Review history unavailable');
    const source = await ctx.db.from('documents').select('id,file_name,created_at').eq('organization_id', ctx.organizationId).eq('id', v.document_id).single();
    if (source.error)
        throw Error('Source document unavailable');
    return { ...Object.fromEntries(VERSION_COLUMNS.split(',').map(k => [k, v[k]])), source: source.data, baseline: decryptInquiry(v.baseline_cipher as CipherPayload), current, current_baseline_hash: digest(current), proposal: v.proposal_cipher ? decryptInquiry(v.proposal_cipher as CipherPayload) : null, history: history.data.map(h => ({ ...h, notes_cipher: undefined, notes: decryptInquiry(h.notes_cipher as CipherPayload) })) };
}
export async function registerReview(ctx: ReviewContext, raw: Record<string, unknown>) {
    const loanId = String(raw.loan_id || ''), kind = String(raw.kind || raw.doc_type || '');
    if (!/^[a-f0-9-]{36}$/i.test(loanId) || !['contract', 'conditional_approval'].includes(kind))
        throw Error('Choose a loan and document type');
    const baseline = await loanBaseline(ctx, loanId);
    let path = String(raw.file_path || ''), name = String(raw.file_name || ''), existing = false;
    if (raw.document_id) {
        const { data: d, error } = await ctx.db.from('documents').select('file_path,file_name').eq('id', raw.document_id).eq('organization_id', ctx.organizationId).eq('loan_id', loanId).single();
        if (error || !d)
            throw Error('Source document not found');
        path = d.file_path;
        name = d.file_name;
        existing = true;
    }
    if ((!existing && !path.startsWith(`${ctx.userId}/${loanId}/`)) || path.includes('..') || path.includes('//') || !name.toLowerCase().endsWith('.pdf'))
        throw Error('Use an authorized PDF on this loan');
    const storage = existing ? intakeDb().storage : ctx.db.storage;
    const { data: file, error: downloadError } = await storage.from('documents').download(path);
    if (downloadError || !file)
        throw Error('Source document unavailable');
    if (file.size > 15 * 1024 * 1024 || file.size < 8)
        throw Error('Use a PDF no larger than 15 MB');
    const bytes = Buffer.from(await file.arrayBuffer());
    if (bytes.subarray(0, 5).toString() !== '%PDF-')
        throw Error('The source is not a PDF');
    const sha = createHash('sha256').update(bytes).digest('hex');
    const { data, error } = await intakeDb().rpc('register_document_review', { p_org: ctx.organizationId, p_actor: ctx.userId, p_loan: loanId, p_path: path, p_name: name, p_size: bytes.length, p_kind: kind, p_sha: sha, p_baseline: encryptInquiry(baseline) });
    if (error)
        throw Error('Document version could not be saved');
    return data;
}
export async function verifiedSource(ctx: ReviewContext, v: {
    loan_id: string;
    document_id: string;
    sha256: string;
}) {
    const { data: doc, error } = await ctx.db.from('documents').select('file_path,file_name').eq('organization_id', ctx.organizationId).eq('loan_id', v.loan_id).eq('id', v.document_id).single();
    if (error || !doc)
        throw Error('Source document unavailable');
    const { data: file, error: downloadError } = await intakeDb().storage.from('documents').download(doc.file_path);
    if (downloadError || !file || file.size > 15 * 1024 * 1024)
        throw Error('Source document unavailable');
    const hash = createHash('sha256').update(Buffer.from(await file.arrayBuffer())).digest('hex');
    if (hash !== v.sha256)
        throw Error('The source file changed. Save it as a new document version before review.');
    return doc;
}
