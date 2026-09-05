import { describe, expect, it } from 'vitest'
import { buildCommandCenter, type WorkTask, type WorkLoan, type WorkContact, type WorkActivity } from './command-center'
import { collectPages } from './command-center-pages'
import { parseRouting } from './command-center-routing'

const asOf = '2026-09-05T02:00:00Z'
const members = [{ id: 'lo', full_name: 'Adam Styer', role: 'owner' }, { id: 'team', full_name: 'Processor', role: 'member' }]
const task = (p: Partial<WorkTask> = {}): WorkTask => ({ id: 't', title: 'Collect document', text: null, description: null, status: 'open', is_complete: false, priority: 'urgent', due_at: null, snoozed_until: null, assigned_to: 'team', related_contact_id: null, related_loan_id: null, follow_up_reason: null, updated_at: asOf, created_at: asOf, ...p })
const loan = (p: Partial<WorkLoan> = {}): WorkLoan => ({ id: 'l', contact_id: null, borrower_first_name: 'Fixture', borrower_last_name: 'Borrower', loan_name: null, status: 'Processing', loan_amount: 300000, commission_amount: 5000, closing_date: '2026-09-28', estimated_closing_date: null, funding_date: null, rate_lock_expiration: '2026-10-20', processor_email: null, property_address: 'Fixture property', loan_purpose: 'Purchase', ...p })
const contact = (p: Partial<WorkContact> = {}): WorkContact => ({ id: 'c', first_name: 'Fixture', last_name: 'Lead', stage: 'Lead', contact_type: 'borrower', lead_source: 'Website', source_page: '/buy', created_at: '2026-09-04T23:00:00Z', lead_tier: null, ...p })
const activity = (p: Partial<WorkActivity> = {}): WorkActivity => ({ contact_id: 'c', loan_id: null, type: 'system', action: null, occurred_at: asOf, created_at: asOf, ...p })
const build = (p: Partial<Parameters<typeof buildCommandCenter>[0]> = {}) => buildCommandCenter({ tasks: [], contacts: [], loans: [], activities: [], members, viewerId: 'lo', asOf, ...p })

describe('operational routing', () => {
  it('keeps an urgent routine team task away from Adam, including when overdue', () => {
    const item = build({ tasks: [task({ due_at: '2026-09-03T20:00:00Z' })] }).tasks[0]
    expect(item.loNeeded).toBe(false)
    expect(item.categories).toContain('Needs Team')
    expect(item.categories).toContain('Overdue')
  })
  it('retains team ownership while explicitly escalating a loan decision', () => {
    const item = build({ tasks: [task({ follow_up_reason: 'escalation:loan_structure' })] }).tasks[0]
    expect(item.ownerId).toBe('team')
    expect(item.loNeeded).toBe(true)
  })
  it('removes routine work from Adam after assignment to the team', () => {
    expect(build({ tasks: [task({ assigned_to: 'lo' })] }).tasks[0].loNeeded).toBe(true)
    expect(build({ tasks: [task({ assigned_to: 'team' })] }).tasks[0].loNeeded).toBe(false)
  })
  it('does not invent owners and suppresses completed, dismissed and snoozed work', () => {
    const output = build({ tasks: [task({ assigned_to: 'outside-org' }), task({ status: 'completed' }), task({ status: 'dismissed' }), task({ snoozed_until: '2026-10-01T00:00:00Z' })] })
    expect(output.tasks).toHaveLength(1)
    expect(output.tasks[0].owner).toBe('Unassigned')
  })
})
describe('evidence and exceptions', () => {
  it('does not count imports or recent machine timestamps as a contact attempt', () => {
    const output = build({ contacts: [contact()], activities: [activity()] })
    expect(output.leads[0].lastActivity).toBeNull()
    expect(output.leads[0].responseState).toBe('First response unverified')
    expect(output.leads[0].dueAt).toBeNull()
  })
  it('recognizes a recorded outbound attempt and leaves healthy loans quiet', () => {
    const output = build({ contacts: [contact()], loans: [loan()], activities: [activity({ type: 'email_outbound' })] })
    expect(output.leads[0].responseState).toBe('Attempt recorded')
    expect(output.exceptions).toHaveLength(0)
  })
  it('escalates an expired lock even when a file is clear to close', () => {
    const output = build({ loans: [loan({ status: 'CLEAR_TO_CLOSE', rate_lock_expiration: '2026-09-03' })] })
    expect(output.exceptions[0].loNeeded).toBe(true)
    expect(output.money.atRisk).toBe(5000)
    expect(output.money.expected).toBe(0)
  })
  it('uses Central calendar dates and mutually exclusive monthly forecast groups', () => {
    const output = build({ asOf: '2026-10-01T02:00:00Z', loans: [loan({ id: 'closed', status: 'Funded', funding_date: '2026-09-02', commission_amount: 1000 }), loan({ id: 'expected', status: 'CLEAR_TO_CLOSE', closing_date: '2026-09-30', commission_amount: 2000 }), loan({ id: 'probable', closing_date: '2026-09-30', commission_amount: 3000 }), loan({ id: 'next-month', closing_date: '2026-10-28', commission_amount: null })] })
    expect(output.money).toEqual({ closed: 1000, expected: 2000, probable: 0, atRisk: 3000, pipeline: 5000, missing: 1 })
  })
  it('does not escalate inactive files or silently treat invalid dates as real deadlines', () => {
    const output = build({ loans: [loan({ status: 'Denied', closing_date: '2026-01-01' }), loan({ closing_date: '2026-02-30' })] })
    expect(output.exceptions).toHaveLength(1)
    expect(output.exceptions[0].issue).toContain('Missing closing date')
    expect(output.exceptions[0].loNeeded).toBe(false)
  })
})
describe('complete reads and restricted changes', () => {
  it('reads beyond the default 1000-row limit and refuses partial results on failure', async () => {
    const rows = Array.from({ length: 1354 }, (_, id) => id)
    expect(await collectPages(async (from, to) => ({ data: rows.slice(from, to + 1), error: null }))).toEqual(rows)
    await expect(collectPages(async from => from ? { data: null, error: 'failure' } : { data: rows.slice(0, 500), error: null })).rejects.toThrow('unavailable')
  })
  it('rejects financial fields, tenant changes and arbitrary escalation text', () => {
    for (const body of [{ organization_id: 'other' }, { commission_amount: 1 }, { assigned_to: 'not-a-uuid' }, { follow_up_reason: 'send borrower approval' }, {}]) expect(() => parseRouting(body)).toThrow()
    expect(parseRouting({ follow_up_reason: 'waiting:borrower', assigned_to: null })).toEqual({ follow_up_reason: 'waiting:borrower', assigned_to: null })
  })
})
