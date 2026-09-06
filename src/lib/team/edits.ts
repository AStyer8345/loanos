import { SOURCES, STAGES } from '@/lib/operations/simple-desk'
import type { TeamRecord } from './types'
export function teamEdit(record: TeamRecord, value: unknown): Record<string,string|boolean> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid changes')
  const input = value as Record<string,unknown>
  const allowed = record.kind === 'lead'
    ? ['status','amount_note','product_note','reporting_source','referral_name','priority_follow_up']
    : record.kind === 'contact' ? ['first_name','last_name','email','phone','stage'] : []
  if (!Object.keys(input).length || Object.keys(input).some(k => !allowed.includes(k))) throw new Error('Only shared operational fields can be changed')
  const result: Record<string,string|boolean> = {}
  for (const [key,v] of Object.entries(input)) {
    if (key === 'priority_follow_up') {
      if (typeof v !== 'boolean') throw new Error('Invalid priority')
      result[key] = v
      continue
    }
    if (typeof v !== 'string' || v.length > 500) throw new Error('Invalid field value')
    if (['stage','status'].includes(key) && !(STAGES as readonly string[]).includes(v)) throw new Error('Invalid stage')
    if (key === 'reporting_source' && !(SOURCES as readonly string[]).includes(v)) throw new Error('Invalid source')
    if (key === 'amount_note' && v !== '' && (!/^\d+(\.\d{1,2})?$/.test(v) || Number(v) <= 0)) throw new Error('Enter a loan amount or leave blank for TBD')
    if (key === 'email' && v !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) throw new Error('Invalid email')
    if (record.ariveOwned && ['status','amount_note','product_note'].includes(key)) throw new Error('Loan facts come from ARIVE')
    result[key] = v
  }
  return result
}
