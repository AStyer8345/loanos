import { normalizeToStageKey, normalizeContactStage } from '@/lib/constants/loan-stages'

export type Member = { id: string; full_name: string | null; role: string; email?: string | null }
export type WorkTask = { id: string; title: string | null; text: string | null; description: string | null; status: string | null; is_complete: boolean | null; priority: string | null; due_at: string | null; snoozed_until: string | null; assigned_to: string | null; related_contact_id: string | null; related_loan_id: string | null; follow_up_reason: string | null; updated_at: string; created_at: string }
export type WorkContact = { id: string; first_name: string | null; last_name: string | null; stage: string | null; contact_type: string | null; lead_source: string | null; source_page: string | null; created_at: string; lead_tier: string | null }
export type WorkLoan = { id: string; contact_id: string | null; borrower_first_name: string | null; borrower_last_name: string | null; loan_name: string | null; status: string | null; loan_amount: number | null; commission_amount: number | null; closing_date: string | null; estimated_closing_date: string | null; funding_date: string | null; rate_lock_expiration: string | null; processor_email: string | null; loan_purpose: string | null; property_address: string | null }
export type WorkActivity = { contact_id: string | null; loan_id: string | null; type: string | null; action: string | null; occurred_at: string | null; created_at: string }
export type Category = 'Needs LO' | 'Needs Team' | 'Waiting on Borrower' | 'Waiting on Third Party' | 'Overdue' | 'Closing Risk' | 'Hot Lead' | 'Unassigned'
export type WorkItem = { id: string; taskId?: string; name: string; issue: string; why: string; nextAction: string; dueAt: string | null; lastActivity: string | null; stage: string | null; ownerId: string | null; owner: string; loNeeded: boolean; categories: Category[]; risk: 'high' | 'normal'; href: string; amount: number | null; revenue: number | null; source?: string | null; sourcePage?: string | null; receivedAt?: string; responseState?: string; purpose?: string | null }
export type CommandCenter = { asOf: string; viewerId: string; members: Member[]; loanOfficerName: string; tasks: WorkItem[]; leads: WorkItem[]; exceptions: WorkItem[]; money: { closed: number; expected: number; probable: number; atRisk: number; pipeline: number; missing: number }; coverage: { outboundCount: number } }

// Machine updates, imports and generic updated_at timestamps are not contact attempts.
const MEANINGFUL = new Set(['email_inbound', 'email_outbound', 'sms_inbound', 'sms_outbound', 'imessage.received', 'call_completed', 'call_attempted', 'meeting_completed'])
const OUTBOUND = new Set(['email_outbound', 'sms_outbound', 'call_completed', 'call_attempted'])
const ESCALATIONS = new Set(['escalation:relationship_risk', 'escalation:borrower_concern', 'escalation:loan_strategy', 'escalation:loan_structure', 'escalation:closing_risk', 'escalation:revenue_risk', 'escalation:sales_opportunity', 'escalation:team_request'])
const CLOSED = new Set(['funded', 'denied', 'withdrawn', 'cancelled', 'canceled', 'dead', 'lost', 'adverse'])
const IN_PROCESS = new Set(['setup', 'disclosed', 'processing', 'submitted', 'underwriting', 'approved', 'resubmit', 'clear_to_close'])
const valid = (s: string | null | undefined) => !!s && Number.isFinite(Date.parse(s))
const day = (s: string) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(s))
const loanDate = (s: string | null) => s && /^\d{4}-\d{2}-\d{2}$/.test(s) && valid(s) && new Date(s).toISOString().slice(0, 10) === s ? s : null
const latest = (rows: WorkActivity[]) => rows.map(r => r.occurred_at || r.created_at).filter(valid).sort().at(-1) ?? null

export function buildCommandCenter(input: { tasks: WorkTask[]; contacts: WorkContact[]; loans: WorkLoan[]; activities: WorkActivity[]; members: Member[]; viewerId: string; asOf: string }): CommandCenter {
  const now = Date.parse(input.asOf)
  const today = day(input.asOf)
  const month = today.slice(0, 7)
  const owners = input.members.filter(m => m.role === 'owner')
  const loId = owners.length === 1 ? owners[0].id : null
  const members = new Map(input.members.map(m => [m.id, m]))
  const contacts = new Map(input.contacts.map(c => [c.id, c]))
  const loans = new Map(input.loans.map(l => [l.id, l]))
  const openTasks = input.tasks.filter(t => !t.is_complete && ['open', 'in_progress'].includes(t.status ?? 'open') && (!valid(t.snoozed_until) || Date.parse(t.snoozed_until!) <= now))
  const activityFor = (contactId: string | null, loanId: string | null) => input.activities.filter(a => (contactId && a.contact_id === contactId) || (loanId && a.loan_id === loanId))
  const contactName = (id: string | null) => { const c = id ? contacts.get(id) : null; return c ? [c.first_name, c.last_name].filter(Boolean).join(' ') || 'Contact' : null }
  const loanName = (l: WorkLoan) => [l.borrower_first_name, l.borrower_last_name].filter(Boolean).join(' ') || l.loan_name || contactName(l.contact_id) || 'Loan'
  const assign = (id: string | null) => ({ ownerId: id && members.has(id) ? id : null, owner: id && members.has(id) ? members.get(id)!.full_name || 'Team member' : 'Unassigned' })
  const recordOwner = (contactId: string | null, loanId: string | null, processor?: string | null) => {
    const ids = [...new Set(openTasks.filter(t => (loanId && t.related_loan_id === loanId) || (contactId && t.related_contact_id === contactId)).map(t => t.assigned_to).filter((id): id is string => !!id && members.has(id)))]
    if (ids.length === 1) return ids[0]
    if (!ids.length && processor) { const matches = input.members.filter(m => m.email?.toLowerCase() === processor.toLowerCase()); if (matches.length === 1) return matches[0].id }
    return null
  }
  const tasks: WorkItem[] = openTasks.map(t => {
    const l = t.related_loan_id ? loans.get(t.related_loan_id) : undefined
    const c = t.related_contact_id ? contacts.get(t.related_contact_id) : undefined
    const ownership = assign(t.assigned_to)
    const escalated = ESCALATIONS.has(t.follow_up_reason ?? '')
    const loNeeded = escalated || (!!loId && ownership.ownerId === loId)
    const categories: Category[] = [loNeeded ? 'Needs LO' : ownership.ownerId ? 'Needs Team' : 'Unassigned']
    if (t.follow_up_reason === 'waiting:borrower') categories.push('Waiting on Borrower')
    if (t.follow_up_reason === 'waiting:third_party') categories.push('Waiting on Third Party')
    const overdue = valid(t.due_at) && Date.parse(t.due_at!) < now
    if (overdue) categories.push('Overdue')
    if (t.follow_up_reason === 'escalation:closing_risk') categories.push('Closing Risk')
    return { id: 'task:' + t.id, taskId: t.id, name: (l ? loanName(l) : contactName(t.related_contact_id)) || 'Internal task', issue: t.title || t.text || 'Follow up', why: t.description || (overdue ? 'The recorded next action is past due.' : 'Open task recorded in LoanOS.'), nextAction: t.title || t.text || 'Review task', dueAt: t.due_at, lastActivity: latest(activityFor(t.related_contact_id, t.related_loan_id).filter(a => MEANINGFUL.has(a.type || a.action || ''))), stage: l?.status || c?.stage || null, ...ownership, loNeeded, categories, risk: escalated || overdue ? 'high' : 'normal', href: l ? '/dashboard/loans/' + l.id : c ? '/dashboard/contacts/' + c.id : '/dashboard#attention', amount: l?.loan_amount ?? null, revenue: l?.commission_amount ?? null }
  })
  const leads: WorkItem[] = input.contacts.filter(c => (['new', 'attempted', 'connected'].includes((c.stage || '').toLowerCase()) || (!!c.stage && normalizeContactStage(c.stage) === 'Lead')) && (!c.contact_type || c.contact_type.toLowerCase() === 'borrower')).map<WorkItem>(c => {
    const activity = activityFor(c.id, null).filter(a => MEANINGFUL.has(a.type || a.action || ''))
    const attempted = activity.some(a => OUTBOUND.has(a.type || a.action || '') && (a.occurred_at || a.created_at) >= c.created_at)
    const ownership = assign(recordOwner(c.id, null))
    const next = tasks.filter(t => input.tasks.find(raw => raw.id === t.taskId)?.related_contact_id === c.id).sort((a,b) => (a.dueAt || '9999').localeCompare(b.dueAt || '9999'))[0]
    const old = valid(c.created_at) && now - Date.parse(c.created_at) > 60 * 60 * 1000
    const opportunity = input.loans.filter(l => l.contact_id === c.id && !CLOSED.has((l.status || '').toLowerCase()) && normalizeToStageKey(l.status) !== 'funded').sort((a,b) => (b.loan_amount ?? 0) - (a.loan_amount ?? 0))[0]
    const categories: Category[] = [ownership.ownerId === loId && loId ? 'Needs LO' : ownership.ownerId ? 'Needs Team' : 'Unassigned']
    if (['hot', 'a'].includes((c.lead_tier || '').toLowerCase())) categories.push('Hot Lead')
    // Missing outbound evidence prompts verification; it is never asserted to prove no contact.
    return { id: 'lead:' + c.id, name: contactName(c.id)!, issue: attempted ? 'Follow-up in progress' : 'Verify first response', why: attempted ? 'A contact attempt is recorded.' : old ? 'More than one hour old; first response needs verification.' : 'New lead with no contact attempt recorded yet.', nextAction: next?.nextAction || (attempted ? 'Record the next action' : 'Check communication history and make first contact'), dueAt: next?.dueAt || null, lastActivity: latest(activity), stage: c.stage, ...ownership, loNeeded: ownership.ownerId === loId && !!loId, categories, risk: !attempted && old ? 'high' : 'normal', href: '/dashboard/contacts/' + c.id, amount: opportunity?.loan_amount ?? null, revenue: opportunity?.commission_amount ?? null, purpose: opportunity?.loan_purpose ?? null, source: c.lead_source, sourcePage: c.source_page, receivedAt: c.created_at, responseState: attempted ? 'Attempt recorded' : 'First response unverified' }
  }).sort((a,b) => Number(b.risk === 'high') - Number(a.risk === 'high') || Number(/website|referr|realtor/i.test(b.source || '')) - Number(/website|referr|realtor/i.test(a.source || '')) || (b.receivedAt || '').localeCompare(a.receivedAt || ''))
  const exceptions: WorkItem[] = []
  const money = { closed: 0, expected: 0, probable: 0, atRisk: 0, pipeline: 0, missing: 0 }
  for (const l of input.loans) {
    const stage = normalizeToStageKey(l.status)
    const closing = loanDate(l.closing_date) || loanDate(l.estimated_closing_date)
    const funding = loanDate(l.funding_date) || loanDate(l.closing_date)
    if (stage === 'funded') { if (funding?.startsWith(month)) { money.closed += l.commission_amount ?? 0; if (l.commission_amount == null) money.missing++ } continue }
    if (CLOSED.has((l.status || '').toLowerCase())) continue
    const inProcess = IN_PROCESS.has(stage)
    const lock = loanDate(l.rate_lock_expiration)
    const reasons: string[] = []
    const soon = (s: string) => (Date.parse(s) - Date.parse(today)) / 86400000 <= 7
    if (inProcess && lock && soon(lock)) reasons.push(lock < today ? 'Rate lock date has passed' : 'Rate lock expires within 7 days')
    if (inProcess && closing && closing < today) reasons.push('Recorded closing date has passed')
    else if (inProcess && closing && soon(closing) && stage !== 'clear_to_close') reasons.push('Closing within 7 days; clear to close is not recorded')
    if (inProcess && !closing) reasons.push('Missing closing date')
    if (inProcess && !l.property_address) reasons.push('Missing property information')
    if (stage === 'approved' && !openTasks.some(t => t.related_loan_id === l.id)) reasons.push('Verify condition ownership; no open loan task recorded')
    const lastActivity = latest(activityFor(l.contact_id, l.id).filter(a => MEANINGFUL.has(a.type || a.action || '')))
    if (inProcess && valid(lastActivity) && now - Date.parse(lastActivity!) > 14 * 86400000) reasons.push('Last recorded communication is over 14 days old')
    const highRisk = reasons.some(r => r.includes('lock') || r.includes('Closing within') || r.includes('has passed'))
    if (inProcess) { money.pipeline += l.commission_amount ?? 0; if (l.commission_amount == null) money.missing++; if (closing?.startsWith(month)) { if (highRisk) money.atRisk += l.commission_amount ?? 0; else if (stage === 'clear_to_close') money.expected += l.commission_amount ?? 0; else money.probable += l.commission_amount ?? 0 } }
    if (!reasons.length) continue
    const ownership = assign(recordOwner(l.contact_id, l.id, l.processor_email))
    const categories: Category[] = [highRisk ? 'Needs LO' : ownership.ownerId ? 'Needs Team' : 'Unassigned']
    if (highRisk) categories.push('Closing Risk')
    exceptions.push({ id: 'loan:' + l.id, name: loanName(l), issue: reasons.join(' · '), why: highRisk ? 'A recorded deadline threatens closing or the lock.' : 'The team should verify this file and record its next action.', nextAction: highRisk ? 'Confirm the deadline and agree on a recovery plan' : 'Assign an owner and verify the next milestone', dueAt: closing, lastActivity, stage: l.status, ...ownership, loNeeded: highRisk, categories, risk: highRisk ? 'high' : 'normal', href: '/dashboard/loans/' + l.id, amount: l.loan_amount, revenue: l.commission_amount })
  }
  const sort = (a: WorkItem,b: WorkItem) => Number(b.risk === 'high') - Number(a.risk === 'high') || (a.dueAt || '9999').localeCompare(b.dueAt || '9999')
  return { asOf: input.asOf, viewerId: input.viewerId, members: input.members.map(({id,full_name,role}) => ({id,full_name,role})), loanOfficerName: owners.length === 1 ? owners[0].full_name?.split(' ')[0] || 'LO' : 'LO', tasks: tasks.sort(sort), leads, exceptions: exceptions.sort(sort), money, coverage: { outboundCount: input.activities.filter(a => OUTBOUND.has(a.type || a.action || '')).length } }
}
