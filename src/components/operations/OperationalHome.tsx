'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Snapshot, Row, Filters } from '@/lib/operations/types';
import { ALL_FILTERS } from '@/lib/operations/types';
import { buildRows, filterRows, rowTotals, cohortMetrics, periodEvents, previousRange, average, LABELS, evidenceDate, day, operationalMetrics, cohortGroups, fundedPeriodTotals } from '@/lib/operations/model';
import { ROUTING_REASONS } from '@/lib/command-center-routing';
import './operations.css';
const money = (value: number | null) => value === null ? 'Not recorded' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
const date = (value: string | null) => value ? new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value)) : 'Date unknown';
const nice = (value: string) => value.replaceAll('_', ' ').replaceAll('lead-contacted', 'Contacted').replaceAll('archive-not-qualified', 'Archived').replaceAll('in-process', 'In process');
const COLUMNS = { receivedAt: 'Date received', amount: 'Loan amount', gross: 'Recorded gross', product: 'Product', source: 'Source', owner: 'Owner', stage: 'Stage', nextAction: 'Next action', dueAt: 'Due', loNeeded: 'Adam needed', stageDays: 'Days in stage', lastCommunication: 'Last communication', issue: 'Issue / reason', email: 'Email', phone: 'Phone', priority: 'Priority', sourcePage: 'Originating page', referral: 'Referral partner' };
type Props = {
    request?: (path: string, init?: RequestInit) => Promise<Response>;
    recordBase?: string;
    title?: string;
};
const defaultRequest = (path: string, init?: RequestInit) => fetch(path, { ...init, cache: 'no-store' });
export default function OperationalHome({ request = defaultRequest, recordBase = '', title = 'Command Center' }: Props) {
    const [data, setData] = useState<Snapshot | null>(null), [error, setError] = useState(''), [notice, setNotice] = useState(''), [busy, setBusy] = useState(false), [view, setView] = useState('Today'), [mode, setMode] = useState('cohort'), [filters, setFilters] = useState<Filters>(ALL_FILTERS), [selected, setSelected] = useState<Row | null>(null), [drill, setDrill] = useState<{
        label: string;
        ids: string[];
    } | null>(null), [columns, setColumns] = useState<string[]>(['receivedAt', 'amount', 'gross', 'product', 'source', 'owner', 'stage', 'nextAction']), [columnsOpen, setColumnsOpen] = useState(false), [dimension, setDimension] = useState<'source' | 'sourcePage' | 'referral' | 'owner' | 'product'>('source');
    const [timeline, setTimeline] = useState<{
        id: string;
        type: string | null;
        action: string | null;
        occurred_at: string | null;
        subject: string | null;
        summary: string | null;
        source_url: string | null;
        content_available: boolean;
    }[]>([]), [timelineError, setTimelineError] = useState('');
    const load = useCallback(async () => {
        try {
            const r = await request('/api/operations');
            const d = await r.json();
            if (!r.ok)
                throw Error(d.error || 'Operational data is unavailable');
            setData(d);
            setError('');
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Operational data is unavailable');
        }
    }, [request]);
    useEffect(() => {
        queueMicrotask(() => void load());
        const timer = setInterval(() => {
            if (document.visibilityState === 'visible')
                void load();
        }, 60000);
        const refresh = () => {
            if (document.visibilityState === 'visible')
                void load();
        };
        document.addEventListener('visibilitychange', refresh);
        return () => { clearInterval(timer); document.removeEventListener('visibilitychange', refresh); };
    }, [load]);
    useEffect(() => {
        try {
            const saved = JSON.parse(localStorage.getItem('operations-columns-v1') || 'null');
            if (Array.isArray(saved) && saved.every(k => k in COLUMNS))
                queueMicrotask(() => setColumns(saved));
            else {
                const legacy = JSON.parse(localStorage.getItem('styer-lead-columns') || 'null');
                if (legacy) {
                    const mapping: Record<string, string> = { date: 'receivedAt', comp: 'gross', status: 'stage', action: 'nextAction' };
                    queueMicrotask(() => setColumns(Object.entries(legacy).filter(([, shown]) => shown).map(([key]) => mapping[key] || key).filter(key => key in COLUMNS)));
                }
            }
        }
        catch { /* Keep default columns if browser preferences are malformed. */ }
    }, []);
    useEffect(() => { if (selected) {
        const dialog = document.querySelector<HTMLDialogElement>('.ops-overlay');
        if (dialog && !dialog.open)
            dialog.showModal();
    } }, [selected]);
    useEffect(() => {
        let active = true;
        queueMicrotask(() => { if (active) {
            setTimeline([]);
            setTimelineError('');
        } });
        const id = selected?.contactId || selected?.loanIds[0];
        if (id) {
            void request(`/api/operations/timeline?kind=${selected?.contactId ? 'contact' : 'loan'}&id=${encodeURIComponent(id)}`).then(async (r) => {
                const d = await r.json();
                if (!r.ok)
                    throw Error(d.error || 'History is unavailable');
                if (active)
                    setTimeline(d.rows);
            }).catch(e => {
                if (active)
                    setTimelineError(e.message);
            });
        }
        return () => { active = false; };
    }, [selected, request]);
    const model = useMemo(() => data ? buildRows(data) : null, [data]), cohort = useMemo(() => data ? cohortMetrics(data, filters) : null, [data, filters]), events = useMemo(() => data ? periodEvents(data, filters) : [], [data, filters]), prior = useMemo(() => { const f = previousRange(filters); return data && f ? cohortMetrics(data, f) : null; }, [data, filters]);
    const candidates = useMemo(() => model ? (view === 'Today' ? model.todayRows : view === 'Pipeline' ? model.pipelineRows : view === 'Metrics' ? (mode === 'pipeline' ? model.pipelineRows : mode === 'events' ? [...model.inquiryRows, ...model.allLoanRows] : model.inquiryRows) : model.leadRows) : [], [model, view, mode]);
    const visible = useMemo(() => { const rows = filterRows(candidates, filters, { dates: !(view === 'Metrics' && mode === 'events') && view !== 'Pipeline' && !(view === 'Metrics' && mode === 'pipeline') }); return drill ? rows.filter(r => drill.ids.includes(r.id) || !!r.inquiryId && drill.ids.includes(r.inquiryId)) : view === 'Metrics' && mode === 'events' ? rows.filter(r => events.some(m => m.inquiry_id === r.inquiryId && r.inquiryId || m.loan_id === r.id)) : rows; }, [candidates, filters, drill, view, mode, events]);
    const totals = data ? rowTotals(data, visible) : null;
    const operating = data ? operationalMetrics(data, visible) : null;
    const groups = data ? cohortGroups(data, filters, dimension) : [];
    const fundedPeriod = data ? fundedPeriodTotals(data, filters) : null;
    const updateFilter = (key: keyof Filters, value: string | boolean) => { setFilters(f => ({ ...f, [key]: value })); setDrill(null); };
    const mutate = async (path: string, method: string, body: unknown) => {
        setBusy(true);
        setNotice('');
        try {
            const r = await request(path, { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
            const d = await r.json();
            if (!r.ok)
                throw Error(d.error || 'Change did not save');
            await load();
            setNotice('Saved.');
            setSelected(null);
            return true;
        }
        catch (e) {
            setNotice(e instanceof Error ? e.message : 'Change did not save');
            return false;
        }
        finally {
            setBusy(false);
        }
    };
    const preset = (value: string) => {
        const today = day(new Date().toISOString()), end = new Date(today + 'T12:00:00Z');
        let from = '';
        if (value === '30')
            from = new Date(end.getTime() - 29 * 86400000).toISOString().slice(0, 10);
        if (value === 'month')
            from = today.slice(0, 7) + '-01';
        if (value === '90')
            from = new Date(end.getTime() - 89 * 86400000).toISOString().slice(0, 10);
        setFilters(f => ({ ...f, from, to: from ? today : '' }));
        setDrill(null);
    };
    if (!data)
        return <div className="ops"><h1>{title}</h1><p role="status">{error || 'Loading your team’s live records…'}</p>{error && <button onClick={() => void load()}>Try again</button>}</div>;
    const selectedTask = selected?.taskId ? data.tasks.find(t => t.id === selected.taskId) : null;
    const tableCell = (r: Row, k: string) => k === 'priority' ? (r.preference?.priority_follow_up ? 'Priority' : '—') : k === 'amount' ? money(r.amount) : k === 'gross' ? money(r.gross) : k === 'receivedAt' ? date(r.receivedAt) : k === 'dueAt' ? date(r.dueAt) : k === 'lastCommunication' ? date(r.lastCommunication) : k === 'stageDays' ? (r.stageDays === null || r.stageDays === undefined ? 'Date unknown' : String(r.stageDays)) : k === 'loNeeded' ? (r.loNeeded ? (r.deadlineRisk ? 'Yes · deadline risk' : 'Yes · escalated') : 'No') : (nice(String(r[k as keyof Row] || '—')));
    const actionDrill = (label: string, ids: string[]) => setDrill({ label, ids });
    return <div className="ops">
  <header className="ops-header"><div><p className="ops-eyebrow">THE STYER TEAM · LOAN OPERATIONS</p><h1>{title}</h1><p>One place for the next action, the owner and the evidence.</p></div><div className="ops-sync"><span>Loaded {new Date(data.asOf).toLocaleTimeString('en-US', { timeZone: 'America/Chicago', hour: 'numeric', minute: '2-digit' })} CT</span><button onClick={() => void load()}>Refresh</button></div></header>
  {error && <p role="alert" className="ops-alert">{error} Displaying the last successful snapshot from {date(data.asOf)}; totals may be stale.</p>}{notice && <p role="status" className="ops-notice">{notice}</p>}
  <nav className="ops-tabs" aria-label="Operational views">{['Today', 'Leads', 'Pipeline', 'Metrics'].map(v => <button key={v} aria-current={view === v ? 'page' : undefined} onClick={() => { setView(v); setDrill(null); setFilters(f => ({ ...f, stage: 'all' })); }}>{v}</button>)}</nav>
  <section className="ops-filters" aria-label="Filter selected results"><label>Search<input type="search" value={filters.query} onChange={e => updateFilter('query', e.target.value)} placeholder="Borrower, source, notes…"/></label><label>Owner<select value={filters.owner} onChange={e => updateFilter('owner', e.target.value)}><option value="all">All owners</option><option value="unassigned">Unassigned</option>{data.members.map(m => <option key={m.id} value={m.id}>{m.full_name || m.email}</option>)}</select></label><label>Source<select value={filters.source} onChange={e => updateFilter('source', e.target.value)}><option value="all">All sources</option>{[...new Set(candidates.map(r => r.source))].sort().map(s => <option key={s}>{s}</option>)}</select></label><label>Stage<select value={filters.stage} onChange={e => updateFilter('stage', e.target.value)}><option value="all">All stages</option>{[...new Set(candidates.map(r => r.stage))].sort().map(s => <option key={s} value={s}>{nice(s)}</option>)}</select></label>
   <label>Attention<select value={filters.attention || 'all'} onChange={e => updateFilter('attention', e.target.value)}><option value="all">All work</option><option value="lo">Adam needed</option><option value="team">Routine team work</option><option value="waiting">Waiting for a response</option><option value="risk">Deadline risk</option></select></label>
   {view !== 'Pipeline' && !(view === 'Metrics' && mode === 'pipeline') && <><label>Period<select onChange={e => preset(e.target.value)} defaultValue="all"><option value="all">All evidenced dates</option><option value="30">Last 30 days</option><option value="month">This month</option><option value="90">Last 90 days</option></select></label><label>From<input type="date" value={filters.from} onChange={e => updateFilter('from', e.target.value)}/></label><label>Through<input type="date" value={filters.to} onChange={e => updateFilter('to', e.target.value)}/></label></>}
  </section>
  {view === 'Today' && <p className="ops-caption">Open work, saved priorities and exceptions across active loans. Waiting work stays with its task owner. “Adam needed” identifies explicit escalations or recorded deadline risk. Date filters use the record’s evidenced arrival/creation date; clear dates to see all active exceptions.</p>}
  {view === 'Leads' && <p className="ops-caption">Website inquiry evidence begins August 5, 2026. Saved leads without a verified arrival date remain visible under All evidenced dates. Working stages and notes are your saved edits.</p>}
  {view === 'Pipeline' && <p className="ops-caption">Current active loan records · filters apply to the current pipeline. Scheduled closing dates do not count as completed closings or fundings.</p>}
  {view === 'Metrics' && <><div className="ops-mode">{[['pipeline', 'Pipeline now'], ['events', 'Milestones in period'], ['cohort', 'Leads acquired in period']].map(([value, label]) => <button aria-pressed={mode === value} key={value} onClick={() => { setMode(value); setDrill(null); }}>{label}</button>)}</div>
   {mode === 'cohort' && cohort && <section className="ops-metrics"><p className="ops-caption">Acquisition cohort: {filters.from || 'earliest evidenced inquiry'} through {filters.to || 'today'} · later outcomes followed through {date(data.asOf)}. {cohort.people} matched people · {cohort.repeats} repeat opportunities · {cohort.held} held for identity review, excluded from conversion denominators.</p><div className="ops-cards">{cohort.ratios.map(r => <button className="ops-card" key={r.label} onClick={() => actionDrill(r.label, r.ids)}><span>{r.label}</span><strong>{r.rate === null ? '—' : (r.rate * 100).toFixed(1) + '%'}</strong><small>{r.numerator} / {r.denominator} observed · open records</small></button>)}</div><p className="ops-coverage">Coverage: {cohort.linked}/{cohort.leads.length} inquiries have reviewed loan links; {cohort.unlinked} have unknown loan attribution. {cohort.unresolved} have no recorded final outcome. {cohort.immature} arrived within 90 days; this describes cohort age, not an assumed close probability. Missing events mean “not evidenced,” not a confirmed failure.</p>
    <div className="ops-cards"><button className="ops-card" onClick={() => actionDrill('Recorded funded gross', cohort.funded)}><span>Attributable funded gross</span><strong>{money(cohort.revenue)}</strong><small>{cohort.revenueKnown}/{cohort.fundedLoanIds.length} funded loans with recorded commission</small></button><button className="ops-card" onClick={() => actionDrill('Revenue per acquired lead', cohort.leads)}><span>Historical revenue per lead</span><strong>{money(cohort.revenuePerLead)}</strong><small>Same cohort · {cohort.leads.length} legitimate inquiries</small></button><button className="ops-card" onClick={() => actionDrill('Application timing', cohort.applications)}><span>Average days to application</span><strong>{average(cohort.daysToApplication)?.toFixed(1) || 'Unknown'}</strong><small>{cohort.daysToApplication.length} dated pairs</small></button><button className="ops-card" onClick={() => actionDrill('Funding timing', cohort.funded)}><span>Average days to funding</span><strong>{average(cohort.daysToFunding)?.toFixed(1) || 'Unknown'}</strong><small>{cohort.daysToFunding.length} dated pairs</small></button></div>
    <p className="ops-caption">First recorded response: {average(cohort.responseHours)?.toFixed(1) || 'unknown'} hours · {cohort.responseHours.length} verified attempts after receipt. Automated acknowledgements are excluded. Operational application stages do not define legal disclosure triggers.</p>
    {prior && <p className="ops-caption">Previous equal period: {prior.leads.length} evidenced inquiries and {prior.funded.length} later funded opportunities, compared with {cohort.leads.length} and {cohort.funded.length} in the selected cohort. Source coverage may differ.</p>}
    <div className="ops-breakdown"><h2>Acquisition comparison · selected cohort</h2><label>Group by<select value={dimension} onChange={e => setDimension(e.target.value as typeof dimension)}>{[["source","Source"],["sourcePage","Originating page"],["referral","Referral partner"],["owner","Owner"],["product","Product"]].map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></label>{groups.length ? groups.map(g => <button key={g.label} onClick={() => actionDrill(g.label, g.ids)}><span>{g.label}</span><span>{g.leads} inquiries · {g.engaged} engaged · {g.applications} applications · {g.funded} funded · {money(g.gross)} recorded gross · {g.linked}/{g.leads} reviewed links →</span></button>) : <p>No evidenced inquiries in this selection.</p>}</div>
   </section>}
   {mode === 'events' && <section>{fundedPeriod && <div className="ops-cards"><button className="ops-card" onClick={() => actionDrill('Funding completed in period', fundedPeriod.ids)}><span>Funded volume · selected period</span><strong>{money(fundedPeriod.amount)}</strong><small>{fundedPeriod.amountKnown}/{fundedPeriod.count} loans with recorded amounts</small></button><button className="ops-card" onClick={() => actionDrill('Funded gross in period', fundedPeriod.ids)}><span>Recorded funded gross · selected period</span><strong>{money(fundedPeriod.gross)}</strong><small>{fundedPeriod.grossKnown}/{fundedPeriod.count} with ARIVE/manual gross; payment status separate</small></button></div>}<p className="ops-caption">First active milestone per loan or inquiry, using source event dates in Central time. Corrections retain their history. Contacts without dated evidence are not assigned an import date.</p><div className="ops-cards">{Object.entries(LABELS).map(([key, label]) => { const ms = events.filter(m => m.milestone === key); return <button className="ops-card" key={key} onClick={() => actionDrill(label, ms.map(m => m.inquiry_id || m.loan_id || ''))}><span>{label}</span><strong>{ms.length}</strong><small>Open supporting records</small></button>; })}</div></section>}
   {mode === 'pipeline' && <p className="ops-caption">Current active pipeline, independent of acquisition dates. Only recorded loan amounts and gross commission from ARIVE or a manual compensation record contribute to money totals.</p>}
   <p className="ops-coverage">Paid compensation requires a paid ledger entry. Net income, acquisition cost and weighted expected commission are unavailable without expense, spend and close-probability evidence. Compensation plan estimates are excluded from recorded gross.</p>
  </>}
  {operating && (view === 'Today' || view === 'Pipeline' || view === 'Metrics' && mode === 'pipeline') && <section><div className="ops-cards"><button className="ops-card" onClick={() => actionDrill('Overdue recorded follow-ups', operating.overdue.map(r => r.id))}><span>Overdue follow-ups · selected</span><strong>{operating.overdue.length}</strong><small>Recorded due dates; missing communication is not proof of no reply</small></button><button className="ops-card" onClick={() => actionDrill('Recorded deadline risk', operating.atRisk.map(r => r.id))}><span>Gross exposed to deadline risk</span><strong>{money(operating.riskTotals.gross)}</strong><small>{operating.riskTotals.grossKnown}/{operating.riskTotals.loans} loans with recorded gross; not an estimated loss</small></button><button className="ops-card" onClick={() => actionDrill('Evidenced stage age', operating.stageDated.map(r => r.id))}><span>Average days in current stage</span><strong>{operating.averageStageDays?.toFixed(1) ?? 'Unknown'}</strong><small>{operating.stageDated.length}/{visible.length} selected rows with exact-stage date evidence</small></button></div>{view === 'Today' && <details className="ops-breakdown"><summary>Work by owner · selected results</summary>{operating.owners.map(g => <button key={g.owner} onClick={() => actionDrill(g.owner, g.rows.map(r => r.id))}><span>{g.owner}</span><span>{g.rows.length} items · {g.lo} need a loan officer →</span></button>)}</details>}</section>}
  {totals && <section className="ops-totals" aria-label="Totals for selected results"><div><small>SELECTED RESULTS</small><strong>{totals.count}</strong><span>{totals.people} linked people · {totals.loans} distinct loans</span></div><div><small>KNOWN LOAN AMOUNT</small><strong>{money(totals.amount)}</strong><span>{totals.amountKnown}/{totals.loans} loans with amounts</span></div><div><small>RECORDED GROSS</small><strong>{money(totals.gross)}</strong><span>{totals.grossKnown}/{totals.loans} loans with recorded commission</span></div><div><small>AMOUNT NOT LINKED</small><strong>{totals.unknownOpportunityAmount}</strong><span>results without a reviewed loan association</span></div></section>}
  {view === 'Today' && <div className="ops-owner-summary">{[...new Set(visible.map(r => r.owner))].map(owner => <span key={owner}>{owner}: {visible.filter(r => r.owner === owner).length} · {visible.filter(r => r.owner === owner && r.loNeeded).length} escalated</span>)}</div>}
  <section className="ops-results"><div className="ops-results-head"><h2>{drill ? drill.label : view === 'Today' ? 'Your working queue' : view === 'Pipeline' ? 'Active loans' : 'Records behind the numbers'}</h2><div>{drill && <button onClick={() => setDrill(null)}>Clear drill-down</button>}<label className="ops-checkbox"><input type="checkbox" checked={!!filters.includeHidden} onChange={e => updateFilter('includeHidden', e.target.checked)}/> Show hidden</label><button onClick={() => setColumnsOpen(!columnsOpen)} aria-expanded={columnsOpen}>Columns</button></div></div>
   {columnsOpen && <div className="ops-columns">{Object.entries(COLUMNS).map(([key, label]) => <label key={key}><input type="checkbox" checked={columns.includes(key)} onChange={() => { const next = columns.includes(key) ? columns.filter(c => c !== key) : [...columns, key]; setColumns(next); localStorage.setItem('operations-columns-v1', JSON.stringify(next)); }}/>{label}</label>)}</div>}
   <div className="ops-table-wrap"><table><thead><tr><th scope="col">Borrower</th>{columns.map(k => <th scope="col" key={k}>{COLUMNS[k as keyof typeof COLUMNS]}</th>)}</tr></thead><tbody>{visible.map(r => <tr key={r.kind + r.id}><th scope="row"><button className="ops-record" onClick={() => setSelected(r)}>{r.name}<small>{r.review ? 'Identity review' : r.waiting ? `Waiting: ${nice(r.waiting)}` : r.loNeeded ? 'Loan officer decision' : r.kind === 'saved' ? 'Saved lead' : r.kind === 'inquiry' ? 'Distinct inquiry' : r.kind === 'task' ? 'Open task' : 'Loan record'}</small></button></th>{columns.map(k => <td key={k} className={k === 'nextAction' ? 'ops-action-cell' : undefined}>{tableCell(r, k)}</td>)}</tr>)}</tbody></table>{!visible.length && <p className="ops-empty">No records match this selection.</p>}</div>
  </section>
  {view === 'Today' && model && <details className="ops-breakdown"><summary>Other saved tasks · {filterRows(model.generalRows, filters).length} matching unlinked records</summary><p className="ops-caption">Existing general, marketing and development tasks remain here. Link work to a borrower or loan for inclusion in the operational queue.</p>{filterRows(model.generalRows, filters).map(r => <button key={r.id} onClick={() => setSelected(r)}><span>{r.nextAction}</span><span>{r.owner} · {date(r.dueAt)} →</span></button>)}</details>}
  <details className="ops-health"><summary>Source status and evidence coverage</summary><p>Loaded from your organization’s shared LoanOS records. A page refresh is not proof that a source has synced.</p>{data.health.map(h => <div key={h.source}><strong>{nice(h.source)} · {h.status}</strong><span>Last successful sync: {h.last_success_at ? new Date(h.last_success_at).toLocaleString('en-US', { timeZone: 'America/Chicago' }) : 'Not verified'} CT</span><p>{h.detail}</p></div>)}<p>{data.inquiries.filter(i => !i.is_test && i.legitimacy === 'review').length} inquiries await identity review. {data.preferences.filter(p => p.match_state === 'review').length} saved Lead Desk edits await identity links. {data.loans.filter(l => /closed|funded|commission_paid/i.test(l.status || '') && !data.milestones.some(m => m.loan_id === l.id && m.milestone === 'funded' && !m.voided_at)).length} completed-status loan records lack a verified funding date.</p><p>Only existing authenticated team members can receive assignments. Add a verified colleague through LoanOS team settings before handing over ownership.</p></details>
  {selected && <dialog className="ops-overlay" aria-label={selected.name} onCancel={() => setSelected(null)}><button className="ops-backdrop" aria-label="Close record" onClick={() => setSelected(null)}/><aside className="ops-detail"><button className="ops-close" onClick={() => setSelected(null)} aria-label="Close record">×</button><p className="ops-eyebrow">{nice(selected.kind)} · {nice(selected.stage)}</p><h2>{selected.name}</h2><p>{selected.email || 'Email not recorded'}<br />{selected.phone || 'Phone not recorded'}</p><p>{selected.issue}</p><div className="ops-detail-grid"><span>Owner<strong>{selected.owner}</strong></span><span>Adam needed<strong>{selected.loNeeded ? (selected.deadlineRisk ? 'Yes · recorded deadline risk' : 'Yes · explicitly escalated') : 'No'}</strong></span><span>Received<strong>{date(selected.receivedAt)}</strong></span><span>Current stage age<strong>{selected.stageDays === null || selected.stageDays === undefined ? "Date unknown" : `${selected.stageDays} days`}</strong></span><span>Last logged communication<strong>{date(selected.lastCommunication)}</strong></span><span>Loan amount<strong>{money(selected.amount)}</strong></span><span>Recorded gross<strong>{money(selected.gross)}</strong></span></div>
   <section><h3>Source and purpose</h3>{selected.inquiryId && <>{data.inquiries.filter(i => i.id === selected.inquiryId || i.parent_inquiry_id === selected.inquiryId).map(i => i.selfReportedSource ? <p key={i.id}>Borrower-reported source: {i.selfReportedSource} · recorded {date(i.received_at)}. Tracked first touch remains separate.</p> : null)}</>}<p>{selected.source} {selected.referral && `· Referred by ${selected.referral}`}</p>{selected.sourcePage && <p className="ops-wrap">{selected.sourcePage}</p>}<p>{selected.purpose || 'Purpose not recorded'}</p><p>{selected.product}</p></section>
   {selected.kind !== 'task' && (selected.inquiryId || selected.loanIds.length || selected.contactId) && <form onSubmit={e => { e.preventDefault(); const fd = new FormData(e.currentTarget); void mutate('/api/operations/owner', 'PATCH', { kind: selected.kind === 'loan' ? 'loan' : selected.inquiryId ? 'inquiry' : 'contact', id: selected.kind === 'loan' ? selected.id : selected.inquiryId || selected.contactId, owner: fd.get('owner') }); }}><h3>Record owner</h3><select name="owner" defaultValue={selected.ownerId || ''}><option value="">Unassigned</option>{data.members.map(m => <option key={m.id} value={m.id}>{m.full_name || m.email}</option>)}</select><button disabled={busy}>Save owner</button></form>}
   <form key={selected.taskId || selected.id} onSubmit={e => { e.preventDefault(); const fd = new FormData(e.currentTarget), due = String(fd.get('due') || ''); const body = { title: fd.get('title'), description: fd.get('description'), assigned_to: fd.get('assigned_to') || null, follow_up_reason: fd.get('reason') || null, due_at: due ? new Date(due).toISOString() : null, status: fd.get('status'), ...(!selectedTask ? { inquiry_id: selected.inquiryId, related_contact_id: selected.contactId, related_loan_id: selected.kind === 'loan' ? selected.id : null } : {}) }; void mutate(selectedTask ? `/api/operations/tasks/${selectedTask.id}` : '/api/operations/tasks', selectedTask ? 'PATCH' : 'POST', body); }}><h3>{selectedTask ? 'Next action and handoff' : 'Add an owned next action'}</h3><label>Next action<input name="title" required maxLength={240} defaultValue={selectedTask?.title || selectedTask?.text || ''}/></label><label>Reason / details<textarea name="description" maxLength={5000} defaultValue={selectedTask?.description || ''}/></label><label>Task owner<select name="assigned_to" defaultValue={selectedTask?.assigned_to || selected.ownerId || ''}><option value="">Unassigned</option>{data.members.map(m => <option key={m.id} value={m.id}>{m.full_name || m.email}</option>)}</select></label><label>Due (your local time)<input name="due" type="datetime-local" defaultValue={selectedTask?.due_at ? new Date(Date.parse(selectedTask.due_at) - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}/></label><label>Routing<select name="reason" defaultValue={selectedTask?.follow_up_reason || ''}><option value="">Routine team work</option>{ROUTING_REASONS.map(r => <option key={r} value={r}>{nice(r.replace(':', ': '))}</option>)}</select></label><label>Status<select name="status" defaultValue={selectedTask?.status || 'open'}>{['open', 'in_progress', 'completed', 'dismissed'].map(s => <option key={s} value={s}>{nice(s)}</option>)}</select></label><button disabled={busy}>Save next action</button></form>
   {(selected.preference || selected.contactId) && <form onSubmit={e => { e.preventDefault(); const fd = new FormData(e.currentTarget); void mutate(`/api/operations/preferences/${selected.preference?.id || selected.contactId}${selected.preference ? '' : '?contact=true'}`, 'PATCH', { notes: fd.get('notes'), status: fd.get('working_status'), priority_follow_up: fd.get('priority') === 'on', hidden: fd.get('hidden') === 'on' }); }}><h3>Saved Lead Desk notes</h3><label>Working stage<input name="working_status" maxLength={100} defaultValue={selected.preference?.status || selected.stage}/></label><label>Your notes<textarea name="notes" maxLength={10000} defaultValue={selected.preference?.notes || ''}/></label><label className="ops-checkbox"><input type="checkbox" name="priority" defaultChecked={selected.preference?.priority_follow_up}/> Keep in priority follow-ups</label><label className="ops-checkbox"><input type="checkbox" name="hidden" defaultChecked={selected.hidden}/> Hide from normal lead list</label>{selected.preference?.amount_note && <p>Saved amount note: {selected.preference.amount_note} · excluded from financial totals.</p>}{selected.preference?.product_note && <p>Saved product note: {selected.preference.product_note}</p>}<button disabled={busy}>Save notes and flags</button></form>}
   {selected.inquiryId && !selected.review && selected.contactId && <form onSubmit={e => { e.preventDefault(); const fd = new FormData(e.currentTarget); void mutate('/api/operations/links', 'POST', { inquiry_id: selected.inquiryId, loan_id: fd.get('loan'), evidence: fd.get('evidence') }); }}><h3>Reviewed loan attribution</h3><p>Link only a loan that belongs to this specific inquiry. Repeat inquiries are separate opportunities.</p><select name="loan" required defaultValue=""><option value="" disabled>Select a loan for this person</option>{data.loans.filter(l => l.contact_id === selected.contactId && !data.links.some(x => x.loan_id === l.id)).map(l => <option key={l.id} value={l.id}>{l.loan_number || l.arive_loan_id || l.id.slice(0, 8)} · {l.status} · {money(l.loan_amount)}</option>)}</select><label>Evidence for this relationship<textarea name="evidence" required minLength={10} maxLength={2000}/></label><button disabled={busy}>Save reviewed link</button></form>}
   <section><h3>Communication history and source events</h3>{timelineError && <p role="alert">{timelineError}</p>}{timeline.map(a => <article className="ops-event" key={a.id}><small>{date(a.occurred_at)} · {nice(a.type || a.action || 'Activity')}</small>{a.subject && <strong>{a.subject}</strong>}<p>{a.summary || nice(a.action || 'Source event')}{!a.content_available ? ' · source text unavailable' : ''}</p>{a.source_url && <a href={a.source_url} target="_blank" rel="noreferrer">Open source message</a>}</article>)}{!timeline.length && !timelineError && <p>No linked message details loaded. Full record history remains available below.</p>}</section>
   <section><h3>Milestone evidence</h3>{data.milestones.filter(m => selected.inquiryId && m.inquiry_id === selected.inquiryId || m.loan_id && selected.loanIds.includes(m.loan_id)).sort((a, b) => b.occurred_at.localeCompare(a.occurred_at)).map(m => <article className="ops-event" key={m.id}><strong>{LABELS[m.milestone] || m.milestone}{m.voided_at ? ' · corrected' : ''}</strong><p>{evidenceDate(m)} · {m.source}</p>{m.outcome_reason && <p>{m.outcome_reason}</p>}{m.source_url && /^https:\/\//.test(m.source_url) && <a href={m.source_url} target="_blank" rel="noreferrer">Open source evidence</a>}</article>)}</section>
   {selected.inquiryId && <section><h3>Notification delivery</h3>{data.delivery.filter(d => d.inquiry_id === selected.inquiryId).map(d => <p key={d.id}>{nice(d.kind)} · {nice(d.status)} · {d.attempts} attempt(s){d.delivered_at ? ` · receipt verified ${date(d.delivered_at)}` : ''}</p>)}<p>Provider acceptance and actual receipt are separate states. Historical imports do not replay old emails.</p></section>}
   <footer>{selected.contactId && <a href={`${recordBase}/dashboard/contacts/${selected.contactId}`} target="_blank" rel="noreferrer">Open full contact →</a>}{selected.loanIds.map(id => <a key={id} href={`${recordBase}/dashboard/loans/${id}`} target="_blank" rel="noreferrer">Open full loan →</a>)}</footer>
  </aside></dialog>}
 </div>;
}
