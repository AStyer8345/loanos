'use client';
import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CONDITION_ROUTES, type Proposal, type ConditionTask } from '@/lib/documents/review';
import '@/components/operations/operations.css';
type Version = {
    id: string;
    kind: string;
    version: number;
    status: string;
    created_at: string;
    document_id: string;
    processing_started_at?: string;
    extraction_attempts?: number;
    last_error?: string;
};
type Detail = Version & {
    source: {
        file_name: string;
    };
    baseline: Record<string, unknown>;
    current: Record<string, unknown>;
    current_baseline_hash: string;
    proposal: Proposal | null;
    history: {
        id: string;
        reviewer_id: string;
        decision: string;
        created_at: string;
        notes: {
            notes?: string;
        };
        task_ids: string[];
    }[];
};
type ConditionDraft = ConditionTask & {
    selected: boolean;
};
const label = (value: string) => value.replaceAll('_', ' ');
const display = (value: unknown) => value === null || value === undefined ? 'Not recorded' : String(value);
export default function DocumentReviewHome({ loanId }: {
    loanId: string;
}) {
    const [versions, setVersions] = useState<Version[]>([]), [documents, setDocuments] = useState<{
        id: string;
        file_name: string;
    }[]>([]), [members, setMembers] = useState<{
        id: string;
        full_name: string | null;
        email: string | null;
    }[]>([]), [detail, setDetail] = useState<Detail | null>(null), [tasks, setTasks] = useState<ConditionDraft[]>([]), [notice, setNotice] = useState(''), [busy, setBusy] = useState(false);
    const request = async (path: string, init?: RequestInit) => { const r = await fetch(path, { ...init, cache: 'no-store', headers: { 'Content-Type': 'application/json', ...init?.headers } }); const data = await r.json(); if (!r.ok)
        throw Error(data.error || 'Document review unavailable'); return data; };
    const load = useCallback(async () => { try {
        const r = await fetch(`/api/operations/documents?loan_id=${encodeURIComponent(loanId)}`, { cache: 'no-store' }), d = await r.json();
        if (!r.ok)
            throw Error(d.error);
        setVersions(d.versions);
        setDocuments(d.documents);
        setMembers(d.members);
        if (d.limited)
            setNotice('Showing the most recent document records. Older sources remain in the full loan record.');
    }
    catch (e) {
        setNotice(e instanceof Error ? e.message : 'Document reviews unavailable');
    } }, [loanId]);
    useEffect(() => { void load(); const timer = setInterval(() => { if (document.visibilityState === 'visible')
        void load(); }, 30000); return () => clearInterval(timer); }, [load]);
    const open = async (id: string) => { try {
        const d: Detail = await request(`/api/operations/documents/${id}`);
        setDetail(d);
        setTasks((d.proposal?.conditions || []).map(c => ({ selected: false, title: c.text.slice(0, 240), route: c.route, owner_id: null, due_at: null, citation: c.source.page ? `${d.source.file_name}, page ${c.source.page}` : '' })));
        setNotice('');
    }
    catch (e) {
        setNotice(e instanceof Error ? e.message : 'Review unavailable');
    } };
    const extract = async (id: string) => { setBusy(true); try {
        const result = await request(`/api/operations/documents/${id}/extract`, { method: 'POST' });
        setNotice(result.message || 'Extraction queued. Your source and review task are saved.');
        await load();
    }
    catch (e) {
        setNotice(e instanceof Error ? e.message : 'Extraction unavailable');
    }
    finally {
        setBusy(false);
    } };
    const register = async (body: Record<string, unknown>) => { const v = await request('/api/operations/documents', { method: 'POST', body: JSON.stringify({ ...body, loan_id: loanId }) }); await load(); await open(v.id); setNotice('Source version and review task saved. Review manually or prepare an extraction draft when appropriate.'); };
    const editTask = (index: number, key: keyof ConditionDraft, value: string | boolean | null) => setTasks(t => t.map((x, i) => i === index ? { ...x, [key]: value } : x));
    return <div className="ops"><header className="ops-header"><div><p className="ops-eyebrow">SOURCE DOCUMENTS · REVIEW HISTORY</p><h1>Document review</h1><p>Keep each source version, review proposed changes and assign the resulting work.</p></div><a href={`/dashboard/loans/${loanId}`}>Back to loan →</a></header>
 <p className="ops-coverage">Extraction creates a review draft. Review every value and source citation. Recording this review does not change loan terms, grant underwriting approval, write to ARIVE or send messages.</p>
 {notice && <p role="status" className="ops-notice">{notice}</p>}
 <section className="ops-breakdown"><h2>Start a versioned review</h2><form onSubmit={async (e) => { e.preventDefault(); setBusy(true); try {
        const fd = new FormData(e.currentTarget);
        const file = fd.get('file');
        const kind = fd.get('kind');
        if (file instanceof File && file.size) {
            if (file.size > 15 * 1024 * 1024 || !file.name.toLowerCase().endsWith('.pdf'))
                throw Error('Use a PDF no larger than 15 MB');
            const client = createClient(), { data: { user } } = await client.auth.getUser();
            if (!user)
                throw Error('Sign in required');
            const name = file.name.replace(/[^a-zA-Z0-9._-]/g, '_'), path = `${user.id}/${loanId}/reviews/${crypto.randomUUID()}_${name}`;
            const { error } = await client.storage.from('documents').upload(path, file, { contentType: 'application/pdf' });
            if (error)
                throw Error('Upload did not complete');
            await register({ kind, file_path: path, file_name: file.name });
        }
        else {
            if (!fd.get('document_id'))
                throw Error('Choose an existing PDF or upload one');
            await register({ kind, document_id: fd.get('document_id') });
        }
    }
    catch (e) {
        setNotice(e instanceof Error ? e.message : 'Review could not be started');
    }
    finally {
        setBusy(false);
    } }}>
 <div className="ops-filters"><label>Document type<select name="kind"><option value="contract">Contract</option><option value="conditional_approval">Conditional approval</option></select></label><label>Existing source<select name="document_id" defaultValue=""><option value="">Select an existing PDF</option>{documents.filter(d => d.file_name.toLowerCase().endsWith('.pdf')).map(d => <option key={d.id} value={d.id}>{d.file_name}</option>)}</select></label><label>Or upload a new PDF<input name="file" type="file" accept="application/pdf,.pdf"/></label><button disabled={busy}>Save version and prepare review</button></div></form></section>
 <section className="ops-breakdown"><h2>Versions</h2>{versions.map(v => <button key={v.id} onClick={() => void open(v.id)}><span>{label(v.kind)} · version {v.version}</span><span>{label(v.status)} · {new Date(v.created_at).toLocaleDateString()} →</span></button>)}{!versions.length && <p>No document reviews yet. Existing uploaded documents remain available.</p>}</section>
 {detail && <section className="ops-breakdown"><div className="ops-header"><div><h2>{detail.source.file_name}</h2><p>{label(detail.kind)} · version {detail.version} · {label(detail.status)}</p></div><div><button onClick={() => void open(detail.id)}>Refresh review</button><button onClick={async () => { try {
            const r = await request(`/api/operations/documents/${detail.id}/source`);
            window.open(r.url, '_blank', 'noopener,noreferrer');
        }
        catch {
            setNotice('Source document unavailable');
        } }}>Open source PDF</button></div></div>
 {(detail.status === 'pending' || detail.status === 'failed') && <button disabled={busy} onClick={() => void extract(detail.id)}>Prepare extraction draft</button>}{detail.status === 'processing' && <p>Extraction is processing. The source and review task remain saved.</p>}{detail.last_error && <p>{detail.last_error}</p>}
 <h3>Proposed source changes · read only</h3>{detail.proposal?.fields.length ? <div className="ops-table-scroll"><table><thead><tr><th>Field</th><th>At upload</th><th>Current loan value</th><th>Extracted proposal</th><th>Source / confidence</th></tr></thead><tbody>{detail.proposal.fields.map(f => <tr key={f.field}><td>{label(f.field)}</td><td>{display(detail.baseline[f.field])}</td><td>{display(detail.current[f.field])}</td><td>{display(f.value)}</td><td>{f.source.page ? `Page ${f.source.page}` : 'Page not identified'} · {f.confidence === null ? 'Confidence unknown' : `${Math.round(f.confidence * 100)}% extractor confidence`}<p>{f.source.quote || 'Verify directly against the source PDF.'}</p></td></tr>)}</tbody></table></div> : <p>No field extraction recorded. A manual review can still be recorded after checking the source.</p>}
 {detail.proposal?.conditions.map((c, i) => <p key={i}><strong>Proposed condition {i + 1}:</strong> {c.text} · {c.source.page ? `page ${c.source.page}` : 'page unknown'} · {c.confidence === null ? 'confidence unknown' : `${Math.round(c.confidence * 100)}% extractor confidence`}</p>)}
 {!['reviewed', 'rejected'].includes(detail.status) && <form onSubmit={async (e) => { e.preventDefault(); setBusy(true); try {
                const fd = new FormData(e.currentTarget), decision = fd.get('decision');
                const result = await request(`/api/operations/documents/${detail.id}/review`, { method: 'POST', body: JSON.stringify({ decision, notes: fd.get('notes'), current_baseline_hash: detail.current_baseline_hash, conditions: decision === 'reviewed' ? tasks.filter(t => t.selected).map(({ selected, ...task }) => { void selected; return task; }) : [] }) });
                await load();
                await open(detail.id);
                setNotice(`Review recorded. ${result.task_ids.length} task(s) created with the selected ownership. Loan fields unchanged.`);
            }
            catch (e) {
                setNotice(e instanceof Error ? e.message : 'Review could not be saved');
            }
            finally {
                setBusy(false);
            } }}>
 <h3>Reviewed condition tasks</h3><p>Choose the useful tasks, verify their citations and assign the correct owner. Keep sensitive identity numbers and document contents out of task summaries.</p>{tasks.map((t, i) => <fieldset key={i} className="ops-filters"><label className="ops-checkbox"><input type="checkbox" checked={t.selected} onChange={e => editTask(i, 'selected', e.target.checked)}/> Create this task</label><label>Next action<input value={t.title} maxLength={240} onChange={e => editTask(i, 'title', e.target.value)}/></label><label>Source citation<input value={t.citation} placeholder="Document name, page and condition number" onChange={e => editTask(i, 'citation', e.target.value)}/></label><label>Route<select value={t.route} onChange={e => editTask(i, 'route', e.target.value)}>{CONDITION_ROUTES.map(r => <option key={r} value={r}>{label(r)}</option>)}</select></label><label>Owner<select value={t.owner_id || ''} onChange={e => editTask(i, 'owner_id', e.target.value || null)}><option value="">Unassigned</option>{members.map(m => <option key={m.id} value={m.id}>{m.full_name || m.email}</option>)}</select></label><label>Due, if evidenced<input type="datetime-local" onChange={e => editTask(i, 'due_at', e.target.value ? new Date(e.target.value).toISOString() : null)}/></label></fieldset>)}<button type="button" onClick={() => setTasks(t => [...t, { selected: true, title: '', citation: '', route: 'team', owner_id: null, due_at: null }])}>Add a reviewed condition</button>
 <label>Decision<select name="decision"><option value="reviewed">Reviewed; retain proposals and create selected tasks</option><option value="rejected">Rejected; create no condition tasks</option></select></label><label>Review notes and source evidence<textarea name="notes" required minLength={10} maxLength={5000}/></label><label className="ops-checkbox"><input type="checkbox" required/> I reviewed the source, current values and selected task instructions.</label><button disabled={busy}>Record review</button></form>}
 <h3>Review history</h3>{detail.history.map(h => <article className="ops-event" key={h.id}><strong>{label(h.decision)} · {new Date(h.created_at).toLocaleString()}</strong><p>{members.find(m => m.id === h.reviewer_id)?.full_name || 'Recorded team member'} · {h.notes.notes}</p><p>{h.task_ids.length} tasks linked to this reviewed version.</p></article>)}{!detail.history.length && <p>No human review recorded for this version.</p>}</section>}
 </div>;
}
