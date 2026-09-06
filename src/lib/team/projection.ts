import { deskRows, workingStage, reportingSource } from '@/lib/operations/simple-desk'
import type { Snapshot } from '@/lib/operations/types'
import { estimateCompensation, type TeamRecord } from './types'

/** Explicit output allowlist. Never spread source rows, raw payloads, notes, or compensation. */
export function teamRecords(snapshot: Snapshot, bps: number): TeamRecord[] {
  const leads: TeamRecord[] = deskRows(snapshot).filter(r => !r.hidden).map(r => ({
    id:r.id, kind:'lead', name:r.name, email:r.email, phone:r.phone, stage:r.stage,
    source:r.source, referral:r.referral, amount:r.amount, product:r.product,
    closingDate:null, priority:r.priority, ariveOwned:r.ariveOwned,
    ownCompensation:estimateCompensation(r.amount,bps),
  }))
  const contacts: TeamRecord[] = snapshot.contacts.map(c => ({
    id:c.id, kind:'contact', name:[c.first_name,c.last_name].filter(Boolean).join(' ') || 'Contact',
    email:c.email || '', phone:c.phone || '', stage:workingStage(c.stage),
    source:reportingSource(c.lead_source || ''), referral:'', amount:null, product:'',
    closingDate:null, priority:false, ariveOwned:false, ownCompensation:null,
  }))
  const loans: TeamRecord[] = snapshot.loans.map(l => ({
    id:l.id, kind:'loan', name:[l.borrower_first_name,l.borrower_last_name].filter(Boolean).join(' ') || 'Loan',
    email:snapshot.contacts.find(c => c.id===l.contact_id)?.email || '',
    phone:snapshot.contacts.find(c => c.id===l.contact_id)?.phone || '',
    stage:workingStage(l.status), source:'', referral:'', amount:l.loan_amount === null ? null : Number(l.loan_amount),
    product:l.loan_program || l.loan_type || '', closingDate:l.closing_date || l.estimated_closing_date,
    priority:false, ariveOwned:!!l.arive_loan_id, ownCompensation:estimateCompensation(l.loan_amount === null ? null : Number(l.loan_amount),bps),
  }))
  return [...leads,...loans,...contacts]
}
