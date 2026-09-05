import type { Snapshot, Filters, Row, Task, Loan, Milestone } from './types';
export const LABELS: Record<string, string> = { inquiry_received: 'New inquiries', contact_attempt: 'Contact attempts', engaged: 'Two-way engagement', application_started: 'Applications started', application_submitted: 'Applications submitted', preapproval_issued: 'Preapproval issued', conditional_approval: 'Conditional approval', lender_approved: 'Lender approval', clear_to_close: 'Clear to close', closing_completed: 'Closing completed', funded: 'Funding completed', lost: 'Lost', withdrawn: 'Withdrawn', denied: 'Denied', inactive: 'Inactive' };
const dayFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit' });
export const day = (date: string) => dayFormatter.format(new Date(date));
export const inRange = (date: string | null, filter: Pick<Filters, 'from' | 'to'>) => !filter.from && !filter.to ? true : !!date && (!filter.from || day(date) >= filter.from) && (!filter.to || day(date) <= filter.to);
export const complete = (t: Task) => t.is_complete || ['completed', 'dismissed'].includes(t.status || '');
export const activeLoan = (l: Loan) => !/(^closed$|funded|commission_paid|cancel|dead|denied|withdrawn|^lost$|adverse)/i.test(l.status || '');
export const recordedGross = (s: Snapshot, loanId: string) => { const c = s.compensation.find(x => x.loan_id === loanId); return c && ['arive', 'manual'].includes(c.gross_source) && c.gross_comp !== null ? Number(c.gross_comp) : null; };
const totalKnown = (values: (number | null)[]) => values.some(x => x !== null) ? values.reduce<number>((sum, x) => sum + (x ?? 0), 0) : null;
export const meaningful = (a: Snapshot['activity'][number]) => !!a.occurred_at && (['email.received', 'communication.logged', 'sms.received', 'sms.sent', 'teams.message'].includes(a.action || '') || ['email_inbound', 'email_outbound', 'sms_inbound', 'sms_outbound'].includes(a.type || '')) && !['web_lead_created', 'inquiry_captured'].includes(a.action || '');
export function buildRows(s: Snapshot) {
    const contacts = new Map(s.contacts.map(c => [c.id, c])), loans = new Map(s.loans.map(l => [l.id, l])), members = new Map(s.members.map(m => [m.id, m.full_name || m.email || 'Team member'])), tasks = new Map(s.tasks.map(t => [t.id, t]));
    const preferences = new Map(s.preferences.filter(p => p.contact_id).map(p => [p.contact_id!, p]));
    const recent = new Map<string, string>();
    for (const a of s.activity.filter(meaningful)) {
        for (const key of [a.contact_id, a.loan_id])
            if (key && a.occurred_at && (!recent.has(key) || recent.get(key)! < a.occurred_at))
                recent.set(key, a.occurred_at);
    }
    const base = (id: string, cid: string | null, loanIds: string[], task: Task | undefined, ownerId: string | null): Row => {
        const c = cid ? contacts.get(cid) : undefined, p = cid ? preferences.get(cid) || null : null, ls = loanIds.map(id => loans.get(id)).filter((l): l is Loan => !!l), last = [cid ? recent.get(cid) : null, ...loanIds.map(id => recent.get(id))].filter((x): x is string => !!x).sort().at(-1) || null;
        return { id, kind: 'saved', name: [c?.first_name, c?.last_name].filter(Boolean).join(' ') || 'Identity needs review', contactId: cid, loanIds, inquiryId: null, taskId: task?.id || null, ownerId, owner: ownerId ? members.get(ownerId) || 'Unavailable team member' : 'Unassigned', stage: p?.status || ls[0]?.status || c?.stage || 'Unknown', source: c?.lead_source || 'Unknown', sourcePage: c?.source_page || null, referral: null, receivedAt: null, amount: totalKnown(ls.map(l => l.loan_amount === null ? null : Number(l.loan_amount))), gross: totalKnown(ls.map(l => recordedGross(s, l.id))), product: ls.map(l => l.loan_program || l.loan_type).filter(Boolean).join(', ') || 'Not recorded', purpose: ls[0]?.loan_purpose || '', nextAction: task && !complete(task) ? task.title || task.text || 'Review task' : 'No open next action recorded', issue: task && !complete(task) ? task.description || '' : '', dueAt: task?.due_at || null, lastCommunication: last, loNeeded: !complete(task || {} as Task) && !!task?.follow_up_reason?.startsWith('escalation:'), waiting: task?.follow_up_reason?.startsWith('waiting:') ? task.follow_up_reason.slice(8) : null, email: c?.email || null, phone: c?.phone || null, hidden: p?.hidden || false, preference: p, review: false };
    };
    const inquiryRows = s.inquiries.filter(i => !i.is_test && !['continuation', 'spam'].includes(i.legitimacy)).map(i => {
        const ids = s.links.filter(l => l.inquiry_id === i.id).map(l => l.loan_id), task = i.task_id ? tasks.get(i.task_id) : s.tasks.find(t => t.source === 'inquiry' && t.source_key === 'inquiry:' + i.id);
        const r = base(i.id, i.contact_id, ids, task, i.owner_id);
        return { ...r, kind: 'inquiry' as const, inquiryId: i.id, name: r.contactId ? r.name : i.displayName || r.name, email: r.email || i.email || null, phone: r.phone || i.phone || null, receivedAt: i.received_at, source: i.source, sourcePage: i.first_touch?.first_touch_page || i.source_page, referral: i.referral_partner, purpose: i.purpose || r.purpose, review: i.legitimacy === 'review', issue: i.review_reason || r.issue };
    });
    const allLoanRows = s.loans.map(l => {
        const task = s.tasks.filter(t => t.related_loan_id === l.id && !complete(t)).sort((a, b) => (a.due_at || 'z').localeCompare(b.due_at || 'z'))[0];
        const r = base(l.id, l.contact_id, [l.id], task, l.operational_owner_id);
        const link = s.links.find(x => x.loan_id === l.id), inquiry = link ? s.inquiries.find(i => i.id === link.inquiry_id) : null;
        const m = s.milestones.filter(m => m.loan_id === l.id && !m.voided_at).sort((a, b) => a.occurred_at.localeCompare(b.occurred_at));
        return { ...r, kind: 'loan' as const, stage: l.status || 'Unknown', name: l.loan_name || [l.borrower_first_name, l.borrower_last_name].filter(Boolean).join(' ') || r.name, source: inquiry?.source || r.source, sourcePage: inquiry?.source_page || r.sourcePage, referral: inquiry?.referral_partner || null, receivedAt: m[0]?.occurred_at || null };
    });
    const seen = new Set(inquiryRows.map(r => r.contactId).filter(Boolean));
    const savedRows = s.preferences.filter(p => !p.contact_id || !seen.has(p.contact_id)).map(p => { const c = p.contact_id ? contacts.get(p.contact_id) : undefined; return { ...base(p.id, p.contact_id, [], undefined, c?.operational_owner_id || null), kind: 'saved' as const, name: c ? [c.first_name, c.last_name].filter(Boolean).join(' ') : p.provenance?.display_name || p.legacy_key || 'Saved lead', stage: p.status || c?.stage || 'Unknown', preference: p, hidden: p.hidden, review: p.match_state === 'review', issue: p.match_state === 'review' ? 'Saved edits retained; identity link requires review' : '', email: c?.email || p.provenance?.email || null }; });
    const taskRows = s.tasks.filter(t => !complete(t) && (!t.snoozed_until || t.snoozed_until <= s.asOf) && !s.inquiries.some(i => i.is_test && i.task_id === t.id)).map(t => {
        const i = s.inquiries.find(i => (i.task_id === t.id || t.source === 'inquiry' && t.source_key === 'inquiry:' + i.id) && !i.is_test), r = base(t.id, t.related_contact_id, t.related_loan_id ? [t.related_loan_id] : [], t, t.assigned_to);
        return { ...r, kind: 'task' as const, inquiryId: i?.id || null, source: i?.source || r.source, sourcePage: i?.source_page || r.sourcePage, referral: i?.referral_partner || null, receivedAt: i?.received_at || t.created_at, name: r.name === 'Identity needs review' ? (i?.displayName || t.title || 'Operational task') : r.name };
    });
    // No mass follow-up creation from historical contacts. Only explicit tasks or saved priorities appear here.
    const todayRows = [...taskRows, ...[...inquiryRows, ...savedRows].filter(r => r.preference?.priority_follow_up && !r.hidden && !taskRows.some(t => t.contactId && t.contactId === r.contactId))];
    return { inquiryRows, pipelineRows: allLoanRows.filter(r => activeLoan(loans.get(r.id)!)), allLoanRows, savedRows, leadRows: [...inquiryRows, ...savedRows], todayRows };
}
export function filterRows(rows: Row[], f: Filters, { dates = true }: {
    dates?: boolean;
} = {}) { const q = f.query.trim().toLowerCase(); return rows.filter(r => (f.includeHidden || !r.hidden) && (f.owner === 'all' || (f.owner === 'unassigned' ? !r.ownerId : r.ownerId === f.owner)) && (f.source === 'all' || r.source === f.source) && (f.stage === 'all' || r.stage === f.stage) && (!q || [r.name, r.email, r.phone, r.source, r.sourcePage, r.referral, r.product, r.stage, r.nextAction, r.issue, r.preference?.notes].join(' ').toLowerCase().includes(q)) && (!dates || inRange(r.receivedAt, f))); }
export function rowTotals(s: Snapshot, rows: Row[]) { const ids = [...new Set(rows.flatMap(r => r.loanIds))], amounts = ids.map(id => s.loans.find(l => l.id === id)?.loan_amount ?? null), gross = ids.map(id => recordedGross(s, id)); return { count: rows.length, people: new Set(rows.map(r => r.contactId).filter(Boolean)).size, loans: ids.length, amount: totalKnown(amounts.map(x => x === null ? null : Number(x))), amountKnown: amounts.filter(x => x !== null).length, gross: totalKnown(gross), grossKnown: gross.filter(x => x !== null).length, unknownOpportunityAmount: rows.filter(r => !r.loanIds.length).length }; }
export function milestonesFor(s: Snapshot, inquiryId: string) {
    const i = s.inquiries.find(i => i.id === inquiryId);
    if (!i)
        return [];
    const ids = new Set(s.links.filter(l => l.inquiry_id === inquiryId).map(l => l.loan_id));
    return s.milestones.filter(m => !m.voided_at && (m.inquiry_id === inquiryId || !!m.loan_id && ids.has(m.loan_id)) && m.occurred_at >= i.received_at);
}
export function cohortMetrics(s: Snapshot, filters: Filters) {
    const ids = new Set(filterRows(buildRows(s).inquiryRows, filters).map(r => r.inquiryId)), leads = s.inquiries.filter(i => ids.has(i.id) && i.legitimacy === 'inquiry' && !i.is_test), byId = new Map(leads.map(i => [i.id, milestonesFor(s, i.id)]));
    const stages = (kind: string) => leads.filter(i => byId.get(i.id)!.some(m => m.milestone === kind)).map(i => i.id);
    const engaged = stages('engaged'), applications = stages('application_started'), submitted = stages('application_submitted'), preapproved = stages('preapproval_issued'), funded = stages('funded'), leadIds = leads.map(i => i.id);
    const ratios = [['Lead → engaged', engaged, leadIds], ['Lead → application', applications, leadIds], ['Application → preapproval', preapproved.filter(id => applications.includes(id)), applications], ['Application → funded', funded.filter(id => applications.includes(id)), applications], ['Lead → funded', funded, leadIds]] as const;
    const fundedLoanIds = [...new Set(leads.flatMap(i => byId.get(i.id)!.filter(m => m.milestone === 'funded' && m.loan_id).map(m => m.loan_id!)))], revenue = fundedLoanIds.map(id => recordedGross(s, id)), knownRevenue = revenue.filter((x): x is number => x !== null);
    const linked = leads.filter(i => s.links.some(l => l.inquiry_id === i.id)).length, explicitOutcome = leads.filter(i => byId.get(i.id)!.some(m => ['funded', 'lost', 'withdrawn', 'denied', 'inactive'].includes(m.milestone))).length;
    const durations = (kind: string) => leads.flatMap(i => { const m = byId.get(i.id)!.filter(m => m.milestone === kind).sort((a, b) => a.occurred_at.localeCompare(b.occurred_at))[0]; return m ? [(Date.parse(m.occurred_at) - Date.parse(i.received_at)) / 86400000] : []; });
    return { leads: leadIds, people: new Set(leads.map(i => i.contact_id).filter(Boolean)).size, repeats: leads.length - new Set(leads.map(i => i.contact_id).filter(Boolean)).size, held: s.inquiries.filter(i => ids.has(i.id) && i.legitimacy === 'review').length, engaged, applications, submitted, preapproved, funded, ratios: ratios.map(([label, n, d]) => ({ label, numerator: n.length, denominator: d.length, ids: [...n], denominatorIds: [...d], rate: d.length ? n.length / d.length : null })), linked, unlinked: leads.length - linked, unresolved: leads.length - explicitOutcome, immature: leads.filter(i => Date.parse(s.asOf) - Date.parse(i.received_at) < 90 * 86400000).length, fundedLoanIds, revenue: totalKnown(revenue), revenueKnown: knownRevenue.length, revenuePerLead: leads.length && knownRevenue.length === fundedLoanIds.length && fundedLoanIds.length > 0 ? knownRevenue.reduce((a, b) => a + b, 0) / leads.length : null, daysToApplication: durations('application_started'), daysToFunding: durations('funded'), responseHours: durations('contact_attempt').map(x => x * 24), sourceGroups: [...new Set(leads.map(i => i.source))].map(source => { const group = leads.filter(i => i.source === source); return { source, leads: group.length, funded: group.filter(i => funded.includes(i.id)).length, ids: group.map(i => i.id) }; }) };
}
export function periodEvents(s: Snapshot, f: Filters) {
    const rows = buildRows(s), inquiries = new Map(rows.inquiryRows.map(r => [r.inquiryId, r]));
    const loanRows = new Map(rows.allLoanRows.map(r => [r.id, r]));
    const first = new Map<string, Milestone>();
    for (const m of s.milestones.filter(m => !m.voided_at).sort((a, b) => a.occurred_at.localeCompare(b.occurred_at))) {
        const k = [m.inquiry_id || m.loan_id, m.milestone].join(':');
        if (!first.has(k))
            first.set(k, m);
    }
    return [...first.values()].filter(m => {
        if (m.voided_at || !inRange(m.occurred_at, f))
            return false;
        const i = m.inquiry_id ? s.inquiries.find(i => i.id === m.inquiry_id) : null;
        if (i && (i.is_test || i.legitimacy !== 'inquiry'))
            return false;
        const r = m.inquiry_id ? inquiries.get(m.inquiry_id) : m.loan_id ? loanRows.get(m.loan_id) : null;
        if (!r || !filterRows([r], f, { dates: false }).length)
            return false;
        return true;
    }).sort((a, b) => b.occurred_at.localeCompare(a.occurred_at));
}
export const average = (values: number[]) => values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
export function previousRange(f: Filters) {
    if (!f.from || !f.to)
        return null;
    const start = Date.parse(f.from + 'T12:00:00Z'), end = Date.parse(f.to + 'T12:00:00Z'), span = end - start + 86400000;
    return { ...f, from: new Date(start - span).toISOString().slice(0, 10), to: new Date(start - 86400000).toISOString().slice(0, 10) };
}
export function evidenceDate(m: Milestone) { return `${day(m.occurred_at)}${m.evidence.date_precision === 'day' ? ' · date only' : ''}`; }
